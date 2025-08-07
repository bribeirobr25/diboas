# Multi-Balance Wallet Platform - Technical Implementation Guide

## Executive Summary

This document provides technical implementation guidance for a multi-balance wallet platform built on Domain-Driven Design (DDD) and Event-Driven Architecture (EDA) principles. The platform manages three distinct balance types (Available, Invested, Strategy) with comprehensive transaction flows across Banking, Investing, and Goal Strategy categories.

## Part I: Domain Model & Bounded Contexts

### Core Bounded Contexts

#### 1. **Wallet Context**
**Purpose**: Manages user wallet balances and balance transitions

**Aggregates**:
- `UserWallet` (Root Aggregate)
  - `AvailableBalance` (USDC on SOL)
  - `InvestedBalance` (BTC, ETH, SOL, SUI)
  - `StrategyBalance` (DeFi positions)

**Domain Rules**:
- Balance transfers must be atomic across balance types
- Insufficient balance checks before any transaction initiation
- Balance reservations during transaction processing
- Automatic balance reconciliation after transaction completion

**Key Value Objects**:
- `Balance(amount, asset, chain)`
- `WalletAddress(address, chain)`
- `AssetAmount(value, decimals, symbol)`

#### 2. **Transaction Context**
**Purpose**: Orchestrates transaction lifecycles and state management

**Aggregates**:
- `Transaction` (Root Aggregate)
  - `TransactionState`
  - `TransactionSteps[]`
  - `ProviderInteractions[]`
  - `ErrorRecoveryAttempts[]`

**Domain Rules**:
- Transaction state transitions follow strict business rules
- Failed transactions must not result in fund loss
- All provider interactions must be idempotent
- Transaction history immutability

**Key Value Objects**:
- `TransactionId`
- `TransactionAmount(value, sourceAsset, targetAsset)`
- `TransactionFee(amount, asset, provider)`
- `UserAction(type, timestamp, approval)`

#### 3. **Provider Integration Context**
**Purpose**: Manages external provider interactions and failover

**Aggregates**:
- `ProviderRegistry` (Root Aggregate)
  - `OnRampProvider`
  - `OffRampProvider`
  - `DEXProvider`
  - `DeFiProvider`

**Domain Rules**:
- Provider health monitoring and automatic failover
- Rate limiting and circuit breaker patterns
- Provider response validation and security checks
- Cost optimization through provider selection

#### 4. **Compliance Context**
**Purpose**: Handles regulatory requirements and risk management

**Aggregates**:
- `UserCompliance` (Root Aggregate)
  - `KYCStatus`
  - `AMLScreening`
  - `TransactionLimits`
  - `GeographicRestrictions`

**Domain Rules**:
- KYC verification before high-value transactions
- Real-time AML screening for all fund movements
- Dynamic transaction limits based on risk assessment
- Jurisdiction-specific compliance rules

## Part II: Event Architecture & Flow Patterns

### Event Categories

#### 1. **Command Events** (User Intent)
- `InitiateDepositCommand`
- `InitiateSendCommand`
- `InitiateWithdrawCommand`
- `InitiateBuyCommand`
- `InitiateSellCommand`
- `InitiateStrategyLaunchCommand`
- `InitiateStrategyStopCommand`

#### 2. **Domain Events** (State Changes)
- `TransactionInitiated`
- `BalanceReserved`
- `ProviderSelected`
- `PaymentMethodAuthorized`
- `BlockchainTransactionBroadcast`
- `TransactionConfirmed`
- `BalanceUpdated`
- `TransactionCompleted`
- `TransactionFailed`

#### 3. **Integration Events** (External System Interactions)
- `OnRampPaymentRequested`
- `OffRampWithdrawalRequested`
- `DEXSwapRequested`
- `DeFiStrategyLaunched`
- `ProviderResponseReceived`
- `BlockchainConfirmationReceived`

### Event Flow Patterns by Transaction Type

#### Banking - Add/Deposit Transaction Flow

**Event Sequence**:
1. `InitiateDepositCommand` → `DepositTransactionInitiated`
2. `DepositTransactionInitiated` → `PaymentMethodValidationRequested`
3. `PaymentMethodValidated` → `OnRampProviderSelected`
4. `OnRampProviderSelected` → `FiatPaymentRequested`
5. `FiatPaymentConfirmed` → `USDCConversionRequested`
6. `USDCConversionCompleted` → `AvailableBalanceUpdateRequested`
7. `AvailableBalanceUpdated` → `DepositTransactionCompleted`

