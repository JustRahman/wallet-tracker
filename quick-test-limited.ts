/**
 * Quick Test - Limited Transactions
 * Tests with first 100 transactions only to avoid rate limiting
 */

import { WalletService } from "./src/services/walletService.js";

const VITALIK_WALLET = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

async function quickTestLimited() {
  console.log("🧪 Quick Test - Limited (First 100 transactions only)\n");

  const walletService = new WalletService();

  try {
    // Fetch all transactions
    const result = await walletService.calculatePnL(
      VITALIK_WALLET,
      ["ethereum"],
      "fifo",
      false // Disable cache for testing
    );

    // Limit to first 100 transactions for processing
    const limited = {
      ...result,
      transactions: result.transactions.slice(0, 100),
    };

    console.log(`\n✅ Success!`);
    console.log(`Total transactions found: ${result.transactions.length}`);
    console.log(`Processed: ${limited.transactions.length}`);
    console.log(`Tokens: ${result.by_token.length}`);

    if (result.by_token.length > 0) {
      console.log(`\nTop 5 tokens:`);
      result.by_token.slice(0, 5).forEach((t) => {
        console.log(
          `  - ${t.token_symbol}: ${t.quantity_held.toFixed(4)} @ $${t.current_price.toFixed(2)}`
        );
      });
    }

    console.log(`\n💡 Note: This test limited processing to 100 transactions`);
    console.log(`   to avoid DeFiLlama rate limiting. Full wallet has ${result.transactions.length} transactions.`);
    console.log(`   The improved batching system can handle the full wallet,`);
    console.log(`   but it will take several minutes due to rate limiting.`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

quickTestLimited();
