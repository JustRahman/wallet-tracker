import { BlockchainFetcher } from "./blockchainFetcher.js";
import { PriceFetcher } from "./priceFetcher.js";
import { PnLCalculator } from "./pnlCalculator.js";
import { cacheService } from "./cacheService.js";
import { Transaction, PnLResult, CostBasisMethod } from "../types/index.js";
import { SUPPORTED_CHAINS } from "../config/index.js";

/**
 * Wallet Service
 * Orchestrates all services to calculate P&L
 */
export class WalletService {
  private blockchainFetcher: BlockchainFetcher;
  private priceFetcher: PriceFetcher;

  constructor() {
    this.blockchainFetcher = new BlockchainFetcher();
    this.priceFetcher = new PriceFetcher();
  }

  /**
   * Calculate P&L for a wallet
   */
  async calculatePnL(
    walletAddress: string,
    chains: string[] = SUPPORTED_CHAINS,
    costBasisMethod: CostBasisMethod = "fifo",
    useCache = true
  ): Promise<PnLResult> {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔍 Calculating P&L for wallet: ${walletAddress}`);
    console.log(`📊 Cost Basis Method: ${costBasisMethod}`);
    console.log(`🌐 Chains: ${chains.join(", ")}`);
    console.log(`💾 Cache: ${useCache ? "enabled" : "disabled"}`);
    console.log(`${"=".repeat(60)}\n`);

    // Step 1: Fetch transactions from all chains
    const transactions = await this.fetchTransactions(
      walletAddress,
      chains,
      useCache
    );

    if (transactions.length === 0) {
      console.log("⚠️  No transactions found for this wallet");
      return this.getEmptyResult(chains);
    }

    // Step 2: Enrich transactions with price data
    const enrichedTransactions = await this.enrichWithPrices(
      transactions,
      useCache
    );

    // Step 3: Calculate P&L
    const tokenSymbols = [...new Set(enrichedTransactions.map((tx) => tx.token_symbol))];
    const currentPrices = await this.getCurrentPrices(tokenSymbols, useCache);

    const calculator = new PnLCalculator(costBasisMethod);
    const result = calculator.calculate(enrichedTransactions, currentPrices);

    // Log summary
    this.logSummary(result);

    return result;
  }

  /**
   * Fetch transactions from multiple chains
   */
  private async fetchTransactions(
    walletAddress: string,
    chains: string[],
    useCache: boolean
  ): Promise<Transaction[]> {
    const allTransactions: Transaction[] = [];

    for (const chain of chains) {
      // Try cache first
      if (useCache) {
        const cached = cacheService.getTransactions(walletAddress, chain);
        if (cached) {
          allTransactions.push(...cached);
          continue;
        }
      }

      // Fetch from API
      const transactions = await this.blockchainFetcher.fetchTransactions(
        walletAddress,
        chain
      );

      if (transactions.length > 0) {
        allTransactions.push(...transactions);

        // Cache the results
        if (useCache) {
          cacheService.setTransactions(walletAddress, chain, transactions);
        }
      }
    }

    console.log(`\n✅ Total transactions fetched: ${allTransactions.length}\n`);

    return allTransactions;
  }

  /**
   * Enrich transactions with historical price data
   * Uses smart batching to minimize API calls and avoid rate limiting
   */
  private async enrichWithPrices(
    transactions: Transaction[],
    useCache: boolean
  ): Promise<Transaction[]> {
    console.log(`💰 Enriching ${transactions.length} transactions with price data...`);

    // Track unknown tokens
    const unknownTokens = new Set<string>();

    // Group transactions by unique token+date combinations to minimize API calls
    const uniquePrices = new Map<string, { symbol: string; timestamp: number }>();
    const priceCache = new Map<string, number>();

    for (const tx of transactions) {
      const dateKey = this.getDateKey(tx.timestamp);
      const cacheKey = `${tx.token_symbol}-${dateKey}`;

      // Check cache first
      if (useCache) {
        const cachedPrice = cacheService.getHistoricalPrice(tx.token_symbol, tx.timestamp);
        if (cachedPrice !== undefined) {
          priceCache.set(cacheKey, cachedPrice);
          continue;
        }
      }

      // Mark for fetching if not in cache
      if (!uniquePrices.has(cacheKey)) {
        uniquePrices.set(cacheKey, {
          symbol: tx.token_symbol,
          timestamp: tx.timestamp,
        });
      }
    }

    console.log(`   📊 Unique prices to fetch: ${uniquePrices.size} (from ${transactions.length} transactions)`);

    // Fetch prices in batches to avoid rate limiting
    // DeFiLlama has aggressive rate limiting, so we use small batches with longer delays
    const BATCH_SIZE = 5;
    const BATCH_DELAY = 5000; // 5 seconds between batches
    const PROGRESS_INTERVAL = 20; // Show progress every 20 batches
    const uniqueArray = Array.from(uniquePrices.entries());
    const totalBatches = Math.ceil(uniqueArray.length / BATCH_SIZE);

    console.log(`   ⏳ Processing ${totalBatches} batches...`);

    for (let i = 0; i < uniqueArray.length; i += BATCH_SIZE) {
      const batch = uniqueArray.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;

      // Only show progress every PROGRESS_INTERVAL batches or at the end
      if (batchNum % PROGRESS_INTERVAL === 0 || batchNum === totalBatches) {
        const percent = Math.round((batchNum / totalBatches) * 100);
        console.log(`   ⏳ Progress: ${batchNum}/${totalBatches} (${percent}%)`);
      }

      // Process batch in parallel
      await Promise.all(
        batch.map(async ([cacheKey, { symbol, timestamp }]) => {
          try {
            const price = await this.priceFetcher.getHistoricalPrice(symbol, timestamp);

            if (price > 0) {
              priceCache.set(cacheKey, price);
              if (useCache) {
                cacheService.setHistoricalPrice(symbol, timestamp, price);
              }
            } else {
              priceCache.set(cacheKey, 0);
              // Track tokens with no price found
              if (!this.priceFetcher.getTokenId(symbol)) {
                unknownTokens.add(symbol);
              }
            }
          } catch (error) {
            priceCache.set(cacheKey, 0);
            unknownTokens.add(symbol);
          }
        })
      );

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < uniqueArray.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
      }
    }

    // Show summary of unknown tokens (if any)
    if (unknownTokens.size > 0) {
      console.log(`\n   ℹ️  ${unknownTokens.size} unknown tokens (no price data available)`);
      if (unknownTokens.size <= 10) {
        console.log(`   ${Array.from(unknownTokens).join(", ")}`);
      }
    }

    // Enrich transactions with fetched prices
    const enrichedTransactions: Transaction[] = transactions.map((tx) => {
      const dateKey = this.getDateKey(tx.timestamp);
      const cacheKey = `${tx.token_symbol}-${dateKey}`;
      const price = priceCache.get(cacheKey) || 0;

      return {
        ...tx,
        price_usd: price,
        total_value_usd: tx.quantity * price,
      };
    });

    console.log(`\n✅ Price enrichment complete`);

    return enrichedTransactions;
  }

  /**
   * Get date key for grouping transactions by day
   */
  private getDateKey(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  /**
   * Get current prices for tokens
   */
  private async getCurrentPrices(
    tokenSymbols: string[],
    useCache: boolean
  ): Promise<Map<string, number>> {
    const priceMap = new Map<string, number>();
    const uncachedTokens: string[] = [];

    // Try cache first
    if (useCache) {
      for (const symbol of tokenSymbols) {
        const cachedPrice = cacheService.getPrice(symbol);
        if (cachedPrice !== undefined) {
          priceMap.set(symbol, cachedPrice);
        } else {
          uncachedTokens.push(symbol);
        }
      }
    } else {
      uncachedTokens.push(...tokenSymbols);
    }

    // Fetch uncached prices
    if (uncachedTokens.length > 0) {
      const fetchedPrices = await this.priceFetcher.getCurrentPrices(uncachedTokens);

      for (const [symbol, price] of fetchedPrices.entries()) {
        priceMap.set(symbol, price);

        // Cache the price
        if (useCache) {
          cacheService.setPrice(symbol, price);
        }
      }
    }

    return priceMap;
  }

  /**
   * Log summary to console
   */
  private logSummary(result: PnLResult): void {
    console.log("\n" + "=".repeat(60));
    console.log("📊 P&L Summary");
    console.log("=".repeat(60));
    console.log(`   Total P&L: $${result.summary.total_pnl_usd.toFixed(2)} (${result.summary.total_pnl_percentage.toFixed(2)}%)`);
    console.log(`   Realized P&L: $${result.summary.total_realized_pnl_usd.toFixed(2)}`);
    console.log(`   Unrealized P&L: $${result.summary.total_unrealized_pnl_usd.toFixed(2)}`);
    console.log(`   Initial Investment: $${result.summary.initial_investment_usd.toFixed(2)}`);
    console.log(`   Current Value: $${result.summary.current_value_usd.toFixed(2)}`);
    console.log("=".repeat(60) + "\n");
  }

  /**
   * Get empty result when no transactions found
   */
  private getEmptyResult(chains: string[]): PnLResult {
    return {
      summary: {
        total_realized_pnl_usd: 0,
        total_unrealized_pnl_usd: 0,
        total_pnl_usd: 0,
        total_pnl_percentage: 0,
        initial_investment_usd: 0,
        current_value_usd: 0,
      },
      by_chain: [],
      by_token: [],
      transactions: [],
      metadata: {
        last_updated: Date.now(),
        chains_queried: chains,
        data_sources: ["etherscan", "defillama", "coingecko"],
      },
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    cacheService.clearAll();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return cacheService.getStats();
  }
}
