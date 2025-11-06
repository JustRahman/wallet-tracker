import axios, { AxiosError } from "axios";
import { config } from "../config/index.js";

interface DeFiLlamaPriceResponse {
  coins: {
    [key: string]: {
      price: number;
      symbol: string;
      timestamp: number;
      confidence: number;
    };
  };
}

/**
 * Price Data Fetcher
 * Fetches current and historical prices from DeFiLlama (FREE, no API key required!)
 * Falls back to CoinGecko if available
 */
export class PriceFetcher {
  private defiLlamaBaseUrl = "https://coins.llama.fi";
  private coingeckoBaseUrl = "https://api.coingecko.com/api/v3";
  private coingeckoProBaseUrl = "https://pro-api.coingecko.com/api/v3";
  private retryDelay = 1000;
  private maxRetries = 3;

  // Token symbol to CoinGecko ID mapping (used as fallback)
  private coingeckoIdMap: Record<string, string> = {
    ETH: "ethereum",
    BTC: "bitcoin",
    USDC: "usd-coin",
    USDT: "tether",
    DAI: "dai",
    WETH: "weth",
    WBTC: "wrapped-bitcoin",
    MATIC: "matic-network",
    BNB: "binancecoin",
    ARB: "arbitrum",
    OP: "optimism",
    LINK: "chainlink",
    UNI: "uniswap",
    AAVE: "aave",
    CRV: "curve-dao-token",
    PEPE: "pepe",
    SHIB: "shiba-inu",
    APE: "apecoin",
    LDO: "lido-dao",
    MKR: "maker",
    SNX: "synthetix-network-token",
  };

  /**
   * Get current prices for multiple tokens using DeFiLlama
   */
  async getCurrentPrices(tokenSymbols: string[]): Promise<Map<string, number>> {
    try {
      // Build coin identifiers for DeFiLlama
      const coinIds = tokenSymbols
        .map((symbol) => {
          const coingeckoId = this.coingeckoIdMap[symbol.toUpperCase()];
          return coingeckoId ? `coingecko:${coingeckoId}` : null;
        })
        .filter((id) => id !== null);

      if (coinIds.length === 0) {
        console.warn("⚠️  No valid token IDs found");
        return new Map();
      }

      const coinsParam = coinIds.join(",");
      const url = `${this.defiLlamaBaseUrl}/prices/current/${coinsParam}`;

      console.log(`💰 Fetching current prices for ${coinIds.length} tokens from DeFiLlama...`);

      const response = await this.retryRequest<DeFiLlamaPriceResponse>(url);

      const priceMap = new Map<string, number>();

      // Map responses back to symbols
      if (response.coins) {
        for (const [symbol, coingeckoId] of Object.entries(this.coingeckoIdMap)) {
          const key = `coingecko:${coingeckoId}`;
          if (response.coins[key]?.price) {
            priceMap.set(symbol, response.coins[key].price);
          }
        }
      }

      console.log(`✅ Fetched prices for ${priceMap.size} tokens from DeFiLlama`);

      return priceMap;
    } catch (error) {
      console.error("❌ Error fetching current prices from DeFiLlama:", error);

      // Try CoinGecko as fallback if API key is available
      if (config.coingeckoApiKey) {
        console.log("🔄 Falling back to CoinGecko...");
        return this.getCurrentPricesFromCoinGecko(tokenSymbols);
      }

      return new Map();
    }
  }

  /**
   * Fallback: Get current prices from CoinGecko (requires API key)
   */
  private async getCurrentPricesFromCoinGecko(
    tokenSymbols: string[]
  ): Promise<Map<string, number>> {
    try {
      const tokenIds = tokenSymbols
        .map((symbol) => this.coingeckoIdMap[symbol.toUpperCase()])
        .filter((id) => id !== undefined);

      if (tokenIds.length === 0) {
        return new Map();
      }

      const idsParam = tokenIds.join(",");
      const apiUrl = config.coingeckoApiKey ? this.coingeckoProBaseUrl : this.coingeckoBaseUrl;
      const headers: Record<string, string> = config.coingeckoApiKey
        ? { "x-cg-pro-api-key": config.coingeckoApiKey }
        : {};

      const url = `${apiUrl}/simple/price?ids=${idsParam}&vs_currencies=usd`;

      const response = await this.retryRequest<any>(url, headers);

      const priceMap = new Map<string, number>();
      for (const [symbol, tokenId] of Object.entries(this.coingeckoIdMap)) {
        if (response[tokenId]?.usd) {
          priceMap.set(symbol, response[tokenId].usd);
        }
      }

      console.log(`✅ Fetched prices for ${priceMap.size} tokens from CoinGecko`);
      return priceMap;
    } catch (error) {
      console.error("❌ CoinGecko fallback failed:", error);
      return new Map();
    }
  }

