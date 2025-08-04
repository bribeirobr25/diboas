/**
 * React Import Validator Tests
 * Tests for catching missing React hook imports and similar scenarios
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import reactImportValidator, { 
  analyzeReactImports, 
  batchAnalyzeReactImports, 
  validateReactImportsAtRuntime
} from '../reactImportValidator.js'

const { REACT_HOOKS, REACT_ROUTER_HOOKS } = reactImportValidator

const TEST_FILES_DIR = join(process.cwd(), 'src', 'utils', '__tests__', 'fixtures')

describe('React Import Validator', () => {
  beforeEach(() => {
    // Create test fixtures directory
    try {
      mkdirSync(TEST_FILES_DIR, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
  })

  afterEach(() => {
    // Clean up test files
    try {
      rmSync(TEST_FILES_DIR, { recursive: true, force: true })
    } catch (error) {
      // Directory might not exist
    }
  })

  describe('analyzeReactImports', () => {
    test('detects missing useEffect import', () => {
      const componentCode = `
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

function TestComponent() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    console.log('Component mounted')
  }, [])
  
  const handleClick = useCallback(() => {
    setCount(prev => prev + 1)
  }, [])
  
  return <div onClick={handleClick}>{count}</div>
}
`
      const testFile = join(TEST_FILES_DIR, 'TestComponent.jsx')
      writeFileSync(testFile, componentCode)

      const result = analyzeReactImports(testFile)

      expect(result.analysis.hasIssues).toBe(true)
      expect(result.analysis.reactImports.missing).toContain('useEffect')
      expect(result.analysis.reactImports.used).toContain('useState')
      expect(result.analysis.reactImports.used).toContain('useEffect')
      expect(result.analysis.reactImports.used).toContain('useCallback')
      expect(result.analysis.recommendations).toHaveLength(1)
      expect(result.analysis.recommendations[0].type).toBe('fix-react-imports')
    })

    test('detects missing React Router hooks', () => {
      const componentCode = `
import { useState } from 'react'

function TestComponent() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  return <div>Test</div>
}
`
      const testFile = join(TEST_FILES_DIR, 'RouterComponent.jsx')
      writeFileSync(testFile, componentCode)

      const result = analyzeReactImports(testFile)

      expect(result.analysis.hasIssues).toBe(true)
      expect(result.analysis.routerImports.missing).toContain('useNavigate')
      expect(result.analysis.routerImports.missing).toContain('useSearchParams')
      expect(result.analysis.recommendations).toHaveLength(1)
      expect(result.analysis.recommendations[0].type).toBe('add-router-imports')
    })

    test('handles component with correct imports', () => {
      const componentCode = `
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

function TestComponent() {
  const [count, setCount] = useState(0)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  useEffect(() => {
    console.log('Component mounted')
  }, [])
  
  const handleClick = useCallback(() => {
    setCount(prev => prev + 1)
  }, [])
  
  return <div onClick={handleClick}>{count}</div>
}
`
      const testFile = join(TEST_FILES_DIR, 'CorrectComponent.jsx')
      writeFileSync(testFile, componentCode)

      const result = analyzeReactImports(testFile)

      expect(result.analysis.hasIssues).toBe(false)
      expect(result.analysis.reactImports.missing).toHaveLength(0)
      expect(result.analysis.routerImports.missing).toHaveLength(0)
      expect(result.analysis.recommendations).toHaveLength(0)
    })

    test('handles component with no React imports but uses hooks', () => {
      const componentCode = `
function TestComponent() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    console.log('Component mounted')
  }, [])
  
  return <div>{count}</div>
}
`
      const testFile = join(TEST_FILES_DIR, 'NoImportsComponent.jsx')
      writeFileSync(testFile, componentCode)

      const result = analyzeReactImports(testFile)

      expect(result.analysis.hasIssues).toBe(true)
      expect(result.analysis.reactImports.missing).toContain('useState')
      expect(result.analysis.reactImports.missing).toContain('useEffect')
      expect(result.analysis.recommendations[0].type).toBe('add-react-imports')
    })

    test('detects complex hook usage patterns', () => {
      const componentCode = `
import { useState } from 'react'

function TestComponent() {
  const [state, setState] = useState({})
  
  // Nested usage
  const memoizedValue = useMemo(() => {
    return state.value * 2
  }, [state.value])
  
  // Conditional usage
  if (condition) {
    useLayoutEffect(() => {
      // Side effect
    }, [])
  }
  
  // Inside callback
  const handleSubmit = () => {
    const ref = useRef()
    // More logic
  }
  
  return <div>{memoizedValue}</div>
}
`
      const testFile = join(TEST_FILES_DIR, 'ComplexComponent.jsx')
      writeFileSync(testFile, componentCode)

      const result = analyzeReactImports(testFile)

      expect(result.analysis.hasIssues).toBe(true)
      expect(result.analysis.reactImports.missing).toContain('useMemo')
      expect(result.analysis.reactImports.missing).toContain('useLayoutEffect')
      expect(result.analysis.reactImports.missing).toContain('useRef')
    })

    test('throws error for non-existent file', () => {
      expect(() => {
        analyzeReactImports('/non/existent/file.jsx')
      }).toThrow('File not found')
    })
  })

  describe('batchAnalyzeReactImports', () => {
    test('analyzes multiple files', () => {
      const file1Code = `
import { useState } from 'react'
function Component1() {
  const [state] = useState()
  useEffect(() => {}, [])
  return <div />
}
`
      const file2Code = `
import { useState, useEffect } from 'react'
function Component2() {
  const [state] = useState()
  useEffect(() => {}, [])
  return <div />
}
`
      
      const file1 = join(TEST_FILES_DIR, 'Component1.jsx')
      const file2 = join(TEST_FILES_DIR, 'Component2.jsx')
      
      writeFileSync(file1, file1Code)
      writeFileSync(file2, file2Code)

      const results = batchAnalyzeReactImports([file1, file2])

      expect(results).toHaveLength(2)
      expect(results[0].analysis.hasIssues).toBe(true)
      expect(results[1].analysis.hasIssues).toBe(false)
    })

    test('handles errors in batch analysis', () => {
      const results = batchAnalyzeReactImports([
        '/non/existent/file1.jsx',
        '/non/existent/file2.jsx'
      ])

      expect(results).toHaveLength(2)
      expect(results[0].error).toBeDefined()
      expect(results[1].error).toBeDefined()
      expect(results[0].analysis).toBeNull()
      expect(results[1].analysis).toBeNull()
    })
  })

  describe('validateReactImportsAtRuntime', () => {
    test('intercepts console.error for React hook errors in development', () => {
      const originalNodeEnv = process.env.NODE_ENV
      const originalConsoleError = console.error
      const mockConsoleError = vi.fn()
      const mockConsoleWarn = vi.fn()
      
      process.env.NODE_ENV = 'development'
      console.error = mockConsoleError
      console.warn = mockConsoleWarn

      validateReactImportsAtRuntime()

      // Simulate a React hook error
      console.error('ReferenceError: useEffect is not defined at Component')

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('React Import Validator: Detected missing React hook import!')
      )
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Missing hook: useEffect')
      )

      // Restore
      process.env.NODE_ENV = originalNodeEnv
      console.error = originalConsoleError
    })

    test('does not intercept in production', () => {
      const originalNodeEnv = process.env.NODE_ENV
      const originalConsoleError = console.error
      const mockConsoleError = vi.fn()
      
      process.env.NODE_ENV = 'production'
      console.error = mockConsoleError

      validateReactImportsAtRuntime()

      // Should not set up interception in production
      expect(console.error).toBe(mockConsoleError)

      // Restore
      process.env.NODE_ENV = originalNodeEnv
      console.error = originalConsoleError
    })
  })

  describe('Error Boundary Integration', () => {
    test('simulates missing import error scenario', () => {
      // This test simulates the exact scenario that happened with ObjectiveConfig
      const problematicCode = `
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

function ObjectiveConfig() {
  const [config, setConfig] = useState({})
  
  // This will cause "useEffect is not defined" error
  useEffect(() => {
    console.log('Effect running')
  }, [])
  
  return <div>Config</div>
}
`
      const testFile = join(TEST_FILES_DIR, 'ObjectiveConfig.jsx')
      writeFileSync(testFile, problematicCode)

      const result = analyzeReactImports(testFile)

      expect(result.analysis.hasIssues).toBe(true)
      expect(result.analysis.reactImports.missing).toContain('useEffect')
      expect(result.analysis.recommendations[0].suggestedLine).toBe(
        "import { useCallback, useEffect, useState } from 'react'"
      )
    })
  })

  describe('Hook Detection Coverage', () => {
    test('detects all React hooks', () => {
      const allHooksCode = REACT_HOOKS.map(hook => `${hook}()`).join('\n  ')
      const componentCode = `
function TestComponent() {
  ${allHooksCode}
  return <div />
}
`
      const testFile = join(TEST_FILES_DIR, 'AllHooksComponent.jsx')
      writeFileSync(testFile, componentCode)

      const result = analyzeReactImports(testFile)

      expect(result.analysis.reactImports.missing).toEqual(
        expect.arrayContaining(REACT_HOOKS)
      )
    })

    test('detects all React Router hooks', () => {
      const allRouterHooksCode = REACT_ROUTER_HOOKS.map(hook => `${hook}()`).join('\n  ')
      const componentCode = `
function TestComponent() {
  ${allRouterHooksCode}
  return <div />
}
`
      const testFile = join(TEST_FILES_DIR, 'AllRouterHooksComponent.jsx')
      writeFileSync(testFile, componentCode)

      const result = analyzeReactImports(testFile)

      expect(result.analysis.routerImports.missing).toEqual(
        expect.arrayContaining(REACT_ROUTER_HOOKS)
      )
    })
  })
})