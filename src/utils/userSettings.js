import logger from './logger'

/**
 * User Settings Management
 * Handles user preferences including advanced transaction display mode
 */

const SETTINGS_KEY = 'diboas_user_settings'

// Default settings
const defaultSettings = {
  showAdvancedTransactionDetails: false,
  theme: 'light',
  language: 'en',
  notifications: true,
  currency: 'USD'
}

class UserSettingsManager {
  constructor() {
    this.settings = this.loadSettings()
  }

  // Load settings from localStorage
  loadSettings() {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_KEY)
      if (storedSettings) {
        return { ...defaultSettings, ...JSON.parse(storedSettings) }
      }
    } catch (error) {
      logger.error('Failed to load user settings:', error)
    }
    return { ...defaultSettings }
  }

  // Save settings to localStorage
  saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings))
      // Emit event for components to react to settings changes
      window.dispatchEvent(new CustomEvent('diboas:settings-changed', { 
        detail: this.settings 
      }))
    } catch (error) {
      logger.error('Failed to save user settings:', error)
    }
  }

  // Get a specific setting
  getSetting(key) {
    return this.settings[key] ?? defaultSettings[key]
  }

  // Update a specific setting
  setSetting(key, value) {
    this.settings[key] = value
    this.saveSettings()
  }

  // Toggle advanced transaction details
  toggleAdvancedTransactionDetails() {
    this.settings.showAdvancedTransactionDetails = !this.settings.showAdvancedTransactionDetails
    this.saveSettings()
    return this.settings.showAdvancedTransactionDetails
  }

  // Get advanced transaction details setting
  getShowAdvancedTransactionDetails() {
    return this.settings.showAdvancedTransactionDetails
  }

  // Reset to default settings
  resetToDefaults() {
    this.settings = { ...defaultSettings }
    this.saveSettings()
  }

  // Get all settings
  getAllSettings() {
    return { ...this.settings }
  }
}

// Create singleton instance
export const userSettings = new UserSettingsManager()

// React hook for using settings
export const useUserSettings = () => {
  const [settings, setSettings] = useState(userSettings.getAllSettings())

  useEffect(() => {
    // Listen for settings changes
    const handleSettingsChange = (event) => {
      setSettings(event.detail)
    }

    window.addEventListener('diboas:settings-changed', handleSettingsChange)

    return () => {
      window.removeEventListener('diboas:settings-changed', handleSettingsChange)
    }
  }, [])

  return {
    settings,
    toggleAdvancedTransactionDetails: () => userSettings.toggleAdvancedTransactionDetails(),
    setSetting: (key, value) => userSettings.setSetting(key, value),
    getSetting: (key) => userSettings.getSetting(key)
  }
}

// Import React hooks if available
import { useState, useEffect } from 'react'