# Test Wallet Addresses

Here are some Ethereum wallet addresses good for testing your P&L tracker. These are publicly known addresses with varying activity levels.

## Low Activity Wallets (< 100 transactions)

### 1. **Etherscan Donations Wallet**
```
0x71C7656EC7ab88b098defB751B7401B5f6d8976F
```
- **Activity:** Low to moderate
- **Type:** Public donation address
- **Good for:** Testing with minimal rate limiting
- **Check on Etherscan:** https://etherscan.io/address/0x71C7656EC7ab88b098defB751B7401B5f6d8976F

### 2. **Your Current Test Wallet** (Already configured)
```
0x992920386E3D950BC260f99C81FDA12419eD4594
```
- **Activity:** 49 transactions (Perfect!)
- **Holdings:** $0.60 USDT
- **Good for:** Quick testing, cache demonstration

## Medium Activity Wallets (100-500 transactions)

### 3. **Sample Address 1**
```
0xb23397f97715118532c8c1207F5678Ed4FbaEA6c
```
- **Activity:** Moderate
- **Type:** Regular trading wallet
- **Good for:** Testing with multiple tokens
- **Check on Etherscan:** https://etherscan.io/address/0xb23397f97715118532c8c1207F5678Ed4FbaEA6c

## How to Use These Wallets

### Option 1: Quick Edit
```bash
# Edit quick-test.ts
nano quick-test.ts

# Change this line:
const TEST_WALLET = "0x992920386E3D950BC260f99C81FDA12419eD4594";

# To any wallet above:
const TEST_WALLET = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

# Run test
npm run build && npx tsx quick-test.ts
```

### Option 2: Test Multiple Wallets
Create a new test file:

```typescript
// test-multiple-wallets.ts
import { WalletService } from "./src/services/walletService.js";

const TEST_WALLETS = [
  "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  "0x992920386E3D950BC260f99C81FDA12419eD4594",
  "0xb23397f97715118532c8c1207F5678Ed4FbaEA6c",
];

async function testMultipleWallets() {
  const walletService = new WalletService();

  for (const wallet of TEST_WALLETS) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Testing wallet: ${wallet}`);
    console.log("=".repeat(60));

    try {
      const result = await walletService.calculatePnL(
        wallet,
        ["ethereum"],
        "fifo",
        true // Cache enabled
      );

      console.log(`✅ Transactions: ${result.transactions.length}`);
      console.log(`💰 Total P&L: $${result.summary.total_pnl_usd.toFixed(2)}`);
      console.log(`📊 Current Value: $${result.summary.current_value_usd.toFixed(2)}`);
    } catch (error) {
      console.error(`❌ Error testing wallet:`, error.message);
    }

    // Wait 10 seconds between wallets to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}

testMultipleWallets();
```

## Finding Your Own Test Wallets

### Method 1: Use Etherscan
1. Go to https://etherscan.io
2. Click "Top Accounts" or search for any address
3. Look for wallets with:
   - 20-200 transactions (good for testing)
   - Some token holdings
   - Recent activity

### Method 2: Check Transaction Count First
Before testing, check transaction count:
```bash
# Check on Etherscan URL:
https://etherscan.io/address/YOUR_WALLET_ADDRESS

# Look for "Transactions" count in the overview
```

## Tips for Testing

### Avoid Rate Limiting
- ✅ Test wallets with < 200 transactions
- ✅ Enable cache (we already did this!)
- ✅ Wait 5-10 minutes between tests
- ✅ Use mock test when possible

### Best Results
- 🎯 **10-50 transactions:** Perfect for quick testing
- 🎯 **50-200 transactions:** Good for realistic testing
- ⚠️ **200-1000 transactions:** May hit rate limits, use cache
- 🚫 **1000+ transactions:** Like Vitalik's wallet, expect rate limiting

## Current Test Setup

Your `quick-test.ts` is already configured with:
- ✅ Cache enabled
- ✅ 49-transaction wallet
- ✅ Smart batching
- ✅ Ethereum only (faster)

This is **perfect** for testing! 🎉

## Try It Now

```bash
# Test with current wallet (49 transactions)
npm run build && npx tsx quick-test.ts

# Or test with mock data (instant)
npm run test:mock
```

## Note About Vitalik's Wallet

```
0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```
- **Transactions:** 17,986 (!!!)
- **Status:** Will definitely hit rate limits
- **Use for:** Demonstrating the system works on high-volume wallets
- **Estimated time:** ~30 minutes with batching
- **Recommendation:** Use smaller wallets for regular testing

---

**Current Status:** You're all set! Your current test wallet works perfectly. Try the others above if you want to see different trading patterns.
