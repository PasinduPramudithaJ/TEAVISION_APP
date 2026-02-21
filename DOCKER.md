# Docker Containerization Guide

This guide explains how to containerize and run the TeaQnet application using Docker.

## Overview

The application consists of two main services:
- **Backend**: Flask/Python API server (port 5000)
- **Frontend**: React/Vite application served via Nginx (port 80)

## Prerequisites

- Docker Engine 20.10+ 
- Docker Compose 2.0+
- At least 4GB RAM available for Docker
- Models directory with trained models (`.pth`, `.pkl`, `.joblib` files)

**Windows-specific:**
- Docker Desktop for Windows installed and running
- WSL 2 backend enabled (recommended for better performance)
- PowerShell 5.1+ or Windows Terminal (recommended)

## Quick Start

### Production Build

1. **Build and start all services:**
   
   **Linux/Mac (Bash):**
   ```bash
   docker-compose up --build
   ```
   
   **Windows (PowerShell):**
   ```powershell
   docker-compose up --build
   ```
   
   **Windows (CMD):**
   ```cmd
   docker-compose up --build
   ```

2. **Run in detached mode (background):**
   
   **Linux/Mac (Bash):**
   ```bash
   docker-compose up -d --build
   ```
   
   **Windows (PowerShell/CMD):**
   ```powershell
   docker-compose up -d --build
   ```

3. **Access the application:**
   - Frontend: http://localhost (or http://localhost:80)
   - Backend API: http://localhost:5000 (direct access)
   - Health Check: http://localhost/health (via nginx proxy) or http://localhost:5000/health (direct)

   **Note**: The frontend uses nginx to proxy API requests to the backend. All API routes (`/api/*`, `/register`, `/login`, `/predict`, etc.) are automatically proxied to the backend service.

4. **Stop the services:**
   
   **Linux/Mac (Bash):**
   ```bash
   docker-compose down
   ```
   
   **Windows (PowerShell/CMD):**
   ```powershell
   docker-compose down
   ```

### Development Build

For development with hot-reload:

**Linux/Mac (Bash):**
```bash
docker-compose -f docker-compose.dev.yml up --build
```

**Windows (PowerShell/CMD):**
```powershell
docker-compose -f docker-compose.dev.yml up --build
```

- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:5000 (Flask with auto-reload)

## File Structure

```
.
├── docker-compose.yml          # Production orchestration
├── docker-compose.dev.yml      # Development orchestration
├── Tea_Region_Classifier/
│   ├── Dockerfile              # Production backend image
│   ├── Dockerfile.dev          # Development backend image
│   └── .dockerignore
├── TeaQnet/
│   ├── Dockerfile              # Production frontend image
│   ├── Dockerfile.dev          # Development frontend image
│   └── .dockerignore
└── DOCKER.md                   # This file
```

## Building Individual Services

### Backend Only

**Linux/Mac (Bash):**
```bash
cd Tea_Region_Classifier
docker build -t teaqnet-backend .
docker run -p 5000:5000 teaqnet-backend
```

**Windows (PowerShell):**
```powershell
cd Tea_Region_Classifier
docker build -t teaqnet-backend .
docker run -p 5000:5000 teaqnet-backend
```

**Windows (CMD):**
```cmd
cd Tea_Region_Classifier
docker build -t teaqnet-backend .
docker run -p 5000:5000 teaqnet-backend
```

### Frontend Only

**Linux/Mac (Bash):**
```bash
cd TeaQnet
docker build -t teaqnet-frontend .
docker run -p 80:80 teaqnet-frontend
```

**Windows (PowerShell/CMD):**
```powershell
cd TeaQnet
docker build -t teaqnet-frontend .
docker run -p 80:80 teaqnet-frontend
```

## Volumes and Persistence

The `docker-compose.yml` mounts the following directories for data persistence:

- `./Tea_Region_Classifier/uploads` - User uploaded images
- `./Tea_Region_Classifier/profile_pictures` - User profile pictures
- `./Tea_Region_Classifier/users.db` - SQLite database
- `./Tea_Region_Classifier/models` - ML models (read-only)

**Important**: Ensure these directories exist before starting containers, or they will be created automatically.

## Environment Variables

### Backend

- `FLASK_ENV`: Set to `production` or `development`
- `FLASK_DEBUG`: Enable/disable debug mode
- `PYTHONUNBUFFERED`: Set to `1` for real-time logs

### Frontend

- `NODE_ENV`: Set to `production` or `development`

## Health Checks

Both services include health checks:

