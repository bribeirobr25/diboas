/**
 * Multi-Chain Wallet Manager
 * Manages 4 non-custodial wallets (BTC, ETH L2, SOL, SUI) as unified diBoaS wallet
 */

export class MultiWalletManager {
  constructor() {
    this.wallets = {
      BTC: { chain: 'bitcoin', balance: 0, address: null, gasReserve: 0.0001 },
      ETH: { chain: 'ethereum', balance: 0, address: null, gasReserve: 0.01 },
      SOL: { chain: 'solana', balance: 0, address: null, gasReserve: 0.01 },
      SUI: { chain: 'sui', balance: 0, address: null, gasReserve: 0.01 }
    }
    
    this.assets = {
      BTC: { symbol: 'BTC', decimals: 8, usdPrice: 43250.00 },
      ETH: { symbol: 'ETH', decimals: 18, usdPrice: 2680.00 },
      SOL: { symbol: 'SOL', decimals: 9, usdPrice: 98.50 },
      SUI: { symbol: 'SUI', decimals: 9, usdPrice: 3.45 },
      USDC: { symbol: 'USDC', decimals: 6, usdPrice: 1.00 },
      GOLD: { symbol: 'GOLD', decimals: 6, usdPrice: 2045.30 }, // Price per oz of tokenized gold
      STOCKS: { symbol: 'STOCKS', decimals: 6, usdPrice: 1.00 } // $1 per $1 of tokenized stocks
    }

    this.balanceCache = new Map()
    this.lastUpdate = 0
    this.CACHE_DURATION = 30000 // 30 seconds
  }

  /**
   * Initialize wallets during signup
   */
  async initializeWallets(userId) {
    const walletAddresses = {}
    
    try {
      // Generate addresses for each chain
      for (const [chain, config] of Object.entries(this.wallets)) {
        const address = await this.generateWalletAddress(chain.toLowerCase(), userId)
        this.wallets[chain].address = address
        walletAddresses[chain] = address
      }

      // Store wallet configuration
      localStorage.setItem(`diboas_wallets_${userId}`, JSON.stringify({
        addresses: walletAddresses,
        created: Date.now(),
        userId
      }))

      return {
        success: true,
        wallets: walletAddresses,
        unifiedAddress: this.generateUnifiedAddress(userId)
      }
    } catch (error) {
      throw new Error(`Failed to initialize wallets: ${error.message}`)
    }
  }

  /**
   * Get unified balance across all chains
   */
  async getUnifiedBalance(userId, forceRefresh = false) {
    const cacheKey = `balance_${userId}`
    const now = Date.now()

    // Return cached balance if still valid
    if (!forceRefresh && this.balanceCache.has(cacheKey)) {
      const cached = this.balanceCache.get(cacheKey)
      if (now - cached.timestamp < this.CACHE_DURATION) {
        return cached.data
      }
    }

    try {
      const balances = await Promise.all([
        this.getChainBalance('BTC', userId),
        this.getChainBalance('ETH', userId),
        this.getChainBalance('SOL', userId),
        this.getChainBalance('SUI', userId)
      ])

      const unifiedBalance = {
        totalUSD: 0,
        breakdown: {},
        assets: {},
        availableForSpending: 0,
        lastUpdated: now
      }

      // Calculate unified balance
      balances.forEach((chainBalance, index) => {
        const chain = Object.keys(this.wallets)[index]
        const chainConfig = this.wallets[chain]
        
        unifiedBalance.breakdown[chain] = {
          native: chainBalance.native,
          usdc: chainBalance.usdc || 0,
          usdValue: chainBalance.usdValue,
          availableNative: Math.max(0, chainBalance.native - chainConfig.gasReserve)
        }

        unifiedBalance.totalUSD += chainBalance.usdValue
        
        // Aggregate assets
        Object.entries(chainBalance.assets || {}).forEach(([asset, amount]) => {
          if (!unifiedBalance.assets[asset]) {
            unifiedBalance.assets[asset] = { amount: 0, usdValue: 0 }
          }
          unifiedBalance.assets[asset].amount += amount
          unifiedBalance.assets[asset].usdValue += amount * (this.assets[asset]?.usdPrice || 0)
        })
      })

      // Calculate available for spending (primarily USDC on Solana)
      unifiedBalance.availableForSpending = unifiedBalance.breakdown.SOL?.usdc || 0

      // Calculate invested amount (GOLD + STOCKS)
      unifiedBalance.investedAmount = (unifiedBalance.assets.GOLD?.usdValue || 0) + (unifiedBalance.assets.STOCKS?.usdValue || 0)

      // Calculate corrected total: Available + Invested (for UI consistency)
      unifiedBalance.totalUSD = unifiedBalance.availableForSpending + unifiedBalance.investedAmount

      // Cache the result
      this.balanceCache.set(cacheKey, {
        data: unifiedBalance,
        timestamp: now
      })

      return unifiedBalance
    } catch (error) {
      throw new Error(`Failed to get unified balance: ${error.message}`)
    }
  }

