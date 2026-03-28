from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np

app = FastAPI(title="NeuraShield Backend API")

# Allow the React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load AI Models securely
try:
    flood_india_model = joblib.load("flood_model.pkl")
    earthquake_model = joblib.load("earthquake_model.pkl")
    flood_global_model = joblib.load("flood_v2_model.pkl")
except Exception as e:
    print(f"Server Warning: Missing model! Did you run all 3 training scripts? Error: {e}")

# ---------- DATA MODELS ---------- #
class IndiaFloodInput(BaseModel):
    jan: float
    feb: float
    mar: float
    apr: float
    may: float
    jun: float
    jul: float
    aug: float
    sep: float

class EarthquakeInput(BaseModel):
    latitude: float
    longitude: float
    depth: float

class GlobalFloodInput(BaseModel):
    annual_precipitation: float
    wettest_month_precip: float
    drainage_area: float
    annual_mean_temp: float

# ---------- ENDPOINTS ---------- #
@app.get("/")
def read_root():
    return {"message": "NeuraShield API is Live!"}

@app.post("/api/predict/flood_india")
def predict_flood_india(data: IndiaFloodInput):
    # Model expects 9 features: JAN, FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP
    features = np.array([[data.jan, data.feb, data.mar, data.apr, data.may, data.jun, data.jul, data.aug, data.sep]])
    prediction = flood_india_model.predict(features)[0]
    return {"risk_level": "High Risk" if prediction == 1 else "Low Risk"}

@app.post("/api/predict/earthquake")
def predict_earthquake(data: EarthquakeInput):
    features = np.array([[data.latitude, data.longitude, data.depth]])
    prediction = earthquake_model.predict(features)[0]
    return {"risk_level": "High Risk" if prediction == 1 else "Low Risk"}

@app.post("/api/predict/flood_global")
def predict_flood_global(data: GlobalFloodInput):
    features = np.array([[data.annual_precipitation, data.wettest_month_precip, data.drainage_area, data.annual_mean_temp]])
    prediction = flood_global_model.predict(features)[0]
    return {"risk_level": "High Risk" if prediction == 1 else "Low Risk"}
