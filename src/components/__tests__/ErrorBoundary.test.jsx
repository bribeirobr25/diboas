/**
 * Comprehensive Test Suite for ErrorBoundary Component
 * Tests error handling, recovery, navigation, and user experience
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ErrorBoundary, { withErrorBoundary, useErrorHandler } from '../shared/ErrorBoundary.jsx'

// Mock child component that can throw errors
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage)
  }
  return <div data-testid="child-component">Child rendered successfully</div>
}

// Mock child component for HOC testing
const MockComponent = ({ testProp }) => (
  <div data-testid="wrapped-component">Wrapped component with prop: {testProp}</div>
)

describe('ErrorBoundary Component', () => {
  let mockNavigate
  let originalConsoleError
  let originalConsoleWarn

  beforeEach(() => {
    mockNavigate = vi.fn()
    
    // Mock console methods to avoid test output noise
    originalConsoleError = console.error
    originalConsoleWarn = console.warn
    console.error = vi.fn()
    console.warn = vi.fn()
    
    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Test Browser',
      writable: true
    })
    
    // Mock window.location
    delete window.location
    window.location = {
      pathname: '/app',
      href: 'http://localhost:3000/app'
    }
  })

  afterEach(() => {
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
    vi.restoreAllMocks()
  })
  
  describe('Error Catching and Display', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('child-component')).toBeInTheDocument()
      expect(screen.getByText('Child rendered successfully')).toBeInTheDocument()
    })

    it('should catch and display error boundary UI when child throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test component error" />
        </ErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('We encountered an unexpected error. Don\'t worry, your data is safe.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument()
    })

    it('should display diBoaS logo in error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const logo = screen.getByAltText('diBoaS Logo')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', expect.stringContaining('diboas-logo.png'))
    })

    it('should show development error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Detailed test error" />
        </ErrorBoundary>
      )

      expect(screen.getByText('Development Error Details:')).toBeInTheDocument()
      expect(screen.getByText('Detailed test error')).toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })

    it('should not show development details in production mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Production error" />
        </ErrorBoundary>
      )

      expect(screen.queryByText('Development Error Details:')).not.toBeInTheDocument()
      expect(screen.queryByText('Production error')).not.toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })
  })
  
  describe('Error Handling', () => {
    it('should catch errors and display fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      // Should display error boundary UI with semantic classes
      const errorContainer = document.querySelector('.error-boundary-container')
      expect(errorContainer).toBeInTheDocument()
    })
    
    it('should show error message in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      // Should contain error-related text
      const bodyText = document.body.textContent
      expect(bodyText).toContain('Something went wrong')
    })
    
    it('should provide retry functionality', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      // Should have retry button
      const buttons = document.querySelectorAll('button')
      const retryButton = Array.from(buttons).find(
        button => button.textContent?.toLowerCase().includes('try again')
      )
      
      expect(retryButton).toBeTruthy()
    })
  })
  
  describe('Semantic CSS Classes', () => {
    it('should use semantic CSS classes in error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      // Check for our semantic classes
      const errorBoundaryContainer = document.querySelector('.error-boundary-container')
      const errorBoundaryCard = document.querySelector('.error-boundary-card')
      const errorBoundaryContent = document.querySelector('.error-boundary-content')
      
      expect(errorBoundaryContainer || errorBoundaryCard || errorBoundaryContent).toBeTruthy()
    })
    
    it('should have proper button classes', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      // Check for action button classes
      const actionButtons = document.querySelectorAll('.action-button-full, .primary-button')
      expect(actionButtons.length).toBeGreaterThan(0)
    })
  })
  
  describe('Development Mode', () => {
    it('should show detailed error info in development', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      // Should show development error panel
      const devErrorPanel = document.querySelector('.development-error-panel')
      expect(devErrorPanel).toBeTruthy()
      
      // Restore environment
      process.env.NODE_ENV = originalEnv
    })
  })
  
  describe('Error Logging', () => {
    it('should log errors for monitoring', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      // Should have logged the error
      expect(consoleSpy).toHaveBeenCalled()
    })
  })
  
  describe('Retry Functionality', () => {
    it('should limit retry attempts', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      // Find and click retry button multiple times
      const retryButton = Array.from(document.querySelectorAll('button')).find(
        button => button.textContent?.toLowerCase().includes('try again')
      )
      
      if (retryButton) {
        // After multiple retries, should show max retries reached
        for (let i = 0; i < 4; i++) {
          retryButton.click()
          rerender(
            <ErrorBoundary>
              <ThrowError shouldThrow={true} />
            </ErrorBoundary>
          )
        }
        
        const bodyText = document.body.textContent
        expect(bodyText).toContain('Max Retries')
      }
    })
  })
  
  describe('Navigation', () => {
    it('should provide home navigation', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      // Should have home button
      const homeButton = Array.from(document.querySelectorAll('button')).find(
        button => button.textContent?.toLowerCase().includes('home')
      )
      
      expect(homeButton).toBeTruthy()
    })
  })
  
  describe('Performance', () => {
    it('should render error state quickly', () => {
      const startTime = performance.now()
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      const endTime = performance.now()
      
      // Should render error state quickly
      expect(endTime - startTime).toBeLessThan(100)
    })
  })
})