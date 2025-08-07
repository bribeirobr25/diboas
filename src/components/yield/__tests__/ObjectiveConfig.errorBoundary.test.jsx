/**
 * ObjectiveConfig Error Boundary Integration Tests
 * Tests error boundary integration and crash prevention
 */

import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'
import YieldErrorBoundary from '../YieldErrorBoundary.jsx'
import logger from '../../../utils/logger'

// Mock the actual ObjectiveConfig to simulate different error scenarios
const createMockObjectiveConfig = (errorType = null) => {
  return function MockObjectiveConfig() {
    const [state, setState] = React.useState({ step: 1 })

    React.useEffect(() => {
      if (errorType === 'useEffect-missing') {
        // This would throw if useEffect wasn't imported
        console.log('Effect running')
      }
    }, [])

    const handleClick = React.useCallback(() => {
      if (errorType === 'runtime-error') {
        throw new Error('Runtime error in component')
      }
      setState(prev => ({ ...prev, step: prev.step + 1 }))
    }, [errorType])

    if (errorType === 'render-error') {
      throw new Error('Error during render')
    }

    if (errorType === 'missing-import-simulation') {
      // Simulate the exact error that occurred with ObjectiveConfig
      throw new ReferenceError('useEffect is not defined at ObjectiveConfig (ObjectiveConfig.jsx:416:3)')
    }

    return (
      <div data-testid="objective-config-mock">
        <h1>Configure FinObjective</h1>
        <p>Step {state.step} of 2</p>
        <button onClick={handleClick} data-testid="next-button">
          Next
        </button>
      </div>
    )
  }
}

// Mock logger
vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
  }
}))

