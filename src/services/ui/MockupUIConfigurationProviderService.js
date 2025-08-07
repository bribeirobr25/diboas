/**
 * Mockup UI Configuration Provider Service
 * Simulates 3rd party UI/UX configuration management APIs with realistic response times
 * This will be replaced with real CMS/UI management integrations
 */

import logger from '../../utils/logger.js'

export class MockupUIConfigurationProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get quick amount selection configurations
   * In production, this would come from UI management systems
   */
  async getQuickAmountConfigurations(transactionType = 'deposit', userContext = {}) {
    await this.simulateNetworkDelay(200, 500)
    
    // Generate contextual amounts based on transaction type and user profile
    const generateAmounts = (baseAmounts, multiplier = 1) => {
      return baseAmounts.map(amount => ({
        label: this.formatCurrencyLabel(amount * multiplier),
        value: (amount * multiplier).toString(),
        popular: Math.random() > 0.7, // 30% chance of being popular
        recommended: Math.random() > 0.8 // 20% chance of being recommended
      }))
    }

    const configurations = {
      deposit: {
        standard: generateAmounts([25, 50, 100, 250, 500, 1000]),
        beginner: generateAmounts([10, 25, 50, 100, 250]),
        intermediate: generateAmounts([100, 250, 500, 1000, 2500]),
        advanced: generateAmounts([500, 1000, 2500, 5000, 10000])
      },
      
      withdraw: {
        standard: generateAmounts([25, 50, 100, 200, 500]),
        percentage: [
          { label: '25%', value: '25', type: 'percentage', popular: true },
          { label: '50%', value: '50', type: 'percentage', popular: true },
          { label: '75%', value: '75', type: 'percentage' },
          { label: '100%', value: '100', type: 'percentage', recommended: true }
        ]
      },
      
      trade: {
        buy: generateAmounts([50, 100, 250, 500, 1000, 2000]),
        sell: [
          { label: '10%', value: '10', type: 'percentage' },
          { label: '25%', value: '25', type: 'percentage', popular: true },
          { label: '50%', value: '50', type: 'percentage', popular: true },
          { label: '75%', value: '75', type: 'percentage' },
          { label: '100%', value: '100', type: 'percentage' }
        ]
      },
      
      transfer: {
        internal: generateAmounts([10, 25, 50, 100, 250, 500]),
        external: generateAmounts([25, 50, 100, 200, 500, 1000])
      },
      
      strategy_funding: {
        initial: generateAmounts([100, 250, 500, 1000, 2500, 5000]),
        recurring: generateAmounts([25, 50, 100, 250, 500])
      }
    }
    
    // Customize based on user context
    let selectedConfig = configurations[transactionType]?.standard || configurations.deposit.standard
    
    if (userContext.experienceLevel) {
      selectedConfig = configurations[transactionType]?.[userContext.experienceLevel] || selectedConfig
    }
    
    // Apply regional adjustments
    if (userContext.currency && userContext.currency !== 'USD') {
      const exchangeRate = this.getExchangeRate(userContext.currency)
      selectedConfig = selectedConfig.map(config => ({
        ...config,
        label: this.formatCurrencyLabel(parseFloat(config.value) * exchangeRate, userContext.currency),
        value: (parseFloat(config.value) * exchangeRate).toString(),
        originalUSD: config.value
      }))
    }
    
    return {
      transactionType,
      amounts: selectedConfig,
      customAmountEnabled: true,
      maxCustomAmount: this.getMaxAmount(transactionType, userContext),
      minCustomAmount: this.getMinAmount(transactionType, userContext),
      defaultSelection: selectedConfig.find(a => a.recommended)?.value || selectedConfig[2]?.value,
      currency: userContext.currency || 'USD',
      lastUpdated: Date.now()
    }
  }

  /**
   * Get form field configurations
   * In production, this would come from form management systems
   */
  async getFormFieldConfigurations(formType = 'transaction') {
    await this.simulateNetworkDelay(250, 600)
    
    const fieldConfigurations = {
      transaction: {
        amount: {
          type: 'currency',
          label: 'Amount',
          placeholder: 'Enter amount',
          required: true,
          validation: {
            min: 0.01,
            max: 1000000,
            pattern: /^\d+(\.\d{1,8})?$/,
            errorMessages: {
              required: 'Amount is required',
              min: 'Minimum amount is $0.01',
              max: 'Maximum amount is $1,000,000',
              pattern: 'Invalid amount format'
            }
          },
          formatting: {
            showCurrency: true,
            decimalPlaces: 2,
            thousandsSeparator: true,
            prefix: '$'
          },
          quickAmounts: true,
          calculator: true
        },
        
        wallet_address: {
          type: 'text',
          label: 'Wallet Address',
          placeholder: 'Enter recipient wallet address',
          required: true,
          validation: {
            minLength: 26,
            maxLength: 62,
            pattern: /^[a-zA-Z0-9]{26,62}$/,
            customValidation: 'wallet_address',
            errorMessages: {
              required: 'Wallet address is required',
              pattern: 'Invalid wallet address format',
              checksum: 'Invalid address checksum'
            }
          },
          features: {
            addressBook: true,
            qrScanner: true,
            pasteButton: true,
            validation: 'realtime',
            suggestions: true
          }
        },
        
        network: {
          type: 'select',
          label: 'Network',
          placeholder: 'Select network',
          required: true,
          options: [
            { value: 'ethereum', label: 'Ethereum', icon: 'ethereum', fee: '~$2-15' },
            { value: 'polygon', label: 'Polygon', icon: 'polygon', fee: '~$0.01-0.10' },
            { value: 'solana', label: 'Solana', icon: 'solana', fee: '~$0.01' },
            { value: 'bsc', label: 'BSC', icon: 'binance', fee: '~$0.20-1.00' }
          ],
          defaultValue: 'ethereum',
          showFees: true,
          showIcons: true,
          grouping: false
        },
        
        memo: {
          type: 'textarea',
          label: 'Memo (Optional)',
          placeholder: 'Add a note for this transaction',
          required: false,
          validation: {
            maxLength: 280,
            errorMessages: {
              maxLength: 'Memo cannot exceed 280 characters'
            }
          },
          features: {
            characterCount: true,
            suggestions: ['Payment for services', 'Monthly transfer', 'Gift'],
            templates: true
          }
        }
      },
      
      profile: {
        display_name: {
          type: 'text',
          label: 'Display Name',
          placeholder: 'Enter your display name',
          required: true,
          validation: {
            minLength: 2,
            maxLength: 50,
            pattern: /^[a-zA-Z0-9\s\-_\.]+$/,
            errorMessages: {
              required: 'Display name is required',
              minLength: 'Display name must be at least 2 characters',
              maxLength: 'Display name cannot exceed 50 characters',
              pattern: 'Display name contains invalid characters'
            }
          },
          features: {
            availability: true,
            suggestions: true,
            uniqueness: true
          }
        },
        
        email: {
          type: 'email',
          label: 'Email Address',
          placeholder: 'Enter your email address',
          required: true,
          validation: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            domainWhitelist: null,
            domainBlacklist: ['tempmail.com', '10minutemail.com'],
            errorMessages: {
              required: 'Email address is required',
              pattern: 'Invalid email format',
              blacklisted: 'Temporary email addresses are not allowed'
            }
          },
          features: {
            verification: true,
            suggestions: true,
            duplicateCheck: true
          }
        },
        
        phone: {
          type: 'tel',
          label: 'Phone Number',
          placeholder: 'Enter your phone number',
          required: false,
          validation: {
            pattern: /^\+?[1-9]\d{1,14}$/,
            countryCode: true,
            errorMessages: {
              pattern: 'Invalid phone number format'
            }
          },
          features: {
            countrySelector: true,
            formatting: true,
            verification: true
          }
        }
      },
      
      kyc: {
        document_type: {
          type: 'select',
          label: 'Document Type',
          placeholder: 'Select document type',
          required: true,
          options: [
            { value: 'passport', label: 'Passport', icon: 'passport', requirements: 'Must be valid and not expired' },
            { value: 'drivers_license', label: 'Driver\'s License', icon: 'id_card', requirements: 'Valid government-issued ID' },
            { value: 'national_id', label: 'National ID Card', icon: 'id_card', requirements: 'Government-issued national ID' }
          ],
          validation: {
            errorMessages: {
              required: 'Document type is required'
            }
          },
          features: {
            requirements: true,
            examples: true
          }
        },
        
        document_upload: {
          type: 'file',
          label: 'Document Upload',
          placeholder: 'Upload your document',
          required: true,
          validation: {
            allowedTypes: ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'],
            maxSize: 10485760, // 10MB
            minSize: 50000, // 50KB
            imageValidation: {
              minWidth: 300,
              minHeight: 300,
              maxWidth: 8000,
              maxHeight: 8000
            },
            errorMessages: {
              required: 'Document upload is required',
              invalidType: 'Only JPEG, PNG, HEIC, and PDF files are allowed',
              tooLarge: 'File size cannot exceed 10MB',
              tooSmall: 'File size must be at least 50KB',
              lowResolution: 'Image resolution is too low'
            }
          },
          features: {
            preview: true,
            crop: true,
            enhance: true,
            multipleFiles: false,
            dragDrop: true,
            camera: true
          }
        }
      }
    }
    
    const config = fieldConfigurations[formType] || fieldConfigurations.transaction
    
    // Add dynamic properties
    Object.keys(config).forEach(fieldName => {
      config[fieldName].id = fieldName
      config[fieldName].name = fieldName
      config[fieldName].lastUpdated = Date.now()
      config[fieldName].version = '1.0.0'
    })
    
    return {
      formType,
      fields: config,
      validation: {
        realtime: true,
        onSubmit: true,
        debounceMs: 300
      },
      accessibility: {
        ariaLabels: true,
        keyboardNavigation: true,
        screenReader: true,
        highContrast: true
      },
      lastUpdated: Date.now()
    }
  }

  /**
   * Get button and action configurations
   * In production, this would come from UI component libraries
   */
  async getButtonConfigurations(context = 'general') {
    await this.simulateNetworkDelay(150, 400)
    
    return {
      primaryActions: {
        deposit: {
          label: 'Add Funds',
          variant: 'primary',
          size: 'large',
          icon: 'plus',
          iconPosition: 'left',
          loading: {
            text: 'Processing...',
            spinner: true
          },
          disabled: {
            text: 'Insufficient Balance',
            tooltip: 'You need a minimum balance to add funds'
          },
          success: {
            text: 'Funds Added!',
            duration: 2000
          },
          colors: {
            background: '#10B981',
            text: '#FFFFFF',
            hover: '#059669',
            disabled: '#D1D5DB'
          }
        },
        
        withdraw: {
          label: 'Withdraw Funds',
          variant: 'secondary',
          size: 'large',
          icon: 'download',
          iconPosition: 'left',
          confirmationRequired: true,
          loading: {
            text: 'Withdrawing...',
            spinner: true
          },
          colors: {
            background: '#F59E0B',
            text: '#FFFFFF',
            hover: '#D97706',
            disabled: '#D1D5DB'
          }
        },
        
        trade: {
          buy: {
            label: 'Buy',
            variant: 'success',
            size: 'medium',
            icon: 'trending_up',
            colors: {
              background: '#10B981',
              text: '#FFFFFF',
              hover: '#059669'
            }
          },
          sell: {
            label: 'Sell',
            variant: 'danger',
            size: 'medium',
            icon: 'trending_down',
            colors: {
              background: '#EF4444',
              text: '#FFFFFF',
              hover: '#DC2626'
            }
          }
        },
        
        strategy: {
          create: {
            label: 'Create Strategy',
            variant: 'primary',
            size: 'large',
            icon: 'target',
            iconPosition: 'left',
            gradient: true,
            colors: {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              text: '#FFFFFF',
              hover: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
            }
          }
        }
      },
      
      secondaryActions: {
        cancel: {
          label: 'Cancel',
          variant: 'outline',
          size: 'medium',
          colors: {
            background: 'transparent',
            text: '#6B7280',
            border: '#D1D5DB',
            hover: '#F9FAFB'
          }
        },
        
        back: {
          label: 'Go Back',
          variant: 'ghost',
          size: 'medium',
          icon: 'arrow_left',
          iconPosition: 'left'
        },
        
        help: {
          label: 'Get Help',
          variant: 'ghost',
          size: 'small',
          icon: 'help_circle',
          iconPosition: 'left',
          colors: {
            text: '#6B7280'
          }
        }
      },
      
      quickActions: [
        {
          id: 'add_funds',
          label: 'Add Funds',
          icon: 'plus',
          shortcut: 'A',
          color: '#10B981',
          order: 1
        },
        {
          id: 'send_money',
          label: 'Send Money',
          icon: 'send',
          shortcut: 'S',
          color: '#3B82F6',
          order: 2
        },
        {
          id: 'buy_crypto',
          label: 'Buy Crypto',
          icon: 'shopping_cart',
          shortcut: 'B',
          color: '#8B5CF6',
          order: 3
        },
        {
          id: 'view_portfolio',
          label: 'Portfolio',
          icon: 'pie_chart',
          shortcut: 'P',
          color: '#F59E0B',
          order: 4
        }
      ],
      
      contextualActions: {
        transaction_row: [
          {
            label: 'View Details',
            icon: 'eye',
            action: 'view_transaction'
          },
          {
            label: 'Export',
            icon: 'download',
            action: 'export_transaction'
          },
          {
            label: 'Share',
            icon: 'share',
            action: 'share_transaction'
          }
        ],
        
        portfolio_asset: [
          {
            label: 'Buy More',
            icon: 'plus',
            action: 'buy_asset'
          },
          {
            label: 'Sell',
            icon: 'minus',
            action: 'sell_asset'
          },
          {
            label: 'View Chart',
            icon: 'line_chart',
            action: 'view_chart'
          }
        ]
      }
    }
  }

  /**
   * Get tooltip and help text configurations
   * In production, this would come from help content management systems
   */
  async getTooltipConfigurations(component = 'general') {
    await this.simulateNetworkDelay(200, 500)
    
    return {
      transaction_fees: {
        title: 'Transaction Fees',
        content: 'Network fees are required to process blockchain transactions. Fees vary based on network congestion.',
        placement: 'top',
        trigger: 'hover',
        delay: 300,
        maxWidth: 300,
        links: [
          {
            text: 'Learn more about fees',
            url: '/help/transaction-fees'
          }
        ]
      },
      
      apy_calculation: {
        title: 'APY (Annual Percentage Yield)',
        content: 'The projected annual return including compound interest. Actual returns may vary based on market conditions.',
        placement: 'right',
        trigger: 'click',
        interactive: true,
        formula: 'APY = (1 + r/n)^n - 1',
        example: 'For 5% APY: You earn $50 annually on every $1,000 invested',
        disclaimer: 'Past performance does not guarantee future results.'
      },
      
      risk_level: {
        title: 'Risk Assessment',
        content: 'Risk levels help you understand potential volatility and loss scenarios.',
        placement: 'bottom',
        trigger: 'hover',
        riskLevels: {
          low: 'Minimal chance of loss, stable returns (0-5% volatility)',
          medium: 'Moderate volatility, balanced growth (5-15% volatility)',
          high: 'Higher volatility, potential for significant gains/losses (15%+ volatility)'
        }
      },
      
      liquidity_score: {
        title: 'Liquidity Score',
        content: 'Indicates how easily you can convert this asset to cash without significant price impact.',
        placement: 'top',
        scale: {
          90-100: 'Excellent - Can be sold instantly with minimal impact',
          80-89: 'Good - Quick sale possible with small price impact',
          70-79: 'Fair - May take some time or have moderate price impact',
          'below-70': 'Poor - Limited liquidity, significant delays or price impact'
        }
      },
      
      strategy_rebalancing: {
        title: 'Auto Rebalancing',
        content: 'Automatically adjusts your portfolio allocation to maintain target percentages.',
        placement: 'right',
        trigger: 'click',
        interactive: true,
        benefits: [
          'Maintains desired risk level',
          'Takes emotion out of investing',
          'Systematic profit-taking',
          'Disciplined loss management'
        ],
        frequency: 'Typically occurs when allocation drifts 5% from target'
      },
      
      gas_optimization: {
        title: 'Gas Optimization',
        content: 'Smart contract techniques to reduce transaction costs on the blockchain.',
        placement: 'top',
        methods: [
          'Batch transactions together',
          'Choose optimal transaction timing',
          'Use Layer 2 solutions when available',
          'Optimize contract interactions'
        ]
      },
      
      impermanent_loss: {
        title: 'Impermanent Loss',
        content: 'Temporary loss of value when providing liquidity to automated market makers compared to holding assets directly.',
        placement: 'bottom',
        trigger: 'click',
        interactive: true,
        severity: 'warning',
        explanation: 'Occurs when the relative price of paired assets changes. Loss becomes permanent only if you withdraw liquidity.',
        mitigation: [
          'Choose stable pairs (e.g., USDC/USDT)',
          'Monitor price correlations',
          'Consider impermanent loss insurance',
          'Understand the risks before providing liquidity'
        ]
      }
    }
  }

  /**
   * Get loading state configurations
   * In production, this would come from UX design systems
   */
  async getLoadingStateConfigurations() {
    await this.simulateNetworkDelay(150, 300)
    
    return {
      skeletons: {
        transaction_card: {
          elements: [
            { type: 'avatar', size: 'medium', position: 'left' },
            { type: 'text', width: '40%', height: '16px' },
            { type: 'text', width: '25%', height: '14px', marginTop: '4px' },
            { type: 'text', width: '15%', height: '18px', position: 'right', bold: true }
          ],
          animation: 'pulse',
          duration: 1500
        },
        
        portfolio_chart: {
          elements: [
            { type: 'rectangle', width: '100%', height: '200px', borderRadius: '8px' },
            { type: 'text', width: '30%', height: '16px', marginTop: '16px' },
            { type: 'text', width: '50%', height: '14px', marginTop: '8px' }
          ],
          animation: 'shimmer',
          duration: 2000
        },
        
        asset_list: {
          elements: Array.from({ length: 5 }, () => ({
            type: 'row',
            children: [
              { type: 'avatar', size: 'small' },
              { type: 'text', width: '25%', height: '16px' },
              { type: 'text', width: '15%', height: '14px' },
              { type: 'text', width: '20%', height: '16px', position: 'right' }
            ]
          })),
          animation: 'wave',
          stagger: 100
        }
      },
      
      spinners: {
        transaction_processing: {
          type: 'dots',
          size: 'large',
          color: '#10B981',
          speed: 'medium'
        },
        
        data_loading: {
          type: 'circular',
          size: 'medium',
          color: '#6B7280',
          speed: 'fast'
        },
        
        page_loading: {
          type: 'bars',
          size: 'small',
          color: '#3B82F6',
          speed: 'slow'
        }
      },
      
      progressBars: {
        transaction_steps: {
          type: 'stepped',
          steps: [
            'Validating',
            'Processing',
            'Confirming',
            'Complete'
          ],
          colors: {
            active: '#10B981',
            pending: '#D1D5DB',
            complete: '#059669'
          },
          showLabels: true,
          showPercentage: false
        },
        
        upload_progress: {
          type: 'linear',
          showPercentage: true,
          showFileSize: true,
          colors: {
            background: '#F3F4F6',
            progress: '#3B82F6'
          },
          animation: 'smooth'
        }
      },
      
      emptyStates: {
        no_transactions: {
          icon: 'inbox',
          title: 'No transactions yet',
          description: 'Your transaction history will appear here once you make your first transaction.',
          action: {
            label: 'Make your first transaction',
            variant: 'primary',
            action: 'add_funds'
          }
        },
        
        no_portfolio: {
          icon: 'pie_chart',
          title: 'Build your portfolio',
          description: 'Start investing by adding funds and creating your first strategy.',
          actions: [
            {
              label: 'Add Funds',
              variant: 'primary',
              action: 'add_funds'
            },
            {
              label: 'Explore Strategies',
              variant: 'secondary',
              action: 'view_strategies'
            }
          ]
        },
        
        search_no_results: {
          icon: 'search',
          title: 'No results found',
          description: 'Try adjusting your search terms or filters.',
          action: {
            label: 'Clear filters',
            variant: 'ghost',
            action: 'clear_search'
          }
        }
      }
    }
  }

  /**
   * Helper methods
   */
  
  formatCurrencyLabel(amount, currency = 'USD') {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
    return formatter.format(amount)
  }

  getExchangeRate(currency) {
    const rates = {
      EUR: 0.85,
      GBP: 0.73,
      CAD: 1.25,
      AUD: 1.35,
      JPY: 110,
      CHF: 0.91
    }
    return rates[currency] || 1
  }

  getMaxAmount(transactionType, userContext) {
    const maxAmounts = {
      deposit: userContext.kycLevel === 'enhanced' ? 100000 : 5000,
      withdraw: userContext.availableBalance || 10000,
      trade: 50000,
      transfer: 25000,
      strategy_funding: 100000
    }
    return maxAmounts[transactionType] || 10000
  }

  getMinAmount(transactionType, userContext) {
    const minAmounts = {
      deposit: 1,
      withdraw: 1,
      trade: 0.01,
      transfer: 0.01,
      strategy_funding: 10
    }
    return minAmounts[transactionType] || 1
  }

  /**
   * Get all UI configuration data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllUIConfigurationData(context = {}) {
    // In production, this would be a single API call or parallel calls
    const [amounts, forms, buttons, tooltips, loadingStates] = await Promise.all([
      this.getQuickAmountConfigurations(context.transactionType, context.user),
      this.getFormFieldConfigurations(context.formType),
      this.getButtonConfigurations(context.component),
      this.getTooltipConfigurations(context.component),
      this.getLoadingStateConfigurations()
    ])

    const allUIConfigData = {
      amounts,
      forms,
      buttons,
      tooltips,
      loadingStates,
      timestamp: Date.now()
    }

    return allUIConfigData
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 150, maxMs = 500) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates UI configuration provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 200)
      
      // Simulate occasional UI config service outages (0.5% chance)
      if (Math.random() < 0.005) {
        throw new Error('Mockup UI configuration provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 200 + 100, // 100-300ms
        configurationTypes: ['amounts', 'forms', 'buttons', 'tooltips', 'loadingStates'],
        supportedContexts: ['transaction', 'profile', 'kyc', 'trading', 'portfolio'],
        a11yCompliant: true,
        responsiveDesign: true,
        themingSupport: true,
        localizationReady: true,
        lastConfigUpdate: Date.now() - Math.random() * 3600000 // Within last hour
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
export const mockupUIConfigurationProviderService = new MockupUIConfigurationProviderService()

// Export class for testing
export default MockupUIConfigurationProviderService