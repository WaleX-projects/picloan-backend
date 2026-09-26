# Docker Setup Guide for PickLoan Backend

This guide explains how to build and run the PickLoan FastAPI backend using Docker.

## 📋 Prerequisites

- **Docker** 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.0+ ([Install Docker Compose](https://docs.docker.com/compose/install/))
- **Environment variables** configured in `.env` file

## 🚀 Quick Start

### 1. Configure Environment Variables

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database - Use external PostgreSQL
DATABASE_URL=postgresql://user:password@hostname:5432/pickloan_db

# File Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# AI Service
NOVA_API_KEY=your-nova-api-key

# Environment
NODE_ENV=production
```

### 2. Build Docker Image

```bash
# Build image locally
docker build -t pickloan-api:latest .

# Or use docker-compose (which builds automatically)
docker-compose build
```

### 3. Run with Docker Compose

#### Development (with PostgreSQL database included)

```bash
# Start all services (API + PostgreSQL + pgAdmin)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

Services available:
- **API**: http://localhost:8000
- **pgAdmin**: http://localhost:5050 (username: admin@example.com, password: admin)

#### Production (external database only)

```bash
# Run with production config
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f api

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### 4. Run Migrations

```bash
# Execute migrations in running container
docker-compose exec api alembic upgrade head
```

### 5. Test the API

```bash
# Check health status
curl http://localhost:8000/health

# Test upload endpoint
curl -X POST http://localhost:8000/upload \
  -F "sync_id=PL-12345" \
  -F "files=@/path/to/image.jpg"
```

## 🏗 Architecture

### Multi-Stage Build

The `Dockerfile` uses a multi-stage build for optimized image size:

1. **Builder Stage**: Installs build dependencies and compiles Python packages
2. **Runtime Stage**: Only includes runtime dependencies, reducing final image size

### Security Features

- **Non-root User**: Runs as unprivileged `appuser` (UID 1000)
- **Minimal Base Image**: Uses `python:3.11-slim` (~150MB)
- **Security Scanning**: `.dockerignore` excludes sensitive files
- **Health Checks**: Built-in container health monitoring

### Resource Management

```yaml
# docker-compose.prod.yml resource limits
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 1G
```

## 📦 Image Details

```
Image Name: pickloan-api
Tag: latest
Base Image: python:3.11-slim
Size: ~500MB
Architecture: Linux/amd64, linux/arm64 (multi-platform support)
```

## 🔧 Advanced Usage

### Custom Port

```bash
# Change API port
API_PORT=9000 docker-compose up -d
```

### Environment Overrides

```bash
# Override individual settings
docker-compose run -e NODE_ENV=production api uvicorn app.main:app --reload
```

### Run Commands in Container

```bash
# Interactive shell
docker-compose exec api bash

# Run Python script
docker-compose exec api python -c "from app.models import Loan; print(Loan.__tablename__)"

# Check Python version
docker-compose exec api python --version
```

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs api

# Live logs
docker-compose logs -f api

# Last 50 lines
docker-compose logs -n 50 api

# With timestamps
docker-compose logs --timestamps api
```

### Database Management

#### Access PostgreSQL directly

```bash
# Connect to database in container
docker-compose exec postgres psql -U postgres -d pickloan

# Common commands:
\dt                              # List tables
\d applications                  # Describe table
SELECT * FROM loans;             # Query
\q                               # Exit
```

#### Backup Database

```bash
# Backup to SQL file
docker-compose exec postgres pg_dump -U postgres -d pickloan > backup.sql

# Restore from backup
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d pickloan
```

#### Reset Database

```bash
# Delete volume and recreate (WARNING: Deletes all data)
docker-compose down -v
docker-compose up -d
docker-compose exec api alembic upgrade head
```

### pgAdmin Usage

Access pgAdmin at http://localhost:5050

1. Login with credentials from `.env` (default: admin@example.com / admin)
2. Click "Add New Server"
3. Configure connection:
   - **Name**: PickLoan DB
   - **Host**: postgres
   - **Port**: 5432
   - **Username**: postgres
   - **Password**: postgres (from .env)

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs api

# Verify image built correctly
docker-compose build --no-cache

# Check environment variables
docker-compose config
```

### Database connection error

```bash
# Verify database is running
docker-compose ps

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready -U postgres
```

### Out of disk space

```bash
# Clean up unused images and volumes
docker system prune -a --volumes

# View disk usage
docker system df
```

### Port already in use

```bash
# Change port in docker-compose.yml
# Or kill process using port:
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :8000
kill -9 <PID>
```

### Health check failures

```bash
# Check if API is responding
curl -v http://localhost:8000/health

# If 404, verify health endpoint exists in app/main.py
# Add if missing:
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

## 🚢 Deployment

### Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag image
docker tag pickloan-api:latest yourusername/pickloan-api:latest

# Push image
docker push yourusername/pickloan-api:latest

# Pull on server
docker pull yourusername/pickloan-api:latest
```

### Cloud Deployment

#### AWS ECS

```bash
# Create ECR repository
aws ecr create-repository --repository-name pickloan-api

# Build and push
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

docker tag pickloan-api:latest <account>.dkr.ecr.us-east-1.amazonaws.com/pickloan-api:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/pickloan-api:latest
```

#### Google Cloud Run

```bash
# Build and push to Google Cloud
gcloud builds submit --tag gcr.io/PROJECT-ID/pickloan-api

# Deploy
gcloud run deploy pickloan-api \
  --image gcr.io/PROJECT-ID/pickloan-api \
  --platform managed \
  --region us-central1 \
  --set-env-vars="DATABASE_URL=...,SUPABASE_URL=...,NOVA_API_KEY=..."
```

#### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create pickloan-api

# Set environment variables
heroku config:set DATABASE_URL=postgresql://...
heroku config:set SUPABASE_URL=...
heroku config:set NOVA_API_KEY=...

# Push Docker image
heroku container:push web
heroku container:release web
```

### Docker Swarm

```bash
# Initialize swarm (on manager node)
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml pickloan
```

### Kubernetes (with Helm)

See `helm/` directory for Kubernetes manifests and Helm charts.

```bash
# Deploy to Kubernetes
helm install pickloan ./helm/pickloan

# Check deployment
kubectl get pods
kubectl logs -f deployment/pickloan-api
```

## 📊 Monitoring

### Container Metrics

```bash
# Real-time stats
docker stats

# View resource usage
docker-compose stats
```

### Logging

```bash
# Centralized logging (example with Loki)
# Add to docker-compose.yml:
logging:
  driver: loki
  options:
    loki-url: "http://loki:3100/loki/api/v1/push"
    loki-external-labels: service=pickloan-api
```

### Health Status

```bash
# Check health
docker inspect --format='{{.State.Health.Status}}' pickloan-api

# See health check output
docker inspect --format='{{json .State.Health}}' pickloan-api | jq
```

## 📝 Maintenance

### Update Dependencies

```bash
# Rebuild image with latest dependencies
docker-compose build --no-cache

# Restart services
docker-compose up -d
```

### View Running Processes

```bash
# In container
docker-compose exec api ps aux

# Show specific process
docker-compose exec api ps aux | grep uvicorn
```

### Memory Leak Check

```bash
# Monitor memory usage over time
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}"
```

## ✅ Checklist Before Production

- [ ] Environment variables configured securely
- [ ] Database backups configured
- [ ] Resource limits set in docker-compose.prod.yml
- [ ] Health checks passing
- [ ] Logs being collected and monitored
- [ ] SSL/TLS certificate configured (use reverse proxy like nginx)
- [ ] Firewall rules configured
- [ ] Backup and disaster recovery plan in place
- [ ] Monitoring and alerting configured
- [ ] Regular security scanning enabled

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs -f api`
2. Verify environment: `docker-compose config`
3. Test health endpoint: `curl http://localhost:8000/health`
4. Review Dockerfile and docker-compose.yml files
5. Consult Docker and FastAPI documentation

---

**Last Updated**: September 2024
**Docker Compose Version**: 3.8+
**Python Version**: 3.11