**Compensation Events** (on failure):
- `FiatPaymentRefunded`
- `BalanceReservationReleased`
- `DepositTransactionFailed`

#### Banking - Send Transaction Flow

**Event Sequence**:
1. `InitiateSendCommand` → `SendTransactionInitiated`
2. `SendTransactionInitiated` → `RecipientValidated`
3. `RecipientValidated` → `AvailableBalanceReserved`
4. `AvailableBalanceReserved` → `SolanaTransferRequested`
5. `SolanaTransferBroadcast` → `SolanaTransferConfirmed`
6. `SolanaTransferConfirmed` → `RecipientBalanceUpdated`
7. `RecipientBalanceUpdated` → `SendTransactionCompleted`

#### Banking - Withdraw Transaction Flow

**External Wallet Withdraw**:
1. `InitiateWithdrawCommand` → `WithdrawTransactionInitiated`
2. `WithdrawTransactionInitiated` → `ExternalWalletValidated`
3. `ExternalWalletValidated` → `AvailableBalanceReserved`
4. `AvailableBalanceReserved` → `DEXProviderSelected`
5. `DEXProviderSelected` → `AssetConversionRequested`
6. `AssetConversionCompleted` → `CrossChainTransferRequested`
7. `CrossChainTransferConfirmed` → `WithdrawTransactionCompleted`

**Off-Ramp Withdraw**:
1. `InitiateWithdrawCommand` → `WithdrawTransactionInitiated`
2. `WithdrawTransactionInitiated` → `OffRampProviderSelected`
3. `OffRampProviderSelected` → `AvailableBalanceReserved`
4. `AvailableBalanceReserved` → `USDCToFiatConversionRequested`
5. `USDCToFiatConversionCompleted` → `FiatTransferRequested`
6. `FiatTransferConfirmed` → `WithdrawTransactionCompleted`

#### Invest - Buy Transaction Flow

**On-Chain Buy**:
1. `InitiateBuyCommand` → `BuyTransactionInitiated`
2. `BuyTransactionInitiated` → `AvailableBalanceReserved`
3. `AvailableBalanceReserved` → `DEXProviderSelected`
4. `DEXProviderSelected` → `AssetSwapRequested`
5. `AssetSwapCompleted` → `InvestedBalanceUpdated`
6. `InvestedBalanceUpdated` → `BuyTransactionCompleted`

**On-Ramp Buy**:
1. `InitiateBuyCommand` → `BuyTransactionInitiated`
2. `BuyTransactionInitiated` → `OnRampProviderSelected`
3. `OnRampProviderSelected` → `FiatPaymentRequested`
4. `FiatPaymentConfirmed` → `DirectAssetPurchaseRequested`
5. `DirectAssetPurchaseCompleted` → `InvestedBalanceUpdated`
6. `InvestedBalanceUpdated` → `BuyTransactionCompleted`

#### Goal Strategy - Launch/Stop Transaction Flow

**Strategy Launch**:
1. `InitiateStrategyLaunchCommand` → `StrategyLaunchInitiated`
2. `StrategyLaunchInitiated` → `AvailableBalanceReserved`
3. `AvailableBalanceReserved` → `DeFiProviderSelected`
4. `DeFiProviderSelected` → `RequiredAssetSwapRequested`
5. `RequiredAssetSwapCompleted` → `DeFiStrategyDeployRequested`
6. `DeFiStrategyDeployed` → `StrategyBalanceUpdated`
7. `StrategyBalanceUpdated` → `StrategyLaunchCompleted`

**Strategy Stop**:
1. `InitiateStrategyStopCommand` → `StrategyStopInitiated`
2. `StrategyStopInitiated` → `DeFiStrategyWithdrawRequested`
3. `DeFiStrategyWithdrawn` → `AssetToUSDCSwapRequested`
4. `AssetToUSDCSwapCompleted` → `AvailableBalanceUpdated`
5. `AvailableBalanceUpdated` → `StrategyStopCompleted`

## Part III: Transaction State Management

### Universal State Machine

#### Primary States
- `INITIATED` - Transaction command received and validated
- `BALANCE_RESERVED` - Funds locked for transaction processing
- `PROVIDER_SELECTED` - Optimal provider chosen for transaction
- `PROVIDER_PROCESSING` - External provider handling transaction
- `BLOCKCHAIN_PENDING` - On-chain transaction submitted and pending
- `BLOCKCHAIN_CONFIRMED` - On-chain transaction confirmed
- `BALANCE_UPDATED` - Wallet balances updated
- `COMPLETED` - Transaction fully processed
- `FAILED` - Transaction failed permanently
- `COMPENSATING` - Running compensation for failed transaction

