import type { OptionTrade } from "@/types/options";

export interface TradePnL {
  tradeId: number;
  ticker: string;
  realizedPnL: number | null;
  unrealizedPnL: number | null;
  totalPremiumReceived: number;
  totalPremiumPaid: number;
}

export function calculateTradePnL(trade: OptionTrade): TradePnL {
  const multiplier = 100;
  const totalPremium = trade.premium * trade.quantity * multiplier;
  const isSell = trade.direction === "sell";

  if (trade.status === "closed" && trade.closePremium != null) {
    const closeTotalPremium = trade.closePremium * trade.quantity * multiplier;
    const realizedPnL = isSell
      ? totalPremium - closeTotalPremium
      : closeTotalPremium - totalPremium;

    return {
      tradeId: trade.id,
      ticker: trade.ticker,
      realizedPnL,
      unrealizedPnL: null,
      totalPremiumReceived: isSell ? totalPremium : closeTotalPremium,
      totalPremiumPaid: isSell ? closeTotalPremium : totalPremium,
    };
  }

  return {
    tradeId: trade.id,
    ticker: trade.ticker,
    realizedPnL: null,
    unrealizedPnL: null,
    totalPremiumReceived: isSell ? totalPremium : 0,
    totalPremiumPaid: isSell ? 0 : totalPremium,
  };
}

export function calculateTotalPnL(trades: OptionTrade[]) {
  let totalRealized = 0;
  let totalPremiumReceived = 0;
  let totalPremiumPaid = 0;

  for (const trade of trades) {
    const pnl = calculateTradePnL(trade);
    if (pnl.realizedPnL != null) {
      totalRealized += pnl.realizedPnL;
    }
    totalPremiumReceived += pnl.totalPremiumReceived;
    totalPremiumPaid += pnl.totalPremiumPaid;
  }

  return {
    totalRealized,
    totalPremiumReceived,
    totalPremiumPaid,
    netPremium: totalPremiumReceived - totalPremiumPaid,
  };
}
