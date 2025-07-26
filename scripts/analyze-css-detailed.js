#!/usr/bin/env node

/**
 * Detailed CSS analysis to identify additional optimization opportunities
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

async function analyzeCSSDetailed() {
  try {
    console.log('🔍 Detailed CSS analysis for further optimization...')
    
    // Read the current CSS file
    const distFiles = await fs.readdir(path.join(rootDir, 'dist/assets'))
    const cssFile = distFiles.find(file => file.endsWith('.css'))
    
    if (!cssFile) {
      throw new Error('No CSS file found')
    }
    
    const cssPath = path.join(rootDir, 'dist/assets', cssFile)
    const css = await fs.readFile(cssPath, 'utf-8')
    
    console.log(`📊 Analyzing ${cssFile} (${(css.length / 1024).toFixed(1)}KB)`)
    
    // Analyze CSS content composition
    const analysis = {
      totalSize: css.length,
      utilities: 0,
      components: 0,
      base: 0,
      mediaQueries: 0,
      customProperties: 0,
      duplicates: 0
    }
    
    // Count different types of rules
    const utilityPattern = /\.(w-|h-|p-|m-|text-|bg-|border-|flex|grid|absolute|relative)/g
    const componentPattern = /\.(btn|card|modal|nav|form)/g
    const mediaPattern = /@media/g
    const customPropPattern = /--[a-zA-Z-]+:/g
    
    analysis.utilities = (css.match(utilityPattern) || []).length
    analysis.components = (css.match(componentPattern) || []).length
    analysis.mediaQueries = (css.match(mediaPattern) || []).length
    analysis.customProperties = (css.match(customPropPattern) || []).length
    
    // Estimate sizes
    const avgUtilitySize = 50 // bytes
    const avgComponentSize = 200 // bytes
    const avgMediaSize = 300 // bytes
    
    const estimatedUtilitySize = analysis.utilities * avgUtilitySize
    const estimatedComponentSize = analysis.components * avgComponentSize
    const estimatedMediaSize = analysis.mediaQueries * avgMediaSize
    
    console.log('\n📈 CSS Composition Analysis:')
    console.log(`   Utility classes: ${analysis.utilities} (~${(estimatedUtilitySize/1024).toFixed(1)}KB)`)
    console.log(`   Component classes: ${analysis.components} (~${(estimatedComponentSize/1024).toFixed(1)}KB)`)
    console.log(`   Media queries: ${analysis.mediaQueries} (~${(estimatedMediaSize/1024).toFixed(1)}KB)`)
    console.log(`   Custom properties: ${analysis.customProperties}`)
    
    // Check for potential optimizations
    const optimizations = []
    
    if (estimatedUtilitySize > 50000) { // >50KB of utilities
      optimizations.push({
        type: 'Aggressive Tailwind Purging',
        potential: '20-30KB',
        description: 'Further reduce Tailwind utilities by analyzing actual usage patterns'
      })
    }
    
    if (analysis.mediaQueries > 50) {
      optimizations.push({
        type: 'Media Query Optimization',
        potential: '5-10KB', 
        description: 'Combine and optimize responsive breakpoints'
      })
    }
    
    if (css.includes('/*')) {
      optimizations.push({
        type: 'Comment Removal',
        potential: '1-3KB',
        description: 'Remove any remaining comments'
      })
    }
    
    // Check for unused CSS custom properties
    const customProps = css.match(/--[a-zA-Z-]+/g) || []
    const uniqueProps = [...new Set(customProps)]
    if (uniqueProps.length > 50) {
      optimizations.push({
        type: 'Custom Property Cleanup',
        potential: '2-5KB',
        description: 'Remove unused CSS custom properties'
      })
    }
    
    // Advanced compression opportunities
    optimizations.push({
      type: 'Critical CSS Extraction',
      potential: '30-40KB reduction in initial load',
      description: 'Extract above-the-fold CSS and defer non-critical styles'
    })
    
    optimizations.push({
      type: 'CSS Modules/Scoped Styles',
      potential: '15-25KB',
      description: 'Convert to CSS modules for better tree-shaking'
    })
    
    console.log('\n🎯 Optimization Opportunities:')
    optimizations.forEach((opt, i) => {
      console.log(`   ${i + 1}. ${opt.type}`)
      console.log(`      Potential savings: ${opt.potential}`)
      console.log(`      Description: ${opt.description}\n`)
    })
    
    // Calculate potential target
    const currentKB = css.length / 1024
    const potentialSavings = 40 // Conservative estimate
    const targetKB = Math.max(60, currentKB - potentialSavings)
    
    console.log(`💡 Further optimization potential:`)
    console.log(`   Current: ${currentKB.toFixed(1)}KB`)
    console.log(`   Potential target: ${targetKB.toFixed(1)}KB`)
    console.log(`   Additional savings: ${(currentKB - targetKB).toFixed(1)}KB`)
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message)
  }
}

analyzeCSSDetailed()