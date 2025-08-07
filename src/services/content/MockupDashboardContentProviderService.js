/**
 * Mockup Dashboard Content Provider Service
 * Simulates 3rd party content management APIs with realistic response times
 * This will be replaced with real CMS integrations (Contentful, Strapi, etc.)
 */

import logger from '../../utils/logger.js'

export class MockupDashboardContentProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get dynamic dashboard greetings and welcome messages
   * In production, this would come from CMS or personalization engines
   */
  async getDashboardGreetings(userId = 'demo-user', timeOfDay = 'morning') {
    await this.simulateNetworkDelay(200, 500)
    
    // Simulate personalized greetings based on user behavior
    const greetingVariations = {
      morning: [
        'Good morning, {userName}! 👋',
        'Rise and shine, {userName}! ☀️',
        'Morning, {userName}! Ready to grow your wealth?',
        'Hello {userName}! Let\'s make today profitable! 💰'
      ],
      afternoon: [
        'Good afternoon, {userName}! 🌤️',
        'Hey {userName}! Hope your day is going well!',
        'Afternoon, {userName}! Time to check your progress!',
        'Hi {userName}! Your portfolio is looking great today! 📈'
      ],
      evening: [
        'Good evening, {userName}! 🌙',
        'Evening, {userName}! Time to review today\'s gains!',
        'Hey {userName}! How did your investments perform today?',
        'Good evening, {userName}! Ready to plan tomorrow\'s moves?'
      ]
    }

    const greetings = greetingVariations[timeOfDay] || greetingVariations.morning
    const selectedGreeting = greetings[Math.floor(Math.random() * greetings.length)]

    return {
      primary: selectedGreeting,
      secondary: this.getSecondaryMessage(),
      cta: this.getCallToAction(),
      timestamp: Date.now()
    }
  }

  /**
   * Get feature announcements and status updates
   * In production, this would come from product management systems
   */
  async getFeatureAnnouncements() {
    await this.simulateNetworkDelay(300, 700)
    
    // Simulate feature rollout status
    const features = [
      {
        id: 'one_click_trading',
        name: '1-Click Trading',
        description: 'Trade with a single click',
        status: 'active',
        icon: '⚡',
        badge: 'new',
        priority: 'high'
      },
      {
        id: 'smart_rebalancing',
        name: 'Smart Rebalancing',
        description: 'AI-powered portfolio optimization',
        status: 'beta',
        icon: '🤖',
        badge: 'beta',
        priority: 'medium'
      },
      {
        id: 'yield_farming_v2',
        name: 'Yield Farming 2.0',
        description: 'Enhanced yield strategies',
        status: 'coming_soon',
        icon: '🚀',
        badge: 'soon',
        priority: 'high'
      },
      {
        id: 'cross_chain_bridge',
        name: 'Cross-Chain Bridge',
        description: 'Move assets across blockchains',
        status: 'development',
        icon: '🌉',
        badge: 'dev',
        priority: 'medium'
      },
      {
        id: 'social_trading',
        name: 'Social Trading',
        description: 'Copy successful traders',
        status: 'planning',
        icon: '👥',
        badge: 'planned',
        priority: 'low'
      }
    ]

    // Filter features based on simulated rollout
    const availableFeatures = features.filter(feature => 
      Math.random() > 0.2 // 80% chance feature is shown
    )

    return availableFeatures.map(feature => ({
      ...feature,
      lastUpdated: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Within last week
      userHasAccess: Math.random() > 0.3 // 70% chance user has access
    }))
  }

  /**
   * Get market highlights and trending data
   * In production, this would come from financial data providers
   */
  async getMarketHighlights() {
    await this.simulateNetworkDelay(400, 900)
    
    // Simulate dynamic market data
    const generatePrice = (basePrice) => {
      const variation = (Math.random() - 0.5) * 0.1 // ±5%
      return (basePrice * (1 + variation)).toFixed(2)
    }

    const generateChange = () => {
      const change = (Math.random() - 0.5) * 0.15 // ±7.5%
      return {
        percentage: (change * 100).toFixed(1),
        direction: change >= 0 ? 'up' : 'down',
        color: change >= 0 ? 'text-green-600' : 'text-red-600'
      }
    }

    return [
      {
        symbol: 'BTC/USD',
        name: 'Bitcoin',
        price: `$${generatePrice(43250)}`,
        change: generateChange(),
        icon: '₿'
      },
      {
        symbol: 'ETH/USD',
        name: 'Ethereum',
        price: `$${generatePrice(2890)}`,
        change: generateChange(),
        icon: 'Ξ'
      },
      {
        symbol: 'SOL/USD',
        name: 'Solana',
        price: `$${generatePrice(98)}`,
        change: generateChange(),
        icon: '◎'
      },
      {
        symbol: 'SUI/USD',
        name: 'Sui',
        price: `$${generatePrice(4.12)}`,
        change: generateChange(),
        icon: 'Ⓢ'
      }
    ]
  }

  /**
   * Get educational tips and insights
   * In production, this would come from content management systems
   */
  async getEducationalContent() {
    await this.simulateNetworkDelay(250, 600)
    
    const tips = [
      {
        id: 'diversification_tip',
        category: 'Risk Management',
        title: 'Tip of the Day',
        content: 'Diversifying across traditional and DeFi assets can help reduce portfolio risk while maintaining growth potential.',
        icon: '💡',
        difficulty: 'beginner',
        readTime: '2 min'
      },
      {
        id: 'dollar_cost_averaging',
        category: 'Investment Strategy',
        title: 'Smart Investing',
        content: 'Dollar-cost averaging helps reduce the impact of market volatility by spreading purchases over time.',
        icon: '📈',
        difficulty: 'beginner',
        readTime: '3 min'
      },
      {
        id: 'yield_farming_basics',
        category: 'DeFi Education',
        title: 'DeFi Insight',
        content: 'Yield farming can generate passive income, but always consider the risks and do your research before investing.',
        icon: '🌱',
        difficulty: 'intermediate',
        readTime: '5 min'
      },
      {
        id: 'market_timing_myth',
        category: 'Market Psychology',
        title: 'Market Wisdom',
        content: 'Time in the market beats timing the market. Consistent investing often outperforms trying to predict market movements.',
        icon: '⏰',
        difficulty: 'intermediate',
        readTime: '4 min'
      },
      {
        id: 'emergency_fund_importance',
        category: 'Financial Planning',
        title: 'Financial Health',
        content: 'Keep 3-6 months of expenses in an emergency fund before investing in higher-risk assets.',
        icon: '🛡️',
        difficulty: 'beginner',
        readTime: '3 min'
      }
    ]

    // Select random tip
    const selectedTip = tips[Math.floor(Math.random() * tips.length)]
    
    return {
      tip: selectedTip,
      relatedArticles: this.getRelatedArticles(selectedTip.category),
      learningPath: this.getLearningPath(selectedTip.difficulty)
    }
  }

  /**
   * Get dashboard widgets configuration
   * In production, this would come from user preference APIs
   */
  async getDashboardWidgets(userId = 'demo-user') {
    await this.simulateNetworkDelay(300, 700)
    
    // Simulate user-customizable widgets
    const availableWidgets = [
      {
        id: 'portfolio_overview',
        name: 'Portfolio Overview',
        description: 'Current balance and performance',
        enabled: true,
        position: { row: 0, col: 0 },
        size: 'large',
        refreshRate: 30000 // 30 seconds
      },
      {
        id: 'quick_actions',
        name: 'Quick Actions',
        description: 'Fast access to common transactions',
        enabled: true,
        position: { row: 0, col: 1 },
        size: 'medium',
        refreshRate: 0 // Static
      },
      {
        id: 'market_highlights',
        name: 'Market Highlights',
        description: 'Trending assets and prices',
        enabled: true,
        position: { row: 1, col: 0 },
        size: 'medium',
        refreshRate: 60000 // 1 minute
      },
      {
        id: 'recent_transactions',
        name: 'Recent Activity',
        description: 'Latest transactions and updates',
        enabled: true,
        position: { row: 1, col: 1 },
        size: 'medium',
        refreshRate: 10000 // 10 seconds
      },
      {
        id: 'educational_content',
        name: 'Learning Corner',
        description: 'Tips and educational content',
        enabled: Math.random() > 0.3, // 70% enabled
        position: { row: 2, col: 0 },
        size: 'small',
        refreshRate: 86400000 // 24 hours
      },
      {
        id: 'performance_chart',
        name: 'Performance Chart',
        description: 'Portfolio performance over time',
        enabled: Math.random() > 0.4, // 60% enabled
        position: { row: 2, col: 1 },
        size: 'large',
        refreshRate: 300000 // 5 minutes
      }
    ]

    return {
      widgets: availableWidgets.filter(widget => widget.enabled),
      layout: 'grid',
      theme: 'light',
      lastCustomized: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000 // Within 30 days
    }
  }

  /**
   * Get promotional banners and announcements
   * In production, this would come from marketing automation systems
   */
  async getPromotionalContent(userId = 'demo-user') {
    await this.simulateNetworkDelay(200, 500)
    
    const promotions = [
      {
        id: 'spring_bonus',
        type: 'banner',
        title: 'Spring Investment Bonus',
        description: 'Get 1.5% extra yield on new deposits this month!',
        cta: 'Learn More',
        priority: 'high',
        startDate: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
        endDate: Date.now() + 25 * 24 * 60 * 60 * 1000, // 25 days from now
        targetAudience: 'all_users',
        theme: 'success'
      },
      {
        id: 'referral_program',
        type: 'card',
        title: 'Refer Friends, Earn Rewards',
        description: 'Get $25 for each friend who joins and invests $500+',
        cta: 'Invite Friends',
        priority: 'medium',
        startDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        targetAudience: 'active_users',
        theme: 'info'
      },
      {
        id: 'mobile_app_promo',
        type: 'notification',
        title: 'Trade on the Go',
        description: 'Download our mobile app for exclusive mobile-only features',
        cta: 'Download App',
        priority: 'low',
        startDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 60 * 24 * 60 * 60 * 1000,
        targetAudience: 'new_users',
        theme: 'primary'
      }
    ]

    // Filter promotions based on targeting and timing
    const activePromotions = promotions.filter(promo => {
      const now = Date.now()
      const isActive = now >= promo.startDate && now <= promo.endDate
      const matchesTarget = Math.random() > 0.3 // 70% targeting match
      return isActive && matchesTarget
    })

    return activePromotions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Get secondary message for greetings
   */
  getSecondaryMessage() {
    const messages = [
      'Your portfolio is performing well today!',
      'Ready to explore new investment opportunities?',
      'Check out your latest performance insights.',
      'Time to review your investment goals.',
      'Discover trending assets in your dashboard.'
    ]
    
    return messages[Math.floor(Math.random() * messages.length)]
  }

  /**
   * Get call-to-action suggestions
   */
  getCallToAction() {
    const actions = [
      { text: 'Add Funds', action: 'add_funds', priority: 'high' },
      { text: 'View Performance', action: 'view_performance', priority: 'medium' },
      { text: 'Explore Strategies', action: 'explore_strategies', priority: 'medium' },
      { text: 'Check Market', action: 'check_market', priority: 'low' }
    ]
    
    return actions[Math.floor(Math.random() * actions.length)]
  }

  /**
   * Get related articles for educational content
   */
  getRelatedArticles(category) {
    const articles = {
      'Risk Management': ['Portfolio Diversification 101', 'Understanding Market Volatility'],
      'Investment Strategy': ['Building Your First Strategy', 'Long-term vs Short-term Investing'],
      'DeFi Education': ['Smart Contracts Explained', 'Liquidity Pools Guide'],
      'Market Psychology': ['Emotional Investing Mistakes', 'Market Cycles and Sentiment'],
      'Financial Planning': ['Budgeting for Investments', 'Tax-Efficient Investing']
    }
    
    return articles[category] || []
  }

  /**
   * Get learning path suggestions
   */
  getLearningPath(difficulty) {
    const paths = {
      'beginner': ['Investment Basics', 'Understanding Risk', 'First Portfolio'],
      'intermediate': ['Advanced Strategies', 'DeFi Fundamentals', 'Technical Analysis'],
      'advanced': ['Institutional Trading', 'Options & Derivatives', 'Market Making']
    }
    
    return paths[difficulty] || []
  }

  /**
   * Get all dashboard content in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllDashboardContent(userId = 'demo-user', timeOfDay = 'morning') {
    // In production, this would be a single API call or parallel calls
    const [greetings, features, market, educational, widgets, promotions] = await Promise.all([
      this.getDashboardGreetings(userId, timeOfDay),
      this.getFeatureAnnouncements(),
      this.getMarketHighlights(),
      this.getEducationalContent(),
      this.getDashboardWidgets(userId),
      this.getPromotionalContent(userId)
    ])

    const allDashboardContent = {
      greetings,
      features,
      market,
      educational,
      widgets,
      promotions,
      timestamp: Date.now()
    }

    return allDashboardContent
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 200, maxMs = 700) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates content provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 200)
      
      // Simulate occasional CMS outages (1% chance)
      if (Math.random() < 0.01) {
        throw new Error('Mockup dashboard content provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 300 + 150, // 150-450ms
        contentTypes: ['greetings', 'features', 'market', 'educational', 'widgets', 'promotions'],
        lastContentUpdate: Date.now() - Math.random() * 3600000, // Within last hour
        cacheHitRate: Math.random() * 0.3 + 0.7 // 70-100% hit rate
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
export const mockupDashboardContentProviderService = new MockupDashboardContentProviderService()

// Export class for testing
export default MockupDashboardContentProviderService