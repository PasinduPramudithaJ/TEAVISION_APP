# Backend Dockerfile for Flask/Python application
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install minimal system dependencies
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    libgomp1 \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
# Use opencv-python-headless instead of opencv-python (no GUI libs needed in Docker)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir Flask Flask-Cors torch torchvision Pillow numpy pandas joblib werkzeug scikit-learn matplotlib seaborn && \
    pip install --no-cache-dir opencv-python-headless

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads profile_pictures models

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Expose Flask port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

# Run the application
CMD ["python", "app.py"]
