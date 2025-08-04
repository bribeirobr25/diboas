import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  User, 
  Account, 
  AccountService, 
  InMemoryUserRepository, 
  InMemoryAccountRepository,
  UserStatus,
  KYCStatus,
  AccountType,
  AccountStatus
} from '../account/index.js'

// Mock external dependencies
vi.mock('../../events/EventStore.js', () => ({
  eventStore: {
    appendEvent: vi.fn().mockResolvedValue({ id: 'evt_123' })
  }
}))

vi.mock('../../cqrs/CommandBus.js', () => ({
  commandBus: {
    execute: vi.fn().mockResolvedValue({ success: true })
  }
}))

vi.mock('../../security/SecurityManager.js', () => ({
  securityManager: {
    logSecurityEvent: vi.fn()
  }
}))

describe('Account Domain', () => {
  let userRepository
  let accountRepository
  let accountService

  beforeEach(() => {
    userRepository = new InMemoryUserRepository()
    accountRepository = new InMemoryAccountRepository()
    accountService = new AccountService(userRepository, accountRepository)
  })

  describe('User Entity', () => {
    it('should create user with default values', () => {
      const user = new User({
        username: '@testuser',
        email: 'test@example.com'
      })

      expect(user.id).toMatch(/^user_/)
      expect(user.username).toBe('@testuser')
      expect(user.email).toBe('test@example.com')
      expect(user.status).toBe(UserStatus.ACTIVE)
      expect(user.security.kycStatus).toBe(KYCStatus.NOT_STARTED)
      expect(user.createdAt).toBeDefined()
    })

    it('should update user profile', () => {
      const user = new User({ username: '@testuser' })
      
      user.updateProfile({
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890'
      })

      expect(user.profile.firstName).toBe('John')
      expect(user.profile.lastName).toBe('Doe')
      expect(user.profile.phone).toBe('+1234567890')
      expect(user.profile.fullName).toBe('John Doe')
    })

    it('should enable and disable two-factor authentication', () => {
      const user = new User({ username: '@testuser' })
      
      user.enableTwoFactor('secret123')
      expect(user.security.twoFactorEnabled).toBe(true)
      expect(user.security.twoFactorSecret).toBe('secret123')
      
      user.disableTwoFactor()
      expect(user.security.twoFactorEnabled).toBe(false)
      expect(user.security.twoFactorSecret).toBeNull()
    })

    it('should check financial operation permissions', () => {
      const user = new User({
        username: '@testuser',
        status: UserStatus.ACTIVE
      })
      
      // Should not allow without KYC
      expect(user.canPerformFinancialOperations()).toBe(false)
      
      // Should allow with KYC verified
      user.security.kycStatus = KYCStatus.VERIFIED
      expect(user.canPerformFinancialOperations()).toBe(true)
    })
  })

  describe('Account Entity', () => {
    it('should create account with default values', () => {
      const account = new Account({
        userId: 'user123'
      })

      expect(account.id).toMatch(/^account_/)
      expect(account.userId).toBe('user123')
      expect(account.type).toBe(AccountType.PERSONAL)
      expect(account.status).toBe(AccountStatus.ACTIVE)
      expect(account.wallets).toHaveLength(0)
    })

    it('should add and remove wallets', () => {
      const account = new Account({ userId: 'user123' })
      
      const wallet = account.addWallet({
        chain: 'SOL',
        address: '11111111111111111111111111111111',
        type: 'internal'
      })

      expect(account.wallets).toHaveLength(1)
      expect(wallet.chain).toBe('SOL')
      expect(wallet.address).toBe('11111111111111111111111111111111')
      
      // Should not be able to remove wallet with balance
      wallet.balance = 100
      expect(() => account.removeWallet(wallet.id)).toThrow('Cannot remove wallet with positive balance')
      
      // Should be able to remove wallet with zero balance
      wallet.balance = 0
      account.removeWallet(wallet.id)
      expect(account.wallets).toHaveLength(0)
    })

    it('should validate transaction limits', () => {
      const account = new Account({ userId: 'user123' })
      
      // Should allow within limits
      const result1 = account.canPerformTransaction(1000, 'add')
      expect(result1.allowed).toBe(true)
      
      // Should reject over limits
      const result2 = account.canPerformTransaction(10000, 'add')
      expect(result2.allowed).toBe(false)
      expect(result2.reason).toBe('Exceeds daily limit')
    })
  })

  describe('User Repository', () => {
    it('should save and find users', async () => {
      const user = new User({
        username: '@testuser',
        email: 'test@example.com'
      })

      await userRepository.save(user)
      
      const foundById = await userRepository.findById(user.id)
      expect(foundById).toEqual(user)
      
      const foundByUsername = await userRepository.findByUsername('@testuser')
      expect(foundByUsername).toEqual(user)
      
      const foundByEmail = await userRepository.findByEmail('test@example.com')
      expect(foundByEmail).toEqual(user)
    })

    it('should check username and email existence', async () => {
      const user = new User({
        username: '@testuser',
        email: 'test@example.com'
      })

      await userRepository.save(user)
      
      expect(await userRepository.usernameExists('@testuser')).toBe(true)
      expect(await userRepository.usernameExists('@other')).toBe(false)
      
      expect(await userRepository.emailExists('test@example.com')).toBe(true)
      expect(await userRepository.emailExists('other@example.com')).toBe(false)
    })

    it('should find users by criteria', async () => {
      const user1 = new User({ username: '@user1', status: UserStatus.ACTIVE })
      const user2 = new User({ username: '@user2', status: UserStatus.SUSPENDED })
      
      await userRepository.save(user1)
      await userRepository.save(user2)
      
      const activeUsers = await userRepository.findByCriteria({ status: UserStatus.ACTIVE })
      expect(activeUsers).toHaveLength(1)
      expect(activeUsers[0].username).toBe('@user1')
    })
  })

  describe('Account Repository', () => {
    it('should save and find accounts', async () => {
      const account = new Account({ userId: 'user123' })
      
      await accountRepository.save(account)
      
      const foundById = await accountRepository.findById(account.id)
      expect(foundById).toEqual(account)
      
      const foundByUserId = await accountRepository.findByUserId('user123')
      expect(foundByUserId).toEqual(account)
    })

    it('should find account by wallet address', async () => {
      const account = new Account({ userId: 'user123' })
      account.addWallet({
        chain: 'SOL',
        address: 'test_address_123'
      })
      
      await accountRepository.save(account)
      
      const foundAccount = await accountRepository.findByWalletAddress('test_address_123')
      expect(foundAccount).toEqual(account)
    })
  })

  describe('Account Service', () => {
    it('should create user account', async () => {
      const userData = {
        username: '@testuser',
        email: 'test@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      }

      const { user, account } = await accountService.createUserAccount(userData)
      
      expect(user.username).toBe('@testuser')
      expect(user.email).toBe('test@example.com')
      expect(user.status).toBe(UserStatus.PENDING_VERIFICATION)
      
      expect(account.userId).toBe(user.id)
      expect(account.type).toBe(AccountType.PERSONAL)
      expect(account.wallets).toHaveLength(1)
      expect(account.wallets[0].chain).toBe('SOL')
    })

    it('should reject duplicate username or email', async () => {
      const userData1 = {
        username: '@testuser',
        email: 'test1@example.com'
      }
      
      const userData2 = {
        username: '@testuser',
        email: 'test2@example.com'
      }

      await accountService.createUserAccount(userData1)
      
      await expect(accountService.createUserAccount(userData2))
        .rejects.toThrow('Username already exists')
    })

    it('should complete KYC verification', async () => {
      const { user, account } = await accountService.createUserAccount({
        username: '@testuser',
        email: 'test@example.com'
      })

      const result = await accountService.completeKYC(user.id, {
        status: KYCStatus.VERIFIED
      })

      expect(result.user.security.kycStatus).toBe(KYCStatus.VERIFIED)
      expect(result.user.security.kycCompletedAt).toBeDefined()
      expect(result.account.limits.daily.add).toBe(25000) // Increased limits
    })

    it('should add wallet to account', async () => {
      const { user } = await accountService.createUserAccount({
        username: '@testuser',
        email: 'test@example.com'
      })

      const wallet = await accountService.addWallet(user.id, {
        chain: 'ETH',
        address: '0x1234567890123456789012345678901234567890'
      })

      expect(wallet.chain).toBe('ETH')
      expect(wallet.address).toBe('0x1234567890123456789012345678901234567890')
      
      const updatedAccount = await accountRepository.findByUserId(user.id)
      expect(updatedAccount.wallets).toHaveLength(2) // SOL + ETH
    })

    it('should suspend account', async () => {
      const { user } = await accountService.createUserAccount({
        username: '@testuser',
        email: 'test@example.com'
      })

      const result = await accountService.suspendAccount(user.id, 'Suspicious activity')

      expect(result.user.status).toBe(UserStatus.SUSPENDED)
      expect(result.user.security.suspensionReason).toBe('Suspicious activity')
      expect(result.account.status).toBe(AccountStatus.SUSPENDED)
    })
  })
})