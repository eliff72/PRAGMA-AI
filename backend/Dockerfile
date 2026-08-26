# PRAGMA-AI backend — hem yerel gelistirme (docker compose) hem de
# Render/Railway gibi PaaS dagitimlari icin tek imaj.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# psycopg / chromadb derlemeleri icin gerekli minimum sistem paketleri
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS "http://localhost:${PORT}/health" || exit 1

# Render/Railway calisma zamaninda $PORT atar; yerelde varsayilan 8000 kalir.
# --reload YOK: production'da kapali olmali (docker-compose yerel gelistirmede
# kendi command'i ile override eder).
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