  /**
   * Get balance for specific chain
   */
  async getChainBalance(chain, userId) {
    const wallet = this.wallets[chain]
    if (!wallet) throw new Error(`Unsupported chain: ${chain}`)

    try {
      // Simulate balance retrieval from blockchain
      const mockBalance = this.generateMockBalance(chain)
      
      return {
        chain,
        address: wallet.address,
        native: mockBalance.native,
        usdc: mockBalance.usdc,
        assets: mockBalance.assets,
        usdValue: this.calculateUSDValue(chain, mockBalance),
        gasReserve: wallet.gasReserve
      }
    } catch (error) {
      throw new Error(`Failed to get ${chain} balance: ${error.message}`)
    }
  }

  /**
   * Check if sufficient balance exists for transaction
   */
  async checkSufficientBalance(userId, amount, transactionType, targetChain = 'SOL') {
    const balance = await this.getUnifiedBalance(userId)
    
    const checks = {
      sufficient: false,
      availableBalance: balance.availableForSpending,
      requiredAmount: amount,
      deficit: 0,
      canAutoRoute: false,
      routingOptions: []
    }

    // For add transactions (on-ramp), no balance check needed - user is bringing external fiat
    if (transactionType === 'add') {
      checks.sufficient = true
      checks.availableBalance = 999999 // External fiat source
      return checks
    }

    // For most transactions, check USDC on Solana
    if (['send', 'withdraw', 'transfer'].includes(transactionType)) {
      const solanaUSDC = balance.breakdown.SOL?.usdc || 0
      checks.sufficient = solanaUSDC >= amount
      checks.availableBalance = solanaUSDC
      
      if (!checks.sufficient) {
        checks.deficit = amount - solanaUSDC
        checks.routingOptions = await this.findRoutingOptions(userId, checks.deficit, 'USDC', 'SOL')
        checks.canAutoRoute = checks.routingOptions.length > 0
      }
    }

    // For asset purchases, check specific chain requirements
    if (transactionType === 'buy') {
      const targetBalance = balance.breakdown[targetChain]
      if (targetBalance) {
        checks.sufficient = targetBalance.usdc >= amount
        checks.availableBalance = targetBalance.usdc
      }
    }

    // For asset sales, check asset availability
    if (transactionType === 'sell') {
      const asset = targetChain // targetChain is asset symbol in this case
      const assetBalance = balance.assets[asset]
      if (assetBalance) {
        checks.sufficient = assetBalance.amount >= amount
        checks.availableBalance = assetBalance.amount
      }
    }

    return checks
  }

