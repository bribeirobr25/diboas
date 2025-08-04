/**
 * FinTech SEO Utilities
 * Comprehensive SEO management for financial applications
 */

// import { Helmet } from 'react-helmet-async' // Removed - not used in this utility file

/**
 * SEO configuration constants
 */
export const SEO_CONFIG = {
  defaultTitle: 'diBoaS - OneFi Platform | Unified Traditional & DeFi Finance',
  titleTemplate: '%s | diBoaS OneFi Platform',
  defaultDescription: 'diBoaS revolutionizes finance with OneFi - seamlessly unifying traditional banking, crypto, and DeFi in one secure platform. Experience 1-click transactions, educational resources, and unified financial management.',
  defaultKeywords: [
    'fintech platform',
    'unified finance',
    'onefi',
    'traditional finance',
    'defi platform',
    'crypto banking',
    'financial education',
    '1-click transactions',
    'secure finance app',
    'digital banking',
    'blockchain finance',
    'investment platform'
  ],
  siteUrl: import.meta.env.VITE_SITE_URL || 'https://diboas.com',
  siteName: 'diBoaS OneFi Platform',
  defaultImage: '/images/og-default.jpg',
  twitterHandle: '@diBoaS',
  organization: {
    name: 'diBoaS',
    url: 'https://diboas.com',
    logo: 'https://diboas.com/logo.png',
    type: 'FinancialService'
  }
}

/**
 * Generate page-specific SEO metadata
 */
export const generateSEOConfig = ({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  section,
  noIndex = false,
  canonical
}) => {
  const seoTitle = title ? `${title} | diBoaS OneFi Platform` : SEO_CONFIG.defaultTitle
  const seoDescription = description || SEO_CONFIG.defaultDescription
  const seoKeywords = [...SEO_CONFIG.defaultKeywords, ...keywords].join(', ')
  const seoImage = image || SEO_CONFIG.defaultImage
  const seoUrl = url || SEO_CONFIG.siteUrl
  const canonicalUrl = canonical || seoUrl

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    image: seoImage.startsWith('http') ? seoImage : `${SEO_CONFIG.siteUrl}${seoImage}`,
    url: seoUrl,
    canonical: canonicalUrl,
    type,
    author,
    publishedTime,
    modifiedTime,
    section,
    noIndex
  }
}

/**
 * SEO Component for React Helmet management
 * Note: This needs to be used in JSX components, not imported directly
 */
export const createSEOHelmet = ({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  section,
  noIndex = false,
  canonical,
  structuredData = null
}) => {
  const seo = generateSEOConfig({
    title,
    description,
    keywords,
    image,
    url,
    type,
    author,
    publishedTime,
    modifiedTime,
    section,
    noIndex,
    canonical
  })

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    canonical: seo.canonical,
    robots: noIndex ? 'noindex,nofollow' : 'index,follow',
    author,
    openGraph: {
      title: seo.title,
      description: seo.description,
      image: seo.image,
      url: seo.url,
      type: seo.type,
      siteName: SEO_CONFIG.siteName,
      locale: 'en_US'
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      image: seo.image,
      site: SEO_CONFIG.twitterHandle,
      creator: SEO_CONFIG.twitterHandle
    },
    structuredData
  }
}

/**
 * Page-specific SEO configurations
 */
export const PAGE_SEO_CONFIG = {
  home: {
    title: 'Unified Finance Platform',
    description: 'Experience the future of finance with diBoaS OneFi - seamlessly unifying traditional banking, cryptocurrency, and DeFi in one secure, user-friendly platform.',
    keywords: ['unified finance', 'onefi platform', 'traditional banking', 'defi integration', 'crypto banking'],
    structuredData: {
      "@context": "https://schema.org",
      "@type": "FinancialService",
      "name": "diBoaS OneFi Platform",
      "description": "Unified finance platform combining traditional banking, crypto, and DeFi",
      "url": "https://diboas.com",
      "logo": "https://diboas.com/logo.png",
      "sameAs": [
        "https://twitter.com/diboas",
        "https://linkedin.com/company/diboas"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "areaServed": "US",
        "availableLanguage": ["English"]
      }
    }
  },
  
  traditional: {
    title: 'Traditional Finance Solutions',
    description: 'Access comprehensive traditional banking services with modern security and user experience. Manage accounts, transfers, and investments seamlessly.',
    keywords: ['traditional banking', 'digital banking', 'bank accounts', 'financial services', 'secure banking'],
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BankOrCreditUnion",
      "name": "diBoaS Traditional Finance",
      "description": "Modern traditional banking services with enhanced security",
      "url": "https://diboas.com/traditional",
      "parentOrganization": {
        "@type": "FinancialService",
        "name": "diBoaS"
      }
    }
  },
  
  crypto: {
    title: 'Cryptocurrency Management',
    description: 'Securely buy, sell, and manage cryptocurrencies with institutional-grade security. Trade Bitcoin, Ethereum, and other digital assets with confidence.',
    keywords: ['cryptocurrency', 'bitcoin', 'ethereum', 'crypto trading', 'digital assets', 'blockchain'],
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Cryptocurrency Management",
      "description": "Secure cryptocurrency trading and management platform",
      "provider": {
        "@type": "FinancialService",
        "name": "diBoaS"
      },
      "serviceType": "Cryptocurrency Exchange"
    }
  },
  
  defi: {
    title: 'DeFi Integration Platform',
    description: 'Access decentralized finance protocols safely through our curated DeFi integration. Earn yield, provide liquidity, and participate in DeFi with confidence.',
    keywords: ['defi', 'decentralized finance', 'yield farming', 'liquidity pools', 'smart contracts', 'web3'],
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "DeFi Integration Platform",
      "description": "Safe access to decentralized finance protocols",
      "provider": {
        "@type": "FinancialService",
        "name": "diBoaS"
      },
      "serviceType": "Decentralized Finance"
    }
  },
  
  education: {
    title: 'Financial Education Center',
    description: 'Learn about traditional finance, cryptocurrency, and DeFi through comprehensive educational resources. Build financial literacy with expert-curated content.',
    keywords: ['financial education', 'financial literacy', 'crypto education', 'defi education', 'investment education'],
    structuredData: {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "diBoaS Financial Education Center",
      "description": "Comprehensive financial education platform",
      "url": "https://diboas.com/education",
      "parentOrganization": {
        "@type": "FinancialService",
        "name": "diBoaS"
      }
    }
  }
}

