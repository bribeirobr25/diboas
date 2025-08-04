/**
 * Balance Domain Service
 * Handles balance-related business logic and orchestration
 */

import { Balance, AssetBalance } from '../models/Balance.js'
import { BalanceUpdatedEvent, BalanceCreditedEvent, BalanceDebitedEvent } from '../events/BalanceEvents.js'
import { eventStore } from '../../../events/EventStore.js'
import { queryBus, createBalanceQuery } from '../../../cqrs/QueryBus.js'
import { commandBus, updateBalanceCommand } from '../../../cqrs/CommandBus.js'

/**
 * Balance Service - Domain service for balance operations
 */
export class BalanceService {
  constructor(balanceRepository, priceService) {
    this.balanceRepository = balanceRepository
    this.priceService = priceService
  }

  /**
   * Initialize balance for new account
   */
  async initializeBalance(accountId) {
    // Check if balance already exists
    const existingBalance = await this.balanceRepository.findByAccountId(accountId)
    if (existingBalance) {
      return existingBalance
    }
    
    // Create new balance
    const balance = new Balance({
      accountId,
      totalUSD: 0,
      availableForSpending: 0,
      investedAmount: 0,
      strategyBalance: 0
    })
    
    // Initialize with zero USDC on Solana
    balance.updateAssetBalance('USDC', 0, 'SOL')
    
    await this.balanceRepository.save(balance)
    
    // Publish event
    await eventStore.appendEvent(
      balance.id,
      'BALANCE_INITIALIZED',
      {
        balanceId: balance.id,
        accountId
      }
    )
    
    return balance
  }

  /**
   * Get balance for account
   */
  async getBalance(accountId) {
    const balance = await this.balanceRepository.findByAccountId(accountId)
    if (!balance) {
      throw new Error('Balance not found')
    }
    
    // Update prices for all assets
    await this.updateAssetPrices(balance)
    
    return balance
  }

  /**
   * Credit balance (add funds)
   */
  async creditBalance(accountId, amount, asset = 'USDC', chain = 'SOL', metadata = {}) {
    const balance = await this.balanceRepository.findByAccountId(accountId)
    if (!balance) {
      throw new Error('Balance not found')
    }
    
    // Update balance
    balance.credit(amount, asset, chain)
    
    // Save balance
    await this.balanceRepository.save(balance)
    
    // Get and publish domain events
    const events = balance.getEvents()
    for (const event of events) {
      await eventStore.appendEvent(balance.id, event.type, {
        ...event.data,
        metadata
      })
    }
    
    // Update balance via CQRS
    await commandBus.execute(
      updateBalanceCommand(accountId, {
        balance: balance.toJSON()
      }, { userId: metadata.userId })
    )
    
    return balance
  }

  /**
   * Debit balance (deduct funds)
   */
  async debitBalance(accountId, amount, asset = 'USDC', chain = 'SOL', metadata = {}) {
    const balance = await this.balanceRepository.findByAccountId(accountId)
    if (!balance) {
      throw new Error('Balance not found')
    }
    
    // Update balance
    balance.debit(amount, asset, chain)
    
    // Save balance
    await this.balanceRepository.save(balance)
    
    // Get and publish domain events
    const events = balance.getEvents()
    for (const event of events) {
      await eventStore.appendEvent(balance.id, event.type, {
        ...event.data,
        metadata
      })
    }
    
    // Update balance via CQRS
    await commandBus.execute(
      updateBalanceCommand(accountId, {
        balance: balance.toJSON()
      }, { userId: metadata.userId })
    )
    
    return balance
  }

