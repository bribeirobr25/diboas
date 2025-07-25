#!/usr/bin/env node

/**
 * Build with PurgeCSS integration via post-processing
 */

import { execSync } from 'child_process'
import { PurgeCSS } from 'purgecss'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

async function buildWithPurgeCSS() {
  try {
    console.log('🏗️  Building project...')
    
    // First build normally
    execSync('NODE_ENV=production pnpm run build', { 
      stdio: 'inherit',
      cwd: rootDir 
    })
    
    console.log('🔍 Processing CSS with PurgeCSS...')
    
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
    
    // Run PurgeCSS
    const purgeCSSResult = await new PurgeCSS().purge({
      content: [
        path.join(rootDir, 'index.html'),
        path.join(rootDir, 'src/**/*.{js,ts,jsx,tsx}'),
      ],
      css: [cssPath],
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
        // Classes that may be added dynamically
        'opacity-0', 'opacity-50', 'opacity-100',
        'scale-0', 'scale-100', 'scale-105',
        'rotate-0', 'rotate-45', 'rotate-90', 'rotate-180',
        'translate-x-0', 'translate-y-0', '-translate-x-1', '-translate-y-1',
        // Common utility classes
        'hidden', 'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid',
        'absolute', 'relative', 'fixed', 'sticky',
        'z-10', 'z-20', 'z-40', 'z-50',
        'w-full', 'h-full', 'w-auto', 'h-auto',
        'cursor-pointer', 'cursor-not-allowed',
        'pointer-events-none', 'pointer-events-auto',
        'select-none', 'select-all', 'select-text',
      ],
      variables: true,
    })
    
    if (purgeCSSResult && purgeCSSResult[0]) {
      const purgedCSS = purgeCSSResult[0].css
      const purgedSizeKB = (purgedCSS.length / 1024).toFixed(1)
      const reductionPercent = ((originalCSS.length - purgedCSS.length) / originalCSS.length * 100).toFixed(1)
      
      // Replace the original CSS file
      await fs.writeFile(cssPath, purgedCSS)
      
      console.log(`✂️  Purged CSS size: ${purgedSizeKB} KB`)
      console.log(`📉 Size reduction: ${reductionPercent}%`)
      
      if (purgedCSS.length < 100 * 1024) {
        console.log('✅ Target achieved: CSS bundle is under 100KB!')
      } else {
        console.log(`🎯 Still above 100KB target. Need ${((purgedCSS.length - 100 * 1024) / 1024).toFixed(1)}KB more reduction.`)
      }
    }
    
  } catch (error) {
    console.error('❌ Build with PurgeCSS failed:', error.message)
    throw error
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildWithPurgeCSS()
    .then(() => console.log('\n🎉 PurgeCSS build complete!'))
    .catch(error => {
      console.error('💥 Build failed:', error)
      process.exit(1)
    })
}