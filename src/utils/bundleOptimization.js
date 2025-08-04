import logger from './logger'

/**
 * Bundle Optimization Utilities
 * Advanced techniques for optimizing bundle size and loading performance
 */

/**
 * Dynamic import with caching and error handling
 */
class ModuleCache {
  constructor() {
    this.cache = new Map()
    this.loadingPromises = new Map()
  }

  async importModule(modulePath, options = {}) {
    const { 
      cacheable = true, 
      retries = 3, 
      timeout = 10000,
      fallback = null 
    } = options

    // Return cached module if available
    if (cacheable && this.cache.has(modulePath)) {
      return this.cache.get(modulePath)
    }

    // Return existing loading promise if module is already being loaded
    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath)
    }

    // Create loading promise with timeout and retries
    const loadingPromise = this.loadWithRetries(modulePath, retries, timeout, fallback)
    this.loadingPromises.set(modulePath, loadingPromise)

    try {
      const module = await loadingPromise
      
      if (cacheable) {
        this.cache.set(modulePath, module)
      }
      
      return module
    } finally {
      this.loadingPromises.delete(modulePath)
    }
  }

  async loadWithRetries(modulePath, retries, timeout, fallback) {
    let lastError

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Module load timeout')), timeout)
        })

        const importPromise = import(/* @vite-ignore */ modulePath)
        const module = await Promise.race([importPromise, timeoutPromise])
        
        return module
      } catch (error) {
        lastError = error
        logger.warn(`Module load attempt ${attempt + 1} failed for ${modulePath}:`, error)
        
        if (attempt < retries) {
          // Exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          )
        }
      }
    }

    // If all retries failed, try fallback
    if (fallback) {
      try {
        return await import(/* @vite-ignore */ fallback)
      } catch (fallbackError) {
        logger.error('Fallback module also failed:', fallbackError)
      }
    }

    throw lastError
  }

  clearCache() {
    this.cache.clear()
  }

  getCacheStats() {
    return {
      cachedModules: this.cache.size,
      loadingModules: this.loadingPromises.size,
      modules: Array.from(this.cache.keys())
    }
  }
}

export const moduleCache = new ModuleCache()

/**
 * Tree shaking helpers
 */
export const TreeShaking = {
  /**
   * Import only specific functions from a module
   */
  async importFunctions(modulePath, functionNames) {
    const module = await moduleCache.importModule(modulePath)
    const importedFunctions = {}
    
    functionNames.forEach(name => {
      if (module[name]) {
        importedFunctions[name] = module[name]
      } else {
        logger.warn(`Function ${name} not found in module ${modulePath}`)
      }
    })
    
    return importedFunctions
  },

  /**
   * Dead code elimination marker
   */
  markAsUsed(variable) {
    // This function helps bundle analyzers understand that code is used
    if (import.meta.env.DEV) {
      console.debug('Marked as used:', variable)
    }
    return variable
  },

  /**
   * Conditional module loading based on feature flags
   */
  async loadConditionalModule(modulePath, condition) {
    if (condition) {
      return await moduleCache.importModule(modulePath)
    }
    return null
  }
}

/**
 * Bundle size analyzer
 */
export class BundleSizeAnalyzer {
  constructor() {
    this.moduleRegistry = new Map()
    this.startTime = performance.now()
  }

  registerModule(name, size, loadTime) {
    this.moduleRegistry.set(name, {
      size,
      loadTime,
      timestamp: performance.now()
    })
  }

  getModuleStats() {
    const modules = Array.from(this.moduleRegistry.entries())
    const totalSize = modules.reduce((sum, [_, info]) => sum + (info.size || 0), 0)
    const averageLoadTime = modules.length > 0
      ? modules.reduce((sum, [_, info]) => sum + info.loadTime, 0) / modules.length
      : 0

    return {
      totalModules: modules.length,
      totalSize,
      averageLoadTime,
      largestModules: this.getLargestModules(),
      slowestModules: this.getSlowestModules()
    }
  }

  getLargestModules(limit = 5) {
    return Array.from(this.moduleRegistry.entries())
      .filter(([_, info]) => info.size)
      .sort(([_, a], [__, b]) => b.size - a.size)
      .slice(0, limit)
      .map(([name, info]) => ({
        name,
        size: info.size,
        sizeFormatted: this.formatSize(info.size)
      }))
  }

  getSlowestModules(limit = 5) {
    return Array.from(this.moduleRegistry.entries())
      .sort(([_, a], [__, b]) => b.loadTime - a.loadTime)
      .slice(0, limit)
      .map(([name, info]) => ({
        name,
        loadTime: Math.round(info.loadTime),
        loadTimeFormatted: `${Math.round(info.loadTime)}ms`
      }))
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  generateReport() {
    const stats = this.getModuleStats()
    const uptime = Math.round(performance.now() - this.startTime)

    return {
      ...stats,
      uptime,
      recommendations: this.generateRecommendations(stats)
    }
  }

  generateRecommendations(stats) {
    const recommendations = []

    if (stats.averageLoadTime > 1000) {
      recommendations.push({
        type: 'performance',
        message: 'Average module load time is high. Consider preloading critical modules.',
        severity: 'warning'
      })
    }

    if (stats.totalModules > 50) {
      recommendations.push({
        type: 'architecture',
        message: 'Large number of modules loaded. Consider consolidating related functionality.',
        severity: 'info'
      })
    }

    const largeModules = stats.largestModules.filter(m => m.size > 100000) // 100KB
    if (largeModules.length > 0) {
      recommendations.push({
        type: 'size',
        message: `Large modules detected: ${largeModules.map(m => m.name).join(', ')}`,
        severity: 'warning'
      })
    }

    return recommendations
  }
}

/**
 * Performance budget checker
 */
export class PerformanceBudget {
  constructor(budgets = {}) {
    this.budgets = {
      maxBundleSize: 500000, // 500KB
      maxChunkSize: 200000,  // 200KB
      maxLoadTime: 3000,     // 3 seconds
      maxModuleCount: 30,    // 30 modules per chunk
      ...budgets
    }
    this.violations = []
  }

