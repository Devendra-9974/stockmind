"""
Stock Predictor — FastAPI Backend
Entry point: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from routers import predict, train, stocks, health

app = FastAPI(
    title="Stock Predictor API",
    description="Self-correcting LSTM stock price prediction",
    version="1.0.0",
)

# ── CORS (allow React dev server) ─────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(health.router,  tags=["health"])
app.include_router(stocks.router,  prefix="/api/stocks",  tags=["stocks"])
app.include_router(train.router,   prefix="/api/train",   tags=["train"])
app.include_router(predict.router, prefix="/api/predict", tags=["predict"])

# ── Serve saved chart images ──────────────────────────────────
os.makedirs("charts", exist_ok=True)
os.makedirs("models", exist_ok=True)
app.mount("/charts", StaticFiles(directory="charts"), name="charts")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