#### Sub-States (Context Dependent)

**Payment Processing Sub-States**:
- `PAYMENT_METHOD_AUTHORIZING`
- `FIAT_PAYMENT_PENDING`
- `FIAT_PAYMENT_CONFIRMED`
- `CONVERSION_PENDING`
- `CONVERSION_COMPLETED`

**Blockchain Transaction Sub-States**:
- `TRANSACTION_BUILDING`
- `TRANSACTION_SIGNING`
- `TRANSACTION_BROADCASTING`
- `MEMPOOL_PENDING`
- `BLOCK_CONFIRMATION_PENDING`
- `CONFIRMATION_COMPLETED`

**DEX/Bridge Sub-States**:
- `LIQUIDITY_CHECKING`
- `PRICE_QUOTING`
- `SLIPPAGE_VALIDATING`
- `SWAP_EXECUTING`
- `BRIDGE_INITIALIZING`
- `BRIDGE_CONFIRMING`

**DeFi Strategy Sub-States**:
- `STRATEGY_VALIDATING`
- `ASSET_PREPARATION`
- `PROTOCOL_CONNECTING`
- `POSITION_OPENING`
- `POSITION_MONITORING`
- `POSITION_CLOSING`

### State Transition Rules

#### Valid State Transitions
```
INITIATED → [BALANCE_RESERVED, FAILED]
BALANCE_RESERVED → [PROVIDER_SELECTED, COMPENSATING]
PROVIDER_SELECTED → [PROVIDER_PROCESSING, PROVIDER_FAILOVER, COMPENSATING]
PROVIDER_PROCESSING → [BLOCKCHAIN_PENDING, BALANCE_UPDATED, PROVIDER_FAILOVER, COMPENSATING]
BLOCKCHAIN_PENDING → [BLOCKCHAIN_CONFIRMED, FAILED, COMPENSATING]
BLOCKCHAIN_CONFIRMED → [BALANCE_UPDATED, COMPENSATING]
BALANCE_UPDATED → [COMPLETED]
COMPENSATING → [FAILED, COMPLETED]
```

#### Forbidden Transitions
- Direct jumps to `COMPLETED` without balance updates
- `FAILED` to any state except through manual intervention
- `COMPLETED` to any other state (terminal)

### Transaction Step Orchestration

#### Step Types
- **Validation Step**: Input validation, compliance checks
- **Reservation Step**: Balance locking, resource allocation
- **Provider Step**: External system interaction
- **Blockchain Step**: On-chain transaction execution
- **Update Step**: Balance and state updates
- **Notification Step**: User and system notifications

#### Step Dependencies
- Each step defines prerequisites and success criteria
- Failed steps trigger specific compensation strategies
- Parallel steps where possible (e.g., validation + provider selection)
- Sequential steps where order matters (e.g., reserve → process → update)

## Part IV: Error Handling & Compensation Patterns

### Error Classification

#### Temporary Errors (Retry Eligible)
- Network timeouts
- Provider rate limiting
- Blockchain congestion
- Insufficient gas fees
- Mempool rejection

#### Permanent Errors (Immediate Failure)
- Insufficient balance
- Invalid recipient address
- Compliance violation
- Unsupported asset/chain
- Provider rejection

#### User Action Required
- Additional KYC verification
- High slippage confirmation
- Transaction timeout extension
- Payment method update
- Strategy parameter adjustment

### Compensation Strategies

#### Balance Compensation
- **Reservation Release**: Unlock reserved funds on failure
- **Partial Completion**: Handle cases where some steps succeeded
- **Double-Spend Prevention**: Ensure funds not counted twice
- **Audit Trail**: Track all balance changes for reconciliation

#### Provider Compensation
- **Refund Processing**: Handle fiat payment reversals
- **Failed Swap Recovery**: Retrieve assets from failed DEX operations
- **Strategy Exit**: Emergency exit from DeFi positions
- **Cross-Chain Recovery**: Handle bridge failures

#### Notification Compensation
- **Failure Notifications**: Clear error messages to users
- **Status Corrections**: Update incorrect transaction states
- **Recovery Instructions**: Guide users through resolution steps

### Saga Pattern Implementation

#### Choreography-Based Sagas (Preferred for Simple Flows)
- Each service publishes events and listens for responses
- Self-contained compensation logic in each service
- Suitable for linear transaction flows

