from pydantic import BaseModel
from typing import Optional

class TrainRequest(BaseModel):
    ticker: str
    period: str = "2y"
    epochs: int = 50
    seq_len: int = 60
    retrain: bool = False

class PredictRequest(BaseModel):
    ticker: str
    forecast_days: int = 10
    period: str = "2y"

class ForecastPoint(BaseModel):
    date: str
    price: float
    change_pct: float

class MetricsOut(BaseModel):
    mae: float
    rmse: float
    mape: float
    accuracy: float