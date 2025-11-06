import axios, { AxiosError } from "axios";
import { Transaction } from "../types/index.js";
import { CHAIN_CONFIGS } from "../config/index.js";

interface EtherscanTransaction {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimal?: string;
  contractAddress?: string;
}

interface EtherscanTokenTransfer {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimal: string;
  contractAddress: string;
}

/**
 * Blockchain Data Fetcher
 * Fetches transaction history from various blockchain explorers
 */
export class BlockchainFetcher {
  private retryDelay = 1000; // 1 second
  private maxRetries = 3;

  /**
   * Fetch transactions for a wallet from a specific chain
   */
  async fetchTransactions(
    walletAddress: string,
    chain: string
  ): Promise<Transaction[]> {
    const chainConfig = CHAIN_CONFIGS[chain];
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    if (!chainConfig.apiKey) {
      console.warn(
        `⚠️  No API key configured for ${chain}. Please set ETHERSCAN_API_KEY in .env`
      );
      console.warn(
        `   Get a free key at: https://etherscan.io/myapikey`
      );
      return [];
    }

    try {
      console.log(`🔍 Fetching transactions for ${walletAddress} on ${chain}...`);

      // Fetch both normal transactions and token transfers in parallel
      const [normalTxs, tokenTxs] = await Promise.all([
        this.fetchNormalTransactions(walletAddress, chainConfig),
        this.fetchTokenTransfers(walletAddress, chainConfig),
      ]);

      const transactions = [...normalTxs, ...tokenTxs];
      console.log(`✅ Found ${transactions.length} transactions on ${chain}`);

      return transactions;
    } catch (error) {
      console.error(`❌ Error fetching transactions from ${chain}:`, error);
      if (error instanceof AxiosError) {
        if (error.response?.status === 429) {
          console.warn(`⚠️  Rate limit exceeded for ${chain}. Try again later.`);
        } else if (error.response?.data?.message) {
          console.warn(`⚠️  API Error: ${error.response.data.message}`);
        }
      }
      return [];
    }
  }

  /**
   * Fetch normal (native token) transactions
   */
  private async fetchNormalTransactions(
    walletAddress: string,
    chainConfig: typeof CHAIN_CONFIGS[string]
  ): Promise<Transaction[]> {
    const url = `${chainConfig.apiUrl}?chainid=${chainConfig.chainId}&module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${chainConfig.apiKey}`;

    const response = await this.retryRequest(url);

    // Debug logging
    if (response.status !== "1") {
      console.log(`⚠️  API response status: ${response.status}, message: ${response.message || 'N/A'}`);
      console.log(`   Result: ${JSON.stringify(response.result)}`);
      console.log(`   Chain: ${chainConfig.name}`);
    }

    if (response.status !== "1" || !Array.isArray(response.result)) {
      return [];
    }

    const transactions: Transaction[] = [];
    const addressLower = walletAddress.toLowerCase();

    for (const tx of response.result as EtherscanTransaction[]) {
      const isOutgoing = tx.from.toLowerCase() === addressLower;
      const valueInEth = parseFloat(tx.value) / 1e18;

      // Skip zero-value transactions
      if (valueInEth === 0) continue;

      transactions.push({
        tx_hash: tx.hash,
        chain: chainConfig.name,
        timestamp: parseInt(tx.timeStamp) * 1000,
        type: isOutgoing ? "transfer_out" : "transfer_in",
        token_symbol: chainConfig.nativeToken,
        token_address: "0x0000000000000000000000000000000000000000",
        quantity: valueInEth,
        price_usd: 0, // Will be filled by price fetcher
        total_value_usd: 0,
      });
    }

    return transactions;
  }

  /**
   * Fetch ERC-20 token transfers
   */
  private async fetchTokenTransfers(
    walletAddress: string,
    chainConfig: typeof CHAIN_CONFIGS[string]
  ): Promise<Transaction[]> {
    const url = `${chainConfig.apiUrl}?chainid=${chainConfig.chainId}&module=account&action=tokentx&address=${walletAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${chainConfig.apiKey}`;

    const response = await this.retryRequest(url);

    // Debug logging
    if (response.status !== "1") {
      console.log(`⚠️  Token TX API response status: ${response.status}, message: ${response.message || 'N/A'}`);
      console.log(`   Result: ${JSON.stringify(response.result)}`);
      console.log(`   Chain: ${chainConfig.name}`);
    }

    if (response.status !== "1" || !Array.isArray(response.result)) {
      return [];
    }

    const transactions: Transaction[] = [];
    const addressLower = walletAddress.toLowerCase();

    for (const tx of response.result as EtherscanTokenTransfer[]) {
      const isOutgoing = tx.from.toLowerCase() === addressLower;
      const decimals = parseInt(tx.tokenDecimal || "18");
      const value = parseFloat(tx.value) / Math.pow(10, decimals);

      // Skip zero-value transfers
      if (value === 0) continue;

      transactions.push({
        tx_hash: tx.hash,
        chain: chainConfig.name,
        timestamp: parseInt(tx.timeStamp) * 1000,
        type: isOutgoing ? "transfer_out" : "transfer_in",
        token_symbol: tx.tokenSymbol,
        token_address: tx.contractAddress,
        quantity: value,
        price_usd: 0, // Will be filled by price fetcher
        total_value_usd: 0,
      });
    }

    return transactions;
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest(url: string, attempt = 1): Promise<any> {
    try {
      const response = await axios.get(url, {
        timeout: 10000, // 10 second timeout
      });
      return response.data;
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Retry attempt ${attempt}/${this.maxRetries} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retryRequest(url, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Fetch transactions from multiple chains in parallel
   */
  async fetchMultiChainTransactions(
    walletAddress: string,
    chains: string[]
  ): Promise<Transaction[]> {
    const promises = chains.map((chain) =>
      this.fetchTransactions(walletAddress, chain)
    );

    const results = await Promise.allSettled(promises);

    const allTransactions: Transaction[] = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        allTransactions.push(...result.value);
      } else {
        console.error(`Failed to fetch from ${chains[index]}:`, result.reason);
      }
    });

    // Sort by timestamp
    allTransactions.sort((a, b) => a.timestamp - b.timestamp);

    return allTransactions;
  }

  /**
   * Classify transactions as buy/sell based on heuristics
   * This is a simplified version - in production you'd want more sophisticated logic
   */
  classifyTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.map((tx) => {
      // If it's a transfer in and not from a known DEX/exchange, treat as a buy
      // If it's a transfer out to a known DEX/exchange, treat as a sell
      // For now, we keep them as transfer_in/transfer_out
      // A more sophisticated approach would:
      // 1. Check if the from/to address is a DEX
      // 2. Look for paired transactions (ETH out + Token in = buy)
      // 3. Use DEX aggregator APIs to identify swaps

      return tx;
    });
  }
}
