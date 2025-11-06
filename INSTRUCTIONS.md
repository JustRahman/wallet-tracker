# Wallet P&L Tracker - Bounty Specification

## Purpose
Track realized and unrealized profit & loss (P&L) across multiple blockchain networks for any wallet address, providing comprehensive portfolio performance analytics.

## Overview
Build an agent that calculates and tracks both realized gains (from completed trades/transfers) and unrealized gains (from current holdings) across multiple blockchain networks. The agent should provide detailed P&L breakdowns by token, chain, and time period.

## Specification

### Job
Return comprehensive P&L metrics for a given wallet address across supported chains.

### Inputs
```typescript
{
  wallet_address: string;        // Wallet address to track
  chains?: string[];             // Array of chains to query (default: all supported)
  time_period?: string;          // "24h" | "7d" | "30d" | "90d" | "1y" | "all"
  include_tokens?: string[];     // Specific tokens to track (optional)
  cost_basis_method?: string;    // "fifo" | "lifo" | "avg" (default: "fifo")
}
```

### Returns
```typescript
{
  summary: {
    total_realized_pnl_usd: number;
    total_unrealized_pnl_usd: number;
    total_pnl_usd: number;
    total_pnl_percentage: number;
    initial_investment_usd: number;
    current_value_usd: number;
  };
  
  by_chain: Array<{
    chain: string;
    realized_pnl_usd: number;
    unrealized_pnl_usd: number;
    total_pnl_usd: number;
    pnl_percentage: number;
  }>;
  
  by_token: Array<{
    token_symbol: string;
    token_address: string;
    chain: string;
    quantity_held: number;
    average_buy_price_usd: number;
    current_price_usd: number;
    realized_pnl_usd: number;
    unrealized_pnl_usd: number;
    total_pnl_usd: number;
    pnl_percentage: number;
  }>;
  
  transactions: Array<{
    tx_hash: string;
    chain: string;
    timestamp: number;
    type: "buy" | "sell" | "transfer_in" | "transfer_out";
    token_symbol: string;
    token_address: string;
    quantity: number;
    price_usd: number;
    total_value_usd: number;
    realized_pnl_usd?: number;  // Only for sell transactions
  }>;
  
  metadata: {
    last_updated: number;
    chains_queried: string[];
    data_sources: string[];
  };
}
```

## Supported Chains (Minimum)
- Ethereum
- Base
- Arbitrum
- Optimism
- Polygon
- BSC (Binance Smart Chain)

## Technical Requirements

### 1. Transaction History Fetching
- Use blockchain explorers APIs (Etherscan, Basescan, etc.) or RPC nodes
- Fetch all transactions for the wallet address
- Parse token transfers (ERC-20 events)
- Handle native token transfers (ETH, MATIC, etc.)

### 2. Price Data
- Fetch historical prices at transaction time
- Get current prices for unrealized P&L calculation
- Support multiple price sources:
  - CoinGecko API
  - DeFiLlama API
  - DEX aggregators (1inch, 0x)
  - On-chain price oracles (Chainlink, Pyth)

### 3. P&L Calculation Logic

#### Realized P&L
- Track each buy transaction with quantity and price
- When a sell occurs, match against buy transactions using cost basis method:
  - **FIFO**: First In, First Out (default)
  - **LIFO**: Last In, First Out
  - **Average**: Average cost basis
- Calculate gain/loss: `(sell_price - buy_price) × quantity`

#### Unrealized P&L
- For remaining holdings, calculate:
  - `(current_price - average_buy_price) × quantity_held`

### 4. Multi-Chain Aggregation
- Query each chain in parallel for efficiency
- Aggregate results across all chains
- Handle same token on different chains separately
- Normalize token addresses and symbols

### 5. Caching Strategy
- Cache transaction history (update every 5-10 minutes)
- Cache price data (update every 1-2 minutes)
- Store processed P&L calculations
- Implement incremental updates for new transactions

## Acceptance Criteria

✅ **Accuracy**: P&L calculations must be mathematically correct and verifiable
- Test against known wallets with documented trades
- Cross-reference with existing portfolio trackers (DeBank, Zapper)
- Margin of error < 1% for total P&L

✅ **Multi-Chain Support**: Successfully tracks at least 6 major chains
- All listed chains must be supported
- Handle chain-specific nuances (different block times, confirmation delays)

✅ **Real-Time Data**: Returns current unrealized P&L based on latest prices
- Price data should be < 5 minutes old
- Transaction history should be < 10 minutes old

✅ **Performance**: Response time < 10 seconds for wallets with < 1000 transactions
- Implement proper caching
- Use parallel queries where possible

✅ **Cost Basis Methods**: All three methods (FIFO, LIFO, AVG) must work correctly
- Results should be verifiable against manual calculations

✅ **Deployment**: Must be deployed on a domain and reachable via x402 protocol

## Done When
Agent accurately calculates and reports both realized and unrealized P&L across multiple chains, with verifiable accuracy and proper cost basis accounting.

## Implementation Guide

### Phase 1: Setup (Est. 2-4 hours)
1. Initialize project with `@lucid-dreams/agent-kit`
2. Set up TypeScript configuration
3. Install dependencies:
   - Web3 libraries (ethers.js or viem)
   - Price data APIs
   - Blockchain explorer clients

