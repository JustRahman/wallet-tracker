# Wallet P&L Tracker

A production-ready blockchain wallet profit and loss (P&L) tracker that calculates realized and unrealized gains across 6 major blockchain networks using real-time data from blockchain explorers and price APIs.

## Features

### Core Features

- **Multi-Chain Support**: Track wallet performance across 6 major chains:
  - Ethereum (ETH)
  - Base
  - Arbitrum
  - Optimism
  - Polygon (MATIC)
  - Binance Smart Chain (BSC/BNB)

- **Real Blockchain Data**: Fetches actual transaction history from blockchain explorers:
  - Etherscan, Basescan, Arbiscan, Optimistic Etherscan, Polygonscan, BscScan
  - ERC-20 token transfers and native token transactions
  - Complete transaction history with timestamps

- **Real Price Data**: CoinGecko integration for accurate pricing:
  - Current prices for unrealized P&L
  - Historical prices at transaction time for realized P&L
  - Support for 20+ major tokens

- **Cost Basis Methods**: Multiple accounting methods:
  - **FIFO** (First In, First Out) - Default
  - **LIFO** (Last In, First Out)
  - **Average** (Average cost basis)

- **Realized & Unrealized P&L**:
  - Track completed trades (realized gains/losses)
  - Monitor current holdings (unrealized gains/losses)
  - Aggregate by chain, token, and overall portfolio

- **Performance Optimized**:
  - In-memory caching (configurable TTL)
  - Parallel chain queries
  - Retry logic with exponential backoff
  - Rate limit handling

- **x402 Payment Support**: Mock x402 payment handler for testing micropayments

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd wallet-tracker

# Install dependencies
npm install
```

### Configuration

Create a `.env` file with your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys (see [API Keys](#api-keys) section below).

### Build and Run

```bash
# Build
npm run build

# Development mode
npm run dev

