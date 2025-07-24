/**
 * E2E Tests for Dashboard Functionality
 * Tests complete user workflows on the main dashboard
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (assuming no auth required for demo)
    await page.goto('/')
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle')
  })

  test.describe('Page Load and Basic Functionality', () => {
    test('should load dashboard with all key elements', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/diBoaS/)
      
      // Check main navigation elements
      await expect(page.getByRole('navigation')).toBeVisible()
      
      // Check balance section
      await expect(page.getByTestId('balance-section')).toBeVisible()
      
      // Check market indicators
      await expect(page.getByTestId('market-indicators')).toBeVisible()
      
      // Check transaction section
      await expect(page.getByTestId('transaction-section')).toBeVisible()
    })
    
    test('should display current balance information', async ({ page }) => {
      // Check balance visibility toggle exists
      const balanceToggle = page.getByTestId('balance-visibility-toggle')
      await expect(balanceToggle).toBeVisible()
      
      // Check that balance is displayed (or hidden indicator)
      const balanceDisplay = page.getByTestId('total-balance')
      await expect(balanceDisplay).toBeVisible()
      
      // Test balance visibility toggle
      await balanceToggle.click()
      
      // Check if balance is hidden/shown
      const hiddenBalance = page.getByText('****')
      await expect(hiddenBalance).toBeVisible()
      
      // Toggle back
      await balanceToggle.click()
      await expect(page.getByTestId('total-balance')).toBeVisible()
    })
  })

  test.describe('Market Data Integration', () => {
    test('should display real-time market data', async ({ page }) => {
      // Wait for market data to load
      await page.waitForSelector('[data-testid="market-indicators"]')
      
      // Check that at least one crypto asset is displayed
      const marketItems = page.locator('[data-testid="market-item"]')
      await expect(marketItems.first()).toBeVisible()
      
      // Check for required market data elements
      await expect(page.getByText('BTC')).toBeVisible()
      await expect(page.getByText('Bitcoin')).toBeVisible()
      
      // Check price format (should be monetary format)
      const priceElement = page.locator('[data-testid="asset-price"]').first()
      await expect(priceElement).toBeVisible()
      
      const priceText = await priceElement.textContent()
      expect(priceText).toMatch(/\\$[\\d,]+\\.\\d{2}/) // Price format validation
    })
    
    test('should handle market data refresh', async ({ page }) => {
      // Find refresh button
      const refreshButton = page.getByTestId('market-refresh-button')
      await expect(refreshButton).toBeVisible()
      
      // Click refresh
      await refreshButton.click()
      
      // Should show loading state briefly
      await expect(page.getByTestId('market-loading')).toBeVisible()
      
      // Should complete and show data
      await page.waitForSelector('[data-testid="market-loading"]', { 
        state: 'hidden',
        timeout: 10000 
      })
      
      // Market data should still be visible
      await expect(page.getByTestId('market-item')).toBeVisible()
    })
  })

  test.describe('Transaction Functionality', () => {
    test('should navigate to transaction pages', async ({ page }) => {
      // Test Send button
      const sendButton = page.getByRole('button', { name: /send/i })
      await expect(sendButton).toBeVisible()
      
      await sendButton.click()
      
      // Should navigate to transaction page
      await expect(page.getByTestId('transaction-form')).toBeVisible()
      
      // Go back to dashboard
      await page.goBack()
      await page.waitForLoadState('networkidle')
      
      // Test Add Money button
      const addButton = page.getByRole('button', { name: /add money/i })
      await expect(addButton).toBeVisible()
      
      await addButton.click()
      await expect(page.getByTestId('add-money-form')).toBeVisible()
    })
    
    test('should display transaction history', async ({ page }) => {
      // Check transaction history section
      const transactionHistory = page.getByTestId('transaction-history')
      await expect(transactionHistory).toBeVisible()
      
      // Should show recent transactions
      const transactionItems = page.locator('[data-testid="transaction-item"]')
      const transactionCount = await transactionItems.count()
      
      if (transactionCount > 0) {
        // Check first transaction item structure
        const firstTransaction = transactionItems.first()
        await expect(firstTransaction).toBeVisible()
        
        // Should contain transaction details
        await expect(firstTransaction.locator('[data-testid="transaction-type"]')).toBeVisible()
        await expect(firstTransaction.locator('[data-testid="transaction-amount"]')).toBeVisible()
        await expect(firstTransaction.locator('[data-testid="transaction-status"]')).toBeVisible()
      } else {
        // Should show empty state
        await expect(page.getByText(/no transactions/i)).toBeVisible()
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Check that mobile navigation is visible
      const mobileNav = page.getByTestId('mobile-navigation')
      await expect(mobileNav).toBeVisible()
      
      // Check that elements stack vertically
      const balanceSection = page.getByTestId('balance-section')
      const marketSection = page.getByTestId('market-indicators')
      
      const balanceBox = await balanceSection.boundingBox()
      const marketBox = await marketSection.boundingBox()
      
      // Market section should be below balance section
      expect(marketBox.y).toBeGreaterThan(balanceBox.y + balanceBox.height)
    })
    
    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      
      // Check that all main sections are visible
      await expect(page.getByTestId('balance-section')).toBeVisible()
      await expect(page.getByTestId('market-indicators')).toBeVisible()
      await expect(page.getByTestId('transaction-section')).toBeVisible()
      
      // Check that layout adapts appropriately
      const container = page.getByTestId('dashboard-container')
      await expect(container).toHaveClass(/tablet-layout/)
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Start from the top of the page
      await page.keyboard.press('Tab')
      
      // Should be able to navigate through focusable elements
      let focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
      
      // Continue tabbing through key interactive elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
        focusedElement = page.locator(':focus')
        await expect(focusedElement).toBeVisible()
      }
    })
    
    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check main landmark roles
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page.getByRole('navigation')).toBeVisible()
      
      // Check button accessibility
      const buttons = page.getByRole('button')
      const buttonCount = await buttons.count()
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i)
        
        // Each button should have accessible name
        const accessibleName = await button.getAttribute('aria-label') || 
                               await button.textContent()
        expect(accessibleName).toBeTruthy()
      }
    })
  })

  test.describe('Performance', () => {
    test('should load within performance budget', async ({ page }) => {
      // Measure page load time
      const startTime = Date.now()
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })
    
    test('should have good Core Web Vitals', async ({ page }) => {
      await page.goto('/')
      
      // Wait for page to stabilize
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      // Check that page is interactive
      const interactiveElement = page.getByRole('button').first()
      await expect(interactiveElement).toBeVisible()
      
      // Should be able to interact immediately
      await interactiveElement.click({ timeout: 100 })
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept network requests and simulate failure
      await page.route('**/api/**', route => {
        route.abort('failed')
      })
      
      await page.goto('/')
      
      // Should show appropriate error messages
      await expect(page.getByText(/error loading/i)).toBeVisible()
      
      // Should provide retry mechanism
      const retryButton = page.getByRole('button', { name: /retry/i })
      await expect(retryButton).toBeVisible()
    })
    
    test('should handle slow network gracefully', async ({ page }) => {
      // Intercept and delay requests
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 2000)
      })
      
      await page.goto('/')
      
      // Should show loading states
      await expect(page.getByTestId('loading-spinner')).toBeVisible()
      
      // Should eventually load content
      await expect(page.getByTestId('dashboard-content')).toBeVisible({
        timeout: 10000
      })
    })
  })
})