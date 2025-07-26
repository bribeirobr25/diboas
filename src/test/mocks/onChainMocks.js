/**
 * Mock implementations for On-Chain Transaction System
 * Provides realistic mocks for testing blockchain interactions
 */

import { vi } from 'vitest'
import { TRANSACTION_STATUS } from '../../services/onchain/OnChainStatusProvider.js'

/**
 * Mock OnChainStatusProvider with configurable behavior
 */
export const createMockOnChainStatusProvider = (config = {}) => {
  const {
    submitSuccessRate = 0.95, // 95% success rate
    confirmationSuccessRate = 0.97, // 97% confirmation success rate
    confirmationDelay = 2000, // 2 seconds default
    enableRealTiming = false
  } = config

  const pendingTransactions = new Map()
  
  const mock = {
    submitTransaction: vi.fn(async (transactionData) => {
      const { id, type, amount, chain = 'SOL' } = transactionData
      
      // Simulate network delay
      if (enableRealTiming) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100))
      }
      
      // Random failure simulation
      if (Math.random() > submitSuccessRate) {
        return {
          success: false,
          error: 'Network error: Failed to broadcast transaction',
          txHash: null,
          status: TRANSACTION_STATUS.FAILED
        }
      }
      
      // Generate mock transaction hash
      const txHash = `${chain.toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
      
      // Store pending transaction
      const pendingTx = {
        id,
        txHash,
        chain,
        type,
        amount,
        status: TRANSACTION_STATUS.PENDING,
        submittedAt: new Date().toISOString(),
        confirmations: 0,
        requiredConfirmations: chain === 'ETH' ? 12 : 1,
        explorerLink: mock.generateExplorerLink(chain, 'transaction', txHash)
      }
      
      pendingTransactions.set(id, pendingTx)
      
      // Start confirmation process
      if (enableRealTiming) {
        setTimeout(() => mock._processConfirmation(id), confirmationDelay)
      }
      
      return {
        success: true,
        txHash,
        status: TRANSACTION_STATUS.PENDING,
        explorerLink: pendingTx.explorerLink,
        estimatedConfirmationTime: confirmationDelay
      }
    }),
    
    getTransactionStatus: vi.fn((transactionId) => {
      const tx = pendingTransactions.get(transactionId)
      if (!tx) return null
      
      return {
        id: tx.id,
        txHash: tx.txHash,
        chain: tx.chain,
        status: tx.status,
        confirmations: tx.confirmations,
        requiredConfirmations: tx.requiredConfirmations,
        explorerLink: tx.explorerLink,
        submittedAt: tx.submittedAt,
        confirmedAt: tx.confirmedAt,
        failedAt: tx.failedAt,
        error: tx.error
      }
    }),
    
    cancelTransaction: vi.fn(async (transactionId) => {
      const tx = pendingTransactions.get(transactionId)
      if (!tx) {
        return { success: false, error: 'Transaction not found' }
      }
      
      if (tx.status === TRANSACTION_STATUS.CONFIRMED) {
        return { success: false, error: 'Cannot cancel confirmed transaction' }
      }
      
      // Simulate cancellation attempt
      if (enableRealTiming) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
      }
      
      // 70% chance of successful cancellation
      if (Math.random() < 0.7) {
        tx.status = TRANSACTION_STATUS.FAILED
        tx.failedAt = new Date().toISOString()
        tx.error = 'Transaction cancelled by user'
        
        return { success: true, message: 'Transaction cancelled successfully' }
      }
      
      return { success: false, error: 'Transaction too far in confirmation process to cancel' }
    }),
    
    generateExplorerLink: vi.fn((chain, type = 'transaction', identifier = null) => {
      const explorerLinks = {
        BTC: {
          account: 'https://mempool.space/address/bc1q8ys49pxp3c6um7enemwdkl4ud5fwwg2rpdegxu',
          transaction: 'https://mempool.space/tx/bd2e7c74f5701c96673b16ecdc33d01d3e93574c81e869e715a78ff4698a556a'
        },
        ETH: {
          account: 'https://etherscan.io/address/0xac893c187843a775c74de8a7dd4cf749e5a4e262',
          transaction: 'https://etherscan.io/tx/0x2b21b80353ab6011a9b5df21db0a68755c2b787290e6250fdb4f8512d173f1e1'
        },
        SOL: {
          account: 'https://solscan.io/account/EgecX8HBapUxRW3otU4ES55WuygDDPSMMFSTCwfP57XR',
          transaction: 'https://solscan.io/tx/3pW7WADA8ysmwgMngGgu9RYdXpSvNeLRM7ftbsDV52doC91Gcc7mrtkteCu6HPjnWu9HTV9mKo43PshbRUe4AgmP'
        },
        SUI: {
          account: 'https://suivision.xyz/account/0x7c3e1ad62f0ac85e1227cb7b3dfa123c03c8191f9c3fbac9548ded485c52e169?tab=Activity',
          transaction: 'https://suivision.xyz/txblock/7r3zvFqvZNUavgXRVSp1uyaAoJvYCgP7CBSMZKRDyzQW'
        }
      }
      
      const chainLinks = explorerLinks[chain]
      return chainLinks ? chainLinks[type] || chainLinks.transaction : '#'
    }),
    
    healthCheck: vi.fn(async () => {
      if (enableRealTiming) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50))
      }
      
      return {
        success: true,
        status: 'healthy',
        service: 'mock_onchain_status',
        timestamp: new Date().toISOString(),
        pendingTransactions: pendingTransactions.size
      }
    }),
    
    // Internal method for processing confirmations
    _processConfirmation: vi.fn(async (transactionId) => {
      const tx = pendingTransactions.get(transactionId)
      if (!tx) return
      
      // Update to confirming
      tx.status = TRANSACTION_STATUS.CONFIRMING
      
      // Wait for confirmation
      await new Promise(resolve => setTimeout(resolve, confirmationDelay))
      
      // Random failure during confirmation
      if (Math.random() > confirmationSuccessRate) {
        tx.status = TRANSACTION_STATUS.FAILED
        tx.failedAt = new Date().toISOString()
        tx.error = 'Transaction failed during confirmation: Insufficient gas fees'
        return
      }
      
      // Successfully confirmed
      tx.status = TRANSACTION_STATUS.CONFIRMED
      tx.confirmations = tx.requiredConfirmations
      tx.confirmedAt = new Date().toISOString()
    }),
    
    // Helper methods for testing
    _setPendingTransaction: (id, transaction) => {
      pendingTransactions.set(id, transaction)
    },
    
    _clearPendingTransactions: () => {
      pendingTransactions.clear()
    },
    
    _getPendingTransactions: () => {
      return new Map(pendingTransactions)
    }
  }
  
  return mock
}

/**
 * Mock OnChainTransactionManager with configurable behavior
 */
export const createMockOnChainTransactionManager = (config = {}) => {
  const {
    mockProvider = createMockOnChainStatusProvider(),
    mockDataManager = null
  } = config
  
  const pendingTransactions = new Map()
  
  const mock = {
    initialize: vi.fn(async () => {
      return { success: true }
    }),
    
    executeTransaction: vi.fn(async (transactionData) => {
      const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
      
      // Create pending transaction record
      const pendingTransaction = {
        id: transactionId,
        ...transactionData,
        status: 'pending_submission',
        createdAt: new Date().toISOString(),
        chain: mock.determineChain(transactionData.type, transactionData.asset, transactionData.recipient),
        balanceUpdateApplied: false
      }
      
      pendingTransactions.set(transactionId, pendingTransaction)
      
      // Submit to mock provider
      const submissionResult = await mockProvider.submitTransaction({
        id: transactionId,
        ...transactionData
      })
      
      if (!submissionResult.success) {
        pendingTransaction.status = 'failed'
        pendingTransaction.error = submissionResult.error
        
        return {
          success: false,
          transactionId,
          error: submissionResult.error,
          status: 'failed'
        }
      }
      
      // Update with blockchain details
      pendingTransaction.txHash = submissionResult.txHash
      pendingTransaction.explorerLink = submissionResult.explorerLink
      pendingTransaction.status = 'pending_confirmation'
      
      return {
        success: true,
        transactionId,
        txHash: submissionResult.txHash,
        explorerLink: submissionResult.explorerLink,
        status: 'pending_confirmation',
        estimatedConfirmationTime: submissionResult.estimatedConfirmationTime
      }
    }),
    
    getTransactionStatus: vi.fn((transactionId) => {
      const pendingTx = pendingTransactions.get(transactionId)
      if (!pendingTx) return null
      
      const onChainStatus = mockProvider.getTransactionStatus(transactionId)
      
      return {
        ...pendingTx,
        onChainStatus: onChainStatus?.status,
        confirmations: onChainStatus?.confirmations,
        explorerLink: onChainStatus?.explorerLink
      }
    }),
    
    getPendingTransactions: vi.fn((userId) => {
      const userTransactions = []
      
      for (const [id, tx] of pendingTransactions) {
        if (tx.userId === userId) {
          const onChainStatus = mockProvider.getTransactionStatus(id)
          userTransactions.push({
            ...tx,
            onChainStatus: onChainStatus?.status,
            confirmations: onChainStatus?.confirmations
          })
        }
      }
      
      return userTransactions
    }),
    
    determineChain: vi.fn((type, asset, recipient) => {
      // For buy/sell, use asset's native chain
      if (['buy', 'sell'].includes(type) && asset) {
        const assetChainMap = {
          'BTC': 'BTC',
          'ETH': 'ETH',
          'SOL': 'SOL',
          'SUI': 'SUI'
        }
        return assetChainMap[asset] || 'SOL'
      }
      
      // For transfers, detect chain from recipient address
      if (type === 'transfer' && recipient) {
        if (recipient.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || recipient.match(/^bc1[a-z0-9]{39,59}$/)) {
          return 'BTC'
        }
        if (recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
          return 'ETH'
        }
        if (recipient.match(/^0x[a-fA-F0-9]{64}$/)) {
          return 'SUI'
        }
        if (recipient.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
          return 'SOL'
        }
      }
      
      // Default to Solana
      return 'SOL'
    }),
    
    // Helper methods for testing
    _setPendingTransaction: (id, transaction) => {
      pendingTransactions.set(id, transaction)
    },
    
    _clearPendingTransactions: () => {
      pendingTransactions.clear()
    },
    
    _getPendingTransactions: () => {
      return new Map(pendingTransactions)
    },
    
    _getMockProvider: () => mockProvider
  }
  
  return mock
}

/**
 * Mock useOnChainStatus hook
 */
export const createMockUseOnChainStatus = (initialState = {}) => {
  const defaultState = {
    status: null,
    isLoading: false,
    error: null,
    isPending: false,
    isConfirming: false,
    isConfirmed: false,
    isFailed: false,
    isTimeout: false,
    progress: null,
    explorerLink: null,
    txHash: null,
    chain: null,
    startPolling: vi.fn(),
    stopPolling: vi.fn(),
    refreshStatus: vi.fn(),
    cancelTransaction: vi.fn()
  }
  
  return vi.fn(() => ({
    ...defaultState,
    ...initialState
  }))
}

/**
 * Mock transaction flow scenarios for testing
 */
export const createTransactionFlowScenarios = () => {
  return {
    // Successful transaction flow
    success: (transactionId = 'tx-success-123') => [
      {
        status: {
          id: transactionId,
          status: TRANSACTION_STATUS.PENDING,
          confirmations: 0,
          requiredConfirmations: 1
        },
        isLoading: true,
        isPending: true
      },
      {
        status: {
          id: transactionId,
          status: TRANSACTION_STATUS.CONFIRMING,
          confirmations: 0,
          requiredConfirmations: 1
        },
        isLoading: false,
        isConfirming: true,
        progress: { current: 0, required: 1, percentage: 0 }
      },
      {
        status: {
          id: transactionId,
          status: TRANSACTION_STATUS.CONFIRMED,
          confirmations: 1,
          requiredConfirmations: 1,
          confirmedAt: new Date().toISOString()
        },
        isLoading: false,
        isConfirmed: true,
        progress: { current: 1, required: 1, percentage: 100 }
      }
    ],
    
    // Failed transaction flow
    failure: (transactionId = 'tx-failed-123') => [
      {
        status: {
          id: transactionId,
          status: TRANSACTION_STATUS.PENDING,
          confirmations: 0,
          requiredConfirmations: 1
        },
        isLoading: true,
        isPending: true
      },
      {
        status: {
          id: transactionId,
          status: TRANSACTION_STATUS.FAILED,
          error: 'Insufficient gas fees',
          failedAt: new Date().toISOString()
        },
        isLoading: false,
        isFailed: true,
        error: 'Insufficient gas fees'
      }
    ],
    
    // Timeout scenario
    timeout: (transactionId = 'tx-timeout-123') => [
      {
        status: {
          id: transactionId,
          status: TRANSACTION_STATUS.PENDING,
          confirmations: 0,
          requiredConfirmations: 12 // ETH-like long confirmation
        },
        isLoading: true,
        isPending: true
      },
      {
        status: {
          id: transactionId,
          status: TRANSACTION_STATUS.TIMEOUT
        },
        isLoading: false,
        isTimeout: true,
        error: 'Transaction confirmation timeout'
      }
    ]
  }
}

/**
 * Create test fixtures for different chains
 */
export const createChainTestFixtures = () => {
  return {
    BTC: {
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      txHash: 'bd2e7c74f5701c96673b16ecdc33d01d3e93574c81e869e715a78ff4698a556a',
      explorerLink: 'https://mempool.space/tx/bd2e7c74f5701c96673b16ecdc33d01d3e93574c81e869e715a78ff4698a556a',
      confirmationTime: 5000, // 5 seconds
      requiredConfirmations: 1
    },
    ETH: {
      address: '0x742d35Cc6634C0532925a3b8D7389e4B5F1c16e3',
      txHash: '0x2b21b80353ab6011a9b5df21db0a68755c2b787290e6250fdb4f8512d173f1e1',
      explorerLink: 'https://etherscan.io/tx/0x2b21b80353ab6011a9b5df21db0a68755c2b787290e6250fdb4f8512d173f1e1',
      confirmationTime: 2000, // 2 seconds
      requiredConfirmations: 12
    },
    SOL: {
      address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      txHash: '3pW7WADA8ysmwgMngGgu9RYdXpSvNeLRM7ftbsDV52doC91Gcc7mrtkteCu6HPjnWu9HTV9mKo43PshbRUe4AgmP',
      explorerLink: 'https://solscan.io/tx/3pW7WADA8ysmwgMngGgu9RYdXpSvNeLRM7ftbsDV52doC91Gcc7mrtkteCu6HPjnWu9HTV9mKo43PshbRUe4AgmP',
      confirmationTime: 2000, // 2 seconds
      requiredConfirmations: 1
    },
    SUI: {
      address: '0x7c3e1ad62f0ac85e1227cb7b3dfa123c03c8191f9c3fbac9548ded485c52e169',
      txHash: '7r3zvFqvZNUavgXRVSp1uyaAoJvYCgP7CBSMZKRDyzQW',
      explorerLink: 'https://suivision.xyz/txblock/7r3zvFqvZNUavgXRVSp1uyaAoJvYCgP7CBSMZKRDyzQW',
      confirmationTime: 2000, // 2 seconds
      requiredConfirmations: 1
    }
  }
}