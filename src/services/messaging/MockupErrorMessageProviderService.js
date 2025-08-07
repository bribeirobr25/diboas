/**
 * Mockup Error Message Provider Service
 * Simulates 3rd party messaging/localization APIs with realistic response times
 * This will be replaced with real messaging provider integrations (i18n services, etc.)
 */

import logger from '../../utils/logger.js'

export class MockupErrorMessageProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get error messages for different categories
   * In production, this would come from localization services or CMS
   */
  async getErrorMessages(language = 'en', category = 'all') {
    await this.simulateNetworkDelay(200, 500)
    
    const messages = {
      authentication: {
        invalid_credentials: {
          title: 'Authentication Failed',
          message: 'Invalid email or password. Please check your credentials and try again.',
          action: 'Try Again',
          severity: 'error',
          code: 'AUTH_001'
        },
        session_expired: {
          title: 'Session Expired',
          message: 'Your session has expired for security reasons. Please log in again.',
          action: 'Log In',
          severity: 'warning',
          code: 'AUTH_002'
        },
        account_locked: {
          title: 'Account Temporarily Locked',
          message: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.',
          action: 'Contact Support',
          severity: 'error',
          code: 'AUTH_003'
        },
        two_factor_required: {
          title: '2FA Required',
          message: 'Two-factor authentication is required for this account. Please enter your verification code.',
          action: 'Enter Code',
          severity: 'info',
          code: 'AUTH_004'
        },
        invalid_token: {
          title: 'Invalid Token',
          message: 'The authentication token is invalid or has expired. Please log in again.',
          action: 'Log In',
          severity: 'error',
          code: 'AUTH_005'
        },
        insufficient_permissions: {
          title: 'Access Denied',
          message: 'You do not have permission to access this resource.',
          action: 'Contact Support',
          severity: 'error',
          code: 'AUTH_006'
        }
      },
      
      transactions: {
        insufficient_balance: {
          title: 'Insufficient Balance',
          message: 'You do not have enough funds to complete this transaction. Please add funds or reduce the amount.',
          action: 'Add Funds',
          severity: 'error',
          code: 'TXN_001'
        },
        transaction_failed: {
          title: 'Transaction Failed',
          message: 'The transaction could not be completed. Please try again or contact support if the problem persists.',
          action: 'Retry',
          severity: 'error',
          code: 'TXN_002'
        },
        network_congestion: {
          title: 'Network Congestion',
          message: 'The blockchain network is currently congested. Your transaction may take longer than usual to process.',
          action: 'Wait',
          severity: 'warning',
          code: 'TXN_003'
        },
        invalid_amount: {
          title: 'Invalid Amount',
          message: 'Please enter a valid transaction amount. The amount must be greater than zero and within your limits.',
          action: 'Correct Amount',
          severity: 'error',
          code: 'TXN_004'
        },
        daily_limit_exceeded: {
          title: 'Daily Limit Exceeded',
          message: 'This transaction would exceed your daily transaction limit. Please try a smaller amount or wait until tomorrow.',
          action: 'Reduce Amount',
          severity: 'error',
          code: 'TXN_005'
        },
        kyc_verification_required: {
          title: 'Verification Required',
          message: 'To complete this transaction, please complete your identity verification.',
          action: 'Verify Identity',
          severity: 'warning',
          code: 'TXN_006'
        }
      },
      
      payment: {
        card_declined: {
          title: 'Card Declined',
          message: 'Your payment card was declined. Please check your card details or try a different payment method.',
          action: 'Try Different Card',
          severity: 'error',
          code: 'PAY_001'
        },
        payment_processing_failed: {
          title: 'Payment Processing Failed',
          message: 'There was an error processing your payment. Please try again or contact your bank.',
          action: 'Retry Payment',
          severity: 'error',
          code: 'PAY_002'
        },
        payment_method_not_supported: {
          title: 'Payment Method Not Supported',
          message: 'The selected payment method is not supported in your region.',
          action: 'Choose Different Method',
          severity: 'error',
          code: 'PAY_003'
        },
        bank_connection_failed: {
          title: 'Bank Connection Failed',
          message: 'Unable to connect to your bank. Please check your bank account details and try again.',
          action: 'Check Details',
          severity: 'error',
          code: 'PAY_004'
        },
        payment_timeout: {
          title: 'Payment Timeout',
          message: 'The payment request timed out. Please try again.',
          action: 'Retry',
          severity: 'warning',
          code: 'PAY_005'
        }
      },
      
      system: {
        service_unavailable: {
          title: 'Service Temporarily Unavailable',
          message: 'Our services are temporarily unavailable. We are working to resolve this issue. Please try again shortly.',
          action: 'Try Again Later',
          severity: 'error',
          code: 'SYS_001'
        },
        maintenance_mode: {
          title: 'Scheduled Maintenance',
          message: 'We are currently performing scheduled maintenance. Service will be restored shortly.',
          action: 'Check Status',
          severity: 'info',
          code: 'SYS_002'
        },
        rate_limit_exceeded: {
          title: 'Too Many Requests',
          message: 'You have made too many requests. Please wait a moment before trying again.',
          action: 'Wait and Retry',
          severity: 'warning',
          code: 'SYS_003'
        },
        internal_error: {
          title: 'Internal Error',
          message: 'An unexpected error occurred. Our team has been notified and is working on a fix.',
          action: 'Contact Support',
          severity: 'error',
          code: 'SYS_004'
        },
        connection_lost: {
          title: 'Connection Lost',
          message: 'Connection to our servers was lost. Please check your internet connection and try again.',
          action: 'Reconnect',
          severity: 'warning',
          code: 'SYS_005'
        }
      },
      
      validation: {
        invalid_email: {
          title: 'Invalid Email',
          message: 'Please enter a valid email address.',
          action: 'Correct Email',
          severity: 'error',
          code: 'VAL_001'
        },
        password_too_weak: {
          title: 'Weak Password',
          message: 'Your password must be at least 8 characters long and include letters, numbers, and special characters.',
          action: 'Strengthen Password',
          severity: 'error',
          code: 'VAL_002'
        },
        required_field_empty: {
          title: 'Required Field Empty',
          message: 'Please fill in all required fields.',
          action: 'Complete Form',
          severity: 'error',
          code: 'VAL_003'
        },
        invalid_wallet_address: {
          title: 'Invalid Wallet Address',
          message: 'The wallet address you entered is not valid. Please check the address and try again.',
          action: 'Verify Address',
          severity: 'error',
          code: 'VAL_004'
        },
        file_too_large: {
          title: 'File Too Large',
          message: 'The selected file is too large. Please choose a file smaller than 10MB.',
          action: 'Choose Smaller File',
          severity: 'error',
          code: 'VAL_005'
        }
      }
    }

    if (category === 'all') {
      return messages
    } else {
      return messages[category] || {}
    }
  }

  /**
   * Get success messages for positive user feedback
   * In production, this would come from messaging services
   */
  async getSuccessMessages(language = 'en', category = 'all') {
    await this.simulateNetworkDelay(150, 400)
    
    const successMessages = {
      transactions: {
        transaction_success: {
          title: 'Transaction Successful',
          message: 'Your transaction has been completed successfully.',
          icon: '✅',
          autoHide: true,
          hideDelay: 5000
        },
        deposit_success: {
          title: 'Deposit Successful',
          message: 'Your funds have been successfully deposited to your account.',
          icon: '💰',
          autoHide: true,
          hideDelay: 5000
        },
        withdrawal_success: {
          title: 'Withdrawal Successful',
          message: 'Your withdrawal has been processed and funds are on their way.',
          icon: '📤',
          autoHide: true,
          hideDelay: 5000
        }
      },
      
      authentication: {
        login_success: {
          title: 'Welcome Back',
          message: 'You have successfully logged in.',
          icon: '👋',
          autoHide: true,
          hideDelay: 3000
        },
        registration_success: {
          title: 'Account Created',
          message: 'Your account has been created successfully. Welcome to diBoaS!',
          icon: '🎉',
          autoHide: false,
          hideDelay: null
        },
        password_reset_success: {
          title: 'Password Reset',
          message: 'Your password has been reset successfully.',
          icon: '🔒',
          autoHide: true,
          hideDelay: 5000
        }
      },
      
      strategies: {
        strategy_created: {
          title: 'Strategy Created',
          message: 'Your investment strategy has been created and is now active.',
          icon: '🚀',
          autoHide: true,
          hideDelay: 5000
        },
        strategy_paused: {
          title: 'Strategy Paused',
          message: 'Your investment strategy has been paused successfully.',
          icon: '⏸️',
          autoHide: true,
          hideDelay: 3000
        },
        goal_reached: {
          title: 'Goal Achieved!',
          message: 'Congratulations! You have reached your investment goal.',
          icon: '🎯',
          autoHide: false,
          hideDelay: null
        }
      }
    }

    if (category === 'all') {
      return successMessages
    } else {
      return successMessages[category] || {}
    }
  }

  /**
   * Get notification templates
   * In production, this would come from notification management services
   */
  async getNotificationTemplates(language = 'en') {
    await this.simulateNetworkDelay(300, 700)
    
    return {
      email: {
        transaction_confirmation: {
          subject: 'Transaction Confirmation - {{transactionType}} {{amount}}',
          template: `
            <h2>Transaction Confirmation</h2>
            <p>Your {{transactionType}} transaction has been completed successfully.</p>
            <ul>
              <li>Amount: {{amount}}</li>
              <li>Transaction ID: {{transactionId}}</li>
              <li>Date: {{date}}</li>
              <li>Status: {{status}}</li>
            </ul>
            <p>Thank you for using diBoaS!</p>
          `
        },
        security_alert: {
          subject: 'Security Alert - Login from New Device',
          template: `
            <h2>Security Alert</h2>
            <p>We detected a login to your account from a new device:</p>
            <ul>
              <li>Device: {{device}}</li>
              <li>Location: {{location}}</li>
              <li>Time: {{timestamp}}</li>
            </ul>
            <p>If this wasn't you, please secure your account immediately.</p>
          `
        },
        strategy_update: {
          subject: 'Investment Strategy Update - {{strategyName}}',
          template: `
            <h2>Strategy Performance Update</h2>
            <p>Your investment strategy "{{strategyName}}" has been updated:</p>
            <ul>
              <li>Current Value: {{currentValue}}</li>
              <li>Total Return: {{totalReturn}}%</li>
              <li>This Period: {{periodReturn}}%</li>
            </ul>
            <p>View detailed performance in your dashboard.</p>
          `
        }
      },
      
      push: {
        transaction_complete: {
          title: 'Transaction Complete',
          body: 'Your {{transactionType}} of {{amount}} has been processed successfully.',
          icon: 'transaction',
          actions: ['View Details', 'Dismiss']
        },
        price_alert: {
          title: 'Price Alert',
          body: '{{asset}} has {{direction}} to {{price}} ({{change}}%)',
          icon: 'price-alert',
          actions: ['View Chart', 'Trade Now']
        },
        goal_milestone: {
          title: 'Goal Milestone Reached!',
          body: 'You\'re {{percentage}}% closer to your {{goalName}} goal. Keep it up!',
          icon: 'milestone',
          actions: ['View Progress', 'Add Funds']
        }
      },
      
      inApp: {
        welcome: {
          title: 'Welcome to diBoaS!',
          message: 'Start your investment journey by creating your first strategy.',
          type: 'onboarding',
          priority: 'high',
          dismissible: true
        },
        feature_announcement: {
          title: 'New Feature Available',
          message: 'Check out our new {{featureName}} feature to enhance your investing experience.',
          type: 'feature',
          priority: 'medium',
          dismissible: true
        },
        maintenance_notice: {
          title: 'Scheduled Maintenance',
          message: 'We\'ll be performing maintenance on {{date}} from {{startTime}} to {{endTime}}.',
          type: 'maintenance',
          priority: 'high',
          dismissible: false
        }
      }
    }
  }

  /**
   * Get localized messages for different languages
   */
  async getLocalizedMessages(language = 'en') {
    await this.simulateNetworkDelay(250, 600)
    
    const translations = {
      en: {
        common: {
          loading: 'Loading...',
          error: 'Error',
          success: 'Success',
          warning: 'Warning',
          info: 'Information',
          cancel: 'Cancel',
          confirm: 'Confirm',
          retry: 'Retry',
          close: 'Close'
        },
        actions: {
          add_funds: 'Add Funds',
          withdraw_funds: 'Withdraw Funds',
          buy_crypto: 'Buy Crypto',
          sell_crypto: 'Sell Crypto',
          send_crypto: 'Send Crypto',
          view_details: 'View Details',
          contact_support: 'Contact Support'
        },
        navigation: {
          dashboard: 'Dashboard',
          transactions: 'Transactions',
          portfolio: 'Portfolio',
          strategies: 'Strategies',
          settings: 'Settings',
          help: 'Help'
        }
      },
      es: {
        common: {
          loading: 'Cargando...',
          error: 'Error',
          success: 'Éxito',
          warning: 'Advertencia',
          info: 'Información',
          cancel: 'Cancelar',
          confirm: 'Confirmar',
          retry: 'Reintentar',
          close: 'Cerrar'
        },
        actions: {
          add_funds: 'Agregar Fondos',
          withdraw_funds: 'Retirar Fondos',
          buy_crypto: 'Comprar Crypto',
          sell_crypto: 'Vender Crypto',
          send_crypto: 'Enviar Crypto',
          view_details: 'Ver Detalles',
          contact_support: 'Contactar Soporte'
        },
        navigation: {
          dashboard: 'Panel',
          transactions: 'Transacciones',
          portfolio: 'Cartera',
          strategies: 'Estrategias',
          settings: 'Configuración',
          help: 'Ayuda'
        }
      }
    }

    return translations[language] || translations.en
  }

  /**
   * Format error message with context
   */
  async formatErrorMessage(errorCode, context = {}, language = 'en') {
    await this.simulateNetworkDelay(100, 300)
    
    const allMessages = await this.getErrorMessages(language)
    
    // Find the error message across all categories
    let errorMessage = null
    for (const category of Object.values(allMessages)) {
      for (const [code, message] of Object.entries(category)) {
        if (message.code === errorCode) {
          errorMessage = message
          break
        }
      }
      if (errorMessage) break
    }
    
    if (!errorMessage) {
      return {
        title: 'Unknown Error',
        message: 'An unexpected error occurred. Please try again or contact support.',
        action: 'Contact Support',
        severity: 'error',
        code: errorCode
      }
    }
    
    // Replace placeholders with context values
    let formattedMessage = errorMessage.message
    let formattedTitle = errorMessage.title
    
    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{{${key}}}`
      formattedMessage = formattedMessage.replace(new RegExp(placeholder, 'g'), value)
      formattedTitle = formattedTitle.replace(new RegExp(placeholder, 'g'), value)
    }
    
    return {
      ...errorMessage,
      title: formattedTitle,
      message: formattedMessage
    }
  }

  /**
   * Get all messaging data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllMessagingData(language = 'en') {
    // In production, this would be a single API call or parallel calls
    const [errorMessages, successMessages, notifications, localizations] = await Promise.all([
      this.getErrorMessages(language),
      this.getSuccessMessages(language),
      this.getNotificationTemplates(language),
      this.getLocalizedMessages(language)
    ])

    const allMessagingData = {
      errors: errorMessages,
      success: successMessages,
      notifications,
      localizations,
      timestamp: Date.now()
    }

    return allMessagingData
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 150, maxMs = 600) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates messaging provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 200)
      
      // Simulate occasional messaging service outages (1% chance)
      if (Math.random() < 0.01) {
        throw new Error('Mockup error message provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 300 + 100, // 100-400ms
        supportedLanguages: ['en', 'es', 'fr', 'de', 'pt', 'zh'],
        messageCount: 157, // Total number of messages
        lastUpdate: Date.now() - Math.random() * 86400000 // Within last 24 hours
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
export const mockupErrorMessageProviderService = new MockupErrorMessageProviderService()

// Export class for testing
export default MockupErrorMessageProviderService