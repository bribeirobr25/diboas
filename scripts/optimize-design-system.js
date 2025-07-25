#!/usr/bin/env node

/**
 * Design System CSS Optimization Script
 * Replace hardcoded values with CSS custom properties
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Color mapping for optimization
const COLOR_REPLACEMENTS = {
  '#f9fafb': 'var(--color-gray-50)',
  '#f3f4f6': 'var(--color-gray-100)',
  '#e5e7eb': 'var(--color-gray-200)',
  '#d1d5db': 'var(--color-gray-300)',
  '#9ca3af': 'var(--color-gray-400)',
  '#6b7280': 'var(--color-gray-500)',
  '#4b5563': 'var(--color-gray-600)',
  '#374151': 'var(--color-gray-700)',
  '#1f2937': 'var(--color-gray-800)',
  '#111827': 'var(--color-gray-900)',
  '#ffffff': 'var(--color-surface)',
  '#fff': 'var(--color-surface)'
}

// Spacing replacements
const SPACING_REPLACEMENTS = {
  '0.25rem': 'var(--spacing-1)',
  '0.5rem': 'var(--spacing-2)',
  '0.75rem': 'var(--spacing-3)',
  '1rem': 'var(--spacing-4)',
  '1.5rem': 'var(--spacing-6)',
  '2rem': 'var(--spacing-8)'
}

// Font size replacements
const FONT_SIZE_REPLACEMENTS = {
  '0.75rem': 'var(--font-size-xs)',
  '0.875rem': 'var(--font-size-sm)',
  '1rem': 'var(--font-size-base)',
  '1.125rem': 'var(--font-size-lg)',
  '1.25rem': 'var(--font-size-xl)',
  '1.5rem': 'var(--font-size-2xl)'
}

// Border radius replacements
const BORDER_RADIUS_REPLACEMENTS = {
  '0.375rem': 'var(--border-radius)',
  '0.5rem': 'var(--border-radius-lg)'
}

/**
 * Optimize design system CSS
 */
function optimizeDesignSystemCSS() {
  const filePath = path.join(__dirname, '..', 'src', 'styles', 'design-system.css')
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ design-system.css not found')
    return false
  }

  let content = fs.readFileSync(filePath, 'utf8')
  let optimizations = 0

  // Replace colors
  Object.entries(COLOR_REPLACEMENTS).forEach(([color, variable]) => {
    const regex = new RegExp(color, 'g')
    const matches = content.match(regex)
    if (matches) {
      content = content.replace(regex, variable)
      optimizations += matches.length
      console.log(`✅ Replaced ${matches.length} instances of ${color}`)
    }
  })

  // Replace font sizes (only in font-size properties to avoid conflicts)
  Object.entries(FONT_SIZE_REPLACEMENTS).forEach(([size, variable]) => {
    const regex = new RegExp(`font-size: ${size.replace('.', '\\.')};`, 'g')
    const matches = content.match(regex)
    if (matches) {
      content = content.replace(regex, `font-size: ${variable};`)
      optimizations += matches.length
      console.log(`✅ Replaced ${matches.length} font-size instances of ${size}`)
    }
  })

  // Replace border radius values
  Object.entries(BORDER_RADIUS_REPLACEMENTS).forEach(([radius, variable]) => {
    const regex = new RegExp(`border-radius: ${radius.replace('.', '\\.')};`, 'g')
    const matches = content.match(regex)
    if (matches) {
      content = content.replace(regex, `border-radius: ${variable};`)
      optimizations += matches.length
      console.log(`✅ Replaced ${matches.length} border-radius instances of ${radius}`)
    }
  })

  // Remove excessive empty lines (keep max 2 consecutive empty lines)
  const originalLines = content.split('\n').length
  content = content.replace(/\n\n\n+/g, '\n\n')
  const newLines = content.split('\n').length
  const removedLines = originalLines - newLines

  if (removedLines > 0) {
    console.log(`✅ Removed ${removedLines} excessive empty lines`)
    optimizations += removedLines
  }

  // Save optimized content
  fs.writeFileSync(filePath, content)
  
  return optimizations
}

/**
 * Remove unused CSS from App.css
 */
