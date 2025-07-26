#!/usr/bin/env node

/**
 * Analyze CSS usage with PurgeCSS to identify unused styles
 */

import { PurgeCSS } from 'purgecss'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

async function analyzeCSSUsage() {
  try {
    console.log('🔍 Analyzing CSS usage with PurgeCSS...')
    
    // First build the project to get the CSS
    const { execSync } = await import('child_process')
    execSync('NODE_ENV=production pnpm run build', { 
      stdio: 'inherit',
      cwd: rootDir 
    })
    
    // Find the CSS file
    const distFiles = await fs.readdir(path.join(rootDir, 'dist/assets'))
    const cssFile = distFiles.find(file => file.endsWith('.css'))
    
    if (!cssFile) {
      throw new Error('No CSS file found in dist/assets')
    }
    
    const cssPath = path.join(rootDir, 'dist/assets', cssFile)
    const originalCSS = await fs.readFile(cssPath, 'utf-8')
    const originalSizeKB = (originalCSS.length / 1024).toFixed(1)
    
    console.log(`📊 Original CSS size: ${originalSizeKB} KB`)
    
    // Run PurgeCSS analysis
    const purgeCSSResult = await new PurgeCSS().purge({
      content: [
        path.join(rootDir, 'index.html'),
        path.join(rootDir, 'src/**/*.{js,ts,jsx,tsx}'),
      ],
      css: [cssPath],
      // Very conservative - keep everything that might be dynamic
      safelist: [
        // Design system classes
        /^(page|transaction|account|payment|performance|error|dashboard|semantic|balance|portfolio|form|button|nav|modal|status|alert|loading|empty)-/,
        // Dynamic color classes
        /^(bg|text|border)-(blue|purple|green|red|orange|yellow|indigo|emerald|cyan|gray)-(50|100|200|300|400|500|600|700|800|900)$/,
        // Responsive variants
        /^(sm|md|lg|xl):/,
        // Animation and utility classes
        'animate-spin', 'animate-pulse', 'animate-bounce',
        'sr-only', 'not-sr-only', 'group', 'peer',
        // Radix UI and component library classes
        /^radix-/, /^data-/, /^aria-/,
      ],
      // Aggressive removal for analysis
      rejected: true,
      variables: true,
    })
    
    if (purgeCSSResult && purgeCSSResult[0]) {
      const purgedCSS = purgeCSSResult[0].css
      const purgedSizeKB = (purgedCSS.length / 1024).toFixed(1)
      const reductionPercent = ((originalCSS.length - purgedCSS.length) / originalCSS.length * 100).toFixed(1)
      
      console.log(`✂️  Purged CSS size: ${purgedSizeKB} KB`)
      console.log(`📉 Size reduction: ${reductionPercent}%`)
      
      if (purgedCSS.length < 100 * 1024) {
        console.log('✅ PurgeCSS can achieve <100KB target!')
        
        // Save the purged CSS for analysis
        const purgedPath = path.join(rootDir, 'dist/assets', `purged-${cssFile}`)
        await fs.writeFile(purgedPath, purgedCSS)
        console.log(`💾 Saved purged CSS to: ${purgedPath}`)
        
        return purgedCSS
      } else {
        console.log(`🎯 Still above 100KB target. Need ${((purgedCSS.length - 100 * 1024) / 1024).toFixed(1)}KB more reduction.`)
      }
      
      // Show what was removed for analysis
      if (purgeCSSResult[0].rejected) {
        console.log(`🗑️  Rejected ${purgeCSSResult[0].rejected.length} unused selectors`)
        
        // Save rejected selectors for analysis
        const rejectedPath = path.join(rootDir, 'dist/assets', 'rejected-selectors.txt')
        await fs.writeFile(rejectedPath, purgeCSSResult[0].rejected.join('\n'))
        console.log(`📝 Saved rejected selectors to: ${rejectedPath}`)
      }
    }
    
  } catch (error) {
    console.error('❌ CSS analysis failed:', error.message)
    throw error
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeCSSUsage()
    .then(() => console.log('\n🎉 CSS analysis complete!'))
    .catch(error => {
      console.error('💥 Analysis failed:', error)
      process.exit(1)
    })
}