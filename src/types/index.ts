export interface Transaction {
  tx_hash: string;
  chain: string;
  timestamp: number;
  type: "buy" | "sell" | "transfer_in" | "transfer_out";
  token_symbol: string;
  token_address: string;
  quantity: number;
  price_usd: number;
  total_value_usd: number;
  realized_pnl_usd?: number;
}

export interface TokenPnL {
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
}

export interface ChainPnL {
  chain: string;
  realized_pnl_usd: number;
  unrealized_pnl_usd: number;
  total_pnl_usd: number;
  pnl_percentage: number;
}

export interface PnLSummary {
  total_realized_pnl_usd: number;
  total_unrealized_pnl_usd: number;
  total_pnl_usd: number;
  total_pnl_percentage: number;
  initial_investment_usd: number;
  current_value_usd: number;
}

export interface PnLResult {
  summary: PnLSummary;
  by_chain: ChainPnL[];
  by_token: TokenPnL[];
  transactions: Transaction[];
  metadata: {
    last_updated: number;
    chains_queried: string[];
    data_sources: string[];
  };
}

export type CostBasisMethod = "fifo" | "lifo" | "avg";

export interface WalletInput {
  wallet_address: string;
  chains?: string[];
  time_period?: "24h" | "7d" | "30d" | "90d" | "1y" | "all";
  include_tokens?: string[];
  cost_basis_method?: CostBasisMethod;
}

export interface Position {
  quantity: number;
  price_usd: number;
  timestamp: number;
  tx_hash: string;
}
