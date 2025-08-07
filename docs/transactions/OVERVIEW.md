# Transaction System Overview

diBoaS Transactions enable seamless On/Off-Ramp and multi-chain operations with complex swap and bridging operations hidden from users. The system presents a unified wallet experience while supporting BTC, ETH Layer 1, SOL, and SUI chains behind the scenes.

## Transaction Categories

diBoaS has 3 main categories allowing users to easily deal with Financial solutions:

### 1. Banking Category (Add, Send and Withdraw Transactions)
This is the category allowing users to perform bank like operations: Add/Deposit Money, Send and Withdraw. This category is the entry point and facilitator by allowing On/Off-Ramp as well as On-Chain transactions.

### 2. Investing Category (Buy and Sell Transactions)
This is the category allowing users to easily invest into Crypto, Stocks, Gold, Indexes and Real State Funds with quick and simple Buy and Sell transactions. This category is fully On-Chain as all assets are tokenized assets.

### 3. Goal Strategies (Create, Start and Stop objective driven strategies)
This is the category allowing users to create, start/launch and stop Goal Strategies to grow their wealth and get consistent yielding via DeFi. Goal Strategies use a goal-oriented approach where each strategy is designed around specific financial objectives like Emergency Fund, Dream Vacation, or Custom Goals.

## Balance System

### Balance Structure
- **Total Balance**: Available Balance + Invested Balance + Strategy Balance
- **Available Balance**: USDC only (liquid funds ready for spending)
- **Invested Balance**: All non-USDC assets (BTC, ETH, SOL, SUI, Tokenized Gold, Stocks, Goal Strategies)
- **Strategy Balance**: All non-USDC assets used inside Goal Strategy and connected to DeFi platforms including the Yield and PNL information

### Balance Categories
- **Available Amount**: USDC on Solana chain that can be used for sends, withdrawals, buy assets and launch Goal Strategies
- **Invested Amount**: value of all cryptocurrency and tokenized assets bought by the user. In this case should also exist an Asset Tracking
- **Strategy Amount**: value of all launched Goal Strategy including updating Yield and PNL. In this case should also exist an Strategy Tracking

## Transaction Flow

| Category | Operations | From Balance | To Balance |
|----------|------------|--------------|------------|
| **Banking** | Add | External → Available |
| **Banking** | Send | Available → Available (P2P) |
| **Banking** | Withdraw | Available → External |
| **Investing** | Buy | Available/External → Invested |
| **Investing** | Sell | Invested → Available |
| **Strategies** | Start | Available → Strategy |
| **Strategies** | Stop | Strategy → Available |

## Navigation Flow

```
App Dashboard → Transaction Categories → Transaction Pages → Progress → Success/Error
     ↑              ↓                      ↓              ↓           ↓
Portfolio Overview → Category Selection → Transaction Config → Processing → Balance Update
```

## Related Documentation

- [Banking Operations](./BANKING.md) - Add, Send, Withdraw transactions
- [Investment Operations](./INVESTMENTS.md) - Buy, Sell assets  
- [Goal Strategies](./STRATEGIES.md) - Automated investment strategies
- [Fee System](./FEES.md) - Fee calculations and structures
- [Validation System](./VALIDATION.md) - Transaction validation rules