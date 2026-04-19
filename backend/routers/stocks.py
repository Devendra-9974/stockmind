from fastapi import APIRouter, HTTPException
import yfinance as yf
import pandas as pd
from services.predictor import fetch_stock_info
import os, json

router = APIRouter()

POPULAR = ["AAPL", "TSLA", "MSFT", "GOOGL", "AMZN", "NVDA",
           "META", "NFLX", "BABA", "AMD", "INTC", "ORCL"]


@router.get("/quote/{ticker}")
def get_quote(ticker: str):
    ticker = ticker.upper()
    try:
        t  = yf.Ticker(ticker)
        hx = t.history(period="5d")
        if hx.empty:
            raise HTTPException(404, f"Ticker {ticker} not found")
        last_close = float(hx["Close"].iloc[-1])
        prev_close = float(hx["Close"].iloc[-2]) if len(hx) > 1 else last_close
        chg        = last_close - prev_close
        chg_pct    = (chg / prev_close) * 100 if prev_close else 0
        vol        = int(hx["Volume"].iloc[-1])
        return {
            "ticker": ticker,
            "price":  round(last_close, 4),
            "change": round(chg, 4),
            "change_pct": round(chg_pct, 4),
            "volume": vol,
            "high":   round(float(hx["High"].iloc[-1]), 4),
            "low":    round(float(hx["Low"].iloc[-1]),  4),
            "open":   round(float(hx["Open"].iloc[-1]), 4),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/history/{ticker}")
def get_history(ticker: str, period: str = "6mo", interval: str = "1d"):
    ticker = ticker.upper()
    try:
        t  = yf.Ticker(ticker)
        hx = t.history(period=period, interval=interval)
        if hx.empty:
            raise HTTPException(404, f"No history for {ticker}")
        hx.index = pd.to_datetime(hx.index)
        return {
            "ticker": ticker,
            "dates":  [str(d.date()) for d in hx.index],
            "open":   [round(float(v), 4) for v in hx["Open"]],
            "high":   [round(float(v), 4) for v in hx["High"]],
            "low":    [round(float(v), 4) for v in hx["Low"]],
            "close":  [round(float(v), 4) for v in hx["Close"]],
            "volume": [int(v) for v in hx["Volume"]],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/info/{ticker}")
def get_info(ticker: str):
    return fetch_stock_info(ticker.upper())


@router.get("/popular")
def popular_quotes():
    results = []
    for tk in POPULAR:
        try:
            t  = yf.Ticker(tk)
            hx = t.history(period="2d")
            if hx.empty:
                continue
            price    = float(hx["Close"].iloc[-1])
            prev     = float(hx["Close"].iloc[-2]) if len(hx) > 1 else price
            chg_pct  = (price - prev) / prev * 100
            results.append({
                "ticker": tk,
                "price": round(price, 2),
                "change_pct": round(chg_pct, 2)
            })
        except Exception:
            continue
    return results


@router.get("/models")
def list_models():
    """Return all tickers that have a saved model."""
    model_dir = "models"
    if not os.path.exists(model_dir):
        return []
    result = []
    for f in os.listdir(model_dir):
        if f.endswith("_meta.json"):
            ticker = f.replace("_meta.json", "")
            with open(os.path.join(model_dir, f)) as fh:
                meta = json.load(fh)
            result.append({
                "ticker": ticker,
                "saved_at": meta.get("saved_at"),
                "epochs_trained": len(meta.get("train_loss", []))
            })
    return result
