FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install --only-binary=:all: numpy==1.26.4 pandas==2.2.2 scikit-learn==1.4.2 matplotlib==3.9.0 && \
    pip install fastapi==0.111.0 "uvicorn[standard]==0.29.0" pydantic==2.7.1 pydantic-settings==2.3.1 python-multipart==0.0.9 aiofiles==23.2.1 httpx==0.27.0 python-dotenv==1.0.1 yfinance==0.2.40 curl_cffi==0.6.2

COPY . .

RUN mkdir -p models charts

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}