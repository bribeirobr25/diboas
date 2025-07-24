/**
 * Transaction Processing Engine
 * Central coordinator for all transaction types with auto-routing and provider management
 */

import { getIntegrationManager } from '../integrations/IntegrationManager.js'
import MultiWalletManager from './MultiWalletManager.js'
import { generateSecureId } from '../../utils/security.js'
import { logSecureEvent } from '../../utils/securityLogging.js'

export class TransactionEngine {
  constructor() {
    this.walletManager = new MultiWalletManager()
    this.integrationManager = null
    this.activeTransactions = new Map()
    this.transactionHistory = new Map()
    
    // Fee structure as per requirements
    this.feeStructure = {
      'add': { diBoaS: 0.0009, maxProvider: 0.029 }, // 0.09% + up to 2.9% provider
      'withdraw': { diBoaS: 0.009, maxProvider: 0.029 }, // 0.9% + up to 2.9% provider
      'send': { diBoaS: 0.0009 }, // 0.09%
      'receive': { diBoaS: 0.0009 }, // 0.09%
      'transfer': { diBoaS: 0.009 }, // 0.9%
      'buy': { diBoaS: 0.0009 }, // 0.09%
      'sell': { diBoaS: 0.0009 }, // 0.09%
      'invest': { diBoaS: 0.0009 } // 0.09%
    }

    this.minimumAmounts = {
      'add': 10.0,
      'withdraw': 5.0,
      'send': 5.0,
      'receive': 5.0,
      'transfer': 5.0,
      'buy': 10.0,
      'sell': 5.0,
      'invest': 10.0
    }
  }

  /**
   * Initialize transaction engine
   */
  async initialize() {
    try {
      this.integrationManager = await getIntegrationManager()
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to initialize transaction engine: ${error.message}`)
    }
  }

  /**
   * Process transaction with comprehensive validation and routing
   */
  async processTransaction(userId, transactionData, options = {}) {
    const transactionId = generateSecureId()
    
    try {
      // Log transaction initiation
      logSecureEvent('transaction_initiated', {
        transactionId,
        userId,
        type: transactionData.type,
        amount: transactionData.amount
      })

      // Step 1: Validate transaction
      const validation = await this.validateTransaction(userId, transactionData)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.error}`)
      }

      // Step 2: Check balances and routing
      const routingPlan = await this.planTransactionRouting(userId, transactionData)
      if (!routingPlan.feasible) {
        throw new Error(`Insufficient funds: ${routingPlan.error}`)
      }

      // Step 3: Calculate final fees
      const feeCalculation = await this.calculateComprehensiveFees(transactionData, routingPlan)

      // Step 4: Create transaction record
      const transaction = {
        id: transactionId,
        userId,
        type: transactionData.type,
        status: 'processing',
        amount: transactionData.amount,
        fees: feeCalculation,
        routing: routingPlan,
        metadata: {
          ...transactionData,
          initiatedAt: new Date().toISOString(),
          userAgent: options.userAgent,
          ipAddress: options.ipAddress
        }
      }

      this.activeTransactions.set(transactionId, transaction)

      // Step 5: Execute transaction based on type
      let result
      switch (transactionData.type) {
        case 'add':
          result = await this.processOnRamp(userId, transactionData, routingPlan, feeCalculation)
          break
        case 'withdraw':
          result = await this.processOffRamp(userId, transactionData, routingPlan, feeCalculation)
          break
        case 'send':
          result = await this.processSend(userId, transactionData, routingPlan, feeCalculation)
          break
        case 'receive':
          result = await this.processReceive(userId, transactionData, routingPlan, feeCalculation)
          break
        case 'transfer':
          result = await this.processExternalTransfer(userId, transactionData, routingPlan, feeCalculation)
          break
        case 'buy':
          result = await this.processBuy(userId, transactionData, routingPlan, feeCalculation)
          break
        case 'sell':
          result = await this.processSell(userId, transactionData, routingPlan, feeCalculation)
          break
        case 'invest':
          result = await this.processInvest(userId, transactionData, routingPlan, feeCalculation)
          break
        default:
          throw new Error(`Unsupported transaction type: ${transactionData.type}`)
      }

      // Step 6: Update transaction status
      transaction.status = result.success ? 'completed' : 'failed'
      transaction.result = result
      transaction.completedAt = new Date().toISOString()

