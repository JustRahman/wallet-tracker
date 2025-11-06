/**
 * Simple test script to demonstrate the wallet P&L tracker
 */

import { PnLCalculator } from "./src/services/pnlCalculator.js";
import { getMockTransactions, getMockCurrentPrice } from "./src/utils/mockData.js";

async function runTest() {
  console.log("=".repeat(60));
  console.log("🧪 Wallet P&L Tracker - Test Run");
  console.log("=".repeat(60));

  // Test wallet address (mock)
  const walletAddress = "0x1234567890123456789012345678901234567890";

  console.log(`\n📍 Testing wallet: ${walletAddress}\n`);

  // 1. Fetch mock transactions
  const transactions = getMockTransactions(walletAddress);
  console.log(`✅ Fetched ${transactions.length} mock transactions\n`);

  // 2. Display transactions
  console.log("📋 Transactions:");
  console.log("-".repeat(60));
  transactions.forEach((tx, index) => {
    console.log(
      `${index + 1}. [${tx.chain.toUpperCase()}] ${tx.type.toUpperCase()}: ${tx.quantity} ${tx.token_symbol} @ $${tx.price_usd}`
    );
  });
  console.log("");

  // 3. Get current prices
  const tokenSymbols = [...new Set(transactions.map((tx) => tx.token_symbol))];
  const currentPrices = new Map<string, number>();

  console.log("💰 Current Prices:");
  console.log("-".repeat(60));
  for (const symbol of tokenSymbols) {
    const price = getMockCurrentPrice(symbol);
    currentPrices.set(symbol, price);
    console.log(`   ${symbol}: $${price}`);
  }
  console.log("");

  // 4. Test FIFO method
  console.log("📊 Testing FIFO Cost Basis Method");
  console.log("-".repeat(60));
  const fifoCalculator = new PnLCalculator("fifo");
  const fifoResult = fifoCalculator.calculate(transactions, currentPrices);

  console.log("\n💼 Summary (FIFO):");
  console.log(`   Total P&L: $${fifoResult.summary.total_pnl_usd.toFixed(2)} (${fifoResult.summary.total_pnl_percentage.toFixed(2)}%)`);
  console.log(`   Realized P&L: $${fifoResult.summary.total_realized_pnl_usd.toFixed(2)}`);
  console.log(`   Unrealized P&L: $${fifoResult.summary.total_unrealized_pnl_usd.toFixed(2)}`);
  console.log(`   Initial Investment: $${fifoResult.summary.initial_investment_usd.toFixed(2)}`);
  console.log(`   Current Value: $${fifoResult.summary.current_value_usd.toFixed(2)}`);

  console.log("\n📈 By Token:");
  fifoResult.by_token.forEach((token) => {
    console.log(`   ${token.token_symbol} (${token.chain}):`);
    console.log(`      Quantity: ${token.quantity_held}`);
    console.log(`      Avg Buy Price: $${token.average_buy_price_usd.toFixed(2)}`);
    console.log(`      Current Price: $${token.current_price_usd.toFixed(2)}`);
    console.log(`      Total P&L: $${token.total_pnl_usd.toFixed(2)} (${token.pnl_percentage.toFixed(2)}%)`);
  });

  console.log("\n🌐 By Chain:");
  fifoResult.by_chain.forEach((chain) => {
    console.log(`   ${chain.chain.toUpperCase()}:`);
    console.log(`      Total P&L: $${chain.total_pnl_usd.toFixed(2)} (${chain.pnl_percentage.toFixed(2)}%)`);
  });

  // 5. Test mock x402 payment
  console.log("\n" + "=".repeat(60));
  console.log("💳 Testing Mock x402 Payment");
  console.log("=".repeat(60));

  const mockPayment = {
    amount_usd: 10.0,
    payment_method: "lightning" as const,
  };

  console.log(`\n💰 Processing payment: $${mockPayment.amount_usd} via ${mockPayment.payment_method}`);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const paymentId = `mock_x402_${Date.now()}`;
  console.log(`✅ Payment successful: ${paymentId}`);

  console.log("\n" + "=".repeat(60));
  console.log("✨ All tests completed successfully!");
  console.log("=".repeat(60));
}

// Run the test
runTest().catch(console.error);
