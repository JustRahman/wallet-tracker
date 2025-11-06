# Quick Start Guide

Get the Wallet P&L Tracker running in 5 minutes!

## Prerequisites

- Node.js 20+ installed
- ONE Etherscan API key (free - works for ALL 6 chains!)

## Step 1: Install Dependencies (30 seconds)

```bash
npm install
```

## Step 2: Get Your FREE API Key (2 minutes)

**Great News:** You only need ONE API key that works for ALL chains!

1. Go to https://etherscan.io/register
2. Sign up for a free account
3. Go to https://etherscan.io/myapikey
4. Create a new API key
5. Copy your API key

**That's it!** This one key works for:
- ✅ Ethereum
- ✅ Base
- ✅ Arbitrum
- ✅ Optimism
- ✅ Polygon
- ✅ BSC

Thanks to Etherscan API V2, you don't need separate keys anymore!

**For prices:** We use DeFiLlama (100% FREE, no API key needed!)

## Step 3: Configure Environment (30 seconds)

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your API key
nano .env
```

**Your .env file should look like:**
```env
# Just add your one Etherscan API key here:
ETHERSCAN_API_KEY=your_api_key_here

# That's it! DeFiLlama requires no API key
COINGECKO_API_KEY=
```

## Step 4: Build (30 seconds)

```bash
npm run build
```

## Step 5: Test with Mock Data (30 seconds)

```bash
npx tsx test.ts
```

You should see output like:
```
============================================================
🧪 Wallet P&L Tracker - Test Run
============================================================
...
💼 Summary (FIFO):
   Total P&L: $2570.00 (20.20%)
   Realized P&L: $400.00
   Unrealized P&L: $2170.00
...
```

## Step 6: Test with Real Wallet (1 minute)

Let's test with a real wallet address!

### Option A: Using a Known Wallet (Easy)

Test with Vitalik's wallet:

```bash
npm run dev
```

Then call the agent with:
```json
{
  "wallet_address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "chains": ["ethereum"],
  "cost_basis_method": "fifo"
}
```

### Option B: Using Your Own Wallet

```bash
npm run dev
```

Then call with your wallet address:
```json
{
  "wallet_address": "0xYourWalletAddressHere",
  "chains": ["ethereum", "base", "arbitrum", "optimism", "polygon", "bsc"],
  "cost_basis_method": "fifo"
}
```

## Expected Output

You should see:

```
============================================================
🔍 Calculating P&L for wallet: 0x...
📊 Cost Basis Method: fifo
🌐 Chains: ethereum, base, arbitrum, optimism, polygon, bsc
💾 Cache: enabled
============================================================

🔍 Fetching transactions for 0x... on ethereum...
✅ Found 247 transactions on ethereum

💰 Enriching 247 transactions with price data...
💰 Fetching current prices for 15 tokens from DeFiLlama...
✅ Fetched prices for 15 tokens from DeFiLlama
✅ Price enrichment complete

============================================================
📊 P&L Summary
============================================================
   Total P&L: $123,456.78 (45.67%)
   Realized P&L: $45,678.90
   Unrealized P&L: $77,777.88
   Initial Investment: $270,234.56
   Current Value: $393,691.34
============================================================
```

## Troubleshooting

### "No transactions found"

- ✅ Check that the wallet address has transactions on the chains you're querying
- ✅ Verify your API key is correct
- ✅ Try a different chain (e.g., if Ethereum is slow, try Base)

### Rate limit errors

- ✅ Wait a few seconds and try again
- ✅ Free tier Etherscan API has 5 calls/second limit
- ✅ Cache will help on repeated requests

### "No API key configured"

- ✅ Make sure you created .env file
- ✅ Check that the key name is ETHERSCAN_API_KEY
- ✅ Restart the dev server after editing .env

## What's Next?

### Test All Features

1. **Try different cost basis methods:**
   ```json
   { "cost_basis_method": "fifo" }   // Default
   { "cost_basis_method": "lifo" }   // Last in, first out
   { "cost_basis_method": "avg" }    // Average cost
   ```

2. **Query multiple chains (with ONE API key!):**
   ```json
   {
     "wallet_address": "0x...",
     "chains": ["ethereum", "base", "arbitrum", "optimism", "polygon", "bsc"]
   }
   ```

3. **Filter by tokens:**
   ```json
   {
     "wallet_address": "0x...",
     "include_tokens": ["ETH", "USDC", "USDT"]
   }
   ```

4. **Check cache stats:**
   Call the `cache_stats` entrypoint to see cache performance

5. **Test x402 payment:**
   Call the `mock_x402_payment` entrypoint:
   ```json
   {
     "amount_usd": 0.10,
     "payment_method": "lightning"
   }
   ```

### Deploy to Production

When you're ready to deploy for real usage:

1. Read **DEPLOYMENT.md** for complete deployment instructions
2. Choose a hosting platform (VPS, Vercel, Railway, etc.)
3. Set up your domain
4. Deploy!

## Why This Is Better Now

### Before (Old Way)
- ❌ Need 6 separate API keys (one per chain)
- ❌ Need CoinGecko Pro ($129+/month) or deal with harsh rate limits
- ❌ Complex configuration

### Now (New Way)
- ✅ ONE API key works for ALL 6 chains (Etherscan API V2)
- ✅ DeFiLlama is 100% FREE with NO API key required
- ✅ Simple configuration
- ✅ Better rate limits

## Agent Endpoints

Once running, these entrypoints are available:

- `calculate_pnl` - Main P&L calculation
- `mock_x402_payment` - Test payment flow
- `test` - Health check
- `clear_cache` - Clear cached data
- `cache_stats` - View cache statistics

## Cost

### Development & Production (FREE!)

- ✅ **Etherscan API V2**: FREE (5 calls/sec limit)
- ✅ **DeFiLlama**: FREE (no API key, no rate limits!)
- ✅ **Local testing**: $0
- ✅ **Basic hosting**: $0-5/month (Vercel, Railway free tier)

### Optional Upgrades

For high-volume usage:
- **Etherscan Pro**: $99+/month (higher rate limits)
- **Hosting**: $5-50/month for dedicated server

## Getting Help

- **README.md** - Full documentation
- **DEPLOYMENT.md** - Deployment guide
- **IMPLEMENTATION_SUMMARY.md** - Technical details

## Common Test Wallets

These are public wallets you can test with:

- **Vitalik (Ethereum founder)**: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
- **Uniswap Router**: `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D`

These wallets have lots of activity, perfect for testing!

---

**That's it!** You should now have a working Wallet P&L Tracker with:
- ✅ ONE simple API key
- ✅ FREE price data
- ✅ ALL 6 chains supported

Enjoy! 🚀
