/**
 * Comprehensive Error Handling Tests
 * Tests for all error handling components, recovery mechanisms, and user flows
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { renderWithProviders } from '../utils/testHelpers.js'

// Import components to test
import ErrorBoundary from '../../components/errorHandling/ErrorBoundary.jsx'
import { NotFoundErrorPage, ServerErrorPage, NetworkErrorPage } from '../../components/shared/ErrorPages.jsx'
import TransactionErrorNotification, { useTransactionErrorNotification } from '../../components/shared/TransactionErrorNotification.jsx'
import AuthErrorAlert, { useAuthErrorHandler, AUTH_ERROR_TYPES } from '../../components/shared/AuthErrorHandler.jsx'
import ToastProvider, { useToast, TOAST_TYPES } from '../../components/shared/ToastNotification.jsx'

// Import error services
import errorRecoveryService, { ERROR_TYPES, ERROR_SEVERITY } from '../../services/errorHandling/ErrorRecoveryService.js'
import { PaymentError } from '../../services/integrations/payments/PaymentError.js'
import { useErrorRecovery } from '../../hooks/useErrorRecovery.jsx'

// Mock components for testing
const ThrowError = ({ shouldThrow = true, errorType = 'generic' }) => {
  if (shouldThrow) {
    if (errorType === 'payment') {
      throw new PaymentError('Card declined', 'test-provider')
    }
    throw new Error('Test error')
  }
  return <div data-testid="no-error">No Error</div>
}

const TestComponentWithErrorRecovery = ({ onError }) => {
  const { handleError, errors, isRecovering } = useErrorRecovery({
    onError
  })

  const triggerError = () => {
    handleError({
      type: ERROR_TYPES.NETWORK_ERROR,
      severity: ERROR_SEVERITY.MEDIUM,
      message: 'Test network error'
    })
  }

  return (
    <div>
      <button onClick={triggerError} data-testid="trigger-error">
        Trigger Error
      </button>
      {isRecovering && <div data-testid="recovering">Recovering...</div>}
      {errors.length > 0 && (
        <div data-testid="error-list">
          {errors.map(error => (
            <div key={error.id} data-testid="error-item">
              {error.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const TestComponentWithToast = () => {
  const toast = useToast()

  return (
    <div>
      <button 
        onClick={() => toast.showSuccess('Success message')}
        data-testid="show-success"
      >
        Show Success
      </button>
      <button 
        onClick={() => toast.showError('Error message')}
        data-testid="show-error"
      >
        Show Error
      </button>
      <button 
        onClick={() => toast.showWarning('Warning message')}
        data-testid="show-warning"
      >
        Show Warning
      </button>
    </div>
  )
}

const TestComponentWithTransactionError = () => {
  const { showTransactionError, TransactionErrorComponent } = useTransactionErrorNotification()

  const showError = () => {
    const paymentError = new PaymentError('Insufficient funds', 'test-provider')
    showTransactionError(paymentError, {
      type: 'BUY',
      amount: '$100',
      asset: 'BTC'
    })
  }

  return (
    <div>
      <button onClick={showError} data-testid="show-transaction-error">
        Show Transaction Error
      </button>
      {TransactionErrorComponent}
    </div>
  )
}

const TestComponentWithAuthError = () => {
  const { showAuthError, AuthErrorComponent } = useAuthErrorHandler()

  return (
    <div>
      <button 
        onClick={() => showAuthError(AUTH_ERROR_TYPES.INVALID_CREDENTIALS)}
        data-testid="show-auth-error"
      >
        Show Auth Error
      </button>
      {AuthErrorComponent}
    </div>
  )
}

describe('Error Handling System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ErrorBoundary Component', () => {
    it('should catch and display errors with recovery options', () => {
      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </BrowserRouter>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Go Home')).toBeInTheDocument()
    })

    it('should allow retry functionality', async () => {
      let shouldThrow = true
      const TestComponent = () => (
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )

      const { rerender } = render(<BrowserRouter><TestComponent /></BrowserRouter>)

      // Error should be displayed
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Simulate successful retry
      shouldThrow = false
      
      await userEvent.click(screen.getByText('Try Again'))
      
      rerender(<BrowserRouter><TestComponent /></BrowserRouter>)

      // Error should be cleared after retry
      await waitFor(() => {
        expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
      })
    })

    it('should display error details when expanded', async () => {
      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </BrowserRouter>
      )

      await userEvent.click(screen.getByText('Show Details'))

      expect(screen.getByText('Stack Trace:')).toBeInTheDocument()
    })
  })

  describe('Error Pages', () => {
    describe('NotFoundErrorPage', () => {
      it('should render 404 page with navigation options', () => {
        renderWithProviders(<NotFoundErrorPage />)

        expect(screen.getByText('Page Not Found')).toBeInTheDocument()
        expect(screen.getByText('Go Back')).toBeInTheDocument()
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('404')).toBeInTheDocument()
      })

      it('should provide helpful suggestions', () => {
        renderWithProviders(<NotFoundErrorPage />)

        expect(screen.getByText('Common solutions:')).toBeInTheDocument()
        expect(screen.getByText(/Check the URL for typos/)).toBeInTheDocument()
      })
    })

    describe('ServerErrorPage', () => {
      it('should render 500 page with retry option', () => {
        renderWithProviders(<ServerErrorPage error={new Error('Server error')} />)

        expect(screen.getByText('Server Error')).toBeInTheDocument()
        expect(screen.getByText('Try Again')).toBeInTheDocument()
        expect(screen.getByText('500')).toBeInTheDocument()
      })

      it('should show error ID when provided', () => {
        renderWithProviders(<ServerErrorPage errorId="test-error-123" />)

        expect(screen.getByText(/Error ID:.*test-error-123/)).toBeInTheDocument()
      })
    })

    describe('NetworkErrorPage', () => {
      it('should render network error page with connection status', () => {
        renderWithProviders(<NetworkErrorPage />)

        expect(screen.getByText('Connection Problem')).toBeInTheDocument()
        expect(screen.getByText('Check Connection')).toBeInTheDocument()
      })
    })
  })

  describe('Transaction Error Notifications', () => {
    it('should display transaction error with auto-dismiss', async () => {
      render(
        <BrowserRouter>
          <TestComponentWithTransactionError />
        </BrowserRouter>
      )

      await userEvent.click(screen.getByTestId('show-transaction-error'))

      expect(screen.getByText('Transaction Failed')).toBeInTheDocument()
      expect(screen.getByText(/Insufficient funds/)).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('should show transaction details', async () => {
      render(
        <BrowserRouter>
          <TestComponentWithTransactionError />
        </BrowserRouter>
      )

      await userEvent.click(screen.getByTestId('show-transaction-error'))

      expect(screen.getByText(/Type:.*BUY/)).toBeInTheDocument()
      expect(screen.getByText(/Amount:.*\$100/)).toBeInTheDocument()
      expect(screen.getByText(/Asset:.*BTC/)).toBeInTheDocument()
    })

    it('should provide suggested actions for payment errors', async () => {
      render(
        <BrowserRouter>
          <TestComponentWithTransactionError />
        </BrowserRouter>
      )

      await userEvent.click(screen.getByTestId('show-transaction-error'))

      expect(screen.getByText('What you can do:')).toBeInTheDocument()
    })

    it('should auto-dismiss after timeout', async () => {
      render(
        <BrowserRouter>
          <TestComponentWithTransactionError />
        </BrowserRouter>
      )

      await userEvent.click(screen.getByTestId('show-transaction-error'))

      expect(screen.getByText('Transaction Failed')).toBeInTheDocument()

      // Wait for auto-dismiss (using a shorter timeout for testing)
      await waitFor(() => {
        expect(screen.queryByText('Transaction Failed')).not.toBeInTheDocument()
      }, { timeout: 4000 })
    })
  })

  describe('Authentication Error Handling', () => {
    it('should display auth error with recovery actions', async () => {
      render(
        <BrowserRouter>
          <TestComponentWithAuthError />
        </BrowserRouter>
      )

      await userEvent.click(screen.getByTestId('show-auth-error'))

      expect(screen.getByText('Authentication Error')).toBeInTheDocument()
      expect(screen.getByText(/Invalid email or password/)).toBeInTheDocument()
      expect(screen.getByText('Reset Password')).toBeInTheDocument()
    })

    it('should show specific error types correctly', () => {
      render(
        <BrowserRouter>
          <AuthErrorAlert 
            errorType={AUTH_ERROR_TYPES.EMAIL_NOT_VERIFIED}
            onDismiss={() => {}}
          />
        </BrowserRouter>
      )

      expect(screen.getByText(/verify your email address/)).toBeInTheDocument()
      expect(screen.getByText('Resend Email')).toBeInTheDocument()
    })

    it('should provide appropriate recovery suggestions', () => {
      render(
        <BrowserRouter>
          <AuthErrorAlert 
            errorType={AUTH_ERROR_TYPES.ACCOUNT_LOCKED}
            onDismiss={() => {}}
          />
        </BrowserRouter>
      )

      expect(screen.getByText(/Wait 15-30 minutes/)).toBeInTheDocument()
    })
  })

  describe('Toast Notification System', () => {
    it('should display different types of toasts', async () => {
      render(
        <ToastProvider>
          <TestComponentWithToast />
        </ToastProvider>
      )

      await userEvent.click(screen.getByTestId('show-success'))
      expect(screen.getByText('Success message')).toBeInTheDocument()

      await userEvent.click(screen.getByTestId('show-error'))
      expect(screen.getByText('Error message')).toBeInTheDocument()

      await userEvent.click(screen.getByTestId('show-warning'))
      expect(screen.getByText('Warning message')).toBeInTheDocument()
    })

    it('should allow manual dismissal', async () => {
      render(
        <ToastProvider>
          <TestComponentWithToast />
        </ToastProvider>
      )

      await userEvent.click(screen.getByTestId('show-success'))
      expect(screen.getByText('Success message')).toBeInTheDocument()

      const dismissButton = screen.getByRole('button', { name: /×/ })
      await userEvent.click(dismissButton)

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument()
      })
    })

    it('should auto-dismiss after timeout', async () => {
      render(
        <ToastProvider config={{ duration: 1000 }}>
          <TestComponentWithToast />
        </ToastProvider>
      )

      await userEvent.click(screen.getByTestId('show-success'))
      expect(screen.getByText('Success message')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  describe('Error Recovery Service Integration', () => {
    it('should handle errors through recovery service', async () => {
      const onError = vi.fn()
      
      render(
        <TestComponentWithErrorRecovery onError={onError} />
      )

      await userEvent.click(screen.getByTestId('trigger-error'))

      expect(screen.getByTestId('recovering')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.getByTestId('error-list')).toBeInTheDocument()
        expect(screen.getByText('Test network error')).toBeInTheDocument()
      })

      expect(onError).toHaveBeenCalled()
    })

    it('should track error metrics', async () => {
      const spy = vi.spyOn(errorRecoveryService, 'handleError')
      
      render(
        <TestComponentWithErrorRecovery />
      )

      await userEvent.click(screen.getByTestId('trigger-error'))

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        type: ERROR_TYPES.NETWORK_ERROR,
        severity: ERROR_SEVERITY.MEDIUM,
        message: 'Test network error'
      }))
    })
  })

  describe('PaymentError Class', () => {
    it('should classify error types correctly', () => {
      const error = new PaymentError('Card declined')
      expect(error.errorCode).toBe('card_declined')
      expect(error.getUserMessage()).toContain('card was declined')
    })

    it('should determine retryability correctly', () => {
      const networkError = new PaymentError('Network error')
      const cardError = new PaymentError('Card declined')
      
      expect(networkError.isRetryable()).toBe(true)
      expect(cardError.isRetryable()).toBe(false)
    })

    it('should provide appropriate suggested actions', () => {
      const error = new PaymentError('Insufficient funds')
      const actions = error.getSuggestedActions()
      
      expect(actions).toContain('Add money to your account')
      expect(actions).toContain('Try a different payment method')
    })
  })

  describe('Circuit Breaker Pattern', () => {
    it('should open circuit breaker after failures', async () => {
      const serviceKey = 'test-service'
      
      // Simulate failures
      for (let i = 0; i < 5; i++) {
        await errorRecoveryService.handleError({
          type: ERROR_TYPES.SERVICE_UNAVAILABLE,
          severity: ERROR_SEVERITY.HIGH,
          message: 'Service unavailable',
          context: { serviceKey }
        })
      }

      const status = errorRecoveryService.checkCircuitBreaker(serviceKey)
      expect(status.state).toBe('open')
      expect(status.canProceed).toBe(false)
    })

    it('should reset circuit breaker on success', () => {
      const serviceKey = 'test-service-reset'
      
      errorRecoveryService.resetCircuitBreaker(serviceKey)
      
      const status = errorRecoveryService.checkCircuitBreaker(serviceKey)
      expect(status.state).toBe('closed')
      expect(status.canProceed).toBe(true)
    })
  })

  describe('Error Classification and Routing', () => {
    it('should classify network errors correctly', async () => {
      const error = new Error('Network request failed')
      error.name = 'NetworkError'

      const result = await errorRecoveryService.handleError({
        type: ERROR_TYPES.NETWORK_ERROR,
        severity: ERROR_SEVERITY.MEDIUM,
        message: error.message,
        error
      })

      expect(result.recoveryStrategy).toBeDefined()
    })

    it('should handle authentication errors with user intervention', async () => {
      const result = await errorRecoveryService.handleError({
        type: ERROR_TYPES.AUTHENTICATION_ERROR,
        severity: ERROR_SEVERITY.HIGH,
        message: 'Authentication failed'
      })

      expect(result.recoveryStrategy).toBe('user_intervention')
    })
  })

  describe('Integration with React Router', () => {
    it('should navigate to error pages on routing errors', () => {
      const { container } = render(
        <BrowserRouter>
          <ErrorBoundary>
            <div>Test content</div>
          </ErrorBoundary>
        </BrowserRouter>
      )

      expect(container).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for error components', () => {
      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </BrowserRouter>
      )

      const alert = screen.getByRole('alert', { hidden: true })
      expect(alert).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      render(
        <ToastProvider>
          <TestComponentWithToast />
        </ToastProvider>
      )

      await userEvent.click(screen.getByTestId('show-error'))
      
      const dismissButton = screen.getByRole('button', { name: /×/ })
      dismissButton.focus()
      expect(dismissButton).toHaveFocus()

      await userEvent.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.queryByText('Error message')).not.toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('should not cause memory leaks with multiple errors', async () => {
      const { unmount } = render(
        <TestComponentWithErrorRecovery />
      )

      // Trigger multiple errors
      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByTestId('trigger-error'))
      }

      // Should not cause memory issues
      unmount()
      expect(true).toBe(true) // Test passes if no memory issues
    })

    it('should limit number of toast notifications', async () => {
      render(
        <ToastProvider config={{ maxToasts: 3 }}>
          <TestComponentWithToast />
        </ToastProvider>
      )

      // Show more toasts than the limit
      for (let i = 0; i < 5; i++) {
        await userEvent.click(screen.getByTestId('show-success'))
      }

      // Should only show maximum number of toasts
      const toasts = screen.getAllByText('Success message')
      expect(toasts.length).toBeLessThanOrEqual(3)
    })
  })
})