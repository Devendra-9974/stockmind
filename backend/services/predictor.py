"""
services/predictor.py  —  Self-correcting LSTM stock predictor
"""
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
import os, json, warnings
from datetime import datetime, timedelta
from typing import Optional

warnings.filterwarnings("ignore")

TF_AVAILABLE = False
try:
    import tensorflow as tf
    try:
        from tensorflow.keras.models import Sequential, load_model
        from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
        from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
        from tensorflow.keras.optimizers import Adam
    except Exception:
        from keras.models import Sequential, load_model
        from keras.layers import LSTM, Dense, Dropout, Input
        from keras.callbacks import EarlyStopping, ReduceLROnPlateau
        from keras.optimizers import Adam
    TF_AVAILABLE = True
    print(f"[predictor] TensorFlow {tf.__version__} loaded OK")
except ImportError:
    print("[predictor] TensorFlow not found — NumPy fallback active")

FEATURE_COLS = [
    "Close", "Open", "High", "Low", "Volume",
    "MA_7", "MA_21", "MA_50", "ROC_5", "ROC_10",
    "RSI", "BB_width", "MACD", "MACD_signal",
    "Volatility", "Vol_change"
]


# ── Data helpers ──────────────────────────────────────────────

def fetch_stock_data(ticker: str, period: str = "2y") -> pd.DataFrame:
    import time

    # Fix for Yahoo Finance blocking Indian ISPs
    yf.utils.get_json = lambda url, proxy=None: {}

    session = None
    try:
        from curl_cffi import requests as curl_requests
        session = curl_requests.Session(impersonate="chrome")
    except Exception:
        pass

    last_error = None
    for attempt in range(3):
        try:
            if attempt > 0:
                time.sleep(3)
            if session:
                stock = yf.Ticker(ticker, session=session)
            else:
                stock = yf.Ticker(ticker)
            df = stock.history(period=period)
            if not df.empty:
                df.index = pd.to_datetime(df.index)
                df = df[["Open", "High", "Low", "Close", "Volume"]].dropna()
                return df
        except Exception as e:
            last_error = e
            continue

    raise ValueError(
        f"Could not fetch data for '{ticker}'. "
        f"Try using a VPN or different network. ({last_error})"
    )


def fetch_stock_info(ticker: str) -> dict:
    try:
        t = yf.Ticker(ticker)
        info = t.info
        return {
            "name":       info.get("longName", ticker),
            "sector":     info.get("sector", "N/A"),
            "industry":   info.get("industry", "N/A"),
            "market_cap": info.get("marketCap"),
            "pe_ratio":   info.get("trailingPE"),
            "52w_high":   info.get("fiftyTwoWeekHigh"),
            "52w_low":    info.get("fiftyTwoWeekLow"),
            "avg_volume": info.get("averageVolume"),
            "website":    info.get("website", ""),
        }
    except Exception:
        return {"name": ticker}


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    c = df["Close"]
    df["MA_7"]  = c.rolling(7).mean()
    df["MA_21"] = c.rolling(21).mean()
    df["MA_50"] = c.rolling(50).mean()
    df["ROC_5"]  = c.pct_change(5)
    df["ROC_10"] = c.pct_change(10)
    delta = c.diff()
    gain  = delta.clip(lower=0).rolling(14).mean()
    loss  = (-delta.clip(upper=0)).rolling(14).mean()
    df["RSI"] = 100 - (100 / (1 + gain / (loss + 1e-9)))
    sma20 = c.rolling(20).mean()
    std20 = c.rolling(20).std()
    df["BB_upper"] = sma20 + 2 * std20
    df["BB_lower"] = sma20 - 2 * std20
    df["BB_width"] = (df["BB_upper"] - df["BB_lower"]) / (sma20 + 1e-9)
    ema12 = c.ewm(span=12, adjust=False).mean()
    ema26 = c.ewm(span=26, adjust=False).mean()
    df["MACD"]        = ema12 - ema26
    df["MACD_signal"] = df["MACD"].ewm(span=9, adjust=False).mean()
    df["Volatility"]  = c.rolling(10).std()
    df["Vol_change"]  = df["Volume"].pct_change()
    df.dropna(inplace=True)
    return df


def build_sequences(df: pd.DataFrame, seq_len: int = 60):
    features = [c for c in FEATURE_COLS if c in df.columns]
    data = df[features].values
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(data)
    X, y = [], []
    for i in range(seq_len, len(data_scaled)):
        X.append(data_scaled[i - seq_len: i])
        y.append(data_scaled[i, 0])
    return np.array(X), np.array(y), scaler, features


