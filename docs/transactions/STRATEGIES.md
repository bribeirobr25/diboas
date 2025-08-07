# Goal Strategies

Goal Strategies allow users to create, start/launch and stop Goal Strategies to grow their wealth and get consistent yielding via DeFi. Goal Strategies use a goal-oriented approach where each strategy is designed around specific financial objectives like Emergency Fund, Dream Vacation, or Custom Goals.

## System Architecture

### Core Components
- **YieldCategory**: Main landing page displaying all available strategy templates and created strategies by the user with a status badge and current portfolio overview
- **StrategyConfig**: Multi-step wizard for configuring templates and new strategies (template selection or new → customization → risk selection → launch strategy)  
- **StrategyManager**: Dashboard for managing active strategies with performance tracking and controls

### Data Management
- **Centralized State**: DataManager handles all Goal Strategies state with event-driven updates
- **Balance Integration**: Separate Strategy Balance tracking alongside Available and Invested balances
- **Real-time Updates**: Components subscribe to state changes for live portfolio updates

### Navigation Flow
```
App Dashboard → Yield Category → Configure Strategy → Strategy Manager
     ↑              ↓               ↓                    ↓
Portfolio Overview → Template Selection → Risk/Timeline Config → Active Management
```

### Strategy Status
- **New**: strategies that were never used by the user
- **Active**: strategies that were launched by the user
- **Used**: strategies that were already launched and stopped by the user

## Use Template and Start/Launch Goal Strategies

**Purpose**: Allow users to easily start building wealth with template Goal Strategies using pre-configured DeFi protocols optimized for specific goals

**Provider**: 3rd party DEX platforms + 3rd party DeFi platforms (Aave, Compound, Uniswap, DeFi Tuna, etc.)

### Available Templates
- **Emergency Fund**: Conservative stablecoin lending (8-12% APY, Low Risk)
- **Free Coffee**: Short-term yield farming for daily expenses (9-15% APY, Low Risk)  
- **Dream Vacation**: Balanced liquidity pools (12-18% APY, Medium Risk)
- **New Car**: Growth-oriented protocols (12-18% APY, Medium Risk)
- **Home Down Payment**: Diversified DeFi strategies (15-27% APY, High Risk)
- **Education Fund**: Steady growth protocols (12-18% APY, Medium Risk)

### Payment Methods
- **Only On-Chain**: diBoaS Wallet (automatically selected, no user selection needed)

### Money Flow
**Internal On-Chain from Available Balance**:
- From = diBoaS Wallet Available Balance (transaction amount)
- To = diBoaS wallet Strategy Balance (transaction amount - fees)

### Balance Impact
**Start/Launch with Available Balance**:
- Available Balance = current - transaction amount
- Invested Balance = current (no change)
- Strategy Balance = current + (transaction amount - fees)

### Multi-Step Configuration

#### Step 1: Name, Image
Basic strategy customization

#### Step 2: Investment Plan
- How much you have to invest (start amount and add more over time amount and period - every week, every 2 weeks, every month, every 3 months, twice an year, once an year)

#### Step 3: Goals
- What do you want to achieve (amount at an specific date, or amount per day, per month or per year)

#### Step 4: Strategy Search
Dialog showing diBoaS is searching the best investment options to make your goal achievable. The messages should be shown for 3 seconds or until it receives a information that the search for applicable strategies is over.

Background process:
- Take all the step 1, 2 and 3 data into consideration
- Calculate how much in terms of % it is needed to achieve the step 3 with step 2 data
- Check all DeFi strategies available inside diBoaS that matches the calculation made
- Create a list of all strategies that matches or at least comes close to match the calculation

#### Step 5: Strategy Selection
Show a list of strategies ordered from top match with the user's step 2 and 3 data.
- Show the first strategy matching the criterias and keep searching for more
- Allow users to select the strategy he wants from the list
- Option to expand the strategy showing more detailed information

#### Step 6: Review and Launch
Resume page showing all information and asking the user to review and Launch the strategy

#### Step 7: Active Strategy
After the strategy is launched it shows with a running badge at the Yield page with a similar detail page in case the user clicks on it, just like the asset detailed page from investment. But with the data related to the strategy and the defi platform with a Stop button

#### Step 8: Stop Strategy
When stopping a strategy the running badge should be removed from the strategy at the Yield page

### Technical Details
- **Template Customization**: Users can modify all template parameters
- **Chain - Network Detection**: Based on selected strategy's DeFi protocols
- **Supported Assets**: BTC, ETH Layer 1, SOL, SUI native networks
- **Minimum Investment**: $10
- **Validation**: Requires sufficient balance verification for On-Chain payments
- **KYC**: not applicable
- **Balance Check**: Real-time validation against available balance
- **Risk Level Configuration**:
  - **Conservative**: 8-12% APY, Stablecoin staking, low-risk lending
  - **Moderate**: 12-18% APY, Liquidity pools, yield farming
  - **Aggressive**: 15-27% APY, High-yield farming, leveraged positions
