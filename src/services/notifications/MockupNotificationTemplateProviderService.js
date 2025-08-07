/**
 * Mockup Notification Template Provider Service
 * Simulates 3rd party notification management APIs with realistic response times
 * This will be replaced with real notification service integrations
 */

import logger from '../../utils/logger.js'

export class MockupNotificationTemplateProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get toast notification templates
   * In production, this would come from notification management systems
   */
  async getToastTemplates(language = 'en') {
    await this.simulateNetworkDelay(200, 500)
    
    return {
      success: {
        default: {
          title: 'Success',
          message: '{message}',
          icon: '✅',
          duration: 5000,
          position: 'top-right',
          showCloseButton: true
        },
        transaction: {
          title: 'Transaction Successful',
          message: 'Your {transactionType} of {amount} has been completed successfully.',
          icon: '💰',
          duration: 6000,
          position: 'top-right',
          showCloseButton: true,
          actions: [
            { label: 'View Details', action: 'view_transaction' }
          ]
        },
        strategy: {
          title: 'Strategy Created',
          message: 'Your {strategyName} strategy has been activated with {amount} initial funding.',
          icon: '🚀',
          duration: 7000,
          position: 'top-right',
          showCloseButton: true,
          actions: [
            { label: 'View Strategy', action: 'view_strategy' }
          ]
        },
        deposit: {
          title: 'Deposit Successful',
          message: '{amount} has been added to your account and is ready for investing.',
          icon: '💸',
          duration: 5000,
          position: 'top-right',
          showCloseButton: true
        }
      },
      
      error: {
        default: {
          title: 'Error',
          message: '{message}',
          icon: '❌',
          duration: 8000,
          position: 'top-right',
          showCloseButton: true
        },
        network: {
          title: 'Connection Error',
          message: 'Unable to connect to our servers. Please check your internet connection and try again.',
          icon: '📡',
          duration: 10000,
          position: 'top-right',
          showCloseButton: true,
          actions: [
            { label: 'Retry', action: 'retry_connection' },
            { label: 'Contact Support', action: 'contact_support' }
          ]
        },
        transaction: {
          title: 'Transaction Failed',
          message: 'Your {transactionType} could not be completed. {reason}',
          icon: '⚠️',
          duration: 10000,
          position: 'top-right',
          showCloseButton: true,
          actions: [
            { label: 'Try Again', action: 'retry_transaction' },
            { label: 'Contact Support', action: 'contact_support' }
          ]
        },
        validation: {
          title: 'Invalid Input',
          message: '{field} is required and must be valid.',
          icon: '📝',
          duration: 6000,
          position: 'top-right',
          showCloseButton: true
        }
      },
      
      warning: {
        default: {
          title: 'Warning',
          message: '{message}',
          icon: '⚠️',
          duration: 7000,
          position: 'top-right',
          showCloseButton: true
        },
        balance: {
          title: 'Low Balance',
          message: 'Your account balance is running low. Consider adding funds to continue trading.',
          icon: '💰',
          duration: 8000,
          position: 'top-right',
          showCloseButton: true,
          actions: [
            { label: 'Add Funds', action: 'add_funds' }
          ]
        },
        security: {
          title: 'Security Alert',
          message: 'Unusual activity detected on your account. Please verify your recent transactions.',
          icon: '🔒',
          duration: 12000,
          position: 'top-right',
          showCloseButton: true,
          actions: [
            { label: 'Review Activity', action: 'review_activity' },
            { label: 'Secure Account', action: 'secure_account' }
          ]
        },
        market: {
          title: 'Market Alert',
          message: '{asset} has moved {direction} by {percentage}% in the last hour.',
          icon: '📈',
          duration: 8000,
          position: 'top-right',
          showCloseButton: true,
          actions: [
            { label: 'View Chart', action: 'view_chart' }
          ]
        }
      },
      
      info: {
        default: {
          title: 'Information',
          message: '{message}',
          icon: 'ℹ️',
          duration: 6000,
          position: 'top-right',
          showCloseButton: true
        },
        maintenance: {
          title: 'Scheduled Maintenance',
          message: 'Our services will be unavailable from {startTime} to {endTime} for scheduled maintenance.',
          icon: '🔧',
          duration: 15000,
          position: 'top-center',
          showCloseButton: true,
          actions: [
            { label: 'Learn More', action: 'maintenance_info' }
          ]
        },
        feature: {
          title: 'New Feature Available',
          message: 'Check out our new {featureName} feature to enhance your trading experience.',
          icon: '🆕',
          duration: 10000,
          position: 'top-right',
          showCloseButton: true,
          actions: [
            { label: 'Try It Now', action: 'try_feature' },
            { label: 'Learn More', action: 'feature_info' }
          ]
        },
        tips: {
          title: 'Investment Tip',
          message: '{tip}',
          icon: '💡',
          duration: 12000,
          position: 'bottom-right',
          showCloseButton: true,
          actions: [
            { label: 'Learn More', action: 'learn_more' }
          ]
        }
      }
    }
  }

  /**
   * Get push notification templates
   * In production, this would come from push notification services
   */
  async getPushNotificationTemplates() {
    await this.simulateNetworkDelay(300, 700)
    
    return {
      transactionComplete: {
        title: 'Transaction Complete',
        body: 'Your {transactionType} of {amount} has been processed successfully.',
        icon: '/icons/transaction-success.png',
        badge: '/icons/badge.png',
        tag: 'transaction',
        actions: [
          { action: 'view', title: 'View Details' },
          { action: 'dismiss', title: 'Dismiss' }
        ],
        data: {
          url: '/transactions/{transactionId}'
        }
      },
      
      priceAlert: {
        title: 'Price Alert',
        body: '{asset} has {direction} to {price} ({changePercent}%)',
        icon: '/icons/price-alert.png',
        badge: '/icons/badge.png',
        tag: 'price-alert',
        actions: [
          { action: 'trade', title: 'Trade Now' },
          { action: 'view', title: 'View Chart' }
        ],
        data: {
          url: '/trading/{asset}'
        }
      },
      
      goalMilestone: {
        title: 'Goal Milestone Reached!',
        body: 'You\'re {percentage}% closer to your {goalName} goal. Keep it up!',
        icon: '/icons/milestone.png',
        badge: '/icons/badge.png',
        tag: 'milestone',
        actions: [
          { action: 'view', title: 'View Progress' },
          { action: 'add', title: 'Add Funds' }
        ],
        data: {
          url: '/goals/{goalId}'
        }
      },
      
      securityAlert: {
        title: 'Security Alert',
        body: 'New login detected from {location}. Was this you?',
        icon: '/icons/security.png',
        badge: '/icons/badge.png',
        tag: 'security',
        requireInteraction: true,
        actions: [
          { action: 'confirm', title: 'Yes, it was me' },
          { action: 'secure', title: 'Secure my account' }
        ],
        data: {
          url: '/security/activity'
        }
      },
      
      marketUpdate: {
        title: 'Market Update',
        body: 'Your portfolio is {direction} {percentage}% today. {summary}',
        icon: '/icons/portfolio.png',
        badge: '/icons/badge.png',
        tag: 'market-update',
        actions: [
          { action: 'view', title: 'View Portfolio' }
        ],
        data: {
          url: '/portfolio'
        }
      }
    }
  }

  /**
   * Get in-app notification templates
   * In production, this would come from engagement platforms
   */
  async getInAppNotificationTemplates() {
    await this.simulateNetworkDelay(250, 600)
    
    return {
      welcome: {
        id: 'welcome_series',
        type: 'onboarding',
        title: 'Welcome to diBoaS!',
        message: 'Start your investment journey by creating your first strategy.',
        icon: '👋',
        priority: 'high',
        dismissible: true,
        actions: [
          { label: 'Create Strategy', action: 'create_strategy', primary: true },
          { label: 'Take Tour', action: 'take_tour', secondary: true }
        ],
        targeting: {
          userSegment: 'new_users',
          daysAfterSignup: 0,
          maxDisplays: 1
        }
      },
      
      firstDeposit: {
        id: 'first_deposit_prompt',
        type: 'conversion',
        title: 'Ready to Start Investing?',
        message: 'Add funds to your account and earn up to 12% APY on your investments.',
        icon: '💰',
        priority: 'high',
        dismissible: true,
        actions: [
          { label: 'Add Funds', action: 'add_funds', primary: true },
          { label: 'Learn More', action: 'learn_about_apy', secondary: true }
        ],
        targeting: {
          userSegment: 'registered_no_deposit',
          daysAfterSignup: 1,
          maxDisplays: 3
        }
      },
      
      strategyRecommendation: {
        id: 'strategy_recommendation',
        type: 'engagement',
        title: 'New Strategy Recommendation',
        message: 'Based on your portfolio, we recommend trying our {strategyName} strategy.',
        icon: '🎯',
        priority: 'medium',
        dismissible: true,
        actions: [
          { label: 'View Strategy', action: 'view_recommended_strategy', primary: true },
          { label: 'Maybe Later', action: 'dismiss', secondary: true }
        ],
        targeting: {
          userSegment: 'active_investors',
          minPortfolioValue: 1000,
          maxDisplays: 2
        }
      },
      
      featureAnnouncement: {
        id: 'new_feature',
        type: 'feature',
        title: 'New Feature: {featureName}',
        message: '{featureDescription}',
        icon: '🚀',
        priority: 'medium',
        dismissible: true,
        actions: [
          { label: 'Try It Now', action: 'try_feature', primary: true },
          { label: 'Learn More', action: 'feature_info', secondary: true }
        ],
        targeting: {
          userSegment: 'all_users',
          rolloutPercentage: 50,
          maxDisplays: 1
        }
      },
      
      performanceUpdate: {
        id: 'weekly_performance',
        type: 'retention',
        title: 'Your Weekly Performance',
        message: 'Your portfolio gained {performancePercent}% this week. Great job!',
        icon: '📈',
        priority: 'low',
        dismissible: true,
        actions: [
          { label: 'View Details', action: 'view_performance', primary: true }
        ],
        targeting: {
          userSegment: 'active_investors',
          schedule: 'weekly',
          minPortfolioValue: 100
        }
      }
    }
  }

  /**
   * Get email notification templates
   * In production, this would come from email service providers
   */
  async getEmailNotificationTemplates() {
    await this.simulateNetworkDelay(400, 900)
    
    return {
      transactionConfirmation: {
        id: 'transaction_confirmation',
        subject: 'Transaction Confirmation - {transactionType} {amount}',
        template: 'transaction_confirmation',
        variables: [
          'userName', 'transactionType', 'amount', 'transactionId', 
          'timestamp', 'status', 'feeAmount'
        ],
        category: 'transactional',
        priority: 'high'
      },
      
      securityAlert: {
        id: 'security_alert',
        subject: 'Security Alert - {alertType}',
        template: 'security_alert',
        variables: [
          'userName', 'alertType', 'location', 'timestamp', 
          'deviceInfo', 'ipAddress'
        ],
        category: 'security',
        priority: 'critical'
      },
      
      weeklyPortfolioUpdate: {
        id: 'weekly_portfolio_update',
        subject: 'Your Weekly Portfolio Update',
        template: 'portfolio_update',
        variables: [
          'userName', 'weeklyReturn', 'totalValue', 'bestPerformer', 
          'worstPerformer', 'weekStartDate', 'weekEndDate'
        ],
        category: 'engagement',
        priority: 'medium',
        schedule: 'weekly'
      },
      
      goalAchievement: {
        id: 'goal_achievement',
        subject: 'Congratulations! You\'ve reached your {goalName} goal!',
        template: 'goal_achievement',
        variables: [
          'userName', 'goalName', 'goalAmount', 'timeToAchieve', 
          'totalReturn', 'nextGoalSuggestion'
        ],
        category: 'milestone',
        priority: 'high'
      },
      
      monthlyStatement: {
        id: 'monthly_statement',
        subject: 'Your Monthly Investment Statement - {monthYear}',
        template: 'monthly_statement',
        variables: [
          'userName', 'monthYear', 'startingBalance', 'endingBalance', 
          'totalDeposits', 'totalWithdrawals', 'netReturn', 'feesSummary'
        ],
        category: 'statement',
        priority: 'medium',
        schedule: 'monthly'
      }
    }
  }

  /**
   * Get notification preferences and settings
   * In production, this would come from user preference APIs
   */
  async getNotificationPreferences(userId = 'demo-user') {
    await this.simulateNetworkDelay(200, 500)
    
    // Simulate user-specific preferences
    return {
      channels: {
        toast: {
          enabled: true,
          types: ['success', 'error', 'warning'],
          position: 'top-right',
          duration: 5000
        },
        push: {
          enabled: Math.random() > 0.3, // 70% have push enabled
          types: ['transaction', 'security', 'price_alert'],
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '07:00'
          }
        },
        email: {
          enabled: Math.random() > 0.2, // 80% have email enabled
          types: ['transaction', 'security', 'weekly_update', 'monthly_statement'],
          frequency: 'immediate'
        },
        inApp: {
          enabled: true,
          types: ['feature', 'engagement', 'onboarding'],
          maxPerDay: 3
        }
      },
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        marketHours: true,
        priceAlertThreshold: 5.0, // 5% price change
        portfolioUpdateFrequency: 'weekly'
      },
      doNotDisturb: {
        enabled: false,
        schedule: null
      },
      lastUpdated: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000 // Within 30 days
    }
  }

  /**
   * Format notification template with variables
   */
  async formatNotificationTemplate(templateType, templateId, variables = {}) {
    await this.simulateNetworkDelay(100, 300)
    
    try {
      let templates
      
      switch (templateType) {
        case 'toast':
          templates = await this.getToastTemplates()
          break
        case 'push':
          templates = await this.getPushNotificationTemplates()
          break
        case 'inApp':
          templates = await this.getInAppNotificationTemplates()
          break
        case 'email':
          templates = await this.getEmailNotificationTemplates()
          break
        default:
          throw new Error(`Unknown template type: ${templateType}`)
      }
      
      const template = this.findTemplate(templates, templateId)
      if (!template) {
        throw new Error(`Template not found: ${templateId}`)
      }
      
      return this.substituteVariables(template, variables)
    } catch (error) {
      logger.error('MockupNotificationTemplateProviderService: Failed to format template:', error)
      throw error
    }
  }

  /**
   * Find template by ID in nested structure
   */
  findTemplate(templates, templateId) {
    for (const category of Object.values(templates)) {
      if (typeof category === 'object') {
        if (category[templateId]) return category[templateId]
        if (category.id === templateId) return category
        
        // Search nested structures
        for (const item of Object.values(category)) {
          if (typeof item === 'object' && item.id === templateId) {
            return item
          }
        }
      }
    }
    return null
  }

  /**
   * Substitute variables in template
   */
  substituteVariables(template, variables) {
    const result = JSON.parse(JSON.stringify(template)) // Deep clone
    
    const substitute = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          obj[key] = value.replace(/\{(\w+)\}/g, (match, varName) => {
            return variables[varName] || match
          })
        } else if (typeof value === 'object' && value !== null) {
          substitute(value)
        }
      }
    }
    
    substitute(result)
    return result
  }

  /**
   * Get all notification template data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllNotificationTemplateData(userId = 'demo-user', language = 'en') {
    // In production, this would be a single API call or parallel calls
    const [toast, push, inApp, email, preferences] = await Promise.all([
      this.getToastTemplates(language),
      this.getPushNotificationTemplates(),
      this.getInAppNotificationTemplates(),
      this.getEmailNotificationTemplates(),
      this.getNotificationPreferences(userId)
    ])

    const allTemplateData = {
      templates: {
        toast,
        push,
        inApp,
        email
      },
      preferences,
      timestamp: Date.now()
    }

    return allTemplateData
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 200, maxMs = 700) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates notification template provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 200)
      
      // Simulate occasional notification service outages (1% chance)
      if (Math.random() < 0.01) {
        throw new Error('Mockup notification template provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 300 + 150, // 150-450ms
        templateTypes: ['toast', 'push', 'inApp', 'email'],
        templateCount: {
          toast: 12,
          push: 5,
          inApp: 5,
          email: 5
        },
        lastTemplateUpdate: Date.now() - Math.random() * 86400000 // Within last 24 hours
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
export const mockupNotificationTemplateProviderService = new MockupNotificationTemplateProviderService()

// Export class for testing
export default MockupNotificationTemplateProviderService