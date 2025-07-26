/**
 * FinTech Testing Utilities
 * Provides specialized testing utilities for financial applications
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'

// Add jest-axe matcher
expect.extend(toHaveNoViolations)

/**
 * Custom render function with providers
 */
export const renderWithProviders = (ui, options = {}) => {
  const {
    initialState: _initialState = {},
    theme = 'light',
    ...renderOptions
  } = options

  const AllTheProviders = ({ children }) => {
    return (
      <div data-theme={theme}>
        {children}
      </div>
    )
  }

  return render(ui, { wrapper: AllTheProviders, ...renderOptions })
}

/**
 * Financial amount testing utilities
 */
export const financialTestUtils = {
  // Test financial calculations with precision
  expectPreciseAmount: (actual, expected, precision = 2) => {
    const actualNum = typeof actual === 'string' ? parseFloat(actual) : actual
    const expectedNum = typeof expected === 'string' ? parseFloat(expected) : expected
    const factor = Math.pow(10, precision)
    
    expect(Math.round(actualNum * factor)).toBe(Math.round(expectedNum * factor))
  },

  // Test currency formatting
  expectValidCurrencyFormat: (amount, currency = 'USD') => {
    const currencyRegex = {
      'USD': /^\$[\d,]+\.\d{2}$/,
      'EUR': /^€[\d,]+\.\d{2}$/,
      'GBP': /^£[\d,]+\.\d{2}$/
    }
    
    expect(amount).toMatch(currencyRegex[currency] || currencyRegex.USD)
  },

  // Test Money object validity
  expectValidMoney: (money) => {
    expect(money).toHaveProperty('_amount')
    expect(money).toHaveProperty('_currency')
    expect(typeof money._amount).toBe('number')
    expect(typeof money._currency).toBe('string')
    expect(isFinite(money._amount)).toBe(true)
  },

  // Generate test transaction data
  createMockTransaction: (overrides = {}) => ({
    id: 'tx_' + Math.random().toString(36).substr(2, 9),
    type: 'sent',
    description: 'Test Transaction',
    amount: '-$100.00',
    time: '1 hour ago',
    status: 'completed',
    fee: '$1.50',
    timestamp: new Date().toISOString(),
    ...overrides
  }),

  // Generate test account data
  createMockAccount: (overrides = {}) => ({
    id: 'acc_' + Math.random().toString(36).substr(2, 9),
    accountNumber: '****1234',
    routingNumber: '123456789',
    bankName: 'Test Bank',
    accountType: 'CHECKING',
    balance: { amount: 1000, currency: 'USD' },
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    ...overrides
  })
}

/**
 * Accessibility testing utilities
 */
export const a11yTestUtils = {
  // Test component accessibility
  testAccessibility: async (component) => {
    const { container } = renderWithProviders(component)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  },

  // Test keyboard navigation
  testKeyboardNavigation: async (component, navigationKeys = ['Tab', 'Enter', 'Space']) => {
    const user = userEvent.setup()
    renderWithProviders(component)
    
    for (const key of navigationKeys) {
      await user.keyboard(`{${key}}`)
      // Allow time for focus changes
      await waitFor(() => {
        const focusedElement = document.activeElement
        expect(focusedElement).toBeTruthy()
      })
    }
  },

  // Test ARIA attributes
  expectProperAria: (element, expectedAttributes = {}) => {
    Object.entries(expectedAttributes).forEach(([attr, value]) => {
      expect(element).toHaveAttribute(`aria-${attr}`, value)
    })
  },

  // Test screen reader announcements
  expectScreenReaderText: (text) => {
    expect(screen.getByRole('status')).toHaveTextContent(text)
  }
}

/**
 * Security testing utilities
 */
export const securityTestUtils = {
  // Test input sanitization
  testInputSanitization: (sanitizeFn, maliciousInputs = []) => {
    const defaultMaliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '"><script>alert("xss")</script>',
      "'; DROP TABLE users; --",
      '../../../etc/passwd'
    ]
    
    const inputs = maliciousInputs.length ? maliciousInputs : defaultMaliciousInputs
    
    inputs.forEach(input => {
      const sanitized = sanitizeFn(input)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('javascript:')
      expect(sanitized).not.toContain('DROP TABLE')
    })
  },

  // Test credential validation
  expectSecureCredentials: (credentials) => {
    expect(credentials.apiKey).toBeTruthy()
    expect(credentials.apiKey).not.toContain('placeholder')
    expect(credentials.apiKey).not.toContain('test')
    expect(credentials.apiKey.length).toBeGreaterThan(10)
  },

  // Test transaction ID security
  expectSecureTransactionId: (transactionId) => {
    expect(transactionId).toBeTruthy()
    expect(transactionId.length).toBeGreaterThan(16)
    expect(transactionId).toMatch(/^[a-z]+_[a-f0-9]+$/)
    // Should not be predictable
    expect(transactionId).not.toMatch(/\d{13}/) // No timestamps
  }
}

