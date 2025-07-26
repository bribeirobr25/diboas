/**
 * End-to-End Tests for On-Chain Transaction Flow
 * Tests complete user journey from transaction initiation to blockchain confirmation
 */

import { test, expect } from '@playwright/test'

test.describe('On-Chain Transaction Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 })
    
    // Mock authentication state if needed
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token')
      localStorage.setItem('user_data', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      }))
    })
  })

  test('should complete transfer transaction with blockchain confirmation', async ({ page }) => {
    // Step 1: Navigate to transaction page
    await page.click('[data-testid="send-money-button"]')
    await expect(page).toHaveURL(/.*\/transaction/)

    // Step 2: Select transfer transaction type
    await page.click('[data-testid="transaction-type-transfer"]')
    
    // Step 3: Fill in transaction details
    await page.fill('[data-testid="amount-input"]', '50')
    await page.fill('[data-testid="recipient-input"]', '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
    
    // Step 4: Submit transaction
    await page.click('[data-testid="submit-transaction"]')
    
    // Step 5: Confirm transaction on confirmation screen
    await expect(page.locator('[data-testid="transaction-confirmation"]')).toBeVisible()
    await expect(page.locator('text=Confirm Transfer')).toBeVisible()
    await expect(page.locator('text=$50')).toBeVisible()
    await expect(page.locator('text=External Wallet')).toBeVisible()
    
    await page.click('[data-testid="confirm-transaction"]')
    
    // Step 6: Verify enhanced progress screen appears
    await expect(page.locator('[data-testid="enhanced-transaction-progress"]')).toBeVisible()
    await expect(page.locator('text=Transfer in Progress')).toBeVisible()
    
    // Step 7: Verify blockchain confirmation steps
    await expect(page.locator('text=Validating external address')).toBeVisible()
    await expect(page.locator('text=Submitting cross-chain transfer')).toBeVisible()
    await expect(page.locator('text=Waiting for blockchain confirmation')).toBeVisible()
    
    // Step 8: Wait for blockchain confirmation progress
    await page.waitForSelector('[data-testid="blockchain-confirmation-progress"]', { timeout: 15000 })
    await expect(page.locator('text=Blockchain Confirmation')).toBeVisible()
    
    // Step 9: Verify explorer link appears
    await page.waitForSelector('[data-testid="explorer-link"]', { timeout: 10000 })
    await expect(page.locator('text=Transaction Hash')).toBeVisible()
    await expect(page.locator('text=View on Explorer')).toBeVisible()
    
    // Step 10: Wait for transaction completion
    await page.waitForSelector('[data-testid="transaction-confirmed"]', { timeout: 20000 })
    await expect(page.locator('text=Transaction Confirmed!')).toBeVisible()
    await expect(page.locator('text=successfully confirmed on the blockchain')).toBeVisible()
    
    // Step 11: Verify transaction details in completion screen
    await expect(page.locator('text=From:')).toBeVisible()
    await expect(page.locator('text=diBoaS Wallet Available Balance')).toBeVisible()
    await expect(page.locator('text=To:')).toBeVisible()
    await expect(page.locator('text=External Wallet')).toBeVisible()
    await expect(page.locator('text=Amount:')).toBeVisible()
    await expect(page.locator('text=$50')).toBeVisible()
    
    // Step 12: Return to dashboard
    await page.click('[data-testid="return-to-dashboard"]')
    await expect(page).toHaveURL(/.*\/app/)
    
    // Step 13: Verify transaction appears in history with explorer link
    await page.click('[data-testid="transaction-history"]')
    await expect(page.locator('[data-testid="transaction-history-item"]').first()).toBeVisible()
    await expect(page.locator('text=Transfer $50.00 to external wallet')).toBeVisible()
    await expect(page.locator('[data-testid="explorer-link-history"]')).toBeVisible()
  })

  test('should handle buy transaction with diboas wallet payment', async ({ page }) => {
    // Navigate to buy transaction
    await page.click('[data-testid="buy-crypto-button"]')
    await expect(page).toHaveURL(/.*\/transaction.*type=buy/)
    
    // Fill transaction details
    await page.fill('[data-testid="amount-input"]', '100')
    await page.selectOption('[data-testid="asset-select"]', 'BTC')
    await page.selectOption('[data-testid="payment-method-select"]', 'diboas_wallet')
    
    // Submit and confirm
    await page.click('[data-testid="submit-transaction"]')
    await page.click('[data-testid="confirm-transaction"]')
    
    // Verify buy-specific progress steps
    await expect(page.locator('text=Buy Assets in Progress')).toBeVisible()
    await expect(page.locator('text=Processing payment')).toBeVisible()
    await expect(page.locator('text=Executing blockchain trade')).toBeVisible()
    await expect(page.locator('text=Confirming on network')).toBeVisible()
    await expect(page.locator('text=Updating portfolio')).toBeVisible()
    
    // Wait for completion
    await page.waitForSelector('[data-testid="transaction-confirmed"]', { timeout: 20000 })
    await expect(page.locator('text=Your buy assets has been successfully confirmed')).toBeVisible()
  })

  test('should show fund safety message for failed transactions', async ({ page }) => {
    // Force a transaction failure by using an invalid amount or triggering error conditions
    await page.goto('/transaction?type=transfer&debug=force_failure')
    
    await page.fill('[data-testid="amount-input"]', '999999') // Trigger insufficient balance
    await page.fill('[data-testid="recipient-input"]', '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
    
    await page.click('[data-testid="submit-transaction"]')
    
    // Should show error or proceed to failure simulation
    await page.click('[data-testid="confirm-transaction"]', { timeout: 5000 }).catch(() => {})
    
    // Wait for failure state
    await page.waitForSelector('[data-testid="transaction-failed"]', { timeout: 15000 })
    
    // Verify failure message and fund safety
    await expect(page.locator('text=Transaction Failed')).toBeVisible()
    await expect(page.locator('text=Your funds are safe')).toBeVisible()
    await expect(page.locator('text=No changes were made to your balance')).toBeVisible()
    
    // Verify explorer link is still shown for failed transactions
    await expect(page.locator('[data-testid="explorer-link"]')).toBeVisible()
  })

  test('should display real-time confirmation progress', async ({ page }) => {
    // Start a Bitcoin transaction (longer confirmation time)
    await page.click('[data-testid="send-money-button"]')
    await page.click('[data-testid="transaction-type-transfer"]')
    
    await page.fill('[data-testid="amount-input"]', '25')
    await page.fill('[data-testid="recipient-input"]', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa') // Bitcoin address
    
    await page.click('[data-testid="submit-transaction"]')
    await page.click('[data-testid="confirm-transaction"]')
    
    // Verify Bitcoin-specific timing and network detection
    await expect(page.locator('text=Network: BTC')).toBeVisible({ timeout: 10000 })
    
    // Check confirmation progress updates
    await page.waitForSelector('[data-testid="confirmation-progress"]', { timeout: 5000 })
    
    // Verify progress bar updates
    const progressBar = page.locator('[data-testid="progress-bar"]')
    await expect(progressBar).toBeVisible()
    
    // Wait for confirmation count updates
    await expect(page.locator('text=/\\d+\\/\\d+ confirmations/')).toBeVisible({ timeout: 10000 })
  })

  test('should handle cancellation of pending transactions', async ({ page }) => {
    // Start a transaction
    await page.click('[data-testid="send-money-button"]')
    await page.click('[data-testid="transaction-type-transfer"]')
    
    await page.fill('[data-testid="amount-input"]', '30')
    await page.fill('[data-testid="recipient-input"]', '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
    
    await page.click('[data-testid="submit-transaction"]')
    await page.click('[data-testid="confirm-transaction"]')
    
    // Try to cancel during processing (if cancel button is available)
    const cancelButton = page.locator('[data-testid="cancel-transaction"]')
    if (await cancelButton.isVisible({ timeout: 2000 })) {
      await cancelButton.click()
      await expect(page.locator('text=Transaction cancelled')).toBeVisible()
    } else {
      // Transaction proceeded too quickly to cancel - verify it completes
      await page.waitForSelector('[data-testid="transaction-confirmed"]', { timeout: 20000 })
    }
  })

  test('should display transaction details toggle', async ({ page }) => {
    await page.click('[data-testid="send-money-button"]')
    await page.click('[data-testid="transaction-type-transfer"]')
    
    await page.fill('[data-testid="amount-input"]', '75')
    await page.fill('[data-testid="recipient-input"]', '0x742d35Cc6634C0532925a3b8D7389e4B5F1c16e3') // ETH address
    
    await page.click('[data-testid="submit-transaction"]')
    await page.click('[data-testid="confirm-transaction"]')
    
    // Toggle transaction details
    await page.click('[data-testid="show-details-button"]')
    
    // Verify details are shown
    await expect(page.locator('text=From:')).toBeVisible()
    await expect(page.locator('text=diBoaS Wallet Available Balance')).toBeVisible()
    await expect(page.locator('text=To:')).toBeVisible()
    await expect(page.locator('text=External Wallet')).toBeVisible()
    await expect(page.locator('text=Amount:')).toBeVisible()
    await expect(page.locator('text=$75')).toBeVisible()
    await expect(page.locator('text=Network:')).toBeVisible()
    await expect(page.locator('text=ETH')).toBeVisible()
    
    // Toggle details off
    await page.click('[data-testid="hide-details-button"]')
    
    // Details should be hidden but basic info remains
    await expect(page.locator('text=Transfer in Progress')).toBeVisible()
  })

  test('should validate explorer links for different chains', async ({ page }) => {
    const testCases = [
      {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        chain: 'BTC',
        expectedDomain: 'mempool.space'
      },
      {
        address: '0x742d35Cc6634C0532925a3b8D7389e4B5F1c16e3',
        chain: 'ETH',
        expectedDomain: 'etherscan.io'
      },
      {
        address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        chain: 'SOL',
        expectedDomain: 'solscan.io'
      },
      {
        address: '0x7c3e1ad62f0ac85e1227cb7b3dfa123c03c8191f9c3fbac9548ded485c52e169',
        chain: 'SUI',
        expectedDomain: 'suivision.xyz'
      }
    ]

    for (const testCase of testCases) {
      // Start new transaction
      await page.goto('/transaction?type=transfer')
      
      await page.fill('[data-testid="amount-input"]', '10')
      await page.fill('[data-testid="recipient-input"]', testCase.address)
      
      await page.click('[data-testid="submit-transaction"]')
      await page.click('[data-testid="confirm-transaction"]')
      
      // Wait for explorer link to appear
      await page.waitForSelector('[data-testid="explorer-link"]', { timeout: 10000 })
      
      // Verify correct explorer domain
      const explorerLink = await page.locator('[data-testid="explorer-link"]').getAttribute('href')
      expect(explorerLink).toContain(testCase.expectedDomain)
      
      // Verify network display
      await expect(page.locator(`text=Network: ${testCase.chain}`)).toBeVisible()
      
      // Wait for completion before next test
      await page.waitForSelector('[data-testid="transaction-confirmed"]', { timeout: 20000 })
    }
  })

  test('should maintain transaction state across page refreshes', async ({ page }) => {
    // Start transaction
    await page.click('[data-testid="send-money-button"]')
    await page.click('[data-testid="transaction-type-transfer"]')
    
    await page.fill('[data-testid="amount-input"]', '40')
    await page.fill('[data-testid="recipient-input"]', '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
    
    await page.click('[data-testid="submit-transaction"]')
    await page.click('[data-testid="confirm-transaction"]')
    
    // Wait for processing to start
    await expect(page.locator('text=Transfer in Progress')).toBeVisible()
    
    // Get transaction ID from URL or state
    const currentUrl = page.url()
    
    // Refresh page
    await page.reload()
    
    // Should either:
    // 1. Restore the transaction progress if still pending
    // 2. Show completion if transaction finished during refresh
    // 3. Redirect to dashboard if transaction was completed
    
    await page.waitForLoadState('networkidle')
    
    // Verify we're in a valid state (not error)
    const isOnTransactionPage = await page.locator('[data-testid="enhanced-transaction-progress"]').isVisible({ timeout: 2000 })
    const isOnDashboard = await page.locator('[data-testid="dashboard"]').isVisible({ timeout: 2000 })
    const isOnCompletionPage = await page.locator('[data-testid="transaction-confirmed"]').isVisible({ timeout: 2000 })
    
    expect(isOnTransactionPage || isOnDashboard || isOnCompletionPage).toBe(true)
  })
})