import { SUGGESTION_RULES } from "@/lib/constants";
import { calculateDTE } from "./dte";
import type { OptionTrade, Suggestion } from "@/types/options";

export function evaluateTrade(
  trade: OptionTrade,
  currentPrice?: number,
  earningsDate?: string | null
): Suggestion[] {
  if (trade.status !== "open") return [];
  const suggestions: Suggestion[] = [];
  const dte = calculateDTE(trade.expiryDate);

  // Rule 1: Close at >50% profit (for sold options)
  if (trade.direction === "sell" && currentPrice != null) {
    const profitPercent =
      ((trade.premium - currentPrice) / trade.premium) * 100;
    if (profitPercent >= SUGGESTION_RULES.PROFIT_TARGET_PERCENT) {
      suggestions.push({
        tradeId: trade.id,
        ticker: trade.ticker,
        action: "close",
        reason: `>${SUGGESTION_RULES.PROFIT_TARGET_PERCENT}% profit target reached`,
        urgency: "medium",
        details: `Consider closing to lock in ~${profitPercent.toFixed(0)}% profit.`,
      });
    }
  }

  // Rule 2: Roll if DTE < 21
  if (dte <= SUGGESTION_RULES.ROLL_DTE_THRESHOLD && dte > 0) {
    suggestions.push({
      tradeId: trade.id,
      ticker: trade.ticker,
      action: "roll",
      reason: `${dte} DTE remaining`,
      urgency: dte <= 7 ? "high" : "medium",
      details: `Option expires in ${dte} days. Consider rolling to a later expiry.`,
    });
  }

  // Rule 3: Close if underlying within 3% of strike
  if (currentPrice != null) {
    const proximity =
      Math.abs((currentPrice - trade.strikePrice) / trade.strikePrice) * 100;
    if (proximity <= SUGGESTION_RULES.STRIKE_PROXIMITY_PERCENT) {
      suggestions.push({
        tradeId: trade.id,
        ticker: trade.ticker,
        action: "close",
        reason: `Underlying within ${proximity.toFixed(1)}% of strike`,
        urgency: "high",
        details: `Current price $${currentPrice.toFixed(2)} is near strike $${trade.strikePrice}. Assignment risk elevated.`,
      });
    }
  }

  // Rule 4: Earnings alert
  if (earningsDate) {
    const earningsDt = new Date(earningsDate);
    const expiryDt = new Date(trade.expiryDate);
    const daysDiff = Math.abs(
      (earningsDt.getTime() - expiryDt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff <= SUGGESTION_RULES.EARNINGS_ALERT_DAYS) {
      suggestions.push({
        tradeId: trade.id,
        ticker: trade.ticker,
        action: "alert",
        reason: `Earnings on ${earningsDate} near expiry`,
        urgency: "high",
        details: `Earnings ${Math.ceil(daysDiff)} days from expiry. Volatility risk.`,
      });
    }
  }

  return suggestions;
}

export function evaluateAllTrades(
  trades: OptionTrade[],
  priceMap: Record<string, number>,
  earningsMap: Record<string, string | null>
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  for (const trade of trades) {
    suggestions.push(
      ...evaluateTrade(trade, priceMap[trade.ticker], earningsMap[trade.ticker])
    );
  }
  return suggestions.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.urgency] - order[b.urgency];
  });
}
