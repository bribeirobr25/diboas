#!/bin/bash

# Deployment script for diboas application
# Usage: ./scripts/deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
PROJECT_NAME="diboas"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_DIR="/var/www/${PROJECT_NAME}"
BACKUP_DIR="/var/backups/${PROJECT_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    error "Invalid environment. Use 'staging' or 'production'"
fi

log "Starting deployment to $ENVIRONMENT environment"

# Pre-deployment checks
log "Running pre-deployment checks..."

# Check if required tools are installed
command -v node >/dev/null 2>&1 || error "Node.js is not installed"
command -v pnpm >/dev/null 2>&1 || error "pnpm is not installed"
command -v docker >/dev/null 2>&1 || error "Docker is not installed"

# Check if we're on the correct branch
if [ "$ENVIRONMENT" = "production" ]; then
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "main" ]; then
        error "Production deployments must be from main branch. Current branch: $current_branch"
    fi
fi

# Get current commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)
log "Deploying commit: $COMMIT_HASH"

# Install dependencies
log "Installing dependencies..."
pnpm install --frozen-lockfile

# Run tests
log "Running tests..."
pnpm run test || error "Tests failed"

# Run linting
log "Running code quality checks..."
pnpm run lint || error "Linting failed"

# Build application
log "Building application for $ENVIRONMENT..."
if [ "$ENVIRONMENT" = "production" ]; then
    NODE_ENV=production pnpm run build
else
    NODE_ENV=staging pnpm run build
fi

# Verify build output
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    error "Build output directory is empty or missing"
fi

log "Build completed successfully"

# Deploy using Docker Compose
log "Deploying with Docker..."

# Stop existing containers
docker-compose --profile $ENVIRONMENT down || warn "No existing containers to stop"

# Build new images
docker-compose --profile $ENVIRONMENT build

# Start new containers
docker-compose --profile $ENVIRONMENT up -d

# Wait for application to be ready
log "Waiting for application to start..."
sleep 10

# Health check
log "Running health checks..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost/health >/dev/null 2>&1; then
        log "Health check passed"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        error "Health check failed after $max_attempts attempts"
    fi
    
    log "Health check attempt $attempt/$max_attempts failed, retrying in 5 seconds..."
    sleep 5
    ((attempt++))
done

# Success notification
log "🎉 Deployment to $ENVIRONMENT completed successfully!"
log "Deployed commit: $COMMIT_HASH at $(date)"