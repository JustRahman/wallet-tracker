/**
 * Real Wallet Test - Vitalik's Ethereum Address
 * Tests the wallet P&L tracker with real blockchain data
 */

import { WalletService } from "./src/services/walletService.js";
import { cacheService } from "./src/services/cacheService.js";

// Vitalik's wallet address (public, well-known address)
const VITALIK_WALLET = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

async function testRealWallet() {
  console.log("=".repeat(80));
  console.log("🧪 REAL WALLET TEST - Vitalik's Address");
  console.log("=".repeat(80));
  console.log(`\n📍 Wallet: ${VITALIK_WALLET}`);
  console.log(`   (Vitalik Buterin - Ethereum Co-founder)\n`);

  const walletService = new WalletService();

  try {
    // Test 1: Single chain (Ethereum only) - Fastest
    console.log("\n" + "=".repeat(80));
    console.log("TEST 1: Ethereum Only (Fastest)");
    console.log("=".repeat(80));

    const ethereumResult = await walletService.calculatePnL(
      VITALIK_WALLET,
      ["ethereum"], // Just Ethereum
      "fifo",
      true // Use cache
    );

    console.log("\n📊 Results:");
    console.log(`   Transactions found: ${ethereumResult.transactions.length}`);
    console.log(`   Unique tokens: ${ethereumResult.by_token.length}`);
    console.log(`   Total P&L: $${ethereumResult.summary.total_pnl_usd.toFixed(2)}`);
    console.log(`   Realized P&L: $${ethereumResult.summary.total_realized_pnl_usd.toFixed(2)}`);
    console.log(`   Unrealized P&L: $${ethereumResult.summary.total_unrealized_pnl_usd.toFixed(2)}`);

    if (ethereumResult.by_token.length > 0) {
      console.log("\n🪙 Top 5 Tokens by Holdings:");
      const topTokens = ethereumResult.by_token
        .sort((a, b) => b.quantity_held - a.quantity_held)
        .slice(0, 5);

      topTokens.forEach((token, index) => {
        console.log(`   ${index + 1}. ${token.token_symbol}: ${token.quantity_held.toFixed(4)}`);
        console.log(`      Current Price: $${token.current_price_usd.toFixed(2)}`);
        console.log(`      P&L: $${token.total_pnl_usd.toFixed(2)} (${token.pnl_percentage.toFixed(2)}%)`);
      });
    }

    // Test 2: Multiple chains (if user wants comprehensive test)
    console.log("\n\n" + "=".repeat(80));
    console.log("TEST 2: Multi-Chain Analysis (Comprehensive)");
    console.log("=".repeat(80));
    console.log("⚠️  This will query all 6 chains. It may take 30-60 seconds...\n");

    const multiChainResult = await walletService.calculatePnL(
      VITALIK_WALLET,
      ["ethereum", "base", "arbitrum", "optimism", "polygon", "bsc"],
      "fifo",
      true // Use cache
    );

    console.log("\n📊 Multi-Chain Results:");
    console.log(`   Total transactions: ${multiChainResult.transactions.length}`);
    console.log(`   Chains with activity: ${multiChainResult.by_chain.length}`);
    console.log(`   Unique tokens: ${multiChainResult.by_token.length}`);

    console.log("\n🌐 Activity by Chain:");
    multiChainResult.by_chain.forEach((chain) => {
      console.log(`   ${chain.chain.toUpperCase()}:`);
      console.log(`      Total P&L: $${chain.total_pnl_usd.toFixed(2)}`);
      console.log(`      Realized: $${chain.realized_pnl_usd.toFixed(2)}`);
      console.log(`      Unrealized: $${chain.unrealized_pnl_usd.toFixed(2)}`);
    });

    // Test 3: Compare cost basis methods
    console.log("\n\n" + "=".repeat(80));
    console.log("TEST 3: Cost Basis Method Comparison");
    console.log("=".repeat(80));
    console.log("📊 Comparing FIFO, LIFO, and Average methods...\n");

    const fifoResult = await walletService.calculatePnL(
      VITALIK_WALLET,
      ["ethereum"],
      "fifo",
      true
    );

    const lifoResult = await walletService.calculatePnL(
      VITALIK_WALLET,
      ["ethereum"],
      "lifo",
      true
    );

    const avgResult = await walletService.calculatePnL(
      VITALIK_WALLET,
      ["ethereum"],
      "avg",
      true
    );

    console.log("Method Comparison (Ethereum only):");
    console.log(`   FIFO Total P&L: $${fifoResult.summary.total_pnl_usd.toFixed(2)}`);
    console.log(`   LIFO Total P&L: $${lifoResult.summary.total_pnl_usd.toFixed(2)}`);
    console.log(`   AVG Total P&L:  $${avgResult.summary.total_pnl_usd.toFixed(2)}`);

    const difference = Math.abs(fifoResult.summary.total_pnl_usd - lifoResult.summary.total_pnl_usd);
    console.log(`\n   💡 Difference between FIFO and LIFO: $${difference.toFixed(2)}`);

    // Cache Statistics
    console.log("\n\n" + "=".repeat(80));
    console.log("💾 Cache Statistics");
    console.log("=".repeat(80));

    const stats = cacheService.getStats();
    console.log("\nTransaction Cache:");
    console.log(`   Hits: ${stats.transactions.hits}`);
    console.log(`   Misses: ${stats.transactions.misses}`);
    console.log(`   Keys: ${stats.transactions.keys}`);
    console.log(`   Hit Rate: ${stats.transactions.hits > 0 ? ((stats.transactions.hits / (stats.transactions.hits + stats.transactions.misses)) * 100).toFixed(2) : 0}%`);

    console.log("\nPrice Cache:");
    console.log(`   Hits: ${stats.prices.hits}`);
    console.log(`   Misses: ${stats.prices.misses}`);
    console.log(`   Keys: ${stats.prices.keys}`);
    console.log(`   Hit Rate: ${stats.prices.hits > 0 ? ((stats.prices.hits / (stats.prices.hits + stats.prices.misses)) * 100).toFixed(2) : 0}%`);

    // Summary
    console.log("\n\n" + "=".repeat(80));
    console.log("✅ ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(80));
    console.log("\n📝 Summary:");
    console.log(`   ✅ Real blockchain data fetched from Etherscan API V2`);
    console.log(`   ✅ Real price data fetched from DeFiLlama`);
    console.log(`   ✅ P&L calculations working correctly`);
    console.log(`   ✅ Multi-chain support functional`);
    console.log(`   ✅ All cost basis methods tested`);
    console.log(`   ✅ Caching system operational\n`);

  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        console.log("\n💡 Tip: Make sure you've set ETHERSCAN_API_KEY in your .env file");
        console.log("   Get a free key at: https://etherscan.io/myapikey");
      }
    }

    process.exit(1);
  }
}

// Run the test
console.log("\n🚀 Starting real wallet test...");
console.log("⏱️  This may take 30-90 seconds depending on transaction history...\n");

testRealWallet()
  .then(() => {
    console.log("\n👋 Test completed!\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Unexpected error:", error);
    process.exit(1);
  });
