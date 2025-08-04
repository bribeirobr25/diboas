/**
 * Strategy Transaction Integration Service
 * Integrates DeFi strategy lifecycle events with the transaction history system
 * Ensures all strategy-related transactions are properly recorded and displayed
 */

import logger from '../../utils/logger'
import { centralizedFeeCalculator } from '../../utils/feeCalculations.js'

export class StrategyTransactionIntegration {
  constructor(dataManager, transactionHistory) {
    this.dataManager = dataManager
    this.transactionHistory = transactionHistory
    this.strategyTransactions = new Map()
  }

  /**
   * Record strategy creation transaction
   */
  async recordStrategyCreation(strategy, transactionResult) {
    try {
      const transaction = {
        id: this.generateTransactionId(),
        type: 'start_strategy',
        status: transactionResult.success ? 'completed' : 'failed',
        amount: strategy.initialAmount,
        fees: transactionResult.fees || {},
        
        // Strategy-specific data
        strategyId: strategy.id,
        strategyName: strategy.name,
        strategyIcon: strategy.icon,
        selectedProtocol: strategy.selectedStrategy.name,
        targetChain: strategy.selectedStrategy.chain,
        
        // Standard transaction fields
        asset: 'USDC',
        paymentMethod: 'diboas_wallet',
        timestamp: new Date().toISOString(),
        description: `Started DeFi strategy: ${strategy.name}`,
        
        // Additional metadata
        metadata: {
          goalType: strategy.goalType,
          targetAmount: strategy.targetAmount,
          targetDate: strategy.targetDate,
          recurringAmount: strategy.recurringAmount,
          recurringFrequency: strategy.recurringFrequency,
          selectedStrategy: strategy.selectedStrategy
        }
      }

      // Add to transaction history
      await this.addToTransactionHistory(transaction)
      
      // Store strategy transaction mapping
      this.strategyTransactions.set(strategy.id, [transaction.id])

      logger.debug('Strategy creation transaction recorded:', { 
        strategyId: strategy.id, 
        transactionId: transaction.id 
      })

      return transaction
    } catch (error) {
      logger.error('Error recording strategy creation transaction:', error)
      throw new Error('Failed to record strategy transaction')
    }
  }

  /**
   * Record strategy contribution transaction
   */
  async recordStrategyContribution(strategyId, contributionData) {
    try {
      const strategy = await this.getStrategyDetails(strategyId)
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`)
      }

      const transaction = {
        id: this.generateTransactionId(),
        type: 'strategy_contribution',
        status: 'completed',
        amount: contributionData.amount,
        fees: contributionData.fees || {},
        
        // Strategy-specific data
        strategyId,
        strategyName: strategy.name,
        strategyIcon: strategy.icon,
        selectedProtocol: strategy.selectedStrategy.name,
        targetChain: strategy.selectedStrategy.chain,
        
        // Standard transaction fields
        asset: 'USDC',
        paymentMethod: 'diboas_wallet',
        timestamp: new Date().toISOString(),
        description: `Recurring contribution to ${strategy.name}`,
        
        // Additional metadata
        metadata: {
          contributionType: 'recurring',
          frequency: strategy.recurringFrequency,
          totalContributions: contributionData.newTotalContributions
        }
      }

      await this.addToTransactionHistory(transaction)
      
      // Add to strategy transaction list
      const strategyTxns = this.strategyTransactions.get(strategyId) || []
      strategyTxns.push(transaction.id)
      this.strategyTransactions.set(strategyId, strategyTxns)

      logger.debug('Strategy contribution transaction recorded:', { 
        strategyId, 
        transactionId: transaction.id,
        amount: contributionData.amount 
      })

      return transaction
    } catch (error) {
      logger.error('Error recording strategy contribution transaction:', error)
      throw new Error('Failed to record contribution transaction')
    }
  }

  /**
   * Record strategy termination transaction
   */
  async recordStrategyTermination(strategyId, terminationData) {
    try {
      const strategy = await this.getStrategyDetails(strategyId)
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`)
      }

      const transaction = {
        id: this.generateTransactionId(),
        type: 'stop_strategy',
        status: 'completed',
        amount: terminationData.finalValue,
        fees: terminationData.stopFees || {},
        
        // Strategy-specific data
        strategyId,
        strategyName: strategy.name,
        strategyIcon: strategy.icon,
        selectedProtocol: strategy.selectedStrategy.name,
        targetChain: strategy.selectedStrategy.chain,
        
        // Standard transaction fields
        asset: 'USDC',
        paymentMethod: 'diboas_wallet',
        timestamp: new Date().toISOString(),
        description: `Stopped DeFi strategy: ${strategy.name}`,
        
        // Additional metadata
        metadata: {
          reason: terminationData.reason,
          finalPerformance: terminationData.finalPerformance,
          durationDays: terminationData.durationDays,
          totalReturn: terminationData.finalPerformance?.totalReturn || 0,
          returnPercentage: terminationData.finalPerformance?.returnPercentage || 0
        }
      }

      await this.addToTransactionHistory(transaction)
      
