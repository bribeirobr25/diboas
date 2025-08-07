/**
 * Test suite for Enhanced Transaction Error Handler
 * Tests user-friendly error communication and fund safety assurance
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import TransactionErrorHandler, { determineErrorType, ERROR_TYPES } from '../shared/TransactionErrorHandler.jsx'

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('TransactionErrorHandler', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = (props = {}) => {
    const defaultProps = {
      error: new Error('Test error'),
      transactionData: { type: 'add', amount: 100 },
      currentStep: 'Processing payment',
      onRetry: vi.fn(),
      onCancel: vi.fn(),
      onBackToDashboard: vi.fn(),
      ...props
    }

    return render(
      <BrowserRouter>
        <TransactionErrorHandler {...defaultProps} />
      </BrowserRouter>
    )
  }

  describe('Error Type Detection', () => {
    it('should detect network errors correctly', () => {
      const networkError = new Error('Network timeout occurred')
      expect(determineErrorType(networkError)).toBe('TIMEOUT_ERROR')
      
      const connectionError = new Error('Connection failed')
      expect(determineErrorType(connectionError)).toBe('NETWORK_ERROR')
    })

    it('should detect payment errors correctly', () => {
      const declinedError = new Error('Payment declined by bank')
      expect(determineErrorType(declinedError)).toBe('PAYMENT_DECLINED')
      
      const insufficientError = new Error('Insufficient funds in account')
      expect(determineErrorType(insufficientError)).toBe('INSUFFICIENT_FUNDS')
    })

    it('should detect blockchain errors correctly', () => {
      const blockchainError = new Error('Failed to broadcast transaction to blockchain')
      expect(determineErrorType(blockchainError)).toBe('BLOCKCHAIN_ERROR')
    })

    it('should detect server errors correctly', () => {
      const serverError = new Error('Internal server error 500')
      expect(determineErrorType(serverError)).toBe('SERVER_ERROR')
    })

    it('should detect validation errors correctly', () => {
      const validationError = new Error('Invalid transaction format')
      expect(determineErrorType(validationError)).toBe('VALIDATION_ERROR')
    })

    it('should fallback to unknown error for unrecognized errors', () => {
      const unknownError = new Error('Something weird happened')
      expect(determineErrorType(unknownError)).toBe('UNKNOWN_ERROR')
    })

    it('should use transaction step context for error detection', () => {
      const genericError = new Error('Error occurred')
      const errorType = determineErrorType(genericError, 'add', 'Validating payment method')
      expect(errorType).toBe('PAYMENT_DECLINED')
    })
  })

  describe('Fund Safety Communication', () => {
    it('should prominently display fund safety message', () => {
      renderComponent()
      
      const safetySection = screen.getByText('Your Funds Are Safe')
      expect(safetySection).toBeInTheDocument()
      
      const safetyMessage = screen.getByText(/Your funds are protected and no charges were made/i)
      expect(safetyMessage).toBeInTheDocument()
    })

    it('should display fund safety with shield icon', () => {
      renderComponent()
      
      const shieldIcon = document.querySelector('svg[data-icon="shield"]') || 
                        document.querySelector('.lucide-shield')
      expect(shieldIcon).toBeInTheDocument()
    })

    it('should customize fund safety message based on error type', () => {
      const networkError = new Error('Network connection failed')
      renderComponent({ error: networkError })
      
      const safetyMessage = screen.getByText(/Your funds are completely safe and no charges were made/i)
      expect(safetyMessage).toBeInTheDocument()
    })
  })

  describe('Error Information Display', () => {
    it('should display error title and description', () => {
      const networkError = new Error('Network timeout')
      renderComponent({ error: networkError })
      
      expect(screen.getByText('Transaction Timeout')).toBeInTheDocument()
      expect(screen.getByText(/The transaction took too long to process/i)).toBeInTheDocument()
    })

    it('should show transaction details when provided', () => {
      const transactionData = {
        type: 'add',
        amount: 100,
        paymentMethod: 'credit_debit_card'
      }
      
      renderComponent({ 
        transactionData,
        currentStep: 'Processing payment'
      })
      
      expect(screen.getByText('Transaction Details')).toBeInTheDocument()
      expect(screen.getByText('Add')).toBeInTheDocument()
      expect(screen.getByText('$100')).toBeInTheDocument()
      expect(screen.getByText('Credit Debit Card')).toBeInTheDocument()
      expect(screen.getByText('Processing payment')).toBeInTheDocument()
    })

    it('should display error ID for support reference', () => {
      renderComponent()
      
      const errorIdElement = screen.getByText(/Error ID: ERR-/i)
      expect(errorIdElement).toBeInTheDocument()
    })
  })

  describe('Suggested Actions', () => {
    it('should display context-appropriate suggested actions', () => {
      const paymentError = new Error('Payment declined')
      renderComponent({ error: paymentError })
      
      expect(screen.getByText(/Contact your bank to authorize diBoaS transactions/i)).toBeInTheDocument()
      expect(screen.getByText(/Try a different payment method/i)).toBeInTheDocument()
    })

    it('should show different actions for different error types', () => {
      const networkError = new Error('Network connection failed')
      renderComponent({ error: networkError })
      
      expect(screen.getByText(/Check your internet connection/i)).toBeInTheDocument()
      expect(screen.getByText(/Try again in a few moments/i)).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should display retry button for retryable errors', () => {
      const mockOnRetry = vi.fn()
      renderComponent({ onRetry: mockOnRetry })
      
      const retryButton = screen.getByText('Try Again')
      expect(retryButton).toBeInTheDocument()
      
      fireEvent.click(retryButton)
      expect(mockOnRetry).toHaveBeenCalledTimes(1)
    })

    it('should display go back button', () => {
      const mockOnCancel = vi.fn()
      renderComponent({ onCancel: mockOnCancel })
      
      const backButton = screen.getByText('Go Back')
      expect(backButton).toBeInTheDocument()
      
      fireEvent.click(backButton)
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('should display dashboard button', () => {
      const mockOnBackToDashboard = vi.fn()
      renderComponent({ onBackToDashboard: mockOnBackToDashboard })
      
      const dashboardButton = screen.getByText('Dashboard')
      expect(dashboardButton).toBeInTheDocument()
      
      fireEvent.click(dashboardButton)
      expect(mockOnBackToDashboard).toHaveBeenCalledTimes(1)
    })

    it('should handle navigation fallbacks when handlers not provided', () => {
      renderComponent({ onCancel: null, onBackToDashboard: null })
      
      const backButton = screen.getByText('Go Back')
      fireEvent.click(backButton)
      expect(mockNavigate).toHaveBeenCalledWith(-1)
      
      const dashboardButton = screen.getByText('Dashboard')
      fireEvent.click(dashboardButton)
      expect(mockNavigate).toHaveBeenCalledWith('/app')
    })
  })

  describe('Technical Details', () => {
    it('should show technical details when enabled', () => {
      const error = new Error('Detailed error message')
      error.stack = 'Error stack trace here'
      
      renderComponent({ 
        error,
        showTechnicalDetails: true 
      })
      
      const technicalDetails = screen.getByText('Technical Details (for support)')
      expect(technicalDetails).toBeInTheDocument()
      
      // Click to expand details
      fireEvent.click(technicalDetails)
      
      expect(screen.getByText('Detailed error message')).toBeInTheDocument()
    })

    it('should hide technical details when disabled', () => {
      renderComponent({ showTechnicalDetails: false })
      
      const technicalDetails = screen.queryByText('Technical Details (for support)')
      expect(technicalDetails).not.toBeInTheDocument()
    })
  })

  describe('Support Contact', () => {
    it('should display support contact information', () => {
      renderComponent()
      
      const supportText = screen.getByText(/Still having trouble\\? Our support team is here to help/i)
      expect(supportText).toBeInTheDocument()
      
      const supportLink = screen.getByText(/Contact Support \\(Reference:/i)
      expect(supportLink).toBeInTheDocument()
    })

    it('should open email support when clicked', () => {
      // Mock window.open
      const mockOpen = vi.fn()
      vi.stubGlobal('window', { ...window, open: mockOpen })
      
      renderComponent()
      
      const supportLink = screen.getByText(/Contact Support \\(Reference:/i)
      fireEvent.click(supportLink)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('mailto:support@diboas.com'),
        '_blank'
      )
      
      vi.unstubAllGlobals()
    })
  })

  describe('Severity Styling', () => {
    it('should apply correct styling for high severity errors', () => {
      const serverError = new Error('Internal server error')
      renderComponent({ error: serverError })
      
      const card = document.querySelector('.main-card')
      expect(card).toHaveClass('bg-red-100', 'border-red-300')
    })

    it('should apply correct styling for medium severity errors', () => {
      const networkError = new Error('Network error')
      renderComponent({ error: networkError })
      
      const card = document.querySelector('.main-card')
      expect(card).toHaveClass('bg-red-50', 'border-red-200')
    })

    it('should apply correct styling for low severity errors', () => {
      const insufficientError = new Error('Insufficient funds')
      renderComponent({ error: insufficientError })
      
      const card = document.querySelector('.main-card')
      expect(card).toHaveClass('bg-orange-50', 'border-orange-200')
    })
  })

  describe('Error Type Configurations', () => {
    it('should have all required error type configurations', () => {
      const requiredErrorTypes = [
        'NETWORK_ERROR',
        'PAYMENT_DECLINED', 
        'INSUFFICIENT_FUNDS',
        'TIMEOUT_ERROR',
        'SERVER_ERROR',
        'VALIDATION_ERROR',
        'BLOCKCHAIN_ERROR',
        'UNKNOWN_ERROR'
      ]
      
      requiredErrorTypes.forEach(errorType => {
        expect(ERROR_TYPES[errorType]).toBeDefined()
        expect(ERROR_TYPES[errorType].title).toBeDefined()
        expect(ERROR_TYPES[errorType].fundsImpact).toBeDefined()
        expect(ERROR_TYPES[errorType].suggestedActions).toBeDefined()
        expect(Array.isArray(ERROR_TYPES[errorType].suggestedActions)).toBe(true)
      })
    })

    it('should have proper icon components for all error types', () => {
      Object.values(ERROR_TYPES).forEach(errorConfig => {
        expect(errorConfig.icon).toBeDefined()
        expect(errorConfig.icon.type).toBeDefined() // React component
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and structure', () => {
      renderComponent()
      
      const mainCard = document.querySelector('.main-card')
      expect(mainCard).toBeInTheDocument()
      
      const errorTitle = screen.getByRole('heading', { level: 2 })
      expect(errorTitle).toBeInTheDocument()
      
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should have readable text contrast', () => {
      renderComponent()
      
      // Check that error messages use appropriate text colors
      const fundSafetyMessage = screen.getByText(/Your funds are protected/i)
      expect(fundSafetyMessage).toHaveClass('text-green-700')
    })
  })

  describe('Error Context Integration', () => {
    it('should handle different transaction types appropriately', () => {
      const transactionTypes = ['add', 'withdraw', 'send', 'buy', 'sell']
      
      transactionTypes.forEach(type => {
        const { unmount } = renderComponent({
          transactionData: { type, amount: 100 },
          currentStep: 'Processing transaction'
        })
        
        expect(screen.getByText(type.charAt(0).toUpperCase() + type.slice(1))).toBeInTheDocument()
        unmount()
      })
    })

    it('should provide contextual error messages based on transaction step', () => {
      renderComponent({
        transactionData: { type: 'add', amount: 100 },
        currentStep: 'Validating payment method',
        error: new Error('Generic error')
      })
      
      // Should detect this as a payment-related error based on step
      expect(screen.getByText(/payment method/i)).toBeInTheDocument()
    })
  })
})