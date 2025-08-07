#!/usr/bin/env node

/**
 * Validate Test Imports Script
 * Checks that all test files have proper Vitest imports and consistent patterns
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, resolve } from 'path'

const ROOT_DIR = resolve('.')
const SRC_DIR = join(ROOT_DIR, 'src')

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

// Validation rules
const VALIDATION_RULES = {
  // Required imports for files using these functions (exclude Playwright)
  vitestGlobals: {
    pattern: /\b(describe|it|test|expect|beforeEach|beforeAll|afterEach|afterAll|vi\.)\b/,
    requiredImport: /import\s+.*from\s+['"]vitest['"]/,
    playwrightImport: /import\s+.*from\s+['"]@playwright\/test['"]/,
    message: 'Files using test globals must import from vitest'
  },
  
  // Standard import patterns
  standardImports: [
    'import { describe, it, expect, beforeEach, afterEach, vi } from \'vitest\'',
    'import { describe, it, expect, beforeEach, vi } from \'vitest\'', 
    'import { describe, it, expect, beforeEach } from \'vitest\'',
    'import { describe, it, expect, vi } from \'vitest\'',
    'import { describe, it, expect } from \'vitest\'',
    'import { vi } from \'vitest\''
  ],
  
  // Deprecated patterns to avoid
  deprecatedPatterns: [
    { pattern: /import.*from\s+['"]@?jest/, message: 'Should use vitest instead of jest' },
    { pattern: /import.*from\s+['"]@testing-library\/jest-dom/, message: 'Should use @testing-library/jest-dom differently or remove if not needed' }
  ]
}

/**
 * Recursively find all test files
 */
function findTestFiles(dir) {
  const testFiles = []
  
  function walkDir(currentDir) {
    const entries = readdirSync(currentDir)
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        walkDir(fullPath)
      } else if (stat.isFile() && /\.test\.(js|jsx|ts|tsx)$/.test(entry)) {
        testFiles.push(fullPath)
      }
    }
  }
  
  walkDir(dir)
  return testFiles
}

/**
 * Validate a single test file
 */
function validateTestFile(filePath) {
  const issues = []
  const content = readFileSync(filePath, 'utf8')
  const relativePath = filePath.replace(ROOT_DIR, '.')
  
  // Check for vitest globals without imports (skip Playwright files)
  if (VALIDATION_RULES.vitestGlobals.pattern.test(content)) {
    const isPlaywright = VALIDATION_RULES.vitestGlobals.playwrightImport.test(content)
    const hasVitestImport = VALIDATION_RULES.vitestGlobals.requiredImport.test(content)
    
    if (!isPlaywright && !hasVitestImport) {
      issues.push({
        type: 'error',
        message: VALIDATION_RULES.vitestGlobals.message
      })
    }
  }
  
  // Check for deprecated patterns
  for (const deprecatedRule of VALIDATION_RULES.deprecatedPatterns) {
    if (deprecatedRule.pattern.test(content)) {
      issues.push({
        type: 'warning', 
        message: deprecatedRule.message
      })
    }
  }
  
  // Check import consistency
  const vitestImports = content.match(/import\s+.*from\s+['"]vitest['"]/g)
  if (vitestImports && vitestImports.length > 1) {
    issues.push({
      type: 'warning',
      message: 'Multiple vitest imports found - consider consolidating'
    })
  }
  
  return { file: relativePath, issues }
}

/**
 * Generate summary report
 */
function generateReport(results) {
  const totalFiles = results.length
  const filesWithIssues = results.filter(r => r.issues.length > 0).length
  const totalErrors = results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'error').length, 0)
  const totalWarnings = results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'warning').length, 0)
  
  console.log(`\n${colors.blue}=== Test Import Validation Report ===${colors.reset}`)
  console.log(`Total test files: ${totalFiles}`)
  console.log(`Files with issues: ${filesWithIssues}`)
  console.log(`Total errors: ${colors.red}${totalErrors}${colors.reset}`)
  console.log(`Total warnings: ${colors.yellow}${totalWarnings}${colors.reset}`)
  
  if (filesWithIssues > 0) {
    console.log(`\n${colors.blue}Issues by file:${colors.reset}`)
    
    for (const result of results) {
      if (result.issues.length > 0) {
        console.log(`\n${result.file}:`)
        
        for (const issue of result.issues) {
          const color = issue.type === 'error' ? colors.red : colors.yellow
          console.log(`  ${color}${issue.type.toUpperCase()}:${colors.reset} ${issue.message}`)
        }
      }
    }
  }
  
  if (totalErrors === 0) {
    console.log(`\n${colors.green}✅ All test files have valid Vitest imports!${colors.reset}`)
  } else {
    console.log(`\n${colors.red}❌ Found ${totalErrors} errors that need to be fixed${colors.reset}`)
  }
  
  return totalErrors === 0
}

/**
 * Main execution
 */
function main() {
  console.log(`${colors.blue}Validating test imports in ${SRC_DIR}...${colors.reset}`)
  
  const testFiles = findTestFiles(SRC_DIR)
  console.log(`Found ${testFiles.length} test files`)
  
  const results = testFiles.map(validateTestFile)
  const success = generateReport(results)
  
  // Additional statistics
  const importPatterns = {}
  for (const file of testFiles) {
    const content = readFileSync(file, 'utf8')
    const vitestImport = content.match(/import\s+\{[^}]+\}\s+from\s+['"]vitest['"]/)?.[0]
    if (vitestImport) {
      importPatterns[vitestImport] = (importPatterns[vitestImport] || 0) + 1
    }
  }
  
  console.log(`\n${colors.blue}Most common import patterns:${colors.reset}`)
  Object.entries(importPatterns)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([pattern, count]) => {
      console.log(`${count} files: ${pattern}`)
    })
  
  process.exit(success ? 0 : 1)
}

// Run the script
main()