# diBoaS Transactions - Technical Requirements Document

## Overview
diBoaS Transactions will allow On/Off-Ramp and On/Off chain with multiple chains, swaps and briddging happening behind the scenes to keep the user experience easy and with no complexity. The wallet supports BTC, ETH L2, SOL, and SUI chains while presenting a single wallet view to users.

## 1. Authentication System

### 1.1 Sign Up/Sign In
- **Primary Provider**: Main authentication service with failover backup
- **Supported Methods**:
  - OAuth: Google, X (Twitter), Apple
  - Email/Password
  - Web3: Metamask, Phantom wallet integration

### 1.2 Wallet Creation
- **Auto-generation**: 4 non-custodial wallets created during signup
- **Supported Chains**: BTC, ETH L2, SOL, SUI
- **User Experience**: Single unified "diBoaS wallet" interface
- **Provider**: 3rd party wallet creation service

## 2. Core Transaction Types

### 2.1 Deposit/Add (On-Ramp)
**Purpose**: Convert fiat to crypto

**Payment Methods**:
- Bank account, Credit Card, Apple Pay, Google Pay, PayPal

**Technical Details**:
- **Default Chain**: Solana
- **Assets**: Small SOL amount (gas fees) + remainder in USDC
- **Minimum**: $10
- **KYC**: Handled by 3rd party on-ramp provider

**Fee Structure**:
- Network gas fees
- On-ramp provider fees  
- diBoaS fee: 0.09%

### 2.2 Withdraw (Off-Ramp)
**Purpose**: Convert crypto to fiat

**Output Methods**:
- Bank account, Credit Card, Apple Pay, Google Pay, PayPal

**Technical Details**:
- **Chain**: Solana (USDC → Fiat)
- **Currency**: USD, EUR, or user's geo-location currency
- **KYC**: Handled by 3rd party off-ramp provider

**Fee Structure**:
- Network gas fees
- Off-ramp provider fees
- diBoaS fee: 0.9%

### 2.3 Send/Receive (P2P Transfer)
**Purpose**: On-chain transfers between diBoaS users

**Technical Details**:
- **Chain**: Solana
- **Assets**: Small SOL (gas) + remainder in USDC
- **Auto-processing**: Background swapping/bridging from user's 4 wallets
- **User Input**: diBoaS username + amount

**Fee Structure**:
- Network gas fees
- Swap/bridge fees (if applicable)
- diBoaS fee: 0.09%

### 2.4 Transfer (External Wallet)
**Purpose**: Send to external wallet addresses

**Technical Details**:
- **Chain Selection**: Auto-detected from recipient address
- **Asset**: USDC on target chain
- **Auto-processing**: Background swapping/bridging
- **User Input**: External wallet address + amount
- **Warning**: Irreversible operation

**Fee Structure**:
- Network gas fees
- Swap/bridge fees (if applicable)
- diBoaS fee: 0.9%

### 2.5 Buy Assets
**Purpose**: Purchase cryptocurrency assets

**Supported Assets**:
- USDC, BTC, ETH, SOL, SUI

**Technical Details**:
- **Chain**: Asset-specific (BTC purchases use BTC chain, etc.)
- **Source**: User's diBoaS wallet balance
- **Storage**: Asset stored in corresponding chain wallet
- **User Input**: Asset selection + fiat amount

**Fee Structure**:
- Network gas fees
- Swap/bridge fees (if applicable)
- diBoaS fee: 0.09%

### 2.6 Sell Assets
**Purpose**: Convert cryptocurrency to USDC

**Technical Details**:
- **Output**: Always USDC on Solana chain
- **Gas Calculation**: Total asset - gas fees = sellable amount
- **Auto-processing**: Asset sale + bridge/swap to USDC/Solana
- **User Input**: Asset selection + amount to sell
- **Display**: USD value preview

**Fee Structure**:
- Network gas fees
- Swap/bridge fees (if applicable)
- diBoaS fee: 0.09%

### 2.7 Invest
**Purpose**: Purchase tokenized investment products

**Investment Categories**:
- Tokenized Gold
- Tokenized Stocks  
- Tokenized Real Estate

**Technical Details**:
- **Chain**: Solana
- **Providers**: 3rd party investment asset providers
- **Auto-processing**: Background swapping/bridging to Solana
- **User Input**: Category + specific asset + fiat amount

**Fee Structure**:
- Network gas fees
- Swap/bridge fees (if applicable)
- Investment provider fees
- diBoaS fee: 0.09%

## 3. Security Features

### 3.1 Two-Factor Authentication (2FA)
- **Scope**: Transaction verification
- **Provider**: 3rd party 2FA service
- **Status**: Optional (user-enabled)

## 4. Technical Requirements

### 4.1 Multi-Chain Abstraction
- Unified balance display across 4 chains
- Background swap/bridge operations
- Automatic chain selection based on transaction type

### 4.2 Third-Party Integrations
- Authentication providers
- Wallet creation service
- On/off-ramp providers
- DEX/swap services
- Bridge services
- Investment asset providers
- 2FA service