function optimizeAppCSS() {
  const filePath = path.join(__dirname, '..', 'src', 'App.css')
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ App.css not found')
    return false
  }

  let content = fs.readFileSync(filePath, 'utf8')
  const originalSize = content.length

  // Remove CSS rules that are now in design-system.css (avoid duplication)
  const duplicateRules = [
    '.transaction-type-grid',
    '.asset-selection-grid', 
    '.payment-method-grid',
    '.info-box',
    '.error-box',
    '.amount-quick-options'
  ]

  duplicateRules.forEach(rule => {
    // Remove the rule and its content block
    const ruleRegex = new RegExp(`\\.${rule.replace('.', '\\.')}\\s*\\{[^}]*\\}`, 'g')
    const matches = content.match(ruleRegex)
    if (matches) {
      content = content.replace(ruleRegex, '')
      console.log(`✅ Removed duplicate rule: ${rule}`)
    }
  })

  // Remove empty CSS sections
  content = content.replace(/\/\*[^*]*\*\/\s*\n*$/gm, '') // Remove trailing comments
  content = content.replace(/\n\n\n+/g, '\n\n') // Remove excessive empty lines

  const newSize = content.length
  const savedBytes = originalSize - newSize

  if (savedBytes > 0) {
    fs.writeFileSync(filePath, content)
    console.log(`✅ Optimized App.css: saved ${savedBytes} bytes`)
    return savedBytes
  }

  return 0
}

/**
 * Add CSS minification helpers
 */
function createMinificationConfig() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json')
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found')
    return false
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  
  // Check if cssnano is already installed
  const hasCSSnano = packageJson.devDependencies?.cssnano || packageJson.dependencies?.cssnano
  
  if (!hasCSSnano) {
    console.log('💡 To enable CSS minification, run:')
    console.log('   pnpm add -D cssnano')
    console.log('   (PostCSS config already created)')
  } else {
    console.log('✅ CSS minification already configured')
  }

  return true
}

/**
 * Generate CSS optimization summary
 */
function generateOptimizationSummary(designSystemOptimizations, appCSSOptimizations) {
  const summary = {
    timestamp: new Date().toISOString(),
    optimizations: {
      designSystem: designSystemOptimizations,
      appCSS: appCSSOptimizations,
      total: designSystemOptimizations + appCSSOptimizations
    },
    estimatedSavings: {
      variableOptimizations: Math.round(designSystemOptimizations * 8), // ~8 bytes per optimization
      duplicateRemoval: appCSSOptimizations,
      total: Math.round(designSystemOptimizations * 8) + appCSSOptimizations
    },
    nextSteps: [
      'Run production build to see actual CSS size reduction',
      'Install cssnano for CSS minification',
      'Consider implementing PurgeCSS for unused style removal',
      'Monitor bundle size with each build'
    ]
  }

  const summaryPath = path.join(__dirname, '..', 'css-optimization-summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
  
  return summary
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Optimizing CSS Bundle...')
  console.log('=' .repeat(40))
  
  console.log('\n🔧 Optimizing design-system.css...')
  const designSystemOptimizations = optimizeDesignSystemCSS()
  
  console.log('\n🔧 Optimizing App.css...')
  const appCSSOptimizations = optimizeAppCSS()
  
  console.log('\n🔧 Setting up minification...')
  createMinificationConfig()
  
  console.log('\n📊 Generating summary...')
  const summary = generateOptimizationSummary(designSystemOptimizations, appCSSOptimizations)
  
  console.log('\n✅ CSS Optimization Results:')
  console.log(`  Design System: ${summary.optimizations.designSystem} optimizations`)
  console.log(`  App CSS: ${summary.optimizations.appCSS} bytes saved`)
  console.log(`  Estimated Total Savings: ${summary.estimatedSavings.total} bytes`)
  
  console.log('\n📋 Next Steps:')
  summary.nextSteps.forEach(step => {
    console.log(`  • ${step}`)
  })
  
  console.log('\n🚀 To apply optimizations:')
  console.log('  1. pnpm add -D cssnano (if not installed)')
  console.log('  2. pnpm run build')
  console.log('  3. Check new CSS bundle size')
  
  console.log('\n' + '='.repeat(40))
}

main().catch(console.error)