#### Orchestration-Based Sagas (Complex Flows)
- Central saga orchestrator manages transaction flow
- Handles complex compensation scenarios
- Better for multi-provider, multi-step transactions

## Part V: Provider Integration Architecture

### Provider Abstraction Layer

#### Interface Definitions
- **OnRampProvider**: `initiateFiatToCrypto()`, `checkPaymentStatus()`, `cancelPayment()`
- **OffRampProvider**: `initiateCryptoToFiat()`, `checkWithdrawalStatus()`, `cancelWithdrawal()`
- **DEXProvider**: `getQuote()`, `executeSwap()`, `checkSwapStatus()`, `executeBridge()`
- **DeFiProvider**: `deployStrategy()`, `getStrategyStatus()`, `withdrawFromStrategy()`

#### Provider Selection Strategy
- **Cost Optimization**: Choose providers with lowest fees
- **Speed Optimization**: Prioritize fastest execution times
- **Reliability Scoring**: Based on historical success rates
- **Geographic Preference**: Local providers for compliance
- **User Preference**: Allow user to select preferred providers

#### Failover Mechanisms
- **Automatic Failover**: Switch to backup provider on failure
- **Circuit Breaker**: Temporarily disable failing providers
- **Health Monitoring**: Continuous provider performance tracking
- **Manual Override**: Admin ability to disable/enable providers

### Provider Communication Patterns

#### Synchronous Patterns (Real-time)
- Initial request/response for quotes and validations
- Immediate error responses for invalid requests
- Status checks for quick operations

#### Asynchronous Patterns (Long-running)
- Webhook notifications for transaction updates
- Polling mechanisms for status checks
- Event-driven updates for blockchain confirmations

#### Idempotency Handling
- Unique request IDs for all provider calls
- Duplicate request detection and handling
- Safe retry mechanisms without double processing

## Part VI: Balance Management Architecture

### Balance Types & Transitions

#### Available Balance (USDC on SOL)
- **Sources**: Deposits, sell transactions, strategy withdrawals
- **Uses**: Sends, withdrawals, buy transactions, strategy launches
- **Constraints**: Must maintain minimum balance for transaction fees
- **Reconciliation**: Real-time with Solana network

#### Invested Balance (BTC, ETH, SOL, SUI)
- **Sources**: Buy transactions (on-chain and on-ramp)
- **Uses**: Sell transactions, external withdrawals
- **Constraints**: Asset-specific minimum amounts
- **Reconciliation**: Multi-chain balance verification

#### Strategy Balance (DeFi Positions)
- **Sources**: Strategy launches from available balance
- **Uses**: Strategy stops to available balance
- **Constraints**: Provider-specific lock periods and minimum amounts
- **Reconciliation**: DeFi protocol position tracking

### Balance Reservation System

#### Reservation Lifecycle
1. **Pre-Transaction**: Lock funds before processing
2. **During Processing**: Maintain lock during provider interactions
3. **Completion**: Release lock and update actual balances
4. **Failure**: Release lock without balance changes

#### Reservation Types
- **Hard Reservation**: Funds completely unavailable
- **Soft Reservation**: Funds marked but still visible
- **Partial Reservation**: Reserve portion for fees, keep rest available

### Balance Reconciliation

#### Real-time Reconciliation
- Compare platform balances with on-chain data
- Alert on discrepancies above threshold
- Automatic correction for minor differences

#### Batch Reconciliation
- Daily full balance verification
- Historical transaction replay for audit
- Provider balance confirmation

## Part VII: User Experience & Communication

### Status Communication Strategy

#### User-Facing Status Messages
- **Simple Language**: Avoid technical jargon
- **Progress Indicators**: Show completion percentage where possible
- **Time Estimates**: Provide realistic completion timeframes
- **Next Steps**: Clear instructions for user actions

#### Status Message Categories
- **Informational**: "Your transaction is being processed"
- **Warning**: "High network fees detected, continue?"
- **Error**: "Transaction failed - insufficient balance"
- **Success**: "$100 successfully added to your wallet"

#### Real-time Updates
- **WebSocket Connections**: Live status updates
- **Push Notifications**: Important status changes
- **Email Notifications**: Transaction confirmations and failures
- **In-app Notifications**: Timeline of transaction progress

### Error Message Framework

#### Error Message Structure
- **What Happened**: Clear description of the issue
- **Why It Happened**: Context about the cause
- **What To Do**: Actionable next steps
- **Alternative Options**: Other ways to achieve the goal

