/**
 * Mockup Error Content Provider Service
 * Simulates 3rd party error content management APIs with realistic response times
 * This will be replaced with real error content integrations (CMS, i18n services, etc.)
 */

import logger from '../../utils/logger.js'

export class MockupErrorContentProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get error page content templates
   * In production, this would come from CMS or content management systems
   */
  async getErrorPageContent(language = 'en') {
    await this.simulateNetworkDelay(200, 500)
    
    const content = {
      en: {
        '404': {
          title: 'Page Not Found',
          subtitle: 'Oops! The page you\'re looking for doesn\'t exist.',
          description: 'The page you\'re trying to access might have been moved, deleted, or you might have typed the wrong URL.',
          primaryAction: {
            text: 'Go to Dashboard',
            path: '/app'
          },
          secondaryAction: {
            text: 'Go Back',
            action: 'history_back'
          },
          suggestions: [
            'Check the URL for typos',
            'Use the navigation menu to find what you\'re looking for', 
            'Go back to the previous page and try again',
            'Contact support if you think this is an error'
          ],
          icon: 'navigation',
          illustration: 'lost_in_space',
          supportContact: 'support@diboas.com'
        },
        
        '500': {
          title: 'Server Error',
          subtitle: 'Something went wrong on our end.',
          description: 'We\'re experiencing technical difficulties. Our team has been notified and is working on a fix.',
          primaryAction: {
            text: 'Try Again',
            action: 'retry'
          },
          secondaryAction: {
            text: 'Go to Dashboard', 
            path: '/app'
          },
          suggestions: [
            'Wait a moment and try again',
            'Check if the issue persists on other pages',
            'Clear your browser cache if problems continue',
            'Contact support with the error ID if needed'
          ],
          icon: 'server',
          illustration: 'server_down',
          supportContact: 'support@diboas.com',
          statusPageUrl: 'https://status.diboas.com'
        },
        
        '403': {
          title: 'Access Denied',
          subtitle: 'You don\'t have permission to access this resource.',
          description: 'This page or feature requires special permissions that your account doesn\'t currently have.',
          primaryAction: {
            text: 'Go to Dashboard',
            path: '/app'
          },
          secondaryAction: {
            text: 'Contact Support',
            action: 'contact_support'
          },
          suggestions: [
            'Verify you\'re logged into the correct account',
            'Check if your account has the required permissions',
            'Contact your administrator if this is a business account',
            'Upgrade your account if this is a premium feature'
          ],
          icon: 'lock',
          illustration: 'access_denied',
          upgradeUrl: '/upgrade',
          supportContact: 'support@diboas.com'
        },
        
        '401': {
          title: 'Authentication Required',
          subtitle: 'Please log in to access this page.',
          description: 'Your session has expired or you need to log in to view this content.',
          primaryAction: {
            text: 'Log In',
            path: '/login'
          },
          secondaryAction: {
            text: 'Sign Up',
            path: '/signup'
          },
          suggestions: [
            'Log in with your existing account',
            'Create a new account if you don\'t have one',
            'Reset your password if you\'ve forgotten it',
            'Contact support if you\'re having trouble logging in'
          ],
          icon: 'user',
          illustration: 'login_required',
          resetPasswordUrl: '/reset-password',
          supportContact: 'support@diboas.com'
        },
        
        'network': {
          title: 'Connection Problem',
          subtitle: 'Unable to connect to our servers.',
          description: 'Please check your internet connection and try again.',
          primaryAction: {
            text: 'Check Connection',
            action: 'retry_connection'
          },
          secondaryAction: {
            text: 'Try Dashboard',
            path: '/app'
          },
          suggestions: [
            'Check your Wi-Fi or mobile data connection',
            'Try refreshing the page or restarting your browser',
            'Disable VPN or proxy if you\'re using one',
            'Check if other websites are working',
            'Contact your internet provider if the issue persists'
          ],
          icon: 'wifi_off',
          illustration: 'no_connection',
          networkStatusUrl: 'https://status.diboas.com',
          troubleshootingUrl: '/help/connection-issues'
        },
        
        'maintenance': {
          title: 'Scheduled Maintenance',
          subtitle: 'We\'ll be back shortly.',
          description: 'diBoaS is currently undergoing scheduled maintenance to improve your experience.',
          primaryAction: {
            text: 'Check Status',
            url: 'https://status.diboas.com',
            external: true
          },
          secondaryAction: {
            text: 'Get Updates',
            action: 'subscribe_updates'
          },
          suggestions: [
            'Follow our status page for real-time updates',
            'Subscribe to maintenance notifications',
            'Check our social media for announcements',
            'Contact support for urgent matters'
          ],
          icon: 'tool',
          illustration: 'under_construction',
          statusPageUrl: 'https://status.diboas.com',
          socialLinks: {
            twitter: 'https://twitter.com/diboas',
            discord: 'https://discord.gg/diboas'
          },
          estimatedDuration: null // Will be populated dynamically
        }
      }
    }
    
    // Simulate content variations based on user context
    const baseContent = content[language] || content['en']
    
    // Add dynamic timestamps and contextual information
    Object.keys(baseContent).forEach(errorType => {
      baseContent[errorType].timestamp = Date.now()
      baseContent[errorType].requestId = this.generateRequestId()
      baseContent[errorType].version = '2024.1'
      
      // Add contextual help based on error type
      if (errorType === 'maintenance') {
        baseContent[errorType].estimatedDuration = this.getMaintenanceEstimate()
      }
      
      if (errorType === '500') {
        baseContent[errorType].errorId = this.generateErrorId()
      }
    })
    
    return baseContent
  }

  /**
   * Get error message templates for different contexts
   * In production, this would come from i18n systems
   */
  async getErrorMessageTemplates(language = 'en') {
    await this.simulateNetworkDelay(150, 400)
    
    return {
      validation: {
        required: 'This field is required',
        email: 'Please enter a valid email address',
        password: {
          minLength: 'Password must be at least {minLength} characters',
          complexity: 'Password must contain uppercase, lowercase, numbers, and symbols',
          match: 'Passwords do not match'
        },
        phone: 'Please enter a valid phone number',
        currency: 'Please enter a valid amount',
        positiveNumber: 'Amount must be greater than zero',
        maxAmount: 'Amount cannot exceed {maxAmount}',
        minAmount: 'Amount must be at least {minAmount}'
      },
      
      authentication: {
        loginFailed: 'Invalid email or password. Please try again.',
        accountLocked: 'Account has been temporarily locked due to multiple failed attempts',
        sessionExpired: 'Your session has expired. Please log in again.',
        twoFactorRequired: 'Two-factor authentication code is required',
        twoFactorInvalid: 'Invalid two-factor authentication code',
        passwordResetRequired: 'Password reset is required for security',
        accountNotVerified: 'Please verify your email address before logging in',
        accountDisabled: 'Your account has been disabled. Contact support for assistance.',
        ipBlocked: 'Login from this location is not allowed'
      },
      
      transaction: {
        insufficientFunds: 'Insufficient funds to complete this transaction',
        amountTooLarge: 'Transaction amount exceeds daily limit of {dailyLimit}',
        amountTooSmall: 'Transaction amount is below minimum of {minAmount}',
        invalidAddress: 'Invalid wallet address. Please check and try again.',
        networkCongestion: 'Network is congested. Transaction may take longer than usual.',
        transactionFailed: 'Transaction failed. Your funds are safe and will be returned.',
        duplicateTransaction: 'A similar transaction was recently submitted',
        marketClosed: 'Market is currently closed for trading',
        assetUnavailable: 'This asset is temporarily unavailable for trading',
        feeEstimationFailed: 'Unable to estimate transaction fees. Please try again.'
      },
      
      portfolio: {
        strategyCreationFailed: 'Unable to create strategy. Please try again.',
        strategyNotFound: 'Strategy not found or has been deleted',
        rebalancingFailed: 'Portfolio rebalancing failed. Your funds are safe.',
        performanceDataUnavailable: 'Performance data is temporarily unavailable',
        assetAllocationError: 'Invalid asset allocation. Total must equal 100%',
        riskProfileMismatch: 'Selected assets don\'t match your risk profile',
        minimumInvestmentNotMet: 'Minimum investment amount of {minAmount} not met'
      },
      
      system: {
        generalError: 'An unexpected error occurred. Please try again.',
        serviceUnavailable: 'Service is temporarily unavailable. Please try again later.',
        rateLimitExceeded: 'Too many requests. Please wait and try again.',
        maintenanceMode: 'System is under maintenance. Please check back later.',
        timeoutError: 'Request timed out. Please check your connection and try again.',
        dataLoadingError: 'Unable to load data. Please refresh the page.',
        savingError: 'Unable to save changes. Please try again.',
        uploadError: 'File upload failed. Please check file size and format.',
        permissionDenied: 'You don\'t have permission to perform this action'
      },
      
      kyc: {
        documentRequired: 'Please upload the required documents',
        documentInvalid: 'Uploaded document is invalid or unreadable',
        documentExpired: 'Document has expired. Please upload a current version.',
        verificationPending: 'Your verification is being processed',
        verificationFailed: 'Verification failed. Please check your documents and try again.',
        addressMismatch: 'Address on document doesn\'t match profile address',
        identityMismatch: 'Identity verification failed. Please ensure documents match.',
        documentTooLarge: 'Document file size is too large. Maximum size is {maxSize}MB',
        unsupportedFormat: 'Unsupported file format. Please use JPG, PNG, or PDF'
      }
    }
  }

  /**
   * Get help and support content for error recovery
   * In production, this would come from knowledge base systems
   */
  async getErrorRecoveryContent(errorType, userContext = {}) {
    await this.simulateNetworkDelay(300, 700)
    
    const baseContent = {
      connection: {
        title: 'Connection Troubleshooting',
        steps: [
          {
            title: 'Check your internet connection',
            description: 'Ensure you\'re connected to the internet and other websites are working',
            icon: 'wifi',
            difficulty: 'easy'
          },
          {
            title: 'Clear browser cache and cookies',
            description: 'Clear your browser\'s cache and cookies, then refresh the page',
            icon: 'refresh',
            difficulty: 'easy',
            instructions: {
              chrome: 'Press Ctrl+Shift+Delete and select cache and cookies',
              firefox: 'Press Ctrl+Shift+Delete and select cache and cookies',
              safari: 'Go to Safari > Preferences > Privacy > Manage Website Data'
            }
          },
          {
            title: 'Disable browser extensions',
            description: 'Temporarily disable ad blockers and other extensions',
            icon: 'extension',
            difficulty: 'medium'
          },
          {
            title: 'Try incognito/private mode',
            description: 'Open the site in a private/incognito browser window',
            icon: 'incognito',
            difficulty: 'easy'
          },
          {
            title: 'Check firewall and antivirus',
            description: 'Ensure your firewall or antivirus isn\'t blocking the connection',
            icon: 'shield',
            difficulty: 'hard'
          }
        ],
        contactInfo: {
          email: 'support@diboas.com',
          chat: '/support/chat',
          phone: '+1-800-DIBOAS'
        }
      },
      
      authentication: {
        title: 'Login and Account Issues',
        steps: [
          {
            title: 'Check your credentials',
            description: 'Ensure your email and password are entered correctly',
            icon: 'key',
            difficulty: 'easy'
          },
          {
            title: 'Reset your password',
            description: 'Use the password reset link if you\'ve forgotten your password',
            icon: 'lock',
            difficulty: 'easy',
            actionUrl: '/reset-password'
          },
          {
            title: 'Check for account lockout',
            description: 'Wait 15 minutes if your account has been temporarily locked',
            icon: 'clock',
            difficulty: 'easy'
          },
          {
            title: 'Verify your email',
            description: 'Check if you need to verify your email address',
            icon: 'email',
            difficulty: 'easy',
            actionUrl: '/verify-email'
          },
          {
            title: 'Contact support',
            description: 'If you\'re still having issues, contact our support team',
            icon: 'support',
            difficulty: 'easy',
            actionUrl: '/support'
          }
        ]
      },
      
      transaction: {
        title: 'Transaction Problems',
        steps: [
          {
            title: 'Check your balance',
            description: 'Ensure you have sufficient funds for the transaction',
            icon: 'wallet',
            difficulty: 'easy'
          },
          {
            title: 'Verify transaction details',
            description: 'Double-check the amount, address, and asset type',
            icon: 'check',
            difficulty: 'easy'
          },
          {
            title: 'Check network status',
            description: 'Some blockchain networks may be experiencing congestion',
            icon: 'network',
            difficulty: 'easy',
            statusUrl: '/network-status'
          },
          {
            title: 'Review transaction limits',
            description: 'Ensure your transaction is within daily and monthly limits',
            icon: 'limit',
            difficulty: 'medium',
            limitsUrl: '/account/limits'
          },
          {
            title: 'Wait and retry',
            description: 'Wait a few minutes and try the transaction again',
            icon: 'clock',
            difficulty: 'easy'
          }
        ]
      }
    }
    
    // Customize content based on user context
    const content = baseContent[errorType] || baseContent.connection
    
    // Add user-specific context
    if (userContext.isNewUser) {
      content.newUserNote = 'As a new user, you may need to complete account verification before certain features are available.'
    }
    
    if (userContext.hasActivePremium) {
      content.premiumSupport = {
        available: true,
        phone: '+1-800-DIBOAS-VIP',
        priorityChat: true
      }
    }
    
    return content
  }

  /**
   * Get contextual help suggestions based on error patterns
   * In production, this would come from ML/analytics systems
   */
  async getContextualHelpSuggestions(errorHistory = [], userProfile = {}) {
    await this.simulateNetworkDelay(250, 600)
    
    const suggestions = []
    
    // Analyze error patterns
    const errorCounts = errorHistory.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1
      return acc
    }, {})
    
    // Generate contextual suggestions
    if (errorCounts.authentication >= 3) {
      suggestions.push({
        type: 'tutorial',
        title: 'Account Security Best Practices',
        description: 'Learn how to secure your account and avoid login issues',
        url: '/help/security-guide',
        priority: 'high',
        icon: 'shield'
      })
    }
    
    if (errorCounts.transaction >= 2) {
      suggestions.push({
        type: 'guide',
        title: 'Transaction Troubleshooting Guide',
        description: 'Step-by-step guide to resolve common transaction issues',
        url: '/help/transaction-guide',
        priority: 'medium',
        icon: 'transaction'
      })
    }
    
    if (errorCounts.network >= 2) {
      suggestions.push({
        type: 'status',
        title: 'Check System Status',
        description: 'View current status of all diBoaS services',
        url: 'https://status.diboas.com',
        priority: 'high',
        icon: 'status',
        external: true
      })
    }
    
    // Add user-specific suggestions
    if (userProfile.experienceLevel === 'beginner') {
      suggestions.push({
        type: 'tutorial',
        title: 'Getting Started Guide',
        description: 'Complete walkthrough for new users',
        url: '/help/getting-started',
        priority: 'medium',
        icon: 'book'
      })
    }
    
    if (userProfile.hasActivePremium) {
      suggestions.push({
        type: 'support',
        title: 'Premium Support',
        description: 'Get priority support from our experts',
        url: '/support/premium',
        priority: 'high',
        icon: 'star'
      })
    }
    
    return {
      suggestions,
      totalSuggestions: suggestions.length,
      personalized: userProfile && Object.keys(userProfile).length > 0,
      lastUpdated: Date.now()
    }
  }

  /**
   * Get error reporting templates
   * In production, this would come from support systems
   */
  async getErrorReportingTemplates() {
    await this.simulateNetworkDelay(200, 500)
    
    return {
      bugReport: {
        title: 'Report a Bug',
        description: 'Help us fix issues by reporting bugs',
        fields: [
          {
            name: 'title',
            type: 'text',
            label: 'Bug Title',
            required: true,
            placeholder: 'Brief description of the bug'
          },
          {
            name: 'description',
            type: 'textarea',
            label: 'Description',
            required: true,
            placeholder: 'Detailed description of what happened'
          },
          {
            name: 'steps',
            type: 'textarea',
            label: 'Steps to Reproduce',
            required: true,
            placeholder: '1. Go to...\n2. Click on...\n3. See error'
          },
          {
            name: 'expected',
            type: 'textarea',
            label: 'Expected Behavior',
            required: true,
            placeholder: 'What should have happened instead?'
          },
          {
            name: 'browser',
            type: 'select',
            label: 'Browser',
            options: ['Chrome', 'Firefox', 'Safari', 'Edge', 'Other'],
            required: true
          },
          {
            name: 'device',
            type: 'select',
            label: 'Device Type',
            options: ['Desktop', 'Tablet', 'Mobile'],
            required: true
          },
          {
            name: 'screenshot',
            type: 'file',
            label: 'Screenshot (optional)',
            accept: 'image/*',
            required: false
          }
        ]
      },
      
      featureRequest: {
        title: 'Feature Request',
        description: 'Suggest new features or improvements',
        fields: [
          {
            name: 'title',
            type: 'text',
            label: 'Feature Title',
            required: true,
            placeholder: 'Brief description of the feature'
          },
          {
            name: 'description',
            type: 'textarea',
            label: 'Feature Description',
            required: true,
            placeholder: 'Detailed description of the proposed feature'
          },
          {
            name: 'usecase',
            type: 'textarea',
            label: 'Use Case',
            required: true,
            placeholder: 'How would this feature be used?'
          },
          {
            name: 'priority',
            type: 'select',
            label: 'Priority',
            options: ['Low', 'Medium', 'High', 'Critical'],
            required: true
          },
          {
            name: 'category',
            type: 'select',
            label: 'Category',
            options: ['Trading', 'Portfolio', 'Security', 'UI/UX', 'Other'],
            required: true
          }
        ]
      },
      
      supportTicket: {
        title: 'Contact Support',
        description: 'Get help from our support team',
        fields: [
          {
            name: 'category',
            type: 'select',
            label: 'Issue Category',
            options: [
              'Account Issues',
              'Transaction Problems', 
              'Technical Issues',
              'Security Concerns',
              'General Questions'
            ],
            required: true
          },
          {
            name: 'priority',
            type: 'select',
            label: 'Priority',
            options: ['Low', 'Medium', 'High', 'Urgent'],
            required: true
          },
          {
            name: 'subject',
            type: 'text',
            label: 'Subject',
            required: true,
            placeholder: 'Brief summary of your issue'
          },
          {
            name: 'message',
            type: 'textarea',
            label: 'Message',
            required: true,
            placeholder: 'Please provide as much detail as possible'
          },
          {
            name: 'attachments',
            type: 'file',
            label: 'Attachments (optional)',
            accept: 'image/*,application/pdf',
            multiple: true,
            required: false
          }
        ]
      }
    }
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return 'req_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  /**
   * Generate unique error ID  
   */
  generateErrorId() {
    return 'err_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  /**
   * Get estimated maintenance duration
   */
  getMaintenanceEstimate() {
    const durations = ['30 minutes', '1 hour', '2 hours', '4 hours']
    return durations[Math.floor(Math.random() * durations.length)]
  }

  /**
   * Get all error content data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint  
   * NO CACHING - always fresh data
   */
  async getAllErrorContentData(language = 'en', userContext = {}) {
    // In production, this would be a single API call or parallel calls
    const [pageContent, messageTemplates, recoveryContent, helpSuggestions, reportingTemplates] = await Promise.all([
      this.getErrorPageContent(language),
      this.getErrorMessageTemplates(language),
      this.getErrorRecoveryContent('connection', userContext),
      this.getContextualHelpSuggestions([], userContext),
      this.getErrorReportingTemplates()
    ])

    const allErrorContentData = {
      pageContent,
      messageTemplates,
      recoveryContent,
      helpSuggestions,
      reportingTemplates,
      timestamp: Date.now()
    }

    return allErrorContentData
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 200, maxMs = 600) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates error content provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 200)
      
      // Simulate occasional error content service outages (1% chance)
      if (Math.random() < 0.01) {
        throw new Error('Mockup error content provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 300 + 100, // 100-400ms
        contentTypes: ['pageContent', 'messageTemplates', 'recoveryContent', 'helpSuggestions', 'reportingTemplates'],
        supportedLanguages: ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja'],
        errorTypes: ['404', '500', '403', '401', 'network', 'maintenance'],
        recoveryGuides: 15,
        messageTemplates: 50,
        lastContentUpdate: Date.now() - Math.random() * 86400000 // Within last 24 hours
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
export const mockupErrorContentProviderService = new MockupErrorContentProviderService()

// Export class for testing
export default MockupErrorContentProviderService