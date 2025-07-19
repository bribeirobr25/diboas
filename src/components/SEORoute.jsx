/**
 * SEO Route Component
 * Provides automatic SEO management for route-based components
 */

import { PAGE_SEO_CONFIG, useSEO } from '../utils/seoUtils.js'
import SEOHelmet from './SEOHelmet.jsx'

export default function SEORoute({ 
  children, 
  pageKey, 
  customSEO = {}, 
  structuredData = null 
}) {
  // Get base SEO config for the page
  const baseSEO = PAGE_SEO_CONFIG[pageKey] || {
    title: 'diBoaS OneFi Platform',
    description: 'Unified finance platform combining traditional banking, crypto, and DeFi',
    keywords: ['fintech', 'finance platform', 'unified banking'],
    structuredData: null
  }

  // Merge custom SEO with base config
  const seoConfig = {
    ...baseSEO,
    ...customSEO,
    keywords: [...(baseSEO.keywords || []), ...(customSEO.keywords || [])],
    structuredData: structuredData || baseSEO.structuredData
  }

  // Use SEO hook for analytics
  useSEO(seoConfig)

  return (
    <>
      <SEOHelmet
        title={seoConfig.title}
        description={seoConfig.description}
        keywords={seoConfig.keywords}
        structuredData={seoConfig.structuredData}
        url={customSEO.url}
        type={customSEO.type || 'website'}
        author={customSEO.author}
        publishedTime={customSEO.publishedTime}
        modifiedTime={customSEO.modifiedTime}
        section={customSEO.section}
        noIndex={customSEO.noIndex}
        canonical={customSEO.canonical}
      />
      {children}
    </>
  )
}