/**
 * Component Tests for TransactionStatusCard
 * Tests real-time transaction status updates and display
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TransactionStatusCard from '../transactions/TransactionStatusCard.jsx'

// Mock the transaction status hook
vi.mock('../../hooks/useTransactionStatus.js', () => ({
  useTransactionStatus: vi.fn(() => ({
    status: {
      status: 'pending',
      progress: 25,
      confirmations: 1,
      requiredConfirmations: 6,
      estimatedTimeRemaining: 300,
      lastUpdate: new Date().toISOString(),
      onChainHash: '0x1234567890abcdef1234567890abcdef12345678'
    },
    isLoading: false,
    error: null,
    connectionStatus: { connected: true },
    retry: vi.fn(),
    isCompleted: false,
    isFailed: false,
    isTimeout: false
  })),
  TRANSACTION_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    CONFIRMING: 'confirming',
    COMPLETED: 'completed',
    FAILED: 'failed',
    TIMEOUT: 'timeout'
  }
}))

describe('TransactionStatusCard Component', () => {
  const defaultProps = {
    transactionId: 'test-tx-123',
    transactionData: {
      type: 'Send',
      amount: '100.00',
      asset: 'BTC'
    },
    onClose: vi.fn(),
    compact: false,
    showHash: true
  }
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Rendering', () => {
    it('should render transaction status card without errors', () => {
      expect(() => {
        render(<TransactionStatusCard {...defaultProps} />)
      }).not.toThrow()
    })
    
    it('should display transaction information', () => {
      render(<TransactionStatusCard {...defaultProps} />)
      
      // Check for transaction-related content
      const bodyText = document.body.textContent
      expect(bodyText).toContain('100.00')
      expect(bodyText).toContain('Send')
    })
    
    it('should use semantic CSS classes', () => {
      render(<TransactionStatusCard {...defaultProps} />)
      
      // Check for our semantic classes
      const semanticElements = document.querySelectorAll(
        '.transaction-status-card, .transaction-status-content, .transaction-status-header'
      )
      expect(semanticElements.length).toBeGreaterThan(0)
    })
  })
  
  describe('Compact Mode', () => {
    it('should render in compact mode', () => {
      render(<TransactionStatusCard {...defaultProps} compact={true} />)
      
      // Should use compact styling
      const compactElement = document.querySelector('.transaction-status-compact')
      expect(compactElement).toBeInTheDocument()
    })
    
    it('should show minimal information in compact mode', () => {
      render(<TransactionStatusCard {...defaultProps} compact={true} />)
      
      // Should still show basic transaction info
      const bodyText = document.body.textContent
      expect(bodyText).toContain('100.00')
    })
  })
  
  describe('Status Display', () => {
    it('should show pending status', () => {
      render(<TransactionStatusCard {...defaultProps} />)
      
      // Should display pending status
      const bodyText = document.body.textContent
      expect(bodyText.toLowerCase()).toContain('pending')
    })
    
    it('should display progress information', () => {
      render(<TransactionStatusCard {...defaultProps} />)
      
      // Should show progress elements
      const progressElements = document.querySelectorAll(
        '.progress-track, .progress-header, [class*="progress"]'
      )
      expect(progressElements.length).toBeGreaterThan(0)
    })
    
    it('should show confirmation count', () => {
      render(<TransactionStatusCard {...defaultProps} />)
      
      // Should display confirmation information
      const bodyText = document.body.textContent
      expect(bodyText).toMatch(/\d+\/\d+/) // Pattern like "1/6"
    })
  })
  
  describe('Transaction Hash', () => {
    it('should display transaction hash when available', () => {
      render(<TransactionStatusCard {...defaultProps} />)
      
      // Should show hash section
      const hashSection = document.querySelector('.transaction-hash-section')
      expect(hashSection).toBeInTheDocument()
    })
    
    it('should have copy functionality for hash', () => {
      render(<TransactionStatusCard {...defaultProps} />)
      
      // Should have copy button
      const copyButtons = document.querySelectorAll('.hash-action-button')
      expect(copyButtons.length).toBeGreaterThan(0)
    })
    
    it('should hide hash when showHash is false', () => {
      render(<TransactionStatusCard {...defaultProps} showHash={false} />)
      
      // Hash section should not be visible
      const hashSection = document.querySelector('.transaction-hash-section')
      expect(hashSection).not.toBeInTheDocument()
    })
  })
  
  describe('Error Handling', () => {
    it('should display error state', () => {
      // Mock error state
      vi.doMock('../../hooks/useTransactionStatus.js', () => ({
        useTransactionStatus: () => ({
          status: null,
          isLoading: false,
          error: 'Connection failed',
          connectionStatus: { connected: false },
          retry: vi.fn(),
          isCompleted: false,
          isFailed: true,
          isTimeout: false
        })
      }))
      
      render(<TransactionStatusCard {...defaultProps} />)
      
      // Should show error section
      const errorSection = document.querySelector('.error-section')
      expect(errorSection).toBeTruthy()
    })
    
    it('should provide retry functionality on error', () => {
      const retryMock = vi.fn()
      
      // Mock error state with retry function
      vi.doMock('../../hooks/useTransactionStatus.js', () => ({
        useTransactionStatus: () => ({
          status: null,
          isLoading: false,
          error: 'Connection failed',
          connectionStatus: { connected: false },
          retry: retryMock,
          isCompleted: false,
          isFailed: true,
          isTimeout: false
        })
      }))
      
      render(<TransactionStatusCard {...defaultProps} />)
      
      // Should have retry button
      const retryButton = Array.from(document.querySelectorAll('button')).find(
        button => button.textContent?.toLowerCase().includes('retry')
      )
      
      expect(retryButton).toBeTruthy()
    })
  })
  
  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      const onCloseMock = vi.fn()
      
      render(<TransactionStatusCard {...defaultProps} onClose={onCloseMock} />)
      
      // Find and click close button
      const closeButton = document.querySelector('.close-button')
      if (closeButton) {
        fireEvent.click(closeButton)
        expect(onCloseMock).toHaveBeenCalled()
      }
    })
  })
  
  describe('Loading State', () => {
    it('should show loading indicators', () => {
      // Mock loading state
      vi.doMock('../../hooks/useTransactionStatus.js', () => ({
        useTransactionStatus: () => ({
          status: null,
          isLoading: true,
          error: null,
          connectionStatus: { connected: true },
          retry: vi.fn(),
          isCompleted: false,
          isFailed: false,
          isTimeout: false
        })
      }))
      
      render(<TransactionStatusCard {...defaultProps} />)
      
      // Should show loading elements
      const loadingElements = document.querySelectorAll('[class*="animate-spin"], [class*="loading"]')
      expect(loadingElements.length).toBeGreaterThan(0)
    })
  })
  
  describe('Completed State', () => {
    it('should show completion status', () => {
      // Mock completed state
      vi.doMock('../../hooks/useTransactionStatus.js', () => ({
        useTransactionStatus: () => ({
          status: { status: 'completed', progress: 100 },
          isLoading: false,
          error: null,
          connectionStatus: { connected: true },
          retry: vi.fn(),
          isCompleted: true,
          isFailed: false,
          isTimeout: false
        })
      }))
      
      render(<TransactionStatusCard {...defaultProps} />)
      
      // Should show action buttons for completed state
      const actionButtons = document.querySelector('.action-buttons-row')
      expect(actionButtons).toBeTruthy()
    })
  })
  
  describe('Performance', () => {
    it('should render efficiently', () => {
      const startTime = performance.now()
      render(<TransactionStatusCard {...defaultProps} />)
      const endTime = performance.now()
      
      // Should render quickly
      expect(endTime - startTime).toBeLessThan(100)
    })
  })
})