  checkBudget(stats) {
    this.violations = []

    if (stats.totalSize > this.budgets.maxBundleSize) {
      this.violations.push({
        type: 'bundle-size',
        actual: stats.totalSize,
        budget: this.budgets.maxBundleSize,
        message: `Bundle size exceeds budget: ${stats.totalSize} > ${this.budgets.maxBundleSize}`
      })
    }

    if (stats.averageLoadTime > this.budgets.maxLoadTime) {
      this.violations.push({
        type: 'load-time',
        actual: stats.averageLoadTime,
        budget: this.budgets.maxLoadTime,
        message: `Average load time exceeds budget: ${stats.averageLoadTime}ms > ${this.budgets.maxLoadTime}ms`
      })
    }

    if (stats.totalModules > this.budgets.maxModuleCount) {
      this.violations.push({
        type: 'module-count',
        actual: stats.totalModules,
        budget: this.budgets.maxModuleCount,
        message: `Module count exceeds budget: ${stats.totalModules} > ${this.budgets.maxModuleCount}`
      })
    }

    return {
      passed: this.violations.length === 0,
      violations: this.violations
    }
  }

  reportViolations() {
    if (this.violations.length === 0) {
      logger.debug('✅ All performance budgets are within limits')
      return
    }

    console.group('⚠️  Performance Budget Violations')
    this.violations.forEach(violation => {
      logger.warn(violation.message)
    })
    console.groupEnd()
  }
}

/**
 * Module preloading strategies
 */
export class PreloadingStrategy {
  constructor() {
    this.preloadedModules = new Set()
    this.preloadQueue = []
    this.isPreloading = false
  }

  /**
   * Preload modules based on user behavior patterns
   */
  preloadByUserPattern(userActions) {
    const patterns = this.analyzeUserPatterns(userActions)
    
    patterns.forEach(pattern => {
      this.queueModuleForPreload(pattern.module, pattern.priority)
    })
  }

  /**
   * Preload modules during idle time
   */
  preloadOnIdle(modules) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback((deadline) => {
        this.preloadModulesInIdle(modules, deadline)
      })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.preloadModulesInIdle(modules, { timeRemaining: () => 50 })
      }, 100)
    }
  }

  async preloadModulesInIdle(modules, deadline) {
    for (const module of modules) {
      if (deadline.timeRemaining() > 10) {
        await this.preloadModule(module)
      } else {
        // Schedule remaining modules for next idle period
        this.preloadOnIdle(modules.slice(modules.indexOf(module)))
        break
      }
    }
  }

  async preloadModule(modulePath) {
    if (this.preloadedModules.has(modulePath)) return

    try {
      await moduleCache.importModule(modulePath, { cacheable: true })
      this.preloadedModules.add(modulePath)
      console.debug(`✅ Preloaded module: ${modulePath}`)
    } catch (error) {
      logger.warn(`❌ Failed to preload module: ${modulePath}`, error)
    }
  }

  queueModuleForPreload(modulePath, priority = 'normal') {
    this.preloadQueue.push({ modulePath, priority })
    this.preloadQueue.sort((a, b) => {
      const priorities = { high: 3, normal: 2, low: 1 }
      return priorities[b.priority] - priorities[a.priority]
    })
  }

  async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) return

    this.isPreloading = true

    while (this.preloadQueue.length > 0) {
      const { modulePath } = this.preloadQueue.shift()
      await this.preloadModule(modulePath)
      
      // Small delay to prevent blocking the main thread
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    this.isPreloading = false
  }

  analyzeUserPatterns(actions) {
    // Simple pattern analysis - in reality this would be more sophisticated
    const patterns = []
    
    // If user often goes from dashboard to transactions
    if (actions.includes('dashboard') && actions.includes('transactions')) {
      patterns.push({
        module: './components/TransactionPage.jsx',
        priority: 'high'
      })
    }

    // If user uses banking features frequently
    if (actions.filter(a => a.includes('banking')).length > 1) {
      patterns.push({
        module: './components/categories/BankingCategory.jsx',
        priority: 'high'
      })
    }

    return patterns
  }

  getStats() {
    return {
      preloadedCount: this.preloadedModules.size,
      queueLength: this.preloadQueue.length,
      isPreloading: this.isPreloading,
      preloadedModules: Array.from(this.preloadedModules)
    }
  }
}

// Global instances
export const bundleSizeAnalyzer = new BundleSizeAnalyzer()
export const performanceBudget = new PerformanceBudget()
export const preloadingStrategy = new PreloadingStrategy()

/**
 * Initialize bundle optimization
 */
export function initializeBundleOptimization() {
  // Start monitoring bundle performance
  if (import.meta.env.DEV) {
    logger.debug('Bundle optimization initialized')
    
    // Report stats every 30 seconds in development
    setInterval(() => {
      const stats = bundleSizeAnalyzer.generateReport()
      console.group('📊 Bundle Performance Report')
      console.table(stats.largestModules)
      console.table(stats.slowestModules)
      performanceBudget.reportViolations()
      console.groupEnd()
    }, 30000)
  }

  // Preloading disabled to reduce console noise in development
  // preloadingStrategy.preloadOnIdle([
  //   './components/AppDashboard.jsx',
  //   './components/TransactionPage.jsx',
  //   './components/AccountView.jsx'
  // ])
}