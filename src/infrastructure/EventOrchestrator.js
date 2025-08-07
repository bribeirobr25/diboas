/**
 * Event Orchestrator
 * Manages complex business processes across domains using event-driven sagas
 * Implements event sourcing patterns and process management
 */

import logger from '../utils/logger.js'
import { globalEventBus } from './EventBus.js'
import { globalEventBroadcaster } from './EventBroadcaster.js'

export class EventOrchestrator {
  constructor(eventBus = globalEventBus, broadcaster = globalEventBroadcaster) {
    this._eventBus = eventBus
    this._broadcaster = broadcaster
    this._processes = new Map()
    this._processTemplates = new Map()
    this._sagaInstances = new Map()
    
    this._setupBusinessProcesses()
  }

  /**
   * Register a business process saga template
   */
  registerProcess(processName, template) {
    this._processTemplates.set(processName, {
      ...template,
      registeredAt: new Date().toISOString()
    })

    logger.info(`Business process registered: ${processName}`)
  }

  /**
   * Start a new business process instance
   */
  async startProcess(processName, initialData) {
    const template = this._processTemplates.get(processName)
    if (!template) {
      throw new Error(`Process template not found: ${processName}`)
    }

    const processId = this._generateProcessId(processName)
    const process = {
      id: processId,
      name: processName,
      status: 'started',
      currentStep: template.initialStep || 'start',
      data: { ...initialData },
      steps: [],
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      template
    }

    this._processes.set(processId, process)

    // Subscribe to relevant events for this process
    const unsubscribers = this._subscribeToProcessEvents(process)
    process.unsubscribers = unsubscribers

    logger.info(`Business process started: ${processName}`, {
      processId,
      initialData
    })

    // Execute initial step
    await this._executeProcessStep(process, 'start', initialData)

    return processId
  }

  /**
   * Setup predefined business processes
   */
  _setupBusinessProcesses() {
    // On-Ramp Transaction Process
    this.registerProcess('onramp-transaction', {
      initialStep: 'start',
      steps: {
        start: {
          on: {
            'OnRampInitiated': 'payment-processing'
          }
        },
        'payment-processing': {
          on: {
            'PaymentReceivedEvent': 'fund-allocation',
            'TransactionFailedEvent': 'failure-handling'
          },
          timeout: 300000, // 5 minutes
          timeoutAction: 'payment-timeout'
        },
        'fund-allocation': {
          on: {
            'OnRampCompleted': 'balance-update'
          }
        },
        'balance-update': {
          on: {
            'TransactionCompletedEvent': 'completion'
          }
        },
        'completion': {
          final: true,
          action: 'notify-user'
        },
        'failure-handling': {
          action: 'refund-payment',
          final: true
        }
      }
    })

    // Asset Purchase Process
    this.registerProcess('asset-purchase', {
      initialStep: 'start',
      steps: {
        start: {
          on: {
            'AssetPurchaseInitiated': 'fund-check'
          }
        },
        'fund-check': {
          action: 'verify-sufficient-funds',
          on: {
            'FundsVerified': 'price-quote',
            'InsufficientFunds': 'fund-insufficient'
          }
        },
        'price-quote': {
          action: 'get-asset-quote',
          on: {
            'PriceQuoteReceived': 'execute-trade',
            'PriceQuoteFailed': 'quote-failure'
          }
        },
        'execute-trade': {
          on: {
            'TradeExecutedEvent': 'settlement',
            'TradeExecutionFailed': 'trade-failure'
          }
        },
        'settlement': {
          on: {
            'AssetPurchaseCompleted': 'completion'
          }
        },
        'completion': {
          final: true,
          action: 'update-portfolio'
        }
      }
    })

    // Cross-Chain Transfer Process
    this.registerProcess('cross-chain-transfer', {
      initialStep: 'start',
      steps: {
        start: {
          on: {
            'ExternalTransferInitiated': 'route-planning'
          }
        },
        'route-planning': {
          action: 'calculate-optimal-route',
          on: {
            'RouteCalculated': 'source-chain-tx',
            'RouteCalculationFailed': 'routing-failure'
          }
        },
        'source-chain-tx': {
          action: 'execute-source-transaction',
          on: {
            'SourceChainTxConfirmed': 'bridge-transfer',
            'SourceChainTxFailed': 'source-failure'
          }
        },
        'bridge-transfer': {
          on: {
            'BridgeTransferInitiated': 'destination-waiting',
            'BridgeTransferFailed': 'bridge-failure'
          }
        },
        'destination-waiting': {
          on: {
            'DestinationChainTxConfirmed': 'completion',
            'DestinationChainTxFailed': 'destination-failure'
          },
          timeout: 1800000 // 30 minutes
        },
        'completion': {
          final: true,
          action: 'notify-completion'
        }
      }
    })

    // Compliance Check Process
    this.registerProcess('compliance-check', {
      initialStep: 'start',
      steps: {
        start: {
          on: {
            'LargeTransactionAlertEvent': 'risk-assessment'
          }
        },
        'risk-assessment': {
          action: 'evaluate-transaction-risk',
          on: {
            'LowRisk': 'completion',
            'MediumRisk': 'enhanced-monitoring',
            'HighRisk': 'manual-review'
          }
        },
        'enhanced-monitoring': {
          action: 'enable-enhanced-monitoring',
          on: {
            'MonitoringEnabled': 'completion'
          }
        },
        'manual-review': {
          action: 'flag-for-manual-review',
          on: {
            'ManualReviewCompleted': 'completion',
            'TransactionBlocked': 'blocking'
          }
        },
        'completion': {
          final: true,
          action: 'update-compliance-status'
        },
        'blocking': {
          final: true,
          action: 'block-transaction'
        }
      }
    })
  }

