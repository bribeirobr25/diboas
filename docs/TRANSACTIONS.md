# diBoaS Transactions - Implementation Documentation

## Overview
diBoaS Transactions enable seamless On/Off-Ramp and multi-chain operations with complex swap and bridging operations hidden from users. The system presents a unified wallet experience while supporting BTC, ETH Layer 1, SOL, and SUI chains behind the scenes.

## 1. Balance System

### 1.1 Balance Structure
**Total Balance**: Available Balance + Invested Balance
**Available Balance**: USDC only (liquid funds ready for spending)
**Invested Balance**: All non-USDC assets (BTC, ETH, SOL, SUI, Tokenized Gold, Stocks, DeFi investments)

### 1.2 Balance Categories
**Available for Spending**: USDC balance that can be used for withdrawals, sends, transfers, buy and investments
**Invested Amount**: Value of all cryptocurrency, tokenized assets and DeFi investments
**Asset Tracking**: Individual tracking of each asset type with FIAT values

## 2. Authentication System

### 2.1 Sign Up/Sign In
**Primary Provider**: Main authentication service with failover backup
**Supported Methods**:
  - OAuth: Google, X (Twitter), Apple
  - Email/Password
  - Web3: MetaMask, Phantom wallet integration

### 2.2 Wallet Creation
**Auto-generation**: 4 non-custodial wallets created during signup
**Supported Chains**: BTC, ETH Layer 1, SOL, SUI
  - Create SOL wallet 1st, then keep creating the others
**User Experience**: Single unified "diBoaS wallet" interface
**Provider**: 3rd party wallet creation service

## 3. Implemented Transaction Types

### 3.1 Add/Deposit (On-Ramp) ✅
**Purpose**: Convert fiat to crypto and add to diBoaS wallet
**Provider**: 3rd party payment service provider

**Payment Methods**:
  - Credit/Debit Card, Bank Account, Apple Pay, Google Pay, PayPal
  - Availability depends on 3rd party Provider geo-location allowance 

**Money Flow**:
  - From = selected payment method (transaction amount)
  - To = diBoaS wallet Available Balance (transaction amount - fees)

**Balance Impact**:
  - Available Balance = current + (transaction amount - fees)
  - Invested Balance = current (no change)

**Technical Details**:
  - **Default Chain**: Solana
  - **Assets**: Small SOL amount (gas fees) + remainder in USDC
  - **Minimum**: $10
  - **Validation**: Requires payment method selection
  - **KYC**: Handled by 3rd party on-ramp provider
  - **Balance Check**: Not required (external payment source)

**Fee Structure**:
  - **diBoaS fee**: 0.09% of fiat transaction amount
  - **Network fee**: Solana network fee, comes from Payment Provider
    - 0.001% (mockup service for now) - NO minimum applied
  - **Provider fees**: Variable by payment method (comes from Payment Provider):
    - Apple Pay: 0.5%, Google Pay: 0.5% (mockup service for now)
    - Credit Card: 1%, Bank: 1% (mockup service for now)
    - PayPal: 3% (mockup service for now)

### 3.2 Withdraw (Off-Ramp) ✅
**Purpose**: Convert crypto to fiat and withdraw from diBoaS wallet
**Provider**: 3rd party payment service provider

**Output Methods**:
  - Credit/Debit Card, Bank Account, Apple Pay, Google Pay, PayPal
  - Availability depends on 3rd party Provider geo-location allowance

**Money Flow**:
  - From = diBoaS wallet Available Balance (transaction amount)
  - To = selected payment method (transaction amount - fees) 

**Balance Impact**:
  - Available Balance = current - transaction amount
  - Invested Balance = current (no change)

**Technical Details**:
  - **Default Chain**: Solana
  - **Assets**: USDC → Fiat
  - **Minimum**: $5
  - **Validation**: Requires payment method selection and sufficient available balance
  - **KYC**: Handled by 3rd party off-ramp provider
  - **Balance Check**: Available balance only (cannot use invested funds)
  
