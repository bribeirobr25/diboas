/**
 * Error Handling Test Utilities
 * Helper functions and mocks for testing error handling components
 */

import { vi } from 'vitest'
import { PaymentError } from '../../services/integrations/payments/PaymentError.js'
import { AUTH_ERROR_TYPES } from '../../components/shared/AuthErrorHandler.jsx'
import { ERROR_TYPES, ERROR_SEVERITY } from '../../services/errorHandling/ErrorRecoveryService.js'

/**
 * Mock Payment Errors
 */
export const createMockPaymentError = (type = 'card_declined', provider = 'test-provider') => {
  const errorMessages = {
    insufficient_funds: 'Insufficient funds',
    card_declined: 'Card declined', 
    invalid_amount: 'Invalid amount',
    network_error: 'Network error',
    provider_unavailable: 'Provider unavailable',
    authentication_failed: 'Authentication failed',
    fraud_detected: 'Fraud detected',
    expired_card: 'Card expired',
    invalid_card: 'Invalid card',
    processing_error: 'Processing error',
    timeout: 'Request timeout',
    rate_limit: 'Rate limit exceeded'
  }

  return new PaymentError(errorMessages[type] || 'Unknown error', provider)
}

/**
 * Mock Transaction Data
 */
export const createMockTransactionData = (overrides = {}) => ({
  id: 'tx_123456',
  type: 'BUY',
  amount: '$100.00',
  asset: 'BTC',
  status: 'failed',
  timestamp: new Date(),
  ...overrides
})

/**
 * Mock Error Recovery Service
 */
export const mockErrorRecoveryService = () => {
  const mockService = {
    handleError: vi.fn().mockResolvedValue({
      errorId: 'error_123',
      recoveryStrategy: 'retry',
      recoveryResult: { success: true },
      canRecover: true
    }),
    checkCircuitBreaker: vi.fn().mockReturnValue({
      canProceed: true,
      state: 'closed'
    }),
    resetCircuitBreaker: vi.fn(),
    getErrorStatistics: vi.fn().mockReturnValue({
      total: 0,
      byType: {},
      bySeverity: {},
      recoverySuccess: 0,
      topErrors: []
    })
  }

  return mockService
}

/**
 * Mock Browser APIs
 */
export const mockBrowserAPIs = () => {
  // Mock navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true
  })

  // Mock clipboard API
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined)
    }
  })

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
  })

  // Mock window.history
  Object.defineProperty(window, 'history', {
    value: {
      back: vi.fn(),
      forward: vi.fn(),
      go: vi.fn(),
      pushState: vi.fn(),
      replaceState: vi.fn(),
      length: 1
    }
  })

  return {
    localStorageMock,
    sessionStorageMock
  }
}

/**
 * Mock Network Events
 */
export const mockNetworkEvents = () => {
  const fireOnlineEvent = () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
    window.dispatchEvent(new Event('online'))
  }

  const fireOfflineEvent = () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
    window.dispatchEvent(new Event('offline'))
  }

  return {
    fireOnlineEvent,
    fireOfflineEvent
  }
}

/**
 * Error Test Scenarios
 */
export const errorTestScenarios = {
  // Payment Error Scenarios
  paymentErrors: {
    insufficientFunds: {
      error: createMockPaymentError('insufficient_funds'),
      expectedMessage: /insufficient funds/i,
      expectedActions: ['Add money', 'Try a different payment method'],
      retryable: false
    },
    cardDeclined: {
      error: createMockPaymentError('card_declined'),
      expectedMessage: /card.*declined/i,
      expectedActions: ['Check your card details', 'Try a different card'],
      retryable: false
    },
    networkError: {
      error: createMockPaymentError('network_error'),
      expectedMessage: /network.*error/i,
      expectedActions: ['Check your internet connection'],
      retryable: true
    }
  },

  // Authentication Error Scenarios
  authErrors: {
    invalidCredentials: {
      type: AUTH_ERROR_TYPES.INVALID_CREDENTIALS,
      expectedMessage: /invalid email or password/i,
      expectedActions: ['Reset Password', 'Create Account']
    },
    emailNotVerified: {
      type: AUTH_ERROR_TYPES.EMAIL_NOT_VERIFIED,
      expectedMessage: /verify your email/i,
      expectedActions: ['Resend Email']
    },
    accountLocked: {
      type: AUTH_ERROR_TYPES.ACCOUNT_LOCKED,
      expectedMessage: /account.*locked/i,
      expectedActions: ['Wait 15-30 minutes']
    }
  },

  // Network Error Scenarios
  networkErrors: {
    offline: {
      type: 'offline',
      expectedMessage: /connection.*problem/i,
      expectedActions: ['Check Connection']
    },
    serverError: {
      type: 'server_error',
      expectedMessage: /server.*error/i,
      expectedActions: ['Try Again']
    }
  }
}

