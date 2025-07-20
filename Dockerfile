# Multi-stage Dockerfile for DSS Application

# Stage 1: Build React Frontend
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY frontend/ ./

# Build the React application
RUN npm run build

# Stage 2: Build Flask Backend
FROM python:3.9-slim as backend-builder

WORKDIR /app/api

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libc6-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY api/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Stage 3: Production Image
FROM python:3.9-slim

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=backend-builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /app/frontend/build /app/static

# Copy backend source code
COPY api/ /app/api/

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Create directories for data and logs
RUN mkdir -p /app/data /app/logs

# Set environment variables
ENV FLASK_APP=api/app.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start the Flask application
CMD ["python", "api/app.py"]