### 4.3 User Experience
- Simplified technical complexity
- Clear fee breakdowns before transaction confirmation
- Real-time USD value displays
- Irreversible transaction warnings

## 5. Implementation Phases

### Phase 1: Core Infrastructure
- Authentication system
- Wallet creation and management
- Basic UI/UX framework

### Phase 2: Transaction Simulation
- Mock implementations of all transaction types
- Fee calculation engine
- Transaction confirmation flows

### Phase 3: Third-Party Integration
- Real provider integrations
- KYC flow implementation
- Live transaction processing

### Phase 4: Advanced Features
- Investment products
- 2FA implementation
- Performance optimization

## 6. Development Considerations

### 6.1 Security
- Non-custodial wallet implementation
- Secure key management
- Transaction signing protocols

### 6.2 Compliance
- KYC/AML through third parties
- Regulatory compliance per jurisdiction
- Transaction reporting capabilities

### 6.3 Scalability
- Multi-chain architecture
- Efficient swap/bridge routing
- Gas optimization strategies



# Another way to introduce the transactions

## A) Sign up and Sign in
They will be done via a main provider plus a 2nd one used as failover. The provider will allow OAuth (Google, X and Apple), Email and Web3 options (linking Metamask and Phantom wallet to start with).

## B) Sign up and wallet creation
During the sign up process, another 3rd party provider will be responsible for creating 4 Non-Custodial wallets (BTC, ETH L2, SOL and SUI) behind the scenes. For the end user it will just be 1 wallet, called diBoaS wallet. The diBoaS wallet will be simplifying technnical details from 4 different wallets and chains with a one single view for balances and even transactions.

## C) Transactions
Starting with a minimum of $10 users will be able to Deposit/Add, Send, Receive/Request, Transfer, Buy, Sell, Withdraw or Invest

### C.1. Deposit/Add
depositing or adding money is an On-Ramp transaction (converting fiat into crypto) where users can bring money via Bank account, Credit Card, Apple Pay, Google Pay or PayPal. This will always use Solana chain adding a small amount in SOL to cover future gas fees and the rest in USDC. The On-ramp will be done via a 3rd party integration. For now we just need to simulate the steps. Also any KYC will be managed by the On-Ramp 3rd party provider. The users will pay the network gas fee, the On-Ramp provider fees and diBoaS fee that in this case is 0.09%. Those fees have to be clearly shown to the user before he confirms the transaction

### C.2. Withdraw
withdrawing money is an Off-Ramp transaction (converting crypto into fiat) where users can their diBoaS wallet balance into Bank account, Credit Card, Apple Pay, Google Pay or PayPal. This will always use Solana chain converting USDC to USD or Euro or the currency from the user geo-location. The Off-ramp will be done via a 3rd party integration. For now we just need to simulate the steps. Also any KYC will be managed by the Off-Ramp 3rd party provider. The users will pay the network gas fee, the Off-Ramp provider fees and diBoaS fee that in this case is 0.9%. Those fees have to be clearly shown to the user before he confirms the transaction

### C.3 Send or Receive/Request
sending or receiving/requesting money is a fully On-Chain transactions. These transactions will always use Solana chain letting a small amount of SOL to cover future gas fees and the rest is sent or received in USDC. If any swap or bridging is nedded this will happen in the background, completely transparent to the user. The platform will check if there is a need to Swap or Bridge assets from the 4 user's wallet into the Solana. For now we just need to simulate the steps. No KYC necessary. The users will just add the diBoaS user name from the user they want to send or receive/request money, the value and that is it. The users will pay the network gas fee, and any Swap or Bridging fees from the 3rd party providers, if that is the case, and diBoaS fee that in this case is 0.09%. Those fees have to be clearly shown to the user before he confirms the transaction

### C.4. Transfer
transfering money is a fully On-Chain transaction. However different from sending or receiving/requesting it transfer money from diBoaS wallet to an external wallet. These transactions will use the chain related to the wallet address the transfer is going. If the wallet address the money is going is a Solana, then the platform will use Solana, if it is Ethereum address then the platform will use Ethereum and so on. Again the money will be sent in USDC. If any swap or bridging is nedded this will happen in the background, completely transparent to the user. The platform will check if there is a need to Swap or Bridge assets from the 4 user's wallet into the address to receiver the funds chain. For now we just need to simulate the steps. No KYC necessary. The users will just add the external wallet address, the value and a clear warning saying the operation can not be reverted. The users will pay the network gas fee, and any Swap or Bridging fees from the 3rd party providers, if that is the case, and diBoaS fee that in this case is 0.9%. Those fees have to be clearly shown to the user before he confirms the transaction

### C.5. Buy
buying assets is fully On-Chain transactions. This transactions will use the chain depending on the asset the user is buying. If the user wants to buy BTC, then the funds will come from the user's diBoaS wallet and the BTC wallet behind the scenes. Then, after purchasing the asset, it will go into the diBoaS user wallet BTC wallet behind the scenes, keeping the asset as it is in the right chain. The platform will check if there is a need to Swap or Bridge assets from the 4 user's wallet into the wallet that is needed for the buying to happen. For now we just need to simulate the steps. No KYC necessary. The users will just select the asset to buy from the options (USDC, BTC, ETH, SOL and SUI) add the value in fiat he wants to buy and that is it. The users will pay the network gas fee, and any Swap or Bridging fees from the 3rd party providers, if that is the case, and diBoaS fee that in this case is 0.09%. Those fees have to be clearly shown to the user before he confirms the transaction

