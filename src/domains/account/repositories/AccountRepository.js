/**
 * Account Repository Interface
 * Defines the contract for account data access
 */

/**
 * Account Repository Interface
 */
export class AccountRepository {
  /**
   * Find account by ID
   * @param {string} id - Account ID
   * @returns {Promise<Account|null>}
   */
  async findById(id) {
    throw new Error('Method not implemented')
  }

  /**
   * Find account by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Account|null>}
   */
  async findByUserId(userId) {
    throw new Error('Method not implemented')
  }

  /**
   * Find accounts by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Account[]>}
   */
  async findByCriteria(criteria) {
    throw new Error('Method not implemented')
  }

  /**
   * Save account
   * @param {Account} account - Account entity
   * @returns {Promise<Account>}
   */
  async save(account) {
    throw new Error('Method not implemented')
  }

  /**
   * Delete account
   * @param {string} id - Account ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method not implemented')
  }

  /**
   * Find account by wallet address
   * @param {string} address - Wallet address
   * @returns {Promise<Account|null>}
   */
  async findByWalletAddress(address) {
    throw new Error('Method not implemented')
  }

  /**
   * Get account count
   * @returns {Promise<number>}
   */
  async count() {
    throw new Error('Method not implemented')
  }
}

/**
 * In-Memory Account Repository Implementation
 * For testing and mockup purposes
 */
export class InMemoryAccountRepository extends AccountRepository {
  constructor() {
    super()
    this.accounts = new Map()
    this.userIndex = new Map()
    this.walletIndex = new Map()
  }

  async findById(id) {
    return this.accounts.get(id) || null
  }

  async findByUserId(userId) {
    const accountId = this.userIndex.get(userId)
    return accountId ? this.accounts.get(accountId) : null
  }

  async findByCriteria(criteria) {
    const accounts = Array.from(this.accounts.values())
    
    return accounts.filter(account => {
      if (criteria.type && account.type !== criteria.type) return false
      if (criteria.status && account.status !== criteria.status) return false
      if (criteria.hasFeature && !account.features[criteria.hasFeature]) return false
      if (criteria.chain && !account.wallets.some(w => w.chain === criteria.chain)) return false
      return true
    })
  }

  async save(account) {
    // Update indexes
    this.userIndex.set(account.userId, account.id)
    
    // Update wallet index
    account.wallets.forEach(wallet => {
      this.walletIndex.set(wallet.address, account.id)
    })
    
    this.accounts.set(account.id, account)
    return account
  }

  async delete(id) {
    const account = this.accounts.get(id)
    if (!account) return false
    
    // Remove from indexes
    this.userIndex.delete(account.userId)
    account.wallets.forEach(wallet => {
      this.walletIndex.delete(wallet.address)
    })
    
    return this.accounts.delete(id)
  }

  async findByWalletAddress(address) {
    const accountId = this.walletIndex.get(address)
    return accountId ? this.accounts.get(accountId) : null
  }

  async count() {
    return this.accounts.size
  }

  // Helper method for testing
  clear() {
    this.accounts.clear()
    this.userIndex.clear()
    this.walletIndex.clear()
  }
}