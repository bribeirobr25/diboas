/**
 * Phantom Provider
 * Solana wallet integration via Phantom
 */

export class PhantomProvider {
  constructor(config) {
    this.config = config
    this.phantom = typeof window !== 'undefined' ? window.phantom?.solana : null
  }

  /**
   * Check if Phantom is installed
   */
  isInstalled() {
    return !!(this.phantom && this.phantom.isPhantom)
  }

  /**
   * Connect to Phantom
   */
  async connect() {
    try {
      if (!this.isInstalled()) {
        throw new Error('Phantom wallet not installed')
      }

      const response = await this.phantom.connect()
      
      return {
        success: true,
        address: response.publicKey.toString(),
        provider: 'phantom'
      }
    } catch (error) {
      throw new Error(`Phantom connection failed: ${error.message}`)
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address) {
    try {
      if (!this.isInstalled()) {
        throw new Error('Phantom wallet not installed')
      }

      // Simulate Solana balance check
      // In production, this would use @solana/web3.js
      const mockBalance = 1.5 + Math.random() * 10 // Random SOL balance

      return {
        success: true,
        balance: mockBalance,
        currency: 'SOL',
        address
      }
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`)
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(transaction) {
    try {
      if (!this.isInstalled()) {
        throw new Error('Phantom wallet not installed')
      }

      // In production, this would use actual Solana transaction
      const signature = await this.phantom.signAndSendTransaction(transaction)

      return {
        success: true,
        signature: signature.signature || `phantom_tx_${Date.now()}`,
        provider: 'phantom'
      }
    } catch (error) {
      throw new Error(`Transaction failed: ${error.message}`)
    }
  }

  /**
   * Sign message
   */
  async signMessage(message) {
    try {
      if (!this.isInstalled()) {
        throw new Error('Phantom wallet not installed')
      }

      const encodedMessage = new TextEncoder().encode(message)
      const signedMessage = await this.phantom.signMessage(encodedMessage, 'utf8')

      return {
        success: true,
        signature: Array.from(signedMessage.signature),
        publicKey: signedMessage.publicKey.toString(),
        message
      }
    } catch (error) {
      throw new Error(`Message signing failed: ${error.message}`)
    }
  }

  /**
   * Sign transaction (without sending)
   */
  async signTransaction(transaction) {
    try {
      if (!this.isInstalled()) {
        throw new Error('Phantom wallet not installed')
      }

      const signedTransaction = await this.phantom.signTransaction(transaction)

      return {
        success: true,
        signedTransaction,
        provider: 'phantom'
      }
    } catch (error) {
      throw new Error(`Transaction signing failed: ${error.message}`)
    }
  }

  /**
   * Get token accounts
   */
  async getTokenAccounts(address) {
    try {
      // Simulate token account data
      return {
        success: true,
        tokenAccounts: [
          {
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
            amount: 1000.5,
            decimals: 6,
            symbol: 'USDC'
          },
          {
            mint: 'So11111111111111111111111111111111111111112', // Wrapped SOL
            amount: 2.5,
            decimals: 9,
            symbol: 'SOL'
          }
        ]
      }
    } catch (error) {
      throw new Error(`Failed to get token accounts: ${error.message}`)
    }
  }

  /**
   * Switch network (Solana networks)
   */
  async switchNetwork(network) {
    try {
      if (!this.isInstalled()) {
        throw new Error('Phantom wallet not installed')
      }

      // Phantom handles network switching internally
      // This is mainly for mainnet/devnet/testnet
      return {
        success: true,
        network,
        message: 'Network switch handled by Phantom'
      }
    } catch (error) {
      throw new Error(`Network switch failed: ${error.message}`)
    }
  }

  /**
   * Listen for account changes
   */
  onAccountChange(callback) {
    if (this.isInstalled()) {
      this.phantom.on('accountChanged', callback)
    }
  }

  /**
   * Listen for connection changes
   */
  onConnect(callback) {
    if (this.isInstalled()) {
      this.phantom.on('connect', callback)
    }
  }

  /**
   * Listen for disconnection
   */
  onDisconnect(callback) {
    if (this.isInstalled()) {
      this.phantom.on('disconnect', callback)
    }
  }

  /**
   * Disconnect
   */
  async disconnect() {
    try {
      if (!this.isInstalled()) {
        throw new Error('Phantom wallet not installed')
      }

      await this.phantom.disconnect()

      return {
        success: true,
        message: 'Disconnected from Phantom'
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
        connected: this.phantom?.isConnected || false,
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

export default PhantomProvider