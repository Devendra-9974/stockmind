# StockMind — Self-Correcting LSTM Stock Predictor

A full-stack stock price prediction app using a self-correcting LSTM neural network,
Yahoo Finance data, FastAPI backend, and React frontend.

---

## Project Structure

```
stock-predictor/
├── backend/
│   ├── main.py                  ← FastAPI app entry point
│   ├── requirements.txt
│   ├── models/
│   │   └── schemas.py           ← Pydantic request/response models
│   ├── routers/
│   │   ├── health.py            ← GET /health
│   │   ├── stocks.py            ← GET /api/stocks/quote/:ticker, /history, /info, /popular
│   │   ├── train.py             ← POST /api/train/start + SSE stream
│   │   └── predict.py           ← POST /api/predict/forecast
│   └── services/
│       └── predictor.py         ← Core LSTM model + self-correction logic
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx              ← Router + nav
│       ├── api/client.js        ← Axios + SSE helpers
│       ├── components/
│       │   ├── Card.jsx         ← Card, Metric, Badge, Spinner
│       │   ├── PriceChart.jsx   ← Recharts price + forecast chart
│       │   ├── LossChart.jsx    ← Training loss curve
│       │   ├── ForecastTable.jsx← Forecast day-by-day table
│       │   ├── TickerSearch.jsx ← Autocomplete ticker input
│       │   └── TrainingConsole.jsx ← Live SSE log
│       └── pages/
│           ├── Dashboard.jsx    ← Market overview + saved models
│           ├── TrainPage.jsx    ← Full training UI
│           ├── PredictPage.jsx  ← Chart + forecast view
│           └── ModelsPage.jsx   ← Model library + architecture
│
├── setup.sh    ← One-click setup (macOS/Linux)
├── setup.bat   ← One-click setup (Windows)
└── README.md
```

---

## Prerequisites

| Tool      | Version  | Install |
|-----------|----------|---------|
| Python    | 3.10+    | https://python.org |
| Node.js   | 18+      | https://nodejs.org |
| npm       | 9+       | bundled with Node  |

---

## Setup (macOS / Linux)

```bash
# 1. Clone or unzip the project
cd stock-predictor

# 2. Run the one-click setup
bash setup.sh

# 3. Start the backend (Terminal 1)
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# 4. Start the frontend (Terminal 2)
cd frontend
npm run dev

# 5. Open browser
open http://localhost:3000
```

## Setup (Windows)

```bat
REM Double-click setup.bat, then:

REM Terminal 1 — Backend
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000

REM Terminal 2 — Frontend
cd frontend
npm run dev
```

Then open http://localhost:3000

---

## Manual Setup (if the script fails)

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
mkdir -p models charts
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## API Reference

### Health
```
GET /health
→ { status, tensorflow, time }
```

### Stocks
```
GET /api/stocks/quote/{ticker}
GET /api/stocks/history/{ticker}?period=6mo
GET /api/stocks/info/{ticker}
GET /api/stocks/popular
GET /api/stocks/models
```

### Train
```
POST /api/train/start
Body: { ticker, period, epochs, seq_len, retrain }
→ { job_id, ticker }

GET /api/train/stream/{job_id}      ← SSE stream
Events: epoch | status | done | error

GET /api/train/status/{job_id}
→ { done, result, error }
```

### Predict
```
POST /api/predict/forecast
Body: { ticker, forecast_days, period }
→ { forecast: [{date, price, change_pct}], metrics }

GET /api/predict/history/{ticker}?period=1y
→ { dates, actual, predicted, metrics }
```

---

## How the Self-Correction Works

1. **Initial training** — Standard LSTM training with early stopping and learning rate decay.
2. **Error measurement** — After training, the model predicts on the validation set.
3. **Sample weighting** — Each sample receives a weight proportional to its prediction error.
   Samples the model got badly wrong get higher weight.
4. **Correction pass** — The model is fine-tuned on the validation set with these weights,
   forcing it to focus more gradient steps on its mistakes.
5. **On retrain** — The entire process repeats with fresh market data, continuously adapting.

---

## Features

- Real Yahoo Finance data via `yfinance`
- 16 input features: OHLCV + MA7/21/50, RSI, Bollinger Bands, MACD, ROC, Volatility
- 3-layer stacked LSTM with Dropout
- Huber loss (robust to outliers)
- Self-correcting error-weighted fine-tuning
- Live training progress via Server-Sent Events (SSE)
- Persistent model save/load
- React dashboard with interactive Recharts visualizations
- Dark terminal aesthetic UI

---

## Troubleshooting

**TensorFlow install fails on Apple Silicon (M1/M2/M3)**
```bash
pip install tensorflow-macos tensorflow-metal
```

**TensorFlow install fails on CPU-only machine**
```bash
pip install tensorflow-cpu
```

**Port 8000 already in use**
```bash
uvicorn main:app --reload --port 8001
# Update frontend/vite.config.js proxy target to :8001
```

**yfinance rate limited**
Yahoo Finance occasionally throttles requests. Wait 30 seconds and retry.

---

## Disclaimer

This project is for educational purposes only. Do not use model predictions
for real financial decisions. Past performance does not guarantee future results.
