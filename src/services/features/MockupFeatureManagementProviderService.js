/**
 * Mockup Feature Management Provider Service
 * Simulates 3rd party feature flag management APIs with realistic response times
 * This will be replaced with real feature management integrations (LaunchDarkly, Split, etc.)
 */

import logger from '../../utils/logger.js'

export class MockupFeatureManagementProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get feature flags configuration
   * In production, this would come from feature flag management platforms
   */
  async getFeatureFlags(userId = null, context = {}) {
    await this.simulateNetworkDelay(150, 400)
    
    // Generate dynamic feature availability based on user context
    const isEnabledForUser = (featureId, rolloutPercentage) => {
      if (userId) {
        // Consistent hash-based rollout simulation
        const hash = this.hashUserId(userId, featureId)
        return hash < rolloutPercentage
      }
      return Math.random() < (rolloutPercentage / 100)
    }

    return {
      features: {
        // Core Features
        new_transaction_flow: {
          id: 'new_transaction_flow',
          name: 'New Transaction Flow',
          description: 'Enhanced transaction user interface with improved UX',
          enabled: isEnabledForUser('new_transaction_flow', 75),
          rolloutPercentage: 75,
          targetingRules: [
            {
              type: 'user_segment',
              segment: 'premium_users',
              enabled: true
            },
            {
              type: 'geographic',
              countries: ['US', 'CA', 'EU'],
              enabled: true
            }
          ],
          environment: 'production',
          category: 'ui_enhancement',
          status: 'active',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: Date.now() - Math.random() * 86400000, // Within last day
          createdBy: 'product_team',
          tags: ['transaction', 'ui', 'ux', 'enhancement'],
          metrics: {
            impressions: this.generateNumber(50000, 100000),
            conversions: this.generateNumber(25000, 50000),
            conversionRate: this.generatePercentage(45, 55)
          }
        },

        advanced_portfolio_analytics: {
          id: 'advanced_portfolio_analytics',
          name: 'Advanced Portfolio Analytics',
          description: 'Detailed portfolio performance metrics and insights',
          enabled: isEnabledForUser('advanced_portfolio_analytics', 30),
          rolloutPercentage: 30,
          targetingRules: [
            {
              type: 'subscription_tier',
              tiers: ['premium', 'enterprise'],
              enabled: true
            },
            {
              type: 'user_attribute',
              attribute: 'portfolio_value',
              operator: 'greater_than',
              value: 10000,
              enabled: true
            }
          ],
          environment: 'production',
          category: 'feature_enhancement',
          status: 'ramping',
          createdAt: '2024-02-01T14:30:00Z',
          updatedAt: Date.now() - Math.random() * 43200000, // Within last 12 hours
          createdBy: 'analytics_team',
          tags: ['portfolio', 'analytics', 'premium', 'insights'],
          prerequisites: ['basic_analytics'],
          metrics: {
            impressions: this.generateNumber(15000, 30000),
            engagementRate: this.generatePercentage(65, 85),
            retentionRate: this.generatePercentage(70, 90)
          }
        },

        yield_farming_strategies: {
          id: 'yield_farming_strategies',
          name: 'Yield Farming Strategies',
          description: 'Automated yield farming and liquidity provision strategies',
          enabled: isEnabledForUser('yield_farming_strategies', 15),
          rolloutPercentage: 15,
          targetingRules: [
            {
              type: 'user_segment',
              segment: 'defi_users',
              enabled: true
            },
            {
              type: 'risk_tolerance',
              levels: ['high', 'very_high'],
              enabled: true
            }
          ],
          environment: 'production',
          category: 'new_feature',
          status: 'beta',
          createdAt: '2024-03-01T09:15:00Z',
          updatedAt: Date.now() - Math.random() * 3600000, // Within last hour
          createdBy: 'defi_team',
          tags: ['defi', 'yield', 'strategies', 'beta', 'advanced'],
          prerequisites: ['kyc_verified', 'advanced_user'],
          betaFeatures: {
            feedbackCollection: true,
            earlyAccess: true,
            limitedSupport: true
          },
          metrics: {
            betaUsers: this.generateNumber(500, 2000),
            feedbackScore: this.generatePercentage(70, 85),
            bugReports: this.generateNumber(5, 25)
          }
        },

        mobile_app_redesign: {
          id: 'mobile_app_redesign',
          name: 'Mobile App Redesign',
          description: 'New mobile application design and navigation',
          enabled: isEnabledForUser('mobile_app_redesign', 50),
          rolloutPercentage: 50,
          targetingRules: [
            {
              type: 'platform',
              platforms: ['mobile'],
              enabled: true
            },
            {
              type: 'app_version',
              operator: 'greater_than_equal',
              version: '2.1.0',
              enabled: true
            }
          ],
          environment: 'production',
          category: 'ui_redesign',
          status: 'active',
          createdAt: '2024-01-20T16:45:00Z',
          updatedAt: Date.now() - Math.random() * 21600000, // Within last 6 hours
          createdBy: 'mobile_team',
          tags: ['mobile', 'redesign', 'ui', 'navigation'],
          abTest: {
            enabled: true,
            variants: [
              {
                name: 'control',
                percentage: 25,
                description: 'Original design'
              },
              {
                name: 'variant_a',
                percentage: 25,
                description: 'New navigation structure'
              },
              {
                name: 'variant_b',
                percentage: 25,
                description: 'Enhanced visual design'
              },
              {
                name: 'variant_c',
                percentage: 25,
                description: 'Combined improvements'
              }
            ]
          },
          metrics: {
            totalUsers: this.generateNumber(25000, 50000),
            variantMetrics: {
              control: { conversionRate: this.generatePercentage(35, 45) },
              variant_a: { conversionRate: this.generatePercentage(40, 50) },
              variant_b: { conversionRate: this.generatePercentage(38, 48) },
              variant_c: { conversionRate: this.generatePercentage(42, 52) }
            }
          }
        },

        social_trading: {
          id: 'social_trading',
          name: 'Social Trading',
          description: 'Follow and copy successful trader strategies',
          enabled: isEnabledForUser('social_trading', 5),
          rolloutPercentage: 5,
          targetingRules: [
            {
              type: 'user_segment',
              segment: 'active_traders',
              enabled: true
            },
            {
              type: 'geographic',
              countries: ['US'],
              enabled: true
            }
          ],
          environment: 'production',
          category: 'experimental',
          status: 'alpha',
          createdAt: '2024-03-15T11:20:00Z',
          updatedAt: Date.now() - Math.random() * 1800000, // Within last 30 minutes
          createdBy: 'innovation_team',
          tags: ['social', 'trading', 'alpha', 'experimental'],
          prerequisites: ['verified_trader', 'kyc_enhanced'],
          alphaFeatures: {
            inviteOnly: true,
            limitedFeatures: true,
            intensiveMonitoring: true
          },
          risks: ['regulatory_uncertainty', 'performance_liability'],
          metrics: {
            alphaUsers: this.generateNumber(50, 200),
            tradingVolume: this.generateNumber(100000, 500000),
            successRate: this.generatePercentage(60, 75)
          }
        },

        // Infrastructure Features
        enhanced_security: {
          id: 'enhanced_security',
          name: 'Enhanced Security Features',
          description: 'Additional security layers and fraud detection',
          enabled: isEnabledForUser('enhanced_security', 90),
          rolloutPercentage: 90,
          targetingRules: [
            {
              type: 'all_users',
              enabled: true
            }
          ],
          environment: 'production',
          category: 'security',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: Date.now() - Math.random() * 604800000, // Within last week
          createdBy: 'security_team',
          tags: ['security', 'fraud_detection', 'authentication'],
          priority: 'critical',
          metrics: {
            threatsBlocked: this.generateNumber(1000, 5000),
            falsePositiveRate: this.generatePercentage(1, 3),
            securityScore: this.generatePercentage(95, 99)
          }
        },

        performance_monitoring: {
          id: 'performance_monitoring',
          name: 'Real-time Performance Monitoring',
          description: 'Enhanced application performance monitoring and alerts',
          enabled: isEnabledForUser('performance_monitoring', 85),
          rolloutPercentage: 85,
          targetingRules: [
            {
              type: 'user_type',
              types: ['internal', 'beta_tester'],
              enabled: true
            }
          ],
          environment: 'production',
          category: 'monitoring',
          status: 'active',
          createdAt: '2024-01-10T08:30:00Z',
          updatedAt: Date.now() - Math.random() * 259200000, // Within last 3 days
          createdBy: 'devops_team',
          tags: ['monitoring', 'performance', 'alerts', 'infrastructure'],
          metrics: {
            uptimeImprovement: this.generatePercentage(2, 5),
            alertAccuracy: this.generatePercentage(90, 98),
            meanTimeToDetection: `${this.generateNumber(30, 120)} seconds`
          }
        },

        // Business Features
        referral_program: {
          id: 'referral_program',
          name: 'Referral Program',
          description: 'User referral system with rewards and tracking',
          enabled: isEnabledForUser('referral_program', 60),
          rolloutPercentage: 60,
          targetingRules: [
            {
              type: 'user_segment',
              segment: 'active_users',
              enabled: true
            },
            {
              type: 'account_age',
              operator: 'greater_than',
              value: 30, // days
              enabled: true
            }
          ],
          environment: 'production',
          category: 'growth',
          status: 'active',
          createdAt: '2024-02-10T13:00:00Z',
          updatedAt: Date.now() - Math.random() * 172800000, // Within last 2 days
          createdBy: 'growth_team',
          tags: ['referral', 'rewards', 'growth', 'marketing'],
          rewardStructure: {
            referrer: { amount: 25, currency: 'USD' },
            referee: { amount: 15, currency: 'USD' }
          },
          metrics: {
            totalReferrals: this.generateNumber(2000, 8000),
            conversionRate: this.generatePercentage(15, 25),
            rewardsPaid: this.generateNumber(50000, 200000)
          }
        },

        premium_support: {
          id: 'premium_support',
          name: 'Premium Customer Support',
          description: 'Priority support and dedicated account management',
          enabled: isEnabledForUser('premium_support', 100),
          rolloutPercentage: 100,
          targetingRules: [
            {
              type: 'subscription_tier',
              tiers: ['premium', 'enterprise'],
              enabled: true
            }
          ],
          environment: 'production',
          category: 'support',
          status: 'active',
          createdAt: '2024-01-05T12:00:00Z',
          updatedAt: Date.now() - Math.random() * 432000000, // Within last 5 days
          createdBy: 'support_team',
          tags: ['support', 'premium', 'customer_service'],
          sla: {
            responseTime: '1 hour',
            resolutionTime: '24 hours',
            availability: '24/7'
          },
          metrics: {
            satisfactionScore: this.generatePercentage(90, 98),
            avgResponseTime: `${this.generateNumber(15, 45)} minutes`,
            resolutionRate: this.generatePercentage(85, 95)
          }
        }
      },
      
      // Global feature flag settings
      globalSettings: {
        defaultEnvironment: 'production',
        killSwitchEnabled: true,
        rollbackCapability: true,
        realTimeUpdates: true,
        audienceSegmentation: true,
        abTestingEnabled: true,
        metricsCollection: true,
        complianceMode: false
      },
      
      // User context information
      userContext: {
        userId: userId,
        context: context,
        evaluationTime: Date.now(),
        sdkVersion: '3.2.1',
        evaluationCount: this.generateNumber(1, 10)
      }
    }
  }

  /**
   * Get feature flag targeting rules and segments
   * In production, this would come from audience management systems
   */
  async getTargetingRulesAndSegments() {
    await this.simulateNetworkDelay(200, 500)
    
    return {
      segments: {
        premium_users: {
          id: 'premium_users',
          name: 'Premium Users',
          description: 'Users with premium subscription',
          rules: [
            {
              attribute: 'subscription_tier',
              operator: 'in',
              values: ['premium', 'enterprise']
            }
          ],
          userCount: this.generateNumber(5000, 15000),
          lastUpdated: Date.now() - Math.random() * 86400000
        },
        
        active_traders: {
          id: 'active_traders',
          name: 'Active Traders',
          description: 'Users who actively trade assets',
          rules: [
            {
              attribute: 'monthly_transactions',
              operator: 'greater_than',
              value: 10
            },
            {
              attribute: 'last_trade_date',
              operator: 'within_days',
              value: 30
            }
          ],
          userCount: this.generateNumber(8000, 25000),
          lastUpdated: Date.now() - Math.random() * 43200000
        },
        
        defi_users: {
          id: 'defi_users',
          name: 'DeFi Users',
          description: 'Users engaged with DeFi products',
          rules: [
            {
              attribute: 'used_defi_features',
              operator: 'equals',
              value: true
            },
            {
              attribute: 'defi_experience_level',
              operator: 'in',
              values: ['intermediate', 'advanced']
            }
          ],
          userCount: this.generateNumber(2000, 8000),
          lastUpdated: Date.now() - Math.random() * 21600000
        },
        
        high_value_users: {
          id: 'high_value_users',
          name: 'High Value Users',
          description: 'Users with significant portfolio value',
          rules: [
            {
              attribute: 'portfolio_value',
              operator: 'greater_than',
              value: 50000
            }
          ],
          userCount: this.generateNumber(1000, 5000),
          lastUpdated: Date.now() - Math.random() * 86400000
        },
        
        mobile_users: {
          id: 'mobile_users',
          name: 'Mobile Users',
          description: 'Users primarily using mobile app',
          rules: [
            {
              attribute: 'primary_platform',
              operator: 'equals',
              value: 'mobile'
            },
            {
              attribute: 'mobile_app_version',
              operator: 'greater_than_equal',
              value: '2.0.0'
            }
          ],
          userCount: this.generateNumber(15000, 40000),
          lastUpdated: Date.now() - Math.random() * 7200000
        }
      },
      
      targetingRules: {
        geographic: {
          type: 'geographic',
          description: 'Target users based on geographic location',
          operators: ['in', 'not_in'],
          attributes: ['country', 'region', 'city', 'timezone'],
          examples: {
            countries: ['US', 'CA', 'EU', 'UK', 'AU', 'JP'],
            regions: ['North America', 'Europe', 'Asia Pacific'],
            timezones: ['EST', 'PST', 'GMT', 'JST']
          }
        },
        
        demographic: {
          type: 'demographic',
          description: 'Target users based on demographic attributes',
          operators: ['equals', 'in', 'greater_than', 'less_than'],
          attributes: ['age', 'account_age', 'subscription_tier', 'user_type'],
          examples: {
            subscription_tiers: ['free', 'basic', 'premium', 'enterprise'],
            user_types: ['individual', 'business', 'institutional']
          }
        },
        
        behavioral: {
          type: 'behavioral',
          description: 'Target users based on behavioral patterns',
          operators: ['greater_than', 'less_than', 'between', 'within_days'],
          attributes: ['transaction_frequency', 'portfolio_value', 'last_login', 'feature_usage'],
          examples: {
            transaction_frequency: 'Number of transactions per month',
            feature_usage: 'Usage count of specific features'
          }
        },
        
        technical: {
          type: 'technical',
          description: 'Target users based on technical attributes',
          operators: ['equals', 'in', 'version_greater_than'],
          attributes: ['platform', 'app_version', 'browser', 'device_type'],
          examples: {
            platforms: ['web', 'mobile', 'desktop'],
            device_types: ['smartphone', 'tablet', 'desktop']
          }
        }
      }
    }
  }

  /**
   * Get feature flag analytics and performance metrics
   * In production, this would come from analytics platforms
   */
  async getFeatureFlagAnalytics(featureId = null, timeframe = '30d') {
    await this.simulateNetworkDelay(300, 700)
    
    const generateFeatureAnalytics = (id, enabled) => ({
      featureId: id,
      timeframe,
      metrics: {
        impressions: this.generateNumber(10000, 100000),
        uniqueUsers: this.generateNumber(5000, 50000),
        conversionEvents: this.generateNumber(2000, 25000),
        conversionRate: this.generatePercentage(15, 65),
        engagementRate: this.generatePercentage(30, 80),
        retentionRate: this.generatePercentage(60, 90),
        averageSessionDuration: `${this.generateNumber(3, 15)} minutes`,
        bounceRate: this.generatePercentage(10, 40)
      },
      
      performance: {
        loadTime: `${this.generateNumber(50, 200)}ms`,
        errorRate: this.generatePercentage(0.1, 2.0),
        availabilityUptime: this.generatePercentage(99.5, 99.99),
        apiResponseTime: `${this.generateNumber(100, 500)}ms`
      },
      
      rolloutProgress: {
        targetUsers: this.generateNumber(10000, 100000),
        enabledUsers: this.generateNumber(5000, 75000),
        rolloutPercentage: this.generatePercentage(5, 100),
        rolloutVelocity: `${this.generatePercentage(5, 20)}% per day`,
        estimatedCompletion: this.generateFutureDate(1, 30) // 1-30 days from now
      },
      
      feedback: {
        totaldback: this.generateNumber(50, 500),
        positiveRating: this.generatePercentage(60, 85),
        averageRating: this.generatePercentage(3.5, 4.8),
        commonPositives: ['improved_ui', 'faster_performance', 'better_usability'],
        commonNegatives: ['learning_curve', 'missing_features', 'bugs'],
        npsScore: this.generateNumber(30, 70)
      },
      
      businessImpact: {
        revenueImpact: this.generatePercentage(-5, 25),
        userAcquisition: this.generateNumber(-100, 1000),
        userRetention: this.generatePercentage(-2, 10),
        supportTickets: this.generateNumber(-50, 200),
        operationalCosts: this.generatePercentage(-10, 5)
      }
    })
    
    if (featureId) {
      return generateFeatureAnalytics(featureId, true)
    }
    
    // Return analytics for all features
    return {
      overview: {
        totalFeatures: this.generateNumber(15, 25),
        activeFeatures: this.generateNumber(10, 20),
        betaFeatures: this.generateNumber(2, 8),
        experimentalFeatures: this.generateNumber(1, 5),
        totalUsers: this.generateNumber(50000, 200000),
        flagEvaluations: this.generateNumber(1000000, 10000000)
      },
      
      topPerformingFeatures: [
        generateFeatureAnalytics('new_transaction_flow', true),
        generateFeatureAnalytics('advanced_portfolio_analytics', true),
        generateFeatureAnalytics('referral_program', true)
      ],
      
      underperformingFeatures: [
        {
          ...generateFeatureAnalytics('social_trading', false),
          issues: ['low_adoption', 'technical_complexity', 'user_confusion'],
          recommendations: ['improve_onboarding', 'simplify_ui', 'add_tutorials']
        }
      ],
      
      abTestResults: [
        {
          featureId: 'mobile_app_redesign',
          testName: 'Mobile Navigation Test',
          variants: [
            { name: 'control', users: 2500, conversionRate: 35.4 },
            { name: 'variant_a', users: 2500, conversionRate: 42.1 },
            { name: 'variant_b', users: 2500, conversionRate: 39.8 },
            { name: 'variant_c', users: 2500, conversionRate: 45.3 }
          ],
          statisticalSignificance: 95.6,
          winner: 'variant_c',
          liftImprovement: 28.0,
          recommendation: 'Deploy variant_c to 100% of users'
        }
      ]
    }
  }

  /**
   * Get feature flag configurations and management settings
   * In production, this would come from feature management platforms
   */
  async getFeatureManagementConfiguration() {
    await this.simulateNetworkDelay(250, 600)
    
    return {
      environments: {
        development: {
          name: 'Development',
          description: 'Local development environment',
          defaultEnabled: true,
          requireApproval: false,
          allowExperimentation: true,
          autoCleanup: true,
          maxFeatures: 1000
        },
        
        staging: {
          name: 'Staging',
          description: 'Pre-production testing environment',
          defaultEnabled: false,
          requireApproval: true,
          allowExperimentation: true,
          autoCleanup: false,
          maxFeatures: 500,
          approvers: ['qa_team', 'product_manager']
        },
        
        production: {
          name: 'Production',
          description: 'Live production environment',
          defaultEnabled: false,
          requireApproval: true,
          allowExperimentation: false,
          autoCleanup: false,
          maxFeatures: 100,
          approvers: ['product_manager', 'engineering_manager', 'cto'],
          killSwitchEnabled: true,
          rollbackCapability: true
        }
      },
      
      approvalWorkflow: {
        enabled: true,
        requiredApprovers: 2,
        approvalTimeout: '48 hours',
        escalationRules: [
          {
            condition: 'no_response_24h',
            action: 'escalate_to_manager'
          },
          {
            condition: 'high_risk_feature',
            action: 'require_security_review'
          }
        ],
        notificationChannels: ['email', 'slack', 'webhook']
      },
      
      rolloutStrategies: {
        percentage: {
          name: 'Percentage Rollout',
          description: 'Gradually roll out to percentage of users',
          parameters: ['percentage', 'increment_size', 'increment_frequency'],
          recommended: 'safe_and_controlled'
        },
        
        segment_based: {
          name: 'Segment-Based Rollout',
          description: 'Roll out to specific user segments',
          parameters: ['segments', 'priority_order', 'segment_percentage'],
          recommended: 'targeted_features'
        },
        
        ring_deployment: {
          name: 'Ring Deployment',
          description: 'Deploy in rings: internal → beta → production',
          parameters: ['ring_progression', 'validation_criteria', 'promotion_rules'],
          recommended: 'high_risk_features'
        },
        
        blue_green: {
          name: 'Blue-Green Deployment',
          description: 'Switch between two identical environments',
          parameters: ['switch_mechanism', 'rollback_trigger', 'validation_period'],
          recommended: 'infrastructure_changes'
        }
      },
      
      safetyMechanisms: {
        killSwitch: {
          enabled: true,
          triggerConditions: ['error_rate_spike', 'performance_degradation', 'user_complaints'],
          autoTrigger: true,
          notificationRequired: true,
          rollbackTime: '< 30 seconds'
        },
        
        circuitBreaker: {
          enabled: true,
          errorThreshold: 10, // errors per minute
          timeoutThreshold: 5000, // milliseconds
          retryPolicy: 'exponential_backoff',
          fallbackBehavior: 'default_experience'
        },
        
        monitoring: {
          realTimeAlerts: true,
          metricThresholds: {
            error_rate: 2.0, // percentage
            response_time: 2000, // milliseconds
            user_satisfaction: 70 // percentage
          },
          alertChannels: ['pagerduty', 'slack', 'email']
        }
      },
      
      compliance: {
        gdprCompliance: true,
        dataRetention: '2 years',
        userConsent: {
          required: false,
          granular: true,
          withdrawable: true
        },
        auditLogging: {
          enabled: true,
          retention: '7 years',
          encryption: true,
          immutable: true
        },
        privacyControls: {
          dataMinimization: true,
          purposeLimitation: true,
          userRights: ['access', 'rectification', 'erasure', 'portability']
        }
      }
    }
  }

  /**
   * Helper methods for data generation
   */
  
  hashUserId(userId, featureId) {
    // Simple hash function for consistent user assignment
    let hash = 0
    const str = `${userId}-${featureId}`
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100
  }

  generateNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  generatePercentage(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 10) / 10
  }

  generateFutureDate(minDays, maxDays) {
    const days = this.generateNumber(minDays, maxDays)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)
    return futureDate.toISOString()
  }

  /**
   * Get all feature management data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllFeatureManagementData(userId = null, context = {}) {
    // In production, this would be a single API call or parallel calls
    const [flags, targeting, analytics, configuration] = await Promise.all([
      this.getFeatureFlags(userId, context),
      this.getTargetingRulesAndSegments(),
      this.getFeatureFlagAnalytics(),
      this.getFeatureManagementConfiguration()
    ])

    const allFeatureData = {
      flags,
      targeting,
      analytics,
      configuration,
      timestamp: Date.now()
    }

    return allFeatureData
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 150, maxMs = 400) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates feature management provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 200)
      
      // Simulate occasional feature management service outages (1% chance)
      if (Math.random() < 0.01) {
        throw new Error('Mockup feature management provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 250 + 100, // 100-350ms
        totalFeatures: this.generateNumber(15, 25),
        activeFeatures: this.generateNumber(10, 20),
        environments: ['development', 'staging', 'production'],
        supportedRolloutStrategies: ['percentage', 'segment_based', 'ring_deployment', 'blue_green'],
        integrations: ['LaunchDarkly', 'Split', 'Optimizely', 'ConfigCat'],
        safetyFeatures: ['kill_switch', 'circuit_breaker', 'auto_rollback'],
        lastFlagUpdate: Date.now() - Math.random() * 600000, // Within last 10 minutes
        evaluationLatency: Math.random() * 50 + 10 // 10-60ms
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
export const mockupFeatureManagementProviderService = new MockupFeatureManagementProviderService()

// Export class for testing
export default MockupFeatureManagementProviderService