# Production mode
npm start
```

### Test the Agent

```bash
# Test with a real wallet address
npm run dev
```

Then call the agent with a wallet address (see [Usage](#usage) section).

## API Keys

### Required: Blockchain Explorer APIs

Get free API keys from:

1. **Etherscan**: https://etherscan.io/apis
2. **Basescan**: https://basescan.org/apis
3. **Arbiscan**: https://arbiscan.io/apis
4. **Optimistic Etherscan**: https://optimistic.etherscan.io/apis
5. **Polygonscan**: https://polygonscan.com/apis
6. **BscScan**: https://bscscan.com/apis

Each offers a free tier with 5 calls/second rate limit.

### Optional: CoinGecko API

- **Free Tier**: 10-50 calls/minute (no API key needed)
- **Pro Tier**: Higher rate limits ($129+/month)

Get an API key at: https://www.coingecko.com/en/api/pricing

## Usage

### Calculate P&L for a Wallet

```typescript
// Call the calculate_pnl entrypoint
{
  "wallet_address": "0x1234567890123456789012345678901234567890",
  "chains": ["ethereum", "base", "arbitrum"],  // Optional, defaults to all
  "cost_basis_method": "fifo",                 // Optional: "fifo", "lifo", "avg"
  "include_tokens": ["ETH", "USDC"]            // Optional, filter specific tokens
}
```

### Example Response

```json
{
  "summary": {
    "total_realized_pnl_usd": 1250.50,
    "total_unrealized_pnl_usd": 3420.75,
    "total_pnl_usd": 4671.25,
    "total_pnl_percentage": 35.67,
    "initial_investment_usd": 13100.00,
    "current_value_usd": 16521.25
  },
  "by_chain": [
    {
      "chain": "ethereum",
      "realized_pnl_usd": 800.00,
      "unrealized_pnl_usd": 2100.50,
      "total_pnl_usd": 2900.50,
      "pnl_percentage": 42.15
    }
  ],
  "by_token": [
    {
      "token_symbol": "ETH",
      "token_address": "0x0000000000000000000000000000000000000000",
      "chain": "ethereum",
      "quantity_held": 3.5,
      "average_buy_price_usd": 1900.00,
      "current_price_usd": 2300.00,
      "realized_pnl_usd": 400.00,
      "unrealized_pnl_usd": 1400.00,
      "total_pnl_usd": 1800.00,
      "pnl_percentage": 27.07
    }
  ],
  "transactions": [...],
  "metadata": {
    "last_updated": 1234567890,
    "chains_queried": ["ethereum", "base"],
    "data_sources": ["etherscan", "coingecko"]
  }
}
```

## Agent Entrypoints

### 1. `calculate_pnl`

Calculate P&L for a wallet across multiple chains.

**Input:**
```typescript
{
  wallet_address: string;           // Required: Ethereum address
  chains?: string[];                // Optional: ["ethereum", "base", ...]
  cost_basis_method?: string;       // Optional: "fifo" | "lifo" | "avg"
  include_tokens?: string[];        // Optional: ["ETH", "USDC"]
  time_period?: string;             // Optional: "24h" | "7d" | "30d" | "all"
}
```

**Output:** Complete P&L analysis (see example above)

### 2. `mock_x402_payment`

Simulate an x402 payment for testing.

**Input:**
```typescript
{
  amount_usd: number;               // Required: Payment amount
  payment_method?: string;          // Optional: "lightning" | "base" | "ethereum"
}
```

**Output:**
```typescript
{
  success: true,
  payment_id: "mock_x402_1234567890",
  amount_usd: 0.10,
  payment_method: "lightning",
  timestamp: 1234567890,
  message: "Mock x402 payment processed successfully"
}
```

### 3. `test`

Health check endpoint.

**Input:** `{ message?: string }`

**Output:**
```typescript
{
  echo: "Hello",
  status: "Agent is working!",
  timestamp: 1234567890,
  version: "0.1.0",
  supported_chains: ["ethereum", "base", "arbitrum", "optimism", "polygon", "bsc"]
}
```

### 4. `clear_cache`

Clear cached data.

**Input:** `{ cache_type?: "all" | "transactions" | "prices" }`

### 5. `cache_stats`

Get cache statistics.

**Input:** `{}`

**Output:** Cache hit/miss statistics

## Architecture

```
wallet-tracker/
├── src/
│   ├── index.ts                    # Main agent entrypoints
│   ├── config/
│   │   └── index.ts                # Configuration and chain configs
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   ├── services/
│   │   ├── walletService.ts        # Orchestrator service
│   │   ├── blockchainFetcher.ts    # Fetch transactions from chains
│   │   ├── priceFetcher.ts         # Fetch price data from CoinGecko
│   │   ├── pnlCalculator.ts        # P&L calculation engine
│   │   └── cacheService.ts         # Caching layer
│   └── utils/
│       └── mockData.ts             # Mock data for testing
├── .env.example                    # Environment variables template
├── DEPLOYMENT.md                   # Deployment guide
└── README.md                       # This file
```

## How It Works

1. **Fetch Transactions**: Queries blockchain explorers for all transactions
   - Normal transactions (native tokens)
   - Token transfers (ERC-20)
   - Parallel queries across all chains

2. **Enrich with Prices**: Fetches historical prices from CoinGecko
   - Price at transaction time for cost basis
   - Caches prices to minimize API calls

3. **Calculate P&L**:
   - Tracks positions using selected cost basis method (FIFO/LIFO/AVG)
   - Matches sells with buys to calculate realized P&L
   - Calculates unrealized P&L on remaining holdings

4. **Aggregate Results**:
   - Group by chain
   - Group by token
   - Calculate overall portfolio summary

## Performance

- **Response Time**: < 10 seconds for wallets with < 1000 transactions
- **Caching**:
  - Transactions: 10 minutes TTL (configurable)
  - Prices: 2 minutes TTL (configurable)
- **Concurrent Queries**: Fetches from all chains in parallel
- **Retry Logic**: Exponential backoff for failed requests

## Cost Basis Methods Explained

### FIFO (First In, First Out)
Sells the oldest purchased tokens first. Most commonly used for tax reporting.

**Example:**
- Buy 2 ETH @ $1800 (Day 1)
- Buy 1 ETH @ $2000 (Day 2)
- Sell 1 ETH @ $2200 (Day 3)
- **Realized P&L**: $2200 - $1800 = $400 (uses Day 1 purchase)

### LIFO (Last In, First Out)
Sells the most recently purchased tokens first.

**Example:** (same scenario)
- **Realized P&L**: $2200 - $2000 = $200 (uses Day 2 purchase)

### Average
Uses the average purchase price across all holdings.

**Example:** (same scenario)
- Average price: ($1800 × 2 + $2000 × 1) / 3 = $1866.67
- **Realized P&L**: $2200 - $1866.67 = $333.33

## Caching Strategy

The agent implements a two-tier caching system:

### Transaction Cache
- **TTL**: 10 minutes (configurable)
- **Key**: `tx:{chain}:{wallet_address}`
- **Purpose**: Reduce API calls to blockchain explorers

### Price Cache
- **Current Prices TTL**: 2 minutes (configurable)
- **Historical Prices TTL**: 24 hours
- **Key**: `price:{symbol}` or `price:hist:{symbol}:{date}`
- **Purpose**: Minimize CoinGecko API calls

### Cache Management

```bash
# Clear all caches
curl -X POST https://your-domain.com/api/clear_cache