### C.6. Sell
selling assets is fully On-Chain transactions. This transactions will always sell and bridge or swap the sold asset into USDC on Solana chain. If the user wants to sell BTC, then the funds will come from the user's diBoaS wallet and the BTC wallet behind the scenes selling all the BTC. Important to remember that the BTC sold has to take into consideration the Total BTC into the users wallet minus the BTC needed to pay for the gas fee. Then, after selling the asset, it will make a briding and swaping to USDC into Solana chain and deposit this value into the user's diBoaS wallet, going into the Solana wallet behind the scenes. The platform will check if there is a need to Swap or Bridge assets from the 4 user's wallet into the wallet that will receive the money after selling the asset. For now we just need to simulate the steps. No KYC necessary. The users will just select the asset to sell from the assets he has inside his wallet add the amount he wants to sell. A value in USD will be shown of how much the user will receive after selling. The users will pay the network gas fee, and any Swap or Bridging fees from the 3rd party providers, if that is the case, and diBoaS fee that in this case is 0.09%. Those fees have to be clearly shown to the user before he confirms the transaction.

### C.7. Invest
investing is a fully On-Chain transaction. This transactions will use Solana chain and help the user to purchase Tokenized Gold, Tokenized Stocks and tokenized Real State options. All available via 3rd party providers on Solana chain. The platform will check if there is a need to Swap or Bridge assets from the 4 user's wallet into the Solana wallet that is needed for the investing to happen. For now we just need to simulate the steps. No KYC necessary. The users will just select the category of investiment, the asset the value in fiat he wants to invest and that is it. The users will pay the network gas fee, and any Swap or Bridging fees from the 3rd party providers and Investment Asset Providers, if that is the case, and diBoaS fee that in this case is 0.09%. Those fees have to be clearly shown to the user before he confirms the transaction

### Fee Calculation Structure
All transactions will always have the following fees: network chain fee + diBoaS fee + payment provider fee (for On/Off-Ramp transaction) + On-Chain providers fees (swap, bridging, DeFi...)

#### diBoaS Fee Structure
- **0.09%** for all transactions except Transfer and Withdraw  
- **0.9%** for Transfer and Withdraw transactions

#### Payment Provider Fees (On/Off-Ramp)
On/Off-Ramp transaction fees depend on the payment method selected:
- **Apple Pay**: On-Ramp (Deposit/Add) 0.5%, Off-Ramp (Withdraw) 1%
- **Credit Card/Bank**: On-Ramp 1%, Off-Ramp 2%
- **PayPal**: On-Ramp 0.8%, Off-Ramp 1.5%
- **Google Pay**: On-Ramp 0.6%, Off-Ramp 1.2%

#### On-Chain Provider Fees
For On-Chain providers, fees include swap, bridging and specific DeFi platform fees:
- **Swap fees**: 0.1-0.3% depending on liquidity
- **Bridge fees**: $2-10 + 0.05% depending on chains
- **DeFi platform fees**: Variable by protocol

## 8. User Experience Flow Requirements

### 8.1 Transaction Page Initial State
1. **Transaction Type**: Selected from previous page (Add, Send, Invest) should open as selected by default
2. **Payment Method**: No selection by default - user must choose
3. **Fees**: Display $0 by default until payment method is selected

### 8.2 Fee Calculation Behavior
1. **Real-time Updates**: Fees update immediately when user selects transaction type + payment method
2. **Fee Display**: Total fee with expandable "See Details" link
3. **Detailed Breakdown**: Shows Payment Provider fees + Network fees + diBoaS fee
4. **Transaction Total**: Amount - All Fees = Total received/sent

### 8.3 Transaction Confirmation Flow
1. **Provider Connection**: Connect with proper 3rd party provider (On/Off-Ramp or On-Chain)
2. **Parameter Passing**: Transaction type, amount, payment method, chain selection
3. **Execution**: Process transaction and update user account balance
4. **Progress Display**: Show progress messages during execution (similar to signup flow)
5. **Result**: Success message with updated balance OR error message with failure reason

### 8.4 Progress States
- **Connecting**: "Connecting to payment provider..."
- **Processing**: "Processing your transaction..."  
- **Confirming**: "Confirming on blockchain..."
- **Success**: "Transaction completed! Balance updated."
- **Error**: "Transaction failed: [specific reason]"

## diBoaS single wallet Balance view
The diBoaS wallet seen by users will always show a combined balance from all the 4 behind the scenes wallet (BTC, ETH L2, SOL and SUI)
After all transactions are complete and the behind the scenes wallets are updated the diBoaS single view wallet balance is updated showing the up to date information to the user

## 2 FA
The user can enable 2FA for transactions. This will also be managed by a 3rd party providers.