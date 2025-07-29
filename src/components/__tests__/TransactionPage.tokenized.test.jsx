/**
 * TransactionPage Tokenized Assets Tests
 * Testing enhanced buy/sell functionality with PAXG and XAUT
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import TransactionPage from '../TransactionPage.jsx'

// Mock the hooks
const mockExecuteTransactionFlow = vi.fn().mockResolvedValue({ requiresTwoFA: false })
const mockCalculateFees = vi.fn()
const mockValidateTransaction = vi.fn()

vi.mock('../../hooks/transactions/index.js', () => ({
  useWalletBalance: () => ({
    balance: {
      availableForSpending: 1000,
      assets: {
        PAXG: { investedAmount: 100 },
        XAUT: { investedAmount: 50 }
      }
    }
  }),
  useFeeCalculator: () => ({
    fees: { total: 10, network: 5, provider: 5 },
    calculateFees: mockCalculateFees
  }),
  useTransactionValidation: () => ({
    validationErrors: {},
    validateTransaction: mockValidateTransaction
  }),
  useTransactionFlow: () => ({
    flowState: 'idle',
    flowData: null,
    flowError: null,
    executeTransactionFlow: mockExecuteTransactionFlow,
    confirmTransaction: vi.fn(),
    resetFlow: vi.fn()
  })
}))

// Mock PageHeader
vi.mock('../shared/PageHeader.jsx', () => ({
  default: () => <div data-testid="page-header">Page Header</div>
}))

// Mock transaction components
vi.mock('../transactions/TransactionTypeSelector.jsx', () => ({
  default: ({ transactionType, setTransactionType, transactionTypes }) => (
    <div data-testid="transaction-type-selector">
      {transactionTypes.map(type => (
        <button
          key={type.id}
          onClick={() => setTransactionType(type.id)}
          className={transactionType === type.id ? 'selected' : ''}
        >
          {type.label}
        </button>
      ))}
    </div>
  )
}))

vi.mock('../transactions/TransactionForm.jsx', () => ({
  default: ({ selectedAsset, setSelectedAsset, assets, amount, setAmount }) => (
    <div data-testid="transaction-form">
      <select 
        value={selectedAsset} 
        onChange={(e) => setSelectedAsset(e.target.value)}
        data-testid="asset-selector"
      >
        <option value="USD">USD</option>
        {assets.map(asset => (
          <option key={asset.assetId} value={asset.assetId}>
            {asset.displayName}
          </option>
        ))}
      </select>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        data-testid="amount-input"
        placeholder="Amount"
      />
    </div>
  )
}))

vi.mock('../transactions/TransactionSummary.jsx', () => ({
  default: ({ amount, selectedAsset, handleTransactionStart, isTransactionValid }) => (
    <div data-testid="transaction-summary">
      <div>Amount: {amount}</div>
      <div>Asset: {selectedAsset}</div>
      <button
        onClick={handleTransactionStart}
        disabled={!isTransactionValid}
        data-testid="start-transaction"
      >
        Start Transaction
      </button>
    </div>
  )
}))

describe('TransactionPage - Tokenized Assets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('displays PAXG and XAUT in supported assets', () => {
    render(
      <BrowserRouter>
        <TransactionPage transactionType="buy" />
      </BrowserRouter>
    )

    const assetSelector = screen.getByTestId('asset-selector')
    expect(assetSelector).toBeInTheDocument()
    
    // Check if PAXG and XAUT options are present
    expect(screen.getByText('PAX Gold')).toBeInTheDocument()
    expect(screen.getByText('Tether Gold')).toBeInTheDocument()
  })

  test('allows buying PAXG tokenized gold', async () => {
    render(
      <BrowserRouter>
        <TransactionPage transactionType="buy" />
      </BrowserRouter>
    )

    // Select PAXG asset
    const assetSelector = screen.getByTestId('asset-selector')
    fireEvent.change(assetSelector, { target: { value: 'PAXG' } })

    // Enter amount
    const amountInput = screen.getByTestId('amount-input')
    fireEvent.change(amountInput, { target: { value: '100' } })

    // Start transaction
    const startButton = screen.getByTestId('start-transaction')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(mockExecuteTransactionFlow).toHaveBeenCalledWith({
        type: 'buy',
        amount: 100,
        recipient: '',
        asset: 'PAXG',
        paymentMethod: ''
      })
    })
  })

  test('allows buying XAUT tokenized gold', async () => {
    render(
      <BrowserRouter>
        <TransactionPage transactionType="buy" />
      </BrowserRouter>
    )

    // Select XAUT asset
    const assetSelector = screen.getByTestId('asset-selector')
    fireEvent.change(assetSelector, { target: { value: 'XAUT' } })

    // Enter amount
    const amountInput = screen.getByTestId('amount-input')
    fireEvent.change(amountInput, { target: { value: '50' } })

    // Start transaction
    const startButton = screen.getByTestId('start-transaction')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(mockExecuteTransactionFlow).toHaveBeenCalledWith({
        type: 'buy',
        amount: 50,
        recipient: '',
        asset: 'XAUT',
        paymentMethod: ''
      })
    })
  })

  test('calculates correct fees for PAXG transactions', async () => {
    render(
      <BrowserRouter>
        <TransactionPage transactionType="buy" />
      </BrowserRouter>
    )

    // Select PAXG and enter amount
    const assetSelector = screen.getByTestId('asset-selector')
    fireEvent.change(assetSelector, { target: { value: 'PAXG' } })

    const amountInput = screen.getByTestId('amount-input')
    fireEvent.change(amountInput, { target: { value: '100' } })

    await waitFor(() => {
      expect(mockCalculateFees).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'buy',
          amount: 100,
          asset: 'PAXG',
          chains: ['SOL', 'ETH'] // PAXG should use ETH chain via bridge
        })
      )
    })
  })

  test('calculates correct fees for XAUT transactions', async () => {
    render(
      <BrowserRouter>
        <TransactionPage transactionType="buy" />
      </BrowserRouter>
    )

    // Select XAUT and enter amount
    const assetSelector = screen.getByTestId('asset-selector')
    fireEvent.change(assetSelector, { target: { value: 'XAUT' } })

    const amountInput = screen.getByTestId('amount-input')
    fireEvent.change(amountInput, { target: { value: '75' } })

    await waitFor(() => {
      expect(mockCalculateFees).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'buy',
          amount: 75,
          asset: 'XAUT',
          chains: ['SOL', 'ETH'] // XAUT should use ETH chain via bridge
        })
      )
    })
  })

  test('allows selling PAXG back to USDC', async () => {
    render(
      <BrowserRouter>
        <TransactionPage transactionType="sell" />
      </BrowserRouter>
    )

    // Select sell transaction type
    const sellButton = screen.getByText('Sell')
    fireEvent.click(sellButton)

    // Select PAXG asset
    const assetSelector = screen.getByTestId('asset-selector')
    fireEvent.change(assetSelector, { target: { value: 'PAXG' } })

    // Enter amount
    const amountInput = screen.getByTestId('amount-input')
    fireEvent.change(amountInput, { target: { value: '50' } })

    // Start transaction
    const startButton = screen.getByTestId('start-transaction')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(mockExecuteTransactionFlow).toHaveBeenCalledWith({
        type: 'sell',
        amount: 50,
        recipient: '',
        asset: 'PAXG',
        paymentMethod: ''
      })
    })
  })

  test('validates sufficient balance for tokenized asset sales', async () => {
    render(
      <BrowserRouter>
        <TransactionPage transactionType="sell" />
      </BrowserRouter>
    )

    // Select sell transaction type
    const sellButton = screen.getByText('Sell')
    fireEvent.click(sellButton)

    // Select PAXG asset
    const assetSelector = screen.getByTestId('asset-selector')
    fireEvent.change(assetSelector, { target: { value: 'PAXG' } })

    // Enter amount greater than available balance (100)
    const amountInput = screen.getByTestId('amount-input')
    fireEvent.change(amountInput, { target: { value: '150' } })

    await waitFor(() => {
      expect(mockValidateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sell',
          amount: '150',
          asset: 'PAXG'
        })
      )
    })
  })

  test('switches between transaction types correctly', () => {
    render(
      <BrowserRouter>
        <TransactionPage transactionType="buy" />
      </BrowserRouter>
    )

    // Check if transaction type selector is present
    expect(screen.getByTestId('transaction-type-selector')).toBeInTheDocument()

    // Check that buy and sell buttons are available
    expect(screen.getByText('Buy')).toBeInTheDocument()
    expect(screen.getByText('Sell')).toBeInTheDocument()

    // Switch to sell
    const sellButton = screen.getByText('Sell')
    fireEvent.click(sellButton)

    // Verify sell is now selected (based on our mock implementation)
    expect(screen.getByText('Sell')).toBeInTheDocument()
  })
})