/**
 * Performance testing utilities
 */
export const performanceTestUtils = {
  // Measure render time
  measureRenderTime: async (component) => {
    const startTime = performance.now()
    renderWithProviders(component)
    const endTime = performance.now()
    return endTime - startTime
  },

  // Test memory leaks
  testMemoryLeaks: (componentFactory, iterations = 100) => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0
    
    for (let i = 0; i < iterations; i++) {
      const { unmount } = renderWithProviders(componentFactory())
      unmount()
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0
    const memoryIncrease = finalMemory - initialMemory
    
    // Memory increase should be minimal (less than 1MB per 100 iterations)
    expect(memoryIncrease).toBeLessThan(1024 * 1024)
  },

  // Test large list performance
  testLargeListPerformance: async (ListComponent, itemCount = 1000) => {
    const items = Array.from({ length: itemCount }, (_, i) => ({
      id: i,
      value: `Item ${i}`
    }))
    
    const startTime = performance.now()
    renderWithProviders(<ListComponent items={items} />)
    const renderTime = performance.now() - startTime
    
    // Should render large lists in under 100ms
    expect(renderTime).toBeLessThan(100)
  }
}

/**
 * Form testing utilities
 */
export const formTestUtils = {
  // Fill form fields
  fillForm: async (fields) => {
    const user = userEvent.setup()
    
    for (const [label, value] of Object.entries(fields)) {
      const field = screen.getByLabelText(new RegExp(label, 'i'))
      await user.clear(field)
      await user.type(field, value)
    }
  },

  // Test form validation
  testFormValidation: async (formData, expectedErrors = {}) => {
    await formTestUtils.fillForm(formData)
    
    const submitButton = screen.getByRole('button', { name: /submit/i })
    await userEvent.click(submitButton)
    
    Object.entries(expectedErrors).forEach(([_field, expectedError]) => {
      expect(screen.getByText(new RegExp(expectedError, 'i'))).toBeInTheDocument()
    })
  },

  // Test successful form submission
  testFormSubmission: async (formData, onSubmit) => {
    await formTestUtils.fillForm(formData)
    
    const submitButton = screen.getByRole('button', { name: /submit/i })
    await userEvent.click(submitButton)
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining(formData))
    })
  }
}

/**
 * API testing utilities
 */
export const apiTestUtils = {
  // Mock successful API response
  mockApiSuccess: (data) => {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data)
    })
  },

  // Mock API error
  mockApiError: (status = 500, message = 'Internal Server Error') => {
    return Promise.reject({
      ok: false,
      status,
      message
    })
  },

  // Test API error handling
  testApiErrorHandling: async (apiCall, expectedError) => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    await expect(apiCall()).rejects.toMatchObject(expectedError)
    
    consoleSpy.mockRestore()
  }
}

/**
 * Integration test utilities
 */
export const integrationTestUtils = {
  // Test complete user flow
  testUserFlow: async (steps) => {
    const user = userEvent.setup()
    
    for (const step of steps) {
      switch (step.type) {
        case 'click':
          await user.click(screen.getByRole(step.role, { name: step.name }))
          break
        case 'type':
          await user.type(screen.getByLabelText(step.label), step.value)
          break
        case 'wait':
          await waitFor(() => {
            expect(screen.getByText(step.text)).toBeInTheDocument()
          })
          break
        case 'expect':
          expect(screen.getByText(step.text)).toBeInTheDocument()
          break
      }
    }
  },

  // Test error recovery
  testErrorRecovery: async (triggerError, recoveryAction) => {
    // Trigger error
    await triggerError()
    
    // Verify error is shown
    expect(screen.getByRole('alert')).toBeInTheDocument()
    
    // Perform recovery action
    await recoveryAction()
    
    // Verify error is cleared
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  }
}

// Export all utilities
export {
  renderWithProviders as render,
  screen,
  fireEvent,
  waitFor,
  userEvent
}

export default {
  financialTestUtils,
  a11yTestUtils,
  securityTestUtils,
  performanceTestUtils,
  formTestUtils,
  apiTestUtils,
  integrationTestUtils
}