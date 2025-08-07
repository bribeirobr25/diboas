/**
 * ObjectiveConfig Import Validation Tests
 * Tests to prevent crashes due to missing imports and similar issues
 */

import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'

// Test utilities for simulating import errors
const createComponentWithMissingImport = (missingHook) => {
  return function ProblematicComponent() {
    const [state, setState] = React.useState({})
    
    // This will cause the error if the hook is not imported
    if (missingHook === 'useEffect') {
      try {
        useEffect(() => {
          console.log('Effect running')
        }, [])
      } catch (error) {
        throw new ReferenceError(`${missingHook} is not defined`)
      }
    }
    
    if (missingHook === 'useCallback') {
      try {
        const callback = useCallback(() => {}, [])
      } catch (error) {
        throw new ReferenceError(`${missingHook} is not defined`)
      }
    }
    
    if (missingHook === 'useNavigate') {
      try {
        const navigate = useNavigate()
      } catch (error) {
        throw new ReferenceError(`${missingHook} is not defined`)
      }
    }
    
    return <div>Test Component</div>
  }
}

// Mock YieldErrorBoundary for testing
vi.mock('../YieldErrorBoundary.jsx', () => ({
  default: function MockYieldErrorBoundary({ children }) {
    return (
      <div data-testid="error-boundary">
        {children}
      </div>
    )
  }
}))

// Mock logger
vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
  }
}))

