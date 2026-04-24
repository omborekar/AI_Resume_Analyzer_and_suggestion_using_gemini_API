FROM python:3.11-slim AS backend-base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .
COPY agents/ ./agents/
COPY utils/ ./utils/
COPY knowledge_base/ ./knowledge_base/

# Create temp directory
RUN mkdir -p temp

# ---- Frontend build stage ----
FROM node:20-slim AS frontend-build

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# ---- Final stage ----
FROM backend-base AS final

# Copy built React frontend into Flask static/templates
COPY --from=frontend-build /frontend/dist /app/static
RUN mkdir -p /app/templates && \
    cp /app/static/index.html /app/templates/index.html

# Cloud Run expects PORT env var
ENV FLASK_PORT=8080
ENV FLASK_ENV=production

EXPOSE 8080

# Health check (used by Cloud Run and Kubernetes)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/api/health')"

CMD ["python", "app.py"]