**Fee Structure**:
  - **diBoaS fee**: 0.9% of fiat transaction amount
  - **Network fee**: Solana network fee, comes from Payment Provider
    - 0.001% (mockup service for now) - NO minimum applied
  - **Provider fees**: Variable by payment method (comes from Payment Provider):
    - Apple Pay: 1%, Google Pay: 1% (mockup service for now)
    - Credit Card: 2%, Bank: 2% (mockup service for now)
    - PayPal: 4% (mockup service for now)

### 3.3 Send (P2P Transfer) ✅
**Purpose**: On-chain transfers between diBoaS users
**Provider**: Market Data Provider

**Output Methods**:
  - diBoaS wallet Available Balance

**Money Flow**:
  - From = diBoaS wallet Available Balance (transaction amount)
  - To = another user diBoaS wallet Available Balance, selected before the transaction (transaction amount - fees)

**Balance Impact**:
  - Available Balance = current - transaction amount
  - Invested Balance = current (no change)

**Technical Details**:
  - **Chain**: Solana
  - **Assets**: Small SOL (gas) + remainder in USDC
  - **Minimum**: $5
  - **Validation**: Requires valid user input selection and sufficient available balance
  - **KYC**: not applicable
  - **Balance Check**: Available balance only (cannot use invested funds)
  - **User Input**: diBoaS username (@username format) + amount
  - **Warning**: Irreversible transaction warning displayed

**Fee Structure**:
  - **diBoaS fee**: 0.09% of fiat transaction amount
  - **Network fee**: Solana Network Fee (comes from Market Data Provider)
    - 0.001% (mockup service for now) - NO minimum applied
  - **Provider fee**: $0 (P2P transaction)

### 3.4 Transfer (External Wallet) ✅
**Purpose**: Send to external wallet addresses on supported networks
**Provider**: Market Data Provider + 3rd party DEX, Swap and Bridging providers

**Output Methods**:
  - diBoaS wallet Available Balance

**Money Flow**:
  - From = diBoaS wallet Available Balance (transaction amount)
  - To = external wallet address, selected before the transaction (transaction amount - fees)

**Balance Impact**:
  - Available Balance = current - transaction amount
  - Invested Balance = current (no change)

**Supported Networks & Address Formats**:
  - **Bitcoin (BTC)**: Legacy (starts with 1), SegWit (starts with 3), Bech32 (starts with bc1)
  - **Ethereum (ETH)**: starts with 0x, 42 characters total. It will also support Arbitrum and Base in the future
  - **Solana (SOL)**: Base58-encoded, 32-44 characters
  - **Sui (SUI)**: Starts with 0x, 66 characters total (64 hex chars)

**Technical Details**:
  - **Chain - Network Detection**: Auto-detected from recipient address format
  - **Assets**: Small SOL (gas) + remainder in USDC
  - **Minimum**: $5
  - **Validation**: Strict address format validation, unsupported addresses show "Invalid Chain" and sufficient available balance
  - **KYC**: not applicable
  - **Balance Check**: Available balance only (cannot use invested funds)
  - **User Input**: External wallet address + amount
  - **Warning**: Irreversible operation warning displayed
  - **Ethereum Specific Case**: as layer 1, arbitrum and base have the same wallet address format, for the moment, all transfers will always go to Ethereum Layer 1

**Fee Structure**:
  - **diBoaS fee**: 0.9% of fiat transaction amount
  - **Network fee**: Based on detected network, comes from Market Data Provider (NO minimums applied):
    - BTC: 9%, ETH: 0.5%, SOL: 0.001%, SUI: 0.003% (mockup service for now)
  - **Provider fee**: comes from 3rd party DEX, Swap and Bridging providers
    - 0.8% for supported networks (mockup service for now)
    - $0 for invalid addresses

### 3.5 Buy Assets ✅
**Purpose**: Purchase cryptocurrency assets with fiat or diBoaS wallet balance
**Provider**: Market Data Provider + 3rd party payment service provider and 3rd party DEX, Swap and Bridging providers

**Payment Methods**:
  - **External On-Ramp**: Credit/Debit Card, Bank Account, Apple Pay, Google Pay, PayPal
    - Availability depends on 3rd party Provider geo-location allowance 
  - **Internal On-Chain**: diBoaS Wallet (using available balance)
  
