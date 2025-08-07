/**
 * Mockup Localization Provider Service
 * Simulates 3rd party localization management APIs with realistic response times
 * This will be replaced with real i18n service integrations (Lokalise, Crowdin, etc.)
 */

import logger from '../../utils/logger.js'

export class MockupLocalizationProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get localized strings for the application
   * In production, this would come from i18n management platforms
   */
  async getLocalizedStrings(locale = 'en', namespace = 'common') {
    await this.simulateNetworkDelay(200, 600)
    
    const translations = {
      en: {
        common: {
          // Navigation
          'nav.dashboard': 'Dashboard',
          'nav.portfolio': 'Portfolio',
          'nav.transactions': 'Transactions',
          'nav.strategies': 'Strategies',
          'nav.settings': 'Settings',
          'nav.help': 'Help',
          'nav.logout': 'Logout',
          
          // Actions
          'action.save': 'Save',
          'action.cancel': 'Cancel',
          'action.continue': 'Continue',
          'action.back': 'Back',
          'action.next': 'Next',
          'action.finish': 'Finish',
          'action.edit': 'Edit',
          'action.delete': 'Delete',
          'action.confirm': 'Confirm',
          'action.retry': 'Retry',
          'action.refresh': 'Refresh',
          
          // Status
          'status.loading': 'Loading...',
          'status.processing': 'Processing...',
          'status.success': 'Success',
          'status.error': 'Error',
          'status.warning': 'Warning',
          'status.pending': 'Pending',
          'status.completed': 'Completed',
          'status.failed': 'Failed',
          
          // Common phrases
          'common.yes': 'Yes',
          'common.no': 'No',
          'common.ok': 'OK',
          'common.close': 'Close',
          'common.search': 'Search',
          'common.filter': 'Filter',
          'common.sort': 'Sort',
          'common.export': 'Export',
          'common.import': 'Import',
          'common.download': 'Download',
          'common.upload': 'Upload',
          'common.share': 'Share',
          'common.copy': 'Copy',
          'common.paste': 'Paste'
        },
        
        transactions: {
          // Transaction types
          'type.deposit': 'Deposit',
          'type.withdraw': 'Withdraw',
          'type.buy': 'Buy',
          'type.sell': 'Sell',
          'type.transfer': 'Transfer',
          'type.swap': 'Swap',
          'type.stake': 'Stake',
          'type.unstake': 'Unstake',
          
          // Transaction status
          'status.pending': 'Pending',
          'status.confirmed': 'Confirmed',
          'status.failed': 'Failed',
          'status.cancelled': 'Cancelled',
          'status.processing': 'Processing',
          
          // Forms
          'form.amount': 'Amount',
          'form.recipient': 'Recipient',
          'form.memo': 'Memo',
          'form.network': 'Network',
          'form.fee': 'Fee',
          'form.total': 'Total',
          
          // Messages
          'message.insufficient_balance': 'Insufficient balance',
          'message.invalid_address': 'Invalid wallet address',
          'message.transaction_submitted': 'Transaction submitted successfully',
          'message.transaction_failed': 'Transaction failed',
          'message.confirm_transaction': 'Please confirm this transaction',
          
          // Fees
          'fee.network': 'Network Fee',
          'fee.service': 'Service Fee',
          'fee.total': 'Total Fees',
          'fee.estimated': 'Estimated Fee'
        },
        
        portfolio: {
          // Headers
          'header.balance': 'Portfolio Balance',
          'header.assets': 'Assets',
          'header.performance': 'Performance',
          'header.allocation': 'Allocation',
          
          // Performance
          'performance.today': 'Today',
          'performance.week': '7 Days',
          'performance.month': '30 Days',
          'performance.year': '1 Year',
          'performance.all_time': 'All Time',
          'performance.gain_loss': 'Gain/Loss',
          'performance.return': 'Return',
          
          // Asset details
          'asset.price': 'Price',
          'asset.change': 'Change',
          'asset.volume': 'Volume',
          'asset.market_cap': 'Market Cap',
          'asset.balance': 'Balance',
          'asset.value': 'Value'
        },
        
        strategies: {
          // Strategy types
          'type.conservative': 'Conservative',
          'type.moderate': 'Moderate',
          'type.aggressive': 'Aggressive',
          'type.custom': 'Custom',
          
          // Strategy status
          'status.active': 'Active',
          'status.paused': 'Paused',
          'status.draft': 'Draft',
          'status.archived': 'Archived',
          
          // Strategy management
          'action.create_strategy': 'Create Strategy',
          'action.edit_strategy': 'Edit Strategy',
          'action.pause_strategy': 'Pause Strategy',
          'action.resume_strategy': 'Resume Strategy',
          'action.archive_strategy': 'Archive Strategy',
          
          // Performance metrics
          'metric.apy': 'APY',
          'metric.risk_score': 'Risk Score',
          'metric.sharpe_ratio': 'Sharpe Ratio',
          'metric.max_drawdown': 'Max Drawdown',
          'metric.volatility': 'Volatility'
        }
      },
      
      es: {
        common: {
          // Navigation
          'nav.dashboard': 'Panel',
          'nav.portfolio': 'Portafolio',
          'nav.transactions': 'Transacciones',
          'nav.strategies': 'Estrategias',
          'nav.settings': 'Configuración',
          'nav.help': 'Ayuda',
          'nav.logout': 'Cerrar Sesión',
          
          // Actions
          'action.save': 'Guardar',
          'action.cancel': 'Cancelar',
          'action.continue': 'Continuar',
          'action.back': 'Atrás',
          'action.next': 'Siguiente',
          'action.finish': 'Finalizar',
          'action.edit': 'Editar',
          'action.delete': 'Eliminar',
          'action.confirm': 'Confirmar',
          'action.retry': 'Reintentar',
          'action.refresh': 'Actualizar',
          
          // Status
          'status.loading': 'Cargando...',
          'status.processing': 'Procesando...',
          'status.success': 'Éxito',
          'status.error': 'Error',
          'status.warning': 'Advertencia',
          'status.pending': 'Pendiente',
          'status.completed': 'Completado',
          'status.failed': 'Fallido'
        },
        
        transactions: {
          // Transaction types
          'type.deposit': 'Depósito',
          'type.withdraw': 'Retirar',
          'type.buy': 'Comprar',
          'type.sell': 'Vender',
          'type.transfer': 'Transferir',
          'type.swap': 'Intercambiar',
          'type.stake': 'Apostar',
          'type.unstake': 'Desapostar',
          
          // Forms
          'form.amount': 'Cantidad',
          'form.recipient': 'Destinatario',
          'form.memo': 'Memo',
          'form.network': 'Red',
          'form.fee': 'Comisión',
          'form.total': 'Total'
        }
      },
      
      fr: {
        common: {
          // Navigation
          'nav.dashboard': 'Tableau de bord',
          'nav.portfolio': 'Portefeuille',
          'nav.transactions': 'Transactions',
          'nav.strategies': 'Stratégies',
          'nav.settings': 'Paramètres',
          'nav.help': 'Aide',
          'nav.logout': 'Se déconnecter',
          
          // Actions
          'action.save': 'Enregistrer',
          'action.cancel': 'Annuler',
          'action.continue': 'Continuer',
          'action.back': 'Retour',
          'action.next': 'Suivant',
          'action.finish': 'Terminer',
          'action.edit': 'Modifier',
          'action.delete': 'Supprimer',
          'action.confirm': 'Confirmer',
          'action.retry': 'Réessayer',
          'action.refresh': 'Actualiser'
        }
      },
      
      de: {
        common: {
          // Navigation
          'nav.dashboard': 'Dashboard',
          'nav.portfolio': 'Portfolio',
          'nav.transactions': 'Transaktionen',
          'nav.strategies': 'Strategien',
          'nav.settings': 'Einstellungen',
          'nav.help': 'Hilfe',
          'nav.logout': 'Abmelden',
          
          // Actions
          'action.save': 'Speichern',
          'action.cancel': 'Abbrechen',
          'action.continue': 'Fortfahren',
          'action.back': 'Zurück',
          'action.next': 'Weiter',
          'action.finish': 'Fertigstellen'
        }
      },
      
      ja: {
        common: {
          // Navigation
          'nav.dashboard': 'ダッシュボード',
          'nav.portfolio': 'ポートフォリオ',
          'nav.transactions': '取引',
          'nav.strategies': '戦略',
          'nav.settings': '設定',
          'nav.help': 'ヘルプ',
          'nav.logout': 'ログアウト',
          
          // Actions
          'action.save': '保存',
          'action.cancel': 'キャンセル',
          'action.continue': '続行',
          'action.back': '戻る',
          'action.next': '次へ',
          'action.finish': '完了'
        }
      }
    }
    
    const localeData = translations[locale] || translations['en']
    const namespaceData = localeData[namespace] || localeData['common'] || {}
    
    return {
      locale,
      namespace,
      translations: namespaceData,
      totalKeys: Object.keys(namespaceData).length,
      completionPercentage: this.calculateTranslationCompleteness(locale, namespace),
      lastUpdated: Date.now() - Math.random() * 3600000, // Within last hour
      version: this.generateVersion()
    }
  }

  /**
   * Get available locales and their metadata
   * In production, this would come from locale management systems
   */
  async getAvailableLocales() {
    await this.simulateNetworkDelay(150, 400)
    
    return {
      locales: [
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
          region: 'US',
          rtl: false,
          enabled: true,
          completeness: 100,
          translators: 15,
          lastUpdate: Date.now() - Math.random() * 86400000, // Within last day
          flag: '🇺🇸'
        },
        {
          code: 'es',
          name: 'Spanish',
          nativeName: 'Español',
          region: 'ES',
          rtl: false,
          enabled: true,
          completeness: this.generatePercentage(85, 95),
          translators: 12,
          lastUpdate: Date.now() - Math.random() * 86400000,
          flag: '🇪🇸'
        },
        {
          code: 'fr',
          name: 'French',
          nativeName: 'Français',
          region: 'FR',
          rtl: false,
          enabled: true,
          completeness: this.generatePercentage(75, 90),
          translators: 8,
          lastUpdate: Date.now() - Math.random() * 172800000, // Within last 2 days
          flag: '🇫🇷'
        },
        {
          code: 'de',
          name: 'German',
          nativeName: 'Deutsch',
          region: 'DE',
          rtl: false,
          enabled: true,
          completeness: this.generatePercentage(70, 85),
          translators: 6,
          lastUpdate: Date.now() - Math.random() * 259200000, // Within last 3 days
          flag: '🇩🇪'
        },
        {
          code: 'ja',
          name: 'Japanese',
          nativeName: '日本語',
          region: 'JP',
          rtl: false,
          enabled: true,
          completeness: this.generatePercentage(60, 80),
          translators: 4,
          lastUpdate: Date.now() - Math.random() * 604800000, // Within last week
          flag: '🇯🇵'
        },
        {
          code: 'zh',
          name: 'Chinese',
          nativeName: '中文',
          region: 'CN',
          rtl: false,
          enabled: false,
          completeness: this.generatePercentage(30, 50),
          translators: 2,
          lastUpdate: Date.now() - Math.random() * 2592000000, // Within last month
          flag: '🇨🇳'
        },
        {
          code: 'ar',
          name: 'Arabic',
          nativeName: 'العربية',
          region: 'SA',
          rtl: true,
          enabled: false,
          completeness: this.generatePercentage(20, 40),
          translators: 1,
          lastUpdate: Date.now() - Math.random() * 5184000000, // Within last 2 months
          flag: '🇸🇦'
        }
      ],
      defaultLocale: 'en',
      fallbackLocale: 'en',
      totalKeys: this.generateNumber(2000, 3000),
      activeTranslators: 45,
      pendingTranslations: this.generateNumber(150, 300)
    }
  }

  /**
   * Get localization statistics and analytics
   * In production, this would come from translation management platforms
   */
  async getLocalizationAnalytics(timeframe = '30d') {
    await this.simulateNetworkDelay(300, 700)
    
    return {
      overview: {
        totalKeys: this.generateNumber(2800, 3200),
        translatedKeys: this.generateNumber(2400, 2800),
        pendingKeys: this.generateNumber(200, 400),
        obsoleteKeys: this.generateNumber(50, 150),
        translationRate: this.generatePercentage(85, 95)
      },
      
      localeBreakdown: [
        {
          locale: 'en',
          completeness: 100,
          totalKeys: this.generateNumber(2800, 3200),
          translatedKeys: this.generateNumber(2800, 3200),
          pendingKeys: 0,
          lastActivity: Date.now() - Math.random() * 86400000
        },
        {
          locale: 'es',
          completeness: this.generatePercentage(85, 95),
          totalKeys: this.generateNumber(2800, 3200),
          translatedKeys: this.generateNumber(2400, 2700),
          pendingKeys: this.generateNumber(100, 300),
          lastActivity: Date.now() - Math.random() * 172800000
        },
        {
          locale: 'fr',
          completeness: this.generatePercentage(75, 90),
          totalKeys: this.generateNumber(2800, 3200),
          translatedKeys: this.generateNumber(2100, 2500),
          pendingKeys: this.generateNumber(300, 500),
          lastActivity: Date.now() - Math.random() * 259200000
        }
      ],
      
      translationActivity: {
        newTranslations: this.generateActivityData(timeframe),
        updatedTranslations: this.generateActivityData(timeframe),
        reviewedTranslations: this.generateActivityData(timeframe),
        approvedTranslations: this.generateActivityData(timeframe)
      },
      
      qualityMetrics: {
        averageTranslationScore: this.generatePercentage(85, 95),
        reviewCoverage: this.generatePercentage(70, 90),
        consistencyScore: this.generatePercentage(80, 95),
        contextAccuracy: this.generatePercentage(75, 90)
      },
      
      translatorPerformance: [
        {
          translatorId: 'translator_001',
          name: 'Maria Rodriguez',
          locale: 'es',
          translationsCount: this.generateNumber(150, 300),
          qualityScore: this.generatePercentage(90, 98),
          avgResponseTime: `${this.generateNumber(2, 8)} hours`
        },
        {
          translatorId: 'translator_002',
          name: 'Pierre Dubois',
          locale: 'fr',
          translationsCount: this.generateNumber(100, 250),
          qualityScore: this.generatePercentage(85, 95),
          avgResponseTime: `${this.generateNumber(4, 12)} hours`
        },
        {
          translatorId: 'translator_003',
          name: 'Hans Mueller',
          locale: 'de',
          translationsCount: this.generateNumber(80, 200),
          qualityScore: this.generatePercentage(88, 96),
          avgResponseTime: `${this.generateNumber(3, 10)} hours`
        }
      ]
    }
  }

  /**
   * Get dynamic label configurations
   * In production, this would come from content management systems
   */
  async getDynamicLabelConfigurations(context = 'app') {
    await this.simulateNetworkDelay(200, 500)
    
    const labelConfigurations = {
      app: {
        welcome: {
          type: 'dynamic',
          template: 'Welcome back, {userName}!',
          fallback: 'Welcome back!',
          personalization: true,
          contexts: ['dashboard_header', 'mobile_greeting'],
          supportedLocales: ['en', 'es', 'fr', 'de', 'ja']
        },
        
        balance_display: {
          type: 'formatted',
          template: 'Your balance: {amount}',
          formatting: {
            currency: true,
            precision: 2,
            thousandsSeparator: true
          },
          contexts: ['portfolio_summary', 'header_balance'],
          supportedLocales: ['en', 'es', 'fr', 'de', 'ja']
        },
        
        transaction_confirmation: {
          type: 'interactive',
          template: 'Confirm {transactionType} of {amount} to {recipient}',
          requiredParams: ['transactionType', 'amount', 'recipient'],
          validation: {
            transactionType: ['deposit', 'withdraw', 'transfer', 'buy', 'sell'],
            amount: 'currency',
            recipient: 'address'
          },
          contexts: ['transaction_modal', 'confirmation_screen'],
          supportedLocales: ['en', 'es', 'fr', 'de']
        },
        
        performance_summary: {
          type: 'conditional',
          templates: {
            positive: 'Great job! You\\'re up {percentage}% ({amount}) this {period}',
            negative: 'Your portfolio is down {percentage}% ({amount}) this {period}',
            neutral: 'Your portfolio is stable this {period}'
          },
          conditions: {
            positive: 'percentage > 0',
            negative: 'percentage < 0',
            neutral: 'percentage == 0'
          },
          contexts: ['dashboard_summary', 'portfolio_header'],
          supportedLocales: ['en', 'es', 'fr', 'de', 'ja']
        },
        
        strategy_recommendation: {
          type: 'personalized',
          template: 'Based on your {riskProfile} profile, we recommend {strategyName}',
          personalizationEngine: 'recommendation_ai',
          contexts: ['strategy_suggestions', 'onboarding_recommendations'],
          supportedLocales: ['en', 'es', 'fr'],
          aiGenerated: true
        }
      },
      
      marketing: {
        promotional_banner: {
          type: 'campaign',
          template: '{campaignTitle}: {discount}% off for {duration}',
          campaignTracking: true,
          abTesting: {
            enabled: true,
            variants: ['aggressive', 'conservative', 'informative']
          },
          contexts: ['app_banner', 'email_header', 'push_notification'],
          supportedLocales: ['en', 'es', 'fr', 'de']
        },
        
        feature_announcement: {
          type: 'versioned',
          template: 'New: {featureName} - {shortDescription}',
          version: '2.1.0',
          rolloutPercentage: this.generatePercentage(10, 100),
          contexts: ['in_app_notification', 'changelog'],
          supportedLocales: ['en', 'es', 'fr']
        }
      },
      
      support: {
        help_contextual: {
          type: 'contextual',
          template: 'Need help with {currentAction}? {helpText}',
          contextDetection: 'automatic',
          contexts: ['tooltip', 'help_sidebar', 'inline_help'],
          supportedLocales: ['en', 'es', 'fr', 'de', 'ja']
        },
        
        error_messages: {
          type: 'diagnostic',
          template: '{errorType}: {errorMessage}. {suggestedAction}',
          errorCategorization: true,
          contexts: ['error_modal', 'toast_notification', 'inline_error'],
          supportedLocales: ['en', 'es', 'fr', 'de'],
          severity: ['low', 'medium', 'high', 'critical']
        }
      }
    }
    
    const contextData = labelConfigurations[context] || labelConfigurations['app']
    
    return {
      context,
      labels: contextData,
      totalLabels: Object.keys(contextData).length,
      lastUpdated: Date.now() - Math.random() * 1800000, // Within last 30 minutes
      version: this.generateVersion(),
      cacheStrategy: 'realtime' // Per requirements - no caching
    }
  }

  /**
   * Get regional formatting configurations
   * In production, this would come from i18n formatting libraries
   */
  async getRegionalFormattingConfigurations() {
    await this.simulateNetworkDelay(150, 350)
    
    return {
      currencies: {
        USD: {
          symbol: '$',
          position: 'before',
          decimalSeparator: '.',
          thousandsSeparator: ',',
          decimalPlaces: 2,
          locales: ['en-US', 'en-CA']
        },
        EUR: {
          symbol: '€',
          position: 'after',
          decimalSeparator: ',',
          thousandsSeparator: '.',
          decimalPlaces: 2,
          locales: ['de-DE', 'fr-FR', 'es-ES']
        },
        GBP: {
          symbol: '£',
          position: 'before',
          decimalSeparator: '.',
          thousandsSeparator: ',',
          decimalPlaces: 2,
          locales: ['en-GB']
        },
        JPY: {
          symbol: '¥',
          position: 'before',
          decimalSeparator: '.',
          thousandsSeparator: ',',
          decimalPlaces: 0,
          locales: ['ja-JP']
        }
      },
      
      dateTime: {
        'en-US': {
          dateFormat: 'MM/DD/YYYY',
          timeFormat: 'h:mm A',
          dateTimeFormat: 'MM/DD/YYYY h:mm A',
          firstDayOfWeek: 0, // Sunday
          weekendDays: [0, 6] // Sunday, Saturday
        },
        'en-GB': {
          dateFormat: 'DD/MM/YYYY',
          timeFormat: 'HH:mm',
          dateTimeFormat: 'DD/MM/YYYY HH:mm',
          firstDayOfWeek: 1, // Monday
          weekendDays: [0, 6]
        },
        'de-DE': {
          dateFormat: 'DD.MM.YYYY',
          timeFormat: 'HH:mm',
          dateTimeFormat: 'DD.MM.YYYY HH:mm',
          firstDayOfWeek: 1,
          weekendDays: [0, 6]
        },
        'fr-FR': {
          dateFormat: 'DD/MM/YYYY',
          timeFormat: 'HH:mm',
          dateTimeFormat: 'DD/MM/YYYY HH:mm',
          firstDayOfWeek: 1,
          weekendDays: [0, 6]
        },
        'es-ES': {
          dateFormat: 'DD/MM/YYYY',
          timeFormat: 'HH:mm',
          dateTimeFormat: 'DD/MM/YYYY HH:mm',
          firstDayOfWeek: 1,
          weekendDays: [0, 6]
        },
        'ja-JP': {
          dateFormat: 'YYYY/MM/DD',
          timeFormat: 'HH:mm',
          dateTimeFormat: 'YYYY/MM/DD HH:mm',
          firstDayOfWeek: 0,
          weekendDays: [0, 6]
        }
      },
      
      numbers: {
        'en-US': {
          decimalSeparator: '.',
          thousandsSeparator: ',',
          grouping: [3]
        },
        'de-DE': {
          decimalSeparator: ',',
          thousandsSeparator: '.',
          grouping: [3]
        },
        'fr-FR': {
          decimalSeparator: ',',
          thousandsSeparator: ' ',
          grouping: [3]
        }
      },
      
      units: {
        'en-US': {
          temperature: 'fahrenheit',
          distance: 'miles',
          weight: 'pounds',
          volume: 'gallons'
        },
        'metric': {
          temperature: 'celsius',
          distance: 'kilometers',
          weight: 'kilograms',
          volume: 'liters'
        }
      }
    }
  }

  /**
   * Get pluralization rules for different locales
   * In production, this would come from Unicode CLDR data
   */
  async getPluralizationRules() {
    await this.simulateNetworkDelay(100, 250)
    
    return {
      rules: {
        en: {
          categories: ['one', 'other'],
          rule: function(n) {
            return n === 1 ? 'one' : 'other'
          },
          examples: {
            one: '1 item',
            other: '0 items, 2 items, 3 items'
          }
        },
        es: {
          categories: ['one', 'other'],
          rule: function(n) {
            return n === 1 ? 'one' : 'other'
          },
          examples: {
            one: '1 elemento',
            other: '0 elementos, 2 elementos, 3 elementos'
          }
        },
        fr: {
          categories: ['one', 'other'],
          rule: function(n) {
            return (n >= 0 && n < 2) ? 'one' : 'other'
          },
          examples: {
            one: '0 élément, 1 élément, 1.5 éléments',
            other: '2 éléments, 3 éléments'
          }
        },
        de: {
          categories: ['one', 'other'],
          rule: function(n) {
            return n === 1 ? 'one' : 'other'
          },
          examples: {
            one: '1 Element',
            other: '0 Elemente, 2 Elemente, 3 Elemente'
          }
        },
        ja: {
          categories: ['other'],
          rule: function(n) {
            return 'other'
          },
          examples: {
            other: '0個のアイテム, 1個のアイテム, 2個のアイテム'
          }
        }
      },
      
      templates: {
        transactions: {
          en: {
            one: 'You have {count} pending transaction',
            other: 'You have {count} pending transactions'
          },
          es: {
            one: 'Tienes {count} transacción pendiente',
            other: 'Tienes {count} transacciones pendientes'
          },
          fr: {
            one: 'Vous avez {count} transaction en attente',
            other: 'Vous avez {count} transactions en attente'
          }
        },
        
        assets: {
          en: {
            one: '{count} asset in your portfolio',
            other: '{count} assets in your portfolio'
          },
          es: {
            one: '{count} activo en tu portafolio',
            other: '{count} activos en tu portafolio'
          }
        }
      }
    }
  }

  /**
   * Helper methods for data generation
   */
  
  calculateTranslationCompleteness(locale, namespace) {
    if (locale === 'en') return 100
    
    const baseCompleteness = {
      es: 90,
      fr: 85,
      de: 80,
      ja: 70,
      zh: 45,
      ar: 30
    }
    
    const base = baseCompleteness[locale] || 50
    const variation = (Math.random() - 0.5) * 10 // ±5% variation
    
    return Math.max(0, Math.min(100, Math.round(base + variation)))
  }

  generateVersion() {
    const major = Math.floor(Math.random() * 3) + 1
    const minor = Math.floor(Math.random() * 10)
    const patch = Math.floor(Math.random() * 20)
    return `${major}.${minor}.${patch}`
  }

  generatePercentage(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 10) / 10
  }

  generateNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  generateActivityData(timeframe) {
    const baseCount = {
      '7d': this.generateNumber(50, 150),
      '30d': this.generateNumber(200, 500),
      '90d': this.generateNumber(600, 1200),
      '1y': this.generateNumber(2000, 5000)
    }
    
    return baseCount[timeframe] || this.generateNumber(100, 300)
  }

  /**
   * Get all localization data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllLocalizationData(locale = 'en', context = 'app') {
    // In production, this would be a single API call or parallel calls
    const [strings, locales, analytics, labels, formatting, pluralization] = await Promise.all([
      this.getLocalizedStrings(locale, 'common'),
      this.getAvailableLocales(),
      this.getLocalizationAnalytics(),
      this.getDynamicLabelConfigurations(context),
      this.getRegionalFormattingConfigurations(),
      this.getPluralizationRules()
    ])

    const allLocalizationData = {
      strings,
      locales,
      analytics,
      labels,
      formatting,
      pluralization,
      timestamp: Date.now()
    }

    return allLocalizationData
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 200, maxMs = 600) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates localization provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 200)
      
      // Simulate occasional i18n service outages (0.5% chance)
      if (Math.random() < 0.005) {
        throw new Error('Mockup localization provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 300 + 100, // 100-400ms
        supportedLocales: ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar'],
        enabledLocales: ['en', 'es', 'fr', 'de', 'ja'],
        totalTranslationKeys: this.generateNumber(2800, 3200),
        completionRate: this.generatePercentage(75, 95),
        activeTranslators: this.generateNumber(40, 60),
        translationProviders: ['Lokalise', 'Crowdin', 'Phrase', 'LingoHub'],
        lastTranslationUpdate: Date.now() - Math.random() * 3600000, // Within last hour
        realTimeSync: true
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
export const mockupLocalizationProviderService = new MockupLocalizationProviderService()

// Export class for testing
export default MockupLocalizationProviderService