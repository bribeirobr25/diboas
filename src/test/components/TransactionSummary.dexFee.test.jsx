/**
 * Test to verify DEX fee value display fix in TransactionSummary
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TransactionSummary from '../../components/transactions/TransactionSummary.jsx'

describe('TransactionSummary DEX Fee Display Fix', () => {
  it('should display correct DEX fee value for external wallet withdrawal', () => {
    const mockFees = {
      total: 14.03,
      diBoaS: 9.00,
      network: 0.03,
      provider: 0, // No provider fee for external wallet
      dex: 5.00 // This should be displayed, not provider
    }

    const { container } = render(
      <TransactionSummary
        amount="1000"
        transactionType="withdraw"
        selectedAsset="USDC"
        assets={[]}
        fees={mockFees}
        currentType={{ label: 'Withdraw' }}
        isOnRamp={false}
        isOffRamp={true}
        selectedPaymentMethod="external_wallet"
        handleTransactionStart={() => {}}
        isTransactionValid={true}
        getNetworkFeeRate={() => '0.003%'}
        getProviderFeeRate={() => '0.5%'} // This shows as DEX fee label
        getPaymentMethodFeeRate={() => '0%'}
        recipientAddress="0x1234...5678"
      />
    )

    // Click to expand fee details
    const feeDetailsButton = screen.getByText('Fee Details')
    fireEvent.click(feeDetailsButton)

    // Check that DEX fee is displayed with correct value
    const dexFeeLabel = screen.getByText(/DEX Fee/)
    expect(dexFeeLabel).toBeTruthy()
    
    // Verify the DEX fee value is $5.00, not $0.00 (provider fee)
    const dexFeeValue = screen.getByText('$5.00')
    expect(dexFeeValue).toBeTruthy()
    
    // Check the DEX fee row contains both label and correct value
    const dexFeeRow = dexFeeLabel.closest('.fee-breakdown-row')
    expect(dexFeeRow.textContent).toContain('DEX Fee')
    expect(dexFeeRow.textContent).toContain('$5.00')
  })

  it('should display correct DEX fee value for transfer transactions', () => {
    const mockFees = {
      total: 17.03,
      diBoaS: 9.00,
      network: 0.03,
      provider: 0,
      dex: 8.00 // Transfer has 0.8% DEX fee
    }

    const { container } = render(
      <TransactionSummary
        amount="1000"
        transactionType="transfer"
        selectedAsset="USDC"
        assets={[]}
        fees={mockFees}
        currentType={{ label: 'Transfer' }}
        isOnRamp={false}
        isOffRamp={false}
        selectedPaymentMethod="diboas_wallet"
        handleTransactionStart={() => {}}
        isTransactionValid={true}
        getNetworkFeeRate={() => '0.003%'}
        getProviderFeeRate={() => '0.8%'} // Transfer DEX fee rate
        getPaymentMethodFeeRate={() => '0%'}
        recipientAddress="0x1234...5678"
      />
    )

    // Click to expand fee details
    const feeDetailsButton = screen.getByText('Fee Details')
    fireEvent.click(feeDetailsButton)

    // Verify the DEX fee value is $8.00
    const dexFeeValue = screen.getByText('$8.00')
    expect(dexFeeValue).toBeTruthy()
  })

  it('should show $0.00 DEX fee for SOL external wallet withdrawal', () => {
    const mockFees = {
      total: 9.01,
      diBoaS: 9.00,
      network: 0.01,
      provider: 0,
      dex: 0 // SOL has no DEX fee
    }

    render(
      <TransactionSummary
        amount="1000"
        transactionType="withdraw"
        selectedAsset="USDC"
        assets={[]}
        fees={mockFees}
        currentType={{ label: 'Withdraw' }}
        isOnRamp={false}
        isOffRamp={true}
        selectedPaymentMethod="external_wallet"
        handleTransactionStart={() => {}}
        isTransactionValid={true}
        getNetworkFeeRate={() => '0.001%'}
        getProviderFeeRate={() => '0%'} // SOL has 0% DEX fee
        getPaymentMethodFeeRate={() => '0%'}
        recipientAddress="1234...5678" // SOL address
      />
    )

    // Click to expand fee details
    const feeDetailsButton = screen.getByText('Fee Details')
    fireEvent.click(feeDetailsButton)

    // Find the DEX fee row and verify it shows $0.00
    const dexFeeLabel = screen.getByText(/DEX Fee \(0%\)/)
    expect(dexFeeLabel).toBeTruthy()
    
    // The value should be $0.00 for SOL
    const dexFeeRow = dexFeeLabel.closest('.fee-breakdown-row')
    expect(dexFeeRow.textContent).toContain('$0.00')
  })
})