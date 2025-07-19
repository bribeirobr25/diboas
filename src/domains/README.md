# OneFi Domain Architecture Implementation

This directory implements Domain-Driven Design for the OneFi platform, separating Traditional Finance, Crypto, and DeFi concerns.

## 📁 Directory Structure

```
domains/
├── shared/                    # Shared Kernel (common across all domains)
│   ├── entities/             # User, Account, Portfolio (base)
│   ├── value-objects/        # Money, Currency, Address
│   ├── events/              # Base domain events
│   └── services/            # Cross-domain services
│
├── traditional-finance/       # Traditional Finance Bounded Context
│   ├── entities/             # BankAccount, Investment, CreditCard
│   ├── services/             # BankingService, PaymentService
│   ├── repositories/         # AccountRepository, TransactionRepository
│   └── events/              # FundsTransferred, PaymentProcessed
│
├── crypto/                   # Cryptocurrency Bounded Context
│   ├── entities/             # Wallet, CryptoAsset, Trade
│   ├── services/             # TradingService, CustodyService
│   ├── repositories/         # WalletRepository, TradeRepository
│   └── events/              # TradeExecuted, WalletConnected
│
└── defi/                     # DeFi Protocols Bounded Context
    ├── entities/             # LiquidityPool, YieldFarm, Stake
    ├── services/             # ProtocolService, YieldService
    ├── repositories/         # PoolRepository, StakeRepository
    └── events/              # PoolEntered, YieldHarvested
```

## 🏗️ Implementation Example

See individual domain README files for detailed implementation:
- [Shared Domain](./shared/README.md)
- [Traditional Finance](./traditional-finance/README.md)
- [Crypto Domain](./crypto/README.md)
- [DeFi Domain](./defi/README.md)