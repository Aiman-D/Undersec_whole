from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
import numpy as np
from model_store import ModelStore
from scorer import derive_features_full, evaluate_rules, rule_floor, rule_points, context_points

router = APIRouter()

class ScorePayload(BaseModel):
    tenant_id: str
    user_id: str
    window_start_ts: int | None = None
    window_end_ts: int | None = None
    label: str
    features: Dict[str, Any]
    policy_id: str
    client_version: str | None = None

@router.post("/score")
def score(payload: ScorePayload):
    f = payload.features
    d = derive_features_full(f)

    # ML score
    ml_points = 0
    ml_severity = 0.0
    
    if ModelStore.model is not None and ModelStore.feature_keys:
        try:
            x = np.array([[d[k] for k in ModelStore.feature_keys]], dtype=float)
            s = ModelStore.model.decision_function(x)[0]
            print("ML Score (raw):", s)
            denom = (ModelStore.p20 - ModelStore.p01) or 1e-9
            ml_severity = (ModelStore.p20 - s) / denom
            ml_severity = float(max(0.0, min(1.0, ml_severity)))
            ml_points = int(round(30 * ml_severity))
            print("ML Severity:", ml_severity)
            print("ML Points:", ml_points)
        except Exception as e:
            print(f"ML Scoring Error: {e}")
    else:
        print("Warning: ML model not loaded, skipping ML scoring.")

    # Rules + combine
    base = rule_points(f, d) + context_points(f) + ml_points
    reasons = evaluate_rules(payload.label, f, d, base)
    floor = rule_floor(reasons)

    final = max(floor, base)
    final = min(100, max(0, final))

    # CRITICAL gate (optional but recommended)
    if floor == 0 and final >= 80:
        final = 79

    if final >= 80:
        level, action = "CRITICAL", "block_simulated"
    elif final >= 60:
        level, action = "HIGH", "ack_required"
    elif final >= 30:
        level, action = "MEDIUM", "warn"
    else:
        level, action = "LOW", "none"

    resp = {
        "risk_score": final / 100.0,
        "risk_level": level,
        "recommended_action": action,
        "reasons": [r.__dict__ for r in reasons],
        "ml_score": ml_severity,
        "ml_points": ml_points,
        "model_version_hash": "iforest_v1",
        "policy_id": payload.policy_id
    }

    # TODO: persist resp + payload to DB here
    return resp

@router.post("/ingest")
def ingest(payload: Dict[str, Any]):
    # Dummy endpoint to swallow ingestion requests
    # In production, this would save the decision feedback to a DB
    print(f"Ingested feedback for user {payload.get('window', {}).get('user_id')}")
    return {"status": "success"}