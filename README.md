# StockMind 📈
### Self-Correcting LSTM Stock Price Predictor

A full-stack AI-powered stock prediction web app built with **FastAPI + React**.  
Fetches real market data from Yahoo Finance, trains a self-correcting LSTM neural network, and forecasts future prices with interactive charts.

🔗 **Live Demo:** [https://stockmind-iota.vercel.app](https://stockmind-iota.vercel.app)  
🔗 **Backend API:** [https://stockmind-8cx5.onrender.com](https://stockmind-8cx5.onrender.com)

---

## Features

- 📡 **Real-time stock data** via Yahoo Finance API (no API key needed)
- 🧠 **Self-correcting LSTM model** — learns from its own prediction errors
- 📊 **16 technical indicators** — RSI, MACD, Bollinger Bands, Moving Averages, and more
- 🔴 **Live training console** — watch loss curves update in real time via SSE streaming
- 🔮 **Multi-day forecast** — predict up to 60 days into the future
- 💾 **Model persistence** — save and reload trained models
- 🌙 **Dark terminal UI** — built with React + Tailwind CSS + Recharts

---

## Tech Stack

### Backend
| Tool | Purpose |
|------|---------|
| FastAPI | REST API framework |
| NumPy / TensorFlow | ML model (NumPy fallback if TF unavailable) |
| yfinance | Yahoo Finance data |
| pandas | Data processing |
| scikit-learn | Feature scaling |
| Server-Sent Events | Live training progress streaming |

### Frontend
| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| Recharts | Charts and visualizations |
| Axios | API calls |
| React Router | Navigation |

---

## Project Structure

```
stock-predictor/
├── backend/
│   ├── main.py                  ← FastAPI entry point
│   ├── requirements.txt         ← Python dependencies
│   ├── Dockerfile               ← Docker config for Render
│   ├── models/
│   │   └── schemas.py           ← Pydantic request/response models
│   ├── routers/
│   │   ├── health.py            ← GET /health
│   │   ├── stocks.py            ← Stock quotes, history, info
│   │   ├── train.py             ← Model training + SSE streaming
│   │   └── predict.py           ← Forecast generation
│   └── services/
│       └── predictor.py         ← Core LSTM + self-correction logic
│
├── frontend/
│   ├── src/
│   │   ├── api/client.js        ← Axios API client
│   │   ├── components/
│   │   │   ├── Card.jsx         ← Reusable UI components
│   │   │   ├── PriceChart.jsx   ← Price + forecast chart
│   │   │   ├── LossChart.jsx    ← Training loss curve
│   │   │   ├── ForecastTable.jsx← Day-by-day forecast table
│   │   │   ├── TickerSearch.jsx ← Autocomplete ticker input
│   │   │   └── TrainingConsole.jsx ← Live SSE log
│   │   └── pages/
│   │       ├── Dashboard.jsx    ← Market overview
│   │       ├── TrainPage.jsx    ← Training UI
│   │       ├── PredictPage.jsx  ← Prediction + charts
│   │       └── ModelsPage.jsx   ← Saved models library
│   └── vercel.json              ← Vercel deployment config
│
├── render.yaml                  ← Render deployment config
└── README.md
```

---

## Local Development

### Prerequisites
- Python 3.11 — [Download](https://python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe)
- Node.js 18+ — [Download](https://nodejs.org)
- Git — [Download](https://git-scm.com)

### Backend Setup

```bash
cd backend

# Create virtual environment
py -3.11 -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
python -m pip install -r requirements.txt

# Start backend
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Backend runs at: http://localhost:8000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

Frontend runs at: http://localhost:3000

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
GET /api/stocks/history/{ticker}
GET /api/stocks/info/{ticker}
GET /api/stocks/popular
GET /api/stocks/models
```

### Train
```
POST /api/train/start
Body: { ticker, period, epochs, seq_len, retrain }
→ { job_id, ticker }

GET /api/train/stream/{job_id}   ← SSE stream
Events: epoch | status | done | error
```

### Predict
```
POST /api/predict/forecast
Body: { ticker, forecast_days, period }
→ { forecast: [{date, price, change_pct}], metrics }

GET /api/predict/history/{ticker}
→ { dates, actual, predicted, metrics }
```

---

## How the Self-Correction Works

```
1. Initial Training   → LSTM trains on 85% of data
2. Validation         → Model predicts on remaining 15%
3. Error Measurement  → Calculates residual per sample
4. Sample Weighting   → Bigger mistake = higher weight
5. Correction Pass    → Fine-tunes on weighted samples
6. Result             → Model focuses on its worst mistakes
```

---

## Train Models Locally & Deploy

Train on your PC then commit to GitHub so models are available on the live site:

```python
# Run inside backend/ with venv activated
python -c "
from services.predictor import SelfCorrectingPredictor

tickers = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'NVDA']
for ticker in tickers:
    print(f'Training {ticker}...')
    try:
        p = SelfCorrectingPredictor(ticker)
        p.fetch_and_prepare('2y')
        p.train(epochs=50)
        p.save()
        print(f'{ticker} saved!')
    except Exception as e:
        print(f'{ticker} failed: {e}')
"
```

```bash
git add backend/models/
git commit -m "Add pre-trained models"
git push
```

---

## Deployment

### Backend — Render (Docker)
1. Connect GitHub repo to [render.com](https://render.com)
2. New Web Service → **Docker** runtime
3. Dockerfile path: `./backend/Dockerfile`
4. Env var: `ALLOWED_ORIGINS = https://your-vercel-app.vercel.app`

### Frontend — Vercel
1. Connect GitHub repo to [vercel.com](https://vercel.com)
2. Root directory: `frontend`
3. Env var: `VITE_API_URL = https://your-render-url.onrender.com`
4. Deploy

---

## Model Input Features (16 total)

| Feature | Description |
|---------|-------------|
| Close, Open, High, Low | OHLC prices |
| Volume | Trading volume |
| MA_7, MA_21, MA_50 | Moving averages |
| RSI | Relative Strength Index |
| MACD, MACD_signal | Momentum indicators |
| BB_width | Bollinger Band width |
| ROC_5, ROC_10 | Rate of change |
| Volatility | Rolling std deviation |
| Vol_change | Volume % change |

---

## Tips for Best Predictions

- Use **2y period** for more training data
- **50-80 epochs** gives a good balance of speed vs accuracy
- MAPE below **3%** means the model is performing well
- Retrain weekly to incorporate fresh market data

---

## Known Limitations

- Yahoo Finance occasionally rate-limits — wait 30s and retry
- Render free tier sleeps after 15 mins inactivity — first request may be slow
- TensorFlow not available on Render free tier (512MB RAM) — NumPy fallback used
- Stock predictions are for educational purposes only

---

## Disclaimer

⚠️ This project is for **educational purposes only**.  
Do not use model predictions for real financial decisions.  
Past performance does not guarantee future results.

---

## License

MIT — free to use, modify, and distribute.
