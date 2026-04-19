"""
Stock Predictor — FastAPI Backend (Production Ready)
"""
import sys
import os

# Fix import paths for deployment
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routers import predict, train, stocks, health

app = FastAPI(
    title="Stock Predictor API",
    description="Self-correcting LSTM stock price prediction",
    version="1.0.0",
)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,  tags=["health"])
app.include_router(stocks.router,  prefix="/api/stocks",  tags=["stocks"])
app.include_router(train.router,   prefix="/api/train",   tags=["train"])
app.include_router(predict.router, prefix="/api/predict", tags=["predict"])

os.makedirs("charts", exist_ok=True)
os.makedirs("models", exist_ok=True)
app.mount("/charts", StaticFiles(directory="charts"), name="charts")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)