#### Error Severity Levels
- **Critical**: Immediate attention required, funds at risk
- **High**: Transaction failed, user action needed
- **Medium**: Warning about potential issues
- **Low**: Information about minor delays or issues

## Part VIII: Transaction History & Activity Tracking

### Historical Data Requirements

#### Transaction Records
- **Immutable Log**: All transaction attempts and outcomes
- **Complete Audit Trail**: Every state change and provider interaction
- **User Activity**: All user actions and approvals
- **Provider Responses**: Full provider communication history

#### Data Retention
- **Legal Requirements**: Compliance-driven retention periods
- **User Access**: Historical data available to users
- **Analytics**: Transaction pattern analysis
- **Debugging**: Technical troubleshooting data

### Activity Classification

#### Recent Activities (Last 30 Days)
- All completed transactions
- Failed transactions with resolution status
- Pending transactions with current status
- Balance changes and their sources

#### Transaction History (All Time)
- Paginated view of all user transactions
- Filterable by type, status, amount, date
- Searchable by transaction ID or description
- Exportable for user records

## Part IX: Monitoring & Observability

### Key Performance Indicators (KPIs)

#### Transaction Metrics
- **Success Rate**: Percentage of completed transactions by type
- **Average Processing Time**: From initiation to completion
- **Error Rate**: Failures by error type and cause
- **User Abandonment**: Incomplete transaction rates

#### Business Metrics
- **Transaction Volume**: Daily/monthly transaction amounts
- **User Engagement**: Active users by transaction type
- **Provider Performance**: Success rates by provider
- **Revenue Metrics**: Fees collected by transaction type

#### Technical Metrics
- **System Performance**: Response times and throughput
- **Provider Latency**: Response times from external providers
- **Blockchain Performance**: Confirmation times and gas costs
- **Error Distribution**: Most common failure points

### Alerting Strategy

#### Critical Alerts (Immediate Response)
- High transaction failure rates
- Provider outages affecting user transactions
- Security incidents or suspicious activity
- Fund discrepancies or balance mismatches

#### Warning Alerts (Within Hours)
- Elevated error rates for specific transaction types
- Provider performance degradation
- High blockchain fees or congestion
- Unusual transaction patterns

#### Information Alerts (Daily Review)
- Transaction volume anomalies
- New error types or patterns
- Provider cost optimization opportunities
- User experience issues

## Part X: Implementation Roadmap

### Phase 1: Core Infrastructure (Weeks 1-4)
- Domain model implementation
- Event architecture setup
- Basic transaction state machine
- Provider abstraction layer

### Phase 2: Banking Transactions (Weeks 5-8)
- Add/Deposit transaction flow
- Send transaction implementation
- Withdraw transaction flows
- Balance management system

### Phase 3: Investment Transactions (Weeks 9-12)
- Buy transaction flows (on-chain and on-ramp)
- Sell transaction implementation
- DEX provider integration
- Multi-asset balance management

### Phase 4: Strategy Transactions (Weeks 13-16)
- DeFi provider integration
- Strategy launch/stop flows
- Position monitoring and management
- Advanced error handling

### Phase 5: Advanced Features (Weeks 17-20)
- Comprehensive monitoring dashboard
- Advanced error recovery
- Performance optimization
- User experience enhancements

### Phase 6: Production Readiness (Weeks 21-24)
- Load testing and optimization
- Security audit and hardening
- Compliance verification
- Documentation and training

## Conclusion

This implementation guide provides a comprehensive framework for building a multi-balance wallet platform using Domain-Driven Design and Event-Driven Architecture. The architecture ensures:

- **Fund Safety**: No transaction should result in fund loss
- **User Experience**: Clear communication and error handling
- **Scalability**: Event-driven architecture supports growth
- **Maintainability**: Domain-driven design ensures code quality
- **Reliability**: Comprehensive error handling and compensation
- **Compliance**: Built-in regulatory requirement support

The technical team should focus on implementing the bounded contexts as separate microservices, with clear event contracts between them. The saga pattern ensures transaction consistency across services, while the provider abstraction layer enables easy integration with multiple external services.

---

**Document Version**: 1.0  
**Target Architecture**: Domain-Driven Design + Event-Driven Architecture  
**Primary Asset**: USDC on Solana  
**Transaction Categories**: Banking, Investing, Goal Strategy  
**Provider Types**: On-Ramp, Off-Ramp, DEX, DeFi