  /**
   * Subscribe to events relevant to a process
   */
  _subscribeToProcessEvents(process) {
    const unsubscribers = []
    const template = process.template

    // Subscribe to all events mentioned in the process steps
    const eventTypes = new Set()
    for (const step of Object.values(template.steps)) {
      if (step.on) {
        for (const eventType of Object.keys(step.on)) {
          eventTypes.add(eventType)
        }
      }
    }

    for (const eventType of eventTypes) {
      const unsubscribe = this._eventBus.subscribe(
        eventType,
        async (event) => {
          await this._handleProcessEvent(process.id, event)
        },
        { context: { processId: process.id } }
      )
      unsubscribers.push(unsubscribe)
    }

    return unsubscribers
  }

  /**
   * Handle events for a specific process
   */
  async _handleProcessEvent(processId, event) {
    const process = this._processes.get(processId)
    if (!process || process.status === 'completed' || process.status === 'failed') {
      return
    }

    const currentStepConfig = process.template.steps[process.currentStep]
    if (!currentStepConfig || !currentStepConfig.on) {
      return
    }

    const nextStep = currentStepConfig.on[event.eventType]
    if (!nextStep) {
      return
    }

    logger.debug(`Process step transition: ${process.name}`, {
      processId,
      from: process.currentStep,
      to: nextStep,
      triggeredBy: event.eventType,
      eventId: event.eventId
    })

    // Record the step
    process.steps.push({
      step: process.currentStep,
      triggeredBy: event.eventType,
      eventId: event.eventId,
      eventData: event.data,
      timestamp: new Date().toISOString()
    })

    // Update process state
    process.currentStep = nextStep
    process.lastActivityAt = new Date().toISOString()
    process.data = { ...process.data, ...event.data }

    // Execute the step
    await this._executeProcessStep(process, nextStep, event.data)
  }

  /**
   * Execute a process step
   */
  async _executeProcessStep(process, stepName, eventData) {
    const stepConfig = process.template.steps[stepName]
    if (!stepConfig) {
      logger.warn(`Process step not found: ${stepName} in ${process.name}`)
      return
    }

    try {
      // Execute step action if defined
      if (stepConfig.action) {
        await this._executeStepAction(process, stepName, stepConfig.action, eventData)
      }

      // Check if this is a final step
      if (stepConfig.final) {
        process.status = 'completed'
        process.completedAt = new Date().toISOString()
        
        logger.info(`Process completed: ${process.name}`, {
          processId: process.id,
          duration: new Date() - new Date(process.startedAt)
        })

        // Cleanup subscriptions
        if (process.unsubscribers) {
          process.unsubscribers.forEach(unsubscribe => unsubscribe())
        }
        
        // Remove from active processes
        this._processes.delete(process.id)
      }

      // Setup timeout if configured
      if (stepConfig.timeout) {
        this._setupStepTimeout(process, stepName, stepConfig.timeout)
      }

    } catch (error) {
      logger.error(`Process step execution failed: ${process.name}`, {
        processId: process.id,
        step: stepName,
        error: error.message
      })

      process.status = 'failed'
      process.failedAt = new Date().toISOString()
      process.error = error.message
      
      // Cleanup on failure
      if (process.unsubscribers) {
        process.unsubscribers.forEach(unsubscribe => unsubscribe())
      }
    }
  }

