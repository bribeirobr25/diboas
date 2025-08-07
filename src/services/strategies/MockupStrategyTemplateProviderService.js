/**
 * Mockup Strategy Template Provider Service
 * Simulates 3rd party strategy template APIs with realistic response times
 * This will be replaced with real strategy provider integrations
 */

import logger from '../../utils/logger.js'

export class MockupStrategyTemplateProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get all available strategy templates
   * In production, this would come from business analysts or strategy management APIs
   */
  async getStrategyTemplates() {
    await this.simulateNetworkDelay(200, 600)
    
    // Simulate template availability variations
    const generateAvailability = () => Math.random() > 0.1 // 90% chance available

    return [
      {
        id: 'emergency_fund',
        title: 'Emergency Fund',
        icon: '🛡️',
        defaultImage: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=800',
        suggestedAmount: this.generateSuggestedAmount(1000, 5000),
        riskLevel: 'conservative',
        description: 'Build a safety net for unexpected expenses',
        category: 'safety',
        available: generateAvailability(),
        popularity: Math.floor(Math.random() * 1000) + 500, // 500-1500 users
        timeframe: '3-6 months',
        features: ['Low risk', 'High liquidity', 'Stable returns']
      },
      {
        id: 'free_coffee',
        title: 'Free Coffee',
        icon: '☕',
        defaultImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
        suggestedAmount: this.generateSuggestedAmount(100, 500),
        riskLevel: 'moderate',
        description: 'Earn enough to cover your daily coffee habit',
        category: 'lifestyle',
        available: generateAvailability(),
        popularity: Math.floor(Math.random() * 800) + 300,
        timeframe: '1-2 months',
        features: ['Quick returns', 'Low commitment', 'Fun goal']
      },
      {
        id: 'home_down_payment',
        title: 'Home Down Payment',
        icon: '🏠',
        defaultImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
        suggestedAmount: this.generateSuggestedAmount(20000, 100000),
        riskLevel: 'balanced',
        description: 'Save for your dream home down payment',
        category: 'major_purchase',
        available: generateAvailability(),
        popularity: Math.floor(Math.random() * 600) + 200,
        timeframe: '2-5 years',
        features: ['Long-term growth', 'Milestone tracking', 'Tax benefits']
      },
      {
        id: 'vacation_fund',
        title: 'Dream Vacation',
        icon: '✈️',
        defaultImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
        suggestedAmount: this.generateSuggestedAmount(2000, 15000),
        riskLevel: 'moderate',
        description: 'Fund your next adventure',
        category: 'lifestyle',
        available: generateAvailability(),
        popularity: Math.floor(Math.random() * 900) + 400,
        timeframe: '6-18 months',
        features: ['Medium risk', 'Growth potential', 'Flexible timeline']
      },
      {
        id: 'retirement_boost',
        title: 'Retirement Boost',
        icon: '🌅',
        defaultImage: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=800',
        suggestedAmount: this.generateSuggestedAmount(10000, 50000),
        riskLevel: 'aggressive',
        description: 'Accelerate your retirement savings',
        category: 'retirement',
        available: generateAvailability(),
        popularity: Math.floor(Math.random() * 400) + 150,
        timeframe: '10+ years',
        features: ['High growth potential', 'Tax advantages', 'Compound interest']
      },
      {
        id: 'car_upgrade',
        title: 'Car Upgrade',
        icon: '🚗',
        defaultImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
        suggestedAmount: this.generateSuggestedAmount(15000, 60000),
        riskLevel: 'balanced',
        description: 'Save for a reliable new vehicle',
        category: 'major_purchase',
        available: generateAvailability(),
        popularity: Math.floor(Math.random() * 700) + 250,
        timeframe: '1-3 years',
        features: ['Moderate growth', 'Practical goal', 'Asset building']
      },
      {
        id: 'education_fund',
        title: 'Education Fund',
        icon: '🎓',
        defaultImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9d1?w=800',
        suggestedAmount: this.generateSuggestedAmount(5000, 40000),
        riskLevel: 'conservative',
        description: 'Invest in education and skills',
        category: 'education',
        available: generateAvailability(),
        popularity: Math.floor(Math.random() * 500) + 200,
        timeframe: '6 months - 4 years',
        features: ['Knowledge investment', 'Career growth', 'Stable approach']
      },
      {
        id: 'wedding_fund',
        title: 'Wedding Fund',
        icon: '💍',
        defaultImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
        suggestedAmount: this.generateSuggestedAmount(10000, 50000),
        riskLevel: 'moderate',
        description: 'Plan the perfect wedding celebration',
        category: 'life_events',
        available: generateAvailability(),
        popularity: Math.floor(Math.random() * 600) + 180,
        timeframe: '1-2 years',
        features: ['Special occasion', 'Milestone saving', 'Celebration fund']
      },
      {
        id: 'business_startup',
        title: 'Business Startup',
        icon: '🚀',
        defaultImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
        suggestedAmount: this.generateSuggestedAmount(25000, 100000),
        riskLevel: 'aggressive',
        description: 'Fund your entrepreneurial dreams',
        category: 'business',
        available: generateAvailability(),
        popularity: Math.floor(Math.random() * 300) + 100,
        timeframe: '1-5 years',
        features: ['High risk/reward', 'Business growth', 'Innovation fund']
      }
    ]
  }

  /**
   * Get strategy templates by category
   */
  async getTemplatesByCategory(category) {
    await this.simulateNetworkDelay(100, 300)
    
    const allTemplates = await this.getStrategyTemplates()
    return allTemplates.filter(template => template.category === category)
  }

  /**
   * Get strategy templates by risk level
   */
  async getTemplatesByRiskLevel(riskLevel) {
    await this.simulateNetworkDelay(100, 300)
    
    const allTemplates = await this.getStrategyTemplates()
    return allTemplates.filter(template => template.riskLevel === riskLevel)
  }

  /**
   * Get popular strategy templates
   */
  async getPopularTemplates(limit = 5) {
    await this.simulateNetworkDelay(150, 400)
    
    const allTemplates = await this.getStrategyTemplates()
    return allTemplates
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit)
  }

  /**
   * Get strategy template by ID
   */
  async getTemplateById(templateId) {
    await this.simulateNetworkDelay(50, 200)
    
    const allTemplates = await this.getStrategyTemplates()
    return allTemplates.find(template => template.id === templateId)
  }

  /**
   * Get strategy template categories
   */
  async getTemplateCategories() {
    await this.simulateNetworkDelay(100, 250)
    
    return [
      {
        id: 'safety',
        name: 'Safety & Security',
        description: 'Conservative strategies focused on capital preservation',
        icon: '🛡️',
        count: Math.floor(Math.random() * 50) + 20
      },
      {
        id: 'lifestyle',
        name: 'Lifestyle Goals',
        description: 'Fun and practical everyday objectives',
        icon: '🎯',
        count: Math.floor(Math.random() * 80) + 30
      },
      {
        id: 'major_purchase',
        name: 'Major Purchases',
        description: 'Save for significant life purchases',
        icon: '🏠',
        count: Math.floor(Math.random() * 40) + 15
      },
      {
        id: 'retirement',
        name: 'Retirement Planning',
        description: 'Long-term wealth building strategies',
        icon: '🌅',
        count: Math.floor(Math.random() * 30) + 10
      },
      {
        id: 'education',
        name: 'Education & Skills',
        description: 'Invest in knowledge and career growth',
        icon: '🎓',
        count: Math.floor(Math.random() * 25) + 10
      },
      {
        id: 'life_events',
        name: 'Life Events',
        description: 'Special occasions and milestones',
        icon: '🎉',
        count: Math.floor(Math.random() * 35) + 15
      },
      {
        id: 'business',
        name: 'Business & Investment',
        description: 'Entrepreneurial and investment goals',
        icon: '🚀',
        count: Math.floor(Math.random() * 20) + 8
      }
    ]
  }

  /**
   * Generate realistic suggested amounts with variation
   */
  generateSuggestedAmount(min, max) {
    const variation = (Math.random() - 0.5) * 0.2 // ±10% variation
    const baseAmount = Math.random() * (max - min) + min
    return Math.round(baseAmount * (1 + variation))
  }

  /**
   * Get all strategy template data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllStrategyData() {
    // In production, this would be a single API call or parallel calls
    const [templates, categories] = await Promise.all([
      this.getStrategyTemplates(),
      this.getTemplateCategories()
    ])

    const allStrategyData = {
      templates,
      categories,
      timestamp: Date.now()
    }

    return allStrategyData
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 150, maxMs = 500) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates strategy provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 200)
      
      // Simulate occasional provider outages (2% chance)
      if (Math.random() < 0.02) {
        throw new Error('Mockup strategy template provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 300 + 150, // 150-450ms
        templateCount: (await this.getStrategyTemplates()).length,
        categoryCount: (await this.getTemplateCategories()).length
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
export const mockupStrategyTemplateProviderService = new MockupStrategyTemplateProviderService()

// Export class for testing
export default MockupStrategyTemplateProviderService