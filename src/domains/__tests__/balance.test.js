import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  Balance, 
  AssetBalance, 
  ChainBalance,
  BalanceService, 
  InMemoryBalanceRepository,
  MockPriceService
} from '../balance/index.js'

// Mock external dependencies
vi.mock('../../events/EventStore.js', () => ({
  eventStore: {
    appendEvent: vi.fn().mockResolvedValue({ id: 'evt_123' })
  }
}))

vi.mock('../../cqrs/QueryBus.js', () => ({
  queryBus: {
    execute: vi.fn().mockResolvedValue({ success: true })
  },
  createBalanceQuery: vi.fn()
}))

vi.mock('../../cqrs/CommandBus.js', () => ({
  commandBus: {
    execute: vi.fn().mockResolvedValue({ success: true })
  },
  updateBalanceCommand: vi.fn()
}))

describe('Balance Domain', () => {
  let balanceRepository
  let priceService
  let balanceService

  beforeEach(() => {
    balanceRepository = new InMemoryBalanceRepository()
    priceService = new MockPriceService()
    balanceService = new BalanceService(balanceRepository, priceService)
  })

  describe('Balance Entity', () => {
    it('should create balance with default values', () => {
      const balance = new Balance({
        accountId: 'account123'
      })

      expect(balance.id).toMatch(/^balance_/)
      expect(balance.accountId).toBe('account123')
      expect(balance.totalUSD).toBe(0)
      expect(balance.availableForSpending).toBe(0)
      expect(balance.investedAmount).toBe(0)
      expect(balance.strategyBalance).toBe(0)
      expect(balance.assets.size).toBe(0)
      expect(balance.chains.size).toBe(0)
    })

    it('should update asset balance', () => {
      const balance = new Balance({ accountId: 'account123' })
      
      balance.updateAssetBalance('BTC', 0.1, 'BTC')
      
      expect(balance.assets.size).toBe(1)
      expect(balance.chains.size).toBe(1)
      
      const btcBalance = balance.assets.get('BTC')
      expect(btcBalance.asset).toBe('BTC')
      expect(btcBalance.balance).toBe(0.1)
      expect(btcBalance.chain).toBe('BTC')
    })

    it('should credit and debit balance', () => {
      const balance = new Balance({ accountId: 'account123' })
      
      // Credit USDC
      balance.credit(1000, 'USDC', 'SOL')
      expect(balance.getAssetBalance('USDC')).toBe(1000)
      
      // Debit USDC
      balance.debit(200, 'USDC', 'SOL')
      expect(balance.getAssetBalance('USDC')).toBe(800)
      
      // Should throw on insufficient balance
      expect(() => balance.debit(1000, 'USDC', 'SOL')).toThrow('Insufficient balance')
    })

    it('should lock and release funds for strategy', () => {
      const balance = new Balance({
        accountId: 'account123',
        totalUSD: 1000,
        availableForSpending: 1000
      })
      
      // Lock funds
      balance.lockForStrategy(500, 'strategy123')
      expect(balance.availableForSpending).toBe(500)
      expect(balance.investedAmount).toBe(500)
      expect(balance.strategyBalance).toBe(500)
      
      // Release funds
      balance.releaseFromStrategy(200, 'strategy123')
      expect(balance.availableForSpending).toBe(700)
      expect(balance.investedAmount).toBe(300)
      expect(balance.strategyBalance).toBe(300)
    })

    it('should recalculate totals', () => {
      const balance = new Balance({ accountId: 'account123' })
      
      // Add USDC (1:1 USD)
      balance.updateAssetBalance('USDC', 1000, 'SOL')
      const usdcBalance = balance.assets.get('USDC')
      usdcBalance.updatePrice(1)
      
      // Add BTC
      balance.updateAssetBalance('BTC', 0.1, 'BTC')
      const btcBalance = balance.assets.get('BTC')
      btcBalance.updatePrice(45000)
      
      balance.recalculateTotals()
      
      expect(balance.totalUSD).toBe(5500) // 1000 + (0.1 * 45000)
      expect(balance.availableForSpending).toBe(1000) // Only USDC is spendable
    })

    it('should check sufficient balance', () => {
      const balance = new Balance({ accountId: 'account123' })
      balance.updateAssetBalance('USDC', 1000, 'SOL')
      
      expect(balance.hasSufficientBalance(500, 'USDC')).toBe(true)
      expect(balance.hasSufficientBalance(1500, 'USDC')).toBe(false)
      expect(balance.hasSufficientBalance(100, 'BTC')).toBe(false)
    })
  })

  describe('AssetBalance Value Object', () => {
    it('should update balance and price', () => {
      const assetBalance = new AssetBalance({
        asset: 'BTC',
        chain: 'BTC',
        balance: 0.1
      })
      
      assetBalance.updatePrice(45000)
      expect(assetBalance.lastPrice).toBe(45000)
      expect(assetBalance.usdValue).toBe(4500)
      
      assetBalance.updateBalance(0.2)
      expect(assetBalance.balance).toBe(0.2)
      expect(assetBalance.usdValue).toBe(9000)
    })

    it('should handle USD/USDC correctly', () => {
      const usdcBalance = new AssetBalance({
        asset: 'USDC',
        balance: 1000
      })
      
      usdcBalance.updatePrice(1)
      expect(usdcBalance.usdValue).toBe(1000)
      
      const usdBalance = new AssetBalance({
        asset: 'USD',
        balance: 500
      })
      
      usdBalance.updatePrice(1)
      expect(usdBalance.usdValue).toBe(500)
    })
  })

  describe('ChainBalance Value Object', () => {
    it('should manage assets on chain', () => {
      const chainBalance = new ChainBalance({ chain: 'SOL' })
      
      chainBalance.updateAssetBalance('USDC', 1000)
      chainBalance.updateAssetBalance('SOL', 10)
      chainBalance.updateGasBalance(0.5)
      
      expect(chainBalance.assets.size).toBe(2)
      expect(chainBalance.gasBalance).toBe(0.5)
    })

    it('should calculate total USD value', () => {
      const chainBalance = new ChainBalance({ chain: 'SOL' })
      
      chainBalance.updateAssetBalance('USDC', 1000)
      chainBalance.updateAssetBalance('USD', 500)
      
      expect(chainBalance.getTotalUSDValue()).toBe(1500)
    })
  })

  describe('Balance Repository', () => {
    it('should save and find balances', async () => {
      const balance = new Balance({ accountId: 'account123' })
      
      await balanceRepository.save(balance)
      
      const foundById = await balanceRepository.findById(balance.id)
      expect(foundById).toEqual(balance)
      
      const foundByAccountId = await balanceRepository.findByAccountId('account123')
      expect(foundByAccountId).toEqual(balance)
    })

    it('should find balances by asset and chain', async () => {
      const balance1 = new Balance({ accountId: 'account123' })
      balance1.updateAssetBalance('BTC', 0.1, 'BTC')
      
      const balance2 = new Balance({ accountId: 'account456' })
      balance2.updateAssetBalance('BTC', 0.2, 'BTC')
      balance2.updateAssetBalance('ETH', 1, 'ETH')
      
      await balanceRepository.save(balance1)
      await balanceRepository.save(balance2)
      
      const btcBalances = await balanceRepository.findByAsset('BTC')
      expect(btcBalances).toHaveLength(2)
      
      const ethBalances = await balanceRepository.findByChain('ETH')
      expect(ethBalances).toHaveLength(1)
    })

    it('should calculate total value locked', async () => {
      const balance1 = new Balance({ accountId: 'account123', totalUSD: 1000 })
      const balance2 = new Balance({ accountId: 'account456', totalUSD: 2000 })
      
      await balanceRepository.save(balance1)
      await balanceRepository.save(balance2)
      
      const tvl = await balanceRepository.getTotalValueLocked()
      expect(tvl).toBe(3000)
    })
  })

  describe('MockPriceService', () => {
    it('should return mock prices', async () => {
      const btcPrice = await priceService.getPrice('BTC')
      expect(btcPrice).toBe(45000)
      
      const prices = await priceService.getPrices(['BTC', 'ETH', 'SOL'])
      expect(prices.BTC).toBe(45000)
      expect(prices.ETH).toBe(3200)
      expect(prices.SOL).toBe(120)
    })

    it('should calculate exchange rates', async () => {
      const btcToUsd = await priceService.getExchangeRate('BTC', 'USD')
      expect(btcToUsd).toBe(45000)
      
      const ethToBtc = await priceService.getExchangeRate('ETH', 'BTC')
      expect(ethToBtc).toBeCloseTo(3200 / 45000, 5)
    })
  })

  describe('Balance Service', () => {
    it('should initialize balance for new account', async () => {
      const balance = await balanceService.initializeBalance('account123')
      
      expect(balance.accountId).toBe('account123')
      expect(balance.totalUSD).toBe(0)
      expect(balance.assets.has('USDC')).toBe(true)
      expect(balance.getAssetBalance('USDC')).toBe(0)
    })

    it('should not create duplicate balance', async () => {
      const balance1 = await balanceService.initializeBalance('account123')
      const balance2 = await balanceService.initializeBalance('account123')
      
      expect(balance1).toBe(balance2)
    })

    it('should credit and debit balance', async () => {
      const balance = await balanceService.initializeBalance('account123')
      
      await balanceService.creditBalance('account123', 1000, 'USDC', 'SOL')
      const updatedBalance = await balanceService.getBalance('account123')
      expect(updatedBalance.getAssetBalance('USDC')).toBe(1000)
      
      await balanceService.debitBalance('account123', 200, 'USDC', 'SOL')
      const finalBalance = await balanceService.getBalance('account123')
      expect(finalBalance.getAssetBalance('USDC')).toBe(800)
    })

    it('should transfer between assets', async () => {
      const balance = await balanceService.initializeBalance('account123')
      await balanceService.creditBalance('account123', 1000, 'USDC', 'SOL')
      
      const result = await balanceService.transferBetweenAssets(
        'account123', 
        'USDC', 
        'BTC', 
        1000, 
        'SOL'
      )
      
      expect(result.fromAmount).toBe(1000)
      expect(result.toAmount).toBeCloseTo(1000 / 45000, 5) // 1000 USDC / 45000 BTC price
      expect(result.exchangeRate).toBe(1 / 45000)
    })

    it('should lock and release funds for strategy', async () => {
      const balance = new Balance({
        accountId: 'account123',
        totalUSD: 1000,
        availableForSpending: 1000
      })
      // Add USDC asset to make availableForSpending calculation work
      balance.updateAssetBalance('USDC', 1000, 'SOL')
      await balanceRepository.save(balance)
      
      await balanceService.lockFundsForStrategy('account123', 500, 'strategy123')
      let updatedBalance = await balanceService.getBalance('account123')
      expect(updatedBalance.strategyBalance).toBe(500)
      expect(updatedBalance.availableForSpending).toBe(500)
      
      await balanceService.releaseFundsFromStrategy('account123', 200, 'strategy123')
      updatedBalance = await balanceService.getBalance('account123')
      expect(updatedBalance.strategyBalance).toBe(300)
      expect(updatedBalance.availableForSpending).toBe(700)
    })

    it('should get balance breakdowns', async () => {
      const balance = await balanceService.initializeBalance('account123')
      balance.updateAssetBalance('BTC', 0.1, 'BTC')
      balance.updateAssetBalance('ETH', 1, 'ETH')
      await balanceRepository.save(balance)
      
      const chainBreakdown = await balanceService.getBalanceByChain('account123')
      expect(chainBreakdown.SOL).toBeDefined()
      expect(chainBreakdown.BTC).toBeDefined()
      expect(chainBreakdown.ETH).toBeDefined()
      
      const assetBreakdown = await balanceService.getBalanceByAsset('account123')
      expect(assetBreakdown.USDC).toBeDefined()
      expect(assetBreakdown.BTC).toBeDefined()
      expect(assetBreakdown.ETH).toBeDefined()
    })
  })
})