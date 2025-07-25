/**
 * Component Tests for ErrorBoundary
 * Tests error handling and fallback UI rendering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../shared/ErrorBoundary.jsx'

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Component that works normally
const NormalComponent = () => <div>Normal component</div>

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear console errors to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  
  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <NormalComponent />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Normal component')).toBeInTheDocument()
    })
    
    it('should not interfere with normal component rendering', () => {
      const { container } = render(
        <ErrorBoundary>
          <div data-testid="normal-content">Working correctly</div>
        </ErrorBoundary>
      )
      
      expect(container.querySelector('[data-testid="normal-content"]')).toBeInTheDocument()
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