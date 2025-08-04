import logger from '../utils/logger'

/**
 * Subdomain Configuration for diBoaS Platform
 * Implements subdomain-based architecture for better security, performance, and SEO
 */

/**
 * Subdomain types and their purposes
 */
export const SUBDOMAINS = {
  WWW: 'www',           // Marketing and landing pages
  APP: 'app',           // Main application
  API: 'api',           // API endpoints
  AUTH: 'auth',         // Authentication services
  DOCS: 'docs',         // Documentation
  CDN: 'cdn',           // Content delivery
  WS: 'ws',             // WebSocket connections
  ADMIN: 'admin'        // Administrative interface
}

/**
 * Domain configuration per environment
 */
const domainConfigs = {
  development: {
    baseDomain: 'localhost',
    port: 5173,
    protocol: 'http',
    subdomains: {
      [SUBDOMAINS.WWW]: 'localhost:5173',
      [SUBDOMAINS.APP]: 'localhost:5173',  // Same for development
      [SUBDOMAINS.API]: 'localhost:3001',
      [SUBDOMAINS.AUTH]: 'localhost:3002',
      [SUBDOMAINS.DOCS]: 'localhost:5173',
      [SUBDOMAINS.CDN]: 'localhost:3001',
      [SUBDOMAINS.WS]: 'localhost:3001',
      [SUBDOMAINS.ADMIN]: 'localhost:5173'
    }
  },
  
  staging: {
    baseDomain: 'staging.diboas.com',
    protocol: 'https',
    subdomains: {
      [SUBDOMAINS.WWW]: 'www.staging.diboas.com',
      [SUBDOMAINS.APP]: 'app.staging.diboas.com',
      [SUBDOMAINS.API]: 'api.staging.diboas.com',
      [SUBDOMAINS.AUTH]: 'auth.staging.diboas.com',
      [SUBDOMAINS.DOCS]: 'docs.staging.diboas.com',
      [SUBDOMAINS.CDN]: 'cdn.staging.diboas.com',
      [SUBDOMAINS.WS]: 'ws.staging.diboas.com',
      [SUBDOMAINS.ADMIN]: 'admin.staging.diboas.com'
    }
  },
  
  production: {
    baseDomain: 'diboas.com',
    protocol: 'https',
    subdomains: {
      [SUBDOMAINS.WWW]: 'www.diboas.com',
      [SUBDOMAINS.APP]: 'app.diboas.com',
      [SUBDOMAINS.API]: 'api.diboas.com',
      [SUBDOMAINS.AUTH]: 'auth.diboas.com',
      [SUBDOMAINS.DOCS]: 'docs.diboas.com',
      [SUBDOMAINS.CDN]: 'cdn.diboas.com',
      [SUBDOMAINS.WS]: 'ws.diboas.com',
      [SUBDOMAINS.ADMIN]: 'admin.diboas.com'
    }
  }
}

/**
 * Regional domain variations
 */
export const REGIONAL_DOMAINS = {
  'us-east-1': {
    suffix: '',  // Primary region
    priority: 1
  },
  'us-west-1': {
    suffix: '-west',
    priority: 2
  },
  'eu-west-1': {
    suffix: '-eu',
    priority: 3
  },
  'ap-southeast-1': {
    suffix: '-asia',
    priority: 4
  },
  'global': {
    suffix: '',
    priority: 1
  }
}

/**
 * Get current environment for domain detection
 */
const getCurrentEnvironment = () => {
  if (import.meta.env.VITE_APP_ENV) {
    return import.meta.env.VITE_APP_ENV
  }
  
  if (import.meta.env.DEV) {
    return 'development'
  }
  
  if (import.meta.env.PROD) {
    return 'production'
  }
  
  return 'development'
}

/**
 * Detect current subdomain from window.location
 */
