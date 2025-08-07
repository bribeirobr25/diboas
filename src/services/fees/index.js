/**
 * Fee Services Index
 * Exports fee-related services and utilities
 */

import logger from '../../utils/logger'

export { MockupFeeProviderService, mockupFeeProviderService } from './MockupFeeProviderService.js'

/**
 * Initialize fee services - preload fee data for better UX
 */
export async function initializeFeeServices() {
  try {
    const { mockupFeeProviderService } = await import('./MockupFeeProviderService.js')
    
    // Pre-load fee data to populate cache
    await mockupFeeProviderService.getAllFeeData()
    
    logger.info('Fee services initialized successfully')
    return true
  } catch (error) {
    logger.warn('Fee services initialization failed:', error.message)
    return false
  }
}

/**
 * Health check for fee services
 */
export async function checkFeeServicesHealth() {
  try {
    const { mockupFeeProviderService } = await import('./MockupFeeProviderService.js')
    
    const healthStatus = await mockupFeeProviderService.healthCheck()
    
    if (healthStatus.status === 'healthy') {
      logger.info('Fee services are healthy')
    } else {
      logger.warn('Fee services are unhealthy:', healthStatus.error)
    }
    
    return healthStatus
  } catch (error) {
    logger.error('Fee services health check failed:', error.message)
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: Date.now()
    }
  }
}