/**
 * Advanced Code Splitting Utilities
 * Provides intelligent code splitting and lazy loading strategies
 */

import { lazy, createElement } from 'react'
import logger from './logger'

/**
 * Enhanced lazy loading with error handling and retries
 */
export function createLazyComponent(importFn, fallbackComponent = null) {
  let retryCount = 0
  const maxRetries = 3

  const LazyComponent = lazy(async () => {
    try {
      return await importFn()
    } catch (error) {
      logger.warn(`Failed to load component (attempt ${retryCount + 1}/${maxRetries}):`, error)
      
      if (retryCount < maxRetries) {
        retryCount++
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount - 1) * 1000))
        return await importFn()
      }
      
      // After max retries, return fallback or error component
      if (fallbackComponent) {
        return { default: fallbackComponent }
      }
      
      throw error
    }
  })

  return LazyComponent
}

/**
 * Route-based code splitting
 */
export const RouteComponents = {
  // Authentication routes
  AuthPage: createLazyComponent(() => import('../components/AuthPage.jsx')),
  
  // Dashboard routes
  Dashboard: createLazyComponent(() => import('../components/AppDashboard.jsx')),
  Account: createLazyComponent(() => import('../components/AccountView.jsx')),
  
  // Transaction routes
  Transactions: createLazyComponent(() => import('../components/TransactionPage.jsx')),
  
  // Category routes
  Banking: createLazyComponent(() => import('../components/categories/BankingCategory.jsx')),
  Investment: createLazyComponent(() => import('../components/categories/InvestmentCategory.jsx')),
  Yield: createLazyComponent(() => import('../components/categories/YieldCategory.jsx')),
  
  // Asset routes
  AssetDetail: createLazyComponent(() => import('../components/AssetDetailPage.jsx')),
  
  // Admin/Internal routes (not accessible to regular users)
  AdminDashboard: createLazyComponent(() => import('../components/admin/AdminDashboard.jsx')),
  PerformanceDashboard: createLazyComponent(() => import('../components/monitoring/PerformanceDashboard.jsx')),
  SecurityDashboard: createLazyComponent(() => import('../components/monitoring/SecurityDashboard.jsx'))
}

/**
 * Feature-based code splitting
 */
export const FeatureComponents = {
  // Yield strategy features
  ObjectiveConfig: createLazyComponent(() => import('../components/yield/ObjectiveConfig.jsx')),
  StrategyManager: createLazyComponent(() => import('../components/yield/StrategyManager.jsx')),
  StrategyConfigurationPage: createLazyComponent(() => import('../components/yield/StrategyConfigurationPage.jsx')),
  
  // Advanced financial dashboard
  AdvancedFinancialDashboard: createLazyComponent(() => import('../components/dashboard/AdvancedFinancialDashboard.jsx'))
}

/**
 * Service-based code splitting for heavy utilities
 */
export const ServiceModules = {
  // Existing utilities that can be loaded dynamically
  SecureStorage: () => import('../utils/secureStorage.js'),
  LocalStorageHelper: () => import('../utils/localStorageHelper.js'),
  NavigationHelpers: () => import('../utils/navigationHelpers.js'),
  TransactionDisplayHelpers: () => import('../utils/transactionDisplayHelpers.ts')
}

/**
 * Preload critical chunks based on user behavior
 */
export class ChunkPreloader {
  constructor() {
    this.preloadedChunks = new Set()
    this.preloadQueue = new Map()
  }

  /**
   * Preload chunks based on route prediction
   */
  preloadForRoute(currentRoute) {
    const predictions = this.predictNextRoutes(currentRoute)
    
    predictions.forEach(route => {
      this.preloadChunk(route, 'route-prediction')
    })
  }

  /**
   * Preload chunks on user interaction
   */
  preloadOnHover(componentName) {
    if (this.preloadedChunks.has(componentName)) return

    // Preload on hover with slight delay to avoid unnecessary loads
    setTimeout(() => {
      this.preloadChunk(componentName, 'hover-intent')
    }, 100)
  }

