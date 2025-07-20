/**
 * Integration Manager Extensions for Transaction System
 * Adds transaction capabilities to the existing integration manager
 */

/**
 * Add transaction registry support to existing integration manager
 */
export function extendIntegrationManager(integrationManager) {
  // Add registry storage if not exists
  if (!integrationManager.registries) {
    integrationManager.registries = new Map()
  }

  // Add registry registration method
  if (!integrationManager.registerRegistry) {
    integrationManager.registerRegistry = function(name, registry) {
      this.registries.set(name, registry)
    }
  }

  // Extend getRegistry method to check additional registries
  const originalGetRegistry = integrationManager.getRegistry
  integrationManager.getRegistry = function(type) {
    try {
      return originalGetRegistry.call(this, type)
    } catch (error) {
      // Check additional registries
      const registry = this.registries.get(type)
      if (registry) {
        return registry
      }
      throw error
    }
  }

  // Extend execute method to support additional registries
  const originalExecute = integrationManager.execute
  integrationManager.execute = async function(type, operation, operationData, options = {}) {
    try {
      return await originalExecute.call(this, type, operation, operationData, options)
    } catch (error) {
      if (error.message.includes('Unknown registry type')) {
        // Try additional registries
        const registry = this.registries.get(type)
        if (registry && typeof registry[operation] === 'function') {
          try {
            const result = await registry[operation](operationData, options)
            return result
          } catch (registryError) {
            throw new Error(`${type} registry operation failed: ${registryError.message}`)
          }
        }
      }
      throw error
    }
  }

  // Add transaction provider initialization
  if (!integrationManager._initializeTransactionProviders) {
    integrationManager._initializeTransactionProviders = async function() {
      try {
        // Dynamic import to avoid circular dependencies
        const { initializeTransactionProviders } = await import('../transactions/index.js')
        await initializeTransactionProviders(this)
      } catch (error) {
        console.warn('Transaction providers not available:', error.message)
      }
    }
  }

  return integrationManager
}

export default extendIntegrationManager