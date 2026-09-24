# AgriSight FastAPI Backend - Production Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if required (e.g. for image processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose port (default 8000, overridden dynamically by Render/Railway via $PORT)
EXPOSE 8000

# Run uvicorn server binding to 0.0.0.0 and $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
