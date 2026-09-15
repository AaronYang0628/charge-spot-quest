# Charge Spot Quest — Vite frontend + FastAPI in one image
# Build from repo root: docker build -t charge-spot-quest .

# ----- Stage 1: frontend -----
FROM node:22-alpine AS frontend

WORKDIR /frontend

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src

# Same-origin UI: base /, API via relative /api
ARG VITE_BASE=/
ARG VITE_API_BASE=/
ENV VITE_BASE=$VITE_BASE \
    VITE_API_BASE=$VITE_API_BASE

RUN npm run build

# ----- Stage 2: API + static -----
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    APP_HOME=/app \
    APP_HOST=0.0.0.0 \
    APP_PORT=8080 \
    STATIC_DIR=/app/static

WORKDIR $APP_HOME

RUN useradd --create-home --uid 10001 appuser \
    && mkdir -p /app/data /app/static \
    && chown -R appuser:appuser /app

COPY server/requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY server/app ./app
COPY --from=frontend /frontend/dist ./static

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
