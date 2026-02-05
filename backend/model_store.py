import joblib, json

class ModelStore:
    model = None
    feature_keys = []
    p01 = 0
    p20 = 1

    @classmethod
    def load(cls, model_path, keys_path, meta_path):
        cls.model = joblib.load(model_path)
        with open(keys_path) as f:
            cls.feature_keys = json.load(f)["feature_keys"]
        with open(meta_path) as f:
            meta = json.load(f)
        cls.p01 = meta["p01"]
        cls.p20 = meta["p20"]
