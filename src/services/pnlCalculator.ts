import {
  Transaction,
  Position,
  TokenPnL,
  ChainPnL,
  PnLSummary,
  PnLResult,
  CostBasisMethod,
} from "../types/index.js";

/**
 * P&L Calculator Service
 * Calculates realized and unrealized profit/loss using various cost basis methods
 */
export class PnLCalculator {
  private positions: Map<string, Position[]> = new Map();
  private tokenPnL: Map<string, TokenPnL> = new Map();
  private method: CostBasisMethod;

  constructor(method: CostBasisMethod = "fifo") {
    this.method = method;
  }

  /**
   * Calculate P&L from transactions
   */
  calculate(
    transactions: Transaction[],
    currentPrices: Map<string, number>
  ): PnLResult {
    // Reset state
    this.positions.clear();
    this.tokenPnL.clear();

    // Sort transactions by timestamp
    const sortedTxs = [...transactions].sort((a, b) => a.timestamp - b.timestamp);

    // Process each transaction
    for (const tx of sortedTxs) {
      this.processTransaction(tx);
    }

    // Calculate unrealized P&L for remaining positions
    this.calculateUnrealizedPnL(currentPrices);

    // Aggregate results
    const byToken = Array.from(this.tokenPnL.values());
    const byChain = this.aggregateByChain(byToken);
    const summary = this.calculateSummary(byToken);

    // Add realized P&L to transactions
    const processedTxs = sortedTxs.map((tx) => ({
      ...tx,
      realized_pnl_usd: tx.type === "sell" ? tx.realized_pnl_usd : undefined,
    }));

    return {
      summary,
      by_chain: byChain,
      by_token: byToken,
      transactions: processedTxs,
      metadata: {
        last_updated: Date.now(),
        chains_queried: [...new Set(transactions.map((tx) => tx.chain))],
        data_sources: ["etherscan", "defillama", "coingecko"],
      },
    };
  }

  /**
   * Process a single transaction
   */
  private processTransaction(tx: Transaction): void {
    const key = this.getTokenKey(tx.chain, tx.token_symbol, tx.token_address);

    if (tx.type === "buy" || tx.type === "transfer_in") {
      this.addPosition(key, tx);
    } else if (tx.type === "sell" || tx.type === "transfer_out") {
      this.removePosition(key, tx);
    }
  }

  /**
   * Add a position (buy or transfer in)
   */
  private addPosition(key: string, tx: Transaction): void {
    const positions = this.positions.get(key) || [];

    // Use the transaction price for cost basis
    // This includes both buys and transfers in
    positions.push({
      quantity: tx.quantity,
      price_usd: tx.price_usd,
      timestamp: tx.timestamp,
      tx_hash: tx.tx_hash,
    });

    this.positions.set(key, positions);
    this.updateTokenPnL(key, tx.chain, tx.token_symbol, tx.token_address);
  }

  /**
   * Remove a position (sell or transfer out) and calculate realized P&L
   */
  private removePosition(key: string, tx: Transaction): void {
    const positions = this.positions.get(key) || [];
    let remainingQuantity = tx.quantity;
    let totalCostBasis = 0;

    // Apply cost basis method
    const orderedPositions = this.orderPositions(positions);

    for (let i = 0; i < orderedPositions.length && remainingQuantity > 0; i++) {
      const position = orderedPositions[i];
      const quantityToSell = Math.min(position.quantity, remainingQuantity);

      totalCostBasis += quantityToSell * position.price_usd;
      position.quantity -= quantityToSell;
      remainingQuantity -= quantityToSell;
    }

    // Remove fully consumed positions
    this.positions.set(
      key,
      positions.filter((p) => p.quantity > 0)
    );

    // Calculate realized P&L
    const saleProceeds = tx.quantity * tx.price_usd;
    const realizedPnL = saleProceeds - totalCostBasis;
    tx.realized_pnl_usd = realizedPnL;

    this.updateTokenPnL(key, tx.chain, tx.token_symbol, tx.token_address, realizedPnL);
  }

  /**
   * Order positions based on cost basis method
   */
  private orderPositions(positions: Position[]): Position[] {
    switch (this.method) {
      case "fifo":
        return [...positions].sort((a, b) => a.timestamp - b.timestamp);
      case "lifo":
        return [...positions].sort((a, b) => b.timestamp - a.timestamp);
      case "avg":
        // For average, we treat all positions as one with average price
        const totalQuantity = positions.reduce((sum, p) => sum + p.quantity, 0);
        const totalValue = positions.reduce(
          (sum, p) => sum + p.quantity * p.price_usd,
          0
        );
        const avgPrice = totalValue / totalQuantity;
        return positions.map((p) => ({ ...p, price_usd: avgPrice }));
      default:
        return positions;
    }
  }

