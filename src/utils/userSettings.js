import logger from './logger'
import { storage } from './modernStorage.js'

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
    this.settings = { ...defaultSettings }
    this.initializeAsync()
  }
  
  async initializeAsync() {
    this.settings = await this.loadSettings()
  }

  // Load settings from modernized localStorage
  async loadSettings() {
    try {
      // Try modern storage first, fallback to legacy
      let storedSettings = await storage.getUserSettings('global')
      
      // Legacy fallback
      if (!storedSettings) {
        const legacySettings = localStorage.getItem(SETTINGS_KEY)
        if (legacySettings) {
          storedSettings = JSON.parse(legacySettings)
          // Migrate to modern storage
          await storage.setUserSettings('global', storedSettings)
          // Keep legacy for compatibility during transition
        }
      }
      
      if (storedSettings) {
        return { ...defaultSettings, ...storedSettings }
      }
    } catch (error) {
      logger.error('Failed to load user settings:', error)
    }
    return { ...defaultSettings }
  }

  // Save settings to modernized localStorage
  async saveSettings() {
    try {
      // Save to modern storage
      await storage.setUserSettings('global', this.settings)
      
      // Keep legacy format for compatibility during transition
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
  async setSetting(key, value) {
    this.settings[key] = value
    await this.saveSettings()
  }

  // Toggle advanced transaction details
  async toggleAdvancedTransactionDetails() {
    this.settings.showAdvancedTransactionDetails = !this.settings.showAdvancedTransactionDetails
    await this.saveSettings()
    return this.settings.showAdvancedTransactionDetails
  }

  // Get advanced transaction details setting
  getShowAdvancedTransactionDetails() {
    return this.settings.showAdvancedTransactionDetails
  }

  // Reset to default settings
  async resetToDefaults() {
    this.settings = { ...defaultSettings }
    await this.saveSettings()
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
    toggleAdvancedTransactionDetails: async () => await userSettings.toggleAdvancedTransactionDetails(),
    setSetting: async (key, value) => await userSettings.setSetting(key, value),
    getSetting: (key) => userSettings.getSetting(key)
  }
}

// Import React hooks if available
import { useState, useEffect } from 'react'