# Installation Guide

Complete setup guide for the diBoaS development environment.

## Prerequisites

- **Node.js**: Version 18+ (LTS recommended)
- **pnpm**: Package manager (recommended over npm)
- **Git**: Version control
- **VS Code**: Recommended IDE with extensions

## Quick Setup

```bash
# Clone the repository
git clone <repository-url>
cd diboas

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
pnpm dev
```

## Environment Configuration

### Required Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_ENVIRONMENT=development

# Feature Flags
VITE_ENABLE_DEBUG_MODE=true
VITE_ENABLE_MOCK_DATA=true

# Integration Keys (Development)
VITE_MARKET_DATA_PROVIDER=mockup
VITE_PAYMENT_PROVIDER=mockup
```

### Optional Configuration

```bash
# Performance Monitoring
VITE_ENABLE_PERFORMANCE_MONITORING=false

# Security Features
VITE_ENABLE_CSP=true
VITE_ENABLE_RATE_LIMITING=true

# Testing
VITE_ENABLE_E2E_TESTS=false
```

## Development Tools

### Required VS Code Extensions

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-playwright.playwright"
  ]
}
```

### Optional Tools

- **React Developer Tools**: Browser extension
- **Redux DevTools**: State debugging
- **Lighthouse**: Performance auditing

## Verification

### Check Installation

```bash
# Verify Node.js version
node --version  # Should be 18+

# Verify pnpm
pnpm --version

# Run tests
pnpm test

# Build project
pnpm build
```

### Expected Output

- Development server runs on `http://localhost:5173`
- All tests pass
- Build completes without errors
- Console shows no critical errors

## Next Steps

1. **[First Steps](./FIRST_STEPS.md)** - Build your first transaction
2. **[Quick Reference](./QUICK_REFERENCE.md)** - Common commands
3. **[Development Standards](../development/STANDARDS.md)** - Code guidelines

## Troubleshooting

### Common Issues

**Port 5173 in use:**
```bash
# Use different port
pnpm dev --port 5174
```

**Module not found errors:**
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**TypeScript errors:**
```bash
# Regenerate types
pnpm build
```

### Getting Help

- Check [Development Guide](../development/STANDARDS.md)
- Review [Architecture Overview](../architecture/OVERVIEW.md)
- See [Troubleshooting](./TROUBLESHOOTING.md)