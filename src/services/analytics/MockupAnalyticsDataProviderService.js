/**
 * Mockup Analytics Data Provider Service
 * Simulates 3rd party analytics and KPI management APIs with realistic response times
 * This will be replaced with real analytics integrations (Google Analytics, Mixpanel, etc.)
 */

import logger from '../../utils/logger.js'

export class MockupAnalyticsDataProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get business KPI definitions
   * In production, this would come from analytics platforms
   */
  async getBusinessKPIDefinitions() {
    await this.simulateNetworkDelay(300, 800)
    
    return {
      user: {
        acquisition: {
          dailyActiveUsers: {
            name: 'Daily Active Users',
            description: 'Number of unique users who performed at least one action in the last 24 hours',
            formula: 'COUNT(DISTINCT user_id WHERE last_activity >= NOW() - INTERVAL 1 DAY)',
            target: this.generateDynamicTarget(1000, 2500),
            unit: 'users',
            frequency: 'daily',
            category: 'engagement',
            importance: 'critical'
          },
          
          monthlyActiveUsers: {
            name: 'Monthly Active Users',
            description: 'Number of unique users who performed at least one action in the last 30 days',
            formula: 'COUNT(DISTINCT user_id WHERE last_activity >= NOW() - INTERVAL 30 DAY)',
            target: this.generateDynamicTarget(8000, 15000),
            unit: 'users',
            frequency: 'daily',
            category: 'growth',
            importance: 'critical'
          },
          
          newUserSignups: {
            name: 'New User Signups',
            description: 'Number of users who completed registration in the specified period',
            formula: 'COUNT(*) FROM users WHERE created_at >= start_date AND created_at <= end_date',
            target: this.generateDynamicTarget(50, 200),
            unit: 'signups',
            frequency: 'daily',
            category: 'acquisition',
            importance: 'high'
          },
          
          userRetentionRate: {
            name: 'User Retention Rate (7-day)',
            description: 'Percentage of users who return within 7 days of first activity',
            formula: '(returning_users / total_new_users) * 100',
            target: this.generateDynamicTarget(65, 85),
            unit: 'percentage',
            frequency: 'weekly',
            category: 'retention',
            importance: 'critical'
          }
        },
        
        engagement: {
          sessionDuration: {
            name: 'Average Session Duration',
            description: 'Average time users spend in a single session',
            formula: 'AVG(session_end - session_start) WHERE session_end IS NOT NULL',
            target: this.generateDynamicTarget(8, 15),
            unit: 'minutes',
            frequency: 'daily',
            category: 'engagement',
            importance: 'medium'
          },
          
          pagesPerSession: {
            name: 'Pages Per Session',
            description: 'Average number of pages/screens visited per session',
            formula: 'SUM(page_views) / COUNT(DISTINCT session_id)',
            target: this.generateDynamicTarget(4, 8),
            unit: 'pages',
            frequency: 'daily',
            category: 'engagement',
            importance: 'medium'
          },
          
          bounceRate: {
            name: 'Bounce Rate',
            description: 'Percentage of single-page sessions',
            formula: '(single_page_sessions / total_sessions) * 100',
            target: this.generateDynamicTarget(25, 45), // Lower is better
            unit: 'percentage',
            frequency: 'daily',
            category: 'engagement',
            importance: 'medium',
            direction: 'lower_is_better'
          }
        }
      },
      
      financial: {
        revenue: {
          totalRevenue: {
            name: 'Total Revenue',
            description: 'Sum of all revenue generated in the specified period',
            formula: 'SUM(amount) FROM transactions WHERE type = "revenue" AND status = "completed"',
            target: this.generateDynamicTarget(50000, 200000),
            unit: 'usd',
            frequency: 'daily',
            category: 'revenue',
            importance: 'critical'
          },
          
          averageRevenuePerUser: {
            name: 'Average Revenue Per User (ARPU)',
            description: 'Average revenue generated per active user',
            formula: 'total_revenue / monthly_active_users',
            target: this.generateDynamicTarget(15, 50),
            unit: 'usd',
            frequency: 'monthly',
            category: 'revenue',
            importance: 'high'
          },
          
          monthlyRecurringRevenue: {
            name: 'Monthly Recurring Revenue (MRR)',
            description: 'Predictable revenue from subscriptions and recurring fees',
            formula: 'SUM(monthly_subscription_amount) FROM active_subscriptions',
            target: this.generateDynamicTarget(25000, 100000),
            unit: 'usd',
            frequency: 'monthly',
            category: 'revenue',
            importance: 'critical'
          }
        },
        
        trading: {
          tradingVolume: {
            name: 'Daily Trading Volume',
            description: 'Total value of assets traded per day',
            formula: 'SUM(trade_amount) FROM trades WHERE trade_date = CURRENT_DATE',
            target: this.generateDynamicTarget(1000000, 5000000),
            unit: 'usd',
            frequency: 'daily',
            category: 'trading',
            importance: 'critical'
          },
          
          averageTradeSize: {
            name: 'Average Trade Size',
            description: 'Average value of individual trades',
            formula: 'AVG(trade_amount) FROM completed_trades',
            target: this.generateDynamicTarget(500, 2500),
            unit: 'usd',
            frequency: 'daily',
            category: 'trading',
            importance: 'medium'
          },
          
          spreadCapture: {
            name: 'Spread Capture Rate',
            description: 'Percentage of bid-ask spread captured as revenue',
            formula: '(captured_spread / total_spread) * 100',
            target: this.generateDynamicTarget(40, 70),
            unit: 'percentage',
            frequency: 'daily',
            category: 'trading',
            importance: 'high'
          }
        }
      },
      
      operational: {
        performance: {
          systemUptime: {
            name: 'System Uptime',
            description: 'Percentage of time the system is operational and accessible',
            formula: '((total_time - downtime) / total_time) * 100',
            target: this.generateDynamicTarget(99.5, 99.9),
            unit: 'percentage',
            frequency: 'daily',
            category: 'reliability',
            importance: 'critical'
          },
          
          averageResponseTime: {
            name: 'Average API Response Time',
            description: 'Average time for API endpoints to respond to requests',
            formula: 'AVG(response_time) FROM api_logs WHERE timestamp >= start_time',
            target: this.generateDynamicTarget(100, 300), // Lower is better
            unit: 'milliseconds',
            frequency: 'hourly',
            category: 'performance',
            importance: 'high',
            direction: 'lower_is_better'
          },
          
          errorRate: {
            name: 'System Error Rate',
            description: 'Percentage of requests that result in errors',
            formula: '(error_requests / total_requests) * 100',
            target: this.generateDynamicTarget(0.1, 1), // Lower is better
            unit: 'percentage',
            frequency: 'hourly',
            category: 'reliability',
            importance: 'critical',
            direction: 'lower_is_better'
          }
        },
        
        support: {
          customerSatisfactionScore: {
            name: 'Customer Satisfaction Score (CSAT)',
            description: 'Average satisfaction rating from customer feedback',
            formula: 'AVG(rating) FROM customer_feedback WHERE rating IS NOT NULL',
            target: this.generateDynamicTarget(4.2, 4.8),
            unit: 'rating_1_to_5',
            frequency: 'weekly',
            category: 'satisfaction',
            importance: 'high'
          },
          
          firstResponseTime: {
            name: 'First Response Time',
            description: 'Average time to first response for support tickets',
            formula: 'AVG(first_response_time - created_time) FROM support_tickets',
            target: this.generateDynamicTarget(1, 4), // Lower is better
            unit: 'hours',
            frequency: 'daily',
            category: 'support',
            importance: 'medium',
            direction: 'lower_is_better'
          },
          
          ticketResolutionRate: {
            name: 'Ticket Resolution Rate',
            description: 'Percentage of support tickets resolved within SLA',
            formula: '(resolved_within_sla / total_tickets) * 100',
            target: this.generateDynamicTarget(85, 95),
            unit: 'percentage',
            frequency: 'daily',
            category: 'support',
            importance: 'high'
          }
        }
      },
      
      security: {
        incidents: {
          securityIncidentCount: {
            name: 'Security Incidents',
            description: 'Number of security incidents detected and reported',
            formula: 'COUNT(*) FROM security_incidents WHERE severity >= "medium"',
            target: this.generateDynamicTarget(0, 2), // Lower is better
            unit: 'incidents',
            frequency: 'daily',
            category: 'security',
            importance: 'critical',
            direction: 'lower_is_better'
          },
          
          fraudDetectionRate: {
            name: 'Fraud Detection Rate',
            description: 'Percentage of fraudulent transactions successfully detected',
            formula: '(detected_fraud / total_fraud_attempts) * 100',
            target: this.generateDynamicTarget(92, 98),
            unit: 'percentage',
            frequency: 'daily',
            category: 'security',
            importance: 'critical'
          },
          
          falsePositiveRate: {
            name: 'False Positive Rate',
            description: 'Percentage of legitimate transactions flagged as fraud',
            formula: '(false_positives / total_legitimate_transactions) * 100',
            target: this.generateDynamicTarget(1, 5), // Lower is better
            unit: 'percentage',
            frequency: 'daily',
            category: 'security',
            importance: 'high',
            direction: 'lower_is_better'
          }
        }
      }
    }
  }

  /**
   * Get tracking event definitions
   * In production, this would come from event tracking systems
   */
  async getTrackingEventDefinitions() {
    await this.simulateNetworkDelay(250, 600)
    
    return {
      user: {
        authentication: [
          {
            event: 'user_login',
            description: 'User successfully logs into the system',
            properties: ['user_id', 'login_method', 'device_type', 'location'],
            required: ['user_id', 'login_method'],
            frequency: 'high',
            retention: 90 // days
          },
          {
            event: 'user_logout',
            description: 'User logs out of the system',
            properties: ['user_id', 'session_duration', 'pages_visited'],
            required: ['user_id'],
            frequency: 'high',
            retention: 90
          },
          {
            event: 'password_reset',
            description: 'User initiates password reset process',
            properties: ['user_id', 'reset_method', 'success'],
            required: ['user_id', 'reset_method'],
            frequency: 'medium',
            retention: 180
          }
        ],
        
        onboarding: [
          {
            event: 'signup_started',
            description: 'User begins the registration process',
            properties: ['referral_source', 'user_agent', 'utm_parameters'],
            required: ['referral_source'],
            frequency: 'high',
            retention: 365
          },
          {
            event: 'signup_completed',
            description: 'User completes registration and account creation',
            properties: ['user_id', 'verification_method', 'time_to_complete'],
            required: ['user_id'],
            frequency: 'high',
            retention: 365
          },
          {
            event: 'kyc_verification_started',
            description: 'User begins KYC verification process',
            properties: ['user_id', 'kyc_provider', 'verification_level'],
            required: ['user_id', 'kyc_provider'],
            frequency: 'medium',
            retention: 730
          }
        ]
      },
      
      trading: {
        transactions: [
          {
            event: 'transaction_initiated',
            description: 'User starts a new transaction',
            properties: ['user_id', 'transaction_type', 'amount', 'asset', 'method'],
            required: ['user_id', 'transaction_type', 'amount'],
            frequency: 'high',
            retention: 365
          },
          {
            event: 'transaction_completed',
            description: 'Transaction is successfully completed',
            properties: ['user_id', 'transaction_id', 'final_amount', 'fees', 'duration'],
            required: ['user_id', 'transaction_id'],
            frequency: 'high',
            retention: 365
          },
          {
            event: 'transaction_failed',
            description: 'Transaction fails or is rejected',
            properties: ['user_id', 'transaction_id', 'failure_reason', 'retry_count'],
            required: ['user_id', 'transaction_id', 'failure_reason'],
            frequency: 'medium',
            retention: 365
          }
        ],
        
        portfolio: [
          {
            event: 'strategy_created',
            description: 'User creates a new investment strategy',
            properties: ['user_id', 'strategy_type', 'initial_amount', 'risk_level'],
            required: ['user_id', 'strategy_type'],
            frequency: 'medium',
            retention: 730
          },
          {
            event: 'portfolio_rebalanced',
            description: 'Portfolio is automatically rebalanced',
            properties: ['user_id', 'strategy_id', 'trigger_reason', 'changes_made'],
            required: ['user_id', 'strategy_id'],
            frequency: 'medium',
            retention: 365
          }
        ]
      },
      
      engagement: {
        navigation: [
          {
            event: 'page_view',
            description: 'User views a page or screen',
            properties: ['user_id', 'page_path', 'referrer', 'session_id'],
            required: ['page_path'],
            frequency: 'very_high',
            retention: 30
          },
          {
            event: 'feature_used',
            description: 'User interacts with a specific feature',
            properties: ['user_id', 'feature_name', 'action', 'context'],
            required: ['feature_name', 'action'],
            frequency: 'high',
            retention: 90
          }
        ],
        
        support: [
          {
            event: 'help_article_viewed',
            description: 'User views a help article or FAQ',
            properties: ['user_id', 'article_id', 'search_query', 'helpful_rating'],
            required: ['article_id'],
            frequency: 'medium',
            retention: 90
          },
          {
            event: 'support_ticket_created',
            description: 'User creates a support ticket',
            properties: ['user_id', 'ticket_category', 'priority', 'channel'],
            required: ['user_id', 'ticket_category'],
            frequency: 'low',
            retention: 730
          }
        ]
      }
    }
  }

  /**
   * Get conversion funnel definitions
   * In production, this would come from funnel analysis tools
   */
  async getConversionFunnelDefinitions() {
    await this.simulateNetworkDelay(350, 750)
    
    return {
      userAcquisition: {
        name: 'User Acquisition Funnel',
        description: 'Track users from landing page to first transaction',
        steps: [
          {
            step: 1,
            name: 'Landing Page Visit',
            event: 'page_view',
            filters: { page_path: '/' },
            target: this.generateDynamicTarget(5000, 15000),
            conversionTarget: 100 // Base percentage
          },
          {
            step: 2,
            name: 'Signup Started',
            event: 'signup_started',
            target: this.generateDynamicTarget(1000, 3000),
            conversionTarget: this.generateDynamicTarget(18, 25)
          },
          {
            step: 3,
            name: 'Account Created',
            event: 'signup_completed',
            target: this.generateDynamicTarget(800, 2200),
            conversionTarget: this.generateDynamicTarget(75, 85)
          },
          {
            step: 4,
            name: 'Email Verified',
            event: 'email_verified',
            target: this.generateDynamicTarget(700, 2000),
            conversionTarget: this.generateDynamicTarget(85, 92)
          },
          {
            step: 5,
            name: 'First Login',
            event: 'user_login',
            target: this.generateDynamicTarget(650, 1800),
            conversionTarget: this.generateDynamicTarget(88, 94)
          },
          {
            step: 6,
            name: 'First Transaction',
            event: 'transaction_completed',
            target: this.generateDynamicTarget(300, 900),
            conversionTarget: this.generateDynamicTarget(42, 55)
          }
        ],
        timeWindow: 2592000000, // 30 days
        attribution: 'first_touch'
      },
      
      investmentJourney: {
        name: 'Investment Journey Funnel',
        description: 'Track users from first deposit to active investing',
        steps: [
          {
            step: 1,
            name: 'First Deposit',
            event: 'transaction_completed',
            filters: { transaction_type: 'deposit' },
            target: this.generateDynamicTarget(500, 1200),
            conversionTarget: 100
          },
          {
            step: 2,
            name: 'Portfolio View',
            event: 'page_view',
            filters: { page_path: '/portfolio' },
            target: this.generateDynamicTarget(450, 1100),
            conversionTarget: this.generateDynamicTarget(88, 95)
          },
          {
            step: 3,
            name: 'Strategy Exploration',
            event: 'page_view',
            filters: { page_path: '/strategies' },
            target: this.generateDynamicTarget(350, 900),
            conversionTarget: this.generateDynamicTarget(75, 85)
          },
          {
            step: 4,
            name: 'Strategy Created',
            event: 'strategy_created',
            target: this.generateDynamicTarget(200, 600),
            conversionTarget: this.generateDynamicTarget(55, 70)
          },
          {
            step: 5,
            name: 'Active Investor (30 days)',
            event: 'transaction_completed',
            filters: { days_since_first: 30, transaction_count: '>=3' },
            target: this.generateDynamicTarget(150, 450),
            conversionTarget: this.generateDynamicTarget(70, 80)
          }
        ],
        timeWindow: 2592000000, // 30 days
        attribution: 'linear'
      },
      
      retentionFunnel: {
        name: 'User Retention Funnel',
        description: 'Track user retention over time',
        steps: [
          {
            step: 1,
            name: 'Day 1 (Sign up)',
            event: 'signup_completed',
            target: this.generateDynamicTarget(800, 2000),
            conversionTarget: 100
          },
          {
            step: 2,
            name: 'Day 7 Return',
            event: 'user_login',
            timeOffset: 604800000, // 7 days
            target: this.generateDynamicTarget(480, 1200),
            conversionTarget: this.generateDynamicTarget(58, 68)
          },
          {
            step: 3,
            name: 'Day 30 Return',
            event: 'user_login',
            timeOffset: 2592000000, // 30 days
            target: this.generateDynamicTarget(280, 700),
            conversionTarget: this.generateDynamicTarget(33, 43)
          },
          {
            step: 4,
            name: 'Day 90 Return',
            event: 'user_login',
            timeOffset: 7776000000, // 90 days
            target: this.generateDynamicTarget(200, 500),
            conversionTarget: this.generateDynamicTarget(23, 33)
          }
        ],
        timeWindow: 7776000000, // 90 days
        cohortAnalysis: true
      }
    }
  }

  /**
   * Get dashboard metric configurations
   * In production, this would come from dashboard management systems
   */
  async getDashboardMetricConfigurations() {
    await this.simulateNetworkDelay(200, 500)
    
    return {
      executiveDashboard: {
        name: 'Executive Overview',
        refresh: 300000, // 5 minutes
        widgets: [
          {
            id: 'total_revenue',
            type: 'metric_card',
            kpi: 'financial.revenue.totalRevenue',
            size: 'medium',
            position: { x: 0, y: 0 },
            showTrend: true,
            trendPeriod: '7d'
          },
          {
            id: 'active_users',
            type: 'metric_card',
            kpi: 'user.acquisition.dailyActiveUsers',
            size: 'medium',
            position: { x: 1, y: 0 },
            showTrend: true,
            trendPeriod: '7d'
          },
          {
            id: 'trading_volume',
            type: 'line_chart',
            kpi: 'financial.trading.tradingVolume',
            size: 'large',
            position: { x: 0, y: 1 },
            timeRange: '30d',
            granularity: 'daily'
          },
          {
            id: 'user_funnel',
            type: 'funnel_chart',
            funnel: 'userAcquisition',
            size: 'large',
            position: { x: 2, y: 1 },
            timeRange: '7d'
          }
        ]
      },
      
      operationalDashboard: {
        name: 'Operations Monitor',
        refresh: 60000, // 1 minute
        widgets: [
          {
            id: 'system_uptime',
            type: 'gauge',
            kpi: 'operational.performance.systemUptime',
            size: 'medium',
            position: { x: 0, y: 0 },
            alertThreshold: 99.0
          },
          {
            id: 'response_time',
            type: 'metric_card',
            kpi: 'operational.performance.averageResponseTime',
            size: 'medium',
            position: { x: 1, y: 0 },
            showTrend: true,
            trendPeriod: '1h'
          },
          {
            id: 'error_rate',
            type: 'line_chart',
            kpi: 'operational.performance.errorRate',
            size: 'large',
            position: { x: 0, y: 1 },
            timeRange: '24h',
            granularity: 'hourly',
            alertThreshold: 1.0
          }
        ]
      },
      
      financialDashboard: {
        name: 'Financial Metrics',
        refresh: 900000, // 15 minutes
        widgets: [
          {
            id: 'mrr',
            type: 'metric_card',
            kpi: 'financial.revenue.monthlyRecurringRevenue',
            size: 'large',
            position: { x: 0, y: 0 },
            showTrend: true,
            trendPeriod: '30d'
          },
          {
            id: 'arpu',
            type: 'metric_card',
            kpi: 'financial.revenue.averageRevenuePerUser',
            size: 'medium',
            position: { x: 1, y: 0 },
            showTrend: true,
            trendPeriod: '30d'
          },
          {
            id: 'revenue_breakdown',
            type: 'pie_chart',
            customQuery: 'revenue_by_source',
            size: 'large',
            position: { x: 0, y: 1 },
            timeRange: '30d'
          }
        ]
      }
    }
  }

  /**
   * Generate dynamic target with variation
   */
  generateDynamicTarget(baseMin, baseMax) {
    const variation = 0.9 + (Math.random() * 0.2) // 90%-110% of base
    const adjustedMin = baseMin * variation
    const adjustedMax = baseMax * variation
    
    return {
      min: Math.round(adjustedMin),
      max: Math.round(adjustedMax),
      current: Math.round((adjustedMin + adjustedMax) / 2),
      lastUpdated: Date.now() - Math.random() * 3600000 // Within last hour
    }
  }

  /**
   * Get analytics insights and recommendations
   * In production, this would come from ML/AI analytics platforms
   */
  async getAnalyticsInsights() {
    await this.simulateNetworkDelay(500, 1200)
    
    return {
      trends: [
        {
          id: 'user_growth_acceleration',
          type: 'positive',
          confidence: this.generatePercentage(75, 95),
          description: 'User acquisition rate has increased by 23% over the past week',
          recommendation: 'Consider increasing marketing spend to capitalize on this trend',
          impact: 'high',
          timeframe: '7d'
        },
        {
          id: 'conversion_rate_decline',
          type: 'negative',
          confidence: this.generatePercentage(80, 92),
          description: 'Signup to first-deposit conversion has dropped by 8% in the last 3 days',
          recommendation: 'Review onboarding flow and identify friction points',
          impact: 'medium',
          timeframe: '3d'
        },
        {
          id: 'trading_volume_spike',
          type: 'neutral',
          confidence: this.generatePercentage(85, 98),
          description: 'Trading volume increased 45% during market volatility period',
          recommendation: 'Monitor system capacity and prepare for similar events',
          impact: 'medium',
          timeframe: '24h'
        }
      ],
      
      anomalies: [
        {
          id: 'unusual_signup_pattern',
          severity: 'medium',
          detected: Date.now() - Math.random() * 7200000, // Within 2 hours
          description: 'Signup rate 3x higher than normal from specific geographic region',
          possibleCauses: ['Marketing campaign', 'Viral content', 'Bot activity'],
          automaticActions: ['Rate limiting enabled', 'Enhanced verification triggered'],
          requiresReview: true
        },
        {
          id: 'api_response_degradation',
          severity: 'high',
          detected: Date.now() - Math.random() * 1800000, // Within 30 minutes
          description: 'API response times increased by 150% for portfolio endpoints',
          possibleCauses: ['Database performance', 'Increased load', 'Third-party service'],
          automaticActions: ['Alert sent to engineering', 'Auto-scaling triggered'],
          requiresReview: false
        }
      ],
      
      predictions: [
        {
          metric: 'user.acquisition.monthlyActiveUsers',
          horizon: '7d',
          prediction: Math.floor(Math.random() * 15000) + 12000,
          confidence: this.generatePercentage(70, 85),
          factors: ['Historical trends', 'Seasonal patterns', 'Marketing activities'],
          range: {
            lower: Math.floor(Math.random() * 12000) + 10000,
            upper: Math.floor(Math.random() * 18000) + 15000
          }
        },
        {
          metric: 'financial.revenue.totalRevenue',
          horizon: '30d',
          prediction: Math.floor(Math.random() * 2000000) + 1500000,
          confidence: this.generatePercentage(65, 80),
          factors: ['User growth', 'Market conditions', 'Product releases'],
          range: {
            lower: Math.floor(Math.random() * 1400000) + 1200000,
            upper: Math.floor(Math.random() * 2500000) + 2000000
          }
        }
      ],
      
      optimizationOpportunities: [
        {
          area: 'User Onboarding',
          potential: 'Reducing onboarding steps could increase conversion by 12-18%',
          effort: 'medium',
          impact: 'high',
          timeline: '2-4 weeks',
          requirements: ['UX design', 'Frontend development', 'A/B testing']
        },
        {
          area: 'API Performance',
          potential: 'Database query optimization could reduce response time by 35%',
          effort: 'low',
          impact: 'medium',
          timeline: '1-2 weeks',
          requirements: ['Database optimization', 'Performance testing']
        }
      ]
    }
  }

  /**
   * Generate percentage within range
   */
  generatePercentage(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 10) / 10
  }

  /**
   * Get all analytics data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllAnalyticsData() {
    // In production, this would be a single API call or parallel calls
    const [kpis, events, funnels, dashboards, insights] = await Promise.all([
      this.getBusinessKPIDefinitions(),
      this.getTrackingEventDefinitions(),
      this.getConversionFunnelDefinitions(),
      this.getDashboardMetricConfigurations(),
      this.getAnalyticsInsights()
    ])

    const allAnalyticsData = {
      kpis,
      events,
      funnels,
      dashboards,
      insights,
      timestamp: Date.now()
    }

    return allAnalyticsData
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 300, maxMs = 900) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates analytics data provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(100, 300)
      
      // Simulate occasional analytics service outages (1% chance)
      if (Math.random() < 0.01) {
        throw new Error('Mockup analytics data provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 400 + 200, // 200-600ms
        dataCategories: ['kpis', 'events', 'funnels', 'dashboards', 'insights'],
        totalKPIs: Math.floor(Math.random() * 50) + 75, // 75-125 KPIs
        totalEvents: Math.floor(Math.random() * 30) + 50, // 50-80 events
        analyticsIntegrations: ['Google Analytics', 'Mixpanel', 'Amplitude', 'Segment'],
        dataRetention: '365 days',
        lastKPIUpdate: Date.now() - Math.random() * 3600000 // Within last hour
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
export const mockupAnalyticsDataProviderService = new MockupAnalyticsDataProviderService()

// Export class for testing
export default MockupAnalyticsDataProviderService