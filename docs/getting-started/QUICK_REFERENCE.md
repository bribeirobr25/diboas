# Quick Reference Guide

Essential commands, patterns, and concepts for diBoaS development.

## Essential Commands

### Development
```bash
pnpm dev              # Start development server
pnpm build             # Build for production
pnpm preview           # Preview production build
pnpm test              # Run all tests
pnpm test:watch        # Run tests in watch mode
pnpm lint              # Check code quality
pnpm format            # Format code with Prettier
```

### Testing
```bash
pnpm test:unit         # Unit tests only
pnpm test:integration  # Integration tests
pnpm test:e2e          # End-to-end tests
pnpm test:coverage     # Test coverage report
```

### Utilities
```bash
pnpm reset-data        # Reset to clean state
pnpm logs              # View application logs
pnpm analyze           # Bundle analyzer
pnpm validate          # Validate environment
```

## URL Patterns

### Transaction Routes
```bash
# Banking Operations
/category/banking/add      # Add funds
/category/banking/send     # Send money
/category/banking/withdraw # Withdraw funds

# Investment Operations  
/category/investment/buy   # Buy assets
/category/investment/sell  # Sell assets

# Legacy Routes (still supported)
/add, /send, /buy, /sell, /withdraw
```

### Application Routes
```bash
/                     # Landing page
/app                  # Main dashboard
/account              # Account settings
/transaction          # Transaction history
```

## Transaction Types

| Type | Category | Description | Fee Structure |
|------|----------|-------------|---------------|
| `add` | Banking | Add funds to account | Platform + Provider |
| `send` | Banking | Send to another user | Platform + Network |
| `withdraw` | Banking | Withdraw to bank | Platform + Provider |
| `buy` | Investment | Buy crypto/assets | Platform + Network |
| `sell` | Investment | Sell crypto/assets | Platform + Network |

## Fee Calculation

```javascript
// Fee structure for transactions
const feeStructure = {
  platform: 0.5,    // Platform fee (%)
  provider: 0.25,   // Provider fee (%)
  network: 0.001,   // Network fee (fixed)
  minimum: 0.10,    // Minimum fee
  maximum: 25.00    // Maximum fee
}
```

## Balance Types

```javascript
const balanceStructure = {
  totalUSD: 1000,           // Total balance
  availableForSpending: 750, // Available for transactions
  investedAmount: 200,      // Currently invested
  strategyBalance: 50,      // In goal strategies
  breakdown: {
    cash: 750,
    crypto: 150,
    stocks: 50,
    defi: 50
  }
}
```

## Common Patterns

### Component Structure
```javascript
// Standard component pattern
import { useErrorHandler } from '../hooks/useErrorHandler.jsx'
import { FinancialErrorBoundary } from './shared/FinancialErrorBoundary.jsx'

const MyComponent = () => {
  const { createSafeWrapper } = useErrorHandler()
  
  return (
    <FinancialErrorBoundary componentName="MyComponent">
      {/* Component content */}
    </FinancialErrorBoundary>
  )
}
```

### API Calls
```javascript
// Standard API call pattern
const fetchData = createSafeWrapper(
  async () => {
    const response = await fetch('/api/data')
    return response.json()
  },
  {
    context: { component: 'MyComponent' },
    fallback: defaultData,
    recoveryFn: () => getCachedData()
  }
)
```

### Error Handling
```javascript
// Error handling pattern
try {
  await processTransaction(data)
} catch (error) {
  handleError(error, {
    context: { operation: 'transaction', type: data.type }
  })
}
```

## Environment Variables

### Required
```bash
VITE_API_BASE_URL          # API endpoint
VITE_ENVIRONMENT           # Environment name
```

### Optional
```bash
VITE_ENABLE_DEBUG_MODE     # Debug logging
VITE_ENABLE_MOCK_DATA      # Use mock providers
VITE_ENABLE_PERFORMANCE    # Performance monitoring
```

## Testing Patterns

### Component Testing
```javascript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Integration Testing
```javascript
import { test, expect } from '@playwright/test'

test('user can add funds', async ({ page }) => {
  await page.goto('/category/banking/add')
  await page.fill('[data-testid="amount"]', '100')
  await page.click('[data-testid="submit"]')
  await expect(page.locator('.success-message')).toBeVisible()
})
```

## File Structure

```bash
src/
├── components/           # React components
│   ├── shared/          # Reusable components
│   ├── categories/      # Transaction categories
│   └── transactions/    # Transaction-specific
├── hooks/               # Custom React hooks
├── services/            # Business logic
├── utils/               # Utilities and helpers
├── domains/             # Domain-driven design
└── config/              # Configuration files
```

## Debugging Tips

### Browser DevTools
```javascript
// Check application state
window.diboas_debug_state

// Reset application data  
window.resetDiBoaSData()

// Check clean state
window.checkCleanState()
```

### Console Commands
```bash
# View component tree
React DevTools > Components

# Check performance
Lighthouse > Performance

# Monitor network
Network tab > Filter by Fetch/XHR
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 5173 in use | `pnpm dev --port 5174` |
| Module not found | `rm -rf node_modules && pnpm install` |
| Test failures | `pnpm test:unit --reporter=verbose` |
| Build errors | `pnpm build --debug` |
| TypeScript errors | Check `tsconfig.json` configuration |

## Key Files

| File | Purpose |
|------|---------|
| `/src/App.jsx` | Main application component |
| `/src/components/TransactionPage.jsx` | Transaction processing |
| `/src/services/DataManager.js` | Central data management |
| `/src/hooks/useTransactions.jsx` | Transaction state hook |
| `/vite.config.js` | Build configuration |

## Documentation Links

- [Installation](./INSTALLATION.md) - Setup guide
- [Architecture](../architecture/OVERVIEW.md) - System design
- [Transactions](../transactions/OVERVIEW.md) - Transaction system
- [Development](../development/STANDARDS.md) - Code standards
- [Testing](../development/TESTING.md) - Testing guide