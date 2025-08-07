/**
 * Repository Pattern Tests
 * Tests for enhanced repository implementations and aggregates
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventSourcedRepository, InMemoryRepository, UnitOfWork } from '../shared/Repository.js'
import { AggregateRoot } from '../shared/AggregateRoot.js'
import { ValueObject, Money, Email, Username } from '../shared/ValueObject.js'
import { User } from '../account/models/User.js'
import { Account } from '../account/models/Account.js'
import { Balance } from '../balance/models/Balance.js'
import { Transaction } from '../transaction/models/Transaction.js'
import { EventSourcedUserRepository, InMemoryUserRepository } from '../account/repositories/UserRepository.js'
import { EventSourcedBalanceRepository, InMemoryBalanceRepository } from '../balance/repositories/BalanceRepository.js'
import { EventSourcedTransactionRepository, InMemoryTransactionRepository } from '../transaction/repositories/TransactionRepository.js'

// Mock event store
vi.mock('../../events/EventStore.js', () => ({
  eventStore: {
    appendEvent: vi.fn(),
    getEvents: vi.fn().mockReturnValue([]),
    subscribe: vi.fn(),
    getProjectionData: vi.fn().mockReturnValue(null)
  }
}))

describe('Enhanced Repository Pattern', () => {
  describe('AggregateRoot Base Class', () => {
    let mockAggregate

    beforeEach(() => {
      class MockAggregate extends AggregateRoot {
        constructor(id = 'test-id') {
          super()
          this.id = id
          this.name = 'Test'
        }

        validate() {
          return this.id && this.name
        }

        createSnapshot() {
          return { id: this.id, name: this.name, version: this.getVersion() }
        }

        loadFromSnapshot(snapshot) {
          this.id = snapshot.id
          this.name = snapshot.name
          this._version = snapshot.version || 0
        }
      }

      mockAggregate = new MockAggregate()
    })

    it('should initialize with correct default state', () => {
      expect(mockAggregate.getVersion()).toBe(0)
      expect(mockAggregate.getUncommittedEvents()).toEqual([])
      expect(mockAggregate.canModify()).toBe(true)
      expect(mockAggregate.isDeleted()).toBe(false)
    })

    it('should add domain events correctly', () => {
      mockAggregate.addDomainEvent({
        type: 'TestEvent',
        data: { test: true }
      })

      const events = mockAggregate.getUncommittedEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('TestEvent')
      expect(events[0].aggregateId).toBe('test-id')
      expect(events[0].aggregateType).toBe('MockAggregate')
      expect(events[0].timestamp).toBeDefined()
      expect(events[0].version).toBe(1)
    })

    it('should clear events correctly', () => {
      mockAggregate.addDomainEvent({ type: 'TestEvent' })
      expect(mockAggregate.getUncommittedEvents()).toHaveLength(1)

      mockAggregate.clearEvents()
      expect(mockAggregate.getUncommittedEvents()).toEqual([])
    })

    it('should handle soft deletion', () => {
      expect(mockAggregate.canModify()).toBe(true)
      expect(mockAggregate.isDeleted()).toBe(false)

      mockAggregate.markAsDeleted()

      expect(mockAggregate.canModify()).toBe(false)
      expect(mockAggregate.isDeleted()).toBe(true)
    })

    it('should create and load snapshots', () => {
      mockAggregate.addDomainEvent({ type: 'TestEvent' })
      const snapshot = mockAggregate.createSnapshot()

      expect(snapshot.id).toBe('test-id')
      expect(snapshot.name).toBe('Test')
      expect(snapshot.version).toBe(mockAggregate.getVersion())

      const newAggregate = new (mockAggregate.constructor)()
      newAggregate.loadFromSnapshot(snapshot)

      expect(newAggregate.id).toBe('test-id')
      expect(newAggregate.name).toBe('Test')
      expect(newAggregate.getVersion()).toBe(mockAggregate.getVersion())
    })
  })

  describe('Value Objects', () => {
    describe('Money Value Object', () => {
      it('should create money with correct properties', () => {
        const money = new Money(100, 'USD')
        expect(money.amount).toBe(100)
        expect(money.currency).toBe('USD')
      })

      it('should add money of same currency', () => {
        const money1 = new Money(100, 'USD')
        const money2 = new Money(50, 'USD')
        const result = money1.add(money2)

        expect(result.amount).toBe(150)
        expect(result.currency).toBe('USD')
      })

      it('should not add money of different currencies', () => {
        const money1 = new Money(100, 'USD')
        const money2 = new Money(50, 'EUR')

        expect(() => money1.add(money2)).toThrow('Cannot add different currencies')
      })

      it('should subtract money correctly', () => {
        const money1 = new Money(100, 'USD')
        const money2 = new Money(30, 'USD')
        const result = money1.subtract(money2)

        expect(result.amount).toBe(70)
        expect(result.currency).toBe('USD')
      })

      it('should not allow negative results', () => {
        const money1 = new Money(50, 'USD')
        const money2 = new Money(100, 'USD')

        expect(() => money1.subtract(money2)).toThrow('Cannot have negative money')
      })

      it('should format currency correctly', () => {
        const money = new Money(1234.56, 'USD')
        const formatted = money.format()

        expect(formatted).toBe('$1,234.56')
      })
    })

    describe('Email Value Object', () => {
      it('should create valid email', () => {
        const email = new Email('test@example.com')
        expect(email.value).toBe('test@example.com')
        expect(email.getDomain()).toBe('example.com')
        expect(email.getLocal()).toBe('test')
      })

      it('should normalize email to lowercase', () => {
        const email = new Email('TEST@EXAMPLE.COM')
        expect(email.value).toBe('test@example.com')
      })

      it('should reject invalid email format', () => {
        expect(() => new Email('invalid-email')).toThrow('Invalid email format')
        expect(() => new Email('test@')).toThrow('Invalid email format')
        expect(() => new Email('@example.com')).toThrow('Invalid email format')
      })
    })

    describe('Username Value Object', () => {
      it('should create valid username', () => {
        const username = new Username('@testuser')
        expect(username.value).toBe('@testuser')
        expect(username.getHandle()).toBe('testuser')
      })

      it('should reject invalid username format', () => {
        expect(() => new Username('testuser')).toThrow('Invalid username format')
        expect(() => new Username('@te')).toThrow('Invalid username format')
        expect(() => new Username('@test-user')).toThrow('Invalid username format')
        expect(() => new Username('@verylongusernamethatistoolong')).toThrow('Invalid username format')
      })
    })
  })

  describe('Enhanced Domain Models', () => {
    describe('User Aggregate', () => {
      let user

      beforeEach(() => {
        user = new User({
          username: '@testuser',
          email: 'test@example.com'
        })
      })

      it('should extend AggregateRoot correctly', () => {
        expect(user).toBeInstanceOf(AggregateRoot)
        expect(user.getVersion()).toBe(0)
        expect(user.validate()).toBe(true)
      })

      it('should validate username and email', () => {
        expect(user.validate()).toBe(true)

        const invalidUser = new User({})
        expect(invalidUser.validate()).toBe(false)
      })

      it('should create and load snapshots', () => {
        user.updateProfile({ firstName: 'John', lastName: 'Doe' })
        const snapshot = user.createSnapshot()

        const newUser = new User()
        newUser.loadFromSnapshot(snapshot)

        expect(newUser.id).toBe(user.id)
        expect(newUser.username).toBe('@testuser')
        expect(newUser.email).toBe('test@example.com')
        expect(newUser.profile.firstName).toBe('John')
      })
    })

    describe('Balance Aggregate', () => {
      let balance

      beforeEach(() => {
        balance = new Balance({
          accountId: 'account-123',
          totalUSD: 1000,
          availableForSpending: 800
        })
      })

      it('should extend AggregateRoot correctly', () => {
        expect(balance).toBeInstanceOf(AggregateRoot)
        expect(balance.validate()).toBe(true)
      })

      it('should handle credit operations', () => {
        balance.credit(200, 'USDC')
        
        const events = balance.getUncommittedEvents()
        expect(events).toHaveLength(2) // AssetBalanceUpdated + BalanceCredited
        expect(events[1].type).toBe('BalanceCredited')
        expect(events[1].data.amount).toBe(200)
      })

      it('should handle debit operations', () => {
        // First add some USDC balance
        balance.credit(500, 'USDC')
        balance.clearEvents() // Clear setup events

        balance.debit(100, 'USDC')
        
        const events = balance.getUncommittedEvents()
        expect(events).toHaveLength(2) // AssetBalanceUpdated + BalanceDebited
        expect(events[1].type).toBe('BalanceDebited')
        expect(events[1].data.amount).toBe(100)
      })

      it('should create snapshots correctly', () => {
        const snapshot = balance.createSnapshot()

        expect(snapshot.id).toBe(balance.id)
        expect(snapshot.accountId).toBe('account-123')
        expect(snapshot.totalUSD).toBe(1000)
        expect(snapshot.availableForSpending).toBe(800)
      })
    })

    describe('Transaction Aggregate', () => {
      let transaction

      beforeEach(() => {
        transaction = new Transaction({
          accountId: 'account-123',
          type: 'add',
          amount: 100,
          asset: 'USDC'
        })
      })

      it('should extend AggregateRoot correctly', () => {
        expect(transaction).toBeInstanceOf(AggregateRoot)
        expect(transaction.validate()).toBe(true)
      })

      it('should use Money value object for amount', () => {
        expect(transaction.amount).toBeInstanceOf(Money)
        expect(transaction.amount.amount).toBe(100)
        expect(transaction.amount.currency).toBe('USDC')
      })

      it('should handle status transitions', () => {
        transaction.startProcessing()
        expect(transaction.status).toBe('processing')

        transaction.complete({ hash: 'tx-hash' })
        expect(transaction.status).toBe('completed')

        const events = transaction.getUncommittedEvents()
        expect(events).toHaveLength(2)
        expect(events[0].type).toBe('TransactionProcessingStarted')
        expect(events[1].type).toBe('TransactionCompleted')
      })

      it('should calculate net amounts correctly', () => {
        transaction.updateFees({ diBoaS: 5, network: 2 })
        transaction.direction = 'incoming'

        const netAmount = transaction.getNetAmount()
        expect(netAmount).toBeInstanceOf(Money)
        expect(netAmount.amount).toBe(93) // 100 - 7 fees
      })
    })
  })

  describe('Repository Implementations', () => {
    describe('InMemoryUserRepository', () => {
      let repository
      let user

      beforeEach(() => {
        repository = new InMemoryUserRepository()
        user = new User({
          username: '@testuser',
          email: 'test@example.com'
        })
      })

      it('should extend InMemoryRepository', () => {
        expect(repository).toBeInstanceOf(InMemoryRepository)
      })

      it('should save and find users', async () => {
        await repository.save(user)

        const foundUser = await repository.findById(user.id)
        expect(foundUser).toBe(user)
        expect(foundUser.username).toBe('@testuser')
      })

      it('should find users by email', async () => {
        await repository.save(user)

        const foundUser = await repository.findByEmail('test@example.com')
        expect(foundUser).toBe(user)

        const notFound = await repository.findByEmail('notfound@example.com')
        expect(notFound).toBeNull()
      })

      it('should find users by username', async () => {
        await repository.save(user)

        const foundUser = await repository.findByUsername('@testuser')
        expect(foundUser).toBe(user)

        const notFound = await repository.findByUsername('@notfound')
        expect(notFound).toBeNull()
      })
    })

    describe('InMemoryBalanceRepository', () => {
      let repository
      let balance

      beforeEach(() => {
        repository = new InMemoryBalanceRepository()
        balance = new Balance({
          accountId: 'account-123',
          totalUSD: 1000
        })
      })

      it('should save and find balances', async () => {
        await repository.save(balance)

        const foundBalance = await repository.findById(balance.id)
        expect(foundBalance).toBe(balance)
      })

      it('should find balances by account ID', async () => {
        await repository.save(balance)

        const foundBalance = await repository.findByAccountId('account-123')
        expect(foundBalance).toBe(balance)

        const notFound = await repository.findByAccountId('account-999')
        expect(notFound).toBeNull()
      })
    })

    describe('InMemoryTransactionRepository', () => {
      let repository
      let transaction

      beforeEach(() => {
        repository = new InMemoryTransactionRepository()
        transaction = new Transaction({
          accountId: 'account-123',
          type: 'add',
          amount: 100,
          asset: 'USDC'
        })
      })

      it('should save and find transactions', async () => {
        await repository.save(transaction)

        const foundTransaction = await repository.findById(transaction.id)
        expect(foundTransaction).toBe(transaction)
      })

      it('should find transactions by account ID', async () => {
        await repository.save(transaction)

        const transactions = await repository.findByAccountId('account-123')
        expect(transactions).toHaveLength(1)
        expect(transactions[0]).toBe(transaction)
      })

      it('should find transactions by status', async () => {
        await repository.save(transaction)

        const transactions = await repository.findByStatus('pending')
        expect(transactions).toHaveLength(1)
        expect(transactions[0]).toBe(transaction)
      })
    })
  })

  describe('Unit of Work Pattern', () => {
    let unitOfWork
    let userRepository
    let user

    beforeEach(() => {
      unitOfWork = new UnitOfWork()
      userRepository = new InMemoryUserRepository()
      unitOfWork.registerRepository('User', userRepository)
      
      user = new User({
        username: '@testuser',
        email: 'test@example.com'
      })
    })

    it('should register and commit new aggregates', async () => {
      unitOfWork.registerNew(user)
      await unitOfWork.commit()

      const foundUser = await userRepository.findById(user.id)
      expect(foundUser).toBe(user)
    })

    it('should register and commit dirty aggregates', async () => {
      await userRepository.save(user)
      
      user.updateProfile({ firstName: 'John' })
      unitOfWork.registerDirty(user)
      await unitOfWork.commit()

      const foundUser = await userRepository.findById(user.id)
      expect(foundUser.profile.firstName).toBe('John')
    })

    it('should handle registration conflicts', () => {
      unitOfWork.registerNew(user)
      
      expect(() => unitOfWork.registerDirty(user))
        .toThrow('Aggregate already registered as new')
    })

    it('should clear tracking after commit', async () => {
      unitOfWork.registerNew(user)
      await unitOfWork.commit()

      expect(unitOfWork.newAggregates.size).toBe(0)
      expect(unitOfWork.dirtyAggregates.size).toBe(0)
      expect(unitOfWork.removedAggregates.size).toBe(0)
    })
  })
})