export const APP_NAME = "TradeElite.AI";

export const CHART_INTERVALS = {
  "1D": { label: "1 Day", interval: "5m" },
  "1W": { label: "1 Week", interval: "15m" },
  "1M": { label: "1 Month", interval: "1d" },
  "3M": { label: "3 Months", interval: "1d" },
  "1Y": { label: "1 Year", interval: "1d" },
  "5Y": { label: "5 Years", interval: "1wk" },
} as const;

export const DTE_THRESHOLDS = {
  CRITICAL: 7,
  WARNING: 21,
  SAFE: 45,
} as const;

export const SUGGESTION_RULES = {
  PROFIT_TARGET_PERCENT: 50,
  ROLL_DTE_THRESHOLD: 21,
  STRIKE_PROXIMITY_PERCENT: 3,
  EARNINGS_ALERT_DAYS: 14,
} as const;

export const QUERY_KEYS = {
  stockSearch: (q: string) => ["stocks", "search", q] as const,
  stockQuote: (ticker: string) => ["stocks", ticker, "quote"] as const,
  stockChart: (ticker: string, range: string) => ["stocks", ticker, "chart", range] as const,
  stockSummary: (ticker: string) => ["stocks", ticker, "summary"] as const,
  stockIndicators: (ticker: string, range: string) => ["stocks", ticker, "indicators", range] as const,
  stockNews: (ticker: string) => ["stocks", ticker, "news"] as const,
  stockSentiment: (ticker: string) => ["stocks", ticker, "sentiment"] as const,
  stockAnalysis: (ticker: string) => ["stocks", ticker, "ai-analysis"] as const,
  stockFundamentalAnalysis: (ticker: string) => ["stocks", ticker, "fundamental-analysis"] as const,
  stockTechnicalSignals: (ticker: string) => ["stocks", ticker, "technical-signals"] as const,
  portfolios: () => ["portfolios"] as const,
  portfolio: (id: string) => ["portfolios", id] as const,
  portfolioHoldings: (id: string) => ["portfolios", id, "holdings"] as const,
  optionTrades: (status?: string) => ["options", status ?? "all"] as const,
  optionSuggestions: () => ["options", "suggestions"] as const,
  earnings: (tickers: string[]) => ["earnings", ...tickers] as const,
  settings: () => ["settings"] as const,
  allowedUsers: () => ["users", "allowed"] as const,
} as const;

export const STALE_TIMES = {
  QUOTE: 30 * 1000,
  CHART: 5 * 60 * 1000,
  COMPANY: 60 * 60 * 1000,
  PORTFOLIO: 30 * 1000,
  OPTIONS: 60 * 1000,
  NEWS: 5 * 60 * 1000,
  SENTIMENT: 2 * 60 * 1000,
  ANALYSIS: 10 * 60 * 1000,
  TECHNICAL_SIGNALS: 10 * 60 * 1000,
} as const;

export const BROKERAGES = [
  "Schwab",
  "Fidelity",
  "Robinhood",
  "TD Ameritrade",
  "E*TRADE",
  "Interactive Brokers",
  "Tastytrade",
  "Webull",
  "Other",
] as const;
