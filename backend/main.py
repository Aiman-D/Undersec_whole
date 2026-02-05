from fastapi.middleware.cors import CORSMiddleware
import os
import sys
from fastapi import FastAPI
# Ensure backend modules can be imported when running from root
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from model_store import ModelStore
from routes import router

app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"], # Allow all for local dev convenience
  allow_credentials=False,
  allow_methods=["*"],
  allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    print("Starting UnderSec Backend...")
    try:
        # Resolve absolute paths relative to this file
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(base_dir, "isolation_forest_afterlogin_guard_v1.joblib")
        keys_path = os.path.join(base_dir, "iforest_feature_keys.json")
        meta_path = os.path.join(base_dir, "iforest_meta.json")

        if os.path.exists(model_path):
            ModelStore.load(
                model_path=model_path,
                keys_path=keys_path,
                meta_path=meta_path
            )
            print("ML Model loaded successfully.")
        else:
            print(f"Warning: ML model files not found at {model_path}. Running in rules-only mode.")
    except Exception as e:
        print(f"Error loading model: {e}")

app.include_router(router)