### Phase 2: Data Fetching (Est. 4-6 hours)
1. Implement transaction history fetchers for each chain
2. Build price data fetching layer
3. Create caching system
4. Handle API rate limits and errors

### Phase 3: P&L Calculation Engine (Est. 6-8 hours)
1. Build cost basis tracking system
2. Implement FIFO/LIFO/AVG algorithms
3. Calculate realized P&L from completed trades
4. Calculate unrealized P&L from current holdings
5. Aggregate across chains and tokens

### Phase 4: Testing & Validation (Est. 4-6 hours)
1. Test with known wallet addresses
2. Verify calculations against other tools
3. Test edge cases (airdrops, fees, failed transactions)
4. Performance optimization

### Phase 5: Deployment (Est. 2-3 hours)
1. Deploy to production environment
2. Configure x402 protocol access
3. Set up monitoring and logging
4. Documentation

**Total Estimated Time: 18-27 hours**

## Basic Example

```typescript
import { z } from "zod";
import { createAgentApp } from "@lucid-dreams/agent-kit";

const { app, addEntrypoint } = createAgentApp({
  name: "wallet-pnl-tracker",
  version: "0.1.0",
  description: "Track realized and unrealized P&L across multiple chains",
});

const InputSchema = z.object({
  wallet_address: z.string(),
  chains: z.array(z.string()).optional(),
  time_period: z.enum(["24h", "7d", "30d", "90d", "1y", "all"]).optional(),
  include_tokens: z.array(z.string()).optional(),
  cost_basis_method: z.enum(["fifo", "lifo", "avg"]).optional(),
});

addEntrypoint({
  key: "calculate_pnl",
  description: "Calculate P&L for a wallet across chains",
  input: InputSchema,
  async handler({ input }) {
    const {
      wallet_address,
      chains = ["ethereum", "base", "arbitrum", "optimism", "polygon", "bsc"],
      time_period = "all",
      cost_basis_method = "fifo",
    } = input;

    // 1. Fetch transaction history from all chains
    const transactions = await fetchMultiChainTransactions(wallet_address, chains);

    // 2. Get historical and current prices
    const prices = await fetchPriceData(transactions);

    // 3. Calculate realized P&L
    const realizedPnl = calculateRealizedPnL(transactions, prices, cost_basis_method);

    // 4. Calculate unrealized P&L
    const unrealizedPnl = calculateUnrealizedPnL(
      getCurrentHoldings(transactions),
      prices
    );

    // 5. Aggregate results
    const summary = aggregatePnL(realizedPnl, unrealizedPnl);

    return {
      output: {
        summary,
        by_chain: groupByChain(realizedPnl, unrealizedPnl),
        by_token: groupByToken(realizedPnl, unrealizedPnl),
        transactions: formatTransactions(transactions),
        metadata: {
          last_updated: Date.now(),
          chains_queried: chains,
          data_sources: ["etherscan", "coingecko"],
        },
      },
      usage: { total_tokens: 1000 },
    };
  },
});

export default app;
```

## Resources

### APIs & Services
- **Blockchain Data**:
  - Etherscan API (Ethereum)
  - Basescan API (Base)
  - Arbiscan API (Arbitrum)
  - Polygonscan API (Polygon)
  - BSCscan API (BSC)
  - Alchemy/Infura RPC endpoints

- **Price Data**:
  - CoinGecko API: https://www.coingecko.com/en/api
  - DeFiLlama API: https://defillama.com/docs/api
  - Moralis API: https://moralis.io/api/

- **Agent Framework**:
  - `@lucid-dreams/agent-kit`

### Libraries
```json
{
  "dependencies": {
    "@lucid-dreams/agent-kit": "latest",
    "ethers": "^6.x",
    "axios": "^1.x",
    "node-cache": "^5.x",
    "zod": "^3.x"
  }
}
```

## Bounty Value
**$1,000**

## Submission
Submission is a PR into the agent-bounties repo linking this issue - first in, first served if the bounty has been completed and meets all acceptance criteria.

## Testing Checklist
- [ ] Test with at least 3 different wallet addresses
- [ ] Verify calculations against DeBank or Zapper
- [ ] Test all 6 supported chains
- [ ] Test all cost basis methods (FIFO, LIFO, AVG)
- [ ] Handle wallets with 0 transactions
- [ ] Handle wallets with only airdrops/transfers
- [ ] Test with high-volume wallets (1000+ transactions)
- [ ] Verify API rate limiting doesn't break functionality
- [ ] Test x402 protocol accessibility
- [ ] Performance test: < 10 seconds for typical wallet

## Edge Cases to Handle
1. **Airdrops**: Should be treated as $0 cost basis until sold
2. **Gas Fees**: Can be included in cost basis (optional)
3. **Failed Transactions**: Should be ignored
4. **Partial Sells**: Must correctly calculate using cost basis method
5. **Cross-Chain Bridges**: Track as sell on one chain, buy on another
6. **LP Tokens**: Should track underlying assets if possible
7. **NFTs**: Can be excluded or tracked separately

## Notes
- Focus on fungible tokens (ERC-20) initially
- NFTs can be a future enhancement
- Consider adding export functionality (CSV, JSON)
- Tax reporting features could be added later
- Multi-wallet aggregation could be a premium feature