- **Strategy Composition**: Each risk level maps to specific DeFi protocol combinations
- **Warning**: Comprehensive risk disclosure about DeFi investments and potential losses
- **Asset Storage**: Funds deployed across multiple DeFi protocols based on strategy composition
- **Recent Activities and Transaction History**: When Launching and Stopping a strategy the transaction should be stored at the Recent Activities and Transaction History
- **Ethereum Specific Case**: Currently supporting ETH Layer 1 only

### Fee Structure
- **diBoaS fee**: 0.09% of transaction amount
- **Network fee**: Based on selected strategy's primary chain (same as buy transaction)
- **DEX fee**: From DEX providers (same as buy transactions)
- **DeFi fee**: From DeFi providers (mockup):
  - 0.7% - For Solana providers
  - 0.9% - For Sui providers
  - 1.2% - For Ethereum Layer 1 providers
  - 1.5% - For Bitcoin providers

### Strategy Management Features
- **Real-time APY Tracking**: Live performance monitoring from DeFi protocols
- **Progress Visualization**: Goal completion percentage with projected timeline
- **Strategy Status**: Active, Paused, Near Completion, Completed
- **Performance Metrics**: Total earned, monthly earnings, APY vs expected
- **Rebalancing**: Automated optimization based on market conditions
- **Compound Rewards**: Automatic reinvestment of earned yields

## Stop and Claim Funds from Goal Strategies

**Purpose**: Stop active strategies and claim funds, moving them from diBoaS Strategy Balance to Available Balance in USDC on Solana chain with comprehensive exit strategy management

**Provider**: 3rd party DEX platform with Swap and Bridging operations + DeFi platforms

### Stop Strategy Options
- **Full Exit**: Stop strategy and withdraw entire balance
- **Goal Achievement**: Automatic stop when target amount is reached and withdraw entire balance

### Payment Methods
- diBoaS Wallet (automatically selected, no user selection needed)

### Money Flow
- From = diBoaS wallet Strategy Balance (full amount related to the stopped strategy including earned yields from that strategy)
- To = diBoaS wallet Available Balance (transaction amount - fees)

### Balance Impact
- Available Balance = current + (total strategy value - fees)
- Invested Balance = current (no change)
- Strategy Balance = current - total strategy value

### Technical Details
- **Chain - Network Detection**: Based on strategy's DeFi protocol composition
- **Asset Liquidation**:
  - Source = Various DeFi protocols (Aave, Compound, Uniswap, etc.)
  - Destination = USDC on Solana network
- **Exit Strategy**: Smart liquidation across multiple protocols to minimize slippage
- **Minimum**: Must stop entire strategy
- **Validation**: 
  - Strategy must be Active status
  - Strategy balance must be > 0
  - User confirmation required for irreversible action
- **KYC**: Not applicable
- **Balance Check**: Cannot exceed Strategy balance for selected strategy
- **User Interface**: 
  - Strategy selection from active strategies list
  - Performance summary showing total earned
  - Fee breakdown before confirmation
  - Final confirmation with strategy performance recap
- **Processing Time**: Varies by DeFi protocols involved (2-30 minutes)
- **Payment Method**: Automatically uses diBoaS Wallet (hidden from UI)

### Fee Structure
- **diBoaS fee**: 0.09% of transaction amount
- **Network fee**: Based on selected strategy's primary chain (same as sell transaction)
- **DEX fee**: From DEX providers (same as sell transactions)
- **DeFi fee**: From DeFi providers (same as start/launch transaction)

### Strategy Lifecycle Management
- **Performance Archive**: Final performance metrics saved to strategy history
  - Total earned, final APY, duration, goal completion percentage
- **Strategy Status Transition**: Active → Stopped → Archived
- **Historical Data**: Complete transaction history and performance timeline preserved
- **Goal Achievement Tracking**: Records whether strategy met original objective
- **Tax Reporting**: Generate transaction summary for tax reporting purposes (future implementation)
- **Strategy Analytics**: Detailed breakdown of performance vs projections

### Post-Stop Features
- **Share on Socials**: Generate an image by user request with main information about the strategy to share on Socials (hide amounts just share %)
- **Strategy History**: Access historical performance data and transaction records
- **Restart Capability**: Option to restart similar strategy with lessons learned
- **Performance Insights**: Analysis of what worked well vs original projections
- **Template Creation**: Convert successful custom strategies into reusable templates

## Validation Requirements

- **Start Strategy**: all objective driven strategy fields filled and selected + diBoaS wallet method auto-selected + Sufficient Available Balance
- **Stop Strategy**: strategy is active + strategy is identified in the Strategy Balance + all funds related to the strategy will be withdraw + send money to diBoaS wallet method auto-selected at Available Balance