  /**
   * Get historical price for a token at a specific timestamp using DeFiLlama
   */
  async getHistoricalPrice(
    tokenSymbol: string,
    timestamp: number
  ): Promise<number> {
    try {
      const coingeckoId = this.coingeckoIdMap[tokenSymbol.toUpperCase()];
      if (!coingeckoId) {
        // Don't spam console - caller will track unknown tokens
        return 0;
      }

      const coinId = `coingecko:${coingeckoId}`;
      const timestampSeconds = Math.floor(timestamp / 1000);

      const url = `${this.defiLlamaBaseUrl}/prices/historical/${timestampSeconds}/${coinId}`;

      const response = await this.retryRequest<DeFiLlamaPriceResponse>(url);

      const price = response.coins?.[coinId]?.price || 0;
      return price;
    } catch (error) {
      // Silently fail - caller will track failures
      // Try CoinGecko as fallback
      if (config.coingeckoApiKey) {
        return this.getHistoricalPriceFromCoinGecko(tokenSymbol, timestamp);
      }

      return 0;
    }
  }

  /**
   * Fallback: Get historical price from CoinGecko (requires API key)
   */
  private async getHistoricalPriceFromCoinGecko(
    tokenSymbol: string,
    timestamp: number
  ): Promise<number> {
    try {
      const tokenId = this.coingeckoIdMap[tokenSymbol.toUpperCase()];
      if (!tokenId) {
        return 0;
      }

      const date = new Date(timestamp);
      const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

      const apiUrl = config.coingeckoApiKey ? this.coingeckoProBaseUrl : this.coingeckoBaseUrl;
      const headers: Record<string, string> = config.coingeckoApiKey
        ? { "x-cg-pro-api-key": config.coingeckoApiKey }
        : {};

      const url = `${apiUrl}/coins/${tokenId}/history?date=${dateStr}`;

      const response = await this.retryRequest<any>(url, headers);

      const price = response.market_data?.current_price?.usd || 0;
      return price;
    } catch (error) {
      console.error(`❌ CoinGecko historical price fallback failed:`, error);
      return 0;
    }
  }

  /**
   * Get historical prices for multiple transactions
   * Groups by date to minimize API calls
   */
  async getHistoricalPrices(
    transactions: Array<{ token_symbol: string; timestamp: number }>
  ): Promise<Map<string, Map<string, number>>> {
    // Group transactions by token and date
    const tokenDateMap = new Map<string, Set<string>>();

    for (const tx of transactions) {
      const date = new Date(tx.timestamp);
      const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

      if (!tokenDateMap.has(tx.token_symbol)) {
        tokenDateMap.set(tx.token_symbol, new Set());
      }
      tokenDateMap.get(tx.token_symbol)!.add(dateStr);
    }

    // Fetch historical prices
    const priceMap = new Map<string, Map<string, number>>();

    for (const [symbol, dates] of tokenDateMap.entries()) {
      priceMap.set(symbol, new Map());

      // Limit concurrent requests to avoid overwhelming the API
      for (const dateStr of Array.from(dates)) {
        const timestamp = this.dateStrToTimestamp(dateStr);
        const price = await this.getHistoricalPrice(symbol, timestamp);
        priceMap.get(symbol)!.set(dateStr, price);

        // Small delay to be nice to the API
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return priceMap;
  }

  /**
   * Convert date string back to timestamp
   */
  private dateStrToTimestamp(dateStr: string): number {
    const [day, month, year] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day).getTime();
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(
    url: string,
    headers: Record<string, string> = {},
    attempt = 1
  ): Promise<T> {
    try {
      const response = await axios.get<T>(url, {
        headers,
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Retry attempt ${attempt}/${this.maxRetries} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retryRequest<T>(url, headers, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Add custom token mapping
   */
  addTokenMapping(symbol: string, coingeckoId: string): void {
    this.coingeckoIdMap[symbol.toUpperCase()] = coingeckoId;
  }

  /**
   * Get token ID for a symbol
   */
  getTokenId(symbol: string): string | undefined {
    return this.coingeckoIdMap[symbol.toUpperCase()];
  }
}
