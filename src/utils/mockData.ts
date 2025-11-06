import { Transaction } from "../types/index.js";

/**
 * Mock transaction data for testing
 * Simulates a wallet with ETH and USDC transactions across multiple chains
 */
export const mockTransactions: Transaction[] = [
  // Ethereum - ETH purchases
  {
    tx_hash: "0x1111111111111111111111111111111111111111111111111111111111111111",
    chain: "ethereum",
    timestamp: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
    type: "buy",
    token_symbol: "ETH",
    token_address: "0x0000000000000000000000000000000000000000",
    quantity: 2.0,
    price_usd: 1800,
    total_value_usd: 3600,
  },
  {
    tx_hash: "0x2222222222222222222222222222222222222222222222222222222222222222",
    chain: "ethereum",
    timestamp: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
    type: "buy",
    token_symbol: "ETH",
    token_address: "0x0000000000000000000000000000000000000000",
    quantity: 1.5,
    price_usd: 2000,
    total_value_usd: 3000,
  },
  // Ethereum - Partial ETH sell
  {
    tx_hash: "0x3333333333333333333333333333333333333333333333333333333333333333",
    chain: "ethereum",
    timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    type: "sell",
    token_symbol: "ETH",
    token_address: "0x0000000000000000000000000000000000000000",
    quantity: 1.0,
    price_usd: 2200,
    total_value_usd: 2200,
  },
  // Base - USDC purchases
  {
    tx_hash: "0x4444444444444444444444444444444444444444444444444444444444444444",
    chain: "base",
    timestamp: Date.now() - 45 * 24 * 60 * 60 * 1000, // 45 days ago
    type: "buy",
    token_symbol: "USDC",
    token_address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    quantity: 5000,
    price_usd: 1.0,
    total_value_usd: 5000,
  },
  // Arbitrum - ETH transfer in (airdrop simulation)
  {
    tx_hash: "0x5555555555555555555555555555555555555555555555555555555555555555",
    chain: "arbitrum",
    timestamp: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 days ago
    type: "transfer_in",
    token_symbol: "ETH",
    token_address: "0x0000000000000000000000000000000000000000",
    quantity: 0.5,
    price_usd: 2100,
    total_value_usd: 1050,
  },
  // Polygon - MATIC purchase
  {
    tx_hash: "0x6666666666666666666666666666666666666666666666666666666666666666",
    chain: "polygon",
    timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
    type: "buy",
    token_symbol: "MATIC",
    token_address: "0x0000000000000000000000000000000000001010",
    quantity: 1000,
    price_usd: 0.8,
    total_value_usd: 800,
  },
  // Optimism - ETH purchase
  {
    tx_hash: "0x7777777777777777777777777777777777777777777777777777777777777777",
    chain: "optimism",
    timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
    type: "buy",
    token_symbol: "ETH",
    token_address: "0x0000000000000000000000000000000000000000",
    quantity: 0.8,
    price_usd: 2150,
    total_value_usd: 1720,
  },
];

/**
 * Mock current prices for tokens
 */
export const mockCurrentPrices: Record<string, number> = {
  ETH: 2300, // Up from purchase prices
  USDC: 1.0, // Stablecoin
  MATIC: 0.75, // Down from purchase price
};

/**
 * Get mock transactions for a wallet
 */
export function getMockTransactions(walletAddress: string): Transaction[] {
  return mockTransactions;
}

/**
 * Get mock current price for a token
 */
export function getMockCurrentPrice(tokenSymbol: string): number {
  return mockCurrentPrices[tokenSymbol] || 0;
}
