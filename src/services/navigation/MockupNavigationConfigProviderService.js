/**
 * Mockup Navigation Configuration Provider Service
 * Simulates 3rd party navigation and UI flow management APIs with realistic response times
 * This will be replaced with real CMS/navigation management integrations (Contentful, Sanity, etc.)
 */

import logger from '../../utils/logger.js'

export class MockupNavigationConfigProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get main navigation configuration
   * In production, this would come from CMS or navigation management platforms
   */
  async getMainNavigationConfiguration(userRole = 'user', platform = 'web') {
    await this.simulateNetworkDelay(200, 500)
    
    const generateNavigationItem = (id, label, path, options = {}) => ({
      id,
      label,
      path,
      icon: options.icon || null,
      badge: options.badge || null,
      external: options.external || false,
      requiresAuth: options.requiresAuth !== false,
      roles: options.roles || ['user', 'premium', 'admin'],
      permissions: options.permissions || [],
      analyticsEvent: options.analyticsEvent || `nav_${id}_clicked`,
      order: options.order || 0,
      visible: options.visible !== false,
      enabled: this.generateAvailability(options.availability || 0.98),
      children: options.children || []
    })

    const baseNavigation = [
      generateNavigationItem('dashboard', 'Dashboard', '/', {
        icon: 'dashboard',
        order: 1,
        availability: 0.99
      }),
      
      generateNavigationItem('portfolio', 'Portfolio', '/portfolio', {
        icon: 'pie_chart',
        order: 2,
        badge: this.generateBadge('portfolio'),
        children: [
          generateNavigationItem('overview', 'Overview', '/portfolio/overview', { order: 1 }),
          generateNavigationItem('assets', 'Assets', '/portfolio/assets', { order: 2 }),
          generateNavigationItem('performance', 'Performance', '/portfolio/performance', { 
            order: 3,
            roles: ['premium', 'admin']
          }),
          generateNavigationItem('analytics', 'Analytics', '/portfolio/analytics', { 
            order: 4,
            roles: ['premium', 'admin']
          })
        ]
      }),
      
      generateNavigationItem('transactions', 'Transactions', '/transactions', {
        icon: 'swap_horiz',
        order: 3,
        children: [
          generateNavigationItem('history', 'History', '/transactions/history', { order: 1 }),
          generateNavigationItem('pending', 'Pending', '/transactions/pending', { 
            order: 2,
            badge: this.generateBadge('pending_count')
          }),
          generateNavigationItem('scheduled', 'Scheduled', '/transactions/scheduled', { 
            order: 3,
            roles: ['premium', 'admin']
          })
        ]
      }),
      
      generateNavigationItem('strategies', 'Strategies', '/strategies', {
        icon: 'target',
        order: 4,
        children: [
          generateNavigationItem('active', 'Active', '/strategies/active', { order: 1 }),
          generateNavigationItem('create', 'Create New', '/strategies/create', { order: 2 }),
          generateNavigationItem('templates', 'Templates', '/strategies/templates', { order: 3 }),
          generateNavigationItem('backtest', 'Backtesting', '/strategies/backtest', { 
            order: 4,
            roles: ['premium', 'admin']
          })
        ]
      }),
      
      generateNavigationItem('yield', 'Yield Farming', '/yield', {
        icon: 'trending_up',
        order: 5,
        badge: this.generateYieldBadge(),
        roles: ['premium', 'admin'],
        children: [
          generateNavigationItem('opportunities', 'Opportunities', '/yield/opportunities', { order: 1 }),
          generateNavigationItem('active_farms', 'Active Farms', '/yield/active', { order: 2 }),
          generateNavigationItem('analytics', 'Analytics', '/yield/analytics', { order: 3 })
        ]
      }),
      
      generateNavigationItem('trade', 'Trade', '/trade', {
        icon: 'candlestick_chart',
        order: 6,
        children: [
          generateNavigationItem('spot', 'Spot Trading', '/trade/spot', { order: 1 }),
          generateNavigationItem('dca', 'DCA Orders', '/trade/dca', { 
            order: 2,
            roles: ['premium', 'admin']
          }),
          generateNavigationItem('advanced', 'Advanced Trading', '/trade/advanced', { 
            order: 3,
            roles: ['premium', 'admin']
          })
        ]
      })
    ]

    // Filter navigation based on user role and platform
    const filteredNavigation = this.filterNavigationByRole(baseNavigation, userRole)
    const platformOptimizedNavigation = this.optimizeNavigationForPlatform(filteredNavigation, platform)

    return {
      platform,
      userRole,
      navigation: platformOptimizedNavigation,
      metadata: {
        lastUpdated: Date.now() - Math.random() * 3600000, // Within last hour
        version: this.generateVersion(),
        abTestVariant: this.generateABTestVariant(),
        personalizationEnabled: true,
        analyticsEnabled: true
      }
    }
  }

  /**
   * Get quick actions configuration
   * In production, this would come from action management platforms
   */
  async getQuickActionsConfiguration(userContext = {}) {
    await this.simulateNetworkDelay(150, 350)
    
    const baseActions = [
      {
        id: 'add_funds',
        label: 'Add Funds',
        description: 'Deposit money to your account',
        icon: 'add_circle',
        color: '#10B981',
        path: '/transactions/deposit',
        shortcut: 'A',
        category: 'financial',
        priority: 1,
        enabled: this.generateAvailability(0.98),
        permissions: [],
        analytics: {
          event: 'quick_action_add_funds',
          category: 'transaction',
          action: 'deposit_initiated'
        },
        conditions: {
          minAccountAge: 0,
          kycRequired: false,
          regions: ['global']
        }
      },
      
      {
        id: 'send_money',
        label: 'Send Money',
        description: 'Transfer funds to another wallet',
        icon: 'send',
        color: '#3B82F6',
        path: '/transactions/transfer',
        shortcut: 'S',
        category: 'financial',
        priority: 2,
        enabled: this.generateAvailability(0.95),
        permissions: ['transfer'],
        conditions: {
          minAccountAge: 7, // days
          kycRequired: true,
          minBalance: 10
        }
      },
      
      {
        id: 'buy_crypto',
        label: 'Buy Crypto',
        description: 'Purchase cryptocurrency',
        icon: 'shopping_cart',
        color: '#8B5CF6',
        path: '/trade/buy',
        shortcut: 'B',
        category: 'trading',
        priority: 3,
        enabled: this.generateAvailability(0.97),
        permissions: ['trade'],
        conditions: {
          regions: ['US', 'EU', 'CA', 'AU', 'UK'],
          kycRequired: true
        }
      },
      
      {
        id: 'create_strategy',
        label: 'Create Strategy',
        description: 'Set up investment strategy',
        icon: 'target',
        color: '#F59E0B',
        path: '/strategies/create',
        shortcut: 'C',
        category: 'strategy',
        priority: 4,
        enabled: this.generateAvailability(0.92),
        permissions: ['strategy_create'],
        conditions: {
          minBalance: 100,
          roles: ['premium', 'admin']
        }
      },
      
      {
        id: 'yield_farm',
        label: 'Start Farming',
        description: 'Begin yield farming',
        icon: 'agriculture',
        color: '#EF4444',
        path: '/yield/opportunities',
        shortcut: 'Y',
        category: 'defi',
        priority: 5,
        enabled: this.generateAvailability(0.88),
        permissions: ['defi_access'],
        conditions: {
          minBalance: 1000,
          roles: ['premium', 'admin'],
          riskAcknowledgment: true
        },
        beta: true,
        betaLabel: 'Beta'
      },
      
      {
        id: 'view_portfolio',
        label: 'Portfolio',
        description: 'View your investment portfolio',
        icon: 'pie_chart',
        color: '#06B6D4',
        path: '/portfolio',
        shortcut: 'P',
        category: 'analysis',
        priority: 6,
        enabled: this.generateAvailability(0.99),
        permissions: []
      },
      
      {
        id: 'settings',
        label: 'Settings',
        description: 'Manage account settings',
        icon: 'settings',
        color: '#6B7280',
        path: '/settings',
        shortcut: 'T', // seTtings
        category: 'account',
        priority: 7,
        enabled: this.generateAvailability(0.99),
        permissions: []
      },
      
      {
        id: 'support',
        label: 'Get Help',
        description: 'Contact customer support',
        icon: 'help_outline',
        color: '#8B5CF6',
        path: '/support',
        shortcut: 'H',
        category: 'support',
        priority: 8,
        enabled: this.generateAvailability(0.99),
        permissions: [],
        external: false
      }
    ]

    // Filter actions based on user context
    const filteredActions = baseActions.filter(action => {
      return this.evaluateActionConditions(action, userContext)
    })

    // Sort by priority and add dynamic properties
    const sortedActions = filteredActions
      .sort((a, b) => a.priority - b.priority)
      .map(action => ({
        ...action,
        usage: this.generateUsageMetrics(),
        lastUsed: this.generateLastUsed(),
        isNew: this.generateIsNew(),
        tooltip: this.generateTooltip(action),
        disabled: !action.enabled,
        loading: false
      }))

    return {
      actions: sortedActions,
      layout: {
        maxVisible: this.generateNumber(6, 8),
        showShortcuts: userContext.showShortcuts !== false,
        style: userContext.compactMode ? 'compact' : 'default',
        groupByCategory: userContext.groupActions || false
      },
      personalization: {
        enabled: true,
        reorderEnabled: true,
        hideEnabled: true,
        customActionsEnabled: userContext.roles?.includes('premium') || false
      },
      metadata: {
        lastUpdated: Date.now() - Math.random() * 1800000, // Within last 30 minutes
        version: this.generateVersion(),
        experiments: this.getActiveExperiments()
      }
    }
  }

  /**
   * Get breadcrumb configuration
   * In production, this would come from navigation management systems
   */
  async getBreadcrumbConfiguration(currentPath, userContext = {}) {
    await this.simulateNetworkDelay(100, 250)
    
    // Define breadcrumb mapping
    const breadcrumbMappings = {
      '/': [
        { label: 'Dashboard', path: '/', icon: 'home' }
      ],
      
      '/portfolio': [
        { label: 'Dashboard', path: '/', icon: 'home' },
        { label: 'Portfolio', path: '/portfolio', icon: 'pie_chart' }
      ],
      
      '/portfolio/assets': [
        { label: 'Dashboard', path: '/', icon: 'home' },
        { label: 'Portfolio', path: '/portfolio', icon: 'pie_chart' },
        { label: 'Assets', path: '/portfolio/assets', icon: 'account_balance_wallet' }
      ],
      
      '/portfolio/performance': [
        { label: 'Dashboard', path: '/', icon: 'home' },
        { label: 'Portfolio', path: '/portfolio', icon: 'pie_chart' },
        { label: 'Performance', path: '/portfolio/performance', icon: 'trending_up' }
      ],
      
      '/transactions': [
        { label: 'Dashboard', path: '/', icon: 'home' },
        { label: 'Transactions', path: '/transactions', icon: 'swap_horiz' }
      ],
      
      '/transactions/history': [
        { label: 'Dashboard', path: '/', icon: 'home' },
        { label: 'Transactions', path: '/transactions', icon: 'swap_horiz' },
        { label: 'History', path: '/transactions/history', icon: 'history' }
      ],
      
      '/strategies': [
        { label: 'Dashboard', path: '/', icon: 'home' },
        { label: 'Strategies', path: '/strategies', icon: 'target' }
      ],
      
      '/strategies/create': [
        { label: 'Dashboard', path: '/', icon: 'home' },
        { label: 'Strategies', path: '/strategies', icon: 'target' },
        { label: 'Create Strategy', path: '/strategies/create', icon: 'add_circle' }
      ],
      
      '/yield': [
        { label: 'Dashboard', path: '/', icon: 'home' },
        { label: 'Yield Farming', path: '/yield', icon: 'trending_up' }
      ],
      
      '/trade': [
        { label: 'Dashboard', path: '/', icon: 'home' },
        { label: 'Trade', path: '/trade', icon: 'candlestick_chart' }
      ],
      
      '/settings': [
        { label: 'Dashboard', path: '/', icon: 'home' },
        { label: 'Settings', path: '/settings', icon: 'settings' }
      ]
    }

    const breadcrumbs = breadcrumbMappings[currentPath] || [
      { label: 'Dashboard', path: '/', icon: 'home' },
      { label: 'Page', path: currentPath, icon: 'article' }
    ]

    return {
      breadcrumbs: breadcrumbs.map((crumb, index) => ({
        ...crumb,
        isCurrent: index === breadcrumbs.length - 1,
        clickable: index < breadcrumbs.length - 1,
        analyticsEvent: `breadcrumb_${crumb.label.toLowerCase().replace(' ', '_')}_clicked`
      })),
      separator: userContext.separatorStyle || 'chevron', // 'chevron', 'slash', 'dot'
      showIcons: userContext.showIcons !== false,
      maxVisible: userContext.maxBreadcrumbs || 5,
      collapseOn: 'mobile'
    }
  }

  /**
   * Get contextual menu configurations
   * In production, this would come from menu management platforms
   */
  async getContextualMenuConfigurations(context, item = null) {
    await this.simulateNetworkDelay(150, 400)
    
    const menuConfigurations = {
      transaction_row: [
        {
          id: 'view_details',
          label: 'View Details',
          icon: 'visibility',
          action: 'view_transaction_details',
          permissions: [],
          analytics: 'transaction_details_viewed'
        },
        {
          id: 'copy_hash',
          label: 'Copy Transaction Hash',
          icon: 'content_copy',
          action: 'copy_transaction_hash',
          permissions: [],
          analytics: 'transaction_hash_copied'
        },
        {
          id: 'export',
          label: 'Export',
          icon: 'download',
          action: 'export_transaction',
          permissions: ['export'],
          analytics: 'transaction_exported'
        },
        {
          id: 'share',
          label: 'Share',
          icon: 'share',
          action: 'share_transaction',
          permissions: [],
          analytics: 'transaction_shared',
          submenu: [
            { label: 'Copy Link', action: 'copy_link' },
            { label: 'Email', action: 'share_email' },
            { label: 'Social Media', action: 'share_social' }
          ]
        }
      ],
      
      asset_row: [
        {
          id: 'buy_more',
          label: 'Buy More',
          icon: 'add_shopping_cart',
          action: 'buy_asset',
          permissions: ['trade'],
          analytics: 'asset_buy_initiated'
        },
        {
          id: 'sell',
          label: 'Sell',
          icon: 'remove_shopping_cart',
          action: 'sell_asset',
          permissions: ['trade'],
          analytics: 'asset_sell_initiated'
        },
        {
          id: 'view_chart',
          label: 'View Chart',
          icon: 'show_chart',
          action: 'view_asset_chart',
          permissions: [],
          analytics: 'asset_chart_viewed'
        },
        {
          id: 'add_to_watchlist',
          label: 'Add to Watchlist',
          icon: 'bookmark_add',
          action: 'add_to_watchlist',
          permissions: [],
          analytics: 'asset_watchlisted'
        }
      ],
      
      strategy_row: [
        {
          id: 'edit',
          label: 'Edit Strategy',
          icon: 'edit',
          action: 'edit_strategy',
          permissions: ['strategy_edit'],
          analytics: 'strategy_edit_initiated'
        },
        {
          id: 'pause',
          label: 'Pause Strategy',
          icon: 'pause',
          action: 'pause_strategy',
          permissions: ['strategy_manage'],
          analytics: 'strategy_paused'
        },
        {
          id: 'clone',
          label: 'Clone Strategy',
          icon: 'content_copy',
          action: 'clone_strategy',
          permissions: ['strategy_create'],
          analytics: 'strategy_cloned'
        },
        {
          id: 'export',
          label: 'Export Configuration',
          icon: 'download',
          action: 'export_strategy',
          permissions: ['strategy_export'],
          analytics: 'strategy_exported'
        },
        {
          id: 'delete',
          label: 'Delete Strategy',
          icon: 'delete',
          action: 'delete_strategy',
          permissions: ['strategy_delete'],
          analytics: 'strategy_deleted',
          dangerous: true,
          confirmationRequired: true
        }
      ],
      
      user_profile: [
        {
          id: 'view_profile',
          label: 'View Profile',
          icon: 'person',
          action: 'view_profile',
          permissions: [],
          analytics: 'profile_viewed'
        },
        {
          id: 'edit_profile',
          label: 'Edit Profile',
          icon: 'edit',
          action: 'edit_profile',
          permissions: ['profile_edit'],
          analytics: 'profile_edit_initiated'
        },
        {
          id: 'settings',
          label: 'Account Settings',
          icon: 'settings',
          action: 'view_settings',
          permissions: [],
          analytics: 'settings_accessed'
        },
        {
          id: 'logout',
          label: 'Logout',
          icon: 'logout',
          action: 'logout',
          permissions: [],
          analytics: 'user_logged_out',
          separator: true
        }
      ]
    }

    const menuItems = menuConfigurations[context] || []
    
    return {
      context,
      items: menuItems.map(item => ({
        ...item,
        enabled: this.generateAvailability(0.95),
        visible: true,
        loading: false
      })),
      position: this.getMenuPosition(context),
      styling: {
        maxWidth: this.generateNumber(200, 300),
        showIcons: true,
        showShortcuts: false,
        showSeparators: true
      },
      behavior: {
        closeOnClick: true,
        closeOnOutsideClick: true,
        showOnHover: false,
        delay: this.generateNumber(0, 200)
      }
    }
  }

  /**
   * Get sidebar navigation configuration
   * In production, this would come from layout management platforms
   */
  async getSidebarNavigationConfiguration(collapsed = false, userRole = 'user') {
    await this.simulateNetworkDelay(200, 450)
    
    return {
      collapsed,
      collapsible: true,
      width: {
        expanded: this.generateNumber(240, 280),
        collapsed: this.generateNumber(60, 80)
      },
      position: 'left',
      overlay: false,
      
      sections: [
        {
          id: 'main',
          label: 'Main',
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/', badge: null },
            { id: 'portfolio', label: 'Portfolio', icon: 'pie_chart', path: '/portfolio', badge: this.generateBadge('portfolio_change') },
            { id: 'transactions', label: 'Transactions', icon: 'swap_horiz', path: '/transactions', badge: this.generateBadge('pending_count') }
          ]
        },
        
        {
          id: 'trading',
          label: 'Trading & Investing',
          items: [
            { id: 'trade', label: 'Trade', icon: 'candlestick_chart', path: '/trade', badge: null },
            { id: 'strategies', label: 'Strategies', icon: 'target', path: '/strategies', badge: this.generateBadge('active_strategies') },
            { id: 'yield', label: 'Yield Farming', icon: 'trending_up', path: '/yield', badge: this.generateYieldBadge(), roles: ['premium', 'admin'] }
          ]
        },
        
        {
          id: 'tools',
          label: 'Tools & Analytics',
          items: [
            { id: 'analytics', label: 'Analytics', icon: 'analytics', path: '/analytics', roles: ['premium', 'admin'] },
            { id: 'reports', label: 'Reports', icon: 'assessment', path: '/reports', roles: ['premium', 'admin'] },
            { id: 'tax', label: 'Tax Center', icon: 'receipt_long', path: '/tax', roles: ['premium', 'admin'] }
          ]
        },
        
        {
          id: 'account',
          label: 'Account',
          items: [
            { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
            { id: 'security', label: 'Security', icon: 'security', path: '/settings/security' },
            { id: 'support', label: 'Support', icon: 'help_outline', path: '/support' }
          ]
        }
      ],
      
      footer: {
        items: [
          { id: 'help', label: 'Help', icon: 'help_outline', path: '/help' },
          { id: 'feedback', label: 'Feedback', icon: 'feedback', action: 'open_feedback_modal' }
        ],
        userInfo: {
          show: true,
          showAvatar: true,
          showName: !collapsed,
          showRole: !collapsed && userRole !== 'user'
        }
      },
      
      customization: {
        allowReorder: userRole === 'admin',
        allowHide: true,
        themes: ['light', 'dark', 'auto'],
        compactMode: collapsed
      }
    }
  }

  /**
   * Helper methods for generating dynamic navigation values
   */
  
  generateAvailability(baseRate) {
    const variation = 0.02
    return Math.random() < (baseRate + (Math.random() - 0.5) * variation)
  }

  generateBadge(type) {
    const badges = {
      portfolio: Math.random() > 0.7 ? { text: '+2.3%', color: 'green', type: 'success' } : null,
      portfolio_change: Math.random() > 0.6 ? { text: this.generatePercentage(-5, 15) + '%', color: 'blue' } : null,
      pending_count: Math.random() > 0.8 ? { text: this.generateNumber(1, 5).toString(), color: 'orange', type: 'warning' } : null,
      active_strategies: Math.random() > 0.7 ? { text: this.generateNumber(1, 3).toString(), color: 'blue' } : null
    }
    
    return badges[type] || null
  }

  generateYieldBadge() {
    return Math.random() > 0.6 ? {
      text: 'NEW',
      color: 'purple',
      type: 'info',
      pulse: true
    } : null
  }

  generateVersion() {
    const major = Math.floor(Math.random() * 3) + 1
    const minor = Math.floor(Math.random() * 10)
    const patch = Math.floor(Math.random() * 20)
    return `${major}.${minor}.${patch}`
  }

  generateABTestVariant() {
    const variants = ['control', 'variant_a', 'variant_b']
    return variants[Math.floor(Math.random() * variants.length)]
  }

  generateNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  generatePercentage(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 10) / 10
  }

  generateUsageMetrics() {
    return {
      clickCount: this.generateNumber(0, 100),
      lastWeek: this.generateNumber(0, 20),
      trending: Math.random() > 0.7
    }
  }

  generateLastUsed() {
    const hoursAgo = Math.random() * 168 // Up to 1 week ago
    return Date.now() - (hoursAgo * 60 * 60 * 1000)
  }

  generateIsNew() {
    return Math.random() > 0.9
  }

  generateTooltip(action) {
    const shortcuts = action.shortcut ? ` (${action.shortcut})` : ''
    return `${action.description}${shortcuts}`
  }

  getActiveExperiments() {
    const experiments = ['nav_reorder_test', 'quick_action_icons', 'personalized_shortcuts']
    return experiments.filter(() => Math.random() > 0.7)
  }

  filterNavigationByRole(navigation, role) {
    return navigation.filter(item => {
      if (!item.roles || item.roles.includes(role)) {
        if (item.children) {
          item.children = this.filterNavigationByRole(item.children, role)
        }
        return true
      }
      return false
    })
  }

  optimizeNavigationForPlatform(navigation, platform) {
    if (platform === 'mobile') {
      // Limit depth and simplify for mobile
      return navigation.map(item => ({
        ...item,
        children: item.children?.slice(0, 4) || [] // Limit submenu items
      }))
    }
    return navigation
  }

  evaluateActionConditions(action, userContext) {
    if (!action.conditions) return true
    
    const { conditions } = action
    const {
      accountAge = 0,
      balance = 0,
      kycStatus = 'none',
      region = 'US',
      roles = ['user']
    } = userContext
    
    // Check account age
    if (conditions.minAccountAge && accountAge < conditions.minAccountAge) {
      return false
    }
    
    // Check balance
    if (conditions.minBalance && balance < conditions.minBalance) {
      return false
    }
    
    // Check KYC requirement
    if (conditions.kycRequired && kycStatus === 'none') {
      return false
    }
    
    // Check region
    if (conditions.regions && !conditions.regions.includes(region) && !conditions.regions.includes('global')) {
      return false
    }
    
    // Check roles
    if (conditions.roles && !conditions.roles.some(role => roles.includes(role))) {
      return false
    }
    
    return true
  }

  getMenuPosition(context) {
    const positions = {
      transaction_row: 'bottom-right',
      asset_row: 'bottom-right',
      strategy_row: 'bottom-right',
      user_profile: 'bottom-left'
    }
    return positions[context] || 'bottom-right'
  }

  /**
   * Get all navigation configuration data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllNavigationConfigurationData(userRole = 'user', platform = 'web', currentPath = '/') {
    // In production, this would be a single API call or parallel calls
    const [mainNav, quickActions, breadcrumbs, sidebar] = await Promise.all([
      this.getMainNavigationConfiguration(userRole, platform),
      this.getQuickActionsConfiguration({ roles: [userRole] }),
      this.getBreadcrumbConfiguration(currentPath),
      this.getSidebarNavigationConfiguration(false, userRole)
    ])

    const allNavigationData = {
      mainNavigation: mainNav,
      quickActions,
      breadcrumbs,
      sidebar,
      timestamp: Date.now()
    }

    return allNavigationData
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 200, maxMs = 500) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates navigation config provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 150)
      
      // Simulate occasional navigation config service outages (0.5% chance)
      if (Math.random() < 0.005) {
        throw new Error('Mockup navigation config provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 200 + 100, // 100-300ms
        configurationTypes: ['main_navigation', 'quick_actions', 'breadcrumbs', 'sidebar', 'contextual_menus'],
        supportedPlatforms: ['web', 'mobile', 'tablet'],
        supportedRoles: ['user', 'premium', 'admin'],
        abTestingEnabled: true,
        personalizationEnabled: true,
        lastConfigUpdate: Date.now() - Math.random() * 1800000, // Within last 30 minutes
        version: this.generateVersion()
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
export const mockupNavigationConfigProviderService = new MockupNavigationConfigProviderService()

// Export class for testing
export default MockupNavigationConfigProviderService