  /**
   * Update token P&L entry
   */
  private updateTokenPnL(
    key: string,
    chain: string,
    symbol: string,
    address: string,
    realizedPnL: number = 0
  ): void {
    const existing = this.tokenPnL.get(key) || {
      token_symbol: symbol,
      token_address: address,
      chain,
      quantity_held: 0,
      average_buy_price_usd: 0,
      current_price_usd: 0,
      realized_pnl_usd: 0,
      unrealized_pnl_usd: 0,
      total_pnl_usd: 0,
      pnl_percentage: 0,
    };

    existing.realized_pnl_usd += realizedPnL;

    // Recalculate holdings and average price
    const positions = this.positions.get(key) || [];
    const totalQuantity = positions.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = positions.reduce(
      (sum, p) => sum + p.quantity * p.price_usd,
      0
    );

    existing.quantity_held = totalQuantity;
    existing.average_buy_price_usd = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    this.tokenPnL.set(key, existing);
  }

  /**
   * Calculate unrealized P&L for remaining positions
   */
  private calculateUnrealizedPnL(currentPrices: Map<string, number>): void {
    for (const [key, pnl] of this.tokenPnL.entries()) {
      const currentPrice = currentPrices.get(pnl.token_symbol) || 0;
      pnl.current_price_usd = currentPrice;

      if (pnl.quantity_held > 0) {
        const currentValue = pnl.quantity_held * currentPrice;
        const costBasis = pnl.quantity_held * pnl.average_buy_price_usd;
        pnl.unrealized_pnl_usd = currentValue - costBasis;
      }

      pnl.total_pnl_usd = pnl.realized_pnl_usd + pnl.unrealized_pnl_usd;

      const totalCostBasis =
        pnl.quantity_held * pnl.average_buy_price_usd +
        Math.abs(pnl.realized_pnl_usd); // Approximate original cost basis
      pnl.pnl_percentage =
        totalCostBasis > 0 ? (pnl.total_pnl_usd / totalCostBasis) * 100 : 0;
    }
  }

  /**
   * Aggregate P&L by chain
   */
  private aggregateByChain(tokens: TokenPnL[]): ChainPnL[] {
    const chainMap = new Map<string, ChainPnL>();

    for (const token of tokens) {
      const existing = chainMap.get(token.chain) || {
        chain: token.chain,
        realized_pnl_usd: 0,
        unrealized_pnl_usd: 0,
        total_pnl_usd: 0,
        pnl_percentage: 0,
      };

      existing.realized_pnl_usd += token.realized_pnl_usd;
      existing.unrealized_pnl_usd += token.unrealized_pnl_usd;
      existing.total_pnl_usd += token.total_pnl_usd;

      chainMap.set(token.chain, existing);
    }

    // Calculate percentage for each chain
    for (const chain of chainMap.values()) {
      const totalInvested = Math.abs(chain.total_pnl_usd - chain.realized_pnl_usd);
      chain.pnl_percentage =
        totalInvested > 0 ? (chain.total_pnl_usd / totalInvested) * 100 : 0;
    }

    return Array.from(chainMap.values());
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(tokens: TokenPnL[]): PnLSummary {
    const total_realized = tokens.reduce((sum, t) => sum + t.realized_pnl_usd, 0);
    const total_unrealized = tokens.reduce((sum, t) => sum + t.unrealized_pnl_usd, 0);
    const current_value = tokens.reduce(
      (sum, t) => sum + t.quantity_held * t.current_price_usd,
      0
    );

    // Cost basis of remaining holdings
    const remaining_cost_basis = tokens.reduce(
      (sum, t) => sum + t.quantity_held * t.average_buy_price_usd,
      0
    );

    // Initial investment = what you paid for remaining holdings + what you got from sales
    // If realized_pnl is positive, you sold for more than cost, so add the sale proceeds
    // If realized_pnl is negative, you sold for less than cost, so the initial was higher
    const total_sale_proceeds = tokens.reduce((sum, t) => {
      // This is a simplification - in reality we'd track actual sale proceeds
      // But we can estimate: if realized_pnl > 0, we made money on sales
      return sum + t.realized_pnl_usd;
    }, 0);

    // The actual money initially put in = current cost basis + (sale proceeds - realized gains)
    const initial_investment = remaining_cost_basis + (total_sale_proceeds >= 0 ?
      total_sale_proceeds : -total_sale_proceeds);

    // Total P&L = (current value - remaining cost basis) + realized P&L
    // This simplifies to: current_value - initial_investment
    const total_pnl = (current_value - remaining_cost_basis) + total_realized;

    // Alternative correct calculation: current_value - initial_investment + sale_proceeds
    const total_change = current_value - initial_investment;

    const pnl_percentage =
      initial_investment > 0 ? (total_change / initial_investment) * 100 : 0;

    return {
      total_realized_pnl_usd: total_realized,
      total_unrealized_pnl_usd: total_unrealized,
      total_pnl_usd: total_change, // This is the real P&L: current - initial
      total_pnl_percentage: pnl_percentage,
      initial_investment_usd: initial_investment,
      current_value_usd: current_value,
    };
  }

  /**
   * Generate unique key for token position
   */
  private getTokenKey(chain: string, symbol: string, address: string): string {
    return `${chain}:${symbol}:${address}`.toLowerCase();
  }
}