**Money Flow**:
  - **External On-Ramp**:
    - From = selected payment method (transaction amount)
    - To = diBoaS wallet Invested Balance (transaction amount - fees)
  - **Internal On-Chain**:
    - From = diBoaS Wallet Available Balance (transaction amount)
    - To = diBoaS wallet Invested Balance (transaction amount - fees)

**Balance Impact**:
  - **Buy On-Ramp** (external payment methods):
    - Available Balance = current (no change)
    - Invested Balance = current + (transaction amount - fees)
  - **Buy On-Chain** (diBoaS wallet):
    - Available Balance = current - transaction amount
    - Invested Balance = current + (transaction amount - fees)

**Technical Details**:
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

**Fee Structure**:
  - **diBoaS fee**: 0.09% of fiat transaction amount
  - **Network fee**: Based on selected asset comes from Market Data Provider (NO minimums):
    - BTC: 9%, ETH: 0.5%, SOL: 0.001%, SUI: 0.003% (mockup service for now)
  - **Payment fee**: For external payments, varies by method (same as Add transaction)
  - **DEX fee**: only for On-Chain transactions, comes from DEX, Swap, Bridge provider
    - 1% (mockup service for now)

### 3.6 Sell Assets ✅
**Purpose**: Convert cryptocurrency assets to USDC
**Provider**: Market Data Provider + 3rd party DEX, Swap and Bridging providers

**Payment Methods**:
  - diBoaS Wallet (automatically selected, no user selection needed)

**Money Flow**:
    - From = diBoaS wallet Invested Balance (transaction amount)
    - To = diBoaS wallet Available Balance (transaction amount - fees)

**Balance Impact**:
- Available Balance = current + (transaction amount - fees)
- Invested Balance = current - transaction amount

**Technical Details**:
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

**Fee Structure**:
  - **diBoaS fee**: 0.09% of fiat transaction amount
  - **Network fee**: Based on asset being sold, comes from Market Data Provider (NO minimums):
    - BTC: 9%, ETH: 0.5%, SOL: 0.001%, SUI: 0.003% (mockup service for now)
  - **DEX fee**: comes from the 3rd party DEX, Swap and Bridging Provider
    - 1% for all Sell transactions (mockup service for now)

### 3.7 Receive/Request ❌
**Status**: PERMANENTLY REMOVED
**Reason**: Removed from transaction types to streamline user experience. Users can receive funds through Send transactions from other diBoaS users or external transfers to their wallet addresses.

### 3.8 Invest ⏸️
**Status**: NOT YET IMPLEMENTED
**Plan**: Future implementation for tokenized assets (Gold, Stocks, Real Estate) and DeFi Strategies

## 4. Fee Calculation System

### 4.1 Network Fees
**Source** - it comes from 3rd parties, sometimes from Market Data Provider other times from Payment Providers
**NO MINIMUM FEES APPLIED** - Users pay exactly the amount retrieved from the 3rd party providers.
**Mockup Service For Now**
  - **BTC**: 9% of transaction amount
  - **ETH**: 0.5% of transaction amount
  - **SOL**: 0.001% of transaction amount
  - **SUI**: 0.003% of transaction amount

### 4.2 diBoaS Fees
**0.09%** for: Add, Send, Buy, Sell, DeFi investments
**0.9%** for: Withdraw, Transfer

### 4.3 Payment Provider Fees
**On/Off-Ramp (Add/Withdraw)**: Comes from 3rd Party Payment providers
**Mockup Service For Now**
  - Apple Pay: Add 0.5%, Withdraw 1%
  - Credit Card/Bank: Add 1%, Withdraw 2%
  - Google Pay: Add 0.5%, Withdraw 1%
  - PayPal: Add 3%, Withdraw 4%

**DEX Fees (Buy/Sell)**: Comes from 3rd Party Payment providers
**Mockup Service For Now**
  - o.8% DEX fee for all Transfer transactions that are not using SOLANA wallets
  - 1% DEX fee for all Buy/Sell transactions
  - Additional Payment Provider Fees if using external payment methods for Buy

