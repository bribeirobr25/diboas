import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  CommandBus, 
  Command, 
  CommandHandler,
  CreateTransactionHandler,
  UpdateBalanceHandler,
  CreateStrategyHandler,
  COMMAND_TYPES
} from '../CommandBus.js'

// Mock event store
vi.mock('../../events/EventStore.js', () => ({
  eventStore: {
    appendEvent: vi.fn().mockResolvedValue({
      id: 'evt_123',
      timestamp: Date.now()
    })
  },
  EVENT_TYPES: {
    TRANSACTION_CREATED: 'transaction_created',
    BALANCE_UPDATED: 'balance_updated',
    STRATEGY_CREATED: 'strategy_created'
  }
}))

// Mock security manager
vi.mock('../../security/SecurityManager.js', () => ({
  securityManager: {
    logSecurityEvent: vi.fn()
  },
  SECURITY_EVENT_TYPES: {
    FINANCIAL_OPERATION: 'financial_operation',
    SECURITY_VIOLATION: 'security_violation'
  }
}))

// Mock rate limiter
vi.mock('../../utils/advancedRateLimiter.js', () => ({
  checkTransactionRateLimit: vi.fn().mockReturnValue({ allowed: true })
}))

describe('CommandBus', () => {
  let commandBus

  beforeEach(() => {
    commandBus = new CommandBus()
    vi.clearAllMocks()
  })

  afterEach(() => {
    commandBus.reset()
  })

  describe('Command Class', () => {
    it('should create commands with correct structure', () => {
      const command = new Command(COMMAND_TYPES.CREATE_TRANSACTION, 'user123', {
        type: 'buy',
        amount: 100,
        asset: 'BTC'
      }, { userId: 'user123' })

      expect(command.id).toMatch(/^cmd_/)
      expect(command.type).toBe(COMMAND_TYPES.CREATE_TRANSACTION)
      expect(command.aggregateId).toBe('user123')
      expect(command.data.type).toBe('buy')
      expect(command.metadata.userId).toBe('user123')
      expect(command.metadata.timestamp).toBeTypeOf('number')
      expect(command.metadata.correlationId).toMatch(/^corr_/)
    })

    it('should generate unique IDs and correlation IDs', () => {
      const command1 = new Command(COMMAND_TYPES.CREATE_TRANSACTION, 'user123', {})
      const command2 = new Command(COMMAND_TYPES.CREATE_TRANSACTION, 'user123', {})

      expect(command1.id).not.toBe(command2.id)
      expect(command1.metadata.correlationId).not.toBe(command2.metadata.correlationId)
    })
  })

  describe('CommandBus Initialization', () => {
    it('should initialize with default handlers', () => {
      expect(commandBus.handlers.size).toBe(3)
      expect(commandBus.handlers.has(COMMAND_TYPES.CREATE_TRANSACTION)).toBe(true)
      expect(commandBus.handlers.has(COMMAND_TYPES.UPDATE_BALANCE)).toBe(true)
      expect(commandBus.handlers.has(COMMAND_TYPES.CREATE_STRATEGY)).toBe(true)
    })

    it('should have empty middleware and history initially', () => {
      expect(commandBus.middleware).toHaveLength(0)
      expect(commandBus.commandHistory).toHaveLength(0)
    })
  })

  describe('Handler Registration', () => {
    it('should register custom handlers', () => {
      class CustomHandler extends CommandHandler {
        constructor() {
          super('custom_command')
        }
        validate() { return true }
        async execute() { return { success: true } }
      }

      const customHandler = new CustomHandler()
      commandBus.register(customHandler)

      expect(commandBus.handlers.has('custom_command')).toBe(true)
      expect(commandBus.handlers.get('custom_command')).toBe(customHandler)
    })

    it('should support middleware registration', () => {
      const middleware1 = async (command) => command
      const middleware2 = async (command) => command

      commandBus.use(middleware1)
      commandBus.use(middleware2)

      expect(commandBus.middleware).toHaveLength(2)
      expect(commandBus.middleware[0]).toBe(middleware1)
      expect(commandBus.middleware[1]).toBe(middleware2)
    })
  })

  describe('CreateTransactionHandler', () => {
    let handler

    beforeEach(() => {
      handler = new CreateTransactionHandler()
    })

    it('should validate transaction commands correctly', () => {
      const validCommand = new Command(COMMAND_TYPES.CREATE_TRANSACTION, 'user123', {
        type: 'buy',
        amount: 100,
        asset: 'BTC',
        userId: 'user123'
      })

      expect(() => handler.validate(validCommand)).not.toThrow()
    })

    it('should reject invalid transaction data', () => {
      const invalidCommand = new Command(COMMAND_TYPES.CREATE_TRANSACTION, 'user123', {
        type: 'buy',
        amount: -100, // Invalid negative amount
        asset: 'BTC',
        userId: 'user123'
      })

      expect(() => handler.validate(invalidCommand)).toThrow('Invalid transaction data')
    })

    it('should prevent buying USD', () => {
      const buyUSDCommand = new Command(COMMAND_TYPES.CREATE_TRANSACTION, 'user123', {
        type: 'buy',
        amount: 100,
        asset: 'USD',
        userId: 'user123'
      })

      expect(() => handler.validate(buyUSDCommand)).toThrow('Cannot buy USD')
    })

    it('should execute transaction creation successfully', async () => {
      const command = new Command(COMMAND_TYPES.CREATE_TRANSACTION, 'user123', {
        type: 'buy',
        amount: 100,
        asset: 'BTC',
        userId: 'user123'
      })

      const result = await handler.execute(command)

      expect(result.success).toBe(true)
      expect(result.transactionId).toMatch(/^tx_/)
      expect(result.eventId).toBe('evt_123')
    })
  })

  describe('UpdateBalanceHandler', () => {
    let handler

    beforeEach(() => {
      handler = new UpdateBalanceHandler()
    })

    it('should validate balance update commands', () => {
      const validCommand = new Command(COMMAND_TYPES.UPDATE_BALANCE, 'user123', {
        balance: {
          totalUSD: 1000,
          availableForSpending: 800,
          investedAmount: 200
        }
      })

      expect(() => handler.validate(validCommand)).not.toThrow()
    })

    it('should reject invalid balance data', () => {
      const invalidCommand = new Command(COMMAND_TYPES.UPDATE_BALANCE, 'user123', {
        balance: 'invalid' // Should be object
      })

      expect(() => handler.validate(invalidCommand)).toThrow('Invalid balance data')
    })

    it('should reject negative balances', () => {
      const negativeBalanceCommand = new Command(COMMAND_TYPES.UPDATE_BALANCE, 'user123', {
        balance: {
          totalUSD: -1000 // Negative balance not allowed
        }
      })

      expect(() => handler.validate(negativeBalanceCommand)).toThrow('Negative balance not allowed')
    })

    it('should execute balance update successfully', async () => {
      const command = new Command(COMMAND_TYPES.UPDATE_BALANCE, 'user123', {
        balance: { totalUSD: 1000 }
      })

      const result = await handler.execute(command)

      expect(result.success).toBe(true)
      expect(result.eventId).toBe('evt_123')
    })
  })

  describe('CreateStrategyHandler', () => {
    let handler

    beforeEach(() => {
      handler = new CreateStrategyHandler()
    })

    it('should validate strategy creation commands', () => {
      const validCommand = new Command(COMMAND_TYPES.CREATE_STRATEGY, 'user123', {
        strategyName: 'Conservative Growth',
        amount: 1000,
        riskLevel: 'Conservative'
      })

      expect(() => handler.validate(validCommand)).not.toThrow()
    })

    it('should reject invalid strategy data', () => {
      const invalidCommand = new Command(COMMAND_TYPES.CREATE_STRATEGY, 'user123', {
        strategyName: '',
        amount: -100,
        riskLevel: 'Invalid'
      })

      expect(() => handler.validate(invalidCommand)).toThrow()
    })

    it('should validate risk levels', () => {
      const invalidRiskCommand = new Command(COMMAND_TYPES.CREATE_STRATEGY, 'user123', {
        strategyName: 'Test Strategy',
        amount: 1000,
        riskLevel: 'Invalid Risk Level'
      })

      expect(() => handler.validate(invalidRiskCommand)).toThrow('Invalid risk level')
    })

    it('should execute strategy creation successfully', async () => {
      const command = new Command(COMMAND_TYPES.CREATE_STRATEGY, 'user123', {
        strategyName: 'Conservative Growth',
        amount: 1000,
        riskLevel: 'Conservative'
      })

      const result = await handler.execute(command)

      expect(result.success).toBe(true)
      expect(result.strategyId).toMatch(/^strategy_/)
      expect(result.eventId).toBe('evt_123')
    })
  })

  describe('Command Execution', () => {
    it('should execute commands successfully', async () => {
      const command = new Command(COMMAND_TYPES.CREATE_TRANSACTION, 'user123', {
        type: 'buy',
        amount: 100,
        asset: 'BTC',
        userId: 'user123'
      })

      const result = await commandBus.execute(command)

      expect(result.success).toBe(true)
      expect(commandBus.commandHistory).toHaveLength(1)
      expect(commandBus.commandHistory[0].success).toBe(true)
    })

    it('should handle unknown command types', async () => {
      const unknownCommand = new Command('unknown_command', 'user123', {})

      await expect(commandBus.execute(unknownCommand))
        .rejects.toThrow('No handler registered for command type: unknown_command')
    })

    it('should handle validation errors', async () => {
      const invalidCommand = new Command(COMMAND_TYPES.CREATE_TRANSACTION, 'user123', {
        type: 'buy',
        amount: -100, // Invalid
        asset: 'BTC',
        userId: 'user123'
      })

      await expect(commandBus.execute(invalidCommand))
        .rejects.toThrow('Invalid transaction data')

      expect(commandBus.commandHistory).toHaveLength(1)
      expect(commandBus.commandHistory[0].success).toBe(false)
    })

    it('should apply middleware in order', async () => {
      const middleware1 = vi.fn(async (command) => {
        command.middleware1Applied = true
        return command
      })
      const middleware2 = vi.fn(async (command) => {
        command.middleware2Applied = true
        return command
      })

      commandBus.use(middleware1)
      commandBus.use(middleware2)

      const command = new Command(COMMAND_TYPES.CREATE_TRANSACTION, 'user123', {
        type: 'buy',
        amount: 100,
        asset: 'BTC',
        userId: 'user123'
      })

      await commandBus.execute(command)

      expect(middleware1).toHaveBeenCalledBefore(middleware2)
      expect(command.middleware1Applied).toBe(true)
      expect(command.middleware2Applied).toBe(true)
    })
  })

  describe('Command History and Statistics', () => {
    it('should track command execution history', async () => {
      const command1 = new Command(COMMAND_TYPES.CREATE_TRANSACTION, 'user123', {
        type: 'buy', amount: 100, asset: 'BTC', userId: 'user123'
      })
      const command2 = new Command(COMMAND_TYPES.UPDATE_BALANCE, 'user123', {
        balance: { totalUSD: 1000 }
      })

      await commandBus.execute(command1)
      await commandBus.execute(command2)

      const history = commandBus.getHistory()
      expect(history).toHaveLength(2)
      expect(history[0].command.type).toBe(COMMAND_TYPES.CREATE_TRANSACTION)
      expect(history[1].command.type).toBe(COMMAND_TYPES.UPDATE_BALANCE)
    })

    it('should provide comprehensive statistics', async () => {
      // Execute some commands
      await commandBus.execute(new Command(COMMAND_TYPES.CREATE_TRANSACTION, 'user123', {
        type: 'buy', amount: 100, asset: 'BTC', userId: 'user123'
      }))
      await commandBus.execute(new Command(COMMAND_TYPES.UPDATE_BALANCE, 'user123', {
        balance: { totalUSD: 1000 }
      }))

      // Try to execute an invalid command
      try {
        await commandBus.execute(new Command(COMMAND_TYPES.CREATE_TRANSACTION, 'user123', {
          type: 'buy', amount: -100, asset: 'BTC', userId: 'user123'
        }))
      } catch (error) {
        // Expected to fail
      }

      const stats = commandBus.getStatistics()

      expect(stats.totalCommands).toBe(3)
      expect(stats.registeredHandlers).toBe(3)
      expect(stats.activeMiddleware).toBe(0)
      expect(stats.typeStatistics[COMMAND_TYPES.CREATE_TRANSACTION].total).toBe(2)
      expect(stats.typeStatistics[COMMAND_TYPES.CREATE_TRANSACTION].success).toBe(1)
      expect(stats.typeStatistics[COMMAND_TYPES.CREATE_TRANSACTION].failed).toBe(1)
      expect(stats.typeStatistics[COMMAND_TYPES.UPDATE_BALANCE].total).toBe(1)
      expect(stats.typeStatistics[COMMAND_TYPES.UPDATE_BALANCE].success).toBe(1)
    })

    it('should limit history size', async () => {
      const originalLimit = 100 // Default limit in implementation

      // Execute more commands than the limit
      for (let i = 0; i < originalLimit + 10; i++) {
        await commandBus.execute(new Command(COMMAND_TYPES.UPDATE_BALANCE, 'user123', {
          balance: { totalUSD: 1000 + i }
        }))
      }

      const history = commandBus.getHistory()
      expect(history.length).toBeLessThanOrEqual(originalLimit)
    })
  })

  describe('Reset and Cleanup', () => {
    it('should reset command bus state', async () => {
      await commandBus.execute(new Command(COMMAND_TYPES.CREATE_TRANSACTION, 'user123', {
        type: 'buy', amount: 100, asset: 'BTC', userId: 'user123'
      }))

      expect(commandBus.commandHistory.length).toBeGreaterThan(0)

      commandBus.reset()

      expect(commandBus.commandHistory).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle handler execution errors gracefully', async () => {
      // Create a handler that throws an error
      class FailingHandler extends CommandHandler {
        constructor() {
          super('failing_command')
        }
        validate() { return true }
        async execute() {
          throw new Error('Handler execution failed')
        }
      }

      commandBus.register(new FailingHandler())

      const command = new Command('failing_command', 'user123', {})

      await expect(commandBus.execute(command))
        .rejects.toThrow('Handler execution failed')

      // Should still track the failed command
      expect(commandBus.commandHistory).toHaveLength(1)
      expect(commandBus.commandHistory[0].success).toBe(false)
      expect(commandBus.commandHistory[0].error).toBe('Handler execution failed')
    })
  })
})