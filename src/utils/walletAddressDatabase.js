import logger from './logger'
import { storage } from './modernStorage.js'

/**
 * Mock wallet address database for Transfer transaction autocomplete
 * This simulates real wallet addresses across different networks
 */

// Mock wallet addresses for different networks
export const mockWalletAddresses = {
  BTC: [
    '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Legacy Bitcoin address
    '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // SegWit Bitcoin address
    'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', // Bech32 Bitcoin address
    '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
    'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
  ],
  ETH: [
    '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', // Ethereum address
    '0x6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c', // Ethereum address
    '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b', // Ethereum address
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
    '0x8ba1f109551bD432803012645Hac136c074727c5' // Popular DeFi address
  ],
  SOL: [
    '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD', // Solana address
    'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1', // Solana address
    '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Solana address
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
    'So11111111111111111111111111111111111111112' // Wrapped SOL
  ],
  SUI: [
    '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', // Sui address
    '0x2f1e6a8c5d9b7e4f3a8c6b9d2e5f8a1c4b7e0d3f6a9c2e5b8d1f4a7c0e3b6f9', // Sui address
    '0x0000000000000000000000000000000000000000000000000000000000000002', // Sui system address
    '0x5a4b2c8e7d1f6a9c3e0b5d8f2a7c4e9b1d6f0a3c5e8b2d7f4a1c6e9b0d3f5a8', // Sui address
    '0x168da5bf1f48dafc111b0a488b0d47b0049f82e32db06e6b1b0b3c2fd6f1b1b1' // Popular Sui address
  ]
}

// Flatten all addresses for general search
export const allWalletAddresses = [
  ...mockWalletAddresses.BTC,
  ...mockWalletAddresses.ETH,
  ...mockWalletAddresses.SOL,
  ...mockWalletAddresses.SUI
]

/**
 * Detect network type from wallet address format
 * @param {string} address - Wallet address
 * @returns {string|null} - Network type or null if invalid
 */
export const detectAddressNetwork = (address) => {
  if (!address) return null
  
  // Bitcoin patterns
  if (address.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || address.match(/^bc1[a-z0-9]{38,59}$/)) {
    return 'BTC'
  }
  
  // Ethereum pattern (also works for Arbitrum, Base)
  if (address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return 'ETH'
  }
  
  // Sui pattern (0x followed by 64 hex chars)
  if (address.match(/^0x[a-fA-F0-9]{64}$/)) {
    return 'SUI'
  }
  
  // Solana pattern (Base58, 32-44 chars)
  if (address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
    return 'SOL'
  }
  
  return null
}

/**
 * Detect network with detailed validation information
 * @param {string} address - Wallet address
 * @returns {Object} - Network detection result with validation info
 */
export const detectAddressNetworkDetailed = (address) => {
  if (!address || !address.trim()) {
    return { network: null, isValid: false, isSupported: false, error: null }
  }

  const cleanAddress = address.trim()
  const supportedNetworks = ['BTC', 'ETH', 'SOL', 'SUI']
  
  // Supported network patterns
  const networkPatterns = {
    'BTC': /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{38,59}$/,
    'ETH': /^0x[a-fA-F0-9]{40}$/,
    'SOL': /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    'SUI': /^0x[a-fA-F0-9]{64}$/
  }

  // Check supported networks first
  for (const [network, pattern] of Object.entries(networkPatterns)) {
    if (pattern.test(cleanAddress)) {
      return { 
        network, 
        isValid: true, 
        isSupported: true, 
        error: null 
      }
    }
  }

  // Check for common unsupported patterns - comprehensive list from TRANSACTIONS.md
  const unsupportedPatterns = {
    'TRON': /^T[1-9A-HJ-NP-Za-km-z]{33}$/, // Tron addresses
    'BNB': /^bnb1[a-z0-9]{38}$/, // Binance Chain addresses
    'XRP': /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/, // Ripple addresses
    'ADA': /^addr1[a-z0-9]{50,}$/, // Cardano Shelley addresses
    'AVAX': /^X-avax[a-zA-Z0-9]{39}$/, // Avalanche X-Chain
    'DOT': /^1[a-zA-Z0-9]{47}$/, // Polkadot addresses
    'BCH': /^(bitcoincash:)?[qp][a-z0-9]{41}$|^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Bitcoin Cash
    'NEAR': /^[a-z0-9]+\.near$|^[a-f0-9]{64}$/, // NEAR Protocol
    'HBAR': /^0\.0\.\d+$/, // Hedera
    'CRO': /^cro1[a-z0-9]{38}$/, // Cronos
    'XLM': /^G[A-Z2-7]{55}$/, // Stellar
    'ATOM': /^cosmos1[a-z0-9]{38}$/, // Cosmos
    'COSMOS': /^cosmos1[a-z0-9]{38}$/, // Cosmos (alias)
    'DOGE': /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/, // Dogecoin
    'LTC': /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$|^ltc1[a-z0-9]{39,59}$/, // Litecoin
    'XMR': /^[48][1-9A-HJ-NP-Za-km-z]{94}$/, // Monero
    'XTZ': /^tz[123][a-zA-Z0-9]{33}$/, // Tezos
    'ALGO': /^[A-Z2-7]{58}$/, // Algorand
    'FIL': /^f[013][a-zA-Z0-9]+$/, // Filecoin
    'KSM': /^[A-HJ-NP-Za-km-z]{47,48}$/, // Kusama
    'MATIC': /^0x[a-fA-F0-9]{40}$/, // Polygon (same as ETH but different network)
    'USDT': /^T[1-9A-HJ-NP-Za-km-z]{33}$/ // USDT on TRON
  }

  // Check for unsupported but valid formats
  for (const [network, pattern] of Object.entries(unsupportedPatterns)) {
    if (pattern.test(cleanAddress)) {
      return { 
        network, 
        isValid: true, 
        isSupported: false, 
        error: `${network} addresses are not currently supported. Please use BTC, ETH, SOL, or SUI addresses.` 
      }
    }
  }

  // If no pattern matches, it's invalid
  return { 
    network: null, 
    isValid: false, 
    isSupported: false, 
    error: 'Invalid wallet address format. Please enter a valid BTC, ETH, SOL, or SUI address.' 
  }
}

