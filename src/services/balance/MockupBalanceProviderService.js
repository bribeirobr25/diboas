/**
 * Mockup Balance Provider Service
 * Simulates 3rd party balance provider APIs with realistic response times
 * This will be replaced with real blockchain/wallet integrations
 */

import logger from '../../utils/logger.js'

export class MockupBalanceProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get current wallet balances for all assets
   * In production, this would query blockchain APIs or wallet providers
   */
  async getWalletBalances() {
    await this.simulateNetworkDelay(300, 800)
    
    // Simulate realistic balance variations
    const generateBalance = (baseAmount) => {
      const variation = (Math.random() - 0.5) * 0.1 // ±5% variation
      return Math.max(0, baseAmount * (1 + variation))
    }

    return {
      availableForSpending: 0.00, // Clean state - no mock balances
      investedAmount: 0.00, // Clean state - no mock balances  
      strategyBalance: 0.00, // Clean state - no mock balances
      pendingTransactions: 0.00, // Clean state - no mock balances
      totalBalance: 0.00, // Clean state - no mock balances
      lastUpdated: Date.now()
    }
  }

  /**
   * Get balance breakdown by asset
   * In production, this would query specific asset balances from blockchain
   */
  async getAssetBalances() {
    await this.simulateNetworkDelay(200, 600)
    
    const generateAssetBalance = (usdValue, assetPrice) => {
      const variation = (Math.random() - 0.5) * 0.1
      const adjustedValue = Math.max(0, usdValue * (1 + variation))
      const assetAmount = adjustedValue / assetPrice
      
      return {
        usdValue: parseFloat(adjustedValue.toFixed(2)),
        assetAmount: parseFloat(assetAmount.toFixed(6))
      }
    }

    // Mock current asset prices (in production, would come from price service)
    const mockPrices = {
      BTC: 94523.45,
      ETH: 3245.67,
      SOL: 98.23,
      SUI: 4.12,
      USD: 1.00
    }

    return {
      BTC: { usdValue: 0.00, assetAmount: 0.000000 }, // Clean state
      ETH: { usdValue: 0.00, assetAmount: 0.000000 }, // Clean state
      SOL: { usdValue: 0.00, assetAmount: 0.000000 }, // Clean state
      SUI: { usdValue: 0.00, assetAmount: 0.000000 }, // Clean state
      USD: { usdValue: 0.00, assetAmount: 0.000000 } // Clean state
    }
  }

  /**
   * Get balance history for charts
   * In production, this would query historical balance data
   */
  async getBalanceHistory(timeframe = '7d') {
    await this.simulateNetworkDelay(400, 900)
    
    const currentBalance = await this.getTotalBalance()
    const baseBalance = currentBalance
    
    // Generate mock historical data
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720
    const dataPoints = []
    
    for (let i = hours; i >= 0; i--) {
      const timestamp = Date.now() - (i * 60 * 60 * 1000)
      const variation = (Math.random() - 0.5) * 0.15 // ±7.5% variation
      const balance = Math.max(0, baseBalance * (1 + variation))
      
      dataPoints.push({
        timestamp,
        totalBalance: parseFloat(balance.toFixed(2)),
        availableBalance: parseFloat((balance * 0.6).toFixed(2)),
        investedBalance: parseFloat((balance * 0.4).toFixed(2))
      })
    }
    
    return dataPoints
  }

  /**
   * Get total balance (calculated)
   */
  async getTotalBalance() {
    const balances = await this.getWalletBalances()
    const total = balances.availableForSpending + balances.investedAmount + balances.strategyBalance
    return parseFloat(total.toFixed(2))
  }

  /**
   * Get balance breakdown for specific transaction types
   */
  async getBalanceForTransaction(transactionType) {
    const balances = await this.getWalletBalances()
    
    switch (transactionType) {
      case 'add':
        // Add transactions don't require existing balance
        return { available: Infinity, sufficient: true }
        
      case 'send':
      case 'withdraw':
        return {
          available: balances.availableForSpending,
          sufficient: true // Will be checked against specific amounts
        }
        
      case 'buy':
        return {
          available: balances.availableForSpending,
          sufficient: true // Depends on payment method
        }
        
      case 'sell':
        return {
          available: balances.investedAmount,
          sufficient: balances.investedAmount > 0
        }
        
      case 'start_strategy':
        return {
          available: balances.availableForSpending,
          sufficient: balances.availableForSpending > 0
        }
        
      case 'stop_strategy':
        return {
          available: balances.strategyBalance,
          sufficient: balances.strategyBalance > 0
        }
        
      default:
        return {
          available: balances.totalBalance || 0,
          sufficient: false
        }
    }
  }

  /**
   * Get pending transactions affecting balance
   * In production, this would query mempool/pending transaction APIs
   */
  async getPendingTransactions() {
    await this.simulateNetworkDelay(150, 400)
    
    // Simulate 0-3 pending transactions
    const pendingCount = Math.floor(Math.random() * 4)
    const pendingTransactions = []
    
    for (let i = 0; i < pendingCount; i++) {
      pendingTransactions.push({
        id: `pending_${Date.now()}_${i}`,
        type: ['add', 'send', 'buy', 'sell'][Math.floor(Math.random() * 4)],
        amount: parseFloat((Math.random() * 500 + 10).toFixed(2)),
        timestamp: Date.now() - (Math.random() * 300000), // Up to 5 minutes ago
        status: 'pending'
      })
    }
    
    return pendingTransactions
  }

  /**
   * Get all balance data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllBalanceData() {
    // In production, this would be a single API call or parallel calls
    const [walletBalances, assetBalances, pendingTransactions] = await Promise.all([
      this.getWalletBalances(),
      this.getAssetBalances(),
      this.getPendingTransactions()
    ])

    const totalBalance = walletBalances.availableForSpending + 
                        walletBalances.investedAmount + 
                        walletBalances.strategyBalance

    const allBalanceData = {
      ...walletBalances,
      totalBalance: parseFloat(totalBalance.toFixed(2)),
      assetBalances,
      pendingTransactions,
      timestamp: Date.now()
    }

    return allBalanceData
  }

  /**
   * Refresh balance data (force update)
   * In production, this would trigger blockchain re-sync
   */
  async refreshBalances() {
    await this.simulateNetworkDelay(500, 1200) // Longer delay for full refresh
    
    logger.debug('MockupBalanceProviderService: Refreshing balance data from blockchain')
    return await this.getAllBalanceData()
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 200, maxMs = 800) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates blockchain/wallet provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(100, 300)
      
      // Simulate occasional blockchain network issues (2% chance)
      if (Math.random() < 0.02) {
        throw new Error('Mockup balance provider - blockchain network temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 400 + 200, // 200-600ms
        blockchainConnections: {
          BTC: 'connected',
          ETH: 'connected',
          SOL: 'connected',
          SUI: 'connected'
        },
        lastSyncTime: Date.now() - Math.random() * 60000 // Last sync within 1 minute
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now()
      }
    }
  }
}

// Export singleton instance
export const mockupBalanceProviderService = new MockupBalanceProviderService()

// Export class for testing
export default MockupBalanceProviderService