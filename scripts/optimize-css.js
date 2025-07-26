#!/usr/bin/env node

/**
 * CSS Optimization Script
 * Analyzes used CSS classes and creates an optimized design-system.css
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Classes that are actually used based on our analysis
const USED_CLASSES = [
  // Core layout classes
  'app-container', 'page-container', 'page-container-wide', 'content-section',
  'main-layout', 'center-content', 'content-container', 'main-navigation',
  
  // Typography
  'page-title', 'section-title', 'subsection-title', 'card-title', 'card-description',
  'field-label', 'help-text', 'error-text', 'success-text',
  'hero-title', 'hero-subtitle', 'gradient-text',
  
  // Card components
  'base-card', 'interactive-card', 'summary-card', 'summary-card--horizontal',
  'status-card', 'status-card--success', 'status-card--warning', 'status-card--error',
  'main-card', 'feature-card',
  
  // Financial components
  'balance-display', 'balance-amount', 'balance-amount--large', 'balance-amount--small',
  'balance-currency', 'balance-change', 'balance-change--positive', 'balance-change--negative',
  'portfolio-asset-card', 'portfolio-asset__header', 'portfolio-asset__name',
  'portfolio-asset__symbol', 'portfolio-asset__value', 'portfolio-asset__change',
  
  // Transaction components (heavily used)
  'transaction-list', 'transaction-item', 'transaction-item__content',
  'transaction-item__icon-container', 'transaction-item__details',
  'transaction-item__description', 'transaction-item__meta',
  'transaction-item__amount-container', 'transaction-item__amount',
  'transaction-item__amount--positive', 'transaction-item__amount--negative', 'transaction-item__amount--neutral',
  'transaction-form-grid', 'transaction-form-title', 'crypto-asset-selection-grid', 'crypto-asset-selector',
  'transaction-summary-content', 'transaction-summary-row',
  'fee-details-toggle', 'fee-breakdown-row',
  'transaction-total-section', 'transaction-total-row',
  'transaction-action-section', 'transaction-execute-button',
  'transaction-type-selection-grid', 'transaction-type-button',
  'transaction-type-info-panel', 'payment-method-selection-grid',
  'payment-method-option-button',
  'transaction-status-compact', 'status-indicator-icon',
  'transaction-info-container', 'transaction-status-header',
  'transaction-title-text', 'status-close-button',
  'transaction-status-details', 'status-text',
  'status-progress-bar', 'status-progress-fill', 'status-time-remaining',
  
  // Form components
  'form-container', 'form-group', 'form-row', 'input-container',
  'input-field', 'input-field--error', 'input-field--success', 'input-field--large',
  'input-prefix', 'input-suffix', 'input-with-prefix', 'input-with-suffix',
  'amount-input-container', 'asset-selector', 'currency-label',
  'amount-quick-options', 'amount-option-button',
  
  // Button components
  'button-base', 'button-primary', 'button-secondary', 'button-success', 'button-danger', 'button-ghost',
  'button--small', 'button--large', 'button--full-width',
  'cta-button', 'secondary-button', 'sign-in-button', 'ghost-button',
  
  // Navigation
  'nav-header', 'nav-header__brand', 'nav-header__logo', 'nav-header__title', 'nav-header__actions',
  'tab-container', 'tab-button', 'tab-button--active',
  'page-header', 'header-navigation-section', 'header-actions-section',
  
  // Modal & overlays
  'modal-overlay', 'modal-content', 'dropdown-container', 'dropdown-menu',
  'dropdown-item', 'dropdown-item--selected',
  
  // Dashboard grid
  'dashboard-grid',
  
  // Status & feedback
  'loading-spinner', 'empty-state', 'empty-state__icon',
  'empty-state__title', 'empty-state__description',
  'alert-container', 'alert-container--info', 'alert-container--success',
  'alert-container--warning', 'alert-container--error',
  
  // Error boundary
  'error-boundary-container', 'error-boundary-card', 'error-boundary-header',
  'error-boundary-logo', 'error-boundary-icon', 'error-boundary-title',
  'error-boundary-content', 'error-boundary-message',
  'development-error-panel', 'development-error-title', 'development-error-details',
  'error-boundary-actions', 'action-button-full',
  
  // Performance dashboard
  'performance-dashboard-toggle', 'performance-dashboard-card',
  'performance-dashboard-header', 'performance-dashboard-title-section',
  'performance-dashboard-title', 'performance-dashboard-actions',
  'performance-action-button', 'performance-dashboard-content',
  
  // Landing page
  'landing-page-section', 'landing-page-section--compact',
  'hero-section', 'feature-grid', 'feature-icon',
  'stats-grid', 'stats-number', 'transaction-actions-grid', 'education-grid',
  'grid-2-cols',
  
  // Gradient classes
  'blue-gradient', 'purple-gradient', 'green-gradient', 'orange-gradient',
  
  // Layout utilities
  'flex-center', 'flex-between', 'flex-start', 'flex-end', 'flex-col',
  'gap-sm', 'gap-md', 'gap-lg', 'gap-xl',
  'mb-sm', 'mb-md', 'mb-lg', 'mb-xl',
  'mt-sm', 'mt-md', 'mt-lg', 'mt-xl',
  'p-sm', 'p-md', 'p-lg', 'p-xl',
]

// CSS class patterns that should be preserved
const USED_PATTERNS = [
  /^:root/,           // CSS variables
  /^--/,              // CSS custom properties
  /^\./,              // All actual CSS classes start with .
  /^@/,               // Media queries and other at-rules
  /^html/,            // HTML element styles
  /^body/,            // Body element styles
  /^\*/,              // Universal selector
]