/**
 * Generate structured data for different content types
 */
export const generateStructuredData = {
  // Organization markup
  organization: () => ({
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": SEO_CONFIG.organization.name,
    "url": SEO_CONFIG.organization.url,
    "logo": SEO_CONFIG.organization.logo,
    "description": "Unified finance platform combining traditional banking, cryptocurrency, and DeFi",
    "foundingDate": "2024",
    "areaServed": {
      "@type": "Country",
      "name": "United States"
    },
    "serviceType": [
      "Digital Banking",
      "Cryptocurrency Exchange",
      "Investment Platform",
      "Financial Education"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "areaServed": "US",
      "availableLanguage": ["English"]
    }
  }),

  // Financial service markup
  financialService: (name, description, serviceType) => ({
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    "name": name,
    "description": description,
    "provider": {
      "@type": "FinancialService",
      "name": SEO_CONFIG.organization.name
    },
    "category": serviceType,
    "termsOfService": `${SEO_CONFIG.siteUrl}/terms`,
    "privacyPolicy": `${SEO_CONFIG.siteUrl}/privacy`
  }),

  // FAQ markup
  faq: (faqItems) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  }),

  // Educational content markup
  educationalContent: (title, description, author, datePublished) => ({
    "@context": "https://schema.org",
    "@type": "EducationalContent",
    "name": title,
    "description": description,
    "author": {
      "@type": "Organization",
      "name": author || SEO_CONFIG.organization.name
    },
    "datePublished": datePublished,
    "publisher": {
      "@type": "Organization",
      "name": SEO_CONFIG.organization.name,
      "logo": SEO_CONFIG.organization.logo
    },
    "educationalLevel": "Beginner to Advanced",
    "learningResourceType": "Article"
  }),

  // Breadcrumb markup
  breadcrumb: (breadcrumbItems) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  })
}

/**
 * SEO monitoring and analytics utilities
 */
export const seoMonitoring = {
  // Track page views with SEO metadata
  trackPageView: (pageData) => {
    if (typeof window !== 'undefined' && window.gtag) {
      const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
      if (measurementId) {
        window.gtag('config', measurementId, {
          page_title: pageData.title,
          page_location: pageData.url,
          content_group1: pageData.section || 'General'
        })
      }
    }
  },

  // Monitor Core Web Vitals
  monitorCoreWebVitals: () => {
    if (typeof window !== 'undefined' && 'web-vitals' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log)
        getFID(console.log)
        getFCP(console.log)
        getLCP(console.log)
        getTTFB(console.log)
      })
    }
  },

  // Generate SEO report
  generateSEOReport: () => {
    const report = {
      url: window.location.href,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content,
      keywords: document.querySelector('meta[name="keywords"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      ogImage: document.querySelector('meta[property="og:image"]')?.content,
      structuredData: [],
      timestamp: new Date().toISOString()
    }

    // Extract structured data
    const scripts = document.querySelectorAll('script[type="application/ld+json"]')
    scripts.forEach(script => {
      try {
        report.structuredData.push(JSON.parse(script.textContent))
      } catch (e) {
        logger.warn('Invalid structured data:', e)
      }
    })

    return report
  }
}

/**
 * React hooks for SEO
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import logger from './logger'

export const useSEO = (seoConfig) => {
  const location = useLocation()

  useEffect(() => {
    // Track page view
    seoMonitoring.trackPageView({
      title: seoConfig.title,
      url: `${SEO_CONFIG.siteUrl}${location.pathname}`,
      section: seoConfig.section
    })

    // Monitor performance
    seoMonitoring.monitorCoreWebVitals()
  }, [location, seoConfig])

  return {
    generateReport: seoMonitoring.generateSEOReport
  }
}

export default {
  SEO_CONFIG,
  generateSEOConfig,
  PAGE_SEO_CONFIG,
  generateStructuredData,
  seoMonitoring,
  useSEO
}