  /**
   * Execute step-specific actions
   */
  async _executeStepAction(process, stepName, actionName, eventData) {
    logger.debug(`Executing process action: ${actionName}`, {
      processId: process.id,
      processName: process.name,
      step: stepName
    })

    // Predefined actions
    const actions = {
      'notify-user': () => {
        logger.info(`User notification: Process ${process.name} completed`, {
          userId: process.data.userId,
          processId: process.id
        })
      },
      
      'verify-sufficient-funds': () => {
        // Mock fund verification
        const hasEnoughFunds = parseFloat(process.data.amount || 0) <= 10000
        const eventType = hasEnoughFunds ? 'FundsVerified' : 'InsufficientFunds'
        
        return this._broadcaster.broadcastDomainEvent('finance', {
          eventType,
          eventId: `${process.id}_${Date.now()}`,
          timestamp: new Date().toISOString(),
          data: {
            processId: process.id,
            amount: process.data.amount,
            verified: hasEnoughFunds
          }
        })
      },

      'update-portfolio': () => {
        logger.info('Portfolio updated after asset purchase', {
          processId: process.id,
          asset: process.data.asset,
          amount: process.data.amountPurchased
        })
      },

      'evaluate-transaction-risk': () => {
        // Mock risk assessment
        const amount = parseFloat(process.data.amount || 0)
        let riskLevel = 'LowRisk'
        
        if (amount > 50000) riskLevel = 'HighRisk'
        else if (amount > 10000) riskLevel = 'MediumRisk'
        
        return this._broadcaster.broadcastDomainEvent('compliance', {
          eventType: riskLevel,
          eventId: `${process.id}_risk_${Date.now()}`,
          timestamp: new Date().toISOString(),
          data: {
            processId: process.id,
            riskLevel,
            amount: process.data.amount
          }
        })
      }
    }

    const action = actions[actionName]
    if (action) {
      await action()
    } else {
      logger.warn(`Unknown process action: ${actionName}`)
    }
  }

  /**
   * Setup timeout for a process step
   */
  _setupStepTimeout(process, stepName, timeout) {
    setTimeout(() => {
      if (process.currentStep === stepName && process.status === 'started') {
        logger.warn(`Process step timeout: ${process.name}`, {
          processId: process.id,
          step: stepName,
          timeout
        })

        // Handle timeout based on step configuration
        const stepConfig = process.template.steps[stepName]
        if (stepConfig.timeoutAction) {
          this._executeStepAction(process, stepName, stepConfig.timeoutAction, {
            timeout: true,
            step: stepName
          })
        } else {
          // Default timeout behavior - fail the process
          process.status = 'failed'
          process.failedAt = new Date().toISOString()
          process.error = `Timeout in step: ${stepName}`
        }
      }
    }, timeout)
  }

  /**
   * Generate unique process ID
   */
  _generateProcessId(processName) {
    return `${processName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get all active processes
   */
  getActiveProcesses() {
    return Array.from(this._processes.values())
      .filter(process => process.status === 'started')
  }

  /**
   * Get process by ID
   */
  getProcess(processId) {
    return this._processes.get(processId)
  }

  /**
   * Get process statistics
   */
  getStats() {
    const processes = Array.from(this._processes.values())
    
    return {
      totalProcesses: processes.length,
      activeProcesses: processes.filter(p => p.status === 'started').length,
      completedProcesses: processes.filter(p => p.status === 'completed').length,
      failedProcesses: processes.filter(p => p.status === 'failed').length,
      registeredTemplates: this._processTemplates.size
    }
  }

  /**
   * Cleanup completed processes older than specified time
   */
  cleanup(olderThanMs = 24 * 60 * 60 * 1000) { // 24 hours default
    const now = Date.now()
    const toDelete = []

    for (const [processId, process] of this._processes) {
      const completedAt = process.completedAt || process.failedAt
      if (completedAt && (now - new Date(completedAt).getTime()) > olderThanMs) {
        toDelete.push(processId)
      }
    }

    for (const processId of toDelete) {
      const process = this._processes.get(processId)
      if (process.unsubscribers) {
        process.unsubscribers.forEach(unsubscribe => unsubscribe())
      }
      this._processes.delete(processId)
    }

    logger.info(`Cleaned up ${toDelete.length} old processes`)
    return toDelete.length
  }
}

/**
 * Create singleton event orchestrator
 */
export const globalEventOrchestrator = new EventOrchestrator()

export default EventOrchestrator