  /**
   * Find routing options for cross-chain transfers
   */
  async findRoutingOptions(userId, amount, targetAsset, targetChain) {
    const balance = await this.getUnifiedBalance(userId)
    const options = []

    // Check each chain for available assets that can be routed
    Object.entries(balance.breakdown).forEach(([chain, chainBalance]) => {
      if (chain === targetChain) return // Skip target chain

      // Native asset conversion
      if (chainBalance.availableNative > 0) {
        const nativeAsset = chain === 'BTC' ? 'BTC' : chain === 'ETH' ? 'ETH' : chain === 'SOL' ? 'SOL' : 'SUI'
        const usdValue = chainBalance.availableNative * this.assets[nativeAsset].usdPrice
        
        if (usdValue >= amount) {
          options.push({
            fromChain: chain,
            fromAsset: nativeAsset,
            fromAmount: amount / this.assets[nativeAsset].usdPrice,
            toChain: targetChain,
            toAsset: targetAsset,
            toAmount: amount,
            estimatedFees: this.estimateRoutingFees(chain, targetChain, amount),
            estimatedTime: this.estimateRoutingTime(chain, targetChain)
          })
        }
      }

      // USDC conversion if available
      if (chainBalance.usdc > 0 && chainBalance.usdc >= amount) {
        options.push({
          fromChain: chain,
          fromAsset: 'USDC',
          fromAmount: amount,
          toChain: targetChain,
          toAsset: targetAsset,
          toAmount: amount,
          estimatedFees: this.estimateRoutingFees(chain, targetChain, amount),
          estimatedTime: this.estimateRoutingTime(chain, targetChain)
        })
      }
    })

    // Sort by lowest fees
    return options.sort((a, b) => a.estimatedFees.total - b.estimatedFees.total)
  }

  /**
   * Execute cross-chain routing
   */
  async executeRouting(userId, routingOption) {
    try {
      const { fromChain, fromAsset, fromAmount, toChain, toAsset, toAmount } = routingOption

      // Step 1: Sell/swap source asset if needed
      if (fromAsset !== 'USDC') {
        await this.executeAssetSwap(userId, fromChain, fromAsset, fromAmount, 'USDC')
      }

      // Step 2: Bridge to target chain if different
      if (fromChain !== toChain) {
        await this.executeBridge(userId, fromChain, toChain, 'USDC', toAmount)
      }

      // Step 3: Swap to target asset if needed
      if (toAsset !== 'USDC') {
        await this.executeAssetSwap(userId, toChain, 'USDC', toAmount, toAsset)
      }

      return {
        success: true,
        transactionId: `routing_${Date.now()}`,
        route: routingOption,
        executedAt: new Date().toISOString()
      }
    } catch (error) {
      throw new Error(`Routing execution failed: ${error.message}`)
    }
  }

  /**
   * Update balances after transaction
   */
  async updateBalances(userId, transactionData) {
    const { type, amount, netAmount, fees, fromChain, toChain, asset } = transactionData

    try {
      // Clear balance cache to force refresh
      this.balanceCache.delete(`balance_${userId}`)

      // Simulate balance updates based on transaction type
      switch (type) {
        case 'add':
          // For add transactions, use the net amount (amount - fees)
          const finalAmount = netAmount || parseFloat(amount)
          await this.addBalance(userId, 'SOL', 'USDC', finalAmount)
          break
        case 'send':
          // For outgoing transactions, subtract amount + fees from balance
          const sendTotal = parseFloat(amount) + parseFloat(fees?.total || 0)
          await this.subtractBalance(userId, 'SOL', 'USDC', sendTotal)
          break
        case 'receive':
          await this.addBalance(userId, 'SOL', 'USDC', amount)
          break
        case 'withdraw':
          // For outgoing transactions, subtract amount + fees from balance
          const withdrawTotal = parseFloat(amount) + parseFloat(fees?.total || 0)
          await this.subtractBalance(userId, 'SOL', 'USDC', withdrawTotal)
          break
        case 'buy':
          await this.executeAssetPurchase(userId, asset, amount, fees)
          break
        case 'sell':
          await this.executeAssetSale(userId, asset, amount, fees)
          break
        case 'transfer':
          // For transfer, pass fees info to subtract total amount
          await this.executeExternalTransfer(userId, toChain, amount, fees)
          break
      }

      // Add transaction to history
      this.addTransactionToHistory(userId, transactionData)

      // Return updated balance
      return await this.getUnifiedBalance(userId, true)
    } catch (error) {
      throw new Error(`Failed to update balances: ${error.message}`)
    }
  }

