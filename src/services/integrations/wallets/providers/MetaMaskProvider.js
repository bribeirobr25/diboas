/**
 * MetaMask Provider
 * Ethereum wallet integration via MetaMask
 */

export class MetaMaskProvider {
  constructor(config) {
    this.config = config
    this.ethereum = typeof window !== 'undefined' ? window.ethereum : null
  }

  /**
   * Check if MetaMask is installed
   */
  isInstalled() {
    return !!(this.ethereum && this.ethereum.isMetaMask)
  }

  /**
   * Connect to MetaMask
   */
  async connect() {
    try {
      if (!this.isInstalled()) {
        throw new Error('MetaMask not installed')
      }

      // Request account access
      const accounts = await this.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // Get chain ID
      const chainId = await this.ethereum.request({
        method: 'eth_chainId'
      })

      return {
        success: true,
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        provider: 'metamask'
      }
    } catch (error) {
      throw new Error(`MetaMask connection failed: ${error.message}`)
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address) {
    try {
      if (!this.isInstalled()) {
        throw new Error('MetaMask not installed')
      }

      const balance = await this.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      })

      // Convert from wei to ETH
      const ethBalance = parseInt(balance, 16) / Math.pow(10, 18)

      return {
        success: true,
        balance: ethBalance,
        currency: 'ETH',
        address
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
        throw new Error('MetaMask not installed')
      }

      const txHash = await this.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParams]
      })

      return {
        success: true,
        transactionHash: txHash,
        provider: 'metamask'
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
        throw new Error('MetaMask not installed')
      }

      const signature = await this.ethereum.request({
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
        throw new Error('MetaMask not installed')
      }

      await this.ethereum.request({
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
        },
        56: { // BSC
          chainId: '0x38',
          chainName: 'Binance Smart Chain',
          nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
          },
          rpcUrls: ['https://bsc-dataseed.binance.org/'],
          blockExplorerUrls: ['https://bscscan.com/']
        }
      }

      const config = networkConfigs[chainId]
      if (!config) {
        throw new Error('Unsupported network')
      }

      await this.ethereum.request({
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
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash) {
    try {
      if (!this.isInstalled()) {
        throw new Error('MetaMask not installed')
      }

      const receipt = await this.ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      })

      return {
        success: true,
        receipt
      }
    } catch (error) {
      throw new Error(`Failed to get transaction receipt: ${error.message}`)
    }
  }

  /**
   * Listen for account changes
   */
  onAccountChange(callback) {
    if (this.isInstalled()) {
      this.ethereum.on('accountsChanged', callback)
    }
  }

  /**
   * Listen for network changes
   */
  onNetworkChange(callback) {
    if (this.isInstalled()) {
      this.ethereum.on('chainChanged', (chainId) => {
        callback(parseInt(chainId, 16))
      })
    }
  }

  /**
   * Disconnect
   */
  async disconnect() {
    try {
      // MetaMask doesn't have a disconnect method
      // This is handled by the user in the MetaMask interface
      return {
        success: true,
        message: 'Disconnect from MetaMask interface'
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

export default MetaMaskProvider