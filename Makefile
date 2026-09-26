.PHONY: help build up down logs migrate db-shell db-backup db-restore clean test lint format

# Default target
help:
	@echo "PickLoan Backend - Docker Management Commands"
	@echo ""
	@echo "Development (with PostgreSQL):"
	@echo "  make dev              - Start development environment"
	@echo "  make dev-up           - Start containers"
	@echo "  make dev-down         - Stop containers"
	@echo "  make dev-logs         - Show live logs"
	@echo ""
	@echo "Production (with nginx + SSL):"
	@echo "  make prod-up          - Start production environment"
	@echo "  make prod-down        - Stop production environment"
	@echo "  make prod-logs        - Show production logs"
	@echo ""
	@echo "Database:"
	@echo "  make migrate          - Run database migrations"
	@echo "  make db-shell         - Open database shell"
	@echo "  make db-backup        - Backup database"
	@echo "  make db-restore       - Restore database"
	@echo "  make db-reset         - Reset database (WARNING: deletes data)"
	@echo ""
	@echo "Code Quality:"
	@echo "  make test             - Run tests"
	@echo "  make lint             - Run linter"
	@echo "  make format           - Format code"
	@echo ""
	@echo "Build & Image:"
	@echo "  make build            - Build Docker image"
	@echo "  make push             - Push image to registry"
	@echo "  make clean            - Clean up images and containers"
	@echo ""

# ============================================================================
# Development Environment
# ============================================================================

dev: dev-up migrate
	@echo "Development environment ready!"
	@echo "API: http://localhost:8000"
	@echo "pgAdmin: http://localhost:5050"

dev-up:
	docker-compose up -d

dev-down:
	docker-compose down

dev-logs:
	docker-compose logs -f api

dev-shell:
	docker-compose exec api bash

# ============================================================================
# Production Environment (with nginx)
# ============================================================================

prod-up: build
	docker-compose -f docker-compose.nginx.yml up -d
	@echo "Production environment started"
	@echo "API: https://localhost"

prod-down:
	docker-compose -f docker-compose.nginx.yml down

prod-logs:
	docker-compose -f docker-compose.nginx.yml logs -f

prod-shell:
	docker-compose -f docker-compose.nginx.yml exec api bash

# ============================================================================
# Database Management
# ============================================================================

migrate:
	@echo "Running database migrations..."
	docker-compose exec api alembic upgrade head

db-shell:
	docker-compose exec postgres psql -U postgres -d pickloan

db-backup:
	@echo "Backing up database..."
	@mkdir -p ./backups
	docker-compose exec postgres pg_dump -U postgres -d pickloan > ./backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup created"

db-restore:
	@echo "Enter backup filename (in ./backups/):"
	@read filename; \
	if [ -f "./backups/$$filename" ]; then \
		docker-compose exec -T postgres psql -U postgres -d pickloan < "./backups/$$filename"; \
		echo "Restore complete"; \
	else \
		echo "File not found"; \
	fi

db-reset:
	@echo "WARNING: This will delete all data!"
	@read -p "Type 'yes' to confirm: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		docker-compose down -v; \
		docker-compose up -d; \
		$(MAKE) migrate; \
		echo "Database reset complete"; \
	fi

# ============================================================================
# Build & Image Management
# ============================================================================

build:
	docker-compose build

build-no-cache:
	docker-compose build --no-cache

push:
	@echo "Pushing image to registry..."
	@read -p "Image name (username/pickloan-api): " image; \
	docker tag pickloan-api:latest $$image:latest; \
	docker push $$image:latest; \
	echo "Image pushed"

# ============================================================================
# Code Quality
# ============================================================================

test:
	docker-compose exec api pytest

lint:
	docker-compose exec api flake8 app/

format:
	docker-compose exec api black app/
	docker-compose exec api isort app/

# ============================================================================
# Health & Status
# ============================================================================

health:
	@curl -s http://localhost:8000/health | jq .

status:
	@curl -s http://localhost:8000/status | jq .

ps:
	docker-compose ps

stats:
	docker stats

# ============================================================================
# Cleanup
# ============================================================================

clean: down
	@echo "Cleaning up..."
	docker system prune -f

clean-all: down
	@echo "WARNING: This will remove all unused Docker resources!"
	docker system prune -af --volumes
	@echo "Cleanup complete"

clean-logs:
	@echo "Clearing log files..."
	truncate -s 0 ./logs/*.log
	@echo "Logs cleared"

# ============================================================================
# Testing Endpoints
# ============================================================================

test-health:
	@echo "Testing health endpoint..."
	@curl -s http://localhost:8000/health | jq .

test-upload:
	@echo "Testing upload endpoint..."
	@echo "Usage: curl -X POST http://localhost:8000/upload \\"
	@echo "  -F 'sync_id=PL-12345' \\"
	@echo "  -F 'files=@/path/to/image.jpg'"

test-all: test-health
	@echo "All tests passed!"

# ============================================================================
# Docker Compose Overrides
# ============================================================================

validate:
	docker-compose config > /dev/null && echo "docker-compose.yml is valid"

env-check:
	@if [ ! -f ".env" ]; then \
		echo "ERROR: .env file not found!"; \
		echo "Copy .env.example to .env and update with your values"; \
		exit 1; \
	fi
	@echo ".env file found"

# ============================================================================
# Information
# ============================================================================

info:
	@echo "=== PickLoan Backend Info ==="
	@echo ""
	@docker inspect pickloan-api:latest 2>/dev/null || echo "Image not built yet"
	@echo ""
	@echo "Environment:"
	@env | grep -E "^(NODE_ENV|DATABASE_URL|SUPABASE)" | sed 's/=.*/ = ***/'
	@echo ""
	@echo "Services Status:"
	@docker-compose ps 2>/dev/null || echo "Not running"

logs-api:
	docker-compose logs -f api

logs-db:
	docker-compose logs -f postgres

logs-all:
	docker-compose logs -f

# ============================================================================
# One-liners
# ============================================================================

start: dev-up
	@echo "Development started"

stop: dev-down
	@echo "Development stopped"

restart: dev-down dev-up
	@echo "Development restarted"
