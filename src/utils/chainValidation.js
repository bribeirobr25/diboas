/**
 * Chain-specific address validation utilities
 * Supports Bitcoin, Ethereum, Solana, and Sui address validation
 */

/**
 * ChainValidator class for validating cryptocurrency addresses
 */
export class ChainValidator {
  constructor() {
    this.supportedChains = ['BTC', 'ETH', 'SOL', 'SUI']
    this.addressPatterns = {
      BTC: {
        legacy: /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/i,
        segwit: /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/i,
        bech32: /^bc1[a-z0-9]{39,59}$/i
      },
      ETH: {
        standard: /^0x[a-fA-F0-9]{40}$/i
      },
      SOL: {
        base58: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
      },
      SUI: {
        hex: /^0x[a-fA-F0-9]{64}$/i
      }
    }
  }

  validateAddress(address, chain = null) {
    if (!address || typeof address !== 'string') {
      return {
        isValid: false,
        error: 'INVALID_INPUT',
        message: 'Address must be a non-empty string'
      }
    }

    const trimmedAddress = address.trim()

    if (chain) {
      return this.validateChainSpecificAddress(trimmedAddress, chain)
    }

    // Auto-detect chain if not specified
    const detectedChain = this.detectChain(trimmedAddress)
    if (detectedChain) {
      return {
        ...this.validateChainSpecificAddress(trimmedAddress, detectedChain),
        detectedChain
      }
    }

    return {
      isValid: false,
      error: 'UNSUPPORTED_FORMAT',
      message: 'Address format not recognized'
    }
  }

  validateChainSpecificAddress(address, chain) {
    switch (chain.toUpperCase()) {
      case 'BTC':
        return this.validateBitcoinAddress(address)
      case 'ETH':
        return this.validateEthereumAddress(address)
      case 'SOL':
        return this.validateSolanaAddress(address)
      case 'SUI':
        return this.validateSuiAddress(address)
      default:
        return {
          isValid: false,
          error: 'UNSUPPORTED_CHAIN',
          message: `Chain ${chain} is not supported`
        }
    }
  }

  validateBitcoinAddress(address) {
    const patterns = this.addressPatterns.BTC
    
    // Check SegWit first (starts with '3')
    if (address.toLowerCase().startsWith('3') && patterns.segwit.test(address)) {
      // Additional length validation for SegWit
      if (address.length < 26 || address.length > 35) {
        return {
          isValid: false,
          error: 'INVALID_BITCOIN_FORMAT',
          message: 'Invalid Bitcoin SegWit address length'
        }
      }
      return {
        isValid: true,
        chain: 'BTC',
        type: 'segwit',
        format: 'P2SH'
      }
    }
    
    // Check legacy (starts with '1')
    if (address.toLowerCase().startsWith('1') && patterns.legacy.test(address)) {
      // Additional length validation for legacy
      if (address.length < 26 || address.length > 35) {
        return {
          isValid: false,
          error: 'INVALID_BITCOIN_FORMAT',
          message: 'Invalid Bitcoin legacy address length'
        }
      }
      return {
        isValid: true,
        chain: 'BTC',
        type: 'legacy',
        format: 'P2PKH'
      }
    }
    
    // Check Bech32 (starts with 'bc1')
    if (address.toLowerCase().startsWith('bc1') && patterns.bech32.test(address)) {
      return {
        isValid: true,
        chain: 'BTC',
        type: 'bech32',
        format: 'P2WPKH'
      }
    }

    return {
      isValid: false,
      error: 'INVALID_BITCOIN_FORMAT',
      message: 'Invalid Bitcoin address format'
    }
  }

  validateEthereumAddress(address) {
    const pattern = this.addressPatterns.ETH.standard
    
    if (!pattern.test(address)) {
      return {
        isValid: false,
        error: 'INVALID_ETHEREUM_FORMAT',
        message: 'Invalid Ethereum address format'
      }
    }

    // Check for all zeros (burn address)
    if (address.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return {
        isValid: false,
        error: 'BURN_ADDRESS',
        message: 'Cannot send to burn address'
      }
    }

    return {
      isValid: true,
      chain: 'ETH',
      type: 'standard',
      format: 'EIP-55'
    }
  }

  validateSolanaAddress(address) {
    const pattern = this.addressPatterns.SOL.base58
    
    if (!pattern.test(address)) {
      return {
        isValid: false,
        error: 'INVALID_SOLANA_FORMAT',
        message: 'Invalid Solana address format'
      }
    }

    return {
      isValid: true,
      chain: 'SOL',
      type: 'base58',
      format: 'Ed25519'
    }
  }

  validateSuiAddress(address) {
    const pattern = this.addressPatterns.SUI.hex
    
    if (!pattern.test(address)) {
      return {
        isValid: false,
        error: 'INVALID_SUI_FORMAT',
        message: 'Invalid Sui address format'
      }
    }

    return {
      isValid: true,
      chain: 'SUI',
      type: 'hex',
      format: 'Object ID'
    }
  }

  detectChain(address) {
    // Bitcoin detection (order matters for disambiguation)
    if (address.toLowerCase().startsWith('bc1') && this.addressPatterns.BTC.bech32.test(address)) {
      return 'BTC'
    }
    
    // Bitcoin SegWit (starts with '3') - check length to avoid false positives
    if (address.toLowerCase().startsWith('3') && address.length >= 26 && address.length <= 35 && 
        this.addressPatterns.BTC.segwit.test(address)) {
      return 'BTC'
    }
    
    // Bitcoin legacy (starts with '1') - check length to avoid Solana false positives
    if (address.toLowerCase().startsWith('1') && address.length >= 26 && address.length <= 35 && 
        this.addressPatterns.BTC.legacy.test(address)) {
      return 'BTC'
    }
    
    // Ethereum vs Sui disambiguation (both start with 0x)
    if (address.toLowerCase().startsWith('0x')) {
      if (address.length === 42 && this.addressPatterns.ETH.standard.test(address)) {
        return 'ETH'
      }
      if (address.length === 66 && this.addressPatterns.SUI.hex.test(address)) {
        return 'SUI'
      }
    }
    
    // Solana detection (Base58 but not Bitcoin format)
    if (!address.toLowerCase().startsWith('0x') && this.addressPatterns.SOL.base58.test(address)) {
      return 'SOL'
    }
    
    return null
  }

  getSupportedFormats(chain) {
    const chainUpper = chain?.toUpperCase()
    if (!this.supportedChains.includes(chainUpper)) {
      return []
    }
    return Object.keys(this.addressPatterns[chainUpper] || {})
  }

  getSupportedChains() {
    return [...this.supportedChains]
  }
}

// Create singleton instance
export const chainValidator = new ChainValidator()

// Export convenience functions
export const validateBitcoinAddress = (address) => chainValidator.validateBitcoinAddress(address)
export const validateEthereumAddress = (address) => chainValidator.validateEthereumAddress(address)
export const validateSolanaAddress = (address) => chainValidator.validateSolanaAddress(address)
export const validateSuiAddress = (address) => chainValidator.validateSuiAddress(address)
export const detectChainFromAddress = (address) => chainValidator.detectChain(address)
export const getChainSpecificValidation = (address, chain) => chainValidator.validateChainSpecificAddress(address, chain)