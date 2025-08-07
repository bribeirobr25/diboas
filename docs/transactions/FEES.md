# Fee System

Comprehensive fee calculation and display system for all transaction types.

## Fee Structure Overview

### diBoaS Fees
- **0.09%** for: Add, Send, Buy, Sell, Start/Launch, Stop
- **0.9%** for: Withdraw

### Network Fees
**Source**: 3rd parties - Payment Providers, DEX providers and DeFi providers
**NO MINIMUM FEES APPLIED**: Users pay exactly the amount retrieved from the 3rd party providers

**Mockup Service Values**:
- **BTC**: 1% of transaction amount
- **ETH**: 0.5% of transaction amount
- **SOL**: 0.0001% of transaction amount
- **SUI**: 0.0003% of transaction amount

### Payment Provider Fees (On/Off-Ramp)
**On/Off-Ramp (Add/Withdraw)**: Comes from 3rd Party Payment providers

**Mockup Service Values**:
- Apple Pay: 0.5%, Google Pay: 0.5%
- Credit Card: 1%, Bank: 1%
- PayPal: 3%

### DEX Fees
**DEX Fees**: Comes from 3rd Party DEX with Swap or Bridging operations

**Mockup Service Values**:
- 0.8% DEX fee for all transactions that has DEX fees and are not using SOLANA wallets
- For Solana wallets or chain, DEX fee = 0%

### DeFi Fees (Start and Stop transactions only)
**DeFi Fees**: Comes from 3rd Party DeFi providers

**Mockup Service Values**:
- 0.7% - For Solana providers
- 0.9% - For Sui providers
- 1.2% - For Ethereum Layer 1 providers
- 1.5% - For Bitcoin providers

## Fee Display Structure

### Formatting Standards
- All fee amounts display exactly 2 decimal places using `.toFixed(2)`
- Expandable fee breakdown showing each component
- Real-time calculation updates as user inputs change
- Consistent currency formatting across all displays

### Buy Transactions
- **Payment Fee**: Only for external payment methods
- **DEX Fee**: behavior and % as defined above
- **Network Fee**: Based on selected asset's chain

### Sell Transactions
- **DEX Fee**: behavior and % as defined above
- **Network Fee**: Based on selected asset's chain
- **Payment Method**: Automatically uses diBoaS Wallet (hidden from user interface)

### Start Strategy Transactions
- **DEX Fee**: behavior and % as defined above
- **DeFi Fee**: behavior and % as defined above
- **Network Fee**: Based on selected strategy chain
- **Payment Method**: Automatically uses diBoaS Wallet (hidden from user interface)

### Stop Transactions
- **DEX Fee**: behavior and % as defined above
- **DeFi Fee**: behavior and % as defined above
- **Network Fee**: Based on selected strategy chain
- **Payment Method**: Automatically uses diBoaS Wallet (hidden from user interface)

### Other Transactions
- **Provider Fee**: Combined provider costs
- **Network Fee**: Based on transaction chain

## Real-time Fee Calculation

### Calculation Logic
- **Total**: Always Transaction Amount - All Fees (consistent across all transactions)
- **Real-time**: Fees calculate when transaction amount + required fields are filled or changed
- **Breakdown**: Expandable details showing each fee component
- **Cache**: Fees cached by transaction parameters including recipient address

### Fee Calculation Engine
- **Real-time**: Calculates fees as user inputs data
- **Caching**: Prevents duplicate calculations for same parameters
- **Network Detection**: Dynamic fee calculation based on detected networks
- **No Minimums**: Exact percentage calculations without artificial floors
- **Separate Fee Types**: Payment fees and DEX fees calculated separately
- **UI Treatment**: show fees with 2 decimals rounding the last number

## On-Chain Status and Fee Collection

### Funds and On-Chain Transaction Status
**Scope**: On-Chain Transaction Status validation before transferring funds

- **diBoaS fees**: Only deposit diBoaS fees when the transaction returns Success from On-Chain Transaction status
  - **diBoaS deposit account**: wallet address on Solana network to receive the fees
- **user's funds**: Only update the Available Balance or Invested Balance as well as the asset list or Goal Strategies after the On-Chain success message
- **On-Chain transaction link**: add the transaction link into the transaction history together with the transaction data, not only for successful transactions, but also for failed transactions
  - For failed transaction do NOT change the funds on the Available Balance or Invested Balance and add an information that the funds were not changed in the transaction history with the data of the failed transaction
- **P.S.**: For now there should be a mockup service simulating this On-Chain answer
  - taking 2 seconds for all transactions and assets except for BTC this should take 5 seconds to send the successful message

## Transaction-Specific Fee Examples

### Add Transaction Fees
- diBoaS fee: 0.09%
- Network fee: 0.001% (mockup)
- Provider fees (mockup):
  - Apple Pay: 0.5%, Google Pay: 0.5%
  - Credit Card: 1%, Bank: 1%
  - PayPal: 3%

### Withdraw Transaction Fees
- diBoaS fee: 0.9%
- Network fee: Based on selected asset:
  - BTC: 1%, ETH: 0.5%, SOL: 0.0001%, SUI: 0.0005%
- Payment fee: For external payments:
  - Apple Pay: 3%, Google Pay: 3%
  - Credit Card: 2%, Bank: 2%
  - PayPal: 4%
- DEX fee: Only for On-Chain transactions: 0.8%

### Send Transaction Fees
- diBoaS fee: 0.09%
- Network fee: 0.0001% - NO minimum applied
- Provider fee: Not Applicable (P2P transaction)

### Investment Transaction Fees
- diBoaS fee: 0.09%
- Network fee: Based on selected asset
- Payment fee: For external payments (same as Add Transaction)
- DEX fee: Only for On-Chain transactions

### Strategy Transaction Fees
- diBoaS fee: 0.09%
- Network fee: Based on selected strategy's primary chain
- DEX fee: From DEX providers
- DeFi fee: From DeFi providers (varies by chain)