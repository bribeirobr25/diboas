#!/usr/bin/env node

/**
 * Image Optimization Script
 * Optimize images for better performance
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Optimization targets
const OPTIMIZATION_TARGETS = {
  // Logo and branding images
  logos: { maxWidth: 800, quality: 85, format: 'webp' },
  // Mascot illustrations
  mascots: { maxWidth: 600, quality: 80, format: 'webp' },
  // Icons and small images
  icons: { maxWidth: 200, quality: 90, format: 'webp' },
  // Favicons (keep PNG)
  favicons: { maxWidth: 512, quality: 95, format: 'png' }
}

/**
 * Analyze image directory
 */
function analyzeImages(directory) {
  const analysis = {
    totalFiles: 0,
    totalSize: 0,
    largeFiles: [],
    byExtension: {},
    recommendations: []
  }

  if (!fs.existsSync(directory)) {
    return analysis
  }

  function scanDirectory(dir, relativePath = '') {
    const files = fs.readdirSync(dir, { withFileTypes: true })
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name)
      const relativeFilePath = path.join(relativePath, file.name)
      
      if (file.isDirectory()) {
        scanDirectory(fullPath, relativeFilePath)
      } else {
        const ext = path.extname(file.name).toLowerCase()
        if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) {
          const stats = fs.statSync(fullPath)
          const sizeKB = Math.round(stats.size / 1024 * 100) / 100
          
          analysis.totalFiles++
          analysis.totalSize += sizeKB
          
          if (!analysis.byExtension[ext]) {
            analysis.byExtension[ext] = { count: 0, size: 0 }
          }
          analysis.byExtension[ext].count++
          analysis.byExtension[ext].size += sizeKB
          
          // Flag large files
          if (sizeKB > 500) {
            analysis.largeFiles.push({
              name: relativeFilePath,
              size: sizeKB,
              path: fullPath,
              ext
            })
          }
          
          // Generate recommendations
          if (sizeKB > 1000) {
            analysis.recommendations.push({
              file: relativeFilePath,
              issue: `Very large file (${sizeKB}KB)`,
              suggestion: 'Consider compression or format conversion to WebP',
              priority: 'high'
            })
          } else if (sizeKB > 500) {
            analysis.recommendations.push({
              file: relativeFilePath,
              issue: `Large file (${sizeKB}KB)`,
              suggestion: 'Consider optimization',
              priority: 'medium'
            })
          }
          
          if (ext === '.png' && sizeKB > 100) {
            analysis.recommendations.push({
              file: relativeFilePath,
              issue: 'PNG format for large image',
              suggestion: 'Consider WebP format for better compression',
              priority: 'medium'
            })
          }
        }
      }
    })
  }

  scanDirectory(directory)
  
  // Sort large files by size
  analysis.largeFiles.sort((a, b) => b.size - a.size)
  
  return analysis
}

/**
 * Generate optimization plan
 */
function generateOptimizationPlan(publicAnalysis, assetsAnalysis) {
  const plan = {
    totalSavings: 0,
    actions: [],
    summary: {
      currentSize: publicAnalysis.totalSize + assetsAnalysis.totalSize,
      targetSize: 0,
      compressionRatio: 0
    }
  }

  // Analyze each large file and suggest optimizations
  const allLargeFiles = [
    ...publicAnalysis.largeFiles.map(f => ({ ...f, location: 'public' })),
    ...assetsAnalysis.largeFiles.map(f => ({ ...f, location: 'src/assets' }))
  ]

  allLargeFiles.forEach(file => {
    let targetSize = file.size
    let action = 'keep-as-is'
    
    // Determine optimization based on file type and size
    if (file.name.includes('logo')) {
      targetSize = Math.min(file.size * 0.4, 150) // Aggressive logo compression
      action = 'optimize-logo'
    } else if (file.name.includes('mascot')) {
      targetSize = Math.min(file.size * 0.5, 200) // Mascot compression
      action = 'optimize-mascot'
    } else if (file.name.includes('favicon') || file.name.includes('icon')) {
      targetSize = Math.min(file.size * 0.6, 50) // Icon optimization
      action = 'optimize-icon'
    } else if (file.ext === '.png' && file.size > 500) {
      targetSize = file.size * 0.3 // PNG to WebP conversion
      action = 'convert-to-webp'
    } else if (file.size > 500) {
      targetSize = file.size * 0.6 // General compression
      action = 'compress'
    }

    if (targetSize < file.size) {
      const savings = file.size - targetSize
      plan.totalSavings += savings
      plan.actions.push({
        file: file.name,
        location: file.location,
        currentSize: file.size,
        targetSize: Math.round(targetSize),
        savings: Math.round(savings),
        action,
        priority: file.size > 1000 ? 'high' : 'medium'
      })
    }
  })

  plan.summary.targetSize = plan.summary.currentSize - plan.totalSavings
  plan.summary.compressionRatio = Math.round((plan.totalSavings / plan.summary.currentSize) * 100)

  return plan
}

/**
 * Print analysis report
 */
