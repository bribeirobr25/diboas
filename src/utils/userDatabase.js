/**
 * Mock user database for diBoaS username validation and autocomplete
 * This simulates a real user database with search capabilities
 */

// Mock user database - 15 users for comprehensive testing
export const mockUsers = [
  'john123', 'alice_doe', 'bob_smith', 'charlie', 'diana_jones',
  'erik_van', 'fiona123', 'george_w', 'helen_clark', 'ivan_petrov',
  'julia_roberts', 'kevin_hart', 'lisa_chen', 'mike_tyson', 'nancy_drew'
]

/**
 * Check if a user exists in the diBoaS system
 * @param {string} username - Username without @ symbol
 * @returns {Promise<boolean>} - Whether the user exists
 */
export const checkUserExists = async (username) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Check if username exists (case-insensitive)
  return mockUsers.some(user => user.toLowerCase() === username.toLowerCase())
}

/**
 * Search for usernames matching a given query
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Promise<string[]>} - Array of matching usernames
 */
export const searchUsernames = async (query, limit = 10) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 50))
  
  if (!query) return []
  
  const searchTerm = query.toLowerCase()
  
  // Filter users that match the search term
  return mockUsers
    .filter(user => user.toLowerCase().includes(searchTerm))
    .slice(0, limit)
}

/**
 * Get user profile information (for future enhancement)
 * @param {string} username - Username without @ symbol
 * @returns {Promise<Object|null>} - User profile or null if not found
 */
export const getUserProfile = async (username) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150))
  
  const userExists = await checkUserExists(username)
  if (!userExists) return null
  
  // Mock user profile data
  return {
    username,
    displayName: username.charAt(0).toUpperCase() + username.slice(1),
    isVerified: Math.random() > 0.3, // 70% chance of being verified
    joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
  }
}

/**
 * Local storage utilities for recent usernames
 */
export const RECENT_USERNAMES_KEY = 'diboas_recent_usernames'

export const getRecentUsernames = () => {
  try {
    const stored = localStorage.getItem(RECENT_USERNAMES_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed.slice(0, 3) : []
    }
  } catch (error) {
    console.error('Error loading recent usernames:', error)
  }
  return []
}

export const saveRecentUsername = (username) => {
  if (!username || !username.startsWith('@')) return
  
  const usernameWithoutAt = username.slice(1)
  const current = getRecentUsernames()
  
  // Remove if already exists, then add to front
  const filtered = current.filter(u => u !== usernameWithoutAt)
  const updated = [usernameWithoutAt, ...filtered].slice(0, 3)
  
  try {
    localStorage.setItem(RECENT_USERNAMES_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error saving recent username:', error)
  }
}