  /**
   * Generate mock wallet address for demo
   */
  async generateWalletAddress(chain, userId) {
    const prefixes = {
      bitcoin: ['1', '3', 'bc1'],
      ethereum: ['0x'],
      solana: [''],
      sui: ['0x']
    }

    const prefix = prefixes[chain][0]
    const random = Math.random().toString(36).substring(2, 15)
    const userSuffix = userId.toString().slice(-4)
    
    switch (chain) {
      case 'bitcoin':
        return `${prefix}${random}${userSuffix}`.substring(0, 34)
      case 'ethereum':
      case 'sui':
        return `${prefix}${random}${userSuffix}`.padEnd(42, '0')
      case 'solana':
        return `${random}${userSuffix}`.padEnd(44, 'A')
      default:
        return `${prefix}${random}${userSuffix}`
    }
  }

  /**
   * Generate unified diBoaS address for user recognition
   */
  generateUnifiedAddress(userId) {
    return `diboas_${userId}_${Math.random().toString(36).substring(2, 8)}`
  }

  /**
   * Helper methods for balance operations
   */
  async addBalance(userId, chain, asset, amount) {
    console.log(`Adding ${amount} ${asset} to ${chain} wallet for user ${userId}`)
    
    // Get current balances
    const currentBalances = this.getStoredBalances(userId)
    
    // Update the specific balance
    if (!currentBalances[chain]) {
      currentBalances[chain] = { native: 0, usdc: 0 }
    }
    
    if (asset === 'USDC') {
      // For 'add' transactions, we add the net amount (amount - fees)
      const netAmount = parseFloat(amount)
      currentBalances[chain].usdc = (currentBalances[chain].usdc || 0) + netAmount
    } else if (asset === chain) {
      currentBalances[chain].native = (currentBalances[chain].native || 0) + parseFloat(amount)
    }
    
    // Store updated balances
    this.storeBalances(userId, currentBalances)
  }

  async subtractBalance(userId, chain, asset, amount) {
    console.log(`Subtracting ${amount} ${asset} from ${chain} wallet for user ${userId}`)
    
    // Get current balances
    const currentBalances = this.getStoredBalances(userId)
    
    // Update the specific balance
    if (!currentBalances[chain]) {
      currentBalances[chain] = { native: 0, usdc: 0 }
    }
    
    if (asset === 'USDC') {
      currentBalances[chain].usdc = Math.max(0, (currentBalances[chain].usdc || 0) - parseFloat(amount))
    } else if (asset === chain) {
      currentBalances[chain].native = Math.max(0, (currentBalances[chain].native || 0) - parseFloat(amount))
    }
    
    // Store updated balances
    this.storeBalances(userId, currentBalances)
  }

  async executeAssetSwap(userId, chain, fromAsset, fromAmount, toAsset) {
    // Simulate asset swap
    console.log(`Swapped ${fromAmount} ${fromAsset} to ${toAsset} on ${chain}`)
  }

  async executeBridge(userId, fromChain, toChain, asset, amount) {
    // Simulate cross-chain bridge
    console.log(`Bridged ${amount} ${asset} from ${fromChain} to ${toChain}`)
  }

  async executeAssetPurchase(userId, asset, amount, fees = null) {
    // For asset purchases: subtract USDC from available, add asset to invested
    const purchaseTotal = parseFloat(amount) + parseFloat(fees?.total || 0)
    
    console.log(`Purchasing ${amount} USD worth of ${asset} (total cost: ${purchaseTotal})`)
    
    // Subtract USDC from available balance (including fees)
    await this.subtractBalance(userId, 'SOL', 'USDC', purchaseTotal)
    
    // Add asset to invested portfolio
    await this.addAssetToPortfolio(userId, asset, amount)
  }

