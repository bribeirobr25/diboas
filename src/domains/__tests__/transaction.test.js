import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  Transaction, 
  TransactionStatus,
  TransactionType,
  TransactionDirection,
  TransactionService, 
  InMemoryTransactionRepository
} from '../transaction/index.js'

// Mock external dependencies
vi.mock('../../events/EventStore.js', () => ({
  eventStore: {
    appendEvent: vi.fn().mockResolvedValue({ id: 'evt_123' })
  }
}))

vi.mock('../../cqrs/CommandBus.js', () => ({
  commandBus: {
    execute: vi.fn().mockResolvedValue({ success: true })
  },
  createTransactionCommand: vi.fn()
}))

vi.mock('../../security/SecurityManager.js', () => ({
  validateFinancialOperation: vi.fn()
}))

describe('Transaction Domain', () => {
  let transactionRepository
  let transactionService
  let mockBalanceService
  let mockAccountService

  beforeEach(() => {
    transactionRepository = new InMemoryTransactionRepository()
    
    // Mock balance service
    mockBalanceService = {
      getBalance: vi.fn().mockResolvedValue({
        hasSufficientBalance: vi.fn().mockReturnValue(true)
      }),
      creditBalance: vi.fn().mockResolvedValue({}),
      debitBalance: vi.fn().mockResolvedValue({}),
      lockFundsForStrategy: vi.fn().mockResolvedValue({})
    }
    
    // Mock account service
    mockAccountService = {
      getUserWithAccount: vi.fn().mockResolvedValue({
        user: { id: 'user123' },
        account: { id: 'account123' }
      })
    }
    
    transactionService = new TransactionService(
      transactionRepository,
      mockBalanceService,
      mockAccountService
    )
  })

  describe('Transaction Entity', () => {
    it('should create transaction with default values', () => {
      const transaction = new Transaction({
        accountId: 'account123',
        type: TransactionType.BUY,
        amount: 100,
        asset: 'BTC'
      })

      expect(transaction.id).toMatch(/^tx_/)
      expect(transaction.accountId).toBe('account123')
      expect(transaction.type).toBe(TransactionType.BUY)
      expect(transaction.status).toBe(TransactionStatus.PENDING)
      expect(transaction.amount).toBe(100)
      expect(transaction.asset).toBe('BTC')
      expect(transaction.direction).toBe(TransactionDirection.INCOMING)
    })

    it('should determine transaction direction correctly', () => {
      const buyTx = new Transaction({ type: TransactionType.BUY })
      expect(buyTx.direction).toBe(TransactionDirection.INCOMING)
      
      const sellTx = new Transaction({ type: TransactionType.SELL })
      expect(sellTx.direction).toBe(TransactionDirection.OUTGOING)
      
      const investTx = new Transaction({ type: TransactionType.INVEST })
      expect(investTx.direction).toBe(TransactionDirection.INTERNAL)
    })

    it('should handle transaction lifecycle', () => {
      const transaction = new Transaction({
        accountId: 'account123',
        type: TransactionType.BUY,
        amount: 100
      })

      // Start processing
      transaction.startProcessing()
      expect(transaction.status).toBe(TransactionStatus.PROCESSING)
      expect(transaction.timeline.processingStartedAt).toBeDefined()
      
      // Complete transaction
      const result = { success: true, hash: '0x123' }
      transaction.complete(result)
      expect(transaction.status).toBe(TransactionStatus.COMPLETED)
      expect(transaction.result).toEqual(result)
      expect(transaction.timeline.completedAt).toBeDefined()
      
      // Should be final
      expect(transaction.isFinal()).toBe(true)
    })

    it('should handle transaction failure', () => {
      const transaction = new Transaction({
        accountId: 'account123',
        type: TransactionType.BUY,
        amount: 100
      })

      transaction.startProcessing()
      
      const error = new Error('Insufficient funds')
      transaction.fail(error)
      
      expect(transaction.status).toBe(TransactionStatus.FAILED)
      expect(transaction.error.message).toBe('Insufficient funds')
      expect(transaction.timeline.failedAt).toBeDefined()
      expect(transaction.isFinal()).toBe(true)
    })

    it('should handle transaction cancellation', () => {
      const transaction = new Transaction({
        accountId: 'account123',
        type: TransactionType.BUY,
        amount: 100
      })

      transaction.cancel('User requested cancellation')
      
      expect(transaction.status).toBe(TransactionStatus.CANCELLED)
      expect(transaction.metadata.cancellationReason).toBe('User requested cancellation')
      expect(transaction.timeline.cancelledAt).toBeDefined()
    })

    it('should calculate net amount and total cost', () => {
      const incomingTx = new Transaction({
        type: TransactionType.ADD,
        amount: 1000,
        direction: TransactionDirection.INCOMING
      })
      incomingTx.updateFees({ total: 30 })
      
      expect(incomingTx.getNetAmount()).toBe(970) // 1000 - 30
      expect(incomingTx.getTotalCost()).toBe(1000)
      
      const outgoingTx = new Transaction({
        type: TransactionType.SEND,
        amount: 1000,
        direction: TransactionDirection.OUTGOING
      })
      outgoingTx.updateFees({ total: 30 })
      
      expect(outgoingTx.getNetAmount()).toBe(1000)
      expect(outgoingTx.getTotalCost()).toBe(1030) // 1000 + 30
    })

    it('should add blockchain confirmations', () => {
      const transaction = new Transaction({
        accountId: 'account123',
        type: TransactionType.SEND,
        amount: 100
      })

      const hash = '0x1234567890'
      transaction.addConfirmation(hash, 3)
      
      expect(transaction.metadata.transactionHash).toBe(hash)
      expect(transaction.metadata.confirmations).toBe(3)
      expect(transaction.timeline.confirmedAt).toBeDefined()
    })
  })

  describe('Transaction Repository', () => {
    it('should save and find transactions', async () => {
      const transaction = new Transaction({
        accountId: 'account123',
        type: TransactionType.BUY,
        amount: 100
      })

      await transactionRepository.save(transaction)
      
      const foundById = await transactionRepository.findById(transaction.id)
      expect(foundById).toEqual(transaction)
      
      const foundByAccount = await transactionRepository.findByAccountId('account123')
      expect(foundByAccount).toHaveLength(1)
      expect(foundByAccount[0]).toEqual(transaction)
    })

    it('should find transactions with filters', async () => {
      const tx1 = new Transaction({
        accountId: 'account123',
        type: TransactionType.BUY,
        status: TransactionStatus.COMPLETED,
        amount: 100
      })
      
      const tx2 = new Transaction({
        accountId: 'account123',
        type: TransactionType.SELL,
        status: TransactionStatus.PENDING,
        amount: 200
      })

      await transactionRepository.save(tx1)
      await transactionRepository.save(tx2)
      
      const completedTxs = await transactionRepository.findByAccountId('account123', {
        status: TransactionStatus.COMPLETED
      })
      expect(completedTxs).toHaveLength(1)
      expect(completedTxs[0].type).toBe(TransactionType.BUY)
      
      const buyTxs = await transactionRepository.findByAccountId('account123', {
        type: TransactionType.BUY
      })
      expect(buyTxs).toHaveLength(1)
      expect(buyTxs[0].status).toBe(TransactionStatus.COMPLETED)
    })

    it('should find transactions by criteria', async () => {
      const tx1 = new Transaction({
        accountId: 'account123',
        type: TransactionType.BUY,
        asset: 'BTC',
        amount: 100
      })
      
      const tx2 = new Transaction({
        accountId: 'account456',
        type: TransactionType.SELL,
        asset: 'ETH',
        amount: 200
      })

      await transactionRepository.save(tx1)
      await transactionRepository.save(tx2)
      
      const btcTxs = await transactionRepository.findByCriteria({ asset: 'BTC' })
      expect(btcTxs).toHaveLength(1)
      expect(btcTxs[0].type).toBe(TransactionType.BUY)
      
      const sellTxs = await transactionRepository.findByCriteria({ type: TransactionType.SELL })
      expect(sellTxs).toHaveLength(1)
      expect(sellTxs[0].asset).toBe('ETH')
    })

    it('should count transactions and provide statistics', async () => {
      const tx1 = new Transaction({
        accountId: 'account123',
        type: TransactionType.BUY,
        status: TransactionStatus.COMPLETED,
        amount: 100
      })
      tx1.updateFees({ total: 5 })
      
      const tx2 = new Transaction({
        accountId: 'account123',
        type: TransactionType.SELL,
        status: TransactionStatus.PENDING,
        amount: 200
      })

      await transactionRepository.save(tx1)
      await transactionRepository.save(tx2)
      
      const totalCount = await transactionRepository.count()
      expect(totalCount).toBe(2)
      
      const accountCount = await transactionRepository.count({ accountId: 'account123' })
      expect(accountCount).toBe(2)
      
      const stats = await transactionRepository.getStatistics('account123')
      expect(stats.total).toBe(2)
      expect(stats.byStatus.completed).toBe(1)
      expect(stats.byStatus.pending).toBe(1)
      expect(stats.byType.buy).toBe(1)
      expect(stats.byType.sell).toBe(1)
      expect(stats.totalVolume).toBe(100) // Only completed transactions
      expect(stats.total).toBe(5)
    })
  })

  describe('Transaction Service', () => {
    it('should create transaction', async () => {
      const transactionData = {
        type: TransactionType.BUY,
        amount: 100,
        asset: 'BTC',
        userId: 'user123'
      }

      const transaction = await transactionService.createTransaction('account123', transactionData)
      
      expect(transaction.accountId).toBe('account123')
      expect(transaction.type).toBe(TransactionType.BUY)
      expect(transaction.amount).toBe(100)
      expect(transaction.asset).toBe('BTC')
      expect(transaction.status).toBe(TransactionStatus.PENDING)
      expect(transaction.fees.total).toBeGreaterThan(0)
    })

    it('should process transaction successfully', async () => {
      const transaction = new Transaction({
        accountId: 'account123',
        type: TransactionType.BUY,
        amount: 100,
        asset: 'BTC'
      })
      
      await transactionRepository.save(transaction)
      
      const result = await transactionService.processTransaction(transaction.id)
      
      expect(result.status).toBe(TransactionStatus.COMPLETED)
      expect(result.result).toBeDefined()
      expect(mockBalanceService.debitBalance).toHaveBeenCalled()
      expect(mockBalanceService.creditBalance).toHaveBeenCalled()
    })

    it('should handle transaction failure during processing', async () => {
      const transaction = new Transaction({
        accountId: 'account123',
        type: TransactionType.WITHDRAW,
        amount: 100
      })
      
      await transactionRepository.save(transaction)
      
      // Mock insufficient balance
      mockBalanceService.getBalance.mockResolvedValue({
        hasSufficientBalance: vi.fn().mockReturnValue(false)
      })
      
      await expect(transactionService.processTransaction(transaction.id))
        .rejects.toThrow('Insufficient balance')
      
      const failedTx = await transactionRepository.findById(transaction.id)
      expect(failedTx.status).toBe(TransactionStatus.FAILED)
    })

    it('should calculate fees correctly', () => {
      const buyTx = new Transaction({
        type: TransactionType.BUY,
        amount: 1000
      })
      
      const fees = transactionService.calculateFees(buyTx)
      
      expect(fees.diBoaS).toBe(0.9) // 1000 * 0.0009
      expect(fees.network).toBe(0.5)
      expect(fees.total).toBe(fees.diBoaS + fees.network + fees.provider + fees.routing)
    })

    it('should get transaction history with pagination', async () => {
      // Create multiple transactions
      for (let i = 0; i < 5; i++) {
        const tx = new Transaction({
          accountId: 'account123',
          type: TransactionType.BUY,
          amount: 100 + i
        })
        await transactionRepository.save(tx)
      }
      
      const page1 = await transactionService.getTransactionHistory('account123', {
        limit: 3,
        offset: 0
      })
      expect(page1).toHaveLength(3)
      
      const page2 = await transactionService.getTransactionHistory('account123', {
        limit: 3,
        offset: 3
      })
      expect(page2).toHaveLength(2)
    })

    it('should cancel transaction', async () => {
      const transaction = new Transaction({
        accountId: 'account123',
        type: TransactionType.BUY,
        amount: 100,
        status: TransactionStatus.PENDING
      })
      
      await transactionRepository.save(transaction)
      
      const cancelledTx = await transactionService.cancelTransaction(
        transaction.id, 
        'User requested cancellation'
      )
      
      expect(cancelledTx.status).toBe(TransactionStatus.CANCELLED)
      expect(cancelledTx.metadata.cancellationReason).toBe('User requested cancellation')
    })

    it('should get transaction statistics', async () => {
      const tx1 = new Transaction({
        accountId: 'account123',
        type: TransactionType.BUY,
        status: TransactionStatus.COMPLETED,
        amount: 100
      })
      tx1.updateFees({ total: 5 })
      
      const tx2 = new Transaction({
        accountId: 'account123',
        type: TransactionType.SELL,
        status: TransactionStatus.COMPLETED,
        amount: 200
      })
      tx2.updateFees({ total: 10 })
      
      await transactionRepository.save(tx1)
      await transactionRepository.save(tx2)
      
      const stats = await transactionService.getTransactionStatistics('account123')
      
      expect(stats.total).toBe(2)
      expect(stats.totalVolume).toBe(300)
      expect(stats.total).toBe(15)
      expect(stats.byType.buy).toBe(1)
      expect(stats.byType.sell).toBe(1)
    })
  })
})