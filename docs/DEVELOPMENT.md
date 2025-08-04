# Development Guide

This guide provides comprehensive information for developers working on the OneFi Financial Platform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Architecture Overview](#architecture-overview)
- [Development Workflows](#development-workflows)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js** 18+ (LTS recommended)
- **pnpm** 10.4.1+ (preferred package manager)
- **Git** for version control
- **Docker** (optional, for containerized development)

### Development Tools
- **VS Code** with recommended extensions:
  - ES7+ React/Redux/React-Native snippets
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier
  - GitLens

## Development Setup

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd diboas

# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Open browser to http://localhost:5173
```

### Environment Configuration

Create `.env.local` file:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_ENVIRONMENT=development

# Feature Flags
VITE_ENABLE_DEBUG_MODE=true
VITE_ENABLE_MOCK_DATA=true

# External Services
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ANALYTICS_ID=your-analytics-id

# Blockchain Configuration
VITE_ETHEREUM_RPC_URL=your-ethereum-rpc
VITE_POLYGON_RPC_URL=your-polygon-rpc
```

### Docker Development

```bash
# Start development environment
docker-compose -f deployment/docker-compose.development.yml up

# Start with hot reload
docker-compose up --build
```

## Architecture Overview

### Project Structure

```
src/
├── components/           # React components
│   ├── shared/          # Reusable components
│   │   ├── AccessibleButton.jsx
│   │   ├── AccessibleModal.jsx
│   │   ├── AnimatedTransitions.jsx
│   │   ├── EmptyState.jsx
│   │   ├── EnhancedLoadingScreen.jsx
│   │   ├── ErrorStates.jsx
│   │   ├── FormValidation.jsx
│   │   ├── MicroInteractions.jsx
│   │   ├── SkipLinks.jsx
│   │   └── SuccessStates.jsx
│   ├── account/         # Account management
│   ├── categories/      # Financial categories
│   ├── transactions/    # Transaction components
│   ├── yield/          # Yield strategies
│   ├── monitoring/     # Performance & security monitoring
│   └── ui/             # Base UI components
├── services/            # Business logic
│   ├── financial/      # Financial calculations
│   ├── security/       # Security services
│   ├── integrations/   # Third-party integrations
│   ├── monitoring/     # System monitoring
│   └── errorHandling/  # Error recovery
├── hooks/              # Custom React hooks
│   ├── transactions/   # Transaction hooks
│   ├── useAccessibility.jsx
│   ├── useErrorRecovery.jsx
│   ├── usePerformanceMonitoring.jsx
│   └── useSecurityMonitoring.jsx
├── utils/              # Utility functions
│   ├── accessibilityChecker.js
│   ├── logger.js
│   ├── secureLogger.js
│   └── performanceUtils.js
└── data/              # Static data
```

### Key Design Patterns

#### Event-Driven Architecture
```javascript
// DataManager serves as event bus
DataManager.emit('transaction.created', transactionData)
DataManager.on('balance.updated', handleBalanceUpdate)
```

#### Service Layer Pattern
```javascript
// Business logic in services
import { FinancialCalculations } from '@/services/financial'
import { SecurityService } from '@/services/security'

const result = await FinancialCalculations.calculatePortfolioValue(assets)
```

#### Custom Hooks Pattern
```javascript
// Encapsulate stateful logic
const { balance, updateBalance } = useBalance()
const { performanceMetrics } = usePerformanceMonitoring()
```

## Development Workflows

### Feature Development

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/user-authentication
   ```

2. **Implement Feature**
   - Write tests first (TDD approach)
   - Implement component/service
   - Add proper TypeScript types
   - Follow accessibility guidelines

3. **Quality Checks**
   ```bash
   pnpm run lint        # ESLint
   pnpm run typecheck   # TypeScript
   pnpm run test        # Unit tests
   pnpm run test:e2e    # E2E tests
   ```

4. **Code Review**
   - Create pull request
   - Automated checks must pass
   - Peer review required

### Hot Module Replacement (HMR)

The development server supports HMR for fast development:

```javascript
// Components automatically reload on changes
// State is preserved where possible
// CSS changes apply instantly
```

### Mock Data Development

Enable mock data for isolated development:

```javascript
// In .env.local
VITE_ENABLE_MOCK_DATA=true

// Usage in components
import { mockTransactionData } from '@/data/mocks'
```

## Code Standards

### TypeScript Guidelines

```typescript
// Use proper type definitions
interface TransactionData {
  id: string
  type: 'buy' | 'sell' | 'transfer'
  amount: number
  currency: string
  timestamp: Date
}

// Use generic types for reusability
interface ApiResponse<T> {
  data: T
  status: 'success' | 'error'
  message?: string
}
```

### React Component Standards

```jsx
// Functional components with proper prop types
interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 rounded-md',
        variant === 'primary' && 'bg-purple-600 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-900',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}
```

### CSS/Tailwind Standards

```jsx
// Use semantic class names
<div className="transaction-card">
  <div className="transaction-header">
    <h3 className="transaction-title">Payment to John</h3>
  </div>
</div>

// Use Tailwind utilities for spacing and layout
<div className="flex items-center space-x-4 p-6">
  <Icon className="w-6 h-6 text-purple-600" />
  <div className="flex-1">
    <p className="text-sm font-medium text-gray-900">Transaction</p>
  </div>
</div>
```

### Naming Conventions

- **Components**: PascalCase (`TransactionCard`)
- **Files**: PascalCase for components, camelCase for utilities
- **Functions**: camelCase (`calculateTotal`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **CSS Classes**: kebab-case (`transaction-card`)

## Testing Guidelines

### Test Structure

```
src/
├── __tests__/          # Global tests
├── components/
│   └── __tests__/      # Component tests
├── services/
│   └── __tests__/      # Service tests
└── utils/
    └── __tests__/      # Utility tests
```

### Unit Testing

```javascript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react'
import TransactionCard from '../TransactionCard'

describe('TransactionCard', () => {
  it('displays transaction information correctly', () => {
    const transaction = {
      id: '1',
      type: 'buy',
      amount: 100,
      currency: 'BTC'
    }

    render(<TransactionCard transaction={transaction} />)
    
    expect(screen.getByText('Buy')).toBeInTheDocument()
    expect(screen.getByText('100 BTC')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const onClickMock = jest.fn()
    render(<TransactionCard onClick={onClickMock} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(onClickMock).toHaveBeenCalled()
  })
})
```

### Integration Testing

```javascript
// Service integration testing
import { DataManager } from '@/services/DataManager'
import { FinancialCalculations } from '@/services/financial'

describe('Portfolio Integration', () => {
  it('updates portfolio value when assets change', async () => {
    // Setup
    const initialAssets = [{ type: 'BTC', amount: 1 }]
    DataManager.setAssets(initialAssets)

    // Action
    const portfolioValue = await FinancialCalculations.calculatePortfolioValue()

    // Assertion
    expect(portfolioValue).toBeGreaterThan(0)
  })
})
```

### End-to-End Testing

```javascript
// Playwright E2E tests
import { test, expect } from '@playwright/test'

test('complete transaction flow', async ({ page }) => {
  await page.goto('/')
  
  // Navigate to transaction page
  await page.getByRole('button', { name: 'Send Money' }).click()
  
  // Fill transaction form
  await page.getByLabel('Amount').fill('100')
  await page.getByLabel('Recipient').fill('john@example.com')
  
  // Submit transaction
  await page.getByRole('button', { name: 'Send' }).click()
  
  // Verify success
  await expect(page.getByText('Transaction Successful')).toBeVisible()
})
```

### Accessibility Testing

```javascript
// Automated accessibility testing
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('should not have accessibility violations', async () => {
  const { container } = render(<TransactionForm />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Performance Optimization

### Code Splitting

```javascript
// Route-based splitting
const TransactionPage = lazy(() => import('./TransactionPage'))
const AccountView = lazy(() => import('./AccountView'))

// Component-based splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'))
```

### Memoization

```javascript
// React.memo for component memoization
export default React.memo(function TransactionCard({ transaction }) {
  return <div>{transaction.amount}</div>
})

// useMemo for expensive calculations
const portfolioValue = useMemo(() => {
  return calculatePortfolioValue(assets)
}, [assets])

// useCallback for function memoization
const handleTransaction = useCallback((data) => {
  processTransaction(data)
}, [processTransaction])
```

### Bundle Analysis

```bash
# Analyze bundle size
pnpm run build --analyze

# Generate bundle report
pnpm run build:analyze
```

## Security Considerations

### Input Validation

```javascript
// Validate all user inputs
function validateTransactionAmount(amount) {
  if (typeof amount !== 'number') {
    throw new Error('Amount must be a number')
  }
  if (amount <= 0) {
    throw new Error('Amount must be positive')
  }
  if (amount > MAX_TRANSACTION_AMOUNT) {
    throw new Error('Amount exceeds maximum limit')
  }
  return true
}
```

### Secure Data Handling

```javascript
// Use secure storage for sensitive data
import { secureStorage } from '@/utils/secureStorage'

// Store encrypted data
secureStorage.setItem('userToken', token)

// Retrieve and decrypt
const token = secureStorage.getItem('userToken')
```

### Security Logging

```javascript
// Log security events
import { secureLogger } from '@/utils/secureLogger'

secureLogger.security('AUTHENTICATION_ATTEMPT', {
  userId: user.id,
  ip: request.ip,
  userAgent: request.userAgent
})
```

## Troubleshooting

### Common Issues

#### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Vite cache
rm -rf node_modules/.vite
pnpm run dev
```

#### TypeScript Errors

```bash
# Check TypeScript configuration
pnpm run typecheck

# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P > "TypeScript: Restart TS Server"
```

#### Import Errors

```javascript
// Use proper import paths
import Component from '@/components/Component' // ✅ Correct
import Component from '../../../Component'     // ❌ Avoid
```

### Performance Issues

```bash
# Profile bundle size
pnpm run build:analyze

# Check for memory leaks
# Use React DevTools Profiler
# Monitor component re-renders
```

### Debugging Tools

```javascript
// Development helpers
if (import.meta.env.DEV) {
  // Debug logging
  console.log('Debug info:', data)
  
  // Performance measurement
  console.time('Operation')
  performOperation()
  console.timeEnd('Operation')
}
```

### Environment Issues

```bash
# Check environment variables
echo $NODE_ENV
echo $VITE_API_BASE_URL

# Verify .env files are loaded
console.log(import.meta.env)
```

## Development Best Practices

### Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/new-feature
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Commit message format
# feat: new feature
# fix: bug fix
# docs: documentation update
# style: code style changes
# refactor: code refactoring
# test: add tests
# chore: maintenance tasks
```

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Accessibility requirements met
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] Documentation updated
- [ ] Error handling implemented
- [ ] TypeScript types are accurate

### Continuous Integration

The project uses GitHub Actions for CI/CD:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm run lint
      - run: pnpm run typecheck
      - run: pnpm run test
      - run: pnpm run build
```

## Resources

### Documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide)

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
- [Accessibility Insights](https://accessibilityinsights.io)

### Community
- [React Community](https://react.dev/community)
- [TypeScript Community](https://www.typescriptlang.org/community)

---

Happy coding! 🚀