### 4.4 Fee Display Structure
**Formatting Standards**:
  - All fee amounts display exactly 2 decimal places using `.toFixed(2)`
  - Expandable fee breakdown showing each component
  - Real-time calculation updates as user inputs change
  - Consistent currency formatting across all displays
**Buy Transactions**:
  - **Payment Fee**: Only for external payment methods
  - **DEX Fee**: only when buying using diBoaS wallet
  - **Network Fee**: Based on selected asset's chain

**Sell Transactions**:
  - **DEX Fee**: 1% applied to all assets (uses diBoaS Wallet automatically)
  - **Network Fee**: Based on asset being sold
  - **Payment Method**: Automatically uses diBoaS Wallet (hidden from user interface)

**Other Transactions**:
  - **Provider Fee**: Combined provider costs
  - **Network Fee**: Based on transaction chain

### 4.5 Real-time Fee Calculation
**Total**: Always Transaction Amount - All Fees (consistent across all transactions)
**Real-time**: Fees calculate when transaction amount + required fields are filled or changed
**Breakdown**: Expandable details showing each fee component
**Cache**: Fees cached by transaction parameters including recipient address

## 5. Transaction Validation

### 5.1 Enhanced Button State Management
Transaction button is disabled until ALL required fields are filled and validated:
- **Add**: Transaction Amount + Payment Method
- **Withdraw**: Transaction Amount + Payment Method + Sufficient Available Balance
- **Send**: Transaction Amount + Recipient + Sufficient Available Balance  
- **Transfer**: Transaction Amount + Valid Address + Sufficient Available Balance
- **Buy On-Ramp**: Transaction Amount + Asset + External Payment Method
- **Buy On-Chain**: Transaction Amount + Asset + diBoaS Wallet + Sufficient Available Balance
- **Sell**: Transaction Amount + Asset + Sufficient Invested Balance (payment method auto-selected)

**Real-time Balance Validation**:
- Transaction button automatically disabled when amount exceeds available balance
- Immediate feedback when insufficient funds detected
- Separate validation for Available Balance (Send/Transfer/Withdraw) vs Invested Balance (Sell)
- Enhanced validation checks run on every input change

### 5.2 Balance Validation Logic
**Available Balance**: USDC only, used for spending transactions, buying assets and DeFi Inevstments
**Invested Balance**: All non-USDC assets, used for selling transactions and DeFi Strategies
**Strict Enforcement**: 
  - Withdraw, Send, Transfer cannot exceed available balance
  - Buy On-Chain cannot exceed available balance
  - Sell cannot exceed invested balance for specific asset
**Error Messages**: Clear feedback when limits exceeded
**Real-time**: Validation updates as user types

### 5.3 Address Validation (Transfer)
**Strict Format Checking**: Only accepts specified formats
**Supported Networks**: BTC, ETH layer 1, SOL, SUI (Arbitrum and Base will be added in the future)
**Invalid Handling**: Shows "Invalid Chain" for unsupported addresses
**Error Messages**: Lists supported networks in error feedback

## 6. User Experience Features

### 6.1 Enhanced Transaction Progress
**Progressive Loading**: Step-by-step progress with visual indicators
**Minimum Display Time**: 3 seconds to show progress properly
**Enhanced Confirmation Screen**: Shows detailed from/to information
  - **Dynamic From/To Fields**: Automatically generated based on transaction type
  - **Add**: From Payment Method → To diBoaS Wallet Available Balance
  - **Withdraw**: From diBoaS Wallet Available Balance → To Payment Method
  - **Send**: From diBoaS Wallet Available Balance → To Another diBoaS User
  - **Transfer**: From diBoaS Wallet Available Balance → To External Wallet
  - **Buy**: From Payment Method/diBoaS Wallet → To diBoaS Wallet Invested Balance
  - **Sell**: From diBoaS Wallet Invested Balance → To diBoaS Wallet Available Balance
**Success Summary**: Shows transaction details and updated balance
  - Waits for On-Chain Success confirmation
**Not Yet Summary**: Shows after 3 seconds if no success/error
  - Mentions transaction is ongoing, funds deposited when succeeded
  - Returns to dashboard after 3 seconds
  - Mockup timing: 2 seconds (5 seconds for BTC)