/**
 * Wait for error recovery
 */
export const waitForErrorRecovery = async (waitForFn) => {
  await waitForFn(() => {
    expect(document.querySelector('[data-testid="recovering"]')).not.toBeInTheDocument()
  }, { timeout: 3000 })
}

/**
 * Wait for toast dismissal
 */
export const waitForToastDismissal = async (waitForFn, message) => {
  await waitForFn(() => {
    expect(screen.queryByText(message)).not.toBeInTheDocument()
  }, { timeout: 6000 })
}

/**
 * Simulate Error Boundary Error
 */
export class TestErrorComponent {
  constructor(shouldThrow = true, errorType = 'generic') {
    this.shouldThrow = shouldThrow
    this.errorType = errorType
  }

  render() {
    if (this.shouldThrow) {
      switch (this.errorType) {
        case 'payment':
          throw createMockPaymentError('card_declined')
        case 'network':
          const networkError = new Error('Network request failed')
          networkError.name = 'NetworkError'
          throw networkError
        case 'chunk':
          const chunkError = new Error('Loading chunk 1 failed')
          chunkError.name = 'ChunkLoadError'
          throw chunkError
        default:
          throw new Error('Test error')
      }
    }
    return '<div data-testid="no-error">No Error</div>'
  }
}

/**
 * Mock Error Recovery Hooks
 */
export const createMockErrorRecoveryHook = (initialState = {}) => {
  const defaultState = {
    errors: [],
    isRecovering: false,
    recoveryStatus: null,
    hasErrors: false,
    latestError: null,
    ...initialState
  }

  return {
    ...defaultState,
    handleError: vi.fn().mockImplementation(async (error) => {
      return {
        errorId: 'test-error-' + Date.now(),
        recoveryStrategy: 'retry',
        recoveryResult: { success: true },
        canRecover: true
      }
    }),
    clearErrors: vi.fn(),
    retryOperation: vi.fn().mockImplementation(async (operation) => {
      return await operation()
    })
  }
}

/**
 * Mock Toast Hook
 */
export const createMockToastHook = () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
  showLoading: vi.fn(),
  showNetworkError: vi.fn(),
  showNetworkRestored: vi.fn(),
  addToast: vi.fn(),
  removeToast: vi.fn(),
  clearAllToasts: vi.fn(),
  toasts: []
})

/**
 * Create Error Test Environment
 */
export const createErrorTestEnvironment = () => {
  const mocks = mockBrowserAPIs()
  const networkEvents = mockNetworkEvents()
  const errorService = mockErrorRecoveryService()

  // Setup global error event listeners for testing
  const globalErrors = []
  const originalErrorHandler = window.onerror

  window.onerror = (message, source, lineno, colno, error) => {
    globalErrors.push({ message, source, lineno, colno, error })
    return true // Prevent default browser error handling
  }

  const cleanup = () => {
    window.onerror = originalErrorHandler
    vi.restoreAllMocks()
  }

  return {
    mocks,
    networkEvents,
    errorService,
    globalErrors,
    cleanup
  }
}

/**
 * Assert Error State
 */
export const assertErrorState = (screen, expectations) => {
  const {
    hasError = false,
    errorMessage = null,
    hasRetryButton = false,
    hasGoBackButton = false,
    hasCloseButton = false,
    severity = null
  } = expectations

  if (hasError && errorMessage) {
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  }

  if (hasRetryButton) {
    expect(screen.getByText(/try again|retry/i)).toBeInTheDocument()
  }

  if (hasGoBackButton) {
    expect(screen.getByText(/go back|back/i)).toBeInTheDocument()
  }

  if (hasCloseButton) {
    expect(screen.getByRole('button', { name: /close|×/i })).toBeInTheDocument()
  }

  if (severity) {
    expect(screen.getByText(severity.toUpperCase())).toBeInTheDocument()
  }
}

/**
 * Simulate User Actions
 */
export const simulateUserActions = {
  triggerNetworkError: () => {
    window.dispatchEvent(new Event('offline'))
  },
  
  restoreNetwork: () => {
    window.dispatchEvent(new Event('online'))
  },
  
  simulateUnhandledRejection: (reason = 'Test unhandled rejection') => {
    window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.reject(reason),
      reason
    }))
  },

  simulateResourceLoadError: (src = 'test-resource.js') => {
    const event = new Event('error')
    event.target = { tagName: 'SCRIPT', src }
    window.dispatchEvent(event)
  }
}

export default {
  createMockPaymentError,
  createMockTransactionData,
  mockErrorRecoveryService,
  mockBrowserAPIs,
  mockNetworkEvents,
  errorTestScenarios,
  waitForErrorRecovery,
  waitForToastDismissal,
  TestErrorComponent,
  createMockErrorRecoveryHook,
  createMockToastHook,
  createErrorTestEnvironment,
  assertErrorState,
  simulateUserActions
}