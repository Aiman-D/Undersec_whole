import numpy as np
from dataclasses import dataclass
from typing import Dict, List
from sklearn.ensemble import IsolationForest
import joblib 

WINDOW_MINUTES = 5
T_UNKNOWN_ABS = 6
T_BURST = 10
BASELINE_N = 50


@dataclass
class Reason:
    code: str
    severity: str
    message: str



def derive_features(f: Dict) -> Dict:
    total_domains = (
        f["unknown_domain_count"]
        + f.get("approved_work_domain_count", 0)
        + f.get("risky_domain_visit_count", 0)
    )

    total_events = (
        f["public_ai_paste_count"]
        + f["personal_cloud_upload_attempt_count"]
        + f["unknown_domain_count"]
        + f.get("approved_work_domain_count", 0)
        + f.get("risky_domain_visit_count", 0)
    )

    return {
        "paste_rate": f["public_ai_paste_count"] / WINDOW_MINUTES,
        "upload_rate": f["personal_cloud_upload_attempt_count"] / WINDOW_MINUTES,
        "unknown_ratio": f["unknown_domain_count"] / max(1, total_domains),
        "activity_burst": total_events,
    }
def derive_features_full(f: Dict) -> Dict:
    d = derive_features(f)  # your existing 4 derived features

    # Add raw counts + flags so the vector matches training
    d.update({
        "public_ai_paste_count": f["public_ai_paste_count"],
        "personal_cloud_upload_attempt_count": f["personal_cloud_upload_attempt_count"],
        "unknown_domain_count": f["unknown_domain_count"],
        "approved_work_domain_count": f.get("approved_work_domain_count", 0),
        "risky_domain_visit_count": f.get("risky_domain_visit_count", 0),
        "off_hours_flag": f.get("off_hours_flag", 0),
        "new_device_flag": f.get("new_device_flag", 0),
        "new_geo_flag": f.get("new_geo_flag", 0),
    })
    return d




def evaluate_rules(label: str, f: Dict, d: Dict, risk_hint: int) -> List[Reason]:
    r = []

    # ---- High severity (policy violations)
    if label == "confidential" and f["public_ai_paste_count"] > 0:
        r.append(Reason("R1_CONFIDENTIAL_PUBLIC_AI", "high",
                        "Confidential label + paste attempt on a public AI tool."))

    if label == "confidential" and f["personal_cloud_upload_attempt_count"] > 0:
        r.append(Reason("R2_CONFIDENTIAL_PERSONAL_CLOUD_UPLOAD", "high",
                        "Confidential label + upload attempt to personal cloud."))

    if label == "confidential" and f.get("risky_domain_visit_count", 0) > 0:
        r.append(Reason("R3_CONFIDENTIAL_RISKY_DESTINATION", "high",
                        "Confidential work interacting with risky destinations."))

    # ---- Medium severity
    if label == "internal" and f["public_ai_paste_count"] > 0:
        r.append(Reason("R4_INTERNAL_PUBLIC_AI", "medium",
                        "Internal label + paste attempt on public AI."))

    if label == "internal" and f["personal_cloud_upload_attempt_count"] > 0:
        r.append(Reason("R5_INTERNAL_PERSONAL_CLOUD_UPLOAD", "medium",
                        "Internal label + upload attempt to personal cloud."))

    if d["unknown_ratio"] >= 0.5 or f["unknown_domain_count"] >= T_UNKNOWN_ABS:
        r.append(Reason("R6_UNKNOWN_DESTINATIONS_SPIKE", "medium",
                        "High activity to unrecognized destinations."))

    if f.get("risky_domain_visit_count", 0) > 0:
        r.append(Reason("R7_RISKY_DESTINATIONS_PRESENT", "medium",
                        "Known risky destinations detected."))

    # ---- Contextual
    if f.get("off_hours_flag") == 1 and d["activity_burst"] >= T_BURST:
        r.append(Reason("R8_OFF_HOURS_ACTIVITY", "medium",
                        "Unusual activity during off-hours."))

    if f.get("new_device_flag") == 1 and risk_hint >= 60:
        r.append(Reason("R9_NEW_DEVICE_CONTEXT", "medium",
                        "Activity from a new device."))

    if f.get("new_geo_flag") == 1 and risk_hint >= 60:
        r.append(Reason("R10_NEW_GEO_CONTEXT", "medium",
                        "Activity from a new location."))

    return r


# =====================================================
# ISOLATION FOREST (MVP SAFE)
# =====================================================
import json, joblib
import numpy as np

class IFScorer:
    def __init__(self, model_path="isolation_forest_afterlogin_guard_v1.joblib", keys_path="iforest_feature_keys.json", meta_path="iforest_meta.json"):
        self.model = joblib.load(model_path)
        with open(keys_path) as f:
            self.FEATURE_KEYS = json.load(f)["feature_keys"]
        with open(meta_path) as f:
            meta = json.load(f)
        self.p01 = meta["p01"]
        self.p20 = meta["p20"]
        # print("Loaded model:", type(self.model))
        # print("Model expects n_features:", getattr(self.model, "n_features_in_", None))
        # print("FEATURE_KEYS length:", len(self.FEATURE_KEYS))
