import dotenv from "dotenv";

dotenv.config();

export interface ChainConfig {
  name: string;
  apiUrl: string;
  apiKey: string;
  nativeToken: string;
  chainId: number;
}

export const config = {
  // API Keys
  // Etherscan API V2 - Single key works for all chains!
  etherscanApiKey: process.env.ETHERSCAN_API_KEY || "",

  // CoinGecko (optional - DeFiLlama is used by default)
  coingeckoApiKey: process.env.COINGECKO_API_KEY || "",

  // Cache settings
  cacheTtlTransactions: parseInt(process.env.CACHE_TTL_TRANSACTIONS || "600", 10),
  cacheTtlPrices: parseInt(process.env.CACHE_TTL_PRICES || "120", 10),

  // Environment
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),

  // X402 Payment Configuration
  enablePayments: process.env.ENABLE_PAYMENTS === "true",
  paymentAmount: process.env.PAYMENT_AMOUNT || "0.01",
  payToWallet: process.env.PAY_TO_WALLET || "0x992920386E3D950BC260f99C81FDA12419eD4594",
  paymentNetwork: process.env.PAYMENT_NETWORK || "base",
  facilitatorUrl: process.env.FACILITATOR_URL || "https://facilitator.daydreams.systems",
};

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  ethereum: {
    name: "ethereum",
    apiUrl: "https://api.etherscan.io/v2/api",
    apiKey: config.etherscanApiKey, // Etherscan API V2 key works for all chains
    nativeToken: "ETH",
    chainId: 1,
  },
  base: {
    name: "base",
    apiUrl: "https://api.basescan.org/v2/api",
    apiKey: config.etherscanApiKey, // Same key works for Base
    nativeToken: "ETH",
    chainId: 8453,
  },
  arbitrum: {
    name: "arbitrum",
    apiUrl: "https://api.arbiscan.io/v2/api",
    apiKey: config.etherscanApiKey, // Same key works for Arbitrum
    nativeToken: "ETH",
    chainId: 42161,
  },
  optimism: {
    name: "optimism",
    apiUrl: "https://api-optimistic.etherscan.io/v2/api",
    apiKey: config.etherscanApiKey, // Same key works for Optimism
    nativeToken: "ETH",
    chainId: 10,
  },
  polygon: {
    name: "polygon",
    apiUrl: "https://api.polygonscan.com/v2/api",
    apiKey: config.etherscanApiKey, // Same key works for Polygon
    nativeToken: "MATIC",
    chainId: 137,
  },
  bsc: {
    name: "bsc",
    apiUrl: "https://api.bscscan.com/v2/api",
    apiKey: config.etherscanApiKey, // Same key works for BSC
    nativeToken: "BNB",
    chainId: 56,
  },
};

export const SUPPORTED_CHAINS = Object.keys(CHAIN_CONFIGS);
