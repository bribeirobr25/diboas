#!/usr/bin/env node

/**
 * CSS Bundle Analysis and Optimization Script
 * Analyze CSS bundle size and suggest optimizations
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Analyze CSS files in the project
 */
function analyzeCSSFiles() {
  const analysis = {
    sourceFiles: [],
    builtFiles: [],
    totalSourceSize: 0,
    totalBuiltSize: 0,
    recommendations: []
  }

  // Analyze source CSS files
  const srcPath = path.join(__dirname, '..', 'src')
  const stylePaths = [
    path.join(srcPath, 'index.css'),
    path.join(srcPath, 'App.css'),
    path.join(srcPath, 'styles')
  ]

  stylePaths.forEach(stylePath => {
    if (fs.existsSync(stylePath)) {
      if (fs.statSync(stylePath).isDirectory()) {
        // Analyze directory
        const files = fs.readdirSync(stylePath).filter(f => f.endsWith('.css'))
        files.forEach(file => {
          const filePath = path.join(stylePath, file)
          const stats = fs.statSync(filePath)
          const sizeKB = Math.round(stats.size / 1024 * 100) / 100
          
          analysis.sourceFiles.push({
            name: path.relative(srcPath, filePath),
            size: sizeKB,
            path: filePath
          })
          analysis.totalSourceSize += sizeKB
        })
      } else {
        // Single file
        const stats = fs.statSync(stylePath)
        const sizeKB = Math.round(stats.size / 1024 * 100) / 100
        
        analysis.sourceFiles.push({
          name: path.relative(srcPath, stylePath),
          size: sizeKB,
          path: stylePath
        })
        analysis.totalSourceSize += sizeKB
      }
    }
  })

  // Analyze built CSS files
  const distPath = path.join(__dirname, '..', 'dist', 'assets')
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath).filter(f => f.endsWith('.css'))
    files.forEach(file => {
      const filePath = path.join(distPath, file)
      const stats = fs.statSync(filePath)
      const sizeKB = Math.round(stats.size / 1024 * 100) / 100
      
      analysis.builtFiles.push({
        name: file,
        size: sizeKB,
        path: filePath
      })
      analysis.totalBuiltSize += sizeKB
    })
  }

  // Generate recommendations
  if (analysis.totalBuiltSize > 100) {
    analysis.recommendations.push({
      type: 'size',
      priority: 'high',
      message: `CSS bundle size (${analysis.totalBuiltSize}KB) exceeds 100KB target`,
      suggestions: [
        'Implement CSS purging to remove unused styles',
        'Use CSS-in-JS for component-specific styles',
        'Split CSS into critical and non-critical parts',
        'Compress design-system.css which appears to be the largest file'
      ]
    })
  }

  // Check for large individual files
  analysis.sourceFiles.forEach(file => {
    if (file.size > 50) {
      analysis.recommendations.push({
        type: 'large-file',
        priority: 'medium',
        message: `Large CSS file: ${file.name} (${file.size}KB)`,
        suggestions: [
          'Split into smaller, more focused CSS files',
          'Remove unused CSS rules',
          'Use CSS custom properties instead of repetitive styles'
        ]
      })
    }
  })

  return analysis
}

/**
 * Analyze specific CSS content for optimization opportunities
 */