function printReport(publicAnalysis, assetsAnalysis, plan) {
  console.log('\n🖼️  diBoaS Image Optimization Analysis')
  console.log('=' .repeat(50))
  
  const totalSize = publicAnalysis.totalSize + assetsAnalysis.totalSize
  const totalFiles = publicAnalysis.totalFiles + assetsAnalysis.totalFiles
  
  console.log(`📊 Current State:`)
  console.log(`  Total Images: ${totalFiles} files`)
  console.log(`  Total Size: ${totalSize.toFixed(1)}KB (${(totalSize/1024).toFixed(1)}MB)`)
  console.log(`  Public Folder: ${publicAnalysis.totalFiles} files, ${publicAnalysis.totalSize.toFixed(1)}KB`)
  console.log(`  Assets Folder: ${assetsAnalysis.totalFiles} files, ${assetsAnalysis.totalSize.toFixed(1)}KB`)

  console.log(`\n🎯 Optimization Potential:`)
  console.log(`  Estimated Savings: ${plan.totalSavings.toFixed(1)}KB (${(plan.totalSavings/1024).toFixed(1)}MB)`)
  console.log(`  Compression Ratio: ${plan.summary.compressionRatio}%`)
  console.log(`  Target Size: ${plan.summary.targetSize.toFixed(1)}KB`)

  if (plan.actions.length > 0) {
    console.log(`\n🔧 Optimization Plan (${plan.actions.length} actions):`)
    
    const highPriority = plan.actions.filter(a => a.priority === 'high')
    const mediumPriority = plan.actions.filter(a => a.priority === 'medium')
    
    if (highPriority.length > 0) {
      console.log(`\n  🔴 High Priority (${highPriority.length} files):`)
      highPriority.forEach(action => {
        console.log(`    ${action.file}`)
        console.log(`      ${action.currentSize}KB → ${action.targetSize}KB (${action.savings}KB saved)`)
        console.log(`      Action: ${action.action}`)
      })
    }
    
    if (mediumPriority.length > 0) {
      console.log(`\n  🟡 Medium Priority (${mediumPriority.length} files):`)
      mediumPriority.slice(0, 5).forEach(action => {
        console.log(`    ${action.file}: ${action.currentSize}KB → ${action.targetSize}KB`)
      })
      if (mediumPriority.length > 5) {
        console.log(`    ... and ${mediumPriority.length - 5} more files`)
      }
    }
  }

  console.log(`\n💡 Quick Wins:`)
  console.log(`  1. Convert large PNGs to WebP format`)
  console.log(`  2. Compress mascot illustrations to 600px max width`)
  console.log(`  3. Optimize logo to 800px max width`)
  console.log(`  4. Use lazy loading for large images`)
  console.log(`  5. Implement responsive images with srcset`)

  console.log('\n' + '='.repeat(50))
}

/**
 * Create vite.config optimization
 */
function createViteImageOptimization() {
  const viteConfigPath = path.join(__dirname, '..', 'vite.config.image-optimize.js')
  
  const config = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Image optimization configuration for Vite
export default defineConfig({
  plugins: [
    react(),
    // Add image optimization plugin when available
    // Example: viteImageOptimize({
    //   gifsicle: { optimizationLevel: 7 },
    //   mozjpeg: { quality: 80 },
    //   pngquant: { quality: [0.65, 0.8] },
    //   svgo: { plugins: [{ name: 'removeViewBox', active: false }] },
    //   webp: { quality: 75 }
    // })
  ],
  build: {
    // Image asset handling
    assetsInlineLimit: 0, // Don't inline any assets
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
            return \`assets/images/[name]-[hash].[ext]\`
          }
          return \`assets/[name]-[hash].[ext]\`
        }
      }
    }
  }
})`

  fs.writeFileSync(viteConfigPath, config)
  console.log(`\n💾 Created Vite image optimization config: ${viteConfigPath}`)
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Analyzing image assets...')
  
  const publicPath = path.join(__dirname, '..', 'public')
  const assetsPath = path.join(__dirname, '..', 'src', 'assets')
  
  const publicAnalysis = analyzeImages(publicPath)
  const assetsAnalysis = analyzeImages(assetsPath)
  
  const plan = generateOptimizationPlan(publicAnalysis, assetsAnalysis)
  
  printReport(publicAnalysis, assetsAnalysis, plan)
  
  // Create optimization configs
  createViteImageOptimization()
  
  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'image-optimization-report.json')
  const fullReport = {
    timestamp: new Date().toISOString(),
    public: publicAnalysis,
    assets: assetsAnalysis,
    optimization: plan
  }
  fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2))
  console.log(`💾 Detailed report saved to: ${reportPath}`)
  
  // Performance impact
  const currentPerformanceImpact = plan.summary.currentSize > 5000 ? 'HIGH' : plan.summary.currentSize > 2000 ? 'MEDIUM' : 'LOW'
  const targetPerformanceImpact = plan.summary.targetSize > 5000 ? 'HIGH' : plan.summary.targetSize > 2000 ? 'MEDIUM' : 'LOW'
  
  console.log(`\n🚀 Performance Impact:`)
  console.log(`  Current: ${currentPerformanceImpact} (${(plan.summary.currentSize/1024).toFixed(1)}MB)`)
  console.log(`  After Optimization: ${targetPerformanceImpact} (${(plan.summary.targetSize/1024).toFixed(1)}MB)`)
  
  if (plan.summary.compressionRatio > 50) {
    console.log(`\n✅ Excellent optimization potential! ${plan.summary.compressionRatio}% size reduction possible.`)
  } else if (plan.summary.compressionRatio > 30) {
    console.log(`\n👍 Good optimization potential! ${plan.summary.compressionRatio}% size reduction possible.`)
  } else {
    console.log(`\n👌 Images are already reasonably optimized.`)
  }
}

main().catch(console.error)