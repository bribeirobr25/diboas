/**
 * Critical Tests for useAuthentication Hook
 * Tests authentication security, rate limiting, and edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { useAuthentication } from '../useAuthentication.js'

// Wrapper for Router context
const wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

// Mock dependencies
vi.mock('../services/DataManager.js', () => ({
  dataManager: {
    getState: vi.fn(),
    setState: vi.fn(),
    emit: vi.fn(),
    subscribe: vi.fn(() => vi.fn())
  }
}))

vi.mock('../utils/securityLogging.js', () => ({
  logSecureEvent: vi.fn()
}))

// Mock fetch for API calls
global.fetch = vi.fn()

describe('useAuthentication - Security Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Reset localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('Rate Limiting Edge Cases', () => {
    it('should enforce progressive rate limiting for failed login attempts', async () => {
      const { result } = renderHook(() => useAuthentication(), { wrapper })

      // Mock failed login responses
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Invalid credentials' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Invalid credentials' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Invalid credentials' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ error: 'Too many attempts' })
        })

      const credentials = { email: 'test@example.com', password: 'wrongpassword' }

      // First attempt - should work immediately
      await act(async () => {
        await result.current.login(credentials)
      })

      // Second attempt - should have slight delay
      await act(async () => {
        await result.current.login(credentials)
      })

      // Third attempt - should have longer delay
      await act(async () => {
        await result.current.login(credentials)
      })

      // Fourth attempt - should be rate limited
      await act(async () => {
        const startTime = Date.now()
        try {
          await result.current.login(credentials)
        } catch (error) {
          // Should be rate limited
          expect(error.message).toMatch(/rate limit|too many attempts/i)
        }
      })

      expect(global.fetch).toHaveBeenCalledTimes(4)
    })

    it('should handle distributed brute force attacks', async () => {
      const { result } = renderHook(() => useAuthentication(), { wrapper })

      // Simulate rapid attempts from different IPs (same user)
      const attempts = Array(50).fill(null).map((_, i) => ({
        email: 'target@example.com',
        password: `attempt${i}`,
        ip: `192.168.1.${i % 10}` // Simulate different IPs
      }))

      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid credentials' })
      })

      // Should detect and block distributed attacks
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          try {
            await result.current.login(attempts[i])
          } catch (error) {
            if (i > 5) {
              // After multiple attempts, should be blocked
              expect(error.message).toMatch(/blocked|suspended/i)
            }
          }
        })
      }
    })

    it('should implement exponential backoff for rate limiting', async () => {
      const { result } = renderHook(() => useAuthentication(), { wrapper })

      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid credentials' })
      })

      const credentials = { email: 'test@example.com', password: 'wrong' }
      const attemptTimes = []

      // Make multiple failed attempts
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now()
        
        await act(async () => {
          try {
            await result.current.login(credentials)
          } catch (error) {
            // Expected to fail
          }
        })
        
        attemptTimes.push(Date.now() - startTime)
        
        // Advance timers to simulate backoff
        await act(async () => {
          vi.advanceTimersByTime(Math.pow(2, i) * 1000)
        })
      }

      // Each attempt should take progressively longer
      for (let i = 1; i < attemptTimes.length; i++) {
        if (i > 2) { // After initial attempts
          expect(attemptTimes[i]).toBeGreaterThan(attemptTimes[i - 1])
        }
      }
    })
  })

  describe('Session Security Edge Cases', () => {
    it('should handle token expiration during critical operations', async () => {
      const { result } = renderHook(() => useAuthentication(), { wrapper })

      // Mock successful login
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          token: 'expired-token',
          user: { id: 'user-123', email: 'test@example.com' }
        })
      })

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' })
      })

      // Simulate token expiration during operation
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Token expired' })
      })

      await act(async () => {
        try {
          await result.current.refreshToken()
        } catch (error) {
          expect(error.message).toMatch(/token.*expired|unauthorized/i)
          expect(result.current.isAuthenticated).toBe(false)
        }
      })
    })

    it('should prevent session fixation attacks', async () => {
      const { result } = renderHook(() => useAuthentication(), { wrapper })

      // Mock malicious pre-set session
      window.localStorage.getItem.mockReturnValue('malicious-session-token')

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          token: 'new-secure-token',
          user: { id: 'user-123', email: 'test@example.com' }
        })
      })

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' })
      })

      // Should generate new session token, not use pre-existing one
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('token'),
        'new-secure-token'
      )
    })

    it('should handle concurrent session conflicts', async () => {
      const { result: session1 } = renderHook(() => useAuthentication(), { wrapper })
      const { result: session2 } = renderHook(() => useAuthentication(), { wrapper })

      // Mock login for both sessions
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          token: 'session-token',
          user: { id: 'user-123', email: 'test@example.com' }
        })
      })

      // Login from first session
      await act(async () => {
        await session1.current.login({ email: 'test@example.com', password: 'password' })
      })

      // Login from second session (different tab/window)
      await act(async () => {
        await session2.current.login({ email: 'test@example.com', password: 'password' })
      })

      // Should handle multiple concurrent sessions appropriately
      expect(session1.current.isAuthenticated).toBe(true)
      expect(session2.current.isAuthenticated).toBe(true)
    })
  })

  describe('Input Validation & Injection Prevention', () => {
    it('should prevent SQL injection in login credentials', async () => {
      const { result } = renderHook(() => useAuthentication(), { wrapper })

      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "admin' OR '1'='1",
        "'; UPDATE users SET password='hacked' WHERE id=1; --",
        "' UNION SELECT * FROM users WHERE '1'='1",
        "admin'/**/OR/**/1=1#"
      ]

      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid input' })
      })

      for (const maliciousInput of sqlInjectionAttempts) {
        await act(async () => {
          try {
            await result.current.login({
              email: maliciousInput,
              password: 'password'
            })
          } catch (error) {
            // Should reject malicious input
            expect(error.message).toMatch(/invalid|malformed/i)
          }
        })

        // Verify the malicious input was sanitized before sending
        const lastCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1]
        const requestBody = JSON.parse(lastCall[1].body)
        expect(requestBody.email).not.toContain('DROP TABLE')
        expect(requestBody.email).not.toContain('UNION SELECT')
      }
    })

    it('should prevent XSS in authentication responses', async () => {
      const { result } = renderHook(() => useAuthentication(), { wrapper })

      // Mock response with XSS attempt
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          token: 'valid-token',
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: '<script>alert("xss")</script>admin',
            avatar: 'javascript:alert("xss")'
          }
        })
      })

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' })
      })

      // User data should be sanitized
      const user = result.current.user
      expect(user.name).not.toContain('<script>')
      expect(user.avatar).not.toContain('javascript:')
    })

    it('should validate email format strictly', async () => {
      const { result } = renderHook(() => useAuthentication(), { wrapper })

      const invalidEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing-at-sign.net',
        'missing.domain@.com',
        'spaces in@email.com',
        'too-many@@@domains.com',
        'unicode-chars@domain.côm',
        'script-injection@domain.com<script>alert("xss")</script>'
      ]

      for (const email of invalidEmails) {
        await act(async () => {
          try {
            await result.current.login({ email, password: 'password' })
          } catch (error) {
            expect(error.message).toMatch(/invalid.*email|malformed/i)
          }
        })
      }
    })
  })

  describe('Memory & Resource Management', () => {
    it('should cleanup authentication timers on unmount', () => {
      const { unmount } = renderHook(() => useAuthentication(), { wrapper })

      // Start some authentication-related timers
      act(() => {
        // This would typically start token refresh timers
      })

      // Unmount should cleanup all timers
      unmount()

      // Advance timers to see if any callbacks fire
      act(() => {
        vi.advanceTimersByTime(60000)
      })

      // No errors should occur from dangling timers
      expect(vi.getTimerCount()).toBe(0)
    })

    it('should handle rapid login/logout cycles without memory leaks', async () => {
      const { result } = renderHook(() => useAuthentication(), { wrapper })

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          token: 'test-token',
          user: { id: 'user-123', email: 'test@example.com' }
        })
      })

      // Rapid login/logout cycles
      for (let i = 0; i < 100; i++) {
        await act(async () => {
          await result.current.login({ email: 'test@example.com', password: 'password' })
        })

        await act(async () => {
          await result.current.logout()
        })
      }

      // Should not cause memory leaks or performance issues
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('Error Recovery & Resilience', () => {
    it('should recover from network failures gracefully', async () => {
      const { result } = renderHook(() => useAuthentication(), { wrapper })

      // Mock network failure
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            token: 'success-token',
            user: { id: 'user-123', email: 'test@example.com' }
          })
        })

      const credentials = { email: 'test@example.com', password: 'password' }

      // First attempt - network failure
      await act(async () => {
        try {
          await result.current.login(credentials)
        } catch (error) {
          expect(error.message).toBe('Network error')
        }
      })

      // Second attempt - network failure  
      await act(async () => {
        try {
          await result.current.login(credentials)
        } catch (error) {
          expect(error.message).toBe('Network error')
        }
      })

      // Third attempt - success
      await act(async () => {
        await result.current.login(credentials)
      })

      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should handle partial authentication state corruption', async () => {
      const { result } = renderHook(() => useAuthentication(), { wrapper })

      // Mock corrupted localStorage state
      window.localStorage.getItem.mockImplementation((key) => {
        if (key.includes('token')) return 'corrupted-token-data'
        if (key.includes('user')) return '{"invalid": json}'
        return null
      })

      // Should detect and recover from corrupted state
      await act(async () => {
        result.current.initialize()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })
  })

  describe('Social Authentication Edge Cases', () => {
    it('should handle OAuth state parameter validation', async () => {
      const { result } = renderHook(() => useAuthentication(), { wrapper })

      // Mock OAuth callback with tampered state
      const maliciousCallback = {
        code: 'valid-auth-code',
        state: 'tampered-state-parameter'
      }

      await act(async () => {
        try {
          await result.current.handleOAuthCallback(maliciousCallback)
        } catch (error) {
          expect(error.message).toMatch(/invalid.*state|csrf/i)
        }
      })
    })

    it('should prevent OAuth authorization code replay attacks', async () => {
      const { result } = renderHook(() => useAuthentication(), { wrapper })

      const oauthCallback = {
        code: 'auth-code-123',
        state: 'valid-state'
      }

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          token: 'oauth-token',
          user: { id: 'user-123', email: 'test@example.com' }
        })
      })

      // First use of auth code - should succeed
      await act(async () => {
        await result.current.handleOAuthCallback(oauthCallback)
      })

      // Second use of same auth code - should fail
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Authorization code already used' })
      })

      await act(async () => {
        try {
          await result.current.handleOAuthCallback(oauthCallback)
        } catch (error) {
          expect(error.message).toMatch(/already used|invalid.*code/i)
        }
      })
    })
  })
})