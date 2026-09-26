#!/bin/bash

# ============================================================================
# Docker Setup Script for PickLoan Backend
# ============================================================================
# This script automates the setup and management of PickLoan backend
# using Docker and Docker Compose.
#
# Usage: bash scripts/docker-setup.sh [command] [options]
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================================================
# Check Prerequisites
# ============================================================================

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Please install Docker from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker installed: $(docker --version)"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose installed: $(docker-compose --version)"
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        echo "Please start Docker and try again"
        exit 1
    fi
    print_success "Docker daemon is running"
}

# ============================================================================
# Environment Setup
# ============================================================================

setup_environment() {
    print_header "Setting Up Environment"
    
    cd "$PROJECT_DIR"
    
    if [ -f ".env" ]; then
        print_warning ".env file already exists"
        read -p "Do you want to recreate it? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm .env
        else
            print_info "Keeping existing .env file"
            return
        fi
    fi
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success ".env file created from .env.example"
        
        # Prompt for configuration
        print_info "Please update .env with your configuration:"
        read -p "Press Enter to open .env in default editor..."
        
        if command -v nano &> /dev/null; then
            nano .env
        elif command -v vi &> /dev/null; then
            vi .env
        else
            print_warning "Could not open editor. Please edit .env manually"
        fi
    else
        print_error ".env.example not found"
        exit 1
    fi
}

# ============================================================================
# Docker Build
# ============================================================================

build_image() {
    print_header "Building Docker Image"
    
    cd "$PROJECT_DIR"
    
    print_info "Building Docker image: pickloan-api"
    docker-compose build
    
    print_success "Docker image built successfully"
}

build_no_cache() {
    print_header "Building Docker Image (no cache)"
    
    cd "$PROJECT_DIR"
    
    print_info "Building Docker image without cache..."
    docker-compose build --no-cache
    
    print_success "Docker image built successfully"
}

# ============================================================================
# Development Environment
# ============================================================================

start_dev() {
    print_header "Starting Development Environment"
    
    cd "$PROJECT_DIR"
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found"
        print_info "Running setup..."
        setup_environment
    fi
    
    print_info "Starting containers..."
    docker-compose up -d
    
    print_info "Waiting for services to be ready..."
    sleep 5
    
    print_info "Running database migrations..."
    docker-compose exec -T api alembic upgrade head
    
    print_success "Development environment started"
    print_info "API: http://localhost:8000"
    print_info "pgAdmin: http://localhost:5050 (admin@example.com / admin)"
    print_info "Documentation: http://localhost:8000/docs"
}

stop_dev() {
    print_header "Stopping Development Environment"
    
    cd "$PROJECT_DIR"
    
    docker-compose down
    
    print_success "Development environment stopped"
}

restart_dev() {
    print_header "Restarting Development Environment"
    
    stop_dev
    start_dev
}

logs_dev() {
    print_header "Development Logs"
    
    cd "$PROJECT_DIR"
    
    docker-compose logs -f "$@"
}

# ============================================================================
# Database Management
# ============================================================================

migrate_database() {
    print_header "Running Database Migrations"
    
    cd "$PROJECT_DIR"
    
    if ! docker-compose ps | grep -q "api"; then
        print_error "API container is not running"
        print_info "Starting development environment..."
        start_dev
    fi
    
    print_info "Running migrations..."
    docker-compose exec -T api alembic upgrade head
    
    print_success "Database migrations completed"
}

backup_database() {
    print_header "Backing Up Database"
    
    cd "$PROJECT_DIR"
    
    mkdir -p backups
    
    BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    print_info "Backing up database to: $BACKUP_FILE"
    docker-compose exec -T postgres pg_dump -U postgres -d pickloan > "$BACKUP_FILE"
    
    print_success "Database backup completed: $BACKUP_FILE"
    ls -lh "$BACKUP_FILE"
}

