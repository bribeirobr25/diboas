/**
 * Test Suite Runner
 * Orchestrates running different types of tests with proper setup
 */

import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

/**
 * Test suite configurations
 */
const testSuites = {
  unit: {
    name: 'Unit Tests',
    command: 'vitest run src/**/*.test.{js,jsx} --config vite.config.test.js',
    description: 'Run unit tests for individual components and services'
  },
  
  integration: {
    name: 'Integration Tests',
    command: 'vitest run src/test/integration/**/*.test.js --config vite.config.test.js',
    description: 'Run integration tests for service interactions'
  },
  
  component: {
    name: 'Component Tests',
    command: 'vitest run src/components/**/*.test.jsx --config vite.config.test.js',
    description: 'Run React component tests'
  },
  
  e2e: {
    name: 'End-to-End Tests',
    command: 'playwright test',
    description: 'Run full user journey tests'
  },
  
  coverage: {
    name: 'Coverage Report',
    command: 'vitest run --coverage --config vite.config.test.js',
    description: 'Generate test coverage report'
  },
  
  onchain: {
    name: 'On-Chain System Tests',
    command: 'vitest run src/services/onchain/**/*.test.js src/services/transactions/**/OnChainTransactionManager.test.js src/hooks/**/*OnChainStatus*.test.js --config vite.config.test.js',
    description: 'Run tests specifically for on-chain transaction system'
  }
}

/**
 * Run a specific test suite
 */
const runTestSuite = (suiteName, options = {}) => {
  const suite = testSuites[suiteName]
  if (!suite) {
    console.error(`❌ Unknown test suite: ${suiteName}`)
    console.log('Available suites:', Object.keys(testSuites).join(', '))
    process.exit(1)
  }

  console.log(`🧪 Running ${suite.name}...`)
  console.log(`📝 ${suite.description}`)
  console.log(`⚡ Command: ${suite.command}`)
  console.log('─'.repeat(60))

  try {
    const startTime = Date.now()
    
    execSync(suite.command, {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        ...(options.env || {})
      }
    })
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ ${suite.name} completed in ${duration}s`)
    
  } catch (error) {
    console.error(`❌ ${suite.name} failed`)
    process.exit(1)
  }
}

/**
 * Run all test suites in sequence
 */
const runAllTests = (options = {}) => {
  console.log('🚀 Running comprehensive test suite...')
  console.log('═'.repeat(60))
  
  const suitesToRun = options.skipE2E 
    ? ['unit', 'component', 'integration', 'onchain']
    : ['unit', 'component', 'integration', 'onchain', 'e2e']
  
  let passedSuites = 0
  let failedSuites = 0
  const startTime = Date.now()
  
  for (const suiteName of suitesToRun) {
    try {
      runTestSuite(suiteName, options)
      passedSuites++
    } catch (error) {
      failedSuites++
      if (options.failFast) {
        break
      }
    }
    console.log() // Add spacing between suites
  }
  
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log('═'.repeat(60))
  console.log(`📊 Test Summary:`)
  console.log(`   ✅ Passed: ${passedSuites} suites`)
  console.log(`   ❌ Failed: ${failedSuites} suites`)
  console.log(`   ⏱️  Total time: ${totalDuration}s`)
  
  if (failedSuites > 0) {
    console.log(`\n❌ ${failedSuites} test suite(s) failed`)
    process.exit(1)
  } else {
    console.log(`\n🎉 All test suites passed!`)
  }
}

/**
 * Generate test report
 */
const generateReport = () => {
  console.log('📋 Generating comprehensive test report...')
  
  try {
    // Run coverage
    runTestSuite('coverage')
    
    // Generate HTML report location info
    console.log('📄 Test reports generated:')
    console.log(`   📊 Coverage: ${projectRoot}/coverage/index.html`)
    console.log(`   🎭 E2E Report: ${projectRoot}/playwright-report/index.html`)
    
  } catch (error) {
    console.error('❌ Failed to generate test report')
    process.exit(1)
  }
}

/**
 * Watch mode for development
 */
const runWatchMode = (suiteName = 'unit') => {
  const suite = testSuites[suiteName]
  if (!suite) {
    console.error(`❌ Unknown test suite: ${suiteName}`)
    process.exit(1)
  }

  console.log(`👀 Running ${suite.name} in watch mode...`)
  console.log('Press Ctrl+C to stop')
  
  const watchCommand = suite.command.replace('vitest run', 'vitest')
  
  try {
    execSync(watchCommand, {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    })
  } catch (error) {
    console.error(`❌ Watch mode failed`)
    process.exit(1)
  }
}

/**
 * CLI interface
 */
const main = () => {
  const args = process.argv.slice(2)
  const command = args[0]
  
  switch (command) {
    case 'run':
      const suiteName = args[1]
      if (!suiteName) {
        console.log('Available test suites:')
        Object.entries(testSuites).forEach(([name, suite]) => {
          console.log(`  ${name}: ${suite.description}`)
        })
        process.exit(1)
      }
      runTestSuite(suiteName)
      break
      
    case 'all':
      const skipE2E = args.includes('--skip-e2e')
      const failFast = args.includes('--fail-fast')
      runAllTests({ skipE2E, failFast })
      break
      
    case 'watch':
      const watchSuite = args[1] || 'unit'
      runWatchMode(watchSuite)
      break
      
    case 'report':
      generateReport()
      break
      
    case 'onchain':
      runTestSuite('onchain')
      break
      
    default:
      console.log('🧪 diBoaS Test Runner')
      console.log('')
      console.log('Usage:')
      console.log('  node src/test/testRunner.js run <suite>     Run specific test suite')
      console.log('  node src/test/testRunner.js all             Run all test suites')
      console.log('  node src/test/testRunner.js all --skip-e2e  Run all except E2E tests')
      console.log('  node src/test/testRunner.js watch [suite]   Run tests in watch mode')
      console.log('  node src/test/testRunner.js report          Generate test reports')
      console.log('  node src/test/testRunner.js onchain         Run on-chain system tests')
      console.log('')
      console.log('Available test suites:')
      Object.entries(testSuites).forEach(([name, suite]) => {
        console.log(`  ${name.padEnd(12)} ${suite.description}`)
      })
      break
  }
}

// Run CLI if this file is executed directly
if (process.argv[1] === __filename) {
  main()
}

export { runTestSuite, runAllTests, generateReport, runWatchMode, testSuites }