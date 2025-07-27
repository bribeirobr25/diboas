/**
 * User Settings Tests
 * Tests the user settings management including advanced mode toggle
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  
  return {
    getItem(key) {
      return store[key] || null
    },
    setItem(key, value) {
      store[key] = value.toString()
    },
    removeItem(key) {
      delete store[key]
    },
    clear() {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock custom event
const mockDispatchEvent = vi.fn()
Object.defineProperty(window, 'dispatchEvent', { value: mockDispatchEvent })

describe('User Settings Manager', () => {
  let userSettings

  beforeEach(() => {
    // Clear localStorage and mocks
    localStorageMock.clear()
    mockDispatchEvent.mockClear()
    
    // Clear module cache to get fresh instance
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default settings', async () => {
    const { userSettings } = await import('../utils/userSettings.js')
    
    expect(userSettings.getShowAdvancedTransactionDetails()).toBe(false)
    expect(userSettings.getSetting('theme')).toBe('light')
    expect(userSettings.getSetting('language')).toBe('en')
    expect(userSettings.getSetting('notifications')).toBe(true)
  })

  it('should load settings from localStorage if available', async () => {
    // Set some custom settings in localStorage
    const customSettings = {
      showAdvancedTransactionDetails: true,
      theme: 'dark',
      language: 'es'
    }
    localStorageMock.setItem('diboas_user_settings', JSON.stringify(customSettings))
    
    const { userSettings } = await import('../utils/userSettings.js')
    
    expect(userSettings.getShowAdvancedTransactionDetails()).toBe(true)
    expect(userSettings.getSetting('theme')).toBe('dark')
    expect(userSettings.getSetting('language')).toBe('es')
  })

  it('should toggle advanced transaction details', async () => {
    const { userSettings } = await import('../utils/userSettings.js')
    
    // Initial state should be false
    expect(userSettings.getShowAdvancedTransactionDetails()).toBe(false)
    
    // Toggle to true
    const newState = userSettings.toggleAdvancedTransactionDetails()
    expect(newState).toBe(true)
    expect(userSettings.getShowAdvancedTransactionDetails()).toBe(true)
    
    // Toggle back to false
    const nextState = userSettings.toggleAdvancedTransactionDetails()
    expect(nextState).toBe(false)
    expect(userSettings.getShowAdvancedTransactionDetails()).toBe(false)
  })

  it('should persist settings to localStorage', async () => {
    const { userSettings } = await import('../utils/userSettings.js')
    
    userSettings.setSetting('theme', 'dark')
    userSettings.setSetting('showAdvancedTransactionDetails', true)
    
    const stored = JSON.parse(localStorageMock.getItem('diboas_user_settings'))
    expect(stored.theme).toBe('dark')
    expect(stored.showAdvancedTransactionDetails).toBe(true)
  })

  it('should emit settings-changed event when settings are updated', async () => {
    const { userSettings } = await import('../utils/userSettings.js')
    
    userSettings.setSetting('theme', 'dark')
    
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'diboas:settings-changed'
      })
    )
    
    const eventCall = mockDispatchEvent.mock.calls[0][0]
    expect(eventCall.detail.theme).toBe('dark')
  })

  it('should reset to default settings', async () => {
    const { userSettings } = await import('../utils/userSettings.js')
    
    // Change some settings
    userSettings.setSetting('theme', 'dark')
    userSettings.setSetting('showAdvancedTransactionDetails', true)
    userSettings.setSetting('language', 'fr')
    
    // Reset to defaults
    userSettings.resetToDefaults()
    
    expect(userSettings.getSetting('theme')).toBe('light')
    expect(userSettings.getShowAdvancedTransactionDetails()).toBe(false)
    expect(userSettings.getSetting('language')).toBe('en')
  })

  it('should handle localStorage errors gracefully', async () => {
    // Mock localStorage to throw error
    const originalSetItem = localStorageMock.setItem
    localStorageMock.setItem = vi.fn(() => {
      throw new Error('Storage quota exceeded')
    })
    
    const { userSettings } = await import('../utils/userSettings.js')
    
    // Should not throw error
    expect(() => {
      userSettings.setSetting('theme', 'dark')
    }).not.toThrow()
    
    // Restore original function
    localStorageMock.setItem = originalSetItem
  })

  it('should return all settings', async () => {
    const { userSettings } = await import('../utils/userSettings.js')
    
    userSettings.setSetting('theme', 'dark')
    userSettings.setSetting('showAdvancedTransactionDetails', true)
    
    const allSettings = userSettings.getAllSettings()
    
    expect(allSettings).toMatchObject({
      showAdvancedTransactionDetails: true,
      theme: 'dark',
      language: 'en',
      notifications: true,
      currency: 'USD'
    })
  })
})