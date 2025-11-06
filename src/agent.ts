/**
 * X402 Payment-Protected Wallet P&L Tracker Agent
 *
 * This agent requires payment before calculating wallet P&L.
 * Payment flow:
 * 1. Client makes request without X-PAYMENT header → Returns 402 with payment requirements
 * 2. Client makes request with X-PAYMENT header → Verifies payment with facilitator
 * 3. If valid → Calculates P&L and returns result
 * 4. Payment is settled after successful execution
 */

import { createAgentApp } from "@lucid-dreams/agent-kit";
import { z } from "zod";
import { WalletService } from "./services/walletService.js";
import { SUPPORTED_CHAINS } from "./config/index.js";
import { CostBasisMethod } from "./types/index.js";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// Input schema for wallet P&L calculation
const WalletPnLInput = z.object({
  wallet_address: z.string().describe("Ethereum wallet address to analyze"),
  chains: z.array(z.string()).optional().describe("List of blockchain networks to query (ethereum, base, arbitrum, etc.)"),
  cost_basis_method: z.enum(["fifo", "lifo", "avg"]).optional().describe("Cost basis calculation method: FIFO (first-in-first-out), LIFO (last-in-first-out), or AVG (average)"),
  use_cache: z.boolean().optional().describe("Whether to use cached data to avoid rate limiting")
});

// Create the agent app with X402 payment protection
const { app, addEntrypoint } = createAgentApp(
  {
    name: "wallet-pnl-tracker",
    version: "0.2.0",
    description: "Calculate realized and unrealized profit/loss for any cryptocurrency wallet across multiple blockchain networks. Supports Ethereum, Base, Arbitrum, Optimism, Polygon, and 50+ EVM chains. Payment required per analysis."
  },
  {
    config: {
      payments: {
        facilitatorUrl: process.env.FACILITATOR_URL || "https://facilitator.daydreams.systems",
        payTo: process.env.PAY_TO_WALLET || "0x992920386E3D950BC260f99C81FDA12419eD4594",
        network: process.env.PAYMENT_NETWORK || "base",
        defaultPrice: process.env.PAYMENT_AMOUNT || "0.02"
      }
    },
    useConfigPayments: true  // ✅ CRITICAL: Enables X402 payment middleware
  }
);

// Add the wallet P&L calculation entrypoint (protected by X402 payment)
addEntrypoint({
  key: "calculate_pnl",
  name: "calculate_pnl",
  description: "Calculate profit/loss for a cryptocurrency wallet. Requires payment of 2 cents in USDC on Base network.",
  inputSchema: WalletPnLInput,
  handler: async ({ input }) => {
    console.log("\n" + "=".repeat(60));
    console.log("🔐 Payment verified! Calculating P&L...");
    console.log("=".repeat(60) + "\n");

    const {
      wallet_address,
      chains = SUPPORTED_CHAINS,
      cost_basis_method = "fifo",
      use_cache = true
    } = input;

    try {
      // Create wallet service and calculate P&L
      const walletService = new WalletService();
      const result = await walletService.calculatePnL(
        wallet_address,
        chains,
        cost_basis_method as CostBasisMethod,
        use_cache
      );

      console.log("\n✅ P&L calculation complete!");
      console.log(`   Total Transactions: ${result.transactions.length}`);
      console.log(`   Total P&L: $${result.summary.total_pnl_usd.toFixed(2)}`);
      console.log(`   Initial Investment: $${result.summary.initial_investment_usd.toFixed(2)}`);
      console.log(`   Current Value: $${result.summary.current_value_usd.toFixed(2)}\n`);

      // Return the P&L result
      return {
        success: true,
        data: result,
        message: "P&L calculated successfully"
      };

    } catch (error) {
      console.error("❌ Error calculating P&L:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        message: "Failed to calculate P&L"
      };
    }
  }
});

// Start the server
const PORT = parseInt(process.env.PORT || "3000");

console.log("\n" + "=".repeat(60));
console.log("💰 Wallet P&L Tracker Agent with X402 Payments");
console.log("=".repeat(60));
console.log(`🚀 Starting server on port ${PORT}...`);
console.log(`🔐 Payment required: ${process.env.PAYMENT_AMOUNT || "0.02"} USDC on ${process.env.PAYMENT_NETWORK || "base"}`);
console.log(`💳 Payments to: ${process.env.PAY_TO_WALLET}`);
console.log(`🌐 Facilitator: ${process.env.FACILITATOR_URL}`);
console.log("=".repeat(60) + "\n");

// Import serve from Bun or use Node adapter
import { serve } from "@hono/node-server";

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`);
  console.log(`📍 Entrypoint: POST http://localhost:${info.port}/entrypoints/calculate_pnl/invoke`);
  console.log(`📖 Docs: http://localhost:${info.port}/`);
  console.log("\n💡 To make a request without payment, try:");
  console.log(`   curl -X POST http://localhost:${info.port}/entrypoints/calculate_pnl/invoke \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"wallet_address": "0x992920386E3D950BC260f99C81FDA12419eD4594"}'`);
  console.log("\n   You will receive a 402 Payment Required response with payment instructions.\n");
});