/**
 * Search for wallet addresses matching a query
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results (default: 5)
 * @returns {Promise<Array>} - Array of matching addresses with network info
 */
export const searchWalletAddresses = async (query, limit = 5) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  if (!query || query.length < 3) return []
  
  const searchTerm = query.toLowerCase()
  
  // Filter addresses that match the search term (prefix matching)
  const matchingAddresses = allWalletAddresses
    .filter(address => address.toLowerCase().startsWith(searchTerm))
    .slice(0, limit)
    .map(address => ({
      address,
      network: detectAddressNetwork(address),
      displayAddress: `${address.slice(0, 8)}...${address.slice(-8)}`
    }))
  
  return matchingAddresses
}

/**
 * Get network-specific addresses for suggestions
 * @param {string} network - Network type (BTC, ETH, SOL, SUI)
 * @param {number} limit - Maximum number of results (default: 3)
 * @returns {Array} - Array of addresses for the specified network
 */
export const getNetworkAddresses = (network, limit = 3) => {
  const addresses = mockWalletAddresses[network] || []
  return addresses.slice(0, limit).map(address => ({
    address,
    network,
    displayAddress: `${address.slice(0, 8)}...${address.slice(-8)}`
  }))
}

/**
 * Validate wallet address format
 * @param {string} address - Wallet address to validate
 * @returns {Object} - Validation result with network info
 */
export const validateWalletAddress = (address) => {
  const network = detectAddressNetwork(address)
  
  return {
    isValid: network !== null,
    network: network,
    supportedNetworks: ['BTC', 'ETH', 'SOL', 'SUI']
  }
}

/**
 * Local storage utilities for recent wallet addresses
 */
export const RECENT_ADDRESSES_KEY = 'diboas_recent_wallet_addresses'

export const getRecentWalletAddresses = async (userId = 'global') => {
  try {
    // Try modern storage first
    let stored = await storage.getRecentAddresses(userId)
    
    // Legacy fallback
    if (!stored || stored.length === 0) {
      const legacyStored = localStorage.getItem(RECENT_ADDRESSES_KEY)
      if (legacyStored) {
        const parsed = JSON.parse(legacyStored)
        stored = Array.isArray(parsed) ? parsed : []
        // Migrate to modern storage
        if (stored.length > 0) {
          await storage.setRecentAddresses(userId, stored)
        }
      }
    }
    
    return Array.isArray(stored) ? stored.slice(0, 3) : []
  } catch (error) {
    logger.error('Error loading recent wallet addresses:', error)
    return []
  }
}

export const saveRecentWalletAddress = async (address, userId = 'global') => {
  if (!address) return
  
  const network = detectAddressNetwork(address)
  if (!network) return // Don't save invalid addresses
  
  const current = await getRecentWalletAddresses(userId)
  const addressData = {
    address,
    network,
    displayAddress: `${address.slice(0, 8)}...${address.slice(-8)}`,
    timestamp: Date.now()
  }
  
  // Remove if already exists, then add to front
  const filtered = current.filter(item => item.address !== address)
  const updated = [addressData, ...filtered].slice(0, 3)
  
  try {
    // Save to modern storage
    await storage.setRecentAddresses(userId, updated)
    
    // Keep legacy format for compatibility
    localStorage.setItem(RECENT_ADDRESSES_KEY, JSON.stringify(updated))
  } catch (error) {
    logger.error('Error saving recent wallet address:', error)
  }
}

/**
 * Get popular addresses by network for quick selection
 * @param {string} network - Network type
 * @returns {Array} - Popular addresses for the network
 */
export const getPopularAddresses = (network) => {
  const popularByNetwork = {
    BTC: [
      { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', label: 'Genesis Block' },
      { address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', label: 'Popular Bech32' }
    ],
    ETH: [
      { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', label: 'vitalik.eth' },
      { address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', label: 'Popular DeFi' }
    ],
    SOL: [
      { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', label: 'USDC Mint' },
      { address: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD', label: 'Popular Wallet' }
    ],
    SUI: [
      { address: '0x0000000000000000000000000000000000000000000000000000000000000002', label: 'System Address' },
      { address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', label: 'Popular Wallet' }
    ]
  }
  
  return (popularByNetwork[network] || []).map(item => ({
    ...item,
    network,
    displayAddress: `${item.address.slice(0, 8)}...${item.address.slice(-8)}`
  }))
}