restore_database() {
    print_header "Restoring Database"
    
    cd "$PROJECT_DIR"
    
    if [ -z "$1" ]; then
        echo "Available backups:"
        ls -1 backups/
        read -p "Enter backup filename: " BACKUP_FILE
    else
        BACKUP_FILE="$1"
    fi
    
    if [ ! -f "backups/$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    print_warning "This will overwrite the current database!"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Restore cancelled"
        return
    fi
    
    print_info "Restoring database from: $BACKUP_FILE"
    cat "backups/$BACKUP_FILE" | docker-compose exec -T postgres psql -U postgres -d pickloan
    
    print_success "Database restore completed"
}

reset_database() {
    print_header "Resetting Database"
    
    print_warning "WARNING: This will delete all data in the database!"
    read -p "Type 'yes' to confirm: " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        print_info "Reset cancelled"
        return
    fi
    
    cd "$PROJECT_DIR"
    
    print_info "Stopping containers and removing volumes..."
    docker-compose down -v
    
    print_info "Starting containers..."
    docker-compose up -d
    
    sleep 5
    
    print_info "Running migrations..."
    migrate_database
    
    print_success "Database reset completed"
}

# ============================================================================
# Diagnostics
# ============================================================================

health_check() {
    print_header "Health Check"
    
    print_info "Checking Docker daemon..."
    if docker info &> /dev/null; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not responding"
        return 1
    fi
    
    print_info "Checking containers..."
    if docker-compose ps | grep -q "pickloan-api"; then
        print_success "API container is running"
        
        # Check health endpoint
        if curl -s http://localhost:8000/health &> /dev/null; then
            print_success "API health check passed"
        else
            print_error "API health check failed"
        fi
    else
        print_warning "API container is not running"
    fi
    
    print_info "Container status:"
    docker-compose ps
}

show_logs() {
    print_header "Recent Logs"
    
    docker-compose logs --tail=50
}

# ============================================================================
# Production Setup
# ============================================================================

setup_production() {
    print_header "Setting Up Production Environment"
    
    cd "$PROJECT_DIR"
    
    # Check for production env
    if [ ! -f ".env.prod" ]; then
        print_warning ".env.prod not found"
        print_info "Creating from .env.prod.example..."
        
        if [ -f ".env.prod.example" ]; then
            cp .env.prod.example .env.prod
            print_success ".env.prod created"
        else
            print_error ".env.prod.example not found"
            exit 1
        fi
    fi
    
    # Check for SSL certificates
    if [ ! -d "ssl" ]; then
        print_warning "SSL directory not found"
        print_info "Creating SSL directory..."
        mkdir -p ssl
        print_info "Please add your SSL certificates:"
        print_info "  - cert.pem"
        print_info "  - key.pem"
        print_info "in the ssl/ directory before starting production"
    fi
    
    print_info "Production configuration ready"
    print_info "Update .env.prod with your production settings"
    print_info "Run: docker-compose -f docker-compose.nginx.yml up -d"
}

# ============================================================================
# Cleanup
# ============================================================================

cleanup() {
    print_header "Cleaning Up"
    
    print_warning "This will remove stopped containers and unused images"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleanup cancelled"
        return
    fi
    
    print_info "Removing dangling images..."
    docker image prune -f
    
    print_info "Removing stopped containers..."
    docker container prune -f
    
    print_success "Cleanup completed"
}

# ============================================================================
# Main Menu
# ============================================================================

show_usage() {
    cat << EOF
PickLoan Backend - Docker Setup Script

Usage: bash scripts/docker-setup.sh [command] [options]

Commands:
  help                - Show this help message
  check               - Check prerequisites
  setup               - Setup environment (.env file)
  build               - Build Docker image
  build-nocache       - Build Docker image (no cache)
  dev-start           - Start development environment
  dev-stop            - Stop development environment
  dev-restart         - Restart development environment
  dev-logs            - Show development logs
  migrate             - Run database migrations
  db-backup           - Backup database
  db-restore [file]   - Restore database from backup
  db-reset            - Reset database (WARNING: deletes data)
  health              - Run health check
  logs                - Show recent logs
  prod-setup          - Setup production environment
  cleanup             - Cleanup Docker resources
  version             - Show version information

Examples:
  bash scripts/docker-setup.sh check          # Check prerequisites
  bash scripts/docker-setup.sh dev-start      # Start development
  bash scripts/docker-setup.sh db-backup      # Backup database
  bash scripts/docker-setup.sh dev-logs api   # Show API logs

For more information, see: DOCKER.md

EOF
}

# ============================================================================
# Main Script
# ============================================================================

main() {
    local command="${1:-help}"
    
    case "$command" in
        help)
            show_usage
            ;;
        check)
            check_prerequisites
            ;;
        setup)
            setup_environment
            ;;
        build)
            build_image
            ;;
        build-nocache)
            build_no_cache
            ;;
        dev-start)
            check_prerequisites
            start_dev
            ;;
        dev-stop)
            stop_dev
            ;;
        dev-restart)
            check_prerequisites
            restart_dev
            ;;
        dev-logs)
            logs_dev "${@:2}"
            ;;
        migrate)
            migrate_database
            ;;
        db-backup)
            backup_database
            ;;
        db-restore)
            restore_database "$2"
            ;;
        db-reset)
            reset_database
            ;;
        health)
            health_check
            ;;
        logs)
            show_logs
            ;;
        prod-setup)
            setup_production
            ;;
        cleanup)
            cleanup
            ;;
        version)
            echo "PickLoan Docker Setup v1.0.0"
            ;;
        *)
            print_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
