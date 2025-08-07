# First Steps - Your First Transaction

Learn how to build and execute your first transaction in diBoaS.

## Understanding the Platform

diBoaS uses a **category-based transaction system** with three main areas:

- **Banking**: Traditional operations (Add, Send, Withdraw)
- **Investing**: Asset operations (Buy, Sell)  
- **Strategies**: Goal-based automation (Investment strategies)

## Your First Transaction: Add Funds

Let's start with the most basic operation - adding funds to your account.

### Step 1: Navigate to Banking

```bash
# Start the development server
pnpm dev

# Open browser to http://localhost:5173
# Navigate to Banking > Add Funds
```

### Step 2: Understanding the Interface

The Add Funds page includes:
- **Amount Input**: How much to add
- **Payment Method**: How you'll pay (Mock in development)
- **Fee Display**: Calculated automatically
- **Balance Preview**: Your balance after the transaction

### Step 3: Execute the Transaction

```javascript
// The transaction flow follows this pattern:
1. User Input → Validation
2. Fee Calculation → Fee Display
3. User Confirmation → Transaction Processing
4. Balance Update → Success/Error Feedback
```

### Step 4: View Results

After submitting:
- Check the **transaction history** for your new transaction
- Verify your **balance** has increased
- Review the **fee breakdown** in transaction details

## Understanding Transaction Categories

### Banking Operations
```bash
/category/banking/add      # Add funds
/category/banking/send     # Send to another user
/category/banking/withdraw # Withdraw to bank account
```

### Investment Operations
```bash
/category/investment/buy   # Buy assets
/category/investment/sell  # Sell assets
```

### Strategy Operations
```bash
/category/yield/*          # Goal-based strategies
```

## Code Example: Simple Transaction

Here's how transactions work under the hood:

```javascript
// Basic transaction structure
const transaction = {
  type: 'add',
  category: 'banking',
  amount: 100,
  paymentMethod: 'mock_bank_account',
  fees: {
    platform: 0.50,
    provider: 0.25,
    total: 0.75
  }
}

// The system will:
// 1. Validate the transaction
// 2. Calculate fees
// 3. Process payment
// 4. Update balances
// 5. Create transaction record
```

## Testing Your Setup

### 1. Verify Mock Data
Development mode uses mock data:
- Mock payment providers
- Simulated processing delays
- Test transaction responses

### 2. Check Developer Tools
Open browser dev tools to see:
- API calls and responses
- State management updates
- Error logging and debugging

### 3. Test Transaction Flow
Try each transaction type:
- Add $100 (should succeed)
- Buy $50 BTC (should succeed)
- Send $25 to demo user (should succeed)

## Key Concepts

### Balance Types
- **Available**: Funds ready for spending
- **Invested**: Funds in investments
- **Strategy**: Funds in automated strategies

### Fee Structure
- **Platform Fee**: diBoaS service fee
- **Provider Fee**: Payment provider fee
- **Network Fee**: Blockchain fees (for crypto)

### Transaction States
- **Pending**: Processing
- **Completed**: Successfully processed
- **Failed**: Transaction failed
- **Cancelled**: User cancelled

## Next Steps

1. **Explore Categories**: Try different transaction types
2. **Review Code**: Check `/src/components/TransactionPage.jsx`
3. **Read Architecture**: Understanding the [Domain Model](../architecture/DOMAIN_MODEL.md)
4. **Development Workflow**: See [Standards](../development/STANDARDS.md)

## Quick Commands

```bash
# Reset to clean state
pnpm reset-data

# Run specific tests
pnpm test transaction

# View transaction logs
pnpm logs

# Build for production
pnpm build
```

## Need Help?

- **Transaction Issues**: See [Transaction Guide](../transactions/OVERVIEW.md)
- **Development Questions**: See [Development Standards](../development/STANDARDS.md)
- **Architecture Questions**: See [Architecture Overview](../architecture/OVERVIEW.md)