**Error Handling**: Clear error messages with retry options
  - Waits for On-Chain Error confirmation

### 6.2 Irreversible Transaction Warnings
**Send Transactions**: Warning about accuracy of recipient information
**Transfer Transactions**: Warning about external wallet address accuracy
**UI Treatment**: Amber warning boxes with alert icons

### 6.3 Real-time Updates
**Fee Calculation**: Updates when transaction amount or payment method changes
**Network Detection**: Transfer fees update when address changes
**Balance Display**: Shows available vs invested amounts
**Validation**: Real-time form validation with error states

### 6.4 UI Improvements
- **Input Styling**: Removed browser default arrows from number inputs
- **Amount Buttons**: Quick select buttons (25%, 50%, 75%, Max) for applicable transactions
- **Single-Click Flow**: Streamlined transaction execution
- **Payment Method Ordering**: diBoaS Wallet listed first when applicable
- **Enhanced Navigation**: 
  - Back button returns to `/app` dashboard instead of home page
  - View All link in Recent Activity navigates to Account page
  - Consistent navigation flow across all transaction types
- **Real-time Updates**:
  - Transaction history updates automatically in Account page
  - Cross-tab synchronization via localStorage events
  - Same-tab updates via custom event listeners
  - Balance refresh triggered on transaction completion

## 7. Technical Implementation

### 7.1 Multi-Chain Architecture
**Unified Balance**: Single view across BTC, ETH Layer 1, SOL, SUI wallets
**Background Operations**: Swap/bridge operations hidden from user
**Chain Selection**: Automatic based on transaction type and target

### 7.2 Fee Calculation Engine
**Real-time**: Calculates fees as user inputs data
**Caching**: Prevents duplicate calculations for same parameters
**Network Detection**: Dynamic fee calculation based on detected networks
**No Minimums**: Exact percentage calculations without artificial floors
**Separate Fee Types**: Payment fees and DEX fees calculated separately
**UI Treatment**:: show fees with 3 decimals rounding the last number.
  - For fees with many decimals use 0.0numberdecimalsFIRSTTWONUMBERS_AFTER_0

### 7.3 Balance Management System
**Centralized DataManager**: Single source of truth for balance state
**Event-driven Updates**: Real-time balance updates across components
**Proper Financial Flow**: Strict separation between available and invested funds
**Asset Tracking**: Individual asset amounts and FIAT values

### 7.4 Validation System
**Comprehensive**: Checks all required fields for each transaction type
**Balance Aware**: Understands available vs invested fund restrictions
**Address Format**: Strict validation of external wallet addresses
**User Feedback**: Clear error messages and disabled states

## 8. Security Features

### 8.1 Two-Factor Authentication (2FA)
**Scope**: Transaction verification for large amounts
**Provider**: 3rd party 2FA service
**Status**: Optional (user-enabled)
**Triggers**: High-value transactions (>$100 for withdraw/transfer/send)

### 8.2 Transaction Security
**Non-custodial**: User maintains control of private keys
**Irreversible Warnings**: Clear warnings for external transfers
**Balance Protection**: Cannot access invested funds for spending transactions
**Address Validation**: Prevents transfers to unsupported networks

## 9. On-Chain Connection and Transaction Status

### 9.1 Funds and On-Chain Transaction Status
**Scope**: On-Chain Transaction Status validation before transfering funds
  - **diBoaS fees**: Only deposit diBoaS fees when the transaction returns Success from On-Chain Transaction status
    - **diBoaS deposit account**: it will be a wallet address on Solana network to receive the fees
  - **user's funds**: Only update the Available Balance or Invested Balance as well as the asset list or DeFi Investments after the On-Chain success message
  - **On-Chain transaction link** add the transaction link into the transaction history together with the transaction data, not only for successful transactions, but also for failed transactions
    - For failed transaction do NOT change the funds o the Available Balance or Invested Balance and add an information that the funds were not changed in the transaction history with the data of the failed transaction
  - **P.S.:** For now there should be a mockup service simulating this On-Chain answer
    - taking 2 seconds for all transactions and assets except for BTC this should take 5 seconds to send the successful message