function analyzeDesignSystemCSS() {
  const designSystemPath = path.join(__dirname, '..', 'src', 'styles', 'design-system.css')
  
  if (!fs.existsSync(designSystemPath)) {
    return { error: 'design-system.css not found' }
  }

  const content = fs.readFileSync(designSystemPath, 'utf8')
  const lines = content.split('\n')
  
  const analysis = {
    totalLines: lines.length,
    totalSize: Math.round(content.length / 1024 * 100) / 100,
    cssRules: 0,
    mediaQueries: 0,
    comments: 0,
    emptyLines: 0,
    duplicateProperties: [],
    optimizations: []
  }

  // Basic content analysis
  lines.forEach(line => {
    const trimmed = line.trim()
    if (trimmed === '') {
      analysis.emptyLines++
    } else if (trimmed.startsWith('/*') || trimmed.startsWith('*/') || trimmed.startsWith('*')) {
      analysis.comments++
    } else if (trimmed.includes('{')) {
      analysis.cssRules++
    } else if (trimmed.startsWith('@media')) {
      analysis.mediaQueries++
    }
  })

  // Look for optimization opportunities
  if (analysis.emptyLines > 50) {
    analysis.optimizations.push({
      type: 'whitespace',
      savings: 'Minor',
      description: `Remove ${analysis.emptyLines} empty lines`
    })
  }

  if (analysis.comments > 100) {
    analysis.optimizations.push({
      type: 'comments',
      savings: 'Minor',
      description: 'Remove or minimize comments in production build'
    })
  }

  // Look for repetitive patterns
  const colorMatches = content.match(/#[0-9a-fA-F]{6}/g) || []
  const colorCounts = {}
  colorMatches.forEach(color => {
    colorCounts[color] = (colorCounts[color] || 0) + 1
  })

  const frequentColors = Object.entries(colorCounts)
    .filter(([color, count]) => count > 10)
    .sort((a, b) => b[1] - a[1])

  if (frequentColors.length > 0) {
    analysis.optimizations.push({
      type: 'css-variables',
      savings: 'Medium',
      description: `Use CSS custom properties for frequently used colors: ${frequentColors.slice(0, 3).map(([color]) => color).join(', ')}`
    })
  }

  // Look for utility class patterns
  const utilityPatterns = [
    { pattern: /\.flex-[a-z-]+/g, name: 'flex utilities' },
    { pattern: /\.text-[a-z-]+/g, name: 'text utilities' },
    { pattern: /\.bg-[a-z-]+/g, name: 'background utilities' },
    { pattern: /\.p-[0-9]+/g, name: 'padding utilities' },
    { pattern: /\.m-[0-9]+/g, name: 'margin utilities' }
  ]

  utilityPatterns.forEach(({ pattern, name }) => {
    const matches = content.match(pattern) || []
    if (matches.length > 20) {
      analysis.optimizations.push({
        type: 'utility-consolidation',
        savings: 'Medium',
        description: `Consider consolidating ${matches.length} ${name} into semantic classes`
      })
    }
  })

  return analysis
}

/**
 * Generate CSS optimization plan
 */
function generateOptimizationPlan(cssAnalysis, designSystemAnalysis) {
  const plan = {
    currentSize: cssAnalysis.totalBuiltSize,
    targetSize: 100,
    estimatedSavings: 0,
    actions: [],
    priority: 'medium'
  }

  const excessSize = cssAnalysis.totalBuiltSize - 100
  if (excessSize > 0) {
    plan.priority = excessSize > 30 ? 'high' : 'medium'
    plan.estimatedSavings = Math.min(excessSize, cssAnalysis.totalBuiltSize * 0.3) // Conservative estimate
  }

  // Plan specific actions
  if (designSystemAnalysis && !designSystemAnalysis.error) {
    // CSS variable optimization
    const variableOptimization = designSystemAnalysis.optimizations.find(o => o.type === 'css-variables')
    if (variableOptimization) {
      plan.actions.push({
        action: 'implement-css-variables',
        description: 'Replace frequently used color values with CSS custom properties',
        estimatedSavings: '5-10KB',
        effort: 'Low',
        priority: 'Medium'
      })
    }

    // Utility consolidation
    const utilityOptimization = designSystemAnalysis.optimizations.find(o => o.type === 'utility-consolidation')
    if (utilityOptimization) {
      plan.actions.push({
        action: 'consolidate-utilities',
        description: 'Group similar utility classes into semantic component classes',
        estimatedSavings: '10-20KB',
        effort: 'Medium',
        priority: 'High'
      })
    }

    // Whitespace optimization
    plan.actions.push({
      action: 'minify-css',
      description: 'Enable CSS minification and remove development comments',
      estimatedSavings: '5-15KB',
      effort: 'Low',
      priority: 'High'
    })
  }

  // CSS purging
  plan.actions.push({
    action: 'css-purging',
    description: 'Implement PurgeCSS to remove unused styles',
    estimatedSavings: '20-40KB',
    effort: 'Medium',
    priority: 'High'
  })

  // CSS splitting
  plan.actions.push({
    action: 'css-splitting',
    description: 'Split CSS into critical and non-critical parts',
    estimatedSavings: '0KB (performance gain)',
    effort: 'High',
    priority: 'Low'
  })

  return plan
}

/**
 * Print analysis report
 */
function printReport(cssAnalysis, designSystemAnalysis, plan) {
  console.log('\n🎨 diBoaS CSS Bundle Analysis')
  console.log('=' .repeat(50))
  
  console.log(`📊 Current State:`)
  console.log(`  Source Files: ${cssAnalysis.sourceFiles.length}`)
  console.log(`  Total Source Size: ${cssAnalysis.totalSourceSize.toFixed(1)}KB`)
  console.log(`  Built Bundle Size: ${cssAnalysis.totalBuiltSize.toFixed(1)}KB`)
  console.log(`  Target Size: 100KB`)
  console.log(`  Excess: ${(cssAnalysis.totalBuiltSize - 100).toFixed(1)}KB`)

  if (cssAnalysis.sourceFiles.length > 0) {
    console.log(`\n📁 Source Files:`)
    cssAnalysis.sourceFiles
      .sort((a, b) => b.size - a.size)
      .forEach(file => {
        console.log(`  ${file.size.toString().padStart(6)}KB  ${file.name}`)
      })
  }

  if (designSystemAnalysis && !designSystemAnalysis.error) {
    console.log(`\n🔍 Design System Analysis:`)
    console.log(`  File Size: ${designSystemAnalysis.totalSize}KB`)
    console.log(`  CSS Rules: ${designSystemAnalysis.cssRules}`)
    console.log(`  Media Queries: ${designSystemAnalysis.mediaQueries}`)
    console.log(`  Comments: ${designSystemAnalysis.comments} lines`)
    console.log(`  Empty Lines: ${designSystemAnalysis.emptyLines}`)

    if (designSystemAnalysis.optimizations.length > 0) {
      console.log(`\n💡 Optimization Opportunities:`)
      designSystemAnalysis.optimizations.forEach(opt => {
        console.log(`  ${opt.savings === 'High' ? '🔴' : opt.savings === 'Medium' ? '🟡' : '🟢'} ${opt.description}`)
      })
    }
  }

  console.log(`\n🎯 Optimization Plan:`)
  console.log(`  Current: ${plan.currentSize.toFixed(1)}KB`)
  console.log(`  Target: ${plan.targetSize}KB`)
  console.log(`  Estimated Savings: ${plan.estimatedSavings.toFixed(1)}KB`)
  console.log(`  Priority: ${plan.priority.toUpperCase()}`)

  if (plan.actions.length > 0) {
    console.log(`\n🔧 Recommended Actions:`)
    plan.actions
      .sort((a, b) => {
        const priority = { High: 3, Medium: 2, Low: 1 }
        return priority[b.priority] - priority[a.priority]
      })
      .forEach(action => {
        const priorityEmoji = action.priority === 'High' ? '🔴' : action.priority === 'Medium' ? '🟡' : '🟢'
        console.log(`  ${priorityEmoji} ${action.description}`)
        console.log(`     Savings: ${action.estimatedSavings} | Effort: ${action.effort}`)
      })
  }

  console.log(`\n📋 Quick Wins:`)
  console.log(`  1. Enable CSS minification in build`)
  console.log(`  2. Implement PurgeCSS for unused style removal`)
  console.log(`  3. Use CSS custom properties for repeated values`)
  console.log(`  4. Remove development comments from production build`)

  console.log('\n' + '='.repeat(50))
}

/**
 * Create CSS optimization configuration
 */
function createCSSOptimizationConfig() {
  // Create PurgeCSS config
  const purgeCSSConfig = `module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/**/*.html',
    './index.html'
  ],
  css: ['./src/**/*.css'],
  whitelist: [
    // Keep these classes even if not detected
    'error-boundary-container',
    'performance-dashboard-card',
    'transaction-status-compact'
  ],
  whitelistPatterns: [
    // Keep classes matching these patterns
    /^semantic-/,
    /^transaction-/,
    /^account-/,
    /^payment-/,
    /^performance-/
  ],
  extractors: [
    {
      extractor: content => content.match(/[A-Za-z0-9-_:/]+/g) || [],
      extensions: ['js', 'jsx', 'ts', 'tsx']
    }
  ]
}`

  const purgeCSSPath = path.join(__dirname, '..', 'purgecss.config.js')
  fs.writeFileSync(purgeCSSPath, purgeCSSConfig)

  // Create optimized Vite config for CSS
  const viteOptimizedConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// CSS optimization configuration
export default defineConfig({
  plugins: [react()],
  css: {
    // CSS optimization settings
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        // Enable CSS custom properties optimization
        charset: false
      }
    }
  },
  build: {
    cssCodeSplit: true, // Enable CSS code splitting
    cssMinify: 'esbuild', // Use esbuild for CSS minification
    rollupOptions: {
      output: {
        // Separate CSS for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (ext === 'css') {
            return 'assets/styles/[name]-[hash].[ext]'
          }
          return 'assets/[name]-[hash].[ext]'
        }
      }
    }
  }
})`

  const viteOptimizedPath = path.join(__dirname, '..', 'vite.config.css-optimized.js')
  fs.writeFileSync(viteOptimizedPath, viteOptimizedConfig)

  console.log(`💾 Created CSS optimization configs:`)
  console.log(`  - ${purgeCSSPath}`)
  console.log(`  - ${viteOptimizedPath}`)
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Analyzing CSS bundle...')
  
  const cssAnalysis = analyzeCSSFiles()
  const designSystemAnalysis = analyzeDesignSystemCSS()
  const plan = generateOptimizationPlan(cssAnalysis, designSystemAnalysis)
  
  printReport(cssAnalysis, designSystemAnalysis, plan)
  
  // Create optimization configurations
  createCSSOptimizationConfig()
  
  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'css-optimization-report.json')
  const fullReport = {
    timestamp: new Date().toISOString(),
    css: cssAnalysis,
    designSystem: designSystemAnalysis,
    optimization: plan
  }
  fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2))
  console.log(`💾 Detailed report saved to: ${reportPath}`)
  
  // Recommendations summary
  if (plan.estimatedSavings > 0) {
    console.log(`\n✅ CSS optimization will reduce bundle by ~${plan.estimatedSavings.toFixed(1)}KB`)
    console.log(`   Target achievement: ${((100 - (plan.currentSize - plan.estimatedSavings)) / plan.currentSize * 100).toFixed(1)}% size reduction`)
  }
}

main().catch(console.error)