export const detectCurrentSubdomain = () => {
  if (typeof window === 'undefined') {
    return SUBDOMAINS.APP // Default for SSR
  }
  
  const hostname = window.location.hostname
  const environment = getCurrentEnvironment()
  
  // In development, everything runs on localhost
  if (environment === 'development') {
    // Check URL path to determine context
    const path = window.location.pathname
    if (path === '/' || path === '/auth') {
      return SUBDOMAINS.WWW
    }
    return SUBDOMAINS.APP
  }
  
  // Production/staging subdomain detection
  if (hostname.startsWith('www.')) {
    return SUBDOMAINS.WWW
  } else if (hostname.startsWith('app.')) {
    return SUBDOMAINS.APP
  } else if (hostname.startsWith('api.')) {
    return SUBDOMAINS.API
  } else if (hostname.startsWith('auth.')) {
    return SUBDOMAINS.AUTH
  } else if (hostname.startsWith('docs.')) {
    return SUBDOMAINS.DOCS
  } else if (hostname.startsWith('admin.')) {
    return SUBDOMAINS.ADMIN
  }
  
  // Default to app subdomain
  return SUBDOMAINS.APP
}

/**
 * Get domain configuration for current environment
 */
export const getDomainConfig = (environment = null) => {
  const env = environment || getCurrentEnvironment()
  const config = domainConfigs[env]
  
  if (!config) {
    logger.warn(`Unknown environment for domain config: ${env}, falling back to development`)
    return domainConfigs.development
  }
  
  return config
}

/**
 * Build URL for specific subdomain and path
 */
export const buildSubdomainUrl = (subdomain, path = '', environment = null, region = null) => {
  const config = getDomainConfig(environment)
  const baseUrl = config.subdomains[subdomain]
  
  if (!baseUrl) {
    logger.warn(`Unknown subdomain: ${subdomain}, falling back to app subdomain`)
    return buildSubdomainUrl(SUBDOMAINS.APP, path, environment, region)
  }
  
  // Add regional suffix if specified
  let finalUrl = baseUrl
  if (region && REGIONAL_DOMAINS[region] && REGIONAL_DOMAINS[region].suffix) {
    const suffix = REGIONAL_DOMAINS[region].suffix
    // For production subdomains like app.diboas.com, convert to app-eu.diboas.com
    if (finalUrl.includes('.diboas.com')) {
      const parts = finalUrl.split('.')
      if (parts.length >= 3 && parts[0] !== 'www') {
        parts[0] = `${parts[0]}${suffix}`
        finalUrl = parts.join('.')
      } else {
        // For www or other cases, add suffix before base domain
        finalUrl = baseUrl.replace(config.baseDomain, `${suffix.substring(1)}.${config.baseDomain}`)
      }
    }
  }
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  
  return `${config.protocol}://${finalUrl}${cleanPath}`
}

/**
 * Get current full URL with subdomain
 */
export const getCurrentSubdomainUrl = () => {
  if (typeof window === 'undefined') {
    return ''
  }
  
  return window.location.href
}

/**
 * Navigate to different subdomain
 */
export const navigateToSubdomain = (subdomain, path = '', replace = false) => {
  const url = buildSubdomainUrl(subdomain, path)
  
  if (replace) {
    window.location.replace(url)
  } else {
    window.location.href = url
  }
}

/**
 * Check if current page is on specific subdomain
 */
export const isOnSubdomain = (subdomain) => {
  return detectCurrentSubdomain() === subdomain
}

/**
 * Security policies per subdomain
 */