## 10. Development Status

### 10.1 Removed Features ❌
- **Receive/Request**: Permanently removed from transaction types
  - Replaced by direct Send functionality between diBoaS users
  - External receives handled through wallet address transfers
  - Streamlined UI by removing redundant transaction type

### 10.2 Future Implementation ⏸️
- Invest (tokenized assets)
- Advanced 2FA integration
- Real third-party provider integration
- KYC/AML compliance flows

## 11. Integration Points

### 11.1 Current Simulation
All transactions currently use mock implementations that:
- Calculate realistic fees with proper separation
- Update demo balance data with correct financial flow
- Show proper progress flows with minimum display times
- Validate user inputs with balance-aware restrictions

### 11.2 Current on-chain transaction links mockup
BTC mockup links:
account link = https://mempool.space/address/bc1q8ys49pxp3c6um7enemwdkl4ud5fwwg2rpdegxu
transaction link = https://mempool.space/tx/bd2e7c74f5701c96673b16ecdc33d01d3e93574c81e869e715a78ff4698a556a

ETH mockup links:
account link = https://etherscan.io/address/0xac893c187843a775c74de8a7dd4cf749e5a4e262
transaction link = https://etherscan.io/tx/0x2b21b80353ab6011a9b5df21db0a68755c2b787290e6250fdb4f8512d173f1e1

SOL mockup links:
account link = https://solscan.io/account/EgecX8HBapUxRW3otU4ES55WuygDDPSMMFSTCwfP57XR
transaction link = https://solscan.io/tx/3pW7WADA8ysmwgMngGgu9RYdXpSvNeLRM7ftbsDV52doC91Gcc7mrtkteCu6HPjnWu9HTV9mKo43PshbRUe4AgmP

SUI mockup links:
account link = https://suivision.xyz/account/0x7c3e1ad62f0ac85e1227cb7b3dfa123c03c8191f9c3fbac9548ded485c52e169?tab=Activity
transaction link = https://suivision.xyz/txblock/7r3zvFqvZNUavgXRVSp1uyaAoJvYCgP7CBSMZKRDyzQW

### 11.3 Future Integration
- Real payment provider APIs (On/Off-ramp)
- DEX integration for asset swapping
- Bridge services for cross-chain operations
- KYC/AML service integration
- Real-time price feeds for assets

## 12. Example of Chain and wallet addresses

### Accepted Chains and Wallet Addresses

### Bitcoin (BTC)  
-- Address Types: Legacy (starts with 1), SegWit (starts with 3), or Bech32 (starts with bc1).  
-- Example:  
--- Legacy: `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`  
--- Bech32: `bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq`  
-- Details: Bitcoin addresses are typically 26-35 characters long, derived from public keys using Base58Check (Legacy/SegWit) or Bech32 encoding. They're case-sensitive and include a checksum to prevent errors.

### Ethereum (ETH)
-- Address Format: Starts with `0x`, followed by 40 hexadecimal characters.  
-- Example: `0x71C7656EC7ab88b098defB751B7401B5f6d8976F`  
-- Details: Ethereum addresses are derived from the public key, always 42 characters long (including `0x`). They're used across Ethereum-compatible chains like Polygon or Arbitrum. Case-insensitive for hex characters.

### Arbitrum (ARB) - Near Future
-- Address Format: Ethereum-compatible, starts with `0x`, 42 characters.  
-- Example: `0x6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5`  
-- Details: Arbitrum, an Ethereum Layer 2, uses Ethereum's address format due to EVM compatibility.[](https://www.ledger.com/academy/topics/blockchain/what-is-a-crypto-wallet-address)

### Base (BASE) - Near Future
-- Address Format: Ethereum-compatible, starts with 0x, 42 characters.  
-- Example: 0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4  
-- Details: Base, an Ethereum Layer 2 developed by Coinbase, uses Ethereum's address format due to its EVM compatibility. This allows seamless use of the same wallet addresses as Ethereum mainnet and other EVM-compatible chains, with transactions and balances specific to the Base network.

