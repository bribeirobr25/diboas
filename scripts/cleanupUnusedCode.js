#!/usr/bin/env node
/**
 * Script to remove unused imports and variables
 * Usage: node scripts/cleanupUnusedCode.js
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Common unused imports to remove
const UNUSED_IMPORTS = {
  'Navigate': { from: 'react-router-dom' },
  'isOnSubdomain': { from: './config/subdomains.js' },
  'Search': { from: 'lucide-react' },
  'Shield': { from: 'lucide-react' },
  'Lock': { from: 'lucide-react' },
  'ChevronDown': { from: 'lucide-react' },
  'Input': { from: '@/components/ui/input.jsx' },
  'CardDescription': { from: '@/components/ui/card.jsx' },
  'CardHeader': { from: '@/components/ui/card.jsx' },
  'CardTitle': { from: '@/components/ui/card.jsx' },
  'useCallback': { from: 'react', onlyIfUnused: true },
  'fireEvent': { from: '@testing-library/react' },
  'waitFor': { from: '@testing-library/react' },
  'afterEach': { from: 'vitest' },
  'beforeEach': { from: 'vitest' },
  'vi': { from: 'vitest', onlyIfUnused: true }
}

// Files to process
const FILES_TO_CLEAN = [
  'src/App.jsx',
  'src/components/AccountView.jsx',
  'src/components/AppDashboard.jsx',
  'src/components/AssetDetailPage.jsx',
  'src/components/LandingPage.jsx',
  'src/components/PerformanceMonitor.jsx',
  'src/components/TransactionDetailsPage.jsx'
]

async function removeUnusedImport(content, importName, fromModule) {
  // Check if the import is actually used in the code (excluding the import line)
  const importRegex = new RegExp(`import.*{[^}]*\\b${importName}\\b[^}]*}.*from.*['"]${fromModule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g')
  const usageRegex = new RegExp(`\\b${importName}\\b`, 'g')
  
  // Remove the import line to check usage
  const contentWithoutImport = content.replace(importRegex, '')
  const isUsed = usageRegex.test(contentWithoutImport)
  
  if (!isUsed) {
    // Remove the specific import
    content = content.replace(
      new RegExp(`(import.*{)([^}]*\\b${importName}\\b[^}]*)(}.*from.*['"]${fromModule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"])`, 'g'),
      (match, prefix, imports, suffix) => {
        // Remove the import and clean up commas
        const newImports = imports
          .split(',')
          .map(i => i.trim())
          .filter(i => !i.includes(importName))
          .join(', ')
        
        // If no imports left, remove the entire line
        if (!newImports.trim()) {
          return ''
        }
        
        return `${prefix}${newImports}${suffix}`
      }
    )
  }
  
  return content
}

async function removeUnusedVariables(content) {
  // Common patterns for unused variables
  const patterns = [
    // Remove unused destructured variables
    { pattern: /const\s*{\s*([^}]+),?\s*settings\s*}\s*=/, replacement: 'const { $1 } =' },
    { pattern: /const\s*\[\s*([^,]+),\s*activeFilters\s*\]\s*=/, replacement: 'const [$1] =' },
    
    // Comment out or remove completely unused assignments
    { pattern: /const\s+settings\s*=\s*[^;]+;/, replacement: '// const settings = ...;' },
    { pattern: /const\s+initialAvailable\s*=\s*[^;]+;/, replacement: '' },
    { pattern: /const\s+strategyAmount\s*=\s*[^;]+;/, replacement: '' },
    { pattern: /const\s+mockProps\s*=\s*[^;]+;/, replacement: '' },
    { pattern: /const\s+originalAvailable\s*=\s*[^;]+;/, replacement: '' },
    { pattern: /const\s+originalInvested\s*=\s*[^;]+;/, replacement: '' },
    { pattern: /const\s+initialBalance\s*=\s*[^;]+;/, replacement: '' },
    { pattern: /const\s+addTransaction\s*=\s*[^;]+;/, replacement: '' },
    { pattern: /const\s+user\s*=\s*[^;]+;/, replacement: '' }
  ]
  
  for (const { pattern, replacement } of patterns) {
    content = content.replace(pattern, replacement)
  }
  
  // Clean up double newlines
  content = content.replace(/\n\n\n+/g, '\n\n')
  
  return content
}

async function processFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8')
    let modified = false
    
    // Remove unused imports
    for (const [importName, config] of Object.entries(UNUSED_IMPORTS)) {
      const newContent = await removeUnusedImport(content, importName, config.from)
      if (newContent !== content) {
        content = newContent
        modified = true
        console.log(`  ✓ Removed unused import: ${importName}`)
      }
    }
    
    // Remove unused variables
    const newContent = await removeUnusedVariables(content)
    if (newContent !== content) {
      content = newContent
      modified = true
      console.log(`  ✓ Cleaned up unused variables`)
    }
    
    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8')
      console.log(`✅ Cleaned: ${path.basename(filePath)}`)
    } else {
      console.log(`✨ Already clean: ${path.basename(filePath)}`)
    }
    
    return modified
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🧹 Cleaning up unused imports and variables...\n')
  
  let cleanedCount = 0
  
  for (const file of FILES_TO_CLEAN) {
    const filePath = path.join(__dirname, '..', file)
    if (await processFile(filePath)) {
      cleanedCount++
    }
  }
  
  console.log(`\n✨ Done! Cleaned ${cleanedCount} files`)
  
  if (cleanedCount > 0) {
    console.log('\n⚠️  Remember to:')
    console.log('1. Review the changes')
    console.log('2. Run tests to ensure nothing broke')
    console.log('3. Run ESLint again to check for remaining issues')
  }
}

// Run the script
main().catch(console.error)