  /**
   * Preload critical chunks on idle
   */
  preloadOnIdle() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.preloadCriticalChunks()
      })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.preloadCriticalChunks()
      }, 2000)
    }
  }

  /**
   * Predict next routes based on current route
   */
  predictNextRoutes(currentRoute) {
    const routePredictions = {
      '/': ['/auth/login', '/dashboard'],
      '/auth/login': ['/dashboard', '/auth/register'],
      '/dashboard': ['/transactions', '/account', '/banking'],
      '/transactions': ['/transaction-history', '/dashboard'],
      '/account': ['/settings', '/dashboard'],
      '/banking': ['/transactions', '/investment'],
      '/investment': ['/yield', '/banking'],
      '/yield': ['/investment', '/strategies']
    }

    return routePredictions[currentRoute] || []
  }

  /**
   * Preload a specific chunk
   */
  async preloadChunk(chunkName, reason = 'manual') {
    if (this.preloadedChunks.has(chunkName)) return

    try {
      const component = RouteComponents[chunkName] || FeatureComponents[chunkName]
      if (component) {
        // This triggers the dynamic import without rendering
        await component._payload._result
        this.preloadedChunks.add(chunkName)
        console.debug(`Preloaded chunk: ${chunkName} (${reason})`)
      }
    } catch (error) {
      logger.warn(`Failed to preload chunk ${chunkName}:`, error)
    }
  }

  /**
   * Preload critical chunks that are likely to be needed
   */
  preloadCriticalChunks() {
    const criticalChunks = [
      'Transactions',
      'Account',
      'Banking',
      'Settings'
    ]

    criticalChunks.forEach(chunk => {
      this.preloadChunk(chunk, 'critical')
    })
  }

  /**
   * Get preload statistics
   */
  getStats() {
    return {
      preloadedCount: this.preloadedChunks.size,
      preloadedChunks: Array.from(this.preloadedChunks),
      queueSize: this.preloadQueue.size
    }
  }
}

/**
 * Bundle analyzer utility
 */
export class BundleAnalyzer {
  constructor() {
    this.chunkSizes = new Map()
    this.loadTimes = new Map()
  }

  /**
   * Track chunk load time
   */
  trackChunkLoad(chunkName, startTime = performance.now()) {
    const endTime = performance.now()
    const loadTime = endTime - startTime
    
    this.loadTimes.set(chunkName, loadTime)
    
    if (loadTime > 1000) {
      logger.warn(`Slow chunk load: ${chunkName} took ${loadTime.toFixed(2)}ms`)
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const totalChunks = this.loadTimes.size
    const averageLoadTime = totalChunks > 0 
      ? Array.from(this.loadTimes.values()).reduce((a, b) => a + b, 0) / totalChunks
      : 0

    const slowChunks = Array.from(this.loadTimes.entries())
      .filter(([_, time]) => time > 1000)
      .map(([name, time]) => ({ name, time }))

    return {
      totalChunks,
      averageLoadTime: Math.round(averageLoadTime),
      slowChunks,
      fastestChunk: this.getFastestChunk(),
      slowestChunk: this.getSlowestChunk()
    }
  }

  getFastestChunk() {
    if (this.loadTimes.size === 0) return null
    
    const [name, time] = Array.from(this.loadTimes.entries())
      .reduce((min, current) => current[1] < min[1] ? current : min)
    
    return { name, time }
  }

  getSlowestChunk() {
    if (this.loadTimes.size === 0) return null
    
    const [name, time] = Array.from(this.loadTimes.entries())
      .reduce((max, current) => current[1] > max[1] ? current : max)
    
    return { name, time }
  }
}

// Global instances
export const chunkPreloader = new ChunkPreloader()
export const bundleAnalyzer = new BundleAnalyzer()

/**
 * Initialize code splitting optimizations
 */
export function initializeCodeSplitting() {
  // Start preloading critical chunks on idle
  chunkPreloader.preloadOnIdle()
  
  // Add performance monitoring
  if (import.meta.env.DEV) {
    logger.debug('Code splitting initialized with preloading strategy')
  }
}