  async executeAssetSale(userId, asset, amount, fees = null) {
    // For asset sales: subtract asset from invested, add USDC to available
    const netAmount = parseFloat(amount) - parseFloat(fees?.total || 0)
    
    console.log(`Selling ${amount} USD worth of ${asset} (net proceeds: ${netAmount})`)
    
    // Remove asset from invested portfolio
    await this.removeAssetFromPortfolio(userId, asset, amount)
    
    // Add net proceeds to available balance (after fees)
    await this.addBalance(userId, 'SOL', 'USDC', netAmount)
  }

  async executeExternalTransfer(userId, chain, amount, fees = null) {
    // Simulate external transfer by subtracting amount + fees from USDC balance
    const transferTotal = parseFloat(amount) + parseFloat(fees?.total || 0)
    console.log(`Transferred ${amount} USDC to external ${chain} wallet (total cost: ${transferTotal})`)
    await this.subtractBalance(userId, 'SOL', 'USDC', transferTotal)
  }

  /**
   * Add asset to user's invested portfolio
   */
  async addAssetToPortfolio(userId, asset, usdAmount) {
    const storedBalances = this.getStoredBalances(userId)
    
    // Ensure SOL chain exists (where we store investment assets)
    if (!storedBalances.SOL) {
      storedBalances.SOL = { native: 125.5, usdc: 15000 }
    }
    if (!storedBalances.SOL.assets) {
      storedBalances.SOL.assets = {}
    }
    
    // Calculate asset amount based on USD value and asset price
    const assetPrice = this.assets[asset]?.usdPrice || 1
    const assetAmount = parseFloat(usdAmount) / assetPrice
    
    // Add to existing amount or create new
    storedBalances.SOL.assets[asset] = (storedBalances.SOL.assets[asset] || 0) + assetAmount
    
    console.log(`Added ${assetAmount} ${asset} to portfolio (USD value: $${usdAmount})`)
    this.storeBalances(userId, storedBalances)
  }

  /**
   * Remove asset from user's invested portfolio
   */
  async removeAssetFromPortfolio(userId, asset, usdAmount) {
    const storedBalances = this.getStoredBalances(userId)
    
    if (!storedBalances.SOL?.assets?.[asset]) {
      console.warn(`Asset ${asset} not found in portfolio`)
      return
    }
    
    // Calculate asset amount based on USD value and asset price
    const assetPrice = this.assets[asset]?.usdPrice || 1
    const assetAmount = parseFloat(usdAmount) / assetPrice
    
    // Subtract from existing amount (don't go below 0)
    storedBalances.SOL.assets[asset] = Math.max(0, (storedBalances.SOL.assets[asset] || 0) - assetAmount)
    
    // Remove asset if amount is 0
    if (storedBalances.SOL.assets[asset] === 0) {
      delete storedBalances.SOL.assets[asset]
    }
    
    console.log(`Removed ${assetAmount} ${asset} from portfolio (USD value: $${usdAmount})`)
    this.storeBalances(userId, storedBalances)
  }

  /**
   * Get stored balances for user (persistent demo storage)
   */
  getStoredBalances(userId) {
    const stored = localStorage.getItem(`diboas_balances_${userId}`)
    if (stored) {
      return JSON.parse(stored)
    }
    
    // Return default balances if none stored
    return {
      BTC: { native: 0.5, usdc: 2500 },
      ETH: { native: 2.3, usdc: 5000 },
      SOL: { 
        native: 125.5, 
        usdc: 15000,
        assets: {
          GOLD: 0.5, // 0.5 oz tokenized gold
          STOCKS: 1250 // $1250 in tokenized stocks
        }
      },
      SUI: { native: 2890.7, usdc: 8000 }
    }
  }

  /**
   * Store balances for user (persistent demo storage)
   */
  storeBalances(userId, balances) {
    localStorage.setItem(`diboas_balances_${userId}`, JSON.stringify(balances))
    
    // Clear cache to force refresh
    this.balanceCache.delete(`balance_${userId}`)
  }

  /**
   * Add transaction to history
   */
  addTransactionToHistory(userId, transactionData) {
    const historyKey = `diboas_transaction_history_${userId}`
    const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]')
    
