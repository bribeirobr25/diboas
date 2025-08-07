# Investment Operations

Investment category allows users to easily invest into Crypto, Stocks, Gold, Indexes and Real State Funds with quick and simple Buy and Sell transactions. This category is fully On-Chain as all assets are tokenized assets.

## Buy Assets ✅

**Purpose**: Purchase cryptocurrency assets with fiat or diBoaS wallet balance

**Provider**: Market Data Provider + 3rd party payment service provider and 3rd party DEX, Swap and Bridging providers

### Payment Methods
- **External On-Ramp**: Credit/Debit Card, Bank Account, Apple Pay, Google Pay, PayPal
  - Availability depends on 3rd party Provider geo-location allowance 
- **Internal On-Chain**: diBoaS Wallet (using available balance)

### Money Flow

#### External On-Ramp
- From = selected payment method (transaction amount)
- To = diBoaS wallet Invested Balance (transaction amount - fees)

#### Internal On-Chain
- From = diBoaS Wallet Available Balance (transaction amount)
- To = diBoaS wallet Invested Balance (transaction amount - fees)

### Balance Impact

#### Buy On-Ramp (external payment methods)
- Available Balance = current (no change)
- Invested Balance = current + (transaction amount - fees)
- Strategy Balance = current (no change)

#### Buy On-Chain (diBoaS wallet)
- Available Balance = current - transaction amount
- Invested Balance = current + (transaction amount - fees)
- Strategy Balance = current (no change)

### Technical Details
- **Chain - Network Detection**: Based on selected asset's native network
- **Assets**: BTC, ETH, SOL, SUI native network (USD removed from selection per UI improvements)
- **Minimum**: $10
- **Validation**: Requires payment method selection + only for On-Chain it needs sufficient available balance
- **KYC**: only for Buy On-Ramp and handle by 3rd party payment providers
- **Balance Check**: Only for diBoaS Wallet payments (uses available balance)
- **User Input**: Asset selection + fiat amount + payment method
- **Warning**: Irreversible operation warning displayed
- **Asset Storage**: Added to invested balance and asset tracking, stored on one of the 4 wallets created according to the correct chain
- **Ethereum Specific Case**: For now just supporting ETH layer 1

### Fee Structure
- **diBoaS fee**: 0.09% of fiat transaction amount
- **Network fee**: Based on selected asset (same as Withdraw)
- **Payment fee**: For external payments (same as Add Transaction)
- **DEX fee**: Only for On-Chain transactions (same as Withdraw)

## Sell Assets ✅

**Purpose**: Convert cryptocurrency assets to USDC on Solana chain

**Provider**: Market Data Provider + 3rd party DEX, Swap and Bridging providers

### Payment Methods
- diBoaS Wallet (automatically selected, no user selection needed)

### Money Flow
- From = diBoaS wallet Invested Balance (transaction amount)
- To = diBoaS wallet Available Balance (transaction amount - fees)

### Balance Impact
- Available Balance = current + (transaction amount - fees)
- Invested Balance = current - transaction amount
- Strategy Balance = current (no changes)

### Technical Details
- **Chain - Network Detection**: Based on selected asset's native network
- **Assets**:
  - Selling = BTC, ETH, SOL, SUI native network
  - Receiving USDC on Solana network
- **Minimum**: $5
- **Validation**: Requires asset selection for all assets with Invested Balance > 0
- **KYC**: not applicable
- **Balance Check**: Cannot sell more than invested amount on Invested Balance for that specific selected asset
- **User Input**: Asset selection + FIAT amount to sell (USD value, not token quantity)
- **Payment Method**: Automatically set to diBoaS Wallet (hidden from UI)
- **Amount Validation**: Input amount represents USD value of asset to sell, validated against invested USD amount
- **Ethereum Specific Case**: For now just supporting ETH layer 1

### Fee Structure
- **diBoaS fee**: 0.09% of fiat transaction amount
- **Network fee**: Based on selected asset (same as Withdraw)
- **DEX fee**: Only for On-Chain transactions (same as Withdraw)

## Validation Requirements

- **Buy On-Ramp**: Transaction Amount + Asset + External Payment Method
- **Buy On-Chain**: Transaction Amount + Asset + diBoaS Wallet + Sufficient Available Balance
- **Sell**: Transaction Amount + Asset + diBoaS wallet method auto-selected

## User Experience Features

### Real-time Updates
- **Fee Calculation**: Updates when transaction amount or payment method changes
- **Network Detection**: Transfer fees update when address changes
- **Balance Display**: Shows available vs invested amounts
- **Validation**: Real-time form validation with error states

### Enhanced Transaction Progress
- **Buy**: From Payment Method or diBoaS Wallet Available Balance → To diBoaS Wallet Invested Balance
- **Sell**: From diBoaS Wallet Invested Balance → To diBoaS Wallet Available Balance

### UI Improvements
- **Payment Method Ordering**: diBoaS Wallet listed first when applicable
- **Amount Buttons**: Quick select buttons (25%, 50%, 75%, Max) for sell transactions
- **Asset Storage**: Individual asset tracking with FIAT values