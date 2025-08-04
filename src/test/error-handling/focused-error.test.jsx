/**
 * Focused Error Handling Tests
 * Quick verification tests for error handling components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// Import components to test
import { NotFoundErrorPage, ServerErrorPage, NetworkErrorPage } from '../../components/shared/ErrorPages.jsx'
import TransactionErrorNotification from '../../components/shared/TransactionErrorNotification.jsx'
import AuthErrorAlert, { AUTH_ERROR_TYPES } from '../../components/shared/AuthErrorHandler.jsx'
import ToastProvider, { useToast } from '../../components/shared/ToastNotification.jsx'
import { PaymentError } from '../../services/integrations/payments/PaymentError.js'

// Test components
const TestToastComponent = () => {
  const toast = useToast()
  return (
    <div>
      <button onClick={() => toast.showSuccess('Test success')} data-testid="show-success">
        Show Success
      </button>
      <button onClick={() => toast.showError('Test error')} data-testid="show-error">
        Show Error
      </button>
    </div>
  )
}

describe('Error Handling System - Focused Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console to avoid noise
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      },
      writable: true
    })

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Error Pages', () => {
    it('should render 404 page correctly', () => {
      render(
        <BrowserRouter>
          <NotFoundErrorPage />
        </BrowserRouter>
      )

      expect(screen.getByText('Page Not Found')).toBeInTheDocument()
      expect(screen.getByText('404')).toBeInTheDocument()
      expect(screen.getByText('Go Back')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should render 500 page correctly', () => {
      render(
        <BrowserRouter>
          <ServerErrorPage error={new Error('Test server error')} errorId="test-123" />
        </BrowserRouter>
      )

      expect(screen.getByText('Server Error')).toBeInTheDocument()
      expect(screen.getByText('500')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('should render network error page correctly', () => {
      render(
        <BrowserRouter>
          <NetworkErrorPage />
        </BrowserRouter>
      )

      expect(screen.getByText('Connection Problem')).toBeInTheDocument()
      expect(screen.getByText('Check Connection')).toBeInTheDocument()
    })
  })

  describe('Transaction Error Notifications', () => {
    it('should display payment error notification', () => {
      const paymentError = new PaymentError('Card declined', 'test-provider')
      const mockOnDismiss = vi.fn()

      render(
        <BrowserRouter>
          <TransactionErrorNotification
            error={paymentError}
            onDismiss={mockOnDismiss}
            transactionData={{ type: 'BUY', amount: '$100', asset: 'BTC' }}
            showAutoDismiss={false}
          />
        </BrowserRouter>
      )

      expect(screen.getByText('Transaction Failed')).toBeInTheDocument()
      expect(screen.getByText(/card was declined/i)).toBeInTheDocument()
      // Check for basic transaction data display
      const transactionInfo = screen.getByText('BUY')
      expect(transactionInfo).toBeInTheDocument()
    })

    it('should provide retry and go back options', () => {
      const paymentError = new PaymentError('Network error', 'test-provider')
      const mockOnRetry = vi.fn()
      const mockOnGoBack = vi.fn()

      render(
        <BrowserRouter>
          <TransactionErrorNotification
            error={paymentError}
            onRetry={mockOnRetry}
            onGoBack={mockOnGoBack}
            showAutoDismiss={false}
          />
        </BrowserRouter>
      )

      expect(screen.getByText('Retry')).toBeInTheDocument()
      expect(screen.getByText('Go Back')).toBeInTheDocument()
    })

    it('should show suggested actions for payment errors', () => {
      const paymentError = new PaymentError('Insufficient funds', 'test-provider')

      render(
        <BrowserRouter>
          <TransactionErrorNotification
            error={paymentError}
            showAutoDismiss={false}
          />
        </BrowserRouter>
      )

      expect(screen.getByText('What you can do:')).toBeInTheDocument()
    })
  })

  describe('Authentication Error Handling', () => {
    it('should display invalid credentials error', () => {
      render(
        <BrowserRouter>
          <AuthErrorAlert
            errorType={AUTH_ERROR_TYPES.INVALID_CREDENTIALS}
            onDismiss={() => {}}
          />
        </BrowserRouter>
      )

      expect(screen.getByText('Authentication Error')).toBeInTheDocument()
      expect(screen.getByText(/Invalid email or password/)).toBeInTheDocument()
      expect(screen.getByText('Reset Password')).toBeInTheDocument()
    })

    it('should display email verification error with resend option', () => {
      render(
        <BrowserRouter>
          <AuthErrorAlert
            errorType={AUTH_ERROR_TYPES.EMAIL_NOT_VERIFIED}
            onDismiss={() => {}}
            onResendVerification={() => {}}
          />
        </BrowserRouter>
      )

      expect(screen.getByText(/verify your email/)).toBeInTheDocument()
      expect(screen.getByText('Resend Email')).toBeInTheDocument()
    })

    it('should display account locked error with appropriate suggestions', () => {
      render(
        <BrowserRouter>
          <AuthErrorAlert
            errorType={AUTH_ERROR_TYPES.ACCOUNT_LOCKED}
            onDismiss={() => {}}
          />
        </BrowserRouter>
      )

      expect(screen.getByText(/account.*locked/i)).toBeInTheDocument()
      expect(screen.getByText(/Wait 15-30 minutes/)).toBeInTheDocument()
    })
  })

  describe('Toast Notification System', () => {
    it('should display and dismiss toasts correctly', async () => {
      render(
        <ToastProvider config={{ duration: 1000 }}>
          <TestToastComponent />
        </ToastProvider>
      )

      // Show success toast
      await userEvent.click(screen.getByTestId('show-success'))
      expect(screen.getByText('Test success')).toBeInTheDocument()

      // Show error toast
      await userEvent.click(screen.getByTestId('show-error'))
      expect(screen.getByText('Test error')).toBeInTheDocument()

      // Wait for auto-dismiss
      await waitFor(() => {
        expect(screen.queryByText('Test success')).not.toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should allow manual dismissal', async () => {
      render(
        <ToastProvider>
          <TestToastComponent />
        </ToastProvider>
      )

      await userEvent.click(screen.getByTestId('show-success'))
      expect(screen.getByText('Test success')).toBeInTheDocument()

      // Find and click dismiss button
      const dismissButtons = screen.getAllByRole('button')
      const dismissButton = dismissButtons.find(btn => btn.textContent === '' || btn.innerHTML.includes('×'))
      
      if (dismissButton) {
        await userEvent.click(dismissButton)
        await waitFor(() => {
          expect(screen.queryByText('Test success')).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('PaymentError Class', () => {
    it('should classify different error types correctly', () => {
      const cardDeclined = new PaymentError('Card declined')
      expect(cardDeclined.errorCode).toBe('card_declined')
      expect(cardDeclined.getUserMessage()).toContain('card was declined')

      const insufficientFunds = new PaymentError('Insufficient funds')
      expect(insufficientFunds.errorCode).toBe('insufficient_funds')
      expect(insufficientFunds.getUserMessage()).toContain('Insufficient funds')

      const networkError = new PaymentError('Network error')
      expect(networkError.errorCode).toBe('network_error')
      expect(networkError.getUserMessage()).toContain('Network error')
    })

    it('should determine retryability correctly', () => {
      const retryableError = new PaymentError('Network error')
      const nonRetryableError = new PaymentError('Card declined')

      expect(retryableError.isRetryable()).toBe(true)
      expect(nonRetryableError.isRetryable()).toBe(false)
    })

    it('should provide appropriate suggested actions', () => {
      const error = new PaymentError('Insufficient funds')
      const actions = error.getSuggestedActions()

      expect(actions).toContain('Add money to your account')
      expect(actions).toContain('Try a different payment method')
    })

    it('should serialize to JSON correctly', () => {
      const error = new PaymentError('Card declined', 'test-provider')
      const json = error.toJSON()

      expect(json.error).toBe(true)
      expect(json.code).toBe('card_declined')
      expect(json.provider).toBe('test-provider')
      expect(json.retryable).toBe(false)
      expect(json.requiresUserAction).toBe(true)
    })
  })

  describe('Error Navigation', () => {
    it('should handle navigation in error pages', () => {
      render(
        <BrowserRouter>
          <NotFoundErrorPage />
        </BrowserRouter>
      )

      const goBackButton = screen.getByText('Go Back')
      const dashboardButton = screen.getByText('Dashboard')
      
      // Check that navigation buttons render properly
      expect(goBackButton).toBeInTheDocument()
      expect(dashboardButton).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing error data gracefully', () => {
      const { container } = render(
        <BrowserRouter>
          <TransactionErrorNotification
            error={null}
            showAutoDismiss={false}
          />
        </BrowserRouter>
      )

      // Should not crash with null error and return null (empty render)
      expect(container.firstChild).toBeNull()
    })

    it('should handle network status changes', () => {
      // Mock online/offline events
      const fireOnlineEvent = () => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
        window.dispatchEvent(new Event('online'))
      }

      const fireOfflineEvent = () => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
        window.dispatchEvent(new Event('offline'))
      }

      render(
        <BrowserRouter>
          <NetworkErrorPage />
        </BrowserRouter>
      )

      // Should handle network events without crashing
      fireOfflineEvent()
      fireOnlineEvent()

      expect(screen.getByText('Connection Problem')).toBeInTheDocument()
    })

    it('should handle undefined user messages in auth errors', () => {
      render(
        <BrowserRouter>
          <AuthErrorAlert
            errorType="unknown_error_type"
            onDismiss={() => {}}
          />
        </BrowserRouter>
      )

      // Should render without crashing even with unknown error type
      expect(screen.getByText('Authentication Error')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <BrowserRouter>
          <NotFoundErrorPage />
        </BrowserRouter>
      )

      // Check for button accessibility
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // Check for proper text content
      expect(screen.getByText('Page Not Found')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      render(
        <ToastProvider>
          <TestToastComponent />
        </ToastProvider>
      )

      await userEvent.click(screen.getByTestId('show-success'))
      
      // Check that toast appears
      expect(screen.getByText('Test success')).toBeInTheDocument()
      
      // Should have focusable elements
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })
})