  /**
   * Transfer between assets
   */
  async transferBetweenAssets(accountId, fromAsset, toAsset, amount, chain = 'SOL') {
    const balance = await this.balanceRepository.findByAccountId(accountId)
    if (!balance) {
      throw new Error('Balance not found')
    }
    
    // Get exchange rate
    const exchangeRate = await this.priceService.getExchangeRate(fromAsset, toAsset)
    const toAmount = amount * exchangeRate
    
    // Debit from asset
    balance.debit(amount, fromAsset, chain)
    
    // Credit to asset
    balance.credit(toAmount, toAsset, chain)
    
    // Save balance
    await this.balanceRepository.save(balance)
    
    // Publish transfer event
    await eventStore.appendEvent(
      balance.id,
      'ASSET_TRANSFER_COMPLETED',
      {
        accountId,
        fromAsset,
        toAsset,
        fromAmount: amount,
        toAmount,
        exchangeRate,
        chain
      }
    )
    
    return {
      balance,
      fromAmount: amount,
      toAmount,
      exchangeRate
    }
  }

  /**
   * Lock funds for strategy
   */
  async lockFundsForStrategy(accountId, amount, strategyId) {
    const balance = await this.balanceRepository.findByAccountId(accountId)
    if (!balance) {
      throw new Error('Balance not found')
    }
    
    // Lock funds
    balance.lockForStrategy(amount, strategyId)
    
    // Save balance
    await this.balanceRepository.save(balance)
    
    // Get and publish domain events
    const events = balance.getEvents()
    for (const event of events) {
      await eventStore.appendEvent(balance.id, event.type, event.data)
    }
    
    return balance
  }

  /**
   * Release funds from strategy
   */
  async releaseFundsFromStrategy(accountId, amount, strategyId) {
    const balance = await this.balanceRepository.findByAccountId(accountId)
    if (!balance) {
      throw new Error('Balance not found')
    }
    
    // Release funds
    balance.releaseFromStrategy(amount, strategyId)
    
    // Save balance
    await this.balanceRepository.save(balance)
    
    // Get and publish domain events
    const events = balance.getEvents()
    for (const event of events) {
      await eventStore.appendEvent(balance.id, event.type, event.data)
    }
    
    return balance
  }

  /**
   * Update asset prices
   */
  async updateAssetPrices(balance) {
    const assets = Array.from(balance.assets.keys())
    const prices = await this.priceService.getPrices(assets)
    
    for (const [asset, assetBalance] of balance.assets) {
      const price = prices[asset] || 0
      assetBalance.updatePrice(price)
    }
    
    balance.recalculateTotals()
    await this.balanceRepository.save(balance)
    
    return balance
  }

  /**
   * Get balance breakdown by chain
   */
  async getBalanceByChain(accountId) {
    const balance = await this.getBalance(accountId)
    const breakdown = {}
    
    for (const [chain, chainBalance] of balance.chains) {
      breakdown[chain] = {
        totalUSD: chainBalance.getTotalUSDValue(),
        assets: Object.fromEntries(chainBalance.assets),
        gasBalance: chainBalance.gasBalance
      }
    }
    
    return breakdown
  }

  /**
   * Get balance breakdown by asset
   */
  async getBalanceByAsset(accountId) {
    const balance = await this.getBalance(accountId)
    const breakdown = {}
    
    for (const [asset, assetBalance] of balance.assets) {
      breakdown[asset] = {
        balance: assetBalance.balance,
        usdValue: assetBalance.usdValue,
        lastPrice: assetBalance.lastPrice,
        chain: assetBalance.chain
      }
    }
    
    return breakdown
  }

  /**
   * Get total value locked across all accounts
   */
  async getTotalValueLocked() {
    return await this.balanceRepository.getTotalValueLocked()
  }
}

/**
 * Mock Price Service for testing
 */
export class MockPriceService {
  constructor() {
    this.prices = {
      BTC: 45000,
      ETH: 3200,
      SOL: 120,
      SUI: 2.5,
      USDC: 1,
      USD: 1
    }
  }

  async getPrice(asset) {
    return this.prices[asset] || 0
  }

  async getPrices(assets) {
    const prices = {}
    for (const asset of assets) {
      prices[asset] = await this.getPrice(asset)
    }
    return prices
  }

  async getExchangeRate(fromAsset, toAsset) {
    const fromPrice = await this.getPrice(fromAsset)
    const toPrice = await this.getPrice(toAsset)
    
    if (toPrice === 0) {
      throw new Error(`No price available for ${toAsset}`)
    }
    
    return fromPrice / toPrice
  }
}