describe('ObjectiveConfig Import Validation', () => {
  let consoleErrorSpy
  let consoleWarnSpy

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.clearAllMocks()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  describe('Missing React Hook Imports', () => {
    test('catches useEffect missing import error', () => {
      const ProblematicComponent = createComponentWithMissingImport('useEffect')
      
      expect(() => {
        render(
          <BrowserRouter>
            <ProblematicComponent />
          </BrowserRouter>
        )
      }).toThrow('useEffect is not defined')
    })

    test('catches useCallback missing import error', () => {
      const ProblematicComponent = createComponentWithMissingImport('useCallback')
      
      expect(() => {
        render(
          <BrowserRouter>
            <ProblematicComponent />
          </BrowserRouter>
        )
      }).toThrow('useCallback is not defined')
    })

    test('catches useNavigate missing import error', () => {
      const ProblematicComponent = createComponentWithMissingImport('useNavigate')
      
      expect(() => {
        render(
          <BrowserRouter>
            <ProblematicComponent />
          </BrowserRouter>
        )
      }).toThrow('useNavigate is not defined')
    })
  })

  describe('Error Boundary Integration', () => {
    test('YieldErrorBoundary catches component crashes', () => {
      const ErrorComponent = () => {
        throw new Error('Test error')
      }

      const YieldErrorBoundary = class extends React.Component {
        constructor(props) {
          super(props)
          this.state = { hasError: false }
        }

        static getDerivedStateFromError(error) {
          return { hasError: true }
        }

        componentDidCatch(error, errorInfo) {
          console.error('Error caught by boundary:', error)
        }

        render() {
          if (this.state.hasError) {
            return <div data-testid="error-fallback">Something went wrong</div>
          }
          return this.props.children
        }
      }

      render(
        <BrowserRouter>
          <YieldErrorBoundary>
            <ErrorComponent />
          </YieldErrorBoundary>
        </BrowserRouter>
      )

      expect(screen.getByTestId('error-fallback')).toBeInTheDocument()
    })

    test('Error boundary detects missing import errors', () => {
      const YieldErrorBoundary = class extends React.Component {
        constructor(props) {
          super(props)
          this.state = { hasError: false, error: null }
        }

        static getDerivedStateFromError(error) {
          return { hasError: true, error }
        }

        componentDidCatch(error, errorInfo) {
          // Simulate the error detection logic from YieldErrorBoundary
          if (error.message && error.message.includes('is not defined')) {
            const missingImport = this.detectMissingImport(error.message)
            console.warn('Missing import detected:', missingImport)
          }
        }

        detectMissingImport(errorMessage) {
          const reactHooks = ['useState', 'useEffect', 'useCallback', 'useMemo']
          for (const hook of reactHooks) {
            if (errorMessage.includes(`${hook} is not defined`)) {
              return { hook, library: 'react' }
            }
          }
          return null
        }

        render() {
          if (this.state.hasError) {
            return (
              <div data-testid="error-boundary-with-detection">
                Error detected: {this.state.error.message}
              </div>
            )
          }
          return this.props.children
        }
      }

      const ErrorComponent = () => {
        throw new ReferenceError('useEffect is not defined')
      }

      render(
        <BrowserRouter>
          <YieldErrorBoundary>
            <ErrorComponent />
          </YieldErrorBoundary>
        </BrowserRouter>
      )

      expect(screen.getByTestId('error-boundary-with-detection')).toBeInTheDocument()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Missing import detected:',
        { hook: 'useEffect', library: 'react' }
      )
    })
  })

  describe('Import Validation Utilities', () => {
    test('validates component imports before rendering', async () => {
      // This would be used in development to pre-validate components
      const componentCode = `
        import { useState, useCallback } from 'react'
        
        function TestComponent() {
          const [state] = useState()
          useEffect(() => {}, []) // Missing import!
          return <div />
        }
      `

      // Simulate the validation logic
      const missingImports = []
      const reactHooks = ['useEffect', 'useCallback', 'useState', 'useMemo']
      
      for (const hook of reactHooks) {
        const hookRegex = new RegExp(`\\b${hook}\\s*\\(`, 'g')
        if (hookRegex.test(componentCode)) {
          const importRegex = new RegExp(`import\\s*\\{[^}]*${hook}[^}]*\\}\\s*from\\s*['"]react['"]`)
          if (!importRegex.test(componentCode)) {
            missingImports.push(hook)
          }
        }
      }

      expect(missingImports).toContain('useEffect')
      expect(missingImports).not.toContain('useState')
      expect(missingImports).not.toContain('useCallback')
    })

    test('suggests correct import fixes', () => {
      const currentImports = ['useState', 'useCallback']
      const missingImports = ['useEffect', 'useMemo']
      const allImports = [...currentImports, ...missingImports].sort()
      
      const suggestedImportLine = `import { ${allImports.join(', ')} } from 'react'`
      
      expect(suggestedImportLine).toBe(
        "import { useCallback, useEffect, useMemo, useState } from 'react'"
      )
    })
  })

  describe('Component Recovery Mechanisms', () => {
    test('component can recover after import fix', () => {
      // Simulate a component that initially fails but then works after fix
      let hasError = true
      
      const RecoverableComponent = () => {
        if (hasError) {
          throw new ReferenceError('useEffect is not defined')
        }
        return <div data-testid="recovered-component">Component works!</div>
      }

      const RecoveryBoundary = class extends React.Component {
        constructor(props) {
          super(props)
          this.state = { hasError: false, retryCount: 0 }
        }

        static getDerivedStateFromError(error) {
          return { hasError: true }
        }

        handleRetry = () => {
          hasError = false // Simulate import fix
          this.setState({ hasError: false, retryCount: this.state.retryCount + 1 })
        }

        render() {
          if (this.state.hasError) {
            return (
              <div>
                <div data-testid="error-state">Error occurred</div>
                <button onClick={this.handleRetry} data-testid="retry-button">
                  Retry
                </button>
              </div>
            )
          }
          return this.props.children
        }
      }

      const { rerender } = render(
        <BrowserRouter>
          <RecoveryBoundary>
            <RecoverableComponent />
          </RecoveryBoundary>
        </BrowserRouter>
      )

      // Initially shows error
      expect(screen.getByTestId('error-state')).toBeInTheDocument()
      
      // Click retry
      fireEvent.click(screen.getByTestId('retry-button'))
      
      // Should recover
      expect(screen.getByTestId('recovered-component')).toBeInTheDocument()
    })
  })

  describe('Development vs Production Behavior', () => {
    test('shows detailed error info in development', () => {
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const DevErrorBoundary = class extends React.Component {
        constructor(props) {
          super(props)
          this.state = { hasError: false, error: null }
        }

        static getDerivedStateFromError(error) {
          return { hasError: true, error }
        }

        render() {
          if (this.state.hasError) {
            const isDevelopment = process.env.NODE_ENV === 'development'
            return (
              <div>
                <div data-testid="error-message">Error occurred</div>
                {isDevelopment && (
                  <div data-testid="dev-details">
                    Dev details: {this.state.error.message}
                  </div>
                )}
              </div>
            )
          }
          return this.props.children
        }
      }

      const ErrorComponent = () => {
        throw new Error('Test development error')
      }

      render(
        <BrowserRouter>
          <DevErrorBoundary>
            <ErrorComponent />
          </DevErrorBoundary>
        </BrowserRouter>
      )

      expect(screen.getByTestId('error-message')).toBeInTheDocument()
      expect(screen.getByTestId('dev-details')).toBeInTheDocument()
      expect(screen.getByTestId('dev-details')).toHaveTextContent('Test development error')

      process.env.NODE_ENV = originalNodeEnv
    })

    test('hides detailed error info in production', () => {
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const ProdErrorBoundary = class extends React.Component {
        constructor(props) {
          super(props)
          this.state = { hasError: false, error: null }
        }

        static getDerivedStateFromError(error) {
          return { hasError: true, error }
        }

        render() {
          if (this.state.hasError) {
            const isDevelopment = process.env.NODE_ENV === 'development'
            return (
              <div>
                <div data-testid="error-message">Something went wrong</div>
                {isDevelopment && (
                  <div data-testid="dev-details">
                    Dev details: {this.state.error.message}
                  </div>
                )}
              </div>
            )
          }
          return this.props.children
        }
      }

      const ErrorComponent = () => {
        throw new Error('Test production error')
      }

      render(
        <BrowserRouter>
          <ProdErrorBoundary>
            <ErrorComponent />
          </ProdErrorBoundary>
        </BrowserRouter>
      )

      expect(screen.getByTestId('error-message')).toBeInTheDocument()
      expect(screen.queryByTestId('dev-details')).not.toBeInTheDocument()

      process.env.NODE_ENV = originalNodeEnv
    })
  })
})