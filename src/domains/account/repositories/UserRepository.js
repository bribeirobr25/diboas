/**
 * User Repository Implementation
 * Handles persistence and retrieval of User aggregates
 */

import { EventSourcedRepository, InMemoryRepository } from '../../shared/Repository.js'
import { User } from '../models/User.js'

/**
 * Event Sourced User Repository
 */
export class EventSourcedUserRepository extends EventSourcedRepository {
  constructor() {
    super(User)
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    const allUsers = await this.findAll()
    return allUsers.find(user => user.email === email) || null
  }

  /**
   * Find user by username
   */
  async findByUsername(username) {
    const allUsers = await this.findAll()
    return allUsers.find(user => user.username === username) || null
  }

  async findAll() {
    const allIds = Array.from(this.snapshots.keys())
    const users = []
    
    for (const id of allIds) {
      const user = await this.findById(id)
      if (user && !user.isDeleted()) {
        users.push(user)
      }
    }
    
    return users
  }
}

/**
 * User Repository Interface (for legacy compatibility)
 */
export class UserRepository {
  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    throw new Error('Method not implemented')
  }

  /**
   * Find user by username
   * @param {string} username - User username
   * @returns {Promise<User|null>}
   */
  async findByUsername(username) {
    throw new Error('Method not implemented')
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    throw new Error('Method not implemented')
  }

  /**
   * Find users by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<User[]>}
   */
  async findByCriteria(criteria) {
    throw new Error('Method not implemented')
  }

  /**
   * Save user
   * @param {User} user - User entity
   * @returns {Promise<User>}
   */
  async save(user) {
    throw new Error('Method not implemented')
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method not implemented')
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @returns {Promise<boolean>}
   */
  async usernameExists(username) {
    throw new Error('Method not implemented')
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>}
   */
  async emailExists(email) {
    throw new Error('Method not implemented')
  }

  /**
   * Get user count
   * @returns {Promise<number>}
   */
  async count() {
    throw new Error('Method not implemented')
  }
}

/**
 * Enhanced In-Memory User Repository Implementation
 * Extends base InMemoryRepository with user-specific functionality
 */
export class InMemoryUserRepository extends InMemoryRepository {
  constructor() {
    super()
    this.users = new Map()
    this.usernameIndex = new Map()
    this.emailIndex = new Map()
  }

  async findById(id) {
    return this.users.get(id) || null
  }

  async findByUsername(username) {
    const id = this.usernameIndex.get(username)
    return id ? this.users.get(id) : null
  }

  async findByEmail(email) {
    const id = this.emailIndex.get(email)
    return id ? this.users.get(id) : null
  }

  async findByCriteria(criteria) {
    const users = Array.from(this.users.values())
    
    return users.filter(user => {
      if (criteria.status && user.status !== criteria.status) return false
      if (criteria.kycStatus && user.security.kycStatus !== criteria.kycStatus) return false
      if (criteria.createdAfter && new Date(user.createdAt) < new Date(criteria.createdAfter)) return false
      if (criteria.createdBefore && new Date(user.createdAt) > new Date(criteria.createdBefore)) return false
      return true
    })
  }

  async save(user) {
    // Update indexes
    if (user.username) {
      this.usernameIndex.set(user.username, user.id)
    }
    if (user.email) {
      this.emailIndex.set(user.email, user.id)
    }
    
    this.users.set(user.id, user)
    return user
  }

  async delete(id) {
    const user = this.users.get(id)
    if (!user) return false
    
    // Remove from indexes
    if (user.username) {
      this.usernameIndex.delete(user.username)
    }
    if (user.email) {
      this.emailIndex.delete(user.email)
    }
    
    return this.users.delete(id)
  }

  async usernameExists(username) {
    return this.usernameIndex.has(username)
  }

  async emailExists(email) {
    return this.emailIndex.has(email)
  }

  async count() {
    return this.users.size
  }

  // Helper method for testing
  clear() {
    this.users.clear()
    this.usernameIndex.clear()
    this.emailIndex.clear()
  }
}