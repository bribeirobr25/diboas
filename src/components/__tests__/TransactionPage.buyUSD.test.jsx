/**
 * TransactionPage Buy USD Prevention Test
 * Tests to ensure Buy USD transactions are not allowed
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import React from 'react'
import TransactionPage from '../TransactionPage.jsx'

// Mock the modules
vi.mock('../../services/DataManager.js', () => ({
  default: {
    getBalance: vi.fn(() => ({ 
      totalAmount: 1000, 
      availableForSpending: 1000,
      pendingAmount: 0,
      investedAmount: 0,
      assets: {}
    })),
    addTransaction: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    emit: vi.fn()
  },
  dataManager: {
    getBalance: vi.fn(() => ({ 
      totalAmount: 1000, 
      availableForSpending: 1000,
      pendingAmount: 0,
      investedAmount: 0,
      assets: {}
    })),
    addTransaction: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    emit: vi.fn()
  }
}))

vi.mock('../../services/transactions/index.js', () => ({
  transactionManager: {
    processTransaction: vi.fn(() => Promise.resolve({
      success: false,
      error: 'Cannot buy USD. Please select a cryptocurrency or tokenized asset'
    }))
  }
}))

vi.mock('../../hooks/useDebounce.js', () => ({
  useDebounce: (value) => value
}))

vi.mock('../../hooks/useValueDebounce.js', () => ({
  useValueDebounce: vi.fn().mockImplementation((value) => ({
    debouncedValue: value,
    isPending: false
  }))
}))

// Mock transaction hooks
vi.mock('../../hooks/transactions/index.js', () => ({
  useWalletBalance: () => ({
    balance: { 
      totalAmount: 1000, 
      availableForSpending: 1000,
      pendingAmount: 0,
      investedAmount: 0,
      assets: {}
    }
  }),
  useFeeCalculator: () => ({
    fees: { total: 0 },
    calculateFees: vi.fn()
  }),
  useTransactionValidation: () => ({
    validationErrors: {},
    validateTransaction: vi.fn(),
    isValidating: false
  }),
  useTransactionFlow: () => ({
    flowState: 'idle',
    flowData: null,
    flowError: null,
    executeTransactionFlow: vi.fn(),
    confirmTransaction: vi.fn(),
    resetFlow: vi.fn()
  })
}))

// Mock child components
vi.mock('../shared/PageHeader.jsx', () => ({
  default: () => <div data-testid="page-header">Page Header</div>
}))

vi.mock('../transactions/TransactionTypeSelector.jsx', () => ({
  default: ({ transactionType, setTransactionType }) => (
    <div data-testid="transaction-type-selector">
      <button onClick={() => setTransactionType('buy')}>Buy</button>
      <div>Current: {transactionType}</div>
    </div>
  )
}))

vi.mock('../transactions/TransactionForm.jsx', () => ({
  default: ({ transactionType, selectedAsset, setSelectedAsset }) => (
    <div data-testid="transaction-form">
      <input
        data-testid="amount-input"
        type="number"
        placeholder="Amount"
      />
      
      {transactionType === 'buy' && (
        <select
          data-testid="asset-selector"
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
        >
          <option value="USD">USD</option>
          <option value="BTC">Bitcoin</option>
          <option value="ETH">Ethereum</option>
          <option value="SOL">Solana</option>
          <option value="PAXG">PAX Gold</option>
        </select>
      )}
    </div>
  )
}))

vi.mock('../transactions/TransactionSummary.jsx', () => ({
  default: ({ transactionType, selectedAsset, isTransactionValid }) => (
    <div data-testid="transaction-summary">
      <div>Type: {transactionType}</div>
      <div>Asset: {selectedAsset}</div>
      <button
        data-testid="start-transaction"
        disabled={!isTransactionValid}
      >
        Start Transaction
      </button>
    </div>
  )
}))

describe('TransactionPage - Buy USD Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('URL Parameter Handling', () => {
    it('should read asset parameter from URL for buy transactions', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/category/investment/buy?asset=ETH']}>
            <TransactionPage transactionType="buy" category="investment" />
          </MemoryRouter>
        )
      })

      await waitFor(() => {
        const assetSelector = screen.getByTestId('asset-selector')
        expect(assetSelector).toHaveValue('ETH')
      })
    })

    it('should handle tokenized assets from URL', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/category/investment/buy?asset=PAXG']}>
            <TransactionPage transactionType="buy" category="investment" />
          </MemoryRouter>
        )
      })

      await waitFor(() => {
        const assetSelector = screen.getByTestId('asset-selector')
        expect(assetSelector).toHaveValue('PAXG')
      })
    })
  })

  describe('Buy USD Prevention Core Functionality', () => {
    it('should prevent Buy USD through TransactionEngine validation', async () => {
      // This tests the TransactionEngine level validation we added
      const { TransactionEngine } = await import('../../services/transactions/TransactionEngine.js')
      const engine = new TransactionEngine()
      
      const validation = await engine.validateTransaction('user123', {
        type: 'buy',
        amount: '100',
        asset: 'USD'
      })
      
      expect(validation.isValid).toBe(false)
      expect(validation.error).toBe('Cannot buy USD. Please select a cryptocurrency or tokenized asset')
    })

    it('should allow buy transaction with valid cryptocurrency', async () => {
      const { TransactionEngine } = await import('../../services/transactions/TransactionEngine.js')
      const engine = new TransactionEngine()
      
      const validation = await engine.validateTransaction('user123', {
        type: 'buy',
        amount: '100',
        asset: 'BTC'
      })
      
      expect(validation.isValid).toBe(true)
    })

    it('should prevent Buy USD through useTransactionValidation hook', async () => {
      const { useTransactionValidation } = await import('../../hooks/transactions/useTransactionValidation.js')
      
      // Create a test component to use the hook
      let validationResult
      const TestComponent = () => {
        const { validateTransaction } = useTransactionValidation()
        
        React.useEffect(() => {
          validateTransaction({
            type: 'buy',
            amount: '100',
            asset: 'USD'
          }).then(result => {
            validationResult = result
          })
        }, [validateTransaction])
        
        return <div>Test</div>
      }
      
      render(<TestComponent />)
      
      await waitFor(() => {
        expect(validationResult).toBeDefined()
        expect(validationResult.isValid).toBe(false)
        expect(validationResult.errors.asset.message).toBe('Cannot buy USD. Please select a cryptocurrency or tokenized asset')
      })
    })
  })

  describe('Integration with Investment Category', () => {
    it('should properly handle navigation from Investment category with asset parameter', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/category/investment/buy?asset=ETH']}>
            <TransactionPage transactionType="buy" category="investment" />
          </MemoryRouter>
        )
      })

      // Verify ETH is selected
      await waitFor(() => {
        const assetSelector = screen.getByTestId('asset-selector')
        expect(assetSelector).toHaveValue('ETH')
      })

      // Verify transaction type is buy
      expect(screen.getByText('Type: buy')).toBeInTheDocument()
    })

    it('should allow cryptocurrency selection for buy transactions', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/category/investment/buy?asset=BTC']}>
            <TransactionPage transactionType="buy" category="investment" />
          </MemoryRouter>
        )
      })

      await waitFor(() => {
        const assetSelector = screen.getByTestId('asset-selector')
        expect(assetSelector).toHaveValue('BTC')
      })

      // Verify we can change to other cryptocurrencies
      const assetSelector = screen.getByTestId('asset-selector')
      
      await act(async () => {
        fireEvent.change(assetSelector, { target: { value: 'ETH' } })
      })
      
      expect(assetSelector).toHaveValue('ETH')
    })
  })
})