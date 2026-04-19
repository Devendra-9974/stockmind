FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc g++ && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip setuptools wheel

RUN pip install --only-binary=:all: pandas==2.0.3 numpy==1.24.4

RUN pip install \
    fastapi==0.100.1 \
    "uvicorn[standard]==0.23.2" \
    pydantic==1.10.13 \
    python-multipart==0.0.6 \
    aiofiles==23.1.0 \
    httpx==0.24.1 \
    python-dotenv==1.0.0 \
    scikit-learn==1.3.2 \
    matplotlib==3.7.5 \
    yfinance==0.2.40 \
    curl_cffi==0.6.2

COPY . .

RUN mkdir -p models charts

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]