export const getSubdomainSecurityPolicy = (subdomain) => {
  const policies = {
    [SUBDOMAINS.WWW]: {
      csp: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'https://www.google-analytics.com'],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'", 'https://api.diboas.com']
      },
      hsts: 'max-age=31536000; includeSubDomains; preload',
      referrerPolicy: 'strict-origin-when-cross-origin'
    },
    
    [SUBDOMAINS.APP]: {
      csp: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https://cdn.diboas.com'],
        'font-src': ["'self'", 'https://cdn.diboas.com'],
        'connect-src': ["'self'", 'https://api.diboas.com', 'wss://ws.diboas.com'],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"]
      },
      hsts: 'max-age=31536000; includeSubDomains; preload',
      referrerPolicy: 'same-origin',
      frameOptions: 'DENY'
    },
    
    [SUBDOMAINS.API]: {
      csp: {
        'default-src': ["'none'"],
        'connect-src': ["'self'"]
      },
      hsts: 'max-age=31536000; includeSubDomains; preload',
      referrerPolicy: 'no-referrer',
      frameOptions: 'DENY'
    }
  }
  
  return policies[subdomain] || policies[SUBDOMAINS.APP]
}

/**
 * Performance configurations per subdomain
 */
export const getSubdomainPerformanceConfig = (subdomain) => {
  const configs = {
    [SUBDOMAINS.WWW]: {
      cacheStrategy: 'marketing',
      serviceWorkerEnabled: true,
      compressionEnabled: true,
      cdnEnabled: true,
      performanceBudget: {
        initialBundle: '400KB',
        totalAssets: '1MB'
      }
    },
    
    [SUBDOMAINS.APP]: {
      cacheStrategy: 'aggressive',
      serviceWorkerEnabled: true,
      compressionEnabled: true,
      cdnEnabled: true,
      performanceBudget: {
        initialBundle: '300KB',
        routeChunks: '150KB',
        totalAssets: '800KB'
      }
    },
    
    [SUBDOMAINS.DOCS]: {
      cacheStrategy: 'documentation',
      serviceWorkerEnabled: true,
      compressionEnabled: true,
      cdnEnabled: true,
      performanceBudget: {
        initialBundle: '200KB',
        totalAssets: '500KB'
      }
    }
  }
  
  return configs[subdomain] || configs[SUBDOMAINS.APP]
}

/**
 * Initialize subdomain configuration
 */
export const initializeSubdomainConfig = () => {
  const currentSubdomain = detectCurrentSubdomain()
  const securityPolicy = getSubdomainSecurityPolicy(currentSubdomain)
  const performanceConfig = getSubdomainPerformanceConfig(currentSubdomain)
  
  // Apply security headers (in a real implementation, this would be done server-side)
  if (typeof document !== 'undefined') {
    // Add meta tags for security policies
    const addMetaTag = (name, content) => {
      const existing = document.querySelector(`meta[name="${name}"]`)
      if (existing) {
        existing.setAttribute('content', content)
      } else {
        const meta = document.createElement('meta')
        meta.setAttribute('name', name)
        meta.setAttribute('content', content)
        document.head.appendChild(meta)
      }
    }
    
    addMetaTag('referrer', securityPolicy.referrerPolicy)
    
    // Set X-Frame-Options equivalent
    if (securityPolicy.frameOptions) {
      addMetaTag('frame-options', securityPolicy.frameOptions)
    }
  }
  
  return {
    subdomain: currentSubdomain,
    security: securityPolicy,
    performance: performanceConfig
  }
}

/**
 * Subdomain routing helpers
 */
export const getRouteForSubdomain = (subdomain) => {
  const routes = {
    [SUBDOMAINS.WWW]: ['/', '/auth', '/about', '/contact', '/pricing'],
    [SUBDOMAINS.APP]: ['/app', '/account', '/category/*', '/transaction', '/yield/*'],
    [SUBDOMAINS.DOCS]: ['/docs/*', '/api-docs/*'],
    [SUBDOMAINS.ADMIN]: ['/admin/*']
  }
  
  return routes[subdomain] || []
}

/**
 * Check if route belongs to subdomain
 */
export const isRouteValidForSubdomain = (route, subdomain) => {
  const validRoutes = getRouteForSubdomain(subdomain)
  
  return validRoutes.some(validRoute => {
    if (validRoute.endsWith('/*')) {
      const prefix = validRoute.slice(0, -2)
      return route.startsWith(prefix)
    }
    return route === validRoute
  })
}