### Solana (SOL)  
-- Address Format: Base58-encoded, 32-44 characters, no specific prefix.  
-- Example: `5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD`  
-- Details: Solana addresses are derived from Ed25519 public keys, making them compact and unique to the chain. They avoid certain characters (e.g., 0, O, I, l) to prevent confusion.

### Sui (SUI)
-- Address Format: Starts with 0x, followed by 64 hexadecimal characters (32 bytes), totaling 66 characters.  
-- Example: 0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2  
-- Details: Sui addresses are derived from cryptographic hashes or public keys in its Move-based blockchain, distinct from Ethereum despite the 0x prefix. They are 32-byte identifiers, case-insensitive for hexadecimal characters, and designed for Sui's object-oriented architecture, ensuring uniqueness and compatibility with its ecosystem.

### Invalid Chains or wallet addresses.
- Any other chain not listed inside the accepted chain list is invalid and may cause lost of funds. Some cases can be identified and blocked by the platform as Invalid Chain and Addresses such as:

### Tether (USDT)  
-- Address Format: Depends on the blockchain (e.g., TRON).  
--- On TRON: Starts with `T`, followed by 33 Base58 characters.  
-- Examples:  
--- TRON-based: `T9yD14Nj9j7xAB4dbGeiX9h8unkKLxmGkn`  
-- Details: USDT operates on multiple chains, so the address format matches the host blockchain's standard.

### BNB (Binance Coin)  
-- Address Format: On Binance Chain, uses a unique format starting with `bnb`.  
-- Examples:  
--- Binance Chain: `bnb1grpf0955h0ykzq3ar5nmum7y6srnml6urqyn6`  
-- Details: Binance Chain uses a distinct Bech32-like format

### XRP (Ripple)  
-- Address Format: Starts with `r`, followed by 25-35 Base58 characters.  
-- Example: `r3KMH8y4q49bF2hK7r4f7aT8j9j8k6k7j9`  
-- Details: XRP addresses include a checksum and are case-sensitive. They often include a destination tag (a separate number) for specific transactions.

### Cardano (ADA)  
-- Address Format: Shelley addresses start with `addr1`, Bech32-encoded, ~100 characters.  
-- Example: `addr1q9ld4z3v5v9k0v6k0v6k0v6k0v6k0v6k0v6k0v6k0v6k0v6k0v6k0`  
-- Details: Cardano uses long addresses to support staking and delegation features, with Bech32 encoding for error

### TRON (TRX)  
-- Address Format: Starts with `T`, 34 Base58 characters.  
-- Example: `TQ5pHn7H9Vz3kB7h8t8t8t8t8t8t8t8t8t`  
-- Details: Similar to Bitcoin's Base58Check but unique to TRON's blockchain, used for TRX and TRC-20 tokens like USDT.

### Avalanche (AVAX)  
-- Address Format: X-Chain uses `X-avax...`.  
-- Examples:  
--- X-Chain: `X-avax1qr4k3m9n4k3m9n4k3m9n4k3m9n4k3m9n4k3`  
-- Details: X-Chain uses a custom format for native transactions.

### Polkadot (DOT)  
-- Address Format: Starts with `1`, 47-48 characters, SS58-encoded (Polkadot-specific).  
-- Example: `1FRMM8PEiWXYax7rpS5iK3v7r1m9m2b3c4d5e6f7g8h9i0j1k2`  
-- Details: Polkadot uses the SS58 format, which supports multiple networks in its ecosystem (e.g., Kusama starts with `2`). Addresses are derived from public keys and include a network identifier.

### Bitcoin Cash (BCH)  
-- Address Format: Legacy starts with `1` or `3`; CashAddr starts with `bitcoincash:q` or `p`, ~34 characters.  
-- Example: `bitcoincash:qpzry9x8gf2tvdw0s3jn54khce6mua7lcw0v3f8k9`  
-- Details: Bitcoin Cash forked from Bitcoin, so legacy addresses resemble Bitcoin's. The CashAddr format is unique, using Bech32-like encoding for clarity and error detection.