#the above 3 lines are simplyb for debugging 

    def score(self, feature_dict: Dict) -> float:
        x = np.array([[feature_dict[k] for k in self.FEATURE_KEYS]], dtype=float)
        s = self.model.decision_function(x)[0]  # higher normal, lower anomalous

        denom = (self.p20 - self.p01) if (self.p20 - self.p01) != 0 else 1e-9
        severity = (self.p20 - s) / denom
        severity = max(0.0, min(1.0, severity))
        print("ML Severity:", severity)
        return severity

# =====================================================
# SCORING LOGIC
# =====================================================
def rule_floor(reasons: List[Reason]) -> int:
    codes = {r.code for r in reasons}

    if "R2_CONFIDENTIAL_PERSONAL_CLOUD_UPLOAD" in codes:
        return 95
    if "R1_CONFIDENTIAL_PUBLIC_AI" in codes:
        return 90
    if "R3_CONFIDENTIAL_RISKY_DESTINATION" in codes:
        return 85
    if "R5_INTERNAL_PERSONAL_CLOUD_UPLOAD" in codes:
        return 75
    if "R4_INTERNAL_PUBLIC_AI" in codes:
        return 70
    return 0


def rule_points(f: Dict, d: Dict) -> int:
    pts = 0
    if f["personal_cloud_upload_attempt_count"] > 0:
        pts += 50
    if f["public_ai_paste_count"] > 0:
        pts += 15
    if f.get("risky_domain_visit_count", 0) > 0:
        pts += 10
    # Unknown domain points (0–35)
    u = f["unknown_domain_count"]
    if u <= 6:
        pts += 3 * u              # 0..18
    elif u <= 15:
        pts += 18 + 2 * (u - 6)   # up to 36
    else:
        pts += 36 + 1 * (u - 15)  # keeps increasing slowly
    pts = min(pts, 45)

    if d["unknown_ratio"] >= 0.5:
        pts += 10
    print("Rule Points:", pts)
    return pts


def context_points(f: Dict) -> int:
    pts = 0
    if f.get("off_hours_flag") == 1:
        pts += 5
    if f.get("new_device_flag") == 1 or f.get("new_geo_flag") == 1:
        pts += 5
    return pts


# =====================================================
# MAIN SCORER
# =====================================================
def score_window(payload: Dict, scorer: IFScorer) -> Dict:
    f = payload["features"]
    label = payload["label"]

    d = derive_features_full(f)

    # ml_vector = [
    #     d["paste_rate"],
    #     d["upload_rate"],
    #     d["unknown_ratio"],
    #     d["activity_burst"],
    # ]

    # ml_score = model.score(ml_vector)
    # ml_points = round(30 * ml_score)
    d = derive_features_full(f)
    ml_score = scorer.score(d)
    ml_points = round(30 * ml_score)

    base_score = rule_points(f, d) + context_points(f) + ml_points

    reasons = evaluate_rules(label, f, d, base_score)
    final_score = max(rule_floor(reasons), base_score)
    final_score = min(100, max(0, final_score))
    print("Final Score:", final_score)
    if final_score >= 80:
        level, action = "CRITICAL", "block_simulated"
    elif final_score >= 60:
        level, action = "HIGH", "ack_required"
    elif final_score >= 30:
        level, action = "MEDIUM", "warn"
    else:
        level, action = "LOW", "none"

    return {
        "risk_score": final_score / 100.0,
        "ml_score": ml_score,
        "ml_points":ml_points,
        "risk_level": level,
        "recommended_action": action,
        "reasons": [r.__dict__ for r in reasons],
        "model_version_hash": "iforest_v1",
        "policy_id": payload["policy_id"]
    }


# =====================================================
# CLEAN TEST CASE
# =====================================================
if __name__ == "__main__":
    payload = {
        "tenant_id": "demo",
        "user_id": "u101",
        "label": "public",
        "features": {
            "public_ai_paste_count": 0,
            "personal_cloud_upload_attempt_count": 0,
            "unknown_domain_count": 30,
            "approved_work_domain_count": 1,
            "risky_domain_visit_count": 8,
            "off_hours_flag": 1,
            "new_device_flag": 1,
            "new_geo_flag": 0
        },
        "policy_id": "policy_v1"
    }

    scorer = IFScorer()
    result = score_window(payload, scorer)

    print("\n=== TRUSTOS RISK EVALUATION ===")
    print(f"User       : {payload['user_id']}")
    print(f"Label      : {payload['label']}")
    print(f"Score      : {result['risk_score']}")
    print(f"Level      : {result['risk_level']}")
    print(f"Action     : {result['recommended_action']}")
    print(f"ml_points      : {result['ml_points']}")
    print(f"ml_score      : {result['ml_score']}")
    print("Reasons:")
    for r in result["reasons"]:
        print(f" - [{r['severity'].upper()}] {r['code']}: {r['message']}")
