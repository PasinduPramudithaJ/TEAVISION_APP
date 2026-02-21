# Frontend Dockerfile for React/Vite application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
# This proxies all backend API routes to the backend service
# Using resolver and variable in proxy_pass to resolve backend at request time
RUN echo 'resolver 127.0.0.11 valid=30s; \
server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    client_max_body_size 50M; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    # Proxy all API routes to backend \
    location ~ ^/(api|register|login|predict|crop_reflection|predict_with_features|health|profile_pictures|uploads) { \
        set $backend http://backend:5000; \
        proxy_pass $backend; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_read_timeout 300s; \
        proxy_connect_timeout 75s; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
