/**
 * Coinbase Wallet Provider
 * Multi-chain wallet integration via Coinbase Wallet
 */

export class CoinbaseWalletProvider {
  constructor(config) {
    this.config = config
    this.coinbaseWallet = typeof window !== 'undefined' ? window.ethereum : null
  }

  /**
   * Check if Coinbase Wallet is installed
   */
  isInstalled() {
    return !!(this.coinbaseWallet && this.coinbaseWallet.isCoinbaseWallet)
  }

  /**
   * Connect to Coinbase Wallet
   */
  async connect() {
    try {
      if (!this.isInstalled()) {
        throw new Error('Coinbase Wallet not installed')
      }

      // Request account access
      const accounts = await this.coinbaseWallet.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // Get chain ID
      const chainId = await this.coinbaseWallet.request({
        method: 'eth_chainId'
      })

      return {
        success: true,
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        provider: 'coinbase'
      }
    } catch (error) {
      throw new Error(`Coinbase Wallet connection failed: ${error.message}`)
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address, chainId = 1) {
    try {
      if (!this.isInstalled()) {
        throw new Error('Coinbase Wallet not installed')
      }

      const balance = await this.coinbaseWallet.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      })

      // Convert from wei to ETH
      const ethBalance = parseInt(balance, 16) / Math.pow(10, 18)

      return {
        success: true,
        balance: ethBalance,
        currency: 'ETH',
        address,
        chainId
      }
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`)
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(transactionParams) {
    try {
      if (!this.isInstalled()) {
        throw new Error('Coinbase Wallet not installed')
      }

      const txHash = await this.coinbaseWallet.request({
        method: 'eth_sendTransaction',
        params: [transactionParams]
      })

      return {
        success: true,
        transactionHash: txHash,
        provider: 'coinbase'
      }
    } catch (error) {
      throw new Error(`Transaction failed: ${error.message}`)
    }
  }

  /**
   * Sign message
   */
  async signMessage(address, message) {
    try {
      if (!this.isInstalled()) {
        throw new Error('Coinbase Wallet not installed')
      }

      const signature = await this.coinbaseWallet.request({
        method: 'personal_sign',
        params: [message, address]
      })

      return {
        success: true,
        signature,
        message,
        address
      }
    } catch (error) {
      throw new Error(`Message signing failed: ${error.message}`)
    }
  }

  /**
   * Switch network
   */
  async switchNetwork(chainId) {
    try {
      if (!this.isInstalled()) {
        throw new Error('Coinbase Wallet not installed')
      }

      await this.coinbaseWallet.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      })

      return {
        success: true,
        chainId
      }
    } catch (error) {
      // If the chain doesn't exist, add it
      if (error.code === 4902) {
        return await this.addNetwork(chainId)
      }
      throw new Error(`Network switch failed: ${error.message}`)
    }
  }

  /**
   * Add network
   */
  async addNetwork(chainId) {
    try {
      const networkConfigs = {
        8453: { // Base
          chainId: '0x2105',
          chainName: 'Base',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://mainnet.base.org/'],
          blockExplorerUrls: ['https://basescan.org/']
        },
        137: { // Polygon
          chainId: '0x89',
          chainName: 'Polygon Mainnet',
          nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
          },
          rpcUrls: ['https://polygon-rpc.com/'],
          blockExplorerUrls: ['https://polygonscan.com/']
        }
      }

      const config = networkConfigs[chainId]
      if (!config) {
        throw new Error('Unsupported network')
      }

      await this.coinbaseWallet.request({
        method: 'wallet_addEthereumChain',
        params: [config]
      })

      return {
        success: true,
        chainId,
        added: true
      }
    } catch (error) {
      throw new Error(`Network addition failed: ${error.message}`)
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(tokenAddress, address) {
    try {
      if (!this.isInstalled()) {
        throw new Error('Coinbase Wallet not installed')
      }

      // ERC-20 balanceOf function call
      const data = '0x70a08231000000000000000000000000' + address.slice(2)
      
      const balance = await this.coinbaseWallet.request({
        method: 'eth_call',
        params: [{
          to: tokenAddress,
          data: data
        }, 'latest']
      })

      return {
        success: true,
        balance: parseInt(balance, 16),
        tokenAddress,
        address
      }
    } catch (error) {
      throw new Error(`Failed to get token balance: ${error.message}`)
    }
  }

  /**
   * Listen for account changes
   */
  onAccountChange(callback) {
    if (this.isInstalled()) {
      this.coinbaseWallet.on('accountsChanged', callback)
    }
  }

  /**
   * Listen for network changes
   */
  onNetworkChange(callback) {
    if (this.isInstalled()) {
      this.coinbaseWallet.on('chainChanged', (chainId) => {
        callback(parseInt(chainId, 16))
      })
    }
  }

  /**
   * Listen for connection
   */
  onConnect(callback) {
    if (this.isInstalled()) {
      this.coinbaseWallet.on('connect', callback)
    }
  }

  /**
   * Listen for disconnection
   */
  onDisconnect(callback) {
    if (this.isInstalled()) {
      this.coinbaseWallet.on('disconnect', callback)
    }
  }

  /**
   * Disconnect
   */
  async disconnect() {
    try {
      // Coinbase Wallet doesn't have a direct disconnect method
      // This is typically handled through the wallet interface
      return {
        success: true,
        message: 'Disconnect from Coinbase Wallet interface'
      }
    } catch (error) {
      throw new Error(`Disconnect failed: ${error.message}`)
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      return {
        success: true,
        status: 'healthy',
        installed: this.isInstalled(),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }
}

export default CoinbaseWalletProvider