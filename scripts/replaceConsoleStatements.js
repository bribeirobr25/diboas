#!/usr/bin/env node
/**
 * Script to replace console statements with proper logger calls
 * Usage: node scripts/replaceConsoleStatements.js
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SRC_DIR = path.join(__dirname, '..', 'src')

// Files to exclude from replacement
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.test\.(js|jsx|ts|tsx)$/,
  /\.spec\.(js|jsx|ts|tsx)$/,
  /__tests__/,
  /test\//,
  /logger\.js$/,
  /secureLogger\.js$/
]

// Replacement patterns
const REPLACEMENTS = [
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    import: true
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    import: true
  },
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.debug(',
    import: true
  },
  {
    pattern: /console\.info\(/g,
    replacement: 'logger.info(',
    import: true
  }
]

async function shouldProcessFile(filePath) {
  // Check if file should be excluded
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(filePath)) {
      return false
    }
  }
  
  // Only process JS/JSX files
  return /\.(js|jsx)$/.test(filePath)
}

async function processFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8')
    let modified = false
    let needsImport = false
    
    // Check if file contains console statements
    for (const { pattern, replacement, import: needImport } of REPLACEMENTS) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement)
        modified = true
        if (needImport) {
          needsImport = true
        }
      }
    }
    
    if (!modified) {
      return false
    }
    
    // Add logger import if needed
    if (needsImport && !content.includes('from \'../utils/logger\'') && !content.includes('from \'../../utils/logger\'')) {
      // Determine relative path to logger
      const relativePath = path.relative(path.dirname(filePath), path.join(SRC_DIR, 'utils', 'logger.js'))
      const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath
      const importStatement = `import logger from '${importPath.replace(/\\/g, '/').replace('.js', '')}'`
      
      // Add import after other imports
      const importMatch = content.match(/^(import .* from .*\n)+/m)
      if (importMatch) {
        const lastImportIndex = importMatch.index + importMatch[0].length
        content = content.slice(0, lastImportIndex) + importStatement + '\n' + content.slice(lastImportIndex)
      } else {
        // Add at the beginning if no imports found
        content = importStatement + '\n\n' + content
      }
    }
    
    // Write back the modified content
    await fs.writeFile(filePath, content, 'utf-8')
    console.log(`✅ Processed: ${path.relative(process.cwd(), filePath)}`)
    
    return true
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
    return false
  }
}

async function processDirectory(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  let processedCount = 0
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    
    if (entry.isDirectory() && !EXCLUDE_PATTERNS.some(p => p.test(fullPath))) {
      processedCount += await processDirectory(fullPath)
    } else if (entry.isFile() && await shouldProcessFile(fullPath)) {
      if (await processFile(fullPath)) {
        processedCount++
      }
    }
  }
  
  return processedCount
}

async function main() {
  console.log('🔍 Searching for console statements to replace...\n')
  
  const startTime = Date.now()
  const processedCount = await processDirectory(SRC_DIR)
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  
  console.log(`\n✨ Done! Processed ${processedCount} files in ${duration}s`)
  
  if (processedCount > 0) {
    console.log('\n⚠️  Remember to:')
    console.log('1. Review the changes')
    console.log('2. Fix any import path issues')
    console.log('3. Run tests to ensure everything works')
    console.log('4. Run ESLint to check for any issues')
  }
}

// Run the script
main().catch(console.error)