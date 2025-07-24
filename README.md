# diBoaS - OneFi Platform

## Overview

diBoaS is a comprehensive FinTech web platform that unifies Traditional Finance with Decentralized Finance (DeFi) through an innovative "OneFi" approach. The platform is designed with a user-centric, minimalist, and mobile-first philosophy to make finance as easy as buying coffee.

## Platform Concept

### The OneFi Vision
diBoaS bridges the gap between traditional financial services and decentralized finance, addressing key market opportunities:

- **5+ Billion FinTech users worldwide** - Only 560 million have tried crypto
- **560 Million crypto users** - Only 5 million actively use DeFi
- **Target**: Increase DeFi adoption from 5M to 560M users

### Key Problems Addressed
1. **Lack of financial education**
2. **Investment complexity**
3. **Fear of losing money and lack of knowledge about opportunity cost**
4. **Crypto perceived as scam or risky asset**
5. **Crypto and DeFi technical entry barriers**

## Design Philosophy

### User-Centric Approach
- **Maximum 3 clicks** for any action
- **1-click transactions** (+ selection and agreement)
- All complexity handled in the background
- Intuitive mobile-first interface

### Brand Identity
- **Primary Color**: #1E40AF (diBoaS blue)
- **Secondary Color**: #06B6D4 (accent cyan)
- **Success**: #10B981 (green)
- **Warning**: #F59E0B (orange)
- **Error**: #EF4444 (red)
- **Neutral**: #6B7280 (gray)
- **Background**: #F9FAFB (light gray)

## Features

### Core Transactions (1-Click)
- **Add** - Add funds to your account via various payment methods
- **Buy** - Purchase cryptocurrency and tokenized assets  
- **Sell** - Liquidate holdings back to available balance
- **Send** - Transfer funds to other diBoaS users
- **Transfer** - Send to external wallet addresses
- **Withdraw** - Cash out to bank account or payment method

### Educational System
The platform features friendly mascots for gamified financial education:

1. **Financial Basics Mascot** - Teaches fundamental personal finance concepts
2. **Investment Guide Mascot** - Explains investment strategies and risk management  
3. **Crypto & DeFi Mascot** - Demystifies blockchain and decentralized finance

### Unified Finance Interface
- **Traditional Finance**: Banking, cards, investments, loans
- **DeFi Integration**: Crypto wallets, staking, yield farming, cross-chain transactions
- Seamless switching between traditional and decentralized finance

## Technical Implementation

### Technology Stack
- **Frontend**: React 19 with Vite
- **Styling**: Tailwind CSS with custom diBoaS theme
- **Components**: shadcn/ui component library  
- **Icons**: Lucide React icons
- **Animations**: Framer Motion (available)
- **State Management**: Centralized DataManager pattern
- **Transaction Engine**: Multi-chain abstraction layer

### Architecture
- **Multi-Chain Support**: BTC, ETH Layer 1, SOL, SUI
- **Real-time Fee Calculation**: Dynamic fee calculation with caching
- **Balance Management**: Segregated Available vs Invested balances
- **Transaction Validation**: Comprehensive validation system
- **Progress Tracking**: Step-by-step transaction progress

### Mobile-First Design
- Responsive design optimized for mobile devices
- Touch-friendly interactions  
- Progressive enhancement for desktop
- Accessible navigation and controls

### Custom Styling System
The codebase uses a semantic CSS class naming system for maintainability:

#### Layout Components
- `.main-layout` - Main page wrapper
- `.content-container` - Centered content wrapper
- `.page-header` - Sticky header component
- `.hero-section` - Landing page hero

#### Card Components  
- `.main-card` - Standard content card
- `.balance-card` - Balance display card with gradient
- `.feature-card` - Feature highlight card
- `.transaction-card` - Transaction list items

#### Button System
- `.primary-button` - Primary action buttons
- `.secondary-button` - Secondary action buttons  
- `.cta-button` - Call-to-action buttons
- `.transaction-action-button` - Transaction type selectors
- `.quick-action-button` - Dashboard quick actions

#### Input System
- `.main-input` - Standard form inputs
- `.amount-input` - Large amount entry fields
- `.search-input` - Search form inputs

#### Navigation
- `.main-navigation` - Header navigation
- `.nav-links` - Navigation link container
- `.nav-link` - Individual navigation items

## File Structure

```
diboas/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── shared/                # Shared components
│   │   │   ├── PageHeader.jsx
│   │   │   ├── TransactionProgressScreen.jsx
│   │   │   ├── LoadingScreen.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── LandingPage.jsx        # Marketing landing page
│   │   ├── AppDashboard.jsx       # Main app dashboard
│   │   ├── TransactionPage.jsx    # Transaction interface
│   │   ├── AccountView.jsx        # Account management
│   │   ├── TransactionHistory.jsx # Transaction history
│   │   └── AuthPage.jsx           # Authentication
│   ├── hooks/
│   │   ├── useTransactions.jsx    # Transaction system hooks
│   │   ├── useIntegrations.jsx    # Integration management
│   │   └── useFeatureFlags.jsx    # Feature flag system
│   ├── services/
│   │   ├── DataManager.js         # Centralized state management
│   │   ├── transactions/
│   │   │   ├── TransactionEngine.js
│   │   │   └── MultiWalletManager.js
│   │   └── integrations/
│   ├── utils/
│   │   ├── feeCalculations.js     # Fee calculation engine
│   │   ├── navigationHelpers.js   # Navigation utilities
│   │   └── security.js            # Security utilities
│   ├── assets/
│   │   ├── diboas-logo.png
│   │   ├── mascot-financial-basics.png
│   │   ├── mascot-investment-guide.png
│   │   └── mascot-crypto-defi.png
│   ├── App.jsx                    # Main application component
│   ├── App.css                    # Custom styles and brand theme
│   └── main.jsx                   # Entry point
├── docs/
│   └── TRANSACTIONS.md            # Transaction system documentation
├── public/
├── index.html
└── package.json
```

