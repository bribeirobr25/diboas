/**
 * Comprehensive Unit Tests for Transaction Engine
 * Tests all core transaction processing logic, validation, and edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TransactionEngine } from '../TransactionEngine.js'

// Mock dependencies
vi.mock('../IntegrationManager.js', () => ({
  getIntegrationManager: vi.fn(() => Promise.resolve({
    execute: vi.fn()
  }))
}))

vi.mock('../MultiWalletManager.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    getUnifiedBalance: vi.fn(),
    updateBalances: vi.fn(),
    findRoutingOptions: vi.fn(),
    executeRouting: vi.fn(),
    estimateRoutingFees: vi.fn()
  }))
}))

vi.mock('../../utils/security.js', () => ({
  generateSecureId: vi.fn(() => 'test-tx-id-12345')
}))

vi.mock('../../utils/securityLogging.js', () => ({
  logSecureEvent: vi.fn()
}))

describe('TransactionEngine', () => {
  let transactionEngine
  let mockWalletManager
  let mockIntegrationManager

  beforeEach(async () => {
    transactionEngine = new TransactionEngine()
    await transactionEngine.initialize()
    
    mockWalletManager = transactionEngine.walletManager
    mockIntegrationManager = transactionEngine.integrationManager
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with correct fee structure', () => {
      expect(transactionEngine.feeStructure).toEqual({
        'add': { diBoaS: 0.0009, maxProvider: 0.029 },
        'withdraw': { diBoaS: 0.009, maxProvider: 0.029 },
        'send': { diBoaS: 0.0009 },
        'receive': { diBoaS: 0.0009 },
        'transfer': { diBoaS: 0.009 },
        'buy': { diBoaS: 0.0009 },
        'sell': { diBoaS: 0.0009 },
        'invest': { diBoaS: 0.0009 }
      })
    })

    it('should initialize with correct minimum amounts', () => {
      expect(transactionEngine.minimumAmounts).toEqual({
        'add': 10.0,
        'withdraw': 10.0,
        'send': 5.0,
        'receive': 5.0,
        'transfer': 10.0,
        'buy': 10.0,
        'sell': 10.0,
        'invest': 10.0
      })
    })
  })

  describe('Transaction Validation', () => {
    describe('Basic Validation', () => {
      it('should reject missing transaction type', async () => {
        const result = await transactionEngine.validateTransaction('user123', {
          amount: '100'
        })
        
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Missing required fields')
      })

      it('should reject missing amount', async () => {
        const result = await transactionEngine.validateTransaction('user123', {
          type: 'buy'
        })
        
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Missing required fields')
      })

      it('should reject invalid amount', async () => {
        const result = await transactionEngine.validateTransaction('user123', {
          type: 'buy',
          amount: 'invalid'
        })
        
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Invalid amount')
      })

      it('should reject negative amount', async () => {
        const result = await transactionEngine.validateTransaction('user123', {
          type: 'buy',
          amount: '-50'
        })
        
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Invalid amount')
      })

      it('should reject zero amount', async () => {
        const result = await transactionEngine.validateTransaction('user123', {
          type: 'buy',
          amount: '0'
        })
        
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Invalid amount')
      })
    })

    describe('Minimum Amount Validation', () => {
      const minimumAmountTests = [
        { type: 'add', minimum: 10.0 },
        { type: 'withdraw', minimum: 10.0 },
        { type: 'send', minimum: 5.0 },
        { type: 'transfer', minimum: 10.0 },
        { type: 'buy', minimum: 10.0 },
        { type: 'sell', minimum: 10.0 }
      ]

      minimumAmountTests.forEach(({ type, minimum }) => {
        it(`should enforce minimum amount of $${minimum} for ${type} transactions`, async () => {
          const belowMinimum = (minimum - 0.01).toString()
          const result = await transactionEngine.validateTransaction('user123', {
            type,
            amount: belowMinimum,
            ...(type === 'buy' && { asset: 'BTC' }),
            ...(type === 'sell' && { asset: 'BTC' })
          })
          
          expect(result.isValid).toBe(false)
          expect(result.error).toContain(`Minimum amount for ${type} is $${minimum}`)
        })

        it(`should accept amount at minimum threshold for ${type} transactions`, async () => {
          const result = await transactionEngine.validateTransaction('user123', {
            type,
            amount: minimum.toString(),
            ...(type === 'buy' && { asset: 'BTC' }),
            ...(type === 'sell' && { asset: 'BTC' }),
            ...(type === 'send' && { recipient: '@testuser' }),
            ...(type === 'transfer' && { recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' })
          })
          
          expect(result.isValid).toBe(true)
        })
      })
    })

    describe('Recipient Validation', () => {
      describe('P2P Transactions (Send/Receive)', () => {
        it('should require recipient for send transactions', async () => {
          const result = await transactionEngine.validateTransaction('user123', {
            type: 'send',
            amount: '50'
          })
          
          expect(result.isValid).toBe(false)
          expect(result.error).toContain('Recipient is required')
        })

        it('should validate diBoaS username format for send transactions', async () => {
          const invalidUsernames = ['invalid', 'user', '@ab', '@toolongusernamethatexceedslimit']
          
          for (const username of invalidUsernames) {
            const result = await transactionEngine.validateTransaction('user123', {
              type: 'send',
              amount: '50',
              recipient: username
            })
            
            expect(result.isValid).toBe(false)
            expect(result.error).toContain('Invalid diBoaS username')
          }
        })

        it('should accept valid diBoaS usernames for send transactions', async () => {
          const validUsernames = ['@john', '@user123', '@test_user', '@valid_username_20']
          
          for (const username of validUsernames) {
            const result = await transactionEngine.validateTransaction('user123', {
              type: 'send',
              amount: '50',
              recipient: username
            })
            
            expect(result.isValid).toBe(true)
          }
        })
      })

      describe('External Transfer Validation', () => {
        it('should require recipient for transfer transactions', async () => {
          const result = await transactionEngine.validateTransaction('user123', {
            type: 'transfer',
            amount: '100'
          })
          
          expect(result.isValid).toBe(false)
          expect(result.error).toContain('Recipient is required')
        })

        it('should validate Bitcoin addresses', async () => {
          const validBitcoinAddresses = [
            '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Legacy
            '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // SegWit
            'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq' // Bech32
          ]
          
          for (const address of validBitcoinAddresses) {
            const result = await transactionEngine.validateTransaction('user123', {
              type: 'transfer',
              amount: '100',
              recipient: address
            })
            
            expect(result.isValid).toBe(true)
          }
        })

        it('should validate Ethereum addresses', async () => {
          const validEthereumAddresses = [
            '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
            '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
          ]
          
          for (const address of validEthereumAddresses) {
            const result = await transactionEngine.validateTransaction('user123', {
              type: 'transfer',
              amount: '100',
              recipient: address
            })
            
            expect(result.isValid).toBe(true)
          }
        })

        it('should validate Solana addresses', async () => {
          const validSolanaAddresses = [
            '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD',
            'DQyrAcCrDXQ8NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz'
          ]
          
          for (const address of validSolanaAddresses) {
            const result = await transactionEngine.validateTransaction('user123', {
              type: 'transfer',
              amount: '100',
              recipient: address
            })
            
            expect(result.isValid).toBe(true)
          }
        })

        it('should validate Sui addresses', async () => {
          const validSuiAddresses = [
            '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
            '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'
          ]
          
          for (const address of validSuiAddresses) {
            const result = await transactionEngine.validateTransaction('user123', {
              type: 'transfer',
              amount: '100',
              recipient: address
            })
            
            expect(result.isValid).toBe(true)
          }
        })

        it('should reject invalid wallet addresses', async () => {
          const invalidAddresses = [
            'invalid_address',
            '0xinvalid',
            '1InvalidBitcoinAddress',
            'invalidsolanaaddress',
            '0xinvalidsuiaddressthatistoolong'
          ]
          
          for (const address of invalidAddresses) {
            const result = await transactionEngine.validateTransaction('user123', {
              type: 'transfer',
              amount: '100',
              recipient: address
            })
            
            expect(result.isValid).toBe(false)
            expect(result.error).toContain('Invalid wallet address')
          }
        })
      })
    })

    describe('Asset Validation', () => {
      describe('Buy Transactions', () => {
        it('should require asset for buy transactions', async () => {
          const result = await transactionEngine.validateTransaction('user123', {
            type: 'buy',
            amount: '100'
          })
          
          expect(result.isValid).toBe(false)
          expect(result.error).toContain('Asset selection is required')
        })

        it('should accept valid assets for buy transactions', async () => {
          const validAssets = ['BTC', 'ETH', 'SOL', 'SUI']
          
          for (const asset of validAssets) {
            const result = await transactionEngine.validateTransaction('user123', {
              type: 'buy',
              amount: '100',
              asset
            })
            
            expect(result.isValid).toBe(true)
          }
        })

        it('should reject invalid assets for buy transactions', async () => {
          const invalidAssets = ['INVALID', 'DOGE', 'ADA', 'DOT']
          
          for (const asset of invalidAssets) {
            const result = await transactionEngine.validateTransaction('user123', {
              type: 'buy',
              amount: '100',
              asset
            })
            
            expect(result.isValid).toBe(false)
            expect(result.error).toContain(`Invalid asset for buy transaction`)
          }
        })
      })

      describe('Sell Transactions', () => {
        it('should require asset for sell transactions', async () => {
          const result = await transactionEngine.validateTransaction('user123', {
            type: 'sell',
            amount: '100'
          })
          
          expect(result.isValid).toBe(false)
          expect(result.error).toContain('Asset selection is required')
        })

        it('should accept valid assets for sell transactions', async () => {
          const validAssets = ['BTC', 'ETH', 'SOL', 'SUI', 'GOLD', 'STOCKS']
          
          for (const asset of validAssets) {
            const result = await transactionEngine.validateTransaction('user123', {
              type: 'sell',
              amount: '100',
              asset
            })
            
            expect(result.isValid).toBe(true)
          }
        })
      })
    })
  })

  describe('Transaction Routing', () => {
    beforeEach(() => {
      mockWalletManager.getUnifiedBalance.mockResolvedValue({
        total: 1000,
        available: 500,
        invested: 500,
        breakdown: {
          SOL: { usdc: 300, sol: 0.5 },
          ETH: { usdc: 200, eth: 0.1 }
        },
        assets: {
          BTC: { amount: 0.01, usdValue: 430 },
          ETH: { amount: 0.1, usdValue: 350 }
        }
      })
    })

    describe('Add (On-Ramp) Routing', () => {
      it('should plan valid routing for add transactions', async () => {
        const result = await transactionEngine.planTransactionRouting('user123', {
          type: 'add',
          amount: '100'
        })
        
        expect(result.feasible).toBe(true)
        expect(result.toChain).toBe('SOL')
        expect(result.toAsset).toBe('USDC')
        expect(result.routingSteps).toHaveLength(1)
        expect(result.routingSteps[0].action).toBe('onramp')
      })
    })

    describe('Withdraw (Off-Ramp) Routing', () => {
      it('should plan valid routing for withdraw with sufficient balance', async () => {
        const result = await transactionEngine.planTransactionRouting('user123', {
          type: 'withdraw',
          amount: '200'
        })
        
        expect(result.feasible).toBe(true)
        expect(result.fromChain).toBe('SOL')
        expect(result.fromAsset).toBe('USDC')
      })

      it('should reject withdraw with insufficient balance', async () => {
        const result = await transactionEngine.planTransactionRouting('user123', {
          type: 'withdraw',
          amount: '600' // More than available USDC (300)
        })
        
        expect(result.feasible).toBe(false)
        expect(result.error).toContain('Insufficient balance')
      })
    })

    describe('Send (P2P) Routing', () => {
      it('should plan valid routing for send with sufficient balance', async () => {
        const result = await transactionEngine.planTransactionRouting('user123', {
          type: 'send',
          amount: '100',
          recipient: '@testuser'
        })
        
        expect(result.feasible).toBe(true)
        expect(result.fromChain).toBe('SOL')
        expect(result.toChain).toBe('SOL')
      })
    })

    describe('Transfer (External) Routing', () => {
      beforeEach(() => {
        mockWalletManager.findRoutingOptions.mockResolvedValue([
          {
            fromChain: 'SOL',
            toChain: 'BTC',
            fromAsset: 'USDC',
            toAsset: 'USDC',
            fromAmount: 100,
            toAmount: 95,
            estimatedTime: 600
          }
        ])
      })

      it('should plan routing for cross-chain transfers', async () => {
        const result = await transactionEngine.planTransactionRouting('user123', {
          type: 'transfer',
          amount: '100',
          recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' // Bitcoin address
        })
        
        expect(result.feasible).toBe(true)
        expect(result.fromChain).toBe('SOL')
        expect(result.toChain).toBe('BTC')
        expect(result.needsRouting).toBe(true)
      })
    })

    describe('Buy Asset Routing', () => {
      beforeEach(() => {
        mockWalletManager.findRoutingOptions.mockResolvedValue([
          {
            fromChain: 'SOL',
            toChain: 'BTC',
            fromAsset: 'USDC',
            toAsset: 'USDC',
            fromAmount: 100,
            toAmount: 95,
            estimatedTime: 300
          }
        ])
      })

      it('should plan routing for asset purchases', async () => {
        const result = await transactionEngine.planTransactionRouting('user123', {
          type: 'buy',
          amount: '100',
          asset: 'BTC'
        })
        
        expect(result.feasible).toBe(true)
        expect(result.fromAsset).toBe('USDC')
        expect(result.toAsset).toBe('BTC')
        expect(result.needsRouting).toBe(true)
      })
    })

    describe('Sell Asset Routing', () => {
      it('should plan routing for asset sales with sufficient balance', async () => {
        const result = await transactionEngine.planTransactionRouting('user123', {
          type: 'sell',
          amount: '400', // Less than BTC USD value (430)
          asset: 'BTC'
        })
        
        expect(result.feasible).toBe(true)
        expect(result.fromAsset).toBe('BTC')
        expect(result.toAsset).toBe('USDC')
        expect(result.toChain).toBe('SOL')
      })

      it('should reject sell with insufficient asset balance', async () => {
        const result = await transactionEngine.planTransactionRouting('user123', {
          type: 'sell',
          amount: '500', // More than BTC USD value (430)
          asset: 'BTC'
        })
        
        expect(result.feasible).toBe(false)
        expect(result.error).toContain('Insufficient balance')
      })
    })
  })

  describe('Fee Calculations', () => {
    const mockRoutingPlan = {
      fromChain: 'SOL',
      toChain: 'BTC',
      needsRouting: true,
      amount: 100
    }

    beforeEach(() => {
      mockWalletManager.estimateRoutingFees.mockResolvedValue({
        total: 5.0
      })
    })

    describe('diBoaS Fees', () => {
      it('should calculate correct diBoaS fees for each transaction type', async () => {
        const feeTests = [
          { type: 'add', expectedRate: 0.0009, amount: 1000, expectedFee: 0.9 },
          { type: 'withdraw', expectedRate: 0.009, amount: 1000, expectedFee: 9 },
          { type: 'send', expectedRate: 0.0009, amount: 1000, expectedFee: 0.9 },
          { type: 'transfer', expectedRate: 0.009, amount: 1000, expectedFee: 9 },
          { type: 'buy', expectedRate: 0.0009, amount: 1000, expectedFee: 0.9 },
          { type: 'sell', expectedRate: 0.0009, amount: 1000, expectedFee: 0.9 }
        ]

        for (const { type, amount, expectedFee } of feeTests) {
          const fees = await transactionEngine.calculateComprehensiveFees(
            { type, amount: amount.toString() },
            { fromChain: 'SOL', toChain: 'SOL', needsRouting: false }
          )
          
          expect(fees.diBoaS).toBeCloseTo(expectedFee, 2)
        }
      })
    })

    describe('Network Fees', () => {
      it('should calculate network fees based on chains used', async () => {
        const chainFeeTests = [
          { fromChain: 'BTC', toChain: 'BTC', expectedNetworkFee: 15.0 },
          { fromChain: 'ETH', toChain: 'ETH', expectedNetworkFee: 25.0 },
          { fromChain: 'SOL', toChain: 'SOL', expectedNetworkFee: 0.5 },
          { fromChain: 'SUI', toChain: 'SUI', expectedNetworkFee: 0.8 },
          { fromChain: 'SOL', toChain: 'BTC', expectedNetworkFee: 15.5 } // Both chains
        ]

        for (const { fromChain, toChain, expectedNetworkFee } of chainFeeTests) {
          const fees = await transactionEngine.calculateComprehensiveFees(
            { type: 'transfer', amount: '100' },
            { fromChain, toChain, needsRouting: false }
          )
          
          expect(fees.network).toBeCloseTo(expectedNetworkFee, 1)
        }
      })
    })

    describe('Provider Fees', () => {
      it('should include provider fees for on/off-ramp transactions', async () => {
        const onRampFees = await transactionEngine.calculateComprehensiveFees(
          { type: 'add', amount: '1000' },
          { fromChain: 'SOL', toChain: 'SOL', needsRouting: false }
        )
        
        expect(onRampFees.provider).toBe(29) // 1000 * 0.029 = 29
        
        const offRampFees = await transactionEngine.calculateComprehensiveFees(
          { type: 'withdraw', amount: '1000' },
          { fromChain: 'SOL', toChain: 'SOL', needsRouting: false }
        )
        
        expect(offRampFees.provider).toBe(29) // 1000 * 0.029 = 29
      })

      it('should not include provider fees for P2P transactions', async () => {
        const p2pFees = await transactionEngine.calculateComprehensiveFees(
          { type: 'send', amount: '1000' },
          { fromChain: 'SOL', toChain: 'SOL', needsRouting: false }
        )
        
        expect(p2pFees.provider).toBe(0)
      })
    })

    describe('Routing Fees', () => {
      it('should include routing fees for cross-chain transactions', async () => {
        const crossChainFees = await transactionEngine.calculateComprehensiveFees(
          { type: 'transfer', amount: '100' },
          mockRoutingPlan
        )
        
        expect(crossChainFees.routing).toBe(5.0)
        expect(mockWalletManager.estimateRoutingFees).toHaveBeenCalledWith('SOL', 'BTC', 100)
      })

      it('should not include routing fees for same-chain transactions', async () => {
        const sameChainFees = await transactionEngine.calculateComprehensiveFees(
          { type: 'send', amount: '100' },
          { fromChain: 'SOL', toChain: 'SOL', needsRouting: false }
        )
        
        expect(sameChainFees.routing).toBe(0)
      })
    })

    describe('Investment Fees', () => {
      it('should include investment provider fees for invest transactions', async () => {
        const investFees = await transactionEngine.calculateComprehensiveFees(
          { type: 'invest', amount: '1000' },
          { fromChain: 'SOL', toChain: 'SOL', needsRouting: false }
        )
        
        expect(investFees.provider).toBe(5) // 1000 * 0.005 = 5
      })
    })

    describe('Total Fee Calculation', () => {
      it('should calculate total fees correctly', async () => {
        const fees = await transactionEngine.calculateComprehensiveFees(
          { type: 'withdraw', amount: '1000' },
          { fromChain: 'SOL', toChain: 'SOL', needsRouting: false }
        )
        
        const expectedTotal = fees.diBoaS + fees.network + fees.provider + fees.routing
        expect(fees.total).toBeCloseTo(expectedTotal, 2)
      })

      it('should include proper fee breakdown', async () => {
        const fees = await transactionEngine.calculateComprehensiveFees(
          { type: 'add', amount: '1000' },
          { fromChain: 'SOL', toChain: 'SOL', needsRouting: false }
        )
        
        expect(fees.breakdown).toHaveLength(3) // diBoaS, network, provider
        expect(fees.breakdown[0].type).toBe('diBoaS')
        expect(fees.breakdown[0].amount).toBe(fees.diBoaS)
      })
    })
  })

  describe('Chain Detection', () => {
    const chainDetectionTests = [
      // Bitcoin addresses
      { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', expectedChain: 'BTC' },
      { address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', expectedChain: 'BTC' },
      { address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', expectedChain: 'BTC' },
      
      // Ethereum addresses
      { address: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', expectedChain: 'ETH' },
      { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', expectedChain: 'ETH' },
      
      // Solana addresses
      { address: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD', expectedChain: 'SOL' },
      { address: 'DQyrAcCrDXQ8NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz', expectedChain: 'SOL' }
    ]

    chainDetectionTests.forEach(({ address, expectedChain }) => {
      it(`should detect ${expectedChain} chain from address ${address.substring(0, 10)}...`, () => {
        const detectedChain = transactionEngine.detectChainFromAddress(address)
        expect(detectedChain).toBe(expectedChain)
      })
    })

    it('should fallback to ETH for unrecognized addresses', () => {
      const unknownAddress = 'unknown_address_format'
      const detectedChain = transactionEngine.detectChainFromAddress(unknownAddress)
      expect(detectedChain).toBe('ETH')
    })
  })

  describe('Asset Chain Mapping', () => {
    const assetChainTests = [
      { asset: 'BTC', expectedChain: 'BTC' },
      { asset: 'ETH', expectedChain: 'ETH' },
      { asset: 'SOL', expectedChain: 'SOL' },
      { asset: 'SUI', expectedChain: 'SUI' },
      { asset: 'USDC', expectedChain: 'SOL' }, // Default to Solana
      { asset: 'GOLD', expectedChain: 'SOL' },
      { asset: 'STOCKS', expectedChain: 'SOL' },
      { asset: 'REALESTATE', expectedChain: 'SOL' }
    ]

    assetChainTests.forEach(({ asset, expectedChain }) => {
      it(`should map ${asset} to ${expectedChain} chain`, () => {
        const chain = transactionEngine.getAssetNativeChain(asset)
        expect(chain).toBe(expectedChain)
      })
    })

    it('should default to SOL for unknown assets', () => {
      const unknownAsset = 'UNKNOWN_ASSET'
      const chain = transactionEngine.getAssetNativeChain(unknownAsset)
      expect(chain).toBe('SOL')
    })
  })

  describe('Helper Methods', () => {
    describe('Wallet Address Validation', () => {
      it('should validate correct wallet addresses', () => {
        const validAddresses = [
          '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Bitcoin
          '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', // Ethereum
          '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD', // Solana
          '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f' // Sui
        ]

        validAddresses.forEach(address => {
          expect(transactionEngine.isValidWalletAddress(address)).toBe(true)
        })
      })

      it('should reject invalid wallet addresses', () => {
        const invalidAddresses = [
          'invalid_address',
          '0xinvalid',
          '1InvalidBitcoinAddress',
          'invalidsolanaaddress'
        ]

        invalidAddresses.forEach(address => {
          expect(transactionEngine.isValidWalletAddress(address)).toBe(false)
        })
      })
    })

    describe('diBoaS Username Validation', () => {
      it('should validate correct diBoaS usernames', () => {
        const validUsernames = ['@john', '@user123', '@test_user']
        
        validUsernames.forEach(username => {
          expect(transactionEngine.isValidDiBoaSUsername(username)).toBe(true)
        })
      })

      it('should reject invalid diBoaS usernames', () => {
        const invalidUsernames = ['invalid', '@ab', '@toolongusernamethatexceedslimit']
        
        invalidUsernames.forEach(username => {
          expect(transactionEngine.isValidDiBoaSUsername(username)).toBe(false)
        })
      })
    })

    describe('Asset Validation', () => {
      it('should validate assets for buy transactions', () => {
        const validBuyAssets = ['BTC', 'ETH', 'SOL', 'SUI', 'USDC']
        
        validBuyAssets.forEach(asset => {
          expect(transactionEngine.isValidAsset(asset, 'buy')).toBe(true)
        })
      })

      it('should validate assets for sell transactions', () => {
        const validSellAssets = ['BTC', 'ETH', 'SOL', 'SUI', 'GOLD', 'STOCKS']
        
        validSellAssets.forEach(asset => {
          expect(transactionEngine.isValidAsset(asset, 'sell')).toBe(true)
        })
      })

      it('should validate assets for invest transactions', () => {
        const validInvestAssets = ['GOLD', 'STOCKS', 'REALESTATE']
        
        validInvestAssets.forEach(asset => {
          expect(transactionEngine.isValidAsset(asset, 'invest')).toBe(true)
        })
      })

      it('should reject invalid assets for transaction types', () => {
        expect(transactionEngine.isValidAsset('INVALID', 'buy')).toBe(false)
        expect(transactionEngine.isValidAsset('GOLD', 'buy')).toBe(false) // Gold not valid for buy
        expect(transactionEngine.isValidAsset('BTC', 'invest')).toBe(false) // BTC not valid for invest
      })
    })
  })
})