import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import APIRouter, HTTPException
from models.schemas import PredictRequest
from services.predictor import SelfCorrectingPredictor
router = APIRouter()


@router.post("/forecast")
def forecast(req: PredictRequest):
    p = SelfCorrectingPredictor(req.ticker)
    if not p.model_exists():
        raise HTTPException(
            400,
            f"No trained model for {req.ticker}. "
            "Call POST /api/train/start first."
        )
    p.load()
    p.fetch_and_prepare(req.period)
    forecast  = p.predict_next_n(req.forecast_days)
    metrics   = p.evaluate()
    return {
        "ticker":   req.ticker,
        "forecast": forecast,
        "metrics": {k: metrics[k] for k in ["mae","rmse","mape","accuracy"]},
    }


@router.get("/history/{ticker}")
def history_with_predictions(ticker: str, period: str = "1y"):
    ticker = ticker.upper()
    p = SelfCorrectingPredictor(ticker)
    if not p.model_exists():
        raise HTTPException(400, f"No trained model for {ticker}")
    p.load()
    p.fetch_and_prepare(period)
    metrics = p.evaluate()
    return {
        "ticker": ticker,
        "dates":     metrics["dates"],
        "actual":    metrics["actual"],
        "predicted": metrics["predicted"],
        "metrics": {k: metrics[k] for k in ["mae","rmse","mape","accuracy"]},
    }