### NEAR Protocol (NEAR)  
-- Address Format: Implicit (hex, 64 characters) or named (e.g., `username.near`).  
-- Example:  
--- Hex: `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2`  
--- Named: `example.near`  
-- Details: NEAR supports human-readable accounts or cryptographic addresses. Named addresses are tied to the NEAR account system, while implicit addresses are raw public keys.

### Aptos (APT)  
-- Address Format: Starts with `0x`, 64 characters (32 bytes in hex).  
-- Example: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`  
-- Details: Aptos uses a 32-byte address format, similar to Ethereum but longer, derived from public keys for its Move-based blockchain.

### Hedera (HBAR)  
-- Address Format: Numeric format like `0.0.123456` (shard.realm.account).  
-- Example: `0.0.987654`  
-- Details: Hedera's unique account ID format reflects its hashgraph structure, with shard, realm, and account numbers. Not derived from public keys like most chains.

### Cronos (CRO)  
-- Address Format: Starts with `cro`, Bech32-encoded, ~44 characters.  
-- Example: `cro1y3z9x8gf2tvdw0s3jn54khce6mua7lcw0v3f8k9`  
-- Details: Cronos, built by Crypto.com, uses a Cosmos-compatible Bech32 format. Addresses are unique to its chain but follow Cosmos SDK conventions.

### Stellar (XLM)  
-- Address Format: Starts with `G`, 56 characters, Base32-encoded.  
-- Example: `GA7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6`  
-- Details: Stellar public keys (addresses) use StrKey encoding, starting with `G` for accounts. They include a checksum for error detection.

### Cosmos (ATOM)  
-- Address Format: Starts with `cosmos`, Bech32-encoded, ~44 characters.  
-- Example: `cosmos1x2y3z4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0`  
-- Details: Cosmos uses Bech32 addresses, common across its ecosystem (e.g., Osmosis, Terra). The prefix indicates the chain, and addresses are derived from public keys.

### Dogecoin (DOGE)  
-- Address Format: Starts with `D`, 34 characters, Base58-encoded.  
-- Example: `D7aB8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5`  
-- Details: Dogecoin addresses are similar to Bitcoin's legacy format, using Base58Check. They're compatible with some Bitcoin forks due to shared origins.

### Litecoin (LTC)  
-- Address Format: Starts with `L`, `M`, or `ltc1` (SegWit), 26-35 characters.  
-- Example: `L9aB8C7D6E5F4A3B2C1D0E9F8A7B6C5D4E3F2A1`  
-- Details: Litecoin addresses resemble Bitcoin's, with legacy (L/M) or Bech32 (ltc1) formats. They use Base58Check or Bech32 encoding.

### Monero (XMR)  
-- Address Format: Starts with `4` or `8`, 95 characters, Base58-encoded.  
-- Example: `4AdUndXHHZ6cfufTMvppY6JwXNf2k6W7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3`  
-- Details: Monero's long addresses include a public spend key, public view key, and checksum, designed for privacy-focused transactions.

### Tezos (XTZ)  
-- Address Format: Starts with `tz1`, `tz2`, or `tz3`, 36 characters, Base58Check.  
-- Example: `tz1Y2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f`  
-- Details: Tezos addresses vary by key type (tz1 for Ed25519, tz2 for Secp256k1, tz3 for P256). They include a checksum for validation.

### Algorand (ALGO)  
-- Address Format: 58 characters, Base32-encoded, no specific prefix.  
-- Example: `Y2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0`  
-- Details: Algorand addresses are derived from public keys, using a checksum to ensure accuracy. They're used for both accounts and assets.

### Filecoin (FIL)  
-- Address Format: Starts with `f1` (secp256k1) or `f3` (BLS), ~40 characters.  
-- Example: `f1y2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a`  
-- Details: Filecoin's addresses reflect its dual key types, with prefixes indicating the cryptographic algorithm used.

### Kusama (KSM)  
-- Address Format: Starts with `H` (or other letters for other networks), 47-48 characters, SS58-encoded.  
-- Example: `H2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4`  
-- Details: Kusama, Polkadot's sister chain, uses SS58 encoding with a different prefix (e.g., `H` for Kusama). Addresses are interoperable with -Polkadot's format.