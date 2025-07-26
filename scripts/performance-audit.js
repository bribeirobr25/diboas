#!/usr/bin/env node

/**
 * Performance audit script to identify optimization opportunities
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

async function performanceAudit() {
  try {
    console.log('🔍 Performance audit analysis...')
    
    // Analyze bundle sizes
    const distFiles = await fs.readdir(path.join(rootDir, 'dist/assets'))
    
    const jsFiles = distFiles.filter(f => f.endsWith('.js'))
    const cssFiles = distFiles.filter(f => f.endsWith('.css'))
    const imageFiles = distFiles.filter(f => /\.(png|jpg|jpeg|svg|webp)$/.test(f))
    
    console.log('\n📦 Bundle Analysis:')
    
    // Analyze JS bundles
    let totalJS = 0
    for (const file of jsFiles) {
      const stats = await fs.stat(path.join(rootDir, 'dist/assets', file))
      const sizeKB = (stats.size / 1024).toFixed(1)
      totalJS += stats.size
      
      if (stats.size > 50 * 1024) { // Flag large JS files
        console.log(`   ⚠️  ${file}: ${sizeKB}KB (Large)`)
      } else {
        console.log(`   ✅ ${file}: ${sizeKB}KB`)
      }
    }
    
    // Analyze CSS
    let totalCSS = 0
    for (const file of cssFiles) {
      const stats = await fs.stat(path.join(rootDir, 'dist/assets', file))
      const sizeKB = (stats.size / 1024).toFixed(1)
      totalCSS += stats.size
      console.log(`   📄 ${file}: ${sizeKB}KB`)
    }
    
    // Analyze images
    let totalImages = 0
    for (const file of imageFiles) {
      const stats = await fs.stat(path.join(rootDir, 'dist/assets', file))
      const sizeKB = (stats.size / 1024).toFixed(1)
      totalImages += stats.size
      
      if (stats.size > 500 * 1024) { // Flag large images
        console.log(`   ⚠️  ${file}: ${sizeKB}KB (Consider optimization)`)
      } else {
        console.log(`   🖼️  ${file}: ${sizeKB}KB`)
      }
    }
    
    const totalKB = (totalJS + totalCSS + totalImages) / 1024
    
    console.log('\n📊 Bundle Summary:')
    console.log(`   JavaScript: ${(totalJS / 1024).toFixed(1)}KB`)
    console.log(`   CSS: ${(totalCSS / 1024).toFixed(1)}KB`) 
    console.log(`   Images: ${(totalImages / 1024).toFixed(1)}KB`)
    console.log(`   Total: ${totalKB.toFixed(1)}KB`)
    
    // Performance recommendations
    console.log('\n🎯 Performance Optimization Opportunities:')
    
    const recommendations = []
    
    if (totalJS > 200 * 1024) {
      recommendations.push({
        category: 'JavaScript Bundle',
        issue: `Large JS bundle (${(totalJS / 1024).toFixed(1)}KB)`,
        solution: 'Implement code splitting and lazy loading',
        impact: 'High - Faster initial load'
      })
    }
    
    if (totalImages > 2000 * 1024) {
      recommendations.push({
        category: 'Image Optimization',
        issue: `Large image assets (${(totalImages / 1024).toFixed(1)}KB)`,
        solution: 'Convert to WebP, implement lazy loading, use responsive images',
        impact: 'High - Significant bandwidth savings'
      })
    }
    
    if (totalCSS > 150 * 1024) {
      recommendations.push({
        category: 'CSS Optimization',
        issue: `CSS could be further optimized (${(totalCSS / 1024).toFixed(1)}KB)`,
        solution: 'Implement critical CSS extraction',
        impact: 'Medium - Faster first paint'
      })
    }
    
    // Performance score estimation
    let score = 100
    if (totalJS > 200 * 1024) score -= 15
    if (totalImages > 2000 * 1024) score -= 20
    if (totalKB > 5000) score -= 10
    
    console.log(`\n🎯 Estimated Performance Score: ${Math.max(0, score)}/100`)
    
    if (score >= 85) {
      console.log('   ✅ Excellent performance!')
    } else if (score >= 70) {
      console.log('   ⚠️  Good performance, room for improvement')
    } else {
      console.log('   ❌ Performance needs attention')
    }
    
  } catch (error) {
    console.error('❌ Performance audit failed:', error.message)
  }
}

performanceAudit()