def build_lstm(seq_len: int, n_features: int):
    model = Sequential([
        Input(shape=(seq_len, n_features)),
        LSTM(128, return_sequences=True),
        Dropout(0.2),
        LSTM(64, return_sequences=True),
        Dropout(0.2),
        LSTM(32, return_sequences=False),
        Dropout(0.1),
        Dense(32, activation="relu"),
        Dense(1)
    ])
    model.compile(optimizer=Adam(learning_rate=0.001), loss="huber")
    return model


# ── Progress tracker ──────────────────────────────────────────

class TrainingProgress:
    def __init__(self):
        self.events = []
        self.done   = False
        self.error  = None

    def emit(self, event: str, data: dict):
        self.events.append({"event": event, "data": data})

    def finish(self):
        self.done = True

    def fail(self, msg: str):
        self.error = msg
        self.done  = True


# ── Main predictor class ──────────────────────────────────────

class SelfCorrectingPredictor:
    def __init__(self, ticker: str, seq_len: int = 60, model_dir: str = "models"):
        self.ticker    = ticker.upper()
        self.seq_len   = seq_len
        self.model_dir = model_dir
        self.model     = None
        self.scaler    = None
        self.features  = None
        self.df        = None
        self.dates     = None
        self.X         = None
        self.y         = None
        self.train_loss = []
        self.val_loss   = []
        self._np_weights = None
        os.makedirs(model_dir, exist_ok=True)

    def fetch_and_prepare(self, period: str = "2y"):
        df = fetch_stock_data(self.ticker, period)
        df = add_features(df)
        self.df    = df
        self.dates = df.index
        X, y, scaler, features = build_sequences(df, self.seq_len)
        self.X        = X
        self.y        = y
        self.scaler   = scaler
        self.features = features
        return X, y

    def train(self, epochs: int = 50, batch_size: int = 32,
              validation_split: float = 0.15,
              progress: Optional[TrainingProgress] = None):

        X, y  = self.X, self.y
        split = int(len(X) * (1 - validation_split))
        X_tr, X_val = X[:split], X[split:]
        y_tr, y_val = y[:split], y[split:]

        if not TF_AVAILABLE:
            if progress:
                progress.emit("status", {"message": "Using NumPy fallback predictor..."})
            self._numpy_train(X_tr, y_tr, progress)
        else:
            if progress:
                progress.emit("status", {"message": "Building LSTM model..."})
            self.model = build_lstm(self.seq_len, len(self.features))

            class ProgressCB(tf.keras.callbacks.Callback):
                def on_epoch_end(self_cb, epoch, logs=None):
                    tl = float(logs.get("loss", 0))
                    vl = float(logs.get("val_loss", 0))
                    self.train_loss.append(tl)
                    self.val_loss.append(vl)
                    if progress:
                        progress.emit("epoch", {
                            "epoch":      epoch + 1,
                            "total":      epochs,
                            "train_loss": round(tl, 6),
                            "val_loss":   round(vl, 6),
                        })

            callbacks = [
                EarlyStopping(patience=10, restore_best_weights=True, monitor="val_loss"),
                ReduceLROnPlateau(patience=5, factor=0.5, min_lr=1e-6),
                ProgressCB(),
            ]
            self.model.fit(
                X_tr, y_tr,
                epochs=epochs,
                batch_size=batch_size,
                validation_data=(X_val, y_val),
                callbacks=callbacks,
                verbose=0
            )

        if progress:
            progress.emit("status", {"message": "Running self-correction pass..."})
        self._self_correct(X_val, y_val)

    def _numpy_train(self, X, y, progress=None):
        weights = np.ones(X.shape[1]) / X.shape[1]
        lr = 0.001
        for ep in range(50):
            preds = np.dot(X[:, :, 0], weights)
            err   = y - preds
            grad  = -np.dot(X[:, :, 0].T, err) / len(y)
            weights -= lr * grad
            loss = float(np.mean(err ** 2))
            self.train_loss.append(round(loss, 6))
            if progress:
                progress.emit("epoch", {
                    "epoch":      ep + 1,
                    "total":      50,
                    "train_loss": round(loss, 6),
                    "val_loss":   0.0,
                })
        self._np_weights = weights

    def _np_predict(self, X):
        return np.dot(X[:, :, 0], self._np_weights)

    def _raw_predict(self, X):
        if TF_AVAILABLE and self.model is not None:
            return self.model.predict(X, verbose=0).flatten()
        return self._np_predict(X)

    def _self_correct(self, X_val, y_val, epochs: int = 5):
        preds  = self._raw_predict(X_val)
        errors = np.abs(y_val - preds)
        sw = errors / (errors.sum() + 1e-9)
        sw = sw / (sw.max() + 1e-9)
        if TF_AVAILABLE and self.model is not None:
            self.model.fit(X_val, y_val, sample_weight=sw,
                           epochs=epochs, batch_size=16, verbose=0)

    def evaluate(self) -> dict:
        preds_s = self._raw_predict(self.X)

        def inv(arr):
            d = np.zeros((len(arr), len(self.features)))
            d[:, 0] = arr
            return self.scaler.inverse_transform(d)[:, 0]

        actual = inv(self.y)
        pred   = inv(preds_s)
        mae    = float(mean_absolute_error(actual, pred))
        rmse   = float(np.sqrt(mean_squared_error(actual, pred)))
        mape   = float(np.mean(np.abs((actual - pred) / (actual + 1e-9))) * 100)
        return {
            "mae":       round(mae, 4),
            "rmse":      round(rmse, 4),
            "mape":      round(mape, 4),
            "accuracy":  round(100 - mape, 4),
            "dates":     [str(d.date()) for d in self.dates[self.seq_len:]],
            "actual":    actual.tolist(),
            "predicted": pred.tolist(),
        }

    def predict_next_n(self, n_days: int = 10) -> list:
        features   = [c for c in FEATURE_COLS if c in self.df.columns]
        last       = self.scaler.transform(self.df[features].values)[-self.seq_len:]
        seq        = last.copy()
        last_close = float(self.df["Close"].iloc[-1])
        last_date  = self.dates[-1]
        future_dates = pd.bdate_range(last_date + timedelta(days=1), periods=n_days)
        out = []
        for fdate in future_dates:
            x   = seq[np.newaxis, :, :]
            ps  = self._raw_predict(x)[0]
            d   = np.zeros((1, len(self.features)))
            d[0, 0] = ps
            price = float(self.scaler.inverse_transform(d)[0, 0])
            chg   = round((price - last_close) / last_close * 100, 4)
            out.append({"date": str(fdate.date()), "price": round(price, 4), "change_pct": chg})
            new_row    = seq[-1].copy()
            new_row[0] = ps
            seq = np.vstack([seq[1:], new_row])
        return out

    def save(self):
        base = os.path.join(self.model_dir, self.ticker)
        if TF_AVAILABLE and self.model is not None:
            self.model.save(base + ".keras")
        if self._np_weights is not None:
            np.save(base + "_weights.npy", self._np_weights)
        np.save(base + "_scale.npy", self.scaler.scale_)
        np.save(base + "_min.npy",   self.scaler.min_)
        meta = {
            "ticker":     self.ticker,
            "seq_len":    self.seq_len,
            "features":   self.features,
            "saved_at":   datetime.now().isoformat(),
            "train_loss": self.train_loss,
            "val_loss":   self.val_loss,
        }
        with open(base + "_meta.json", "w") as f:
            json.dump(meta, f)

    def load(self) -> bool:
        base = os.path.join(self.model_dir, self.ticker + "_meta.json")
        if not os.path.exists(base):
            return False
        with open(base) as f:
            meta = json.load(f)
        self.features   = meta["features"]
        self.seq_len    = meta["seq_len"]
        self.train_loss = meta.get("train_loss", [])
        self.val_loss   = meta.get("val_loss",   [])
        base = os.path.join(self.model_dir, self.ticker)
        self.scaler = MinMaxScaler()
        self.scaler.scale_ = np.load(base + "_scale.npy")
        self.scaler.min_   = np.load(base + "_min.npy")
        if TF_AVAILABLE and os.path.exists(base + ".keras"):
            self.model = load_model(base + ".keras")
        if os.path.exists(base + "_weights.npy"):
            self._np_weights = np.load(base + "_weights.npy")
        return True

    def model_exists(self) -> bool:
        return os.path.exists(
            os.path.join(self.model_dir, self.ticker + "_meta.json")
        )

    def get_meta(self) -> dict:
        path = os.path.join(self.model_dir, self.ticker + "_meta.json")
        if not os.path.exists(path):
            return {}
        with open(path) as f:
            return json.load(f)