#!/bin/bash

# diBoaS Deployment Script
# Handles environment-specific deployments with proper validation

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENTS=("development" "staging" "production")
REGIONS=("us-east-1" "us-west-1" "eu-west-1" "ap-southeast-1")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
diBoaS Deployment Script

Usage: $0 [OPTIONS] ENVIRONMENT [REGION]

ARGUMENTS:
    ENVIRONMENT     Target environment (development, staging, production)
    REGION          Target region (us-east-1, us-west-1, eu-west-1, ap-southeast-1)

OPTIONS:
    -h, --help      Show this help message
    -v, --version   Version to deploy (default: latest)
    -f, --force     Force deployment without confirmation
    -d, --dry-run   Show what would be deployed without actually deploying
    --no-build      Skip build step
    --no-test       Skip test step
    --rollback      Rollback to previous version

EXAMPLES:
    $0 development
    $0 staging us-east-1
    $0 production us-east-1 --version 1.2.3
    $0 production --rollback

ENVIRONMENT VARIABLES:
    VITE_PROD_API_KEY           Production API key (required for production)
    VITE_STAGING_API_KEY        Staging API key (required for staging)
    DOCKER_REGISTRY             Docker registry URL
    DEPLOY_KEY                  SSH key for deployment

EOF
}

# Parse command line arguments
ENVIRONMENT=""
REGION="global"
VERSION="latest"
FORCE=false
DRY_RUN=false
NO_BUILD=false
NO_TEST=false
ROLLBACK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        --no-build)
            NO_BUILD=true
            shift
            ;;
        --no-test)
            NO_TEST=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        -*)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            if [[ -z "$ENVIRONMENT" ]]; then
                ENVIRONMENT="$1"
            elif [[ -z "$REGION" || "$REGION" == "global" ]]; then
                REGION="$1"
            else
                log_error "Too many arguments"
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate environment
if [[ -z "$ENVIRONMENT" ]]; then
    log_error "Environment is required"
    show_help
    exit 1
fi

if [[ ! " ${ENVIRONMENTS[@]} " =~ " ${ENVIRONMENT} " ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    log_info "Valid environments: ${ENVIRONMENTS[*]}"
    exit 1
fi

if [[ "$REGION" != "global" && ! " ${REGIONS[@]} " =~ " ${REGION} " ]]; then
    log_error "Invalid region: $REGION"
    log_info "Valid regions: ${REGIONS[*]} global"
    exit 1
fi

# Environment-specific validation
validate_environment() {
    local env=$1
    
    log_info "Validating $env environment..."
    
    case $env in
        production)
            if [[ -z "$VITE_PROD_API_KEY" && "$DRY_RUN" == false ]]; then
                log_error "VITE_PROD_API_KEY is required for production deployment"
                exit 1
            fi
            if [[ "$REGION" == "global" ]]; then
                log_error "Region must be specified for production deployment"
                exit 1
            fi
            ;;
        staging)
            if [[ -z "$VITE_STAGING_API_KEY" && "$DRY_RUN" == false ]]; then
                log_warning "VITE_STAGING_API_KEY not set, using default"
            fi
            ;;
        development)
            log_info "Development environment - using default configurations"
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check required tools
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed"; exit 1; }
    command -v node >/dev/null 2>&1 || { log_error "Node.js is required but not installed"; exit 1; }
    command -v pnpm >/dev/null 2>&1 || { log_error "pnpm is required but not installed"; exit 1; }
    
    # Check Docker is running
    docker info >/dev/null 2>&1 || { log_error "Docker daemon is not running"; exit 1; }
    
    log_success "Prerequisites check passed"
}

# Run tests
run_tests() {
    if [[ "$NO_TEST" == true ]]; then
        log_warning "Skipping tests"
        return
    fi
    
    log_info "Running tests..."
    cd "$PROJECT_DIR"
    
    # Set test environment
    export NODE_ENV=test
    export VITE_APP_ENV=test
    
    # Run linting
    log_info "Running ESLint..."
    pnpm run lint || { log_error "Linting failed"; exit 1; }
    
    # Run type checking
    if [[ -f "tsconfig.json" ]]; then
        log_info "Running TypeScript checks..."
        pnpm run type-check || { log_error "Type checking failed"; exit 1; }
    fi
    
    # Run unit tests
    if [[ -f "vitest.config.js" || -f "jest.config.js" ]]; then
        log_info "Running unit tests..."
        pnpm run test || { log_error "Tests failed"; exit 1; }
    fi
    
    log_success "All tests passed"
}

# Build application
build_application() {
    if [[ "$NO_BUILD" == true ]]; then
        log_warning "Skipping build"
        return
    fi
    
    log_info "Building application for $ENVIRONMENT..."
    cd "$PROJECT_DIR"
    
    # Set build environment variables
    export NODE_ENV=production
    export VITE_APP_ENV="$ENVIRONMENT"
    export VITE_APP_REGION="$REGION"
    export VITE_APP_VERSION="$VERSION"
    export VITE_BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Load environment-specific variables
    if [[ -f ".env.$ENVIRONMENT" ]]; then
        log_info "Loading environment file: .env.$ENVIRONMENT"
        set -a
        source ".env.$ENVIRONMENT"
        set +a
    fi
    
    # Install dependencies
    log_info "Installing dependencies..."
    pnpm install --frozen-lockfile
    
    # Build the application
    log_info "Building application..."
    pnpm run build
    
    # Build Docker image
    log_info "Building Docker image..."
    docker build -f "deployment/Dockerfile.$ENVIRONMENT" -t "diboas:$VERSION" .
    
    log_success "Build completed"
}

# Deploy to environment
deploy_to_environment() {
    local env=$1
    local region=$2
    
    log_info "Deploying to $env environment in $region region..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN - Would deploy:"
        log_info "  Environment: $env"
        log_info "  Region: $region"
        log_info "  Version: $VERSION"
        log_info "  Docker Image: diboas:$VERSION"
        return
    fi
    
    cd "$PROJECT_DIR"
    
    # Use environment-specific docker-compose
    local compose_file="deployment/docker-compose.$env.yml"
    
    if [[ ! -f "$compose_file" ]]; then
        log_error "Docker compose file not found: $compose_file"
        exit 1
    fi
    
    # Set deployment environment variables
    export VERSION="$VERSION"
    export REGION="$region"
    export BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Deploy based on environment
    case $env in
        development)
            log_info "Starting development environment..."
            docker-compose -f "$compose_file" up -d
            ;;
        staging)
            log_info "Deploying to staging..."
            docker-compose -f "$compose_file" up -d
            ;;
        production)
            log_info "Deploying to production..."
            # Production deployment with zero-downtime
            docker-compose -f "$compose_file" up -d --scale diboas-app=3
            ;;
    esac
    
    # Wait for deployment to be ready
    log_info "Waiting for deployment to be ready..."
    sleep 10
    
    # Health check
    local health_url="http://localhost/health"
    if [[ "$env" == "development" ]]; then
        health_url="http://localhost:5173/health"
    fi
    
    for i in {1..30}; do
        if curl -f "$health_url" >/dev/null 2>&1; then
            log_success "Deployment is healthy"
            break
        fi
        if [[ $i -eq 30 ]]; then
            log_error "Deployment health check failed"
            exit 1
        fi
        sleep 2
    done
}

# Rollback function
rollback_deployment() {
    local env=$1
    
    log_warning "Rolling back $env deployment..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN - Would rollback $env deployment"
        return
    fi
    
    cd "$PROJECT_DIR"
    local compose_file="deployment/docker-compose.$env.yml"
    
    # Get previous version (this would integrate with your version tracking system)
    local previous_version="previous"
    
    log_info "Rolling back to version: $previous_version"
    
    export VERSION="$previous_version"
    docker-compose -f "$compose_file" up -d
    
    log_success "Rollback completed"
}

# Main deployment function
main() {
    log_info "Starting diBoaS deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Region: $REGION"
    log_info "Version: $VERSION"
    
    if [[ "$ROLLBACK" == true ]]; then
        rollback_deployment "$ENVIRONMENT"
        return
    fi
    
    # Confirmation for production
    if [[ "$ENVIRONMENT" == "production" && "$FORCE" == false && "$DRY_RUN" == false ]]; then
        echo
        log_warning "You are about to deploy to PRODUCTION!"
        log_warning "Environment: $ENVIRONMENT"
        log_warning "Region: $REGION"
        log_warning "Version: $VERSION"
        echo
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Execute deployment steps
    check_prerequisites
    validate_environment "$ENVIRONMENT"
    run_tests
    build_application
    deploy_to_environment "$ENVIRONMENT" "$REGION"
    
    log_success "Deployment completed successfully!"
    
    # Show deployment info
    echo
    log_info "Deployment Summary:"
    log_info "  Environment: $ENVIRONMENT"
    log_info "  Region: $REGION"
    log_info "  Version: $VERSION"
    log_info "  Status: Active"
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        log_info "  URL: http://localhost:5173"
    else
        log_info "  URL: https://diboas.com"
    fi
}

# Run main function
main