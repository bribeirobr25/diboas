# Transaction Validation System

Comprehensive validation rules and balance management for all transaction types.

## Enhanced Button State Management

Transaction button is disabled until ALL required fields are filled and validated:

### Required Fields by Transaction Type
- **Add**: Transaction Amount + Payment Method
- **Withdraw**: Transaction Amount + Payment Method + Sufficient Available Balance AND Valid Address (in case of external wallet)
- **Send**: Transaction Amount + Recipient + Sufficient Available Balance  
- **Buy On-Ramp**: Transaction Amount + Asset + External Payment Method
- **Buy On-Chain**: Transaction Amount + Asset + diBoaS Wallet + Sufficient Available Balance
- **Sell**: Transaction Amount + Asset + diBoaS wallet method auto-selected
- **Start Strategy**: all objective driven strategy fields filled and selected + diBoaS wallet method auto-selected + Sufficient Available Balance
- **Stop Strategy**: strategy is active + strategy is identified in the Strategy Balance + all funds related to the strategy will be withdraw + send money to diBoaS wallet method auto-selected at Available Balance

### Real-time Balance Validation
- Transaction button automatically disabled when amount exceeds available balance
- Immediate feedback when insufficient funds detected
- Separate validation for Available Balance (Send/Withdraw) vs Invested Balance (Sell) vs Strategy Balance (Stop)
- Enhanced validation checks run on every input change

## Balance Validation Logic

### Balance Types and Usage
- **Available Balance**: USDC only, used for spending transactions, buying assets and Goal Strategies
- **Invested Balance**: All non-USDC assets, used for selling transactions and Start Goal Strategies
- **Strategy Balance**: Assets deployed in active goal strategies

### Strict Enforcement Rules
- Withdraw, Send cannot exceed available balance
- Buy On-Chain cannot exceed available balance
- Sell cannot exceed invested balance for specific asset
- Start On-Chain cannot exceed available balance
- Stop cannot exceed strategy balance for specific strategy

### Error Messages
- Clear feedback when limits exceeded
- Real-time validation updates as user types
- Specific error messages for each validation type

## Address Validation (Transfer)

### Supported Networks
- **BTC**: Legacy (starts with 1), SegWit (starts with 3), or Bech32 (starts with bc1)
- **ETH**: Starts with 0x, 42 characters
- **SOL**: Base58-encoded, 32-44 characters, no specific prefix
- **SUI**: Starts with 0x, 66 characters (64 hex + 0x prefix)

### Validation Rules
- **Strict Format Checking**: Only accepts specified formats
- **Invalid Handling**: Shows "Invalid Chain" for unsupported addresses
- **Error Messages**: Lists supported networks in error feedback

### Example Valid Addresses

#### Bitcoin (BTC)
- Legacy: `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`
- Bech32: `bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq`

#### Ethereum (ETH)
- Standard: `0x71C7656EC7ab88b098defB751B7401B5f6d8976F`

#### Solana (SOL)
- Standard: `5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD`

#### Sui (SUI)
- Standard: `0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2`

### Invalid Chain Examples

Networks that will show "Invalid Chain" error:
- **USDT on TRON**: `T9yD14Nj9j7xAB4dbGeiX9h8unkKLxmGkn`
- **BNB**: `bnb1grpf0955h0ykzq3ar5nmum7y6srnml6urqyn6`
- **XRP**: `r3KMH8y4q49bF2hK7r4f7aT8j9j8k6k7j9`
- **Cardano**: `addr1q9ld4z3v5v9k0v6k0v6k0v6k0v6k0v6k0v6k0v6k0v6k0v6k0v6k0`
- **TRON**: `TQ5pHn7H9Vz3kB7h8t8t8t8t8t8t8t8t8t`
- **Avalanche**: `X-avax1qr4k3m9n4k3m9n4k3m9n4k3m9n4k3m9n4k3`
- **Polkadot**: `1FRMM8PEiWXYax7rpS5iK3v7r1m9m2b3c4d5e6f7g8h9i0j1k2`
- **Bitcoin Cash**: `bitcoincash:qpzry9x8gf2tvdw0s3jn54khce6mua7lcw0v3f8k9`

## Balance Management System

### Centralized DataManager
- Single source of truth for balance state
- Event-driven updates across components
- Real-time balance updates
- Proper financial flow separation

### Financial Flow Validation
- **Available → Invested**: Buy transactions (On-Chain)
- **Invested → Available**: Sell transactions
- **Available → Strategy**: Start goal strategies
- **Strategy → Available**: Stop goal strategies
- **External → Available**: Add transactions
- **Available → External**: Withdraw, Send transactions

### Asset Tracking
- Individual asset amounts and FIAT values
- Separate tracking for each balance type
- Real-time price updates for valuation
- Historical balance changes

## User Feedback System

### Validation States
- **Valid**: Green checkmarks, enabled buttons
- **Invalid**: Red error messages, disabled buttons
- **Loading**: Loading spinners during validation
- **Warning**: Amber warnings for risky operations

### Error Message Categories
- **Insufficient Funds**: Balance-specific error messages
- **Invalid Format**: Address format validation errors
- **Missing Fields**: Required field validation
- **Network Errors**: Chain detection failures
- **Amount Limits**: Minimum/maximum amount violations

### Real-time Feedback
- Immediate validation on input change
- Progressive disclosure of validation errors
- Clear recovery instructions
- Contextual help text

## Security Features

### Transaction Security
- Non-custodial wallet control
- Irreversible warnings for external transfers
- Balance protection (cannot access invested funds for spending transactions)
- Address validation prevents transfers to unsupported networks

### Validation Timing
- Client-side validation for immediate feedback
- Server-side validation for security
- On-chain validation before final execution
- Post-transaction verification