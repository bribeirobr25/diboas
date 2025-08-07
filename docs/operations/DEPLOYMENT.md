# Deployment Guide

Production deployment strategies and operational procedures for the diBoaS platform.

## Build Process

### Production Build
```bash
# Install dependencies
pnpm install

# Run production build
pnpm build

# Preview production build locally
pnpm preview
```

### Build Optimization
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and CSS optimization
- **Bundle Analysis**: Size monitoring and optimization

## Deployment Environments

### Development
- **URL**: `http://localhost:5173`
- **Features**: Hot reload, debug mode, mock data
- **Database**: Local/development database
- **Providers**: Mock service implementations

### Staging
- **URL**: Staging environment URL
- **Features**: Production-like environment for testing
- **Database**: Staging database with test data
- **Providers**: Sandbox/test provider endpoints

### Production
- **URL**: Production domain
- **Features**: Full feature set, real providers
- **Database**: Production database with real data
- **Providers**: Live payment and DeFi providers

## Docker Deployment

### Development Container
```dockerfile
# Use Node.js base image
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

### Production Container
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  diboas-app:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - api-server
  
  api-server:
    image: diboas-api:latest
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
```

## Environment Configuration

### Required Variables
```bash
# API Configuration
VITE_API_BASE_URL=https://api.diboas.com
VITE_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_MOCK_DATA=false

# Provider Configuration
VITE_MARKET_DATA_PROVIDER=coingecko
VITE_PAYMENT_PROVIDER=stripe
```

### Security Variables
```bash
# Secure credential management
VITE_ENABLE_CSP=true
VITE_ENABLE_RATE_LIMITING=true

# Authentication
AUTH_SECRET_KEY=${AUTH_SECRET}
JWT_SECRET=${JWT_SECRET}
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        run: |
          # Deployment scripts
```

### Deployment Steps
1. **Code Quality**: Lint, test, security scan
2. **Build**: Production build and optimization
3. **Security**: Dependency and vulnerability scanning
4. **Deploy**: Blue-green deployment strategy
5. **Verification**: Health checks and smoke tests
6. **Monitoring**: Post-deployment monitoring

## Health Monitoring

### Health Check Endpoints
```bash
# Application health
GET /health
Response: { status: "healthy", version: "1.0.0" }

# API health
GET /api/health
Response: { status: "healthy", database: "connected" }
```

### Monitoring Stack
- **Application**: Performance and error monitoring
- **Infrastructure**: Server and container health
- **Security**: Security event monitoring
- **Business**: Transaction and user metrics

## Scaling Strategy

### Horizontal Scaling
- **Load Balancing**: Multiple application instances
- **Database**: Read replicas and connection pooling
- **CDN**: Static asset delivery optimization
- **Caching**: Redis for session and data caching

### Performance Optimization
- **Code Splitting**: Route-based lazy loading
- **Asset Optimization**: Image compression and WebP
- **Service Worker**: Offline capability and caching
- **Database**: Query optimization and indexing

## Security Considerations

### Production Security
- **HTTPS**: SSL/TLS encryption for all traffic
- **CSP**: Content Security Policy headers
- **CORS**: Cross-origin request restrictions
- **Rate Limiting**: API and application rate limits

### Data Protection
- **Encryption**: Data encryption at rest and in transit
- **Backup**: Regular automated backups
- **Recovery**: Disaster recovery procedures
- **Compliance**: GDPR and financial regulations

## Rollback Procedures

### Deployment Rollback
```bash
# Quick rollback to previous version
kubectl rollout undo deployment/diboas-app

# Rollback to specific version
kubectl rollout undo deployment/diboas-app --to-revision=2
```

### Database Rollback
- **Migration Rollback**: Database schema rollback procedures
- **Data Backup**: Point-in-time recovery capabilities
- **Validation**: Post-rollback verification tests

## Operations Documentation

- [Monitoring](./MONITORING.md) - Observability and alerting
- [Feature Flags](./FEATURE_FLAGS_ENVIRONMENTS.md) - Environment management  
- [Accessibility](./ACCESSIBILITY.md) - WCAG compliance