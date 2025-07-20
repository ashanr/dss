#!/bin/bash

# Student Migration Decision Support System - Deployment Script
# This script handles deployment operations for the DSS application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

# Show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start         Start the application"
    echo "  stop          Stop the application"
    echo "  restart       Restart the application"
    echo "  build         Build the Docker images"
    echo "  logs          Show application logs"
    echo "  status        Show container status"
    echo "  backup        Backup database"
    echo "  restore       Restore database from backup"
    echo "  update        Update and restart the application"
    echo "  cleanup       Clean up unused Docker resources"
    echo "  help          Show this help message"
}

# Start the application
start_application() {
    print_header "Starting Student Migration DSS..."
    
    # Create network if it doesn't exist
    docker network create dss-network 2>/dev/null || true
    
    # Start services
    docker-compose up -d
    
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_status "Application started successfully!"
        print_status "Access the application at:"
        print_status "  - HTTP: http://localhost"
        print_status "  - HTTPS: https://localhost"
        print_status "  - Direct Flask: http://localhost:5000"
    else
        print_error "Failed to start application. Check logs with: $0 logs"
        exit 1
    fi
}

# Stop the application
stop_application() {
    print_header "Stopping Student Migration DSS..."
    docker-compose down
    print_status "Application stopped successfully!"
}

# Restart the application
restart_application() {
    print_header "Restarting Student Migration DSS..."
    docker-compose restart
    print_status "Application restarted successfully!"
}

# Build Docker images
build_images() {
    print_header "Building Docker images..."
    docker-compose build --no-cache
    print_status "Images built successfully!"
}

# Show logs
show_logs() {
    print_header "Showing application logs..."
    docker-compose logs -f --tail=100
}

# Show container status
show_status() {
    print_header "Container Status:"
    docker-compose ps
    
    echo ""
    print_header "Service Health:"
    
    # Check web service
    if curl -f http://localhost:5000/health >/dev/null 2>&1; then
        print_status "Web service: Healthy"
    else
        print_error "Web service: Unhealthy"
    fi
    
    # Check Redis
    if docker-compose exec redis redis-cli ping >/dev/null 2>&1; then
        print_status "Redis service: Healthy"
    else
        print_error "Redis service: Unhealthy"
    fi
}

# Backup database
backup_database() {
    print_header "Backing up database..."
    
    BACKUP_DIR="backups"
    mkdir -p $BACKUP_DIR
    
    BACKUP_FILE="$BACKUP_DIR/database_backup_$(date +%Y%m%d_%H%M%S).db"
    
    if [ -f "db/student_migration_database.db" ]; then
        cp "db/student_migration_database.db" "$BACKUP_FILE"
        print_status "Database backed up to: $BACKUP_FILE"
    else
        print_error "Database file not found!"
        exit 1
    fi
}

# Restore database
restore_database() {
    if [ -z "$2" ]; then
        print_error "Usage: $0 restore <backup_file>"
        exit 1
    fi
    
    BACKUP_FILE="$2"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    print_header "Restoring database from: $BACKUP_FILE"
    print_warning "This will overwrite the current database!"
    
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Stop the application first
        docker-compose stop web
        
        # Restore database
        cp "$BACKUP_FILE" "db/student_migration_database.db"
        
        # Start the application
        docker-compose start web
        
        print_status "Database restored successfully!"
    else
        print_status "Restore cancelled."
    fi
}

# Update and restart
update_application() {
    print_header "Updating Student Migration DSS..."
    
    # Pull latest changes (if using Git)
    if [ -d ".git" ]; then
        print_status "Pulling latest changes..."
        git pull
    fi
    
    # Backup database before update
    backup_database
    
    # Rebuild and restart
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    print_status "Application updated successfully!"
}

# Cleanup unused Docker resources
cleanup_docker() {
    print_header "Cleaning up unused Docker resources..."
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    # Remove unused networks
    docker network prune -f
    
    print_status "Cleanup completed!"
}

# Main script logic
case "$1" in
    start)
        start_application
        ;;
    stop)
        stop_application
        ;;
    restart)
        restart_application
        ;;
    build)
        build_images
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$@"
        ;;
    update)
        update_application
        ;;
    cleanup)
        cleanup_docker
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac