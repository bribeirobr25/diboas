/**
 * SEO Monitoring and Analytics Utilities
 * Provides comprehensive SEO performance tracking and optimization
 */

/**
 * Core Web Vitals monitoring
 */
export const coreWebVitals = {
  // Initialize Core Web Vitals tracking
  init: () => {
    if (typeof window === 'undefined') return

    // Dynamic import of web-vitals library
    import('web-vitals').then((module) => {
      const { onCLS, onFID, onFCP, onLCP, onTTFB } = module
      // Largest Contentful Paint
      onLCP((metric) => {
        coreWebVitals.reportMetric('LCP', metric)
      })

      // First Input Delay
      onFID((metric) => {
        coreWebVitals.reportMetric('FID', metric)
      })

      // Cumulative Layout Shift
      onCLS((metric) => {
        coreWebVitals.reportMetric('CLS', metric)
      })

      // First Contentful Paint
      onFCP((metric) => {
        coreWebVitals.reportMetric('FCP', metric)
      })

      // Time to First Byte
      onTTFB((metric) => {
        coreWebVitals.reportMetric('TTFB', metric)
      })
    }).catch(() => {
      // Web Vitals library not available - this is normal in development
      if (import.meta.env.DEV) {
        console.info('Web Vitals library not available (development mode)')
      }
    })
  },

  // Report metric to analytics
  reportMetric: (name, metric) => {
    const value = Math.round(metric.value)
    const delta = Math.round(metric.delta)

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[CWV] ${name}:`, {
        value: `${value}ms`,
        delta: `${delta}ms`,
        rating: metric.rating,
        entries: metric.entries
      })
    }

    // Send to analytics (Google Analytics 4)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', name, {
        event_category: 'Web Vitals',
        value: value,
        metric_rating: metric.rating,
        custom_parameter_1: delta
      })
    }

    // Store in localStorage for development tracking
    if (import.meta.env.DEV) {
      const metrics = JSON.parse(localStorage.getItem('seo_metrics') || '[]')
      metrics.push({
        name,
        value,
        delta,
        rating: metric.rating,
        timestamp: Date.now(),
        url: window.location.href
      })
      
      // Keep only last 100 metrics
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100)
      }
      
      localStorage.setItem('seo_metrics', JSON.stringify(metrics))
    }
  },

  // Get performance grade based on Core Web Vitals
  getPerformanceGrade: () => {
    const metrics = JSON.parse(localStorage.getItem('seo_metrics') || '[]')
    const recent = metrics.slice(-10) // Last 10 measurements

    if (recent.length === 0) return { grade: 'N/A', score: 0 }

    const scores = {
      LCP: 0,
      FID: 0,
      CLS: 0,
      FCP: 0,
      TTFB: 0
    }

    // Calculate average scores
    Object.keys(scores).forEach(metric => {
      const metricData = recent.filter(m => m.name === metric)
      if (metricData.length > 0) {
        const avgRating = metricData.reduce((sum, m) => {
          return sum + (m.rating === 'good' ? 100 : m.rating === 'needs-improvement' ? 70 : 30)
        }, 0) / metricData.length
        scores[metric] = avgRating
      }
    })

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / 5
    
    return {
      grade: totalScore >= 90 ? 'A' : totalScore >= 80 ? 'B' : totalScore >= 70 ? 'C' : 'D',
      score: Math.round(totalScore),
      breakdown: scores
    }
  }
}

/**
 * SEO content analysis
 */
export const contentAnalysis = {
  // Analyze page content for SEO
  analyzePage: () => {
    if (typeof document === 'undefined') return null

    const analysis = {
      title: document.title,
      titleLength: document.title.length,
      description: document.querySelector('meta[name="description"]')?.content || '',
      descriptionLength: (document.querySelector('meta[name="description"]')?.content || '').length,
      keywords: document.querySelector('meta[name="keywords"]')?.content || '',
      headings: {},
      images: {},
      links: {},
      structuredData: [],
      performance: {},
      accessibility: {},
      timestamp: new Date().toISOString()
    }

    // Analyze headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    headings.forEach(heading => {
      const tag = heading.tagName.toLowerCase()
      if (!analysis.headings[tag]) analysis.headings[tag] = []
      analysis.headings[tag].push({
        text: heading.textContent.trim(),
        length: heading.textContent.trim().length
      })
    })

    // Analyze images
    const images = document.querySelectorAll('img')
    analysis.images = {
      total: images.length,
      withAlt: Array.from(images).filter(img => img.alt).length,
      withoutAlt: Array.from(images).filter(img => !img.alt).length,
      lazyLoaded: Array.from(images).filter(img => img.loading === 'lazy').length
    }

    // Analyze links
    const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]')
    const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="diboas.com"])')
    
    analysis.links = {
      internal: internalLinks.length,
      external: externalLinks.length,
      nofollow: Array.from(externalLinks).filter(link => 
        link.rel && link.rel.includes('nofollow')
      ).length
    }

    // Extract structured data
    const scripts = document.querySelectorAll('script[type="application/ld+json"]')
    analysis.structuredData = Array.from(scripts).map(script => {
      try {
        return JSON.parse(script.textContent)
      } catch (e) {
        return { error: 'Invalid JSON-LD' }
      }
    })

    return analysis
  },

  // Generate SEO recommendations
  generateRecommendations: (analysis) => {
    const recommendations = []

    // Title analysis
    if (analysis.titleLength < 30) {
      recommendations.push({
        type: 'title',
        priority: 'high',
        message: 'Title is too short. Aim for 30-60 characters.',
        current: analysis.titleLength,
        target: '30-60 characters'
      })
    } else if (analysis.titleLength > 60) {
      recommendations.push({
        type: 'title',
        priority: 'medium',
        message: 'Title may be too long for search results.',
        current: analysis.titleLength,
        target: '30-60 characters'
      })
    }

    // Description analysis
    if (analysis.descriptionLength < 120) {
      recommendations.push({
        type: 'description',
        priority: 'high',
        message: 'Meta description is too short. Aim for 120-160 characters.',
        current: analysis.descriptionLength,
        target: '120-160 characters'
      })
    } else if (analysis.descriptionLength > 160) {
      recommendations.push({
        type: 'description',
        priority: 'medium',
        message: 'Meta description may be too long.',
        current: analysis.descriptionLength,
        target: '120-160 characters'
      })
    }

    // Heading analysis
    if (!analysis.headings.h1 || analysis.headings.h1.length === 0) {
      recommendations.push({
        type: 'headings',
        priority: 'high',
        message: 'Page is missing H1 tag.',
        action: 'Add exactly one H1 tag to the page'
      })
    } else if (analysis.headings.h1.length > 1) {
      recommendations.push({
        type: 'headings',
        priority: 'medium',
        message: 'Multiple H1 tags found. Use only one H1 per page.',
        current: analysis.headings.h1.length,
        target: '1 H1 tag'
      })
    }

    // Image analysis
    if (analysis.images.withoutAlt > 0) {
      recommendations.push({
        type: 'images',
        priority: 'high',
        message: `${analysis.images.withoutAlt} images missing alt text.`,
        action: 'Add descriptive alt text to all images'
      })
    }

    // Structured data analysis
    if (analysis.structuredData.length === 0) {
      recommendations.push({
        type: 'structured-data',
        priority: 'medium',
        message: 'No structured data found.',
        action: 'Add JSON-LD structured data for better search understanding'
      })
    }

    return recommendations
  },

  // Calculate SEO score
  calculateSEOScore: (analysis) => {
    let score = 100
    const deductions = []

    // Title scoring
    if (analysis.titleLength < 30 || analysis.titleLength > 60) {
      score -= 15
      deductions.push('Title length')
    }

    // Description scoring
    if (analysis.descriptionLength < 120 || analysis.descriptionLength > 160) {
      score -= 15
      deductions.push('Description length')
    }

    // H1 scoring
    if (!analysis.headings.h1 || analysis.headings.h1.length !== 1) {
      score -= 20
      deductions.push('H1 structure')
    }

    // Image alt text scoring
    if (analysis.images.total > 0) {
      const altTextScore = (analysis.images.withAlt / analysis.images.total) * 20
      score -= (20 - altTextScore)
      if (altTextScore < 20) deductions.push('Image alt text')
    }

    // Structured data scoring
    if (analysis.structuredData.length === 0) {
      score -= 10
      deductions.push('Structured data')
    }

    return {
      score: Math.max(0, Math.round(score)),
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
      deductions
    }
  }
}

/**
 * SEO reporting utilities
 */
export const seoReporting = {
  // Generate comprehensive SEO report
  generateReport: () => {
    const analysis = contentAnalysis.analyzePage()
    const recommendations = contentAnalysis.generateRecommendations(analysis)
    const seoScore = contentAnalysis.calculateSEOScore(analysis)
    const performanceGrade = coreWebVitals.getPerformanceGrade()

    return {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      seo: {
        score: seoScore.score,
        grade: seoScore.grade,
        deductions: seoScore.deductions
      },
      performance: {
        score: performanceGrade.score,
        grade: performanceGrade.grade,
        breakdown: performanceGrade.breakdown
      },
      content: analysis,
      recommendations: recommendations.map(rec => ({
        ...rec,
        impact: rec.priority === 'high' ? 'High' : rec.priority === 'medium' ? 'Medium' : 'Low'
      })),
      summary: {
        overallGrade: calculateOverallGrade(seoScore.score, performanceGrade.score),
        priorityActions: recommendations.filter(r => r.priority === 'high').length,
        totalIssues: recommendations.length
      }
    }
  },

  // Export report as JSON
  exportReport: () => {
    const report = seoReporting.generateReport()
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `seo-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  // Log report to console (development) - throttled to avoid spam
  logReport: (() => {
    let lastReportTime = 0
    const REPORT_THROTTLE = 10000 // 10 seconds between reports
    
    return () => {
      if (!import.meta.env.DEV) return
      
      const now = Date.now()
      if (now - lastReportTime < REPORT_THROTTLE) return
      
      lastReportTime = now
      
      const report = seoReporting.generateReport()
      console.group('📊 SEO Report')
      console.log('Overall Grade:', report.summary.overallGrade)
      console.log('SEO Score:', `${report.seo.score}/100 (${report.seo.grade})`)
      console.log('Performance Score:', `${report.performance.score}/100 (${report.performance.grade})`)
      console.log('Priority Actions:', report.summary.priorityActions)
      console.log('Total Issues:', report.summary.totalIssues)
      
      if (report.recommendations.length > 0) {
        console.group('🔧 Recommendations')
        report.recommendations.forEach(rec => {
          console.log(`[${rec.impact}] ${rec.message}`)
        })
        console.groupEnd()
      }
      
      console.groupEnd()
    }
  })()
}

/**
 * Real-time SEO monitoring
 */
export const realTimeMonitoring = {
  // Start monitoring
  start: () => {
    if (typeof window === 'undefined') return

    // Initialize Core Web Vitals
    coreWebVitals.init()

    // Monitor page changes (for SPA)
    let currentUrl = window.location.href
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href
        
        // Delay to allow new content to render
        setTimeout(() => {
          if (import.meta.env.DEV) {
            seoReporting.logReport()
          }
        }, 1000)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Initial report
    setTimeout(() => {
      if (import.meta.env.DEV) {
        seoReporting.logReport()
      }
    }, 2000)

    return () => observer.disconnect()
  }
}

// Helper function to calculate overall grade
function calculateOverallGrade(seoScore, performanceScore) {
  const average = (seoScore + performanceScore) / 2
  return average >= 90 ? 'A' : average >= 80 ? 'B' : average >= 70 ? 'C' : average >= 60 ? 'D' : 'F'
}

export default {
  coreWebVitals,
  contentAnalysis,
  seoReporting,
  realTimeMonitoring
}