#!/bin/bash

# Student Migration Decision Support System - Docker Setup Script
# This script sets up the Docker environment for the DSS application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p db
    mkdir -p logs
    mkdir -p static
    mkdir -p templates
    mkdir -p utils
    mkdir -p nginx
    mkdir -p monitoring
    mkdir -p ssl
    
    print_status "Directories created successfully"
}

# Create environment file
create_env_file() {
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        
        cat > .env << EOF
# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=production
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=False

# Database Configuration
DATABASE_URL=sqlite:///db/student_migration_database.db
DATABASE_BACKUP_PATH=/app/data/backups

# Application Settings
APP_NAME=Student Migration Decision Support System
APP_VERSION=1.0.0
APP_HOST=0.0.0.0
APP_PORT=5000

# Security Settings
SECURITY_SALT=$(openssl rand -hex 16)
SESSION_TIMEOUT=3600
MAX_CONTENT_LENGTH=16777216

# Analytics Configuration
ANALYTICS_ENABLED=true
PERFORMANCE_MONITORING=true
SLOW_QUERY_THRESHOLD=0.5

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=/app/logs/app.log
LOG_MAX_SIZE=10485760
LOG_BACKUP_COUNT=5

# Cache Configuration (Redis)
CACHE_TYPE=redis
CACHE_REDIS_HOST=redis
CACHE_REDIS_PORT=6379
CACHE_REDIS_DB=0
CACHE_DEFAULT_TIMEOUT=300

# Monitoring Configuration
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=8000
GRAFANA_ENABLED=true
EOF
        
        print_status ".env file created with random secret keys"
    else
        print_warning ".env file already exists, skipping creation"
    fi
}

# Generate SSL certificates for development
generate_ssl_certificates() {
    if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
        print_status "Generating SSL certificates for development..."
        
        mkdir -p ssl
        
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        print_status "SSL certificates generated successfully"
    else
        print_warning "SSL certificates already exist, skipping generation"
    fi
}

# Create Docker files
create_docker_files() {
    print_status "Creating Docker files..."
    
    # Create Dockerfile
    cat > Dockerfile << 'EOF'
# Multi-stage build for optimized production image
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements first for better layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Create necessary directories
RUN mkdir -p /app/db /app/logs /app/static /app/templates /app/utils

# Copy application files
COPY . .

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown -R appuser:appuser /app

# Change to non-root user
USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-", "app:app"]
EOF

    # Create docker-compose.yml
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Main Flask Application
  web:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: dss-web
    ports:
      - "5000:5000"
    volumes:
      - ./db:/app/db
      - ./logs:/app/logs
      - app-data:/app/data
      - ./static:/app/static
      - ./templates:/app/templates
    env_file:
      - .env
    depends_on:
      - redis
    networks:
      - dss-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Redis for Caching
  redis:
    image: redis:alpine
    container_name: dss-redis
    volumes:
      - redis-data:/data
    networks:
      - dss-network
    restart: unless-stopped
    command: redis-server --appendonly yes

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: dss-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./static:/var/www/static
    depends_on:
      - web
    networks:
      - dss-network
    restart: unless-stopped

volumes:
  app-data:
    driver: local
  redis-data:
    driver: local

networks:
  dss-network:
    driver: bridge
EOF

    print_status "Docker files created successfully"
}

# Create basic nginx configuration
create_nginx_config() {
    cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Upstream configuration
    upstream flask_app {
        server web:5000;
    }

    # HTTP Server
    server {
        listen 80;
        server_name localhost;

        # Static files
        location /static {
            alias /var/www/static;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # Main application
        location / {
            proxy_pass http://flask_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://flask_app;
            access_log off;
        }
    }
}
EOF

    print_status "Nginx configuration created successfully"
}

# Update requirements.txt
update_requirements() {
    print_status "Updating requirements.txt with Docker-specific dependencies..."
    
    # Add gunicorn if not present
    if ! grep -q "gunicorn" requirements.txt 2>/dev/null; then
        echo "gunicorn>=20.1.0" >> requirements.txt
    fi
    
    # Add other production dependencies
    cat >> requirements.txt << 'EOF'
python-dotenv>=0.19.0
redis>=4.0.0
prometheus-client>=0.14.0
psutil>=5.8.0
EOF
    
    print_status "requirements.txt updated"
}

# Create health check endpoint
create_health_check() {
    print_status "Creating health check endpoint..."
    
    cat > health_check.py << 'EOF'
from flask import jsonify
import sqlite3
import os
import redis
import time

def register_health_check(app):
    @app.route('/health')
    def health_check():
        """Health check endpoint for Docker container"""
        try:
            # Check database connection
            db_path = os.path.join(os.path.dirname(__file__), 'db', 'student_migration_database.db')
            conn = sqlite3.connect(db_path)
            conn.execute('SELECT 1')
            conn.close()
            
            # Check Redis connection (if configured)
            try:
                r = redis.Redis(host='redis', port=6379, db=0)
                r.ping()
                redis_status = "connected"
            except:
                redis_status = "disconnected"
            
            return jsonify({
                'status': 'healthy',
                'timestamp': time.time(),
                'database': 'connected',
                'redis': redis_status,
                'version': '1.0.0'
            }), 200
            
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': time.time()
            }), 503
EOF

    print_status "Health check endpoint created"
}

# Main execution
main() {
    print_status "Starting Student Migration DSS Docker setup..."
    
    check_docker
    create_directories
    create_env_file
    generate_ssl_certificates
    create_docker_files
    create_nginx_config
    update_requirements
    create_health_check
    
    print_status "Setup completed successfully!"
    print_status ""
    print_status "Next steps:"
    print_status "1. Review and edit the .env file if needed"
    print_status "2. Run 'docker-compose up -d' to start the application"
    print_status "3. Access the application at http://localhost or https://localhost"
    print_status "4. Check container status with 'docker-compose ps'"
    print_status ""
    print_warning "Remember to change the SECRET_KEY in .env for production use!"
}

# Run main function
main "$@"