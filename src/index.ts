import { z } from "zod";
import { createAgentApp } from "@lucid-dreams/agent-kit";
import { WalletService } from "./services/walletService.js";
import { cacheService } from "./services/cacheService.js";
import { SUPPORTED_CHAINS } from "./config/index.js";
import { serve } from "@hono/node-server";

/**
 * Wallet P&L Tracker Agent
 * Tracks realized and unrealized profit & loss across multiple blockchain networks
 */

const { app, addEntrypoint } = createAgentApp({
  name: "wallet-pnl-tracker",
  version: "0.2.0",
  description: "Track realized and unrealized P&L across multiple chains",
});

// Initialize wallet service
const walletService = new WalletService();

// Input validation schema
const InputSchema = z.object({
  wallet_address: z.string().min(1, "Wallet address is required"),
  chains: z
    .array(z.string())
    .optional()
    .default(["ethereum", "base", "arbitrum", "optimism", "polygon", "bsc"]),
  time_period: z
    .enum(["24h", "7d", "30d", "90d", "1y", "all"])
    .optional()
    .default("all"),
  include_tokens: z.array(z.string()).optional(),
  cost_basis_method: z.enum(["fifo", "lifo", "avg"]).optional().default("fifo"),
});

/**
 * Main entrypoint for P&L calculation
 */
addEntrypoint({
  key: "calculate_pnl",
  description: "Calculate P&L for a wallet across multiple chains",
  input: InputSchema,
  async handler({ input }) {
    const {
      wallet_address,
      chains,
      time_period,
      include_tokens,
      cost_basis_method,
    } = input as z.infer<typeof InputSchema>;

    try {
      // Calculate P&L using real blockchain data
      let result = await walletService.calculatePnL(
        wallet_address,
        chains,
        cost_basis_method,
        true // Use cache
      );

      // Filter by tokens if specified
      if (include_tokens && include_tokens.length > 0) {
        result = {
          ...result,
          by_token: result.by_token.filter((token) =>
            include_tokens.includes(token.token_symbol)
          ),
          transactions: result.transactions.filter((tx) =>
            include_tokens.includes(tx.token_symbol)
          ),
        };

        // Recalculate summary for filtered tokens
        const total_realized = result.by_token.reduce(
          (sum, t) => sum + t.realized_pnl_usd,
          0
        );
        const total_unrealized = result.by_token.reduce(
          (sum, t) => sum + t.unrealized_pnl_usd,
          0
        );

        result.summary = {
          ...result.summary,
          total_realized_pnl_usd: total_realized,
          total_unrealized_pnl_usd: total_unrealized,
          total_pnl_usd: total_realized + total_unrealized,
        };
      }

      return {
        output: result,
        usage: { total_tokens: 1000 },
      };
    } catch (error) {
      console.error("❌ Error calculating P&L:", error);
      throw error;
    }
  },
});

/**
 * Mock x402 payment handler for testing
 * This simulates a payment being made before the service is called
 */
addEntrypoint({
  key: "mock_x402_payment",
  description: "Simulate an x402 payment for testing the agent",
  input: z.object({
    amount_usd: z.number().positive(),
    payment_method: z.enum(["lightning", "base", "ethereum"]).optional().default("lightning"),
  }),
  async handler({ input }) {
    const { amount_usd, payment_method } = input;

    console.log(`\n💳 Mock x402 Payment Initiated`);
    console.log(`   Amount: $${amount_usd}`);
    console.log(`   Method: ${payment_method}\n`);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const payment_id = `mock_x402_${Date.now()}`;
    const result = {
      success: true,
      payment_id,
      amount_usd,
      payment_method,
      timestamp: Date.now(),
      message: "Mock x402 payment processed successfully",
    };

    console.log(`✅ Payment processed: ${payment_id}\n`);

    return {
      output: result,
      usage: { total_tokens: 100 },
    };
  },
});

/**
 * Test entrypoint - Returns mock data without calculation
 */
addEntrypoint({
  key: "test",
  description: "Test endpoint to verify agent is working",
  input: z.object({
    message: z.string().optional().default("Hello"),
  }),
  async handler({ input }) {
    const { message } = input;

    return {
      output: {
        echo: message,
        status: "Agent is working!",
        timestamp: Date.now(),
        version: "0.2.0",
        supported_chains: SUPPORTED_CHAINS,
      },
      usage: { total_tokens: 10 },
    };
  },
});

/**
 * Clear cache entrypoint
 */
addEntrypoint({
  key: "clear_cache",
  description: "Clear all cached data",
  input: z.object({
    cache_type: z.enum(["all", "transactions", "prices"]).optional().default("all"),
  }),
  async handler({ input }) {
    const { cache_type } = input;

    console.log(`🗑️  Clearing ${cache_type} cache...`);

    if (cache_type === "all") {
      cacheService.clearAll();
    } else if (cache_type === "transactions") {
      cacheService.clearTransactions();
    } else if (cache_type === "prices") {
      cacheService.clearPrices();
    }

    return {
      output: {
        success: true,
        cache_type,
        message: `${cache_type} cache cleared successfully`,
        timestamp: Date.now(),
      },
      usage: { total_tokens: 10 },
    };
  },
});

/**
 * Get cache statistics
 */
addEntrypoint({
  key: "cache_stats",
  description: "Get cache statistics",
  input: z.object({}),
  async handler() {
    const stats = cacheService.getStats();

    return {
      output: {
        ...stats,
        timestamp: Date.now(),
      },
      usage: { total_tokens: 10 },
    };
  },
});

// Export the app
export default app;

// Start the server
const PORT = parseInt(process.env.PORT || "3001");

serve(
  {
    fetch: app.fetch,
    port: PORT,
    hostname: "0.0.0.0",  // Required for Railway
  },
  (info) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`💰 Wallet P&L Tracker Agent`);
    console.log(`${"=".repeat(60)}`);
    console.log(`✅ Server is running on http://0.0.0.0:${info.port}`);
    console.log(`📍 Main entrypoint: POST http://0.0.0.0:${info.port}/entrypoints/calculate_pnl/invoke`);
    console.log(`📍 Test entrypoint: POST http://0.0.0.0:${info.port}/entrypoints/test/invoke`);
    console.log(`📍 Cache stats: POST http://0.0.0.0:${info.port}/entrypoints/cache_stats/invoke`);
    console.log(`📖 API Docs: http://0.0.0.0:${info.port}/`);
    console.log(`${"=".repeat(60)}\n`);
  }
);