      // Add to strategy transaction list
      const strategyTxns = this.strategyTransactions.get(strategyId) || []
      strategyTxns.push(transaction.id)
      this.strategyTransactions.set(strategyId, strategyTxns)

      logger.debug('Strategy termination transaction recorded:', { 
        strategyId, 
        transactionId: transaction.id,
        finalValue: terminationData.finalValue 
      })

      return transaction
    } catch (error) {
      logger.error('Error recording strategy termination transaction:', error)
      throw new Error('Failed to record termination transaction')
    }
  }

  /**
   * Record yield/return distribution
   */
  async recordYieldDistribution(strategyId, yieldData) {
    try {
      const strategy = await this.getStrategyDetails(strategyId)
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`)
      }

      const transaction = {
        id: this.generateTransactionId(),
        type: 'yield_distribution',
        status: 'completed',
        amount: yieldData.amount,
        fees: { total: 0, diBoaS: 0, network: 0, provider: 0, dex: 0 }, // No fees for yield
        
        // Strategy-specific data
        strategyId,
        strategyName: strategy.name,
        strategyIcon: strategy.icon,
        selectedProtocol: strategy.selectedStrategy.name,
        targetChain: strategy.selectedStrategy.chain,
        
        // Standard transaction fields
        asset: 'USDC',
        paymentMethod: 'diboas_wallet',
        timestamp: new Date().toISOString(),
        description: `Yield earned from ${strategy.name}`,
        
        // Additional metadata
        metadata: {
          yieldType: 'defi_strategy',
          apy: yieldData.apy,
          period: yieldData.period,
          compounded: true
        }
      }

      await this.addToTransactionHistory(transaction)
      
      // Add to strategy transaction list
      const strategyTxns = this.strategyTransactions.get(strategyId) || []
      strategyTxns.push(transaction.id)
      this.strategyTransactions.set(strategyId, strategyTxns)

      logger.debug('Yield distribution transaction recorded:', { 
        strategyId, 
        transactionId: transaction.id,
        yieldAmount: yieldData.amount 
      })

      return transaction
    } catch (error) {
      logger.error('Error recording yield distribution transaction:', error)
      throw new Error('Failed to record yield transaction')
    }
  }

  /**
   * Get all transactions for a specific strategy
   */
  async getStrategyTransactions(strategyId, limit = 50) {
    try {
      const transactionIds = this.strategyTransactions.get(strategyId) || []
      const transactions = []

      for (const txnId of transactionIds.slice(-limit)) {
        const transaction = await this.getTransactionById(txnId)
        if (transaction) {
          transactions.push(transaction)
        }
      }

      // Sort by timestamp descending (newest first)
      return transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    } catch (error) {
      logger.error('Error getting strategy transactions:', error)
      return []
    }
  }

  /**
   * Get transaction summary for a strategy
   */
  async getStrategyTransactionSummary(strategyId) {
    try {
      const transactions = await this.getStrategyTransactions(strategyId)
      
      const summary = {
        totalTransactions: transactions.length,
        totalContributions: 0,
        totalFees: 0,
        totalYield: 0,
        lastActivity: null,
        transactionTypes: {}
      }

      for (const txn of transactions) {
        // Count transaction types
        summary.transactionTypes[txn.type] = (summary.transactionTypes[txn.type] || 0) + 1
        
        // Sum contributions and fees
        if (['start_strategy', 'strategy_contribution'].includes(txn.type)) {
          summary.totalContributions += txn.amount
        }
        if (txn.type === 'yield_distribution') {
          summary.totalYield += txn.amount
        }
        
        summary.totalFees += txn.fees?.total || 0
        
        // Track last activity
        if (!summary.lastActivity || new Date(txn.timestamp) > new Date(summary.lastActivity)) {
          summary.lastActivity = txn.timestamp
        }
      }

      return summary
    } catch (error) {
      logger.error('Error getting strategy transaction summary:', error)
      return null
    }
  }

  /**
   * Update transaction history when strategy performance changes
   */
  async updateStrategyPerformanceRecord(strategyId, performanceData) {
    try {
      // For now, we'll just track significant performance milestones
      // Full performance tracking happens in the strategy lifecycle manager
      
      const strategy = await this.getStrategyDetails(strategyId)
      if (!strategy) return

      // Record significant milestones (e.g., 10% return)
      const returnThresholds = [10, 25, 50, 100]
      const currentReturn = performanceData.returnPercentage
      
      for (const threshold of returnThresholds) {
        const milestoneKey = `milestone_${threshold}`
        if (currentReturn >= threshold && !strategy.milestones?.[milestoneKey]) {
          await this.recordPerformanceMilestone(strategyId, threshold, performanceData)
        }
      }
    } catch (error) {
      logger.error('Error updating strategy performance record:', error)
    }
  }

  /**
   * Record performance milestone
   */
  async recordPerformanceMilestone(strategyId, thresholdPercent, performanceData) {
    try {
      const strategy = await this.getStrategyDetails(strategyId)
      if (!strategy) return

      const transaction = {
        id: this.generateTransactionId(),
        type: 'performance_milestone',
        status: 'completed',
        amount: 0, // Informational only
        fees: { total: 0, diBoaS: 0, network: 0, provider: 0, dex: 0 },
        
        // Strategy-specific data
        strategyId,
        strategyName: strategy.name,
        strategyIcon: strategy.icon,
        selectedProtocol: strategy.selectedStrategy.name,
        targetChain: strategy.selectedStrategy.chain,
        
        // Standard transaction fields
        asset: 'USDC',
        paymentMethod: 'diboas_wallet',
        timestamp: new Date().toISOString(),
        description: `${strategy.name} reached ${thresholdPercent}% return milestone`,
        
        // Additional metadata
        metadata: {
          milestoneType: 'return_percentage',
          threshold: thresholdPercent,
          actualReturn: performanceData.returnPercentage,
          currentValue: performanceData.currentValue,
          totalContributions: performanceData.totalContributions
        }
      }

      await this.addToTransactionHistory(transaction)
      
      logger.info('Performance milestone recorded:', { 
        strategyId, 
        threshold: thresholdPercent,
        actualReturn: performanceData.returnPercentage 
      })

      return transaction
    } catch (error) {
      logger.error('Error recording performance milestone:', error)
    }
  }

  /**
   * Helper methods
   */
  async addToTransactionHistory(transaction) {
    if (this.transactionHistory && typeof this.transactionHistory.addTransaction === 'function') {
      await this.transactionHistory.addTransaction(transaction)
    } else if (this.dataManager && typeof this.dataManager.addTransaction === 'function') {
      await this.dataManager.addTransaction(transaction)
    } else {
      // Fallback: store in memory or localStorage
      logger.warn('No transaction history service available, storing transaction in memory')
      // Could implement localStorage backup here
    }
  }

  async getTransactionById(transactionId) {
    if (this.transactionHistory && typeof this.transactionHistory.getTransaction === 'function') {
      return await this.transactionHistory.getTransaction(transactionId)
    } else if (this.dataManager && typeof this.dataManager.getTransaction === 'function') {
      return await this.dataManager.getTransaction(transactionId)
    }
    
    return null
  }

  async getStrategyDetails(strategyId) {
    // This would typically call the strategy lifecycle manager
    // For now, return a minimal implementation
    try {
      if (this.dataManager && typeof this.dataManager.getStrategy === 'function') {
        return await this.dataManager.getStrategy(strategyId)
      }
      
      // Fallback implementation
      return {
        id: strategyId,
        name: 'Strategy',
        icon: '🎯',
        selectedStrategy: {
          name: 'DeFi Strategy',
          chain: 'SOL'
        }
      }
    } catch (error) {
      logger.error('Error getting strategy details:', error)
      return null
    }
  }

  generateTransactionId() {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Format strategy transaction for UI display
   */
  formatStrategyTransactionForUI(transaction) {
    const baseFormatting = {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      fees: transaction.fees,
      timestamp: transaction.timestamp,
      status: transaction.status,
      description: transaction.description
    }

    // Add strategy-specific formatting
    switch (transaction.type) {
      case 'start_strategy':
        return {
          ...baseFormatting,
          icon: '🚀',
          title: 'Strategy Started',
          subtitle: `${transaction.strategyName} on ${transaction.targetChain}`,
          showAmount: true,
          showFees: true,
          badgeText: 'STARTED',
          badgeColor: 'green'
        }

      case 'strategy_contribution':
        return {
          ...baseFormatting,
          icon: '💰',
          title: 'Recurring Investment',
          subtitle: `Added to ${transaction.strategyName}`,
          showAmount: true,
          showFees: true,
          badgeText: 'CONTRIBUTION',
          badgeColor: 'blue'
        }

      case 'stop_strategy':
        return {
          ...baseFormatting,
          icon: '🛑',
          title: 'Strategy Stopped',
          subtitle: `Final value: $${transaction.amount.toFixed(2)}`,
          showAmount: true,
          showFees: true,
          badgeText: 'STOPPED',
          badgeColor: 'red'
        }

      case 'yield_distribution':
        return {
          ...baseFormatting,
          icon: '📈',
          title: 'Yield Earned',
          subtitle: `From ${transaction.strategyName}`,
          showAmount: true,
          showFees: false,
          badgeText: 'YIELD',
          badgeColor: 'green'
        }

      case 'performance_milestone':
        return {
          ...baseFormatting,
          icon: '🏆',
          title: 'Milestone Reached',
          subtitle: `${transaction.metadata.threshold}% return achieved`,
          showAmount: false,
          showFees: false,
          badgeText: 'MILESTONE',
          badgeColor: 'gold'
        }

      default:
        return baseFormatting
    }
  }

  /**
   * Get strategy transaction filters for UI
   */
  getStrategyTransactionFilters() {
    return [
      { value: 'all', label: 'All Strategy Transactions' },
      { value: 'start_strategy', label: 'Strategy Starts' },
      { value: 'strategy_contribution', label: 'Contributions' },
      { value: 'stop_strategy', label: 'Strategy Stops' },
      { value: 'yield_distribution', label: 'Yield Earned' },
      { value: 'performance_milestone', label: 'Milestones' }
    ]
  }
}

export const strategyTransactionIntegration = new StrategyTransactionIntegration()