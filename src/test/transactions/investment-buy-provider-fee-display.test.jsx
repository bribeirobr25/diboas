/**
 * Investment Buy Provider Fee Display Test
 * Verifies that Buy transactions with external payment methods show Provider Fee
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import TransactionSummary from '../../components/transactions/TransactionSummary.jsx'

describe('Investment Buy Provider Fee Display', () => {
  const mockAssets = [
    { assetId: 'BTC', tickerSymbol: 'BTC', displayName: 'Bitcoin', currentMarketPrice: '$94,523.45' }
  ]

  describe('Buy with External Payment Methods', () => {
    it('should display Provider Fee for Buy with credit card', () => {
      const mockFees = {
        total: 15.9,
        diBoaS: 0.9,
        network: 90,
        provider: 10, // 1% credit card fee on $1000
        dex: 0,
        breakdown: {
          network: { amount: 90, rate: 0.09 },
          provider: { amount: 10, rate: 0.01 }
        }
      }

      render(
        <TransactionSummary
          amount="1000"
          transactionType="buy"
          selectedAsset="BTC"
          assets={mockAssets}
          fees={mockFees}
          currentType={{ label: 'Buy' }}
          isOnRamp={false} // Buy is not classified as on-ramp
          isOffRamp={false}
          selectedPaymentMethod="credit_debit_card"
          handleTransactionStart={() => {}}
          isTransactionValid={true}
          getNetworkFeeRate={() => '9%'}
          getProviderFeeRate={() => '1%'} // Credit card provider fee
          getPaymentMethodFeeRate={() => '1%'}
        />
      )

      // Click to expand fee details - use getAllByText since there may be multiple
      const feeDetailsButtons = screen.getAllByText('Fee Details')
      fireEvent.click(feeDetailsButtons[0])

      // Check that Provider Fee is displayed
      const providerFeeLabel = screen.getByText(/Provider Fee \(1%\)/)
      expect(providerFeeLabel).toBeTruthy()

      const providerFeeRow = providerFeeLabel.closest('.fee-breakdown-row')
      const spans = providerFeeRow.querySelectorAll('span')
      const providerFeeValue = spans[1].textContent

      console.log('Provider fee value displayed:', providerFeeValue)
      expect(providerFeeValue).toBe('$10.00')
    })

    it('should display Provider Fee for Buy with bank account', () => {
      const mockFees = {
        total: 105.9,
        diBoaS: 0.9,
        network: 90,
        provider: 10, // 1% bank fee on $1000
        dex: 0,
        breakdown: {
          provider: { amount: 10, rate: 0.01 }
        }
      }

      render(
        <TransactionSummary
          amount="1000"
          transactionType="buy"
          selectedAsset="BTC"
          assets={mockAssets}
          fees={mockFees}
          currentType={{ label: 'Buy' }}
          isOnRamp={false}
          isOffRamp={false}
          selectedPaymentMethod="bank_account"
          handleTransactionStart={() => {}}
          isTransactionValid={true}
          getNetworkFeeRate={() => '9%'}
          getProviderFeeRate={() => '1%'} // Bank provider fee
          getPaymentMethodFeeRate={() => '1%'}
        />
      )

      fireEvent.click(screen.getAllByText('Fee Details')[0])

      const providerFeeLabel = screen.getByText(/Provider Fee \(1%\)/)
      expect(providerFeeLabel).toBeTruthy()
      
      const providerFeeRow = providerFeeLabel.closest('.fee-breakdown-row')
      const providerFeeValue = providerFeeRow.querySelectorAll('span')[1].textContent
      expect(providerFeeValue).toBe('$10.00')
    })

    it('should display Provider Fee for Buy with PayPal', () => {
      const mockFees = {
        total: 123.9,
        diBoaS: 0.9,
        network: 90,
        provider: 30, // 3% PayPal fee on $1000
        dex: 0,
        breakdown: {
          provider: { amount: 30, rate: 0.03 }
        }
      }

      render(
        <TransactionSummary
          amount="1000"
          transactionType="buy"
          selectedAsset="BTC"
          assets={mockAssets}
          fees={mockFees}
          currentType={{ label: 'Buy' }}
          isOnRamp={false}
          isOffRamp={false}
          selectedPaymentMethod="paypal"
          handleTransactionStart={() => {}}
          isTransactionValid={true}
          getNetworkFeeRate={() => '9%'}
          getProviderFeeRate={() => '3%'} // PayPal provider fee
          getPaymentMethodFeeRate={() => '3%'}
        />
      )

      fireEvent.click(screen.getAllByText('Fee Details')[0])

      const providerFeeLabel = screen.getByText(/Provider Fee \(3%\)/)
      expect(providerFeeLabel).toBeTruthy()
      
      const providerFeeRow = providerFeeLabel.closest('.fee-breakdown-row')
      const providerFeeValue = providerFeeRow.querySelectorAll('span')[1].textContent
      expect(providerFeeValue).toBe('$30.00')
    })

    it('should display Provider Fee for Buy with Apple Pay', () => {
      const mockFees = {
        total: 100.9,
        diBoaS: 0.9,
        network: 90,
        provider: 5, // 0.5% Apple Pay fee on $1000
        dex: 0,
        breakdown: {
          provider: { amount: 5, rate: 0.005 }
        }
      }

      render(
        <TransactionSummary
          amount="1000"
          transactionType="buy"
          selectedAsset="BTC"
          assets={mockAssets}
          fees={mockFees}
          currentType={{ label: 'Buy' }}
          isOnRamp={false}
          isOffRamp={false}
          selectedPaymentMethod="apple_pay"
          handleTransactionStart={() => {}}
          isTransactionValid={true}
          getNetworkFeeRate={() => '9%'}
          getProviderFeeRate={() => '0.5%'} // Apple Pay provider fee
          getPaymentMethodFeeRate={() => '0.5%'}
        />
      )

      fireEvent.click(screen.getAllByText('Fee Details')[0])

      const providerFeeLabel = screen.getByText(/Provider Fee \(0\.5%\)/)
      expect(providerFeeLabel).toBeTruthy()
      
      const providerFeeRow = providerFeeLabel.closest('.fee-breakdown-row')
      const providerFeeValue = providerFeeRow.querySelectorAll('span')[1].textContent
      expect(providerFeeValue).toBe('$5.00')
    })
  })

  describe('Buy with diBoaS Wallet', () => {
    it('should NOT display Provider Fee for Buy with diBoaS wallet', () => {
      const mockFees = {
        total: 100.9,
        diBoaS: 0.9,
        network: 90,
        provider: 0, // No provider fee for diBoaS wallet
        dex: 10, // DEX fee for diBoaS wallet buy
        breakdown: {
          dex: { amount: 10, rate: 0.01 }
        }
      }

      render(
        <TransactionSummary
          amount="1000"
          transactionType="buy"
          selectedAsset="BTC"
          assets={mockAssets}
          fees={mockFees}
          currentType={{ label: 'Buy' }}
          isOnRamp={false}
          isOffRamp={false}
          selectedPaymentMethod="diboas_wallet"
          handleTransactionStart={() => {}}
          isTransactionValid={true}
          getNetworkFeeRate={() => '9%'}
          getProviderFeeRate={() => '0.2%'} // DEX fee rate for diBoaS wallet
          getPaymentMethodFeeRate={() => '0%'}
        />
      )

      fireEvent.click(screen.getAllByText('Fee Details')[0])

      // Provider Fee should NOT be present
      const providerFeeElements = screen.queryAllByText(/Provider Fee/)
      expect(providerFeeElements).toHaveLength(0)

      // DEX Fee should be present instead
      const dexFeeLabel = screen.getByText(/DEX Fee \(0\.2%\)/)
      expect(dexFeeLabel).toBeTruthy()
      
      const dexFeeRow = dexFeeLabel.closest('.fee-breakdown-row')
      const dexFeeValue = dexFeeRow.querySelectorAll('span')[1].textContent
      expect(dexFeeValue).toBe('$10.00')
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero provider fees gracefully', () => {
      const mockFees = {
        total: 90.9,
        diBoaS: 0.9,
        network: 90,
        provider: 0,
        dex: 0
      }

      render(
        <TransactionSummary
          amount="1000"
          transactionType="buy"
          selectedAsset="BTC"
          assets={mockAssets}
          fees={mockFees}
          currentType={{ label: 'Buy' }}
          isOnRamp={false}
          isOffRamp={false}
          selectedPaymentMethod="credit_debit_card"
          handleTransactionStart={() => {}}
          isTransactionValid={true}
          getNetworkFeeRate={() => '9%'}
          getProviderFeeRate={() => '1%'}
          getPaymentMethodFeeRate={() => '1%'}
        />
      )

      fireEvent.click(screen.getAllByText('Fee Details')[0])

      // Provider Fee should still be displayed even if 0
      const providerFeeLabel = screen.getByText(/Provider Fee \(1%\)/)
      expect(providerFeeLabel).toBeTruthy()
      
      const providerFeeRow = providerFeeLabel.closest('.fee-breakdown-row')
      const providerFeeValue = providerFeeRow.querySelectorAll('span')[1].textContent
      expect(providerFeeValue).toBe('$0.00')
    })

    it('should verify complete fee breakdown for Buy with external payment', () => {
      const mockFees = {
        total: 105.9,
        diBoaS: 0.9,
        network: 90,
        provider: 15, // Provider fee
        dex: 0,
        breakdown: {
          diBoaS: { amount: 0.9, rate: 0.0009 },
          network: { amount: 90, rate: 0.09 },
          provider: { amount: 15, rate: 0.015 }
        }
      }

      render(
        <TransactionSummary
          amount="1000"
          transactionType="buy"
          selectedAsset="BTC"
          assets={mockAssets}
          fees={mockFees}
          currentType={{ label: 'Buy' }}
          isOnRamp={false}
          isOffRamp={false}
          selectedPaymentMethod="credit_debit_card"
          handleTransactionStart={() => {}}
          isTransactionValid={true}
          getNetworkFeeRate={() => '9%'}
          getProviderFeeRate={() => '1.5%'}
          getPaymentMethodFeeRate={() => '1.5%'}
        />
      )

      fireEvent.click(screen.getAllByText('Fee Details')[0])

      // All fees should be displayed
      expect(screen.getByText(/diBoaS Fee \(0\.09%\)/)).toBeTruthy()
      expect(screen.getByText(/Network Fee \(9%\)/)).toBeTruthy()
      expect(screen.getByText(/Provider Fee \(1\.5%\)/)).toBeTruthy()

      // Check fee values
      const diboasFeeRow = screen.getByText(/diBoaS Fee/).closest('.fee-breakdown-row')
      expect(diboasFeeRow.querySelectorAll('span')[1].textContent).toBe('$0.90')

      const networkFeeRow = screen.getByText(/Network Fee/).closest('.fee-breakdown-row')
      expect(networkFeeRow.querySelectorAll('span')[1].textContent).toBe('$90.00')

      const providerFeeRow = screen.getByText(/Provider Fee/).closest('.fee-breakdown-row')
      expect(providerFeeRow.querySelectorAll('span')[1].textContent).toBe('$15.00')

      console.log('Complete fee breakdown verified for Buy with external payment')
    })
  })
})