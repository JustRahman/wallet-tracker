# Testing Guide

This guide shows how to test the Wallet P&L Tracker with both mock and real data.

## Quick Test Options

### Option 1: Test with Mock Data (No API key needed)

```bash
npm run test:mock
```

This runs a quick test with pre-defined mock transactions. Great for:
- Verifying the P&L calculation engine works
- Testing without API keys
- Quick sanity checks

**Output:** Shows P&L calculations for mock ETH, USDC, and MATIC transactions.

### Option 2: Test with Real Wallet (Requires API key)

```bash
npm run test:real
```

This tests with **Vitalik Buterin's real Ethereum wallet** (0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045). Great for:
- Testing real blockchain data fetching
- Verifying price data integration
- Testing multi-chain support
- Comparing cost basis methods

**Requirements:**
- ETHERSCAN_API_KEY in your .env file
- Internet connection
- Takes 30-90 seconds to run

**Output:** Comprehensive analysis including:
- Transaction count and token holdings
- P&L by chain and token
- Comparison of FIFO, LIFO, and Average methods
- Cache statistics

## Setup for Real Wallet Testing

### Step 1: Get API Key (2 minutes)

1. Go to https://etherscan.io/register
2. Sign up for free
3. Go to https://etherscan.io/myapikey
4. Create a new API key
5. Copy the key

### Step 2: Configure Environment

```bash
# Create .env file if you haven't already
cp .env.example .env

# Edit .env and add your key
nano .env
```

Add this line to your .env:
```env
ETHERSCAN_API_KEY=your_actual_api_key_here
```

### Step 3: Run the Test

```bash
# Build first (if you haven't already)
npm run build

# Run the real wallet test
npm run test:real
```

## What the Real Wallet Test Does

The test runs 3 comprehensive tests:

### Test 1: Single Chain (Ethereum)
- Fetches all transactions from Ethereum
- Calculates P&L with FIFO method
- Shows top 5 token holdings
- **Fastest test** (~10-20 seconds)

### Test 2: Multi-Chain Analysis
- Queries all 6 supported chains:
  - Ethereum
  - Base
  - Arbitrum
  - Optimism
  - Polygon
  - BSC
- Shows P&L breakdown by chain
- **Comprehensive test** (~30-60 seconds)

### Test 3: Cost Basis Comparison
- Compares FIFO, LIFO, and Average methods
- Shows how different methods affect P&L
- Demonstrates the impact of cost basis selection
- Uses cached data (fast)

### Test 4: Cache Statistics
- Shows cache hit/miss rates
- Demonstrates caching effectiveness
- Helps verify performance optimization

## Expected Output

### Successful Test

```
============================================================
🧪 REAL WALLET TEST - Vitalik's Address
============================================================

📍 Wallet: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
   (Vitalik Buterin - Ethereum Co-founder)

============================================================
TEST 1: Ethereum Only (Fastest)
============================================================

🔍 Fetching transactions for 0x... on ethereum...
✅ Found 247 transactions on ethereum

💰 Enriching 247 transactions with price data...
💰 Fetching current prices for 15 tokens from DeFiLlama...
✅ Fetched prices for 15 tokens from DeFiLlama

📊 Results:
   Transactions found: 247
   Unique tokens: 15
   Total P&L: $...
   Realized P&L: $...
   Unrealized P&L: $...

🪙 Top 5 Tokens by Holdings:
   1. ETH: 1234.5678
      Current Price: $2300.00
      P&L: $... (...)%
   ...

============================================================
✅ ALL TESTS COMPLETED SUCCESSFULLY!
============================================================
```

## Troubleshooting

### "No API key configured"

**Solution:** Make sure your .env file has:
```env
ETHERSCAN_API_KEY=your_actual_key
```

And restart the test.

### "Rate limit exceeded"

**Solution:** Wait a few seconds and try again. The free tier has a 5 calls/second limit. The test will automatically retry with exponential backoff.

### "No transactions found"

This is normal for some chains! Vitalik's wallet may not have activity on all chains. The test will continue with other chains.

### Build errors

**Solution:**
```bash
npm install
npm run build
```

## Testing Your Own Wallet

Want to test with your own wallet? Easy!

1. Open `test-real-wallet.ts`
2. Change this line:
   ```typescript
   const VITALIK_WALLET = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
   ```
   To:
   ```typescript
   const YOUR_WALLET = "0xYourWalletAddressHere";
   ```
3. Update the function call to use `YOUR_WALLET`
4. Run: `npm run test:real`

Or just modify the test file to use any wallet address you want to analyze!

## Performance Notes

### First Run
- Takes longer (no cache)
- Fetches all transactions
- Fetches all prices
- Builds cache for future runs

### Subsequent Runs
- Much faster (uses cache)
- Transaction cache: 10 minutes
- Price cache: 2 minutes
- Only fetches new data

### Cache Management

Clear cache between tests:
```typescript
cacheService.clearAll();
```

Or via the agent:
```bash
# Call the clear_cache entrypoint
```

## Common Test Wallets

These public wallets are great for testing:

1. **Vitalik Buterin** (Ethereum founder)
   - Address: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
   - Very active, lots of tokens
   - Good for comprehensive testing

2. **Uniswap Router**
   - Address: `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D`
   - Extremely high volume
   - Good for performance testing

3. **Any ENS name**
   - Resolve ENS names to addresses
   - Test with real user wallets

## Advanced Testing

### Test Specific Chains

Modify the test to query only specific chains:

```typescript
const result = await walletService.calculatePnL(
  WALLET_ADDRESS,
  ["base", "arbitrum"], // Only these chains
  "fifo",
  true
);
```

### Test Without Cache

```typescript
const result = await walletService.calculatePnL(
  WALLET_ADDRESS,
  ["ethereum"],
  "fifo",
  false // Disable cache
);
```

### Test Specific Tokens

Filter results after fetching:

```typescript
const filteredTokens = result.by_token.filter(t =>
  ["ETH", "USDC", "USDT"].includes(t.token_symbol)
);
```

## Continuous Testing

For development, you can run tests automatically:

```bash
# Watch mode (re-run on file changes)
npx tsx --watch test-real-wallet.ts
```

## API Usage Tracking

The free tier allows:
- **5 calls/second** per chain
- This test makes ~6-12 calls (depending on transaction count)
- Well within limits for testing

For high-frequency testing, consider:
- Caching aggressively (already implemented)
- Using longer cache TTL
- Upgrading to paid tier if needed

## Next Steps

After successful testing:
1. Read **DEPLOYMENT.md** for production deployment
2. Configure your own wallet addresses
3. Customize cost basis methods
4. Deploy to production!

---

**Happy Testing!** 🧪