## Transaction System

### Balance Structure
- **Total Balance**: Available Balance + Invested Balance
- **Available Balance**: USDC only (liquid funds for spending)
- **Invested Balance**: All non-USDC assets (BTC, ETH, SOL, SUI, etc.)

### Transaction Types
1. **Add/Deposit** - On-ramp from fiat to crypto
2. **Withdraw** - Off-ramp from crypto to fiat
3. **Send** - P2P transfers between diBoaS users
4. **Transfer** - External wallet transfers
5. **Buy** - Purchase cryptocurrency assets
6. **Sell** - Convert crypto assets to USDC

### Fee Structure
- **diBoaS Fees**: 0.09% (most transactions), 0.9% (withdraw/transfer)
- **Network Fees**: Variable by chain (BTC: 9%, ETH: 0.5%, SOL: 0.001%, SUI: 0.003%)
- **Provider Fees**: Variable by payment method (On-ramp/Off-ramp providers)
- **DEX Fees**: 1% for buy/sell transactions

### Validation System
- **Minimum Amounts**: $5 (Send), $10 (others)
- **Balance Validation**: Strict separation of available vs invested funds
- **Address Validation**: Support for BTC, ETH, SOL, SUI address formats
- **Real-time Validation**: Form validation with immediate feedback

## Development

### Getting Started

```bash
# Install dependencies
npm install

# Start development server  
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Standards

The codebase follows these naming conventions for maintainability:

#### CSS Classes
- Use semantic names: `.balance-card` instead of utility chains
- Component-specific: `.transaction-action-button`
- State-aware: `.active`, `.disabled`, `.loading`

#### JavaScript Functions
- Descriptive action names: `handleTransactionSubmit()`, `calculateNetworkFees()`
- Consistent prefixes: `get-`, `set-`, `handle-`, `validate-`
- Clear return types: `isTransactionValid()`, `hasInsufficientBalance()`

#### Variables
- Descriptive names: `availableBalance`, `selectedPaymentMethod`, `transactionType`
- Consistent patterns: `isLoading`, `hasError`, `canProceed`
- Clear data types: `numericAmount`, `stringValue`, `booleanFlag`

#### Constants
- SCREAMING_SNAKE_CASE: `NAVIGATION_PATHS`, `FEE_RATES`, `MINIMUM_AMOUNTS`
- Grouped by domain: `TRANSACTION_TYPES`, `PAYMENT_METHODS`, `SUPPORTED_CHAINS`

### Testing

The platform supports comprehensive testing scenarios:

- **Balance Updates**: All transaction types properly update available vs invested balances
- **Fee Calculations**: Real-time fee calculation with provider simulation
- **Validation Logic**: Form validation with balance and format checking
- **Transaction Flow**: End-to-end transaction processing with progress tracking
- **Error Handling**: Graceful error states with user-friendly messages

### Browser Compatibility

Tested and optimized for:
- Modern web browsers (Chrome, Firefox, Safari, Edge)
- Mobile devices (responsive design)
- Touch interactions
- Accessibility standards

## Brand Message

**"diBoaS"** - Brazilian slang meaning "all good, everything is fine, I'm good"

The platform embodies this philosophy by making complex financial operations feel effortless and stress-free, living up to its promise of making finance as easy as buying coffee.

## Documentation

- [Transaction System Documentation](./docs/TRANSACTIONS.md) - Comprehensive transaction implementation guide
- [API Documentation] - Integration endpoints and data formats  
- [Component Library] - UI component usage and examples
- [Deployment Guide] - Production deployment instructions

## Future Roadmap

### Phase 1 - Current (MVP)
✅ Core transaction functionality  
✅ Real-time fee calculations
✅ Multi-chain wallet abstraction
✅ Balance management system
✅ Form validation and error handling

### Phase 2 - Integration
🔄 Real banking API integration
🔄 Live crypto price feeds
🔄 KYC/AML compliance flows
🔄 2FA authentication system

### Phase 3 - Advanced Features  
📋 Investment products (tokenized assets)
📋 AI-powered financial advice
📋 Social features and community
📋 Advanced analytics dashboard

### Phase 4 - Scale
📋 Multi-language support
📋 Regulatory compliance (global)
📋 Enterprise solutions
📋 API marketplace

## Support & Contributing

For questions, issues, or contributions:

1. Check existing documentation
2. Review the transaction system guide
3. Follow established code patterns
4. Maintain semantic naming conventions

---

*diBoaS Platform - Making finance as easy as buying coffee ☕*