async function analyzeCSS() {
  console.log('🔍 Analyzing design-system.css for optimization...')
  
  const cssPath = path.join(rootDir, 'src/styles/design-system.css')
  const cssContent = await fs.readFile(cssPath, 'utf-8')
  
  // Split into logical chunks (CSS rules)
  const cssRules = cssContent.split(/(?=\n[.:#@]|^[.:#@])/).filter(rule => rule.trim())
  
  console.log(`📊 Found ${cssRules.length} CSS rules in design-system.css`)
  
  // Filter rules that contain used classes
  const usedRules = cssRules.filter(rule => {
    // Always keep root variables, media queries, etc.
    if (USED_PATTERNS.some(pattern => pattern.test(rule.trim()))) {
      return true
    }
    
    // Check if any used class is in this rule
    return USED_CLASSES.some(className => {
      return rule.includes(`.${className}`) || rule.includes(`${className}`)
    })
  })
  
  console.log(`✅ Kept ${usedRules.length} CSS rules (${((usedRules.length / cssRules.length) * 100).toFixed(1)}%)`)
  
  // Reconstruct CSS
  const optimizedCSS = usedRules.join('\n').trim()
  
  return {
    original: cssContent,
    optimized: optimizedCSS,
    reduction: cssContent.length - optimizedCSS.length,
    compressionRatio: ((cssContent.length - optimizedCSS.length) / cssContent.length * 100).toFixed(1)
  }
}

async function createOptimizedCSS() {
  try {
    const result = await analyzeCSS()
    
    // Create optimized version
    const optimizedPath = path.join(rootDir, 'src/styles/design-system.optimized.css')
    await fs.writeFile(optimizedPath, result.optimized)
    
    console.log(`\n📦 CSS Optimization Results:`)
    console.log(`   Original size: ${(result.original.length / 1024).toFixed(1)} KB`)
    console.log(`   Optimized size: ${(result.optimized.length / 1024).toFixed(1)} KB`)
    console.log(`   Reduction: ${(result.reduction / 1024).toFixed(1)} KB (${result.compressionRatio}%)`)
    console.log(`   Optimized file: ${optimizedPath}`)
    
    return result
  } catch (error) {
    console.error('❌ CSS optimization failed:', error)
    throw error
  }
}

// Run optimization
if (import.meta.url === `file://${process.argv[1]}`) {
  createOptimizedCSS()
    .then(() => console.log('\n✨ CSS optimization complete!'))
    .catch(error => {
      console.error('💥 Optimization failed:', error)
      process.exit(1)
    })
}

export { createOptimizedCSS, analyzeCSS }