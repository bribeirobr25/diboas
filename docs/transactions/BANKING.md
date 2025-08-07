# Banking Operations

Traditional bank-like operations: Add/Deposit Money, Send and Withdraw. This category is the entry point and facilitator by allowing On/Off-Ramp as well as On-Chain transactions.

## Add/Deposit (On-Ramp or On-Chain via External Wallet) ✅

**Purpose**: Allow users to add money into diBoaS platform via On-Ramp (Convert fiat to crypto and add to diBoaS wallet) or On-Chain (using an external wallet sending assets into diBoaS wallet via diBoaS public key)

**Provider**: 3rd party payment service provider as well as 3rd party DEX providers allowing Swap or Bridge operations

### Payment Methods
- **On-Ramp**: Credit/Debit Card, Bank Account, Apple Pay, Google Pay, PayPal
  - Availability depends on 3rd party Provider geo-location allowance 
- **On-Chain**: Bitcoin (assets BTC, USDT), Ethereum Layer 1 (assets ETH, USDT, USDC), Solana (assets SOL, USDC, USDT) and Sui (assets SUI, USDT and USDC)
  - Available via DEX platforms providing Swap or Bridge operations

### Money Flow
- From = selected payment method (transaction amount)
- To = diBoaS wallet Available Balance (transaction amount - fees)

### Balance Impact
- Available Balance = current + (transaction amount - fees)
- Invested Balance = current (no change)
- Strategy Balance = current (no change)

### Technical Details

#### On-Ramp
- **Default Chain**: Solana
- **Assets**: Small SOL amount (gas fees) + remainder in USDC
- **Minimum**: $10
- **Validation**: Requires payment method selection
- **KYC**: Handled by 3rd party on-ramp provider
- **Balance Check**: Not required (external payment source)

#### On-Chain
- **Default Chain**: Solana
- **Assets**: Small SOL amount (gas fees) + remainder converted into USDC (if not in USDC already)
- **Minimum**: $10
- **Validation**: Requires selecting the payment method = external wallet, then chain selection and public key copy
- **KYC**: not applicable
- **Balance Check**: Not required (external payment source)

### Fee Structure
Only applicable for On-Ramp:
- **diBoaS fee**: 0.09% of fiat transaction amount
- **Network fee**: 0.001% - NO minimum applied (mockup)
- **Provider fees**: Variable by payment method (mockup):
  - Apple Pay: 0.5%, Google Pay: 0.5%
  - Credit Card: 1%, Bank: 1%
  - PayPal: 3%

## Withdraw (Off-Ramp or On-Chain via External Wallet) ✅

**Purpose**: Allow users to withdraw money from diBoaS platform either converting them into fiat or sending to an external wallet

**Provider**: 3rd party payment service provider or DEX platforms providing Swap or Bridge operations

### Output Methods
- **Off-Ramp** = Credit/Debit Card, Bank Account, Apple Pay, Google Pay, PayPal
  - Availability depends on 3rd party Provider geo-location allowance
- **On-Chain** = external wallet addresses on supported chains
  - Bitcoin (assets BTC, USDT), Ethereum Layer 1 (assets ETH, USDT, USDC), Solana (assets SOL, USDC, USDT) and Sui (assets SUI, USDT and USDC)
  - Available via DEX platforms providing Swap or Bridge operations

### Money Flow
- From = diBoaS wallet Available Balance (transaction amount)
- To = selected external method (transaction amount - fees) 

### Balance Impact
- Available Balance = current - transaction amount
- Invested Balance = current (no change)
- Strategy Balance = current (no change)

### Technical Details

#### Off-Ramp
- **Default Chain**: Solana
- **Assets**: USDC → Fiat
- **Minimum**: $5
- **Validation**: Requires payment method selection and sufficient available balance
- **KYC**: Handled by 3rd party off-ramp provider
- **Balance Check**: Available balance only (cannot use invested balance or strategy balance)
- **Warning**: Irreversible transaction warning displayed

#### On-Chain
- **Default Chain**: Solana
- **Assets**: USDC → USDC (Solana chain or BTC, ETH Layer 1 or SUI)
- **Minimum**: $5
- **Validation**: Requires selecting the payment method = external wallet, then adding a valid wallet address that is automatically recognized on SOL, BTC, ETH or SUI and sufficient available balance
- **KYC**: Not applicable
- **Balance Check**: Available balance only (cannot use invested balance or strategy balance)
- **Warning**: Irreversible transaction warning displayed

### Fee Structure
- **diBoaS fee**: 0.9% of fiat transaction amount
- **Network fee**: Based on selected asset (mockup):
  - BTC: 1%, ETH: 0.5%, SOL: 0.0001%, SUI: 0.0005%
- **Payment fee**: For external payments (mockup):
  - Apple Pay: 3%, Google Pay: 3%
  - Credit Card: 2%, Bank: 2%
  - PayPal: 4%
- **DEX fee**: Only for On-Chain transactions: 0.8% (mockup)

## Send (P2P Transfer) ✅

**Purpose**: On-chain transfers between diBoaS users

**Provider**: 3rd party DEX platforms providing Swap or Bridge operations

### Output Methods
- diBoaS wallet Available Balance

### Money Flow
- From = diBoaS wallet Available Balance (transaction amount)
- To = another user diBoaS wallet Available Balance, selected before the transaction (transaction amount - fees)

### Balance Impact
- Available Balance = current - transaction amount
- Invested Balance = current (no change)
- Strategy Balance = current (no change)

### Technical Details
- **Chain**: Solana
- **Assets**: Small SOL (gas) + remainder in USDC
- **Minimum**: $5
- **Validation**: Requires valid user input selection and sufficient available balance
- **KYC**: not applicable
- **Balance Check**: Available balance only (cannot use invested balance or strategy balance)
- **User Input**: diBoaS username (@username format) + amount
- **Warning**: Irreversible transaction warning displayed

### Fee Structure
- **diBoaS fee**: 0.09% of fiat transaction amount
- **Network fee**: 0.0001% - NO minimum applied (mockup)
- **Provider fee**: Not Applicable (P2P transaction)

## Validation Requirements

- **Add**: Transaction Amount + Payment Method
- **Withdraw**: Transaction Amount + Payment Method + Sufficient Available Balance AND Valid Address (in case of external wallet)
- **Send**: Transaction Amount + Recipient + Sufficient Available Balance  

## User Experience Features

### Irreversible Transaction Warnings
- **Send Transactions**: Warning about accuracy of recipient information
- **Withdraw to External Wallet**: Warning about external wallet address accuracy
- **UI Treatment**: Amber warning boxes with alert icons

### Enhanced Transaction Progress
- **Progressive Loading**: Step-by-step progress with visual indicators
- **Minimum Display Time**: 3 seconds to show progress properly
- **Enhanced Confirmation Screen**: Shows detailed from/to information
- **Success Summary**: Shows transaction details and updated balance
- **Error Handling**: Clear error messages with retry options