- **Backend**: Checks `/health` endpoint every 30 seconds
- **Frontend**: Checks Nginx availability every 30 seconds

View health status:

**Linux/Mac (Bash):**
```bash
docker-compose ps
```

**Windows (PowerShell/CMD):**
```powershell
docker-compose ps
```

## Windows-Specific Notes

### PowerShell vs CMD

Most Docker commands work identically in both PowerShell and CMD. However, PowerShell is recommended for:
- Better error handling
- Modern syntax support
- Better integration with Docker Desktop

### Path Handling

Windows uses backslashes (`\`) for paths, but Docker Compose accepts both:
- `./Tea_Region_Classifier` (works in all shells)
- `.\Tea_Region_Classifier` (Windows-specific, also works)

### Line Endings

If you encounter issues with scripts or configuration files:
- Ensure files use Unix line endings (LF) or Windows line endings (CRLF) consistently
- Git can handle this automatically with `.gitattributes`

### Docker Desktop WSL 2 Backend

For best performance on Windows:
1. Enable WSL 2 in Docker Desktop settings
2. Install WSL 2 if not already installed:
   ```powershell
   wsl --install
   ```
3. Restart Docker Desktop after enabling WSL 2

## Troubleshooting

### Port Already in Use

If ports 80 or 5000 are already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "8080:80"      # Change frontend port
  - "5001:5000"    # Change backend port
```

**Windows-specific troubleshooting:**

Check which process is using a port:

**PowerShell:**
```powershell
# Check port 80
netstat -ano | findstr :80

# Check port 5000
netstat -ano | findstr :5000

# Kill process by PID (replace <PID> with actual process ID)
Stop-Process -Id <PID> -Force
```

**CMD:**
```cmd
netstat -ano | findstr :80
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Models Not Found

Ensure the `models` directory contains:
- `*.pth` files (PyTorch models)
- `*.pkl` files (scikit-learn models)
- `*.joblib` files (joblib models)
- `classes.txt` file

### Database Issues

If the database doesn't persist:
1. Check volume mounts in `docker-compose.yml`
2. Ensure `users.db` file exists or will be created
3. Check file permissions

**Windows-specific:**

If you encounter permission issues with volumes:

**PowerShell (Run as Administrator):**
```powershell
# Grant Docker access to the directory
icacls "C:\Development\Sprints\UOK\TEAQNET_APP\Tea_Region_Classifier" /grant "NT AUTHORITY\SYSTEM:(OI)(CI)F" /T
```

**Alternative**: Use Docker Desktop's file sharing settings:
1. Open Docker Desktop
2. Go to Settings → Resources → File Sharing
3. Ensure your project directory is shared
4. Apply & Restart

### Build Failures

1. **Clear Docker cache:**
   
   **Linux/Mac (Bash):**
   ```bash
   docker-compose build --no-cache
   ```
   
   **Windows (PowerShell/CMD):**
   ```powershell
   docker-compose build --no-cache
   ```

2. **Check logs:**
   
   **Linux/Mac (Bash):**
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```
   
   **Windows (PowerShell/CMD):**
   ```powershell
   docker-compose logs backend
   docker-compose logs frontend
   ```

3. **Verify dependencies:**
   - Backend: Check `requirements.txt` is valid
   - Frontend: Check `package.json` is valid

### Memory Issues

PyTorch models can be memory-intensive. If containers crash:

1. Increase Docker memory limit (Docker Desktop → Settings → Resources)
2. Use smaller models if available
3. Consider using CPU-only PyTorch builds

**Windows-specific:**

Check Docker Desktop memory allocation:
1. Open Docker Desktop
2. Go to Settings → Resources → Advanced
3. Adjust Memory slider (recommended: 4GB+)
4. Click "Apply & Restart"

Check current memory usage:

**PowerShell:**
```powershell
docker stats --no-stream
```

**CMD:**
```cmd
docker stats --no-stream
```

## Production Deployment

### Using Docker Compose

1. **Build production images:**
   
   **Linux/Mac (Bash):**
   ```bash
   docker-compose build
   ```
   
   **Windows (PowerShell/CMD):**
   ```powershell
   docker-compose build
   ```

2. **Tag and push to registry (optional):**
   
   **Linux/Mac (Bash):**
   ```bash
   docker tag teaqnet-backend your-registry/teaqnet-backend:latest
   docker tag teaqnet-frontend your-registry/teaqnet-frontend:latest
   docker push your-registry/teaqnet-backend:latest
   docker push your-registry/teaqnet-frontend:latest
   ```
   
   **Windows (PowerShell/CMD):**
   ```powershell
   docker tag teaqnet-backend your-registry/teaqnet-backend:latest
   docker tag teaqnet-frontend your-registry/teaqnet-frontend:latest
   docker push your-registry/teaqnet-backend:latest
   docker push your-registry/teaqnet-frontend:latest
   ```

3. **Deploy on server:**
   
   **Linux/Mac (Bash):**
   ```bash
   docker-compose up -d
   ```
   
   **Windows (PowerShell/CMD):**
   ```powershell
   docker-compose up -d
   ```
   
   **Note**: On Windows, you can also use `docker-compose up --build` to rebuild images before starting.

### Using Docker Swarm or Kubernetes

The `docker-compose.yml` can be adapted for:
- Docker Swarm: `docker stack deploy`
- Kubernetes: Convert using `kompose` or manually create manifests

**Windows-specific:**

Docker Swarm on Windows:

**PowerShell:**
```powershell
# Initialize swarm (if not already initialized)
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml teaqnet
```

**Note**: Docker Swarm mode is available on Windows, but Kubernetes requires WSL 2 or a Linux VM.

## Security Considerations

1. **Don't expose debug mode in production**
2. **Use environment variables for secrets** (don't hardcode)
3. **Regularly update base images** (`python:3.10-slim`, `node:20-alpine`, `nginx:alpine`)
4. **Use non-root user** in production (add to Dockerfiles if needed)
5. **Limit resource usage** with Docker resource limits

## Performance Optimization

1. **Multi-stage builds**: Already implemented for frontend
2. **Layer caching**: Dependencies installed before copying code
3. **.dockerignore**: Reduces build context size
4. **Health checks**: Enable automatic container restart

## Monitoring

View logs:

**Linux/Mac (Bash):**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Windows (PowerShell/CMD):**
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

View resource usage:

**Linux/Mac (Bash):**
```bash
docker stats
```

**Windows (PowerShell/CMD):**
```powershell
docker stats
```

## Cleanup

Remove containers and volumes:

**Linux/Mac (Bash):**
```bash
docker-compose down -v
```

**Windows (PowerShell/CMD):**
```powershell
docker-compose down -v
```

Remove images:

**Linux/Mac (Bash):**
```bash
docker rmi teaqnet-backend teaqnet-frontend
```

**Windows (PowerShell/CMD):**
```powershell
docker rmi teaqnet-backend teaqnet-frontend
```

**Note**: On Windows, if you encounter permission errors, you may need to run PowerShell as Administrator or stop containers first:
```powershell
docker-compose down
docker rmi teaqnet-backend teaqnet-frontend
```

## Comparison with start_app.py

| Feature | start_app.py | Docker |
|---------|-------------|--------|
| Platform | Local development | Any Docker host |
| Dependencies | Manual install | Automated in image |
| Ports | 5000, 5173 | 5000, 80 |
| Hot-reload | Yes | Dev mode only |
| Isolation | None | Full containerization |
| Deployment | Manual | Automated |

## Windows Quick Reference

### Common Commands

**Start services:**
```powershell
docker-compose up --build
```

**Stop services:**
```powershell
docker-compose down
```

**View logs:**
```powershell
docker-compose logs -f
```

**Rebuild without cache:**
```powershell
docker-compose build --no-cache
```

**Check running containers:**
```powershell
docker ps
```

**Check all containers (including stopped):**
```powershell
docker ps -a
```

**Remove all containers:**
```powershell
docker-compose down -v
docker system prune -a
```

**Check Docker version:**
```powershell
docker --version
docker-compose --version
```

### Windows-Specific Issues

**Issue**: "Cannot connect to Docker daemon"
- **Solution**: Ensure Docker Desktop is running
- Check system tray for Docker Desktop icon
- Restart Docker Desktop if needed

**Issue**: "Port binding failed"
- **Solution**: Check if port is in use (see Port Already in Use section)
- Run PowerShell as Administrator if needed

**Issue**: "Volume mount permission denied"
- **Solution**: Check Docker Desktop file sharing settings
- Ensure project directory is shared in Docker Desktop settings

**Issue**: "WSL 2 installation is incomplete"
- **Solution**: 
  ```powershell
  wsl --update
  wsl --set-default-version 2
  ```
- Restart Docker Desktop

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- [WSL 2 Installation Guide](https://docs.microsoft.com/en-us/windows/wsl/install)
- [Flask Deployment Guide](https://flask.palletsprojects.com/en/2.3.x/deploying/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