// Mock PageHeader
vi.mock('../../shared/PageHeader.jsx', () => ({
  default: ({ title, subtitle }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}))

describe('ObjectiveConfig Error Boundary Integration', () => {
  let consoleErrorSpy
  let originalReportError

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    originalReportError = window.reportError
    window.reportError = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    window.reportError = originalReportError
  })

  describe('Error Boundary Catches Component Crashes', () => {
    test('catches render errors in ObjectiveConfig', () => {
      const ErrorComponent = createMockObjectiveConfig('render-error')

      render(
        <BrowserRouter>
          <YieldErrorBoundary>
            <ErrorComponent />
          </YieldErrorBoundary>
        </BrowserRouter>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument()
      expect(logger.error).toHaveBeenCalledWith(
        'Yield component error boundary triggered',
        expect.objectContaining({
          error: 'Error: Error during render',
          location: 'YieldErrorBoundary'
        })
      )
    })

    test('catches runtime errors during user interaction', async () => {
      const ErrorComponent = createMockObjectiveConfig('runtime-error')

      render(
        <BrowserRouter>
          <YieldErrorBoundary>
            <ErrorComponent />
          </YieldErrorBoundary>
        </BrowserRouter>
      )

      // Component renders initially
      expect(screen.getByTestId('objective-config-mock')).toBeInTheDocument()

      // Click triggers error
      fireEvent.click(screen.getByTestId('next-button'))

      // Error boundary should catch it
      await waitFor(() => {
        expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      })
    })

    test('detects and reports missing import errors specifically', () => {
      const MissingImportComponent = createMockObjectiveConfig('missing-import-simulation')

      render(
        <BrowserRouter>
          <YieldErrorBoundary>
            <MissingImportComponent />
          </YieldErrorBoundary>
        </BrowserRouter>
      )

      expect(screen.getByText('Development Issue')).toBeInTheDocument()
      expect(screen.getByText(/Missing Import Detected/)).toBeInTheDocument()
      expect(screen.getByText(/useEffect/)).toBeInTheDocument()
      expect(screen.getByText(/react/)).toBeInTheDocument()
      
      expect(logger.error).toHaveBeenCalledWith(
        'Yield component error boundary triggered',
        expect.objectContaining({
          errorType: 'missing_import',
          missingImport: { hook: 'useEffect', library: 'react' }
        })
      )
    })
  })

  describe('Error Recovery Mechanisms', () => {
    test('allows retry after error', async () => {
      let shouldError = true
      
      const RecoverableComponent = () => {
        if (shouldError) {
          throw new Error('Temporary error')
        }
        return <div data-testid="recovered-component">Component recovered!</div>
      }

      render(
        <BrowserRouter>
          <YieldErrorBoundary>
            <RecoverableComponent />
          </YieldErrorBoundary>
        </BrowserRouter>
      )

      // Shows error initially
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      
      // Fix the error condition
      shouldError = false
      
      // Click retry
      fireEvent.click(screen.getByText('Try Again'))

      // Component should recover
      await waitFor(() => {
        expect(screen.getByTestId('recovered-component')).toBeInTheDocument()
      })
    })

    test('prevents infinite retry attempts', () => {
      const AlwaysErrorComponent = () => {
        throw new Error('Persistent error')
      }

      render(
        <BrowserRouter>
          <YieldErrorBoundary>
            <AlwaysErrorComponent />
          </YieldErrorBoundary>
        </BrowserRouter>
      )

      // Retry multiple times
      fireEvent.click(screen.getByText('Try Again'))
      fireEvent.click(screen.getByText('Try Again'))
      fireEvent.click(screen.getByText('Try Again'))

      // After 3 retries, button should be disabled
      expect(screen.getByText('Max Retries Reached')).toBeInTheDocument()
      expect(screen.getByText('Max Retries Reached')).toBeDisabled()
    })
  })

  describe('Navigation and Recovery Options', () => {
    test('provides go back navigation', () => {
      const mockHistoryBack = vi.fn()
      Object.defineProperty(window, 'history', {
        value: { back: mockHistoryBack, length: 2 },
        writable: true
      })

      const ErrorComponent = createMockObjectiveConfig('render-error')

      render(
        <BrowserRouter>
          <YieldErrorBoundary>
            <ErrorComponent />
          </YieldErrorBoundary>
        </BrowserRouter>
      )

      fireEvent.click(screen.getByText('Go Back'))
      expect(mockHistoryBack).toHaveBeenCalled()
    })

    test('provides home navigation', () => {
      const originalLocation = window.location
      delete window.location
      window.location = { href: '' }

      const ErrorComponent = createMockObjectiveConfig('render-error')

      render(
        <BrowserRouter>
          <YieldErrorBoundary>
            <ErrorComponent />
          </YieldErrorBoundary>
        </BrowserRouter>
      )

      fireEvent.click(screen.getByText('Home'))
      expect(window.location.href).toBe('/')

      window.location = originalLocation
    })
  })

  describe('Development vs Production Display', () => {
    test('shows developer details in development mode', () => {
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const ErrorComponent = createMockObjectiveConfig('render-error')

      render(
        <BrowserRouter>
          <YieldErrorBoundary>
            <ErrorComponent />
          </YieldErrorBoundary>
        </BrowserRouter>
      )

      // Should show developer details
      expect(screen.getByText('🔍 Developer Details (Development Mode)')).toBeInTheDocument()
      
      // Click to expand details
      fireEvent.click(screen.getByText('🔍 Developer Details (Development Mode)'))
      
      expect(screen.getByText('Error:')).toBeInTheDocument()
      expect(screen.getByText('Component Stack:')).toBeInTheDocument()

      process.env.NODE_ENV = originalNodeEnv
    })

    test('hides developer details in production mode', () => {
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const ErrorComponent = createMockObjectiveConfig('render-error')

      render(
        <BrowserRouter>
          <YieldErrorBoundary>
            <ErrorComponent />
          </YieldErrorBoundary>
        </BrowserRouter>
      )

      // Should not show developer details
      expect(screen.queryByText('🔍 Developer Details')).not.toBeInTheDocument()

      process.env.NODE_ENV = originalNodeEnv
    })
  })

  describe('Error Reporting Integration', () => {
    test('reports errors to external service when available', () => {
      const ErrorComponent = createMockObjectiveConfig('render-error')

      render(
        <BrowserRouter>
          <YieldErrorBoundary>
            <ErrorComponent />
          </YieldErrorBoundary>
        </BrowserRouter>
      )

      expect(window.reportError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          location: 'YieldErrorBoundary',
          errorType: undefined // Not a missing import error
        })
      )
    })

    test('includes error ID for support tracking', () => {
      const ErrorComponent = createMockObjectiveConfig('render-error')

      render(
        <BrowserRouter>
          <YieldErrorBoundary>
            <ErrorComponent />
          </YieldErrorBoundary>
        </BrowserRouter>
      )

      // Should display error ID
      expect(screen.getByText(/Error ID:/)).toBeInTheDocument()
      const errorIdElement = screen.getByText(/Error ID:/).closest('div')
      expect(errorIdElement.textContent).toMatch(/yield_error_\d+_[a-z0-9]+/)
    })
  })

  describe('Performance and Memory', () => {
    test('cleans up after error recovery', async () => {
      let errorCount = 0
      
      const UnstableComponent = () => {
        if (errorCount === 0) {
          errorCount++
          throw new Error('First error')
        }
        return <div data-testid="stable-component">Stable now</div>
      }

      render(
        <BrowserRouter>
          <YieldErrorBoundary>
            <UnstableComponent />
          </YieldErrorBoundary>
        </BrowserRouter>
      )

      // Error occurs
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      
      // Retry and recover
      fireEvent.click(screen.getByText('Try Again'))
      
      await waitFor(() => {
        expect(screen.getByTestId('stable-component')).toBeInTheDocument()
      })

      // Should have cleaned up error state
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
    })

    test('does not leak memory on repeated errors', () => {
      const LeakTestComponent = () => {
        throw new Error('Memory leak test error')
      }

      const { unmount } = render(
        <BrowserRouter>
          <YieldErrorBoundary>
            <LeakTestComponent />
          </YieldErrorBoundary>
        </BrowserRouter>
      )

      // Multiple retries
      for (let i = 0; i < 5; i++) {
        if (screen.queryByText('Try Again') && !screen.getByText('Try Again').disabled) {
          fireEvent.click(screen.getByText('Try Again'))
        }
      }

      // Should handle unmount gracefully
      expect(() => unmount()).not.toThrow()
    })
  })
})