# Get cache statistics
curl https://your-domain.com/api/cache_stats
```

## Error Handling

The agent includes comprehensive error handling:

- **Rate Limiting**: Automatic retry with exponential backoff
- **Missing API Keys**: Warnings logged, continues with other chains
- **Invalid Addresses**: Returns empty result
- **Network Errors**: Retries up to 3 times
- **Price Data Unavailable**: Returns 0 for unknown tokens

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions including:

- Getting API keys
- Configuring environment variables
- Deploying to VPS/cloud platforms
- Setting up x402 protocol
- Monitoring and maintenance
- Security best practices

## Testing

### With Mock Data

```bash
npx tsx test.ts
```

### With Real Wallet

Create `.env` with your API keys, then:

```bash
npm run dev
```

Test with a real wallet address (e.g., Vitalik's wallet):
```
wallet_address: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

## Limitations & Future Enhancements

### Current Limitations

- **No DEX Trade Detection**: Treats all transfers as transfers (not buy/sell)
- **No NFT Support**: Only tracks fungible tokens (ERC-20)
- **No Gas Fee Tracking**: Gas fees not included in cost basis
- **Limited Token Coverage**: Only ~20 tokens mapped to CoinGecko

### Planned Enhancements

- [ ] DEX trade detection (Uniswap, Sushiswap, etc.)
- [ ] NFT tracking
- [ ] Gas fee inclusion in cost basis
- [ ] LP token support
- [ ] CSV/JSON export
- [ ] Tax reporting features
- [ ] Multi-wallet aggregation
- [ ] Real x402 payment integration
- [ ] Redis caching for distributed systems
- [ ] Webhook notifications
- [ ] Historical portfolio snapshots

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Bounty Completion Checklist

- [x] Multi-chain support (6 chains: Ethereum, Base, Arbitrum, Optimism, Polygon, BSC)
- [x] Real blockchain data fetching (Etherscan-like APIs)
- [x] Real price data (CoinGecko)
- [x] Multiple cost basis methods (FIFO, LIFO, Average)
- [x] Realized & unrealized P&L calculation
- [x] Caching layer for performance
- [x] Error handling and retry logic
- [x] Mock x402 payment handler
- [ ] Deployment to domain (requires server)
- [ ] x402 protocol integration (requires deployment)

## License

ISC

## Support

For issues and questions:
- Open an issue on GitHub
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Review API documentation for blockchain explorers and CoinGecko

---

Built with [@lucid-dreams/agent-kit](https://github.com/lucid-dreams/agent-kit)