    const transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: transactionData.type,
      amount: transactionData.amount,
      netAmount: transactionData.netAmount,
      fees: transactionData.fees,
      asset: transactionData.asset || 'USDC',
      paymentMethod: transactionData.paymentMethod,
      status: 'completed',
      timestamp: new Date().toISOString(),
      description: this.generateTransactionDescription(transactionData)
    }
    
    // Add to beginning of array (most recent first)
    existingHistory.unshift(transaction)
    
    // Keep only last 100 transactions
    if (existingHistory.length > 100) {
      existingHistory.splice(100)
    }
    
    localStorage.setItem(historyKey, JSON.stringify(existingHistory))
    console.log('💾 Transaction added to history:', transaction)
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('diboas-transaction-completed', {
      detail: { transaction, userId }
    }))
    
    return transaction
  }

  /**
   * Generate transaction description
   */
  generateTransactionDescription(transactionData) {
    const { type, amount, asset, paymentMethod } = transactionData
    
    switch (type) {
      case 'add':
        return `Added $${amount} using ${paymentMethod || 'payment method'}`
      case 'send':
        return `Sent $${amount} to user`
      case 'receive':
        return `Received $${amount} from user`
      case 'withdraw':
        return `Withdrew $${amount} to ${paymentMethod || 'bank account'}`
      case 'buy':
        return `Bought $${amount} worth of ${asset}`
      case 'sell':
        return `Sold $${amount} worth of ${asset}`
      case 'transfer':
        return `Transferred $${amount} to external wallet`
      default:
        return `${type} transaction of $${amount}`
    }
  }

  /**
   * Generate mock balance for demo (now uses stored balances)
   */
  generateMockBalance(chain) {
    // For demo user, use stored balances
    const userId = 'demo_user_12345'
    const storedBalances = this.getStoredBalances(userId)
    
    const base = storedBalances[chain] || { native: 0, usdc: 0 }
    
    return {
      native: base.native,
      usdc: base.usdc,
      assets: base.assets || {}
    }
  }

  /**
   * Calculate USD value for chain balance
   */
  calculateUSDValue(chain, balance) {
    const nativeAsset = chain === 'BTC' ? 'BTC' : chain === 'ETH' ? 'ETH' : chain === 'SOL' ? 'SOL' : 'SUI'
    const nativePrice = this.assets[nativeAsset]?.usdPrice || 0
    
    let totalValue = balance.native * nativePrice
    totalValue += balance.usdc || 0
    
    // Add asset values
    Object.entries(balance.assets || {}).forEach(([asset, amount]) => {
      totalValue += amount * (this.assets[asset]?.usdPrice || 0)
    })

    return totalValue
  }

  /**
   * Estimate routing fees
   */
  estimateRoutingFees(fromChain, toChain, amount) {
    const gasFeesUSD = {
      BTC: 15.0,
      ETH: 25.0,
      SOL: 0.5,
      SUI: 0.8
    }

    const bridgeFeePercentage = fromChain !== toChain ? 0.001 : 0 // 0.1% bridge fee
    const swapFeePercentage = 0.003 // 0.3% swap fee

    return {
      gas: gasFeesUSD[fromChain] + (fromChain !== toChain ? gasFeesUSD[toChain] : 0),
      bridge: amount * bridgeFeePercentage,
      swap: amount * swapFeePercentage,
      total: gasFeesUSD[fromChain] + (fromChain !== toChain ? gasFeesUSD[toChain] : 0) + 
             (amount * bridgeFeePercentage) + (amount * swapFeePercentage)
    }
  }

  /**
   * Estimate routing time
   */
  estimateRoutingTime(fromChain, toChain) {
    const baseTimes = {
      BTC: 600, // 10 minutes
      ETH: 900, // 15 minutes
      SOL: 30,  // 30 seconds
      SUI: 45   // 45 seconds
    }

    if (fromChain === toChain) {
      return baseTimes[fromChain]
    }

    // Cross-chain operations take longer
    return baseTimes[fromChain] + baseTimes[toChain] + 300 // Additional bridge time
  }
}

export default MultiWalletManager