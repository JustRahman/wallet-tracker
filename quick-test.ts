/**
 * Quick Test - Just Ethereum
 */

import { WalletService } from "./src/services/walletService.js";

// Test wallets with different activity levels:
const TEST_WALLET = "0x992920386E3D950BC260f99C81FDA12419eD4594"; // 49 txs - clean output
// const TEST_WALLET = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"; // Etherscan donations - 2237 txs

async function quickTest() {
  console.log("🧪 Quick Test - Real Wallet (Ethereum only)\n");

  const walletService = new WalletService();

  try {
    const result = await walletService.calculatePnL(
      TEST_WALLET,
      ["ethereum"],
      "fifo",
      true // Enable cache to avoid rate limiting
    );

    console.log(`\n✅ Analysis Complete!`);
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 P&L Summary`);
    console.log("=".repeat(60));
    console.log(`Total Transactions: ${result.transactions.length.toLocaleString()}`);
    console.log(`Unique Tokens: ${result.by_token.length}`);
    console.log(``);
    console.log(`Initial Investment: $${(result.summary.initial_investment_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`Current Value: $${(result.summary.current_value_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    const totalChange = result.summary.total_pnl_usd || 0;
    const changeSign = totalChange >= 0 ? "+" : "";
    const changeColor = totalChange >= 0 ? "🟢" : "🔴";
    console.log(`Total Change: ${changeColor} ${changeSign}$${Math.abs(totalChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${changeSign}${(result.summary.total_pnl_percentage || 0).toFixed(2)}%)`);
    console.log(``);
    console.log(`Breakdown:`);
    const realizedSign = (result.summary.total_realized_pnl_usd || 0) >= 0 ? "+" : "";
    const unrealizedSign = (result.summary.total_unrealized_pnl_usd || 0) >= 0 ? "+" : "";
    console.log(`  • Realized P&L: ${realizedSign}$${Math.abs(result.summary.total_realized_pnl_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (from closed positions)`);
    console.log(`  • Unrealized P&L: ${unrealizedSign}$${Math.abs(result.summary.total_unrealized_pnl_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (current holdings)`);

    // Filter to only show tokens with value > $0.01
    const significantTokens = result.by_token.filter(
      (t) => {
        const currentValue = t.quantity_held * t.current_price_usd;
        return currentValue > 0.01 || Math.abs(t.total_pnl_usd) > 0.01;
      }
    );

    if (significantTokens.length > 0) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`💎 Current Holdings (> $0.01)`);
      console.log("=".repeat(60));
      significantTokens.slice(0, 10).forEach((t, i) => {
        const currentValue = (t.quantity_held || 0) * (t.current_price_usd || 0);
        const costBasis = (t.quantity_held || 0) * (t.average_buy_price_usd || 0);
        const pnlSign = (t.unrealized_pnl_usd || 0) >= 0 ? "+" : "";
        const pnlColor = (t.unrealized_pnl_usd || 0) >= 0 ? "🟢" : "🔴";
        console.log(
          `${i + 1}. ${t.token_symbol.padEnd(10)} ${(t.quantity_held || 0).toFixed(4)}`
        );
        console.log(
          `   Current Value: $${currentValue.toFixed(2)}`
        );
        console.log(
          `   Cost Basis: $${costBasis.toFixed(2)}`
        );
        console.log(
          `   Unrealized P&L: ${pnlColor} ${pnlSign}$${Math.abs(t.unrealized_pnl_usd || 0).toFixed(2)} (${pnlSign}${((t.unrealized_pnl_usd || 0) / (costBasis || 1) * 100).toFixed(2)}%)`
        );
        console.log(``);
      });
    } else {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`💎 Current Holdings`);
      console.log("=".repeat(60));
      console.log(`   [No significant holdings remaining]`);
    }

    // Show tokens with losses
    const losers = result.by_token.filter((t) => t.total_pnl_usd < -1).slice(0, 5);
    if (losers.length > 0) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`📉 Top Losses`);
      console.log("=".repeat(60));
      losers.forEach((t, i) => {
        console.log(
          `${i + 1}. ${t.token_symbol.padEnd(10)} Loss: $${Math.abs(t.total_pnl_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${(t.total_pnl_percentage || 0).toFixed(2)}%)`
        );
      });
    }

    console.log(`\n${"=".repeat(60)}\n`)
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

quickTest();
