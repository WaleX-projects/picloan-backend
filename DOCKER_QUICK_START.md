# PickLoan Backend - Docker Quick Start Guide

Fast and easy setup for PickLoan backend using Docker.

## ⚡ 5-Minute Setup

### 1. Prerequisites
```bash
# Verify Docker is installed
docker --version
docker-compose --version
```

### 2. Configure Environment
```bash
# Copy example environment
cp .env.example .env

# Edit with your settings
# Required: DATABASE_URL, SUPABASE_URL, NOVA_API_KEY
nano .env
```

### 3. Start Development
```bash
# Using Makefile (recommended)
make dev

# OR using docker-compose directly
docker-compose up -d
docker-compose exec api alembic upgrade head
```

### 4. Verify It's Running
```bash
# Check health
curl http://localhost:8000/health

# View logs
docker-compose logs -f api
```

### 5. Access Services
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **pgAdmin**: http://localhost:5050

Done! Your backend is ready to use.

---

## 🚀 Quick Commands

```bash
# Start development
make dev

# Stop development
make dev-down

# View logs
make dev-logs

# Run migrations
make migrate

# Backup database
make db-backup

# Stop everything and cleanup
make clean
```

---

## 📝 Common Tasks

### Upload a Document
```bash
curl -X POST http://localhost:8000/upload \
  -F "sync_id=PL-12345" \
  -F "files=@/path/to/image.jpg"
```

### Connect to Database
```bash
# Interactive shell
docker-compose exec postgres psql -U postgres -d pickloan

# View tables
\dt

# Exit
\q
```

### View API Documentation
```
Open browser: http://localhost:8000/docs
```

### Check Status
```bash
make health
make status
docker-compose ps
```

---

## 🐛 Troubleshooting

### "Port already in use"
```bash
# Change port in docker-compose.yml or
API_PORT=9000 docker-compose up -d
```

### "Connection refused"
```bash
# Wait for services to start
sleep 10

# Check if running
docker-compose ps

# View logs
docker-compose logs api
```

### "Database migration failed"
```bash
# Check database connection
docker-compose exec postgres pg_isready -U postgres

# View migration logs
docker-compose logs api
```

### Container exits immediately
```bash
# Check logs for errors
docker-compose logs api

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

---

## 📦 What's Included

- ✅ **FastAPI** backend with async support
- ✅ **PostgreSQL** database with Alembic migrations
- ✅ **pgAdmin** database management UI
- ✅ **Health checks** for container monitoring
- ✅ **Multi-stage builds** for optimized image size
- ✅ **Security hardening** with non-root user
- ✅ **Development & Production** configs
- ✅ **Nginx** reverse proxy (optional)

---

## 🔐 Production Deployment

For production setup with SSL/TLS and Nginx:

```bash
# Setup production environment
make prod-setup

# Copy production env
cp .env.prod.example .env.prod

# Add SSL certificates to ssl/ directory
mkdir -p ssl
cp /path/to/cert.pem ssl/
cp /path/to/key.pem ssl/

# Start production
make prod-up
```

Access via: https://yourdomain.com

---

## 📚 Documentation

- **Full Guide**: See `DOCKER.md` for comprehensive documentation
- **Dockerfile**: Multi-stage build for efficiency
- **docker-compose.yml**: Development configuration
- **docker-compose.prod.yml**: Production with external DB only
- **docker-compose.nginx.yml**: Production with Nginx reverse proxy
- **Makefile**: Convenient command shortcuts
- **scripts/docker-setup.sh**: Automated setup script

---

## 🎯 Next Steps

1. ✅ Environment configured
2. ✅ Backend running locally
3. **Next**: Deploy to cloud (AWS, GCP, Azure, Heroku)
4. **Next**: Setup monitoring and logging
5. **Next**: Configure continuous deployment (CI/CD)

---

## 💡 Tips

- Use `make` commands for simplicity
- Run `make help` to see all available commands
- Check `DOCKER.md` for advanced topics
- Use `docker-compose logs -f api` for real-time debugging
- Database backups are stored in `backups/` directory
- SSL certificates should go in `ssl/` directory for production

---

## 🆘 Need Help?

```bash
# Show all available commands
make help

# Check prerequisites
bash scripts/docker-setup.sh check

# Run health check
make health

# View detailed status
make status
```

---

**Ready to deploy?** 🚀

```bash
make dev          # Start now
make prod-setup   # Or setup for production
```
