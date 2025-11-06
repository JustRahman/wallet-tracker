import NodeCache from "node-cache";
import { config } from "../config/index.js";
import { Transaction } from "../types/index.js";

/**
 * Cache Service
 * Caches transaction history and price data to reduce API calls
 */
export class CacheService {
  private transactionCache: NodeCache;
  private priceCache: NodeCache;

  constructor() {
    // Transaction cache - 10 minutes TTL by default
    this.transactionCache = new NodeCache({
      stdTTL: config.cacheTtlTransactions,
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Don't clone objects for better performance
    });

    // Price cache - 2 minutes TTL by default
    this.priceCache = new NodeCache({
      stdTTL: config.cacheTtlPrices,
      checkperiod: 60,
      useClones: false,
    });

    console.log(`📦 Cache initialized:`);
    console.log(`   - Transactions TTL: ${config.cacheTtlTransactions}s`);
    console.log(`   - Prices TTL: ${config.cacheTtlPrices}s`);
  }

  /**
   * Get cached transactions for a wallet on a specific chain
   */
  getTransactions(walletAddress: string, chain: string): Transaction[] | undefined {
    const key = this.getTransactionKey(walletAddress, chain);
    const cached = this.transactionCache.get<Transaction[]>(key);

    if (cached) {
      console.log(`💾 Cache hit: ${key}`);
    }

    return cached;
  }

  /**
   * Set transactions in cache
   */
  setTransactions(
    walletAddress: string,
    chain: string,
    transactions: Transaction[]
  ): void {
    const key = this.getTransactionKey(walletAddress, chain);
    this.transactionCache.set(key, transactions);
    console.log(`💾 Cached ${transactions.length} transactions: ${key}`);
  }

  /**
   * Get cached price for a token
   */
  getPrice(tokenSymbol: string): number | undefined {
    const key = this.getPriceKey(tokenSymbol);
    const cached = this.priceCache.get<number>(key);

    if (cached !== undefined) {
      console.log(`💾 Cache hit: ${key} = $${cached}`);
    }

    return cached;
  }

  /**
   * Set price in cache
   */
  setPrice(tokenSymbol: string, price: number): void {
    const key = this.getPriceKey(tokenSymbol);
    this.priceCache.set(key, price);
    console.log(`💾 Cached price: ${key} = $${price}`);
  }

  /**
   * Get multiple cached prices
   */
  getPrices(tokenSymbols: string[]): Map<string, number> {
    const priceMap = new Map<string, number>();

    for (const symbol of tokenSymbols) {
      const price = this.getPrice(symbol);
      if (price !== undefined) {
        priceMap.set(symbol, price);
      }
    }

    return priceMap;
  }

  /**
   * Set multiple prices in cache
   */
  setPrices(priceMap: Map<string, number>): void {
    for (const [symbol, price] of priceMap.entries()) {
      this.setPrice(symbol, price);
    }
  }

  /**
   * Get cached historical price
   */
  getHistoricalPrice(
    tokenSymbol: string,
    timestamp: number
  ): number | undefined {
    const key = this.getHistoricalPriceKey(tokenSymbol, timestamp);
    return this.priceCache.get<number>(key);
  }

  /**
   * Set historical price in cache
   */
  setHistoricalPrice(
    tokenSymbol: string,
    timestamp: number,
    price: number
  ): void {
    const key = this.getHistoricalPriceKey(tokenSymbol, timestamp);
    this.priceCache.set(key, price, 86400); // Cache historical prices for 24 hours
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.transactionCache.flushAll();
    this.priceCache.flushAll();
    console.log("🗑️  All caches cleared");
  }

  /**
   * Clear transaction cache
   */
  clearTransactions(): void {
    this.transactionCache.flushAll();
    console.log("🗑️  Transaction cache cleared");
  }

  /**
   * Clear price cache
   */
  clearPrices(): void {
    this.priceCache.flushAll();
    console.log("🗑️  Price cache cleared");
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      transactions: this.transactionCache.getStats(),
      prices: this.priceCache.getStats(),
    };
  }

  /**
   * Generate cache key for transactions
   */
  private getTransactionKey(walletAddress: string, chain: string): string {
    return `tx:${chain}:${walletAddress.toLowerCase()}`;
  }

  /**
   * Generate cache key for current price
   */
  private getPriceKey(tokenSymbol: string): string {
    return `price:${tokenSymbol.toUpperCase()}`;
  }

  /**
   * Generate cache key for historical price
   */
  private getHistoricalPriceKey(tokenSymbol: string, timestamp: number): string {
    const date = new Date(timestamp);
    const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    return `price:hist:${tokenSymbol.toUpperCase()}:${dateStr}`;
  }
}

// Export singleton instance
export const cacheService = new CacheService();
