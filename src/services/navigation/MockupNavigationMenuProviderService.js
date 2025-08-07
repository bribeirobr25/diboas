/**
 * Mockup Navigation Menu Provider Service
 * Simulates 3rd party navigation management APIs with realistic response times
 * This will be replaced with real navigation/menu management integrations
 */

import logger from '../../utils/logger.js'

export class MockupNavigationMenuProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get main navigation menu structure
   * In production, this would come from CMS or navigation management systems
   */
  async getMainNavigation(userId = 'demo-user', userRole = 'user') {
    await this.simulateNetworkDelay(200, 500)
    
    // Simulate role-based navigation
    const rolePermissions = {
      'user': ['dashboard', 'transactions', 'strategies', 'portfolio', 'settings'],
      'premium': ['dashboard', 'transactions', 'strategies', 'portfolio', 'analytics', 'settings'],
      'admin': ['dashboard', 'transactions', 'strategies', 'portfolio', 'analytics', 'admin', 'settings']
    }
    
    const userPermissions = rolePermissions[userRole] || rolePermissions['user']
    
    const allMenuItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'LayoutDashboard',
        path: '/',
        order: 1,
        enabled: true,
        badge: null,
        children: []
      },
      {
        id: 'transactions',
        label: 'Transactions',
        icon: 'ArrowLeftRight',
        path: '/transactions',
        order: 2,
        enabled: true,
        badge: this.generateNotificationBadge(),
        children: [
          {
            id: 'add-funds',
            label: 'Add Funds',
            icon: 'Plus',
            path: '/transactions/add',
            shortcut: 'Ctrl+A'
          },
          {
            id: 'send-money',
            label: 'Send Money',
            icon: 'Send',
            path: '/transactions/send',
            shortcut: 'Ctrl+S'
          },
          {
            id: 'withdraw',
            label: 'Withdraw',
            icon: 'Download',
            path: '/transactions/withdraw'
          },
          {
            id: 'history',
            label: 'Transaction History',
            icon: 'History',
            path: '/transactions/history'
          }
        ]
      },
      {
        id: 'strategies',
        label: 'Strategies',
        icon: 'Target',
        path: '/strategies',
        order: 3,
        enabled: true,
        badge: null,
        children: [
          {
            id: 'active-strategies',
            label: 'Active Strategies',
            icon: 'Play',
            path: '/strategies/active'
          },
          {
            id: 'create-strategy',
            label: 'Create New',
            icon: 'PlusCircle',
            path: '/strategies/create',
            highlight: true
          },
          {
            id: 'strategy-templates',
            label: 'Templates',
            icon: 'BookOpen',
            path: '/strategies/templates'
          }
        ]
      },
      {
        id: 'portfolio',
        label: 'Portfolio',
        icon: 'PieChart',
        path: '/portfolio',
        order: 4,
        enabled: true,
        badge: null,
        children: [
          {
            id: 'overview',
            label: 'Overview',
            icon: 'Eye',
            path: '/portfolio/overview'
          },
          {
            id: 'performance',
            label: 'Performance',
            icon: 'TrendingUp',
            path: '/portfolio/performance'
          },
          {
            id: 'allocation',
            label: 'Asset Allocation',
            icon: 'PieChart',
            path: '/portfolio/allocation'
          }
        ]
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: 'BarChart3',
        path: '/analytics',
        order: 5,
        enabled: userPermissions.includes('analytics'),
        badge: { text: 'Pro', color: 'bg-purple-500' },
        children: [
          {
            id: 'advanced-charts',
            label: 'Advanced Charts',
            icon: 'LineChart',
            path: '/analytics/charts'
          },
          {
            id: 'risk-analysis',
            label: 'Risk Analysis',
            icon: 'Shield',
            path: '/analytics/risk'
          },
          {
            id: 'tax-reports',
            label: 'Tax Reports',
            icon: 'FileText',
            path: '/analytics/tax'
          }
        ]
      },
      {
        id: 'admin',
        label: 'Admin',
        icon: 'Settings2',
        path: '/admin',
        order: 6,
        enabled: userPermissions.includes('admin'),
        badge: null,
        children: [
          {
            id: 'user-management',
            label: 'Users',
            icon: 'Users',
            path: '/admin/users'
          },
          {
            id: 'system-settings',
            label: 'System',
            icon: 'Cog',
            path: '/admin/system'
          },
          {
            id: 'monitoring',
            label: 'Monitoring',
            icon: 'Activity',
            path: '/admin/monitoring'
          }
        ]
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'Settings',
        path: '/settings',
        order: 7,
        enabled: true,
        badge: null,
        children: [
          {
            id: 'profile',
            label: 'Profile',
            icon: 'User',
            path: '/settings/profile'
          },
          {
            id: 'security',
            label: 'Security',
            icon: 'Lock',
            path: '/settings/security'
          },
          {
            id: 'notifications',
            label: 'Notifications',
            icon: 'Bell',
            path: '/settings/notifications'
          },
          {
            id: 'preferences',
            label: 'Preferences',
            icon: 'Sliders',
            path: '/settings/preferences'
          }
        ]
      }
    ]
    
    return allMenuItems
      .filter(item => item.enabled && userPermissions.includes(item.id))
      .sort((a, b) => a.order - b.order)
  }

  /**
   * Get quick actions menu
   * In production, this would be personalized based on user behavior
   */
  async getQuickActions(userId = 'demo-user') {
    await this.simulateNetworkDelay(150, 400)
    
    // Simulate personalized quick actions based on user behavior
    const baseActions = [
      {
        id: 'add',
        icon: 'Plus',
        label: 'Add Funds',
        description: 'Add money to your account',
        path: '/transactions/add',
        colorClass: 'add-funds',
        shortcut: 'A',
        frequency: 'high',
        lastUsed: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 // Within last week
      },
      {
        id: 'send',
        icon: 'Send',
        label: 'Send Money',
        description: 'Send crypto to another wallet',
        path: '/transactions/send',
        colorClass: 'send-money',
        shortcut: 'S',
        frequency: 'medium',
        lastUsed: Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000 // Within last 2 weeks
      },
      {
        id: 'buy',
        icon: 'ShoppingCart',
        label: 'Buy Crypto',
        description: 'Purchase cryptocurrency',
        path: '/transactions/buy',
        colorClass: 'buy-crypto',
        shortcut: 'B',
        frequency: 'high',
        lastUsed: Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000 // Within last 3 days
      },
      {
        id: 'sell',
        icon: 'DollarSign',
        label: 'Sell Crypto',
        description: 'Convert crypto to cash',
        path: '/transactions/sell',
        colorClass: 'sell-crypto',
        shortcut: 'L',
        frequency: 'medium',
        lastUsed: Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000 // Within last 10 days
      },
      {
        id: 'withdraw',
        icon: 'Download',
        label: 'Withdraw',
        description: 'Withdraw to bank account',
        path: '/transactions/withdraw',
        colorClass: 'withdraw-funds',
        shortcut: 'W',
        frequency: 'low',
        lastUsed: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000 // Within last month
      },
      {
        id: 'strategy',
        icon: 'Target',
        label: 'Create Strategy',
        description: 'Start a new investment strategy',
        path: '/strategies/create',
        colorClass: 'create-strategy',
        shortcut: 'C',
        frequency: 'medium',
        lastUsed: Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000 // Within last 20 days
      }
    ]
    
    // Sort by frequency and recency
    return baseActions
      .sort((a, b) => {
        const frequencyWeight = { high: 3, medium: 2, low: 1 }
        const aScore = frequencyWeight[a.frequency] + (1 / (Date.now() - a.lastUsed)) * 1000000
        const bScore = frequencyWeight[b.frequency] + (1 / (Date.now() - b.lastUsed)) * 1000000
        return bScore - aScore
      })
      .slice(0, 4) // Top 4 actions
  }

  /**
   * Get contextual menu items based on current page
   * In production, this would be dynamic based on user location and permissions
   */
  async getContextualMenu(currentPath = '/', userId = 'demo-user') {
    await this.simulateNetworkDelay(100, 300)
    
    const contextualMenus = {
      '/': [
        { label: 'View Portfolio', icon: 'PieChart', action: 'navigate:/portfolio' },
        { label: 'Add Funds', icon: 'Plus', action: 'navigate:/transactions/add' },
        { label: 'Create Strategy', icon: 'Target', action: 'navigate:/strategies/create' }
      ],
      '/transactions': [
        { label: 'Transaction History', icon: 'History', action: 'navigate:/transactions/history' },
        { label: 'Export CSV', icon: 'Download', action: 'export:transactions' },
        { label: 'Set Alerts', icon: 'Bell', action: 'modal:alerts' }
      ],
      '/strategies': [
        { label: 'Performance Report', icon: 'BarChart3', action: 'modal:performance' },
        { label: 'Risk Assessment', icon: 'Shield', action: 'navigate:/analytics/risk' },
        { label: 'Rebalance Portfolio', icon: 'Shuffle', action: 'action:rebalance' }
      ],
      '/portfolio': [
        { label: 'Download Report', icon: 'FileDown', action: 'export:portfolio' },
        { label: 'Share Portfolio', icon: 'Share2', action: 'modal:share' },
        { label: 'Tax Summary', icon: 'Calculator', action: 'navigate:/analytics/tax' }
      ]
    }
    
    const pathKey = Object.keys(contextualMenus).find(path => currentPath.startsWith(path)) || '/'
    return contextualMenus[pathKey] || []
  }

  /**
   * Get mobile navigation configuration
   * In production, this would be optimized for mobile user patterns
   */
  async getMobileNavigation() {
    await this.simulateNetworkDelay(200, 500)
    
    return {
      bottomTabs: [
        {
          id: 'home',
          label: 'Home',
          icon: 'Home',
          path: '/',
          badge: null
        },
        {
          id: 'transactions',
          label: 'Transactions',
          icon: 'ArrowLeftRight',
          path: '/transactions',
          badge: this.generateNotificationBadge()
        },
        {
          id: 'strategies',
          label: 'Strategies',
          icon: 'Target',
          path: '/strategies',
          badge: null
        },
        {
          id: 'portfolio',
          label: 'Portfolio',
          icon: 'PieChart',
          path: '/portfolio',
          badge: null
        },
        {
          id: 'more',
          label: 'More',
          icon: 'MoreHorizontal',
          path: '/menu',
          badge: null
        }
      ],
      
      hamburgerMenu: [
        { label: 'Profile', icon: 'User', path: '/profile' },
        { label: 'Settings', icon: 'Settings', path: '/settings' },
        { label: 'Help & Support', icon: 'HelpCircle', path: '/support' },
        { label: 'Feedback', icon: 'MessageSquare', path: '/feedback' },
        { label: 'Sign Out', icon: 'LogOut', action: 'logout' }
      ],
      
      swipeActions: {
        enabled: true,
        leftSwipe: { icon: 'Plus', action: 'quick-add', label: 'Add Funds' },
        rightSwipe: { icon: 'Send', action: 'quick-send', label: 'Send Money' }
      }
    }
  }

  /**
   * Get search suggestions and shortcuts
   * In production, this would be powered by search analytics
   */
  async getSearchConfiguration() {
    await this.simulateNetworkDelay(250, 600)
    
    return {
      quickSearches: [
        'Add funds',
        'Send money',
        'Portfolio performance',
        'Transaction history',
        'Create strategy',
        'Security settings',
        'Tax reports',
        'Price alerts'
      ],
      
      searchShortcuts: [
        { query: 'balance', path: '/portfolio', description: 'View account balance' },
        { query: 'buy bitcoin', path: '/transactions/buy?asset=BTC', description: 'Buy Bitcoin' },
        { query: 'emergency fund', path: '/strategies/create?template=emergency-fund', description: 'Create emergency fund strategy' },
        { query: 'transaction fees', path: '/settings/fees', description: 'View fee information' },
        { query: 'security', path: '/settings/security', description: 'Security settings' },
        { query: 'support', path: '/support', description: 'Help and support' }
      ],
      
      searchFilters: [
        { id: 'transactions', label: 'Transactions', count: 150 },
        { id: 'strategies', label: 'Strategies', count: 12 },
        { id: 'assets', label: 'Assets', count: 25 },
        { id: 'settings', label: 'Settings', count: 8 },
        { id: 'help', label: 'Help Articles', count: 45 }
      ]
    }
  }

  /**
   * Generate notification badge for menu items
   */
  generateNotificationBadge() {
    if (Math.random() < 0.3) { // 30% chance of having a badge
      const count = Math.floor(Math.random() * 5) + 1 // 1-5 notifications
      return {
        count,
        color: count > 3 ? 'bg-red-500' : 'bg-blue-500',
        pulse: count > 3
      }
    }
    return null
  }

  /**
   * Get navigation analytics and usage patterns
   * In production, this would come from analytics platforms
   */
  async getNavigationAnalytics() {
    await this.simulateNetworkDelay(400, 900)
    
    return {
      mostUsedPages: [
        { path: '/', label: 'Dashboard', visits: Math.floor(Math.random() * 1000) + 500 },
        { path: '/transactions', label: 'Transactions', visits: Math.floor(Math.random() * 800) + 400 },
        { path: '/portfolio', label: 'Portfolio', visits: Math.floor(Math.random() * 600) + 300 },
        { path: '/strategies', label: 'Strategies', visits: Math.floor(Math.random() * 400) + 200 }
      ],
      
      quickActionUsage: {
        'add': Math.floor(Math.random() * 50) + 25,
        'send': Math.floor(Math.random() * 30) + 15,
        'buy': Math.floor(Math.random() * 40) + 20,
        'sell': Math.floor(Math.random() * 25) + 10
      },
      
      averageNavigationDepth: Math.round((Math.random() * 2 + 2) * 10) / 10, // 2.0-4.0
      
      mobileVsDesktop: {
        mobile: Math.floor(Math.random() * 40) + 45, // 45-85%
        desktop: Math.floor(Math.random() * 40) + 15  // 15-55%
      },
      
      peakUsageHours: [
        { hour: 9, usage: Math.floor(Math.random() * 20) + 15 },
        { hour: 12, usage: Math.floor(Math.random() * 25) + 20 },
        { hour: 18, usage: Math.floor(Math.random() * 30) + 25 },
        { hour: 21, usage: Math.floor(Math.random() * 15) + 10 }
      ]
    }
  }

  /**
   * Get all navigation data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllNavigationData(userId = 'demo-user', userRole = 'user', currentPath = '/') {
    // In production, this would be a single API call or parallel calls
    const [mainNav, quickActions, contextual, mobile, search, analytics] = await Promise.all([
      this.getMainNavigation(userId, userRole),
      this.getQuickActions(userId),
      this.getContextualMenu(currentPath, userId),
      this.getMobileNavigation(),
      this.getSearchConfiguration(),
      this.getNavigationAnalytics()
    ])

    const allNavigationData = {
      mainNavigation: mainNav,
      quickActions,
      contextualMenu: contextual,
      mobileNavigation: mobile,
      search,
      analytics,
      timestamp: Date.now()
    }

    return allNavigationData
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 150, maxMs = 600) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates navigation provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 200)
      
      // Simulate occasional navigation service outages (1% chance)
      if (Math.random() < 0.01) {
        throw new Error('Mockup navigation menu provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 300 + 100, // 100-400ms
        menuItems: 23,
        quickActions: 6,
        mobileOptimized: true,
        a11yCompliant: true,
        lastMenuUpdate: Date.now() - Math.random() * 3600000 // Within last hour
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
export const mockupNavigationMenuProviderService = new MockupNavigationMenuProviderService()

// Export class for testing
export default MockupNavigationMenuProviderService