# Error Handling Patterns Documentation

> **Comprehensive Guide: Error Handling Architecture in diBoaS**  
> This document provides complete documentation for the error handling patterns and utilities implemented across the diBoaS financial platform.

## Table of Contents
1. [Overview](#overview)
2. [Error Handling Architecture](#error-handling-architecture)
3. [Core Utilities](#core-utilities)
4. [Implementation Patterns](#implementation-patterns)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)
7. [Testing Error Handling](#testing-error-handling)
8. [Migration Guide](#migration-guide)

---

## Overview

The diBoaS platform implements a comprehensive, multi-layered error handling system designed specifically for financial applications. This system ensures that no financial operations fail silently, provides graceful degradation, and maintains audit trails for all error conditions.

### Design Principles
- **Never Fail Silently**: All financial operations must have explicit error handling
- **Graceful Degradation**: Applications continue to function with reduced capabilities
- **User-Friendly Messages**: Technical errors are translated to user-friendly language
- **Comprehensive Logging**: All errors are logged with contextual information
- **Automatic Recovery**: System attempts recovery where possible
- **Financial Safety**: Critical financial operations have additional safeguards

---

## Error Handling Architecture

### Three-Layer Architecture

#### 1. **Component Layer** - React Error Boundaries
- **Purpose**: Catch rendering errors and prevent application crashes
- **Scope**: Individual components and component trees
- **Recovery**: UI-level recovery and fallback rendering

#### 2. **Hook Layer** - Error Handling Hooks  
- **Purpose**: Provide error handling utilities for business logic
- **Scope**: Data operations, API calls, state management
- **Recovery**: Automatic retry, fallback data, graceful degradation

#### 3. **Service Layer** - Domain Error Handling
- **Purpose**: Handle business logic and external service errors
- **Scope**: Financial calculations, integrations, data persistence
- **Recovery**: Transaction rollback, alternative providers, safe defaults

### Error Flow Diagram

```
User Action
    ↓
[Component Layer]     ← React Error Boundaries
    ↓                   (UI Errors, Rendering Errors)
[Hook Layer]          ← useErrorHandler Hook  
    ↓                   (Business Logic, API Errors)
[Service Layer]       ← Domain Services
    ↓                   (Financial Operations, External APIs)
[External Systems]    ← Third-party Services
```

---

## Core Utilities

### 1. **useErrorHandler Hook**

**Location**: `/src/hooks/useErrorHandler.jsx`

**Purpose**: Universal error handler providing comprehensive error classification, recovery strategies, and user notification.

#### Key Features
- **Automatic Error Classification**: Network, Authentication, Validation, Business Logic
- **Recovery Strategies**: Retry, Fallback, Redirect, Refresh, Ignore
- **User-Friendly Messages**: Contextual error messages for different scenarios
- **Performance Metrics**: Error tracking and analytics
- **Configurable Behavior**: Customizable recovery and notification settings

#### Basic Usage
```javascript
import { useErrorHandler } from '../hooks/useErrorHandler.jsx'

const MyComponent = () => {
  const { handleError, createSafeWrapper } = useErrorHandler({
    logErrors: true,
    autoRecovery: true,
    notifyUser: true,
    retryAttempts: 3
  })

  // Safe wrapper for risky operations
  const safeApiCall = createSafeWrapper(
    async () => {
      const data = await fetch('/api/data')
      return data.json()
    },
    {
      context: { component: 'MyComponent', operation: 'fetchData' },
      fallback: null,
      recoveryFn: async () => {
        // Custom recovery logic
        return await fetchFromCache()
      }
    }
  )

  return <div>Component content</div>
}
```

#### Error Classification System
```javascript
// Error types automatically detected
export const ERROR_TYPES = {
  NETWORK: 'network',              // Connection issues
  VALIDATION: 'validation',        // Input validation errors  
  AUTHENTICATION: 'authentication', // Auth failures
  PERMISSION: 'permission',        // Access denied
  BUSINESS_LOGIC: 'business_logic', // Application logic errors
  DATA_CORRUPTION: 'data_corruption', // Data integrity issues
  EXTERNAL_SERVICE: 'external_service', // Third-party service errors
  UNKNOWN: 'unknown'               // Unclassified errors
}

// Severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',        // Minor issues, can continue
  MEDIUM: 'medium',  // Noticeable impact, workarounds available
  HIGH: 'high',      // Significant impact, user action needed
  CRITICAL: 'critical' // Service disruption, immediate attention required
}

// Recovery strategies
export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',       // Retry the operation
  FALLBACK: 'fallback', // Use alternative data/method
  IGNORE: 'ignore',     // Continue without the operation
  REDIRECT: 'redirect', // Navigate to different page
  REFRESH: 'refresh'    // Refresh the application
}
```

### 2. **ErrorBoundary Component**

**Location**: `/src/components/shared/ErrorBoundary.jsx`

**Purpose**: General-purpose React error boundary for catching component rendering errors.

#### Features
- **Crash Prevention**: Prevents entire application crashes
- **User-Friendly UI**: Shows helpful error messages instead of blank screens
- **Retry Functionality**: Allows users to attempt recovery
- **Development Tools**: Shows detailed error information in development
- **Navigation Options**: Provides paths to recover or return to safe states

#### Usage
```javascript
import ErrorBoundary from './components/shared/ErrorBoundary.jsx'

const App = () => (
  <ErrorBoundary>
    <MyRiskyComponent />
  </ErrorBoundary>
)

// With navigation support
const AppWithNav = ({ navigate }) => (
  <ErrorBoundary navigate={navigate}>
    <MyComponent />
  </ErrorBoundary>
)

// Higher-order component version
import { withErrorBoundary } from './components/shared/ErrorBoundary.jsx'

const SafeComponent = withErrorBoundary(MyComponent)
```

### 3. **FinancialErrorBoundary Component**

**Location**: `/src/components/shared/FinancialErrorBoundary.jsx`

**Purpose**: Specialized error boundary for financial components with enhanced security logging and recovery options.

#### Features
- **Financial Context**: Understands financial operation context
- **Security Logging**: Enhanced logging for financial errors
- **Critical Error Detection**: Identifies patterns indicating financial operation issues
- **Audit Trail**: Maintains detailed error records for compliance
- **User Communication**: Specialized messaging for financial error scenarios
- **Error ID Generation**: Provides unique error IDs for support requests

#### Usage
```javascript
import FinancialErrorBoundary from './components/shared/FinancialErrorBoundary.jsx'

const TransactionComponent = ({ transactionData }) => (
  <FinancialErrorBoundary
    componentName="TransactionProcessor"
    transactionContext={{
      transactionId: transactionData.id,
      amount: transactionData.amount,
      type: transactionData.type
    }}
    userId={currentUser.id}
  >
    <TransactionProcessor data={transactionData} />
  </FinancialErrorBoundary>
)

// Higher-order component for financial operations
import { withFinancialErrorBoundary } from './components/shared/FinancialErrorBoundary.jsx'

const SafeTransactionComponent = withFinancialErrorBoundary(TransactionProcessor, {
  componentName: 'TransactionProcessor',
  transactionContext: { type: 'financial_transaction' }
})
```

---

## Implementation Patterns

### Pattern 1: Component-Level Error Handling

**Use Case**: Individual components that may encounter rendering or data loading errors.

```javascript
import { useErrorHandler } from '../hooks/useErrorHandler.jsx'
import FinancialErrorBoundary from './shared/FinancialErrorBoundary.jsx'

const TransactionDetails = ({ transactionId }) => {
  const { createSafeWrapper } = useErrorHandler({
    logErrors: true,
    autoRecovery: true,
    notifyUser: true
  })

  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadTransaction = createSafeWrapper(
    async () => {
      const data = await fetchTransaction(transactionId)
      setTransaction(data)
    },
    {
      context: { component: 'TransactionDetails', transactionId },
      fallback: () => setTransaction(null),
      recoveryFn: async () => {
        // Try to load from cache
        return await loadFromCache(transactionId)
      }
    }
  )

  useEffect(() => {
    loadTransaction().finally(() => setLoading(false))
  }, [transactionId])

  if (loading) return <LoadingSpinner />
  if (!transaction) return <TransactionNotFound />

  return (
    <FinancialErrorBoundary
      componentName="TransactionDetails"
      transactionContext={{ transactionId }}
    >
      <div className="transaction-details">
        {/* Transaction content */}
      </div>
    </FinancialErrorBoundary>
  )
}
```

### Pattern 2: Service Integration Error Handling

**Use Case**: API calls, external service integrations, and data operations.

```javascript
import { useErrorHandler } from '../hooks/useErrorHandler.jsx'

const useApiData = (endpoint, options = {}) => {
  const { handleError, createSafeWrapper } = useErrorHandler({
    logErrors: true,
    autoRecovery: true,
    retryAttempts: 3
  })

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = createSafeWrapper(
    async () => {
      setLoading(true)
      setError(null)

      const response = await fetch(endpoint, options)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
      return result
    },
    {
      context: { endpoint, operation: 'api_fetch' },
      fallback: (error) => {
        setError(error)
        return null
      },
      recoveryFn: async (errorInfo) => {
        // Try alternative endpoint or cached data
        if (errorInfo.classification.type === 'network') {
          return await fetchFromCache(endpoint)
        }
        return null
      }
    }
  )

  return { data, loading, error, refetch: fetchData }
}
```

### Pattern 3: Financial Operation Error Handling

**Use Case**: Critical financial operations requiring special handling.

```javascript
import { useErrorHandler } from '../hooks/useErrorHandler.jsx'

const useTransactionProcessor = () => {
  const { handleError, createSafeWrapper } = useErrorHandler({
    logErrors: true,
    autoRecovery: false, // Manual recovery for financial ops
    notifyUser: true
  })

  const processTransaction = createSafeWrapper(
    async (transactionData) => {
      // Pre-validation
      validateTransactionData(transactionData)

      // Execute transaction
      const result = await executeTransaction(transactionData)

      // Post-validation
      validateTransactionResult(result)

      return result
    },
    {
      context: { 
        operation: 'process_transaction',
        transactionType: transactionData?.type,
        amount: transactionData?.amount
      },
      fallback: async (error) => {
        // Log critical financial error
        await logCriticalError('TRANSACTION_FAILED', {
          error: error.message,
          transactionData: sanitizeTransactionData(transactionData)
        })
        
        // Don't provide fallback data for financial operations
        throw new Error('Transaction processing failed. Please try again.')
      },
      recoveryFn: null // No automatic recovery for financial operations
    }
  )

  return { processTransaction }
}
```

### Pattern 4: Global Error Boundary Setup

**Use Case**: Application-wide error boundary structure.

```javascript
// App.jsx
import ErrorBoundary from './components/shared/ErrorBoundary.jsx'
import { useErrorHandler } from './hooks/useErrorHandler.jsx'

const App = () => {
  const { handleError } = useErrorHandler({
    logErrors: true,
    autoRecovery: false // Let boundaries handle recovery
  })

  // Global error handlers
  useEffect(() => {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      handleError(event.reason, { source: 'unhandled_promise' })
    })

    // Global JavaScript errors
    window.addEventListener('error', (event) => {
      handleError(event.error, { source: 'global_error', url: event.filename })
    })

    return () => {
      window.removeEventListener('unhandledrejection', handleError)
      window.removeEventListener('error', handleError)
    }
  }, [handleError])

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/transaction/*" element={
            <FinancialErrorBoundary componentName="TransactionRoutes">
              <TransactionRoutes />
            </FinancialErrorBoundary>
          } />
          <Route path="/*" element={<MainRoutes />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}
```

---

## Usage Examples

### Example 1: Transaction History Component

```javascript
import { useErrorHandler } from '../hooks/useErrorHandler.jsx'
import FinancialErrorBoundary from './shared/FinancialErrorBoundary.jsx'

const TransactionHistory = ({ userId }) => {
  const { createSafeWrapper } = useErrorHandler({
    logErrors: true,
    autoRecovery: true,
    notifyUser: true
  })

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const loadTransactions = createSafeWrapper(
    async () => {
      const data = await fetchUserTransactions(userId)
      setTransactions(data)
    },
    {
      context: { component: 'TransactionHistory', userId },
      fallback: () => setTransactions([]),
      recoveryFn: async () => {
        // Try to load cached transactions
        const cached = await getCachedTransactions(userId)
        if (cached) {
          setTransactions(cached)
          return cached
        }
        return []
      }
    }
  )

  const refreshTransactions = createSafeWrapper(
    async () => {
      setLoading(true)
      await loadTransactions()
    },
    {
      context: { operation: 'refresh_transactions' },
      fallback: () => console.warn('Refresh failed, using existing data')
    }
  )

  useEffect(() => {
    loadTransactions().finally(() => setLoading(false))
  }, [userId])

  return (
    <FinancialErrorBoundary
      componentName="TransactionHistory"
      transactionContext={{ userId, transactionCount: transactions.length }}
    >
      <div className="transaction-history">
        <div className="header">
          <h2>Transaction History</h2>
          <button onClick={refreshTransactions} disabled={loading}>
            Refresh
          </button>
        </div>
        
        {loading ? (
          <LoadingState />
        ) : transactions.length === 0 ? (
          <EmptyState message="No transactions found" />
        ) : (
          <TransactionList transactions={transactions} />
        )}
      </div>
    </FinancialErrorBoundary>
  )
}
```

### Example 2: Payment Form with Error Handling

```javascript
const PaymentForm = ({ onSubmit }) => {
  const { handleError, createSafeWrapper } = useErrorHandler({
    logErrors: true,
    autoRecovery: false, // Manual recovery for payments
    notifyUser: true
  })

  const [formData, setFormData] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = (data) => {
    const errors = {}
    if (!data.amount || data.amount <= 0) {
      errors.amount = 'Amount must be greater than 0'
    }
    if (!data.paymentMethod) {
      errors.paymentMethod = 'Payment method is required'
    }
    return errors
  }

  const handleSubmit = createSafeWrapper(
    async (event) => {
      event.preventDefault()
      setSubmitting(true)
      setErrors({})

      // Client-side validation
      const validationErrors = validateForm(formData)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }

      // Submit payment
      const result = await onSubmit(formData)
      
      // Handle successful submission
      showSuccessMessage('Payment submitted successfully')
      resetForm()
    },
    {
      context: { 
        component: 'PaymentForm',
        amount: formData.amount,
        paymentMethod: formData.paymentMethod
      },
      fallback: (error) => {
        // Handle different types of payment errors
        if (error.message.includes('insufficient funds')) {
          setErrors({ amount: 'Insufficient funds for this payment' })
        } else if (error.message.includes('invalid payment method')) {
          setErrors({ paymentMethod: 'Invalid payment method selected' })
        } else {
          setErrors({ general: 'Payment failed. Please try again.' })
        }
        setSubmitting(false)
      }
    }
  )

  return (
    <FinancialErrorBoundary
      componentName="PaymentForm"
      transactionContext={{
        type: 'payment',
        amount: formData.amount
      }}
    >
      <form onSubmit={handleSubmit} className="payment-form">
        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            value={formData.amount || ''}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            className={errors.amount ? 'error' : ''}
          />
          {errors.amount && <span className="error">{errors.amount}</span>}
        </div>

        <div className="form-group">
          <label>Payment Method</label>
          <select
            value={formData.paymentMethod || ''}
            onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
            className={errors.paymentMethod ? 'error' : ''}
          >
            <option value="">Select payment method</option>
            <option value="credit_card">Credit Card</option>
            <option value="bank_account">Bank Account</option>
          </select>
          {errors.paymentMethod && <span className="error">{errors.paymentMethod}</span>}
        </div>

        {errors.general && (
          <div className="general-error">
            {errors.general}
          </div>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Processing...' : 'Submit Payment'}
        </button>
      </form>
    </FinancialErrorBoundary>
  )
}
```

---

## Best Practices

### 1. **Error Boundary Placement**
- Place error boundaries around major feature areas
- Use `FinancialErrorBoundary` for all financial operations
- Don't over-nest error boundaries - one per major component tree is sufficient

### 2. **Error Context**
- Always provide meaningful context when handling errors
- Include operation details, user context, and relevant data
- Sanitize sensitive data before logging

```javascript
// ✅ Good - Provides context
const context = {
  component: 'TransactionProcessor',
  operation: 'processPayment',
  transactionId: transaction.id,
  amount: transaction.amount,
  userId: user.id
}

// ❌ Bad - No context
const context = {}
```

### 3. **Recovery Strategies**
- Use automatic recovery for non-critical operations
- Implement manual recovery for financial operations
- Provide fallback UI states for better user experience

```javascript
// ✅ Good - Safe automatic recovery
const safeDataFetch = createSafeWrapper(fetchData, {
  recoveryFn: async () => await getCachedData(),
  fallback: defaultData
})

// ❌ Bad - Automatic recovery for financial operations
const unsafePayment = createSafeWrapper(processPayment, {
  recoveryFn: async () => await retryPayment(), // Could double-charge!
  fallback: { success: true } // Never fake financial success
})
```

### 4. **Error Messages**
- Use user-friendly language, avoid technical jargon
- Provide actionable guidance when possible
- Maintain consistency in error messaging

```javascript
// ✅ Good - User-friendly messages
const ERROR_MESSAGES = {
  NETWORK_ERROR: {
    title: 'Connection Problem',
    message: 'Unable to connect. Please check your internet connection.',
    action: 'Try Again'
  },
  INSUFFICIENT_FUNDS: {
    title: 'Insufficient Funds',
    message: 'You don\'t have enough balance for this transaction.',
    action: 'Add Funds'
  }
}

// ❌ Bad - Technical messages
const ERROR_MESSAGES = {
  HTTP_500: 'Internal server error occurred',
  VALIDATION_FAILED: 'Request validation failed at field validation layer'
}
```

### 5. **Logging and Monitoring**
- Log all financial errors with appropriate detail
- Include correlation IDs for tracking
- Sanitize sensitive data before logging

```javascript
// ✅ Good - Comprehensive logging
const logError = (error, context) => {
  logger.error('Financial operation failed', {
    errorId: generateErrorId(),
    errorType: error.name,
    message: error.message,
    context: sanitizeContext(context),
    timestamp: new Date().toISOString(),
    userId: context.userId,
    sessionId: getSessionId()
  })
}

// ❌ Bad - Insufficient logging
const logError = (error) => {
  console.error(error)
}
```

---

## Testing Error Handling

### Unit Testing Error Scenarios

```javascript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useErrorHandler } from '../hooks/useErrorHandler.jsx'

describe('useErrorHandler', () => {
  it('should handle network errors with retry', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true, json: () => ({ data: 'success' }) })

    const TestComponent = () => {
      const { createSafeWrapper } = useErrorHandler({
        retryAttempts: 2
      })

      const safeApiCall = createSafeWrapper(
        async () => {
          const response = await mockFetch()
          return response.json()
        },
        { context: { test: true } }
      )

      return (
        <button onClick={() => safeApiCall()}>
          Test API Call
        </button>
      )
    }

    render(<TestComponent />)
    fireEvent.click(screen.getByText('Test API Call'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2) // Initial call + 1 retry
    })
  })

  it('should classify errors correctly', () => {
    const { classifyError } = useErrorHandler()

    const networkError = new Error('fetch failed')
    const authError = new Error('unauthorized')
    const validationError = new Error('validation failed')

    expect(classifyError(networkError)).toEqual({
      type: 'network',
      severity: 'medium',
      recoverable: true,
      strategy: 'retry'
    })

    expect(classifyError(authError)).toEqual({
      type: 'authentication',
      severity: 'high',
      recoverable: true,
      strategy: 'redirect'
    })
  })
})
```

### Integration Testing Error Boundaries

```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../components/shared/ErrorBoundary.jsx'

const ThrowingComponent = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Normal content</div>
}

describe('ErrorBoundary', () => {
  it('should catch and display error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Normal content')).toBeInTheDocument()
  })
})
```

### End-to-End Error Testing

```javascript
// Using Playwright for E2E testing
import { test, expect } from '@playwright/test'

test('should handle payment errors gracefully', async ({ page }) => {
  await page.goto('/payment')
  
  // Fill in payment form
  await page.fill('[data-testid="amount"]', '1000')
  await page.selectOption('[data-testid="payment-method"]', 'credit_card')
  
  // Mock payment failure
  await page.route('**/api/payments', (route) => {
    route.fulfill({
      status: 400,
      body: JSON.stringify({ error: 'Insufficient funds' })
    })
  })
  
  // Submit form
  await page.click('[data-testid="submit-payment"]')
  
  // Check error handling
  await expect(page.locator('[data-testid="error-message"]')).toContainText('Insufficient funds')
  await expect(page.locator('[data-testid="payment-form"]')).toBeVisible()
  await expect(page.locator('[data-testid="submit-payment"]')).toBeEnabled()
})
```

---

## Migration Guide

### Step 1: Identify Components Needing Error Handling

```bash
# Find components without error handling
grep -r "fetch\|axios\|api" src/components --include="*.jsx" | \
  grep -v "useErrorHandler\|ErrorBoundary"
```

### Step 2: Add Error Boundaries

```javascript
// Before: No error boundary
const TransactionPage = () => {
  return <TransactionForm />
}

// After: With error boundary
const TransactionPage = () => {
  return (
    <FinancialErrorBoundary componentName="TransactionPage">
      <TransactionForm />
    </FinancialErrorBoundary>
  )
}
```

### Step 3: Replace Try-Catch with useErrorHandler

```javascript
// Before: Manual try-catch
const MyComponent = () => {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data')
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setData(null)
      }
    }
    
    fetchData()
  }, [])
}

// After: Using useErrorHandler
const MyComponent = () => {
  const { createSafeWrapper } = useErrorHandler()
  const [data, setData] = useState(null)
  
  const fetchData = createSafeWrapper(
    async () => {
      const response = await fetch('/api/data')
      const result = await response.json()
      setData(result)
    },
    {
      context: { component: 'MyComponent' },
      fallback: () => setData(null)
    }
  )
  
  useEffect(() => {
    fetchData()
  }, [])
}
```

### Step 4: Update Service Layer

```javascript
// Before: Service without error handling
class ApiService {
  async getData() {
    const response = await fetch('/api/data')
    return response.json()
  }
}

// After: Service with error handling
class ApiService {
  constructor() {
    this.errorHandler = new ErrorHandler({
      logErrors: true,
      retryAttempts: 3
    })
  }

  async getData() {
    return this.errorHandler.safeExecute(
      async () => {
        const response = await fetch('/api/data')
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response.json()
      },
      {
        context: { service: 'ApiService', method: 'getData' },
        recoveryStrategy: 'retry'
      }
    )
  }
}
```

---

## Conclusion

The diBoaS error handling system provides comprehensive, reliable error management specifically designed for financial applications. By following these patterns and best practices, developers can ensure that:

- **No financial operations fail silently**
- **Users receive clear, actionable error messages**
- **Applications gracefully degrade when services are unavailable**
- **All errors are properly logged and monitored**
- **Critical financial operations have appropriate safeguards**

### Quick Reference

- **Use `useErrorHandler`** for business logic and API operations
- **Use `ErrorBoundary`** for general component error catching
- **Use `FinancialErrorBoundary`** for all financial operations
- **Provide context** with all error handling operations
- **Test error scenarios** as part of your testing strategy
- **Log appropriately** while protecting sensitive data

For additional support or questions about error handling patterns, refer to the utility source code or consult with the development team.

---

*This documentation covers the comprehensive error handling architecture implemented across the diBoaS platform. Regular updates to this document ensure it remains current with system evolution.*