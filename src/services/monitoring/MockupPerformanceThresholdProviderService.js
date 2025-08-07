/**
 * Mockup Performance Threshold Provider Service
 * Simulates 3rd party monitoring and alerting APIs with realistic response times
 * This will be replaced with real monitoring integrations (DataDog, New Relic, etc.)
 */

import logger from '../../utils/logger.js'

export class MockupPerformanceThresholdProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get system performance thresholds
   * In production, this would come from monitoring platforms
   */
  async getSystemPerformanceThresholds() {
    await this.simulateNetworkDelay(300, 800)
    
    return {
      infrastructure: {
        cpu: {
          warning: this.generateDynamicThreshold(70, 75),
          critical: this.generateDynamicThreshold(85, 90),
          unit: 'percentage',
          windowSize: 300000, // 5 minutes
          evaluationInterval: 60000, // 1 minute
          consecutive: 3 // consecutive breaches before alert
        },
        
        memory: {
          warning: this.generateDynamicThreshold(75, 80),
          critical: this.generateDynamicThreshold(90, 95),
          unit: 'percentage',
          windowSize: 300000, // 5 minutes
          evaluationInterval: 60000, // 1 minute
          consecutive: 3
        },
        
        disk: {
          warning: this.generateDynamicThreshold(80, 85),
          critical: this.generateDynamicThreshold(90, 95),
          unit: 'percentage',
          windowSize: 900000, // 15 minutes
          evaluationInterval: 300000, // 5 minutes
          consecutive: 2
        },
        
        network: {
          latency: {
            warning: this.generateDynamicThreshold(100, 150), // ms
            critical: this.generateDynamicThreshold(300, 500), // ms
            unit: 'milliseconds',
            windowSize: 180000, // 3 minutes
            evaluationInterval: 30000 // 30 seconds
          },
          
          throughput: {
            warning: this.generateDynamicThreshold(800, 900), // Mbps
            critical: this.generateDynamicThreshold(950, 1000), // Mbps
            unit: 'mbps',
            windowSize: 300000, // 5 minutes
            evaluationInterval: 60000 // 1 minute
          },
          
          errorRate: {
            warning: this.generateDynamicThreshold(1, 2), // %
            critical: this.generateDynamicThreshold(5, 8), // %
            unit: 'percentage',
            windowSize: 600000, // 10 minutes
            evaluationInterval: 60000 // 1 minute
          }
        }
      },
      
      database: {
        connectionPool: {
          warning: this.generateDynamicThreshold(80, 85),
          critical: this.generateDynamicThreshold(95, 98),
          unit: 'percentage',
          windowSize: 300000,
          evaluationInterval: 60000
        },
        
        queryTime: {
          warning: this.generateDynamicThreshold(500, 750), // ms
          critical: this.generateDynamicThreshold(2000, 5000), // ms
          unit: 'milliseconds',
          windowSize: 300000,
          evaluationInterval: 30000,
          percentile: 95 // P95
        },
        
        lockWaitTime: {
          warning: this.generateDynamicThreshold(100, 200), // ms
          critical: this.generateDynamicThreshold(1000, 2000), // ms
          unit: 'milliseconds',
          windowSize: 600000,
          evaluationInterval: 60000
        },
        
        replicationLag: {
          warning: this.generateDynamicThreshold(5, 10), // seconds
          critical: this.generateDynamicThreshold(30, 60), // seconds
          unit: 'seconds',
          windowSize: 300000,
          evaluationInterval: 60000
        }
      },
      
      blockchain: {
        nodeSync: {
          warning: this.generateDynamicThreshold(10, 20), // blocks behind
          critical: this.generateDynamicThreshold(100, 200), // blocks behind
          unit: 'blocks',
          windowSize: 600000,
          evaluationInterval: 120000 // 2 minutes
        },
        
        gasPrice: {
          warning: this.generateDynamicThreshold(50, 100), // gwei
          critical: this.generateDynamicThreshold(200, 500), // gwei
          unit: 'gwei',
          windowSize: 300000,
          evaluationInterval: 60000,
          chains: ['ethereum', 'polygon', 'bsc']
        },
        
        transactionPool: {
          warning: this.generateDynamicThreshold(10000, 15000), // pending txs
          critical: this.generateDynamicThreshold(50000, 100000), // pending txs
          unit: 'transactions',
          windowSize: 300000,
          evaluationInterval: 60000
        }
      }
    }
  }

  /**
   * Get application performance thresholds
   * In production, this would come from APM tools
   */
  async getApplicationPerformanceThresholds() {
    await this.simulateNetworkDelay(250, 600)
    
    return {
      api: {
        responseTime: {
          warning: this.generateDynamicThreshold(200, 300), // ms
          critical: this.generateDynamicThreshold(1000, 2000), // ms
          unit: 'milliseconds',
          windowSize: 300000,
          evaluationInterval: 60000,
          endpoints: {
            '/api/auth/login': { warning: 150, critical: 500 },
            '/api/transactions': { warning: 300, critical: 1000 },
            '/api/portfolio': { warning: 400, critical: 1500 },
            '/api/market-data': { warning: 100, critical: 300 }
          }
        },
        
        errorRate: {
          warning: this.generateDynamicThreshold(1, 2), // %
          critical: this.generateDynamicThreshold(5, 10), // %
          unit: 'percentage',
          windowSize: 600000,
          evaluationInterval: 60000,
          excludeStatus: [401, 403] // Exclude auth errors
        },
        
        throughput: {
          warning: this.generateDynamicThreshold(500, 800), // req/min
          critical: this.generateDynamicThreshold(100, 300), // req/min
          unit: 'requests_per_minute',
          windowSize: 300000,
          evaluationInterval: 60000,
          direction: 'below' // Alert when below threshold
        },
        
        concurrency: {
          warning: this.generateDynamicThreshold(800, 900), // concurrent users
          critical: this.generateDynamicThreshold(1000, 1200), // concurrent users
          unit: 'concurrent_connections',
          windowSize: 300000,
          evaluationInterval: 30000
        }
      },
      
      frontend: {
        pageLoadTime: {
          warning: this.generateDynamicThreshold(2000, 3000), // ms
          critical: this.generateDynamicThreshold(5000, 8000), // ms
          unit: 'milliseconds',
          windowSize: 900000, // 15 minutes
          evaluationInterval: 300000, // 5 minutes
          percentile: 90
        },
        
        jsErrorRate: {
          warning: this.generateDynamicThreshold(0.5, 1), // %
          critical: this.generateDynamicThreshold(2, 5), // %
          unit: 'percentage',
          windowSize: 900000,
          evaluationInterval: 300000,
          ignorePatterns: ['AdBlock', 'Extension']
        },
        
        bounceRate: {
          warning: this.generateDynamicThreshold(60, 70), // %
          critical: this.generateDynamicThreshold(80, 90), // %
          unit: 'percentage',
          windowSize: 3600000, // 1 hour
          evaluationInterval: 900000 // 15 minutes
        },
        
        coreWebVitals: {
          lcp: { // Largest Contentful Paint
            warning: this.generateDynamicThreshold(2.5, 3), // seconds
            critical: this.generateDynamicThreshold(4, 5), // seconds
            unit: 'seconds'
          },
          fid: { // First Input Delay
            warning: this.generateDynamicThreshold(100, 150), // ms
            critical: this.generateDynamicThreshold(300, 500), // ms
            unit: 'milliseconds'
          },
          cls: { // Cumulative Layout Shift
            warning: this.generateDynamicThreshold(0.1, 0.15),
            critical: this.generateDynamicThreshold(0.25, 0.3),
            unit: 'score'
          }
        }
      },
      
      business: {
        conversionRate: {
          warning: this.generateDynamicThreshold(2, 3), // % (below threshold)
          critical: this.generateDynamicThreshold(1, 1.5), // % (below threshold)
          unit: 'percentage',
          windowSize: 3600000, // 1 hour
          evaluationInterval: 900000, // 15 minutes
          direction: 'below'
        },
        
        averageOrderValue: {
          warning: this.generateDynamicThreshold(80, 90), // % of baseline
          critical: this.generateDynamicThreshold(60, 70), // % of baseline
          unit: 'percentage',
          windowSize: 3600000,
          evaluationInterval: 900000,
          direction: 'below'
        },
        
        userRetention: {
          warning: this.generateDynamicThreshold(70, 75), // % (7-day retention)
          critical: this.generateDynamicThreshold(50, 60), // % (7-day retention)
          unit: 'percentage',
          windowSize: 86400000, // 24 hours
          evaluationInterval: 3600000, // 1 hour
          direction: 'below'
        }
      }
    }
  }

  /**
   * Get security monitoring thresholds
   * In production, this would come from SIEM systems
   */
  async getSecurityMonitoringThresholds() {
    await this.simulateNetworkDelay(400, 900)
    
    return {
      authentication: {
        failedLoginAttempts: {
          warning: this.generateDynamicThreshold(5, 8), // attempts per user
          critical: this.generateDynamicThreshold(15, 25), // attempts per user
          unit: 'attempts',
          windowSize: 900000, // 15 minutes
          evaluationInterval: 300000, // 5 minutes
          lockoutDuration: 900000 // 15 minutes
        },
        
        suspiciousLogins: {
          warning: this.generateDynamicThreshold(3, 5), // per hour
          critical: this.generateDynamicThreshold(10, 20), // per hour
          unit: 'logins_per_hour',
          windowSize: 3600000, // 1 hour
          evaluationInterval: 600000, // 10 minutes
          indicators: ['new_location', 'new_device', 'tor_usage']
        },
        
        sessionAnomalies: {
          warning: this.generateDynamicThreshold(2, 3), // % of sessions
          critical: this.generateDynamicThreshold(5, 8), // % of sessions
          unit: 'percentage',
          windowSize: 3600000,
          evaluationInterval: 900000,
          types: ['concurrent_sessions', 'session_hijacking', 'privilege_escalation']
        }
      },
      
      transactions: {
        velocityAlerts: {
          warning: this.generateDynamicThreshold(10, 15), // tx per minute per user
          critical: this.generateDynamicThreshold(50, 100), // tx per minute per user
          unit: 'transactions_per_minute',
          windowSize: 600000, // 10 minutes
          evaluationInterval: 60000 // 1 minute
        },
        
        amountAnomalies: {
          warning: this.generateDynamicThreshold(500, 1000), // % above user average
          critical: this.generateDynamicThreshold(1000, 2000), // % above user average
          unit: 'percentage_above_baseline',
          windowSize: 86400000, // 24 hours
          evaluationInterval: 600000, // 10 minutes
          baselinePeriod: 2592000000 // 30 days
        },
        
        fraudIndicators: {
          warning: this.generateDynamicThreshold(0.1, 0.2), // % of transactions
          critical: this.generateDynamicThreshold(0.5, 1), // % of transactions
          unit: 'percentage',
          windowSize: 3600000, // 1 hour
          evaluationInterval: 300000, // 5 minutes
          indicators: ['blacklisted_address', 'mixer_usage', 'unusual_pattern']
        }
      },
      
      systemAccess: {
        privilegedAccess: {
          warning: this.generateDynamicThreshold(5, 10), // admin actions per hour
          critical: this.generateDynamicThreshold(25, 50), // admin actions per hour
          unit: 'actions_per_hour',
          windowSize: 3600000,
          evaluationInterval: 600000,
          requiresApproval: true
        },
        
        dataAccess: {
          warning: this.generateDynamicThreshold(100, 200), // sensitive records per hour
          critical: this.generateDynamicThreshold(1000, 2000), // sensitive records per hour
          unit: 'records_per_hour',
          windowSize: 3600000,
          evaluationInterval: 600000,
          dataClassification: ['PII', 'financial', 'confidential']
        },
        
        apiAbuse: {
          warning: this.generateDynamicThreshold(1000, 2000), // requests per minute per key
          critical: this.generateDynamicThreshold(5000, 10000), // requests per minute per key
          unit: 'requests_per_minute',
          windowSize: 300000, // 5 minutes
          evaluationInterval: 60000 // 1 minute
        }
      }
    }
  }

  /**
   * Get financial performance thresholds
   * In production, this would come from risk management systems
   */
  async getFinancialPerformanceThresholds() {
    await this.simulateNetworkDelay(350, 750)
    
    return {
      portfolio: {
        drawdown: {
          warning: this.generateDynamicThreshold(5, 8), // %
          critical: this.generateDynamicThreshold(15, 20), // %
          unit: 'percentage',
          windowSize: 86400000, // 24 hours
          evaluationInterval: 3600000, // 1 hour
          portfolioTypes: {
            'conservative': { warning: 3, critical: 8 },
            'moderate': { warning: 8, critical: 15 },
            'aggressive': { warning: 15, critical: 25 }
          }
        },
        
        volatility: {
          warning: this.generateDynamicThreshold(15, 20), // % (30-day)
          critical: this.generateDynamicThreshold(30, 40), // % (30-day)
          unit: 'percentage',
          windowSize: 2592000000, // 30 days
          evaluationInterval: 86400000, // 24 hours
          method: 'standard_deviation'
        },
        
        concentration: {
          warning: this.generateDynamicThreshold(25, 30), // % single asset
          critical: this.generateDynamicThreshold(40, 50), // % single asset
          unit: 'percentage',
          windowSize: 86400000,
          evaluationInterval: 3600000,
          assetTypes: ['crypto', 'stocks', 'bonds', 'commodities']
        },
        
        correlation: {
          warning: this.generateDynamicThreshold(0.7, 0.8),
          critical: this.generateDynamicThreshold(0.9, 0.95),
          unit: 'correlation_coefficient',
          windowSize: 2592000000, // 30 days
          evaluationInterval: 86400000,
          method: 'pearson'
        }
      },
      
      liquidity: {
        cashRatio: {
          warning: this.generateDynamicThreshold(2, 5), // % (below threshold)
          critical: this.generateDynamicThreshold(1, 2), // % (below threshold)
          unit: 'percentage',
          windowSize: 86400000,
          evaluationInterval: 3600000,
          direction: 'below'
        },
        
        liquidationTime: {
          warning: this.generateDynamicThreshold(24, 48), // hours
          critical: this.generateDynamicThreshold(72, 168), // hours
          unit: 'hours',
          windowSize: 86400000,
          evaluationInterval: 3600000,
          percentile: 90 // 90th percentile of holdings
        },
        
        spreadImpact: {
          warning: this.generateDynamicThreshold(0.5, 1), // % slippage
          critical: this.generateDynamicThreshold(2, 5), // % slippage
          unit: 'percentage',
          windowSize: 3600000, // 1 hour
          evaluationInterval: 300000, // 5 minutes
          orderSize: '100k_usd'
        }
      },
      
      risk: {
        var: { // Value at Risk
          warning: this.generateDynamicThreshold(2, 3), // % (1-day, 95% confidence)
          critical: this.generateDynamicThreshold(5, 8), // % (1-day, 95% confidence)
          unit: 'percentage',
          windowSize: 86400000,
          evaluationInterval: 3600000,
          confidence: 95,
          horizon: '1_day'
        },
        
        beta: {
          warning: this.generateDynamicThreshold(1.5, 2), // vs market
          critical: this.generateDynamicThreshold(3, 5), // vs market
          unit: 'ratio',
          windowSize: 2592000000, // 30 days
          evaluationInterval: 86400000,
          benchmark: 'market_index'
        },
        
        sharpeRatio: {
          warning: this.generateDynamicThreshold(0.5, 0.8), // (below threshold)
          critical: this.generateDynamicThreshold(0, 0.3), // (below threshold)
          unit: 'ratio',
          windowSize: 7776000000, // 90 days
          evaluationInterval: 86400000,
          direction: 'below',
          riskFreeRate: 0.03 // 3% annual
        }
      },
      
      compliance: {
        positionLimits: {
          warning: this.generateDynamicThreshold(80, 85), // % of regulatory limit
          critical: this.generateDynamicThreshold(95, 98), // % of regulatory limit
          unit: 'percentage',
          windowSize: 86400000,
          evaluationInterval: 3600000,
          regulations: ['CFTC', 'SEC', 'FINRA']
        },
        
        leverageRatio: {
          warning: this.generateDynamicThreshold(8, 10), // 8:1 to 10:1
          critical: this.generateDynamicThreshold(15, 20), // 15:1 to 20:1
          unit: 'ratio',
          windowSize: 86400000,
          evaluationInterval: 3600000,
          jurisdiction: 'US'
        }
      }
    }
  }

  /**
   * Generate dynamic threshold with market conditions
   */
  generateDynamicThreshold(baseMin, baseMax) {
    const marketVolatility = 0.8 + (Math.random() * 0.4) // 80%-120% adjustment
    const adjustedMin = baseMin * marketVolatility
    const adjustedMax = baseMax * marketVolatility
    
    return {
      min: Math.round(adjustedMin * 100) / 100,
      max: Math.round(adjustedMax * 100) / 100,
      current: Math.round((adjustedMin + adjustedMax) / 2 * 100) / 100,
      lastAdjusted: Date.now() - Math.random() * 3600000 // Within last hour
    }
  }

  /**
   * Get alerting configuration
   * In production, this would come from alerting platforms
   */
  async getAlertingConfiguration() {
    await this.simulateNetworkDelay(200, 500)
    
    return {
      channels: {
        email: {
          enabled: true,
          severity: ['critical', 'warning'],
          recipients: ['ops@example.com', 'alerts@example.com'],
          template: 'performance_alert',
          rateLimit: {
            maxPerHour: 10,
            suppressDuplicates: 300000 // 5 minutes
          }
        },
        
        slack: {
          enabled: true,
          severity: ['critical'],
          webhook: 'https://hooks.slack.com/services/...',
          channel: '#alerts',
          mentionUsers: ['@oncall', '@devops'],
          rateLimit: {
            maxPerHour: 20,
            suppressDuplicates: 180000 // 3 minutes
          }
        },
        
        pagerduty: {
          enabled: true,
          severity: ['critical'],
          integrationKey: 'pd_integration_key',
          escalationPolicy: 'engineering_escalation',
          autoResolve: true,
          resolveTimeout: 1800000 // 30 minutes
        },
        
        webhook: {
          enabled: true,
          severity: ['critical', 'warning'],
          endpoints: [
            {
              url: 'https://monitoring.example.com/alerts',
              method: 'POST',
              headers: { 'Authorization': 'Bearer token' },
              retries: 3
            }
          ]
        }
      },
      
      escalation: {
        levels: [
          {
            level: 1,
            delay: 0, // immediate
            channels: ['slack', 'email']
          },
          {
            level: 2,
            delay: 900000, // 15 minutes
            channels: ['pagerduty'],
            condition: 'unacknowledged'
          },
          {
            level: 3,
            delay: 1800000, // 30 minutes
            channels: ['pagerduty'],
            condition: 'unresolved',
            escalateTo: 'management'
          }
        ]
      },
      
      suppression: {
        maintenanceWindow: {
          enabled: false,
          start: null,
          end: null,
          suppressAll: false,
          allowCritical: true
        },
        
        rules: [
          {
            condition: 'deployment_in_progress',
            suppress: ['warning'],
            duration: 1800000 // 30 minutes
          },
          {
            condition: 'scheduled_maintenance',
            suppress: ['warning', 'critical'],
            duration: 3600000 // 1 hour
          }
        ]
      }
    }
  }

  /**
   * Get performance monitoring analytics
   * In production, this would come from analytics platforms
   */
  async getPerformanceAnalytics() {
    await this.simulateNetworkDelay(500, 1000)
    
    return {
      alertStatistics: {
        last24Hours: {
          total: Math.floor(Math.random() * 50) + 20,
          critical: Math.floor(Math.random() * 5) + 2,
          warning: Math.floor(Math.random() * 15) + 8,
          info: Math.floor(Math.random() * 30) + 10
        },
        
        last7Days: {
          total: Math.floor(Math.random() * 200) + 100,
          critical: Math.floor(Math.random() * 20) + 10,
          warning: Math.floor(Math.random() * 80) + 40,
          info: Math.floor(Math.random() * 100) + 50
        },
        
        resolution: {
          averageTime: Math.floor(Math.random() * 30) + 15, // minutes
          slaCompliance: this.generatePercentage(85, 95),
          escalationRate: this.generatePercentage(5, 15)
        }
      },
      
      thresholdEffectiveness: {
        falsePositiveRate: this.generatePercentage(8, 15),
        truePositiveRate: this.generatePercentage(82, 94),
        sensitivity: this.generatePercentage(88, 96),
        specificity: this.generatePercentage(85, 92),
        
        mostTriggeredThresholds: [
          { threshold: 'api.responseTime.warning', count: Math.floor(Math.random() * 50) + 25 },
          { threshold: 'system.cpu.warning', count: Math.floor(Math.random() * 40) + 20 },
          { threshold: 'database.queryTime.critical', count: Math.floor(Math.random() * 30) + 10 }
        ]
      },
      
      performanceTrends: {
        systemHealth: {
          current: this.generatePercentage(92, 98),
          trend: Math.random() > 0.5 ? 'improving' : 'stable',
          weeklyChange: (Math.random() - 0.5) * 10 // ±5%
        },
        
        alertVolume: {
          current: Math.floor(Math.random() * 20) + 30, // per day
          trend: Math.random() > 0.6 ? 'decreasing' : 'stable',
          weeklyChange: (Math.random() - 0.5) * 40 // ±20%
        },
        
        responseTime: {
          p50: Math.floor(Math.random() * 100) + 50, // ms
          p90: Math.floor(Math.random() * 300) + 150, // ms
          p99: Math.floor(Math.random() * 800) + 400, // ms
          trend: Math.random() > 0.4 ? 'stable' : 'improving'
        }
      }
    }
  }

  /**
   * Generate percentage within range
   */
  generatePercentage(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 10) / 10
  }

  /**
   * Get all performance threshold data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllPerformanceThresholdData() {
    // In production, this would be a single API call or parallel calls
    const [system, application, security, financial, alerting, analytics] = await Promise.all([
      this.getSystemPerformanceThresholds(),
      this.getApplicationPerformanceThresholds(),
      this.getSecurityMonitoringThresholds(),
      this.getFinancialPerformanceThresholds(),
      this.getAlertingConfiguration(),
      this.getPerformanceAnalytics()
    ])

    const allThresholdData = {
      thresholds: {
        system,
        application,
        security,
        financial
      },
      alerting,
      analytics,
      timestamp: Date.now()
    }

    return allThresholdData
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 300, maxMs = 900) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates performance threshold provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(100, 300)
      
      // Simulate occasional monitoring service outages (1% chance)
      if (Math.random() < 0.01) {
        throw new Error('Mockup performance threshold provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 400 + 200, // 200-600ms
        thresholdCategories: ['system', 'application', 'security', 'financial'],
        activeThresholds: Math.floor(Math.random() * 200) + 150, // 150-350 thresholds
        alertingChannels: ['email', 'slack', 'pagerduty', 'webhook'],
        monitoringIntegrations: ['DataDog', 'New Relic', 'Grafana', 'Prometheus'],
        lastThresholdUpdate: Date.now() - Math.random() * 3600000 // Within last hour
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
export const mockupPerformanceThresholdProviderService = new MockupPerformanceThresholdProviderService()

// Export class for testing
export default MockupPerformanceThresholdProviderService