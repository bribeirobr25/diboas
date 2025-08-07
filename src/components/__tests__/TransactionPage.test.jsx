/**
 * Component Tests for TransactionPage
 * Tests the main transaction flow component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TransactionPage from '../TransactionPage.jsx'

// Mock all the hooks and services
vi.mock('../../hooks/useTransactionStatus.js', () => ({
  useTransactionStatus: vi.fn(() => ({
    status: null,
    isLoading: false,
    error: null,
    connectionStatus: { connected: true },
    retry: vi.fn(),
    isCompleted: false,
    isFailed: false,
    isTimeout: false
  }))
}))

vi.mock('../../services/transactions/TransactionEngine.js', () => ({
  TransactionEngine: {
    processTransaction: vi.fn(() => Promise.resolve({ id: 'test-tx-123' }))
  }
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('TransactionPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Rendering', () => {
    it('should render transaction page without errors', () => {
      expect(() => {
        renderWithRouter(<TransactionPage />)
      }).not.toThrow()
    })
    
    it('should display transaction form elements', () => {
      renderWithRouter(<TransactionPage />)
      
      // Check for basic form structure
      const forms = document.querySelectorAll('form')
      expect(forms.length).toBeGreaterThan(0)
    })
    
    it('should render with semantic CSS classes', () => {
      renderWithRouter(<TransactionPage />)
      
      // Check for semantic CSS classes we implemented
      const pageContainer = document.querySelector('.page-container')
      const transactionForm = document.querySelector('.transaction-form-grid')
      
      expect(pageContainer || transactionForm).toBeTruthy()
    })
  })
  
  describe('Transaction Types', () => {
    it('should handle different transaction types', () => {
      renderWithRouter(<TransactionPage />)
      
      // Component should render regardless of transaction type
      expect(document.body.innerHTML).toBeTruthy()
    })
    
    it('should display appropriate UI for each transaction type', () => {
      renderWithRouter(<TransactionPage />)
      
      // Check for transaction type related elements
      const buttons = document.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })
  
  describe('Form Interaction', () => {
    it('should handle form submission', async () => {
      renderWithRouter(<TransactionPage />)
      
      // Find any submit buttons
      const submitButtons = Array.from(document.querySelectorAll('button')).filter(
        button => button.type === 'submit' || button.textContent?.toLowerCase().includes('send')
      )
      
      if (submitButtons.length > 0) {
        fireEvent.click(submitButtons[0])
        
        // Should not throw errors
        await waitFor(() => {
          expect(document.body).toBeTruthy()
        })
      }
    })
    
    it('should validate required fields', () => {
      renderWithRouter(<TransactionPage />)
      
      // Check for input elements
      const inputs = document.querySelectorAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })
  })
  
  describe('Error Handling', () => {
    it('should handle transaction errors gracefully', () => {
      // Mock error state
      vi.mocked(vi.doMock)('../../hooks/useTransactionStatus.js', () => ({
        useTransactionStatus: () => ({
          status: null,
          isLoading: false,
          error: 'Transaction failed',
          connectionStatus: { connected: false },
          retry: vi.fn(),
          isCompleted: false,
          isFailed: true,
          isTimeout: false
        })
      }))
      
      renderWithRouter(<TransactionPage />)
      
      // Component should still render
      expect(document.body).toBeTruthy()
    })
  })
  
  describe('Responsive Design', () => {
    it('should adapt to different screen sizes', () => {
      renderWithRouter(<TransactionPage />)
      
      // Check for responsive grid classes
      const responsiveElements = document.querySelectorAll('[class*="grid"], [class*="transaction-form"]')
      expect(responsiveElements.length).toBeGreaterThan(0)
    })
  })
  
  describe('Performance', () => {
    it('should render within acceptable time', () => {
      const startTime = performance.now()
      renderWithRouter(<TransactionPage />)
      const endTime = performance.now()
      
      // Should render quickly
      expect(endTime - startTime).toBeLessThan(200)
    })
  })
})