      // Step 7: Update wallet balances
      if (result.success) {
        await this.walletManager.updateBalances(userId, {
          type: transactionData.type,
          amount: transactionData.amount,
          netAmount: parseFloat(transactionData.amount) - parseFloat(feeCalculation.total || 0),
          fees: feeCalculation,
          paymentMethod: transactionData.paymentMethod,
          fromChain: routingPlan.fromChain,
          toChain: routingPlan.toChain,
          asset: transactionData.asset
        })
      }

      // Step 8: Move to history and clean up
      this.transactionHistory.set(transactionId, transaction)
      this.activeTransactions.delete(transactionId)

      // Log completion
      logSecureEvent('transaction_completed', {
        transactionId,
        userId,
        status: transaction.status,
        amount: transactionData.amount
      })

      return {
        success: result.success,
        transactionId,
        transaction,
        balance: await this.walletManager.getUnifiedBalance(userId, true)
      }

    } catch (error) {
      // Update transaction with error
      const transaction = this.activeTransactions.get(transactionId)
      if (transaction) {
        transaction.status = 'failed'
        transaction.error = error.message
        transaction.completedAt = new Date().toISOString()
        this.transactionHistory.set(transactionId, transaction)
        this.activeTransactions.delete(transactionId)
      }

      logSecureEvent('transaction_failed', {
        transactionId,
        userId,
        error: error.message
      })

      throw error
    }
  }

  /**
   * Validate transaction against business rules and limits
   */
  async validateTransaction(userId, transactionData) {
    const { type, amount, recipient, asset } = transactionData

    // Basic validation
    if (!type || !amount) {
      return { isValid: false, error: 'Missing required fields' }
    }

    // Amount validation
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return { isValid: false, error: 'Invalid amount' }
    }

    // Minimum amount validation
    const minimumAmount = this.minimumAmounts[type]
    if (numericAmount < minimumAmount) {
      return { isValid: false, error: `Minimum amount for ${type} is $${minimumAmount}` }
    }

    // Recipient validation for peer-to-peer transactions
    if (['send', 'receive', 'transfer'].includes(type)) {
      if (!recipient) {
        return { isValid: false, error: 'Recipient is required' }
      }

      // Validate recipient format
      if (type === 'transfer') {
        if (!this.isValidWalletAddress(recipient)) {
          return { isValid: false, error: 'Invalid wallet address' }
        }
      } else {
        if (!this.isValidDiBoaSUsername(recipient)) {
          return { isValid: false, error: 'Invalid diBoaS username' }
        }
      }
    }

    // Asset validation for buy/sell/invest
    if (['buy', 'sell', 'invest'].includes(type)) {
      if (!asset) {
        return { isValid: false, error: 'Asset selection is required' }
      }

      if (!this.isValidAsset(asset, type)) {
        return { isValid: false, error: `Invalid asset for ${type} transaction` }
      }
    }

    // Balance validation will be done in routing plan
    return { isValid: true }
  }

  /**
   * Plan optimal routing for transaction
   */
  async planTransactionRouting(userId, transactionData) {
    const { type, amount, asset } = transactionData
    const numericAmount = parseFloat(amount)

    try {
      // Get current unified balance
      const balance = await this.walletManager.getUnifiedBalance(userId)

      // Default routing plan
      const plan = {
        feasible: false,
        fromChain: 'SOL',
        toChain: 'SOL',
        fromAsset: 'USDC',
        toAsset: 'USDC',
        routingSteps: [],
        estimatedTime: 30,
        needsRouting: false
      }

      switch (type) {
        case 'add':
          // On-ramp always goes to Solana as USDC + SOL for gas
          plan.feasible = true
          plan.toChain = 'SOL'
          plan.toAsset = 'USDC'
          plan.routingSteps = [
            { action: 'onramp', provider: 'stripe', amount: numericAmount }
          ]
          break

        case 'withdraw':
          // Off-ramp from Solana USDC
          const availableUSDC = balance.breakdown.SOL?.usdc || 0
          plan.feasible = availableUSDC >= numericAmount
          plan.fromChain = 'SOL'
          plan.fromAsset = 'USDC'
          plan.routingSteps = [
            { action: 'offramp', provider: 'stripe', amount: numericAmount }
          ]
          break

        case 'send':
        case 'receive':
          // P2P on Solana using USDC
          const availableForP2P = balance.breakdown.SOL?.usdc || 0
          if (type === 'send') {
            plan.feasible = availableForP2P >= numericAmount
          } else {
            plan.feasible = true // Receiving doesn't require balance check
          }
          plan.fromChain = 'SOL'
          plan.toChain = 'SOL'
          plan.routingSteps = [
            { action: 'transfer', chain: 'SOL', asset: 'USDC', amount: numericAmount }
          ]
          break

        case 'transfer':
          // External transfer - detect target chain and route accordingly
          const targetChain = this.detectChainFromAddress(transactionData.recipient)
          const routingOptions = await this.walletManager.findRoutingOptions(userId, numericAmount, 'USDC', targetChain)
          
          plan.feasible = routingOptions.length > 0
          if (plan.feasible) {
            const bestRoute = routingOptions[0]
            plan.fromChain = bestRoute.fromChain
            plan.toChain = bestRoute.toChain
            plan.fromAsset = bestRoute.fromAsset
            plan.toAsset = bestRoute.toAsset
            plan.needsRouting = bestRoute.fromChain !== bestRoute.toChain
            plan.routingSteps = this.buildRoutingSteps(bestRoute)
            plan.estimatedTime = bestRoute.estimatedTime
          }
          break

        case 'buy':
          // Buy asset - route to appropriate chain
          const assetChain = this.getAssetNativeChain(asset)
          const buyRoutingOptions = await this.walletManager.findRoutingOptions(userId, numericAmount, 'USDC', assetChain)
          
          plan.feasible = buyRoutingOptions.length > 0
          if (plan.feasible) {
            const bestRoute = buyRoutingOptions[0]
            plan.fromChain = bestRoute.fromChain
            plan.toChain = assetChain
            plan.fromAsset = 'USDC'
            plan.toAsset = asset
            plan.needsRouting = true
            plan.routingSteps = [
              ...this.buildRoutingSteps(bestRoute),
              { action: 'swap', chain: assetChain, fromAsset: 'USDC', toAsset: asset, amount: numericAmount }
            ]
          }
          break

        case 'sell':
          // Sell asset - always convert to USDC on Solana
          const assetBalance = balance.assets[asset]
          plan.feasible = assetBalance && assetBalance.usdValue >= numericAmount
          if (plan.feasible) {
            const sellAssetChain = this.getAssetNativeChain(asset)
            plan.fromChain = sellAssetChain
            plan.toChain = 'SOL'
            plan.fromAsset = asset
            plan.toAsset = 'USDC'
            plan.needsRouting = true
            plan.routingSteps = [
              { action: 'swap', chain: sellAssetChain, fromAsset: asset, toAsset: 'USDC', amount: numericAmount },
              { action: 'bridge', fromChain: sellAssetChain, toChain: 'SOL', asset: 'USDC', amount: numericAmount }
            ]
          }
          break

        case 'invest':
          // Investment products on Solana
          const investBalance = balance.breakdown.SOL?.usdc || 0
          plan.feasible = investBalance >= numericAmount
          plan.fromChain = 'SOL'
          plan.toChain = 'SOL'
          plan.fromAsset = 'USDC'
          plan.toAsset = asset
          plan.routingSteps = [
            { action: 'invest', provider: 'investment_provider', asset, amount: numericAmount }
          ]
          break
      }

      if (!plan.feasible) {
        plan.error = `Insufficient balance for ${type} transaction`
      }

      return plan
    } catch (error) {
      return {
        feasible: false,
        error: `Routing planning failed: ${error.message}`
      }
    }
  }

  /**
   * Calculate comprehensive fees for transaction
   */
  async calculateComprehensiveFees(transactionData, routingPlan) {
    const { type, amount } = transactionData
    const numericAmount = parseFloat(amount)
    const feeConfig = this.feeStructure[type]

    const fees = {
      diBoaS: numericAmount * feeConfig.diBoaS,
      network: 0,
      provider: 0,
      routing: 0,
      total: 0,
      breakdown: []
    }

    // Network fees based on chains involved
    const chainsUsed = new Set([routingPlan.fromChain, routingPlan.toChain])
    chainsUsed.forEach(chain => {
      const chainFee = this.getChainNetworkFee(chain)
      fees.network += chainFee
      fees.breakdown.push({
        type: 'network',
        description: `${chain} network fee`,
        amount: chainFee
      })
    })

    // Provider fees for on/off-ramp
    if (['add', 'withdraw'].includes(type) && feeConfig.maxProvider) {
      fees.provider = numericAmount * feeConfig.maxProvider
      fees.breakdown.push({
        type: 'provider',
        description: 'Payment provider fee',
        amount: fees.provider
      })
    }

    // Routing fees for cross-chain operations
    if (routingPlan.needsRouting) {
      const routingFees = await this.calculateRoutingFees(routingPlan)
      fees.routing = routingFees.total
      fees.breakdown.push({
        type: 'routing',
        description: 'Cross-chain routing fee',
        amount: fees.routing
      })
    }

    // Investment provider fees
    if (type === 'invest') {
      const investmentFee = numericAmount * 0.005 // 0.5% investment provider fee
      fees.provider = investmentFee
      fees.breakdown.push({
        type: 'provider',
        description: 'Investment provider fee',
        amount: investmentFee
      })
    }

    // Calculate total
    fees.total = fees.diBoaS + fees.network + fees.provider + fees.routing

    // Add diBoaS fee to breakdown
    fees.breakdown.unshift({
      type: 'diBoaS',
      description: `diBoaS fee (${(feeConfig.diBoaS * 100).toFixed(2)}%)`,
      amount: fees.diBoaS
    })

    return fees
  }

  /**
   * Process on-ramp transaction (Add money)
   */
  async processOnRamp(userId, transactionData, routingPlan, fees) {
    try {
      // Execute via payment integration
      const result = await this.integrationManager.execute(
        'payment',
        'processPayment',
        {
          amount: transactionData.amount,
          currency: 'USD',
          paymentMethod: transactionData.paymentMethod,
          metadata: {
            userId,
            type: 'onramp',
            targetChain: 'SOL'
          }
        }
      )

      if (result.success) {
        // Simulate wallet funding
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        return {
          success: true,
          transactionHash: `tx_onramp_${Date.now()}`,
          providerTransactionId: result.result.id,
          amountReceived: parseFloat(transactionData.amount) - fees.total
        }
      }

      throw new Error('On-ramp provider failed')
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Process off-ramp transaction (Withdraw money)
   */
  async processOffRamp(userId, transactionData, routingPlan, fees) {
    try {
      // Check for KYC requirement
      const kycStatus = await this.checkKYCStatus(userId)
      if (!kycStatus.verified) {
        // Trigger KYC process
        await this.triggerKYC(userId, transactionData)
        throw new Error('KYC verification required for withdrawal')
      }

      // Execute via payment integration
      const result = await this.integrationManager.execute(
        'payment',
        'processWithdrawal',
        {
          amount: transactionData.amount,
          currency: 'USD',
          destination: transactionData.destination,
          metadata: {
            userId,
            type: 'offramp',
            sourceChain: 'SOL'
          }
        }
      )

      if (result.success) {
        return {
          success: true,
          transactionHash: `tx_offramp_${Date.now()}`,
          providerTransactionId: result.result.id,
          amountSent: parseFloat(transactionData.amount)
        }
      }

      throw new Error('Off-ramp provider failed')
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Process send transaction (P2P internal)
   */
  async processSend(userId, transactionData, routingPlan, fees) {
    try {
      // Resolve recipient diBoaS username to wallet address
      const recipientAddress = await this.resolveDiBoaSUsername(transactionData.recipient)
      
      // Execute on-chain transfer
      const result = await this.integrationManager.execute(
        'onchain',
        'sendTransaction',
        {
          fromAddress: routingPlan.fromAddress,
          toAddress: recipientAddress,
          amount: transactionData.amount,
          asset: 'USDC',
          chain: 'SOL'
        }
      )

      return {
        success: result.success,
        transactionHash: result.transactionHash || `tx_send_${Date.now()}`,
        recipient: transactionData.recipient,
        amountSent: parseFloat(transactionData.amount)
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Process receive transaction (P2P internal)
   */
  async processReceive(userId, transactionData, routingPlan, fees) {
    try {
      // Create payment request
      const paymentRequest = {
        requestId: generateSecureId(),
        fromUser: transactionData.fromUser,
        toUser: userId,
        amount: transactionData.amount,
        message: transactionData.message || '',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      // Store payment request for processing when sender responds
      // In real implementation, this would be stored in database
      return {
        success: true,
        paymentRequestId: paymentRequest.requestId,
        amountRequested: parseFloat(transactionData.amount)
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Process external transfer
   */
  async processExternalTransfer(userId, transactionData, routingPlan, fees) {
    try {
      // Execute routing if needed
      if (routingPlan.needsRouting) {
        const routingOption = {
          fromChain: routingPlan.fromChain,
          fromAsset: routingPlan.fromAsset,
          toChain: routingPlan.toChain,
          toAsset: routingPlan.toAsset,
          fromAmount: parseFloat(transactionData.amount)
        }

        await this.walletManager.executeRouting(userId, routingOption)
      }

      // Execute external transfer
      const result = await this.integrationManager.execute(
        'onchain',
        'sendTransaction',
        {
          toAddress: transactionData.recipient,
          amount: transactionData.amount,
          asset: 'USDC',
          chain: routingPlan.toChain
        }
      )

      return {
        success: result.success,
        transactionHash: result.transactionHash || `tx_transfer_${Date.now()}`,
        recipient: transactionData.recipient,
        chain: routingPlan.toChain,
        amountSent: parseFloat(transactionData.amount)
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Process asset buy transaction
   */
  async processBuy(userId, transactionData, routingPlan, fees) {
    try {
      // Execute routing to get funds to correct chain
      if (routingPlan.needsRouting) {
        const routingOption = {
          fromChain: routingPlan.fromChain,
          toChain: routingPlan.toChain,
          fromAsset: 'USDC',
          toAsset: transactionData.asset,
          fromAmount: parseFloat(transactionData.amount)
        }

        await this.walletManager.executeRouting(userId, routingOption)
      }

      // Execute asset purchase
      const result = await this.integrationManager.execute(
        'trading',
        'buyAsset',
        {
          asset: transactionData.asset,
          amountUSD: transactionData.amount,
          chain: routingPlan.toChain
        }
      )

      return {
        success: result.success,
        transactionHash: result.transactionHash || `tx_buy_${Date.now()}`,
        asset: transactionData.asset,
        amountPurchased: result.assetAmount || 0,
        amountSpent: parseFloat(transactionData.amount)
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Process asset sell transaction
   */
  async processSell(userId, transactionData, routingPlan, fees) {
    try {
      // Execute asset sale
      const result = await this.integrationManager.execute(
        'trading',
        'sellAsset',
        {
          asset: transactionData.asset,
          amount: transactionData.amount,
          chain: routingPlan.fromChain
        }
      )

      // Route proceeds to Solana if needed
      if (routingPlan.needsRouting && result.success) {
        const routingOption = {
          fromChain: routingPlan.fromChain,
          toChain: 'SOL',
          fromAsset: 'USDC',
          toAsset: 'USDC',
          fromAmount: result.usdReceived
        }

        await this.walletManager.executeRouting(userId, routingOption)
      }

      return {
        success: result.success,
        transactionHash: result.transactionHash || `tx_sell_${Date.now()}`,
        asset: transactionData.asset,
        amountSold: parseFloat(transactionData.amount),
        usdReceived: result.usdReceived || 0
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Process investment transaction
   */
  async processInvest(userId, transactionData, routingPlan, fees) {
    try {
      // Execute investment purchase
      const result = await this.integrationManager.execute(
        'investment',
        'purchaseAsset',
        {
          category: transactionData.category,
          asset: transactionData.asset,
          amountUSD: transactionData.amount,
          chain: 'SOL'
        }
      )

      return {
        success: result.success,
        transactionHash: result.transactionHash || `tx_invest_${Date.now()}`,
        category: transactionData.category,
        asset: transactionData.asset,
        amountInvested: parseFloat(transactionData.amount),
        tokensReceived: result.tokensReceived || 0
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Helper methods
   */
  isValidWalletAddress(address) {
    if (!address || typeof address !== 'string') return false
    
    // Bitcoin patterns
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true
    if (/^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true
    if (/^bc1[a-z0-9]{39,59}$/.test(address)) return true
    
    // Ethereum pattern
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) return true
    
    // Solana pattern
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return true
    
    // Sui pattern (64+ hex characters after 0x)
    if (/^0x[a-fA-F0-9]{62,}$/.test(address)) return true
    
    return false
  }

  isValidDiBoaSUsername(username) {
    return /^@[a-zA-Z0-9_]{3,20}$/.test(username)
  }

  isValidAsset(asset, transactionType) {
    const validAssets = {
      buy: ['BTC', 'ETH', 'SOL', 'SUI', 'USDC'],
      sell: ['BTC', 'ETH', 'SOL', 'SUI', 'GOLD', 'STOCKS'],
      invest: ['GOLD', 'STOCKS', 'REALESTATE']
    }

    return validAssets[transactionType]?.includes(asset) || false
  }

  detectChainFromAddress(address) {
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address)) return 'BTC'
    if (/^0x[a-fA-F0-9]{62,}$/.test(address)) return 'SUI' // Sui addresses are longer (62+ hex chars)
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'ETH'
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return 'SOL'
    return 'ETH' // Default fallback
  }

  getAssetNativeChain(asset) {
    const assetChains = {
      BTC: 'BTC',
      ETH: 'ETH',
      SOL: 'SOL',
      SUI: 'SUI',
      USDC: 'SOL', // Default USDC to Solana
      GOLD: 'SOL',
      STOCKS: 'SOL',
      REALESTATE: 'SOL'
    }

    return assetChains[asset] || 'SOL'
  }

  getChainNetworkFee(chain) {
    const networkFees = {
      BTC: 15.0,
      ETH: 25.0,
      SOL: 0.5,
      SUI: 0.8
    }

    return networkFees[chain] || 1.0
  }

  buildRoutingSteps(routingOption) {
    const steps = []

    if (routingOption.fromAsset !== 'USDC') {
      steps.push({
        action: 'swap',
        chain: routingOption.fromChain,
        fromAsset: routingOption.fromAsset,
        toAsset: 'USDC',
        amount: routingOption.fromAmount
      })
    }

    if (routingOption.fromChain !== routingOption.toChain) {
      steps.push({
        action: 'bridge',
        fromChain: routingOption.fromChain,
        toChain: routingOption.toChain,
        asset: 'USDC',
        amount: routingOption.toAmount
      })
    }

    return steps
  }

  async calculateRoutingFees(routingPlan) {
    return this.walletManager.estimateRoutingFees(
      routingPlan.fromChain,
      routingPlan.toChain,
      parseFloat(routingPlan.amount || 0)
    )
  }

  async checkKYCStatus(userId) {
    try {
      const result = await this.integrationManager.execute(
        'kyc',
        'checkStatus',
        { userId }
      )
      return result.success ? result.result : { verified: false }
    } catch {
      return { verified: false }
    }
  }

  async triggerKYC(userId, transactionData) {
    try {
      await this.integrationManager.execute(
        'kyc',
        'startVerification',
        {
          userId,
          trigger: 'withdrawal',
          amount: transactionData.amount
        }
      )
    } catch (error) {
      console.warn('Failed to trigger KYC:', error.message)
    }
  }

  async resolveDiBoaSUsername(username) {
    // Mock resolution - in real implementation, this would query user database
    return `sol_address_for_${username.replace('@', '')}`
  }

  /**
   * Get transaction history for user
   */
  getTransactionHistory(userId, options = {}) {
    const userTransactions = Array.from(this.transactionHistory.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => new Date(b.completedAt || b.initiatedAt) - new Date(a.completedAt || a.initiatedAt))

    if (options.limit) {
      return userTransactions.slice(0, options.limit)
    }

    return userTransactions
  }

  /**
   * Get transaction by ID
   */
  getTransaction(transactionId) {
    return this.activeTransactions.get(transactionId) || this.transactionHistory.get(transactionId)
  }

  /**
   * Execute transaction with retry mechanism
   */
  async executeTransactionWithRetry(userId, transactionData, options = {}) {
    const { maxRetries = 3 } = options
    let lastError
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeTransaction(userId, transactionData)
      } catch (error) {
        lastError = error
        if (attempt < maxRetries && this.isRetryableError(error)) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }
        throw error
      }
    }
    
    throw lastError
  }

  /**
   * Execute transaction (simplified for testing)
   */
  async executeTransaction(userId, transactionData) {
    const transactionId = generateSecureId()
    const transaction = {
      id: transactionId,
      userId,
      status: 'pending',
      amount: parseFloat(transactionData.amount),
      type: transactionData.type,
      ...transactionData
    }
    
    // Mock transaction execution
    return transaction
  }

  /**
   * Complete transaction
   */
  async completeTransaction(transactionId, completionData) {
    // Mock completion logic
    return { success: true, transactionId, ...completionData }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(transactionId, status, metadata) {
    // Mock status update
    return { success: true, transactionId, status, metadata }
  }

  /**
   * Suggest alternative chains when primary chain fails
   */
  async suggestAlternativeChains(transactionData) {
    const alternatives = ['ETH', 'SUI', 'BTC']
    return alternatives.filter(chain => chain !== 'SOL')
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableErrors = [
      'Temporary network error',
      'Rate limit exceeded',
      'Service unavailable'
    ]
    return retryableErrors.some(retryableError => 
      error.message.includes(retryableError)
    )
  }
}

export default TransactionEngine