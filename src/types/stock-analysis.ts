export type SignalDirection = "bullish" | "bearish" | "neutral";
export type Recommendation = "Buy" | "Sell" | "Hold" | "Watch";
export type OverallRecommendation = "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";
export type Confidence = "high" | "medium" | "low";
export type ValuationSignal = "undervalued" | "fairly_valued" | "overvalued";
export type HealthSignal = "strong" | "moderate" | "weak";
export type AttributeSignal = "bullish" | "neutral" | "bearish";

export interface MovingAverageRow {
  name: string;
  value: number | null;
  priceVsMA: "above" | "below";
  direction: "up" | "down" | "flat";
  signal: "Buy" | "Sell" | "Neutral";
}

export interface TechnicalAnalysis {
  ticker: string;
  snapshot?: {
    currentPrice: number | null;
    changePercent: number | null;
    relativeVolume: number | null;
    distanceFrom52wHigh: number | null;
    distanceFrom52wLow: number | null;
    distanceFrom200SMA: number | null;
  };
  trend: {
    direction: SignalDirection;
    strength: "strong" | "moderate" | "weak";
    detail: string;
    chartPattern?: string;
    goldenCross?: boolean;
    deathCross?: boolean;
  };
  movingAverages?: MovingAverageRow[];
  momentum: {
    signal: SignalDirection;
    rsi: number | null;
    rsiWeekly?: number | null;
    rsiStatus?: string;
    rsiDivergence?: boolean;
    macd: string;
    macdHistogram?: string;
    bollingerPosition: string;
    stochasticK?: number | null;
    stochasticD?: number | null;
    stochasticStatus?: string;
    roc10d?: number | null;
    roc20d?: number | null;
  };
  trendStrength?: {
    adx: number | null;
    adxStrength: "weak" | "moderate" | "strong";
    plusDI: number | null;
    minusDI: number | null;
    diControl: "bulls" | "bears" | "neutral";
    relativeStrength1M?: string;
    relativeStrength3M?: string;
    relativeStrength6M?: string;
  };
  volume: {
    signal: SignalDirection;
    relativeVolume: number | null;
    trend: "increasing" | "decreasing" | "stable";
    obv?: string;
    vwap?: number | null;
    priceVsVWAP?: "above" | "below";
    accDistribution?: string;
    volumeConfirms?: boolean;
  };
  volatility?: {
    bollingerPosition: string;
    bollingerBandwidth?: string;
    atr: number | null;
    atrPercent: number | null;
    beta: number | null;
    iv?: string;
  };
  supportResistance: {
    support: number | null;
    resistance: number | null;
    support2?: number | null;
    resistance2?: number | null;
  };
  aggregatedSignals?: {
    barchartOpinion: string;
    tradingViewRating: string;
    signalCount: { buy: number; neutral: number; sell: number };
  };
  signals: {
    shortTerm: SignalDirection;
    mediumTerm: SignalDirection;
    longTerm: SignalDirection;
  };
  shortTermPrediction?: {
    bias: SignalDirection;
    entryZone: string;
    target: number | null;
    stop: number | null;
    riskReward: string;
    confidence: Confidence;
    reasoning: string;
  };
  mediumTermPrediction?: {
    bias: SignalDirection;
    keyLevel: number | null;
    targetRange: string;
    confidence: Confidence;
    reasoning: string;
  };
  longTermPrediction?: {
    bias: SignalDirection;
    targetZone: string;
    confidence: Confidence;
    reasoning: string;
  };
  risks?: string[];
  recommendation: Recommendation;
  summary: string;
}

export interface FundamentalAnalysis {
  ticker: string;
  asOf?: string | null;
  priceContext?: {
    currentPrice: number | null;
    marketCap: number | null;
    enterpriseValue: number | null;
  } | null;
  attributes?: Record<string, {
    signal?: AttributeSignal;
    score?: number | null;
    metrics?: Record<string, number | string | null | string[]>;
    explanation?: string;
    items?: string[];
  }> | null;
  aiAnalysis?: {
    overallScore?: number | null;
    recommendation?: OverallRecommendation | Recommendation | null;
    confidence?: Confidence | null;
    horizonView?: {
      shortTerm?: SignalDirection | null;
      mediumTerm?: SignalDirection | null;
      longTerm?: SignalDirection | null;
    } | null;
    bullCase?: string[];
    bearCase?: string[];
    keyDrivers?: string[];
    finalExplanation?: string;
  } | null;
  sources?: Array<{
    name?: string;
    url?: string;
    publishedAt?: string | null;
    usedFor?: string[];
    quality?: "high" | "medium" | "low" | string;
  }>;
  valuation: {
    signal: ValuationSignal;
    peRatio: number | null;
    forwardPE: number | null;
    pegRatio: number | null;
    priceToBook: number | null;
  };
  financialHealth: {
    signal: HealthSignal;
    debtToEquity: number | null;
    currentRatio: number | null;
    operatingMargin: string;
    returnOnEquity: string;
  };
  growth: {
    signal: HealthSignal;
    revenueGrowth: string;
    earningsGrowth: string;
    epsTTM: number | null;
  };
  analystConsensus: {
    rating: string;
    targetPrice: number | null;
    numAnalysts: number;
    breakdown: {
      strongBuy: number;
      buy: number;
      hold: number;
      sell: number;
    };
  };
  earnings: {
    trend: "beating" | "missing" | "inline";
    lastQuarters: Array<{
      date: string;
      estimated: number | null;
      actual: number | null;
      surprisePercent: number | null;
    }>;
  };
  recommendation: Recommendation;
  summary: string;
}

export interface NewsAnalysis {
  ticker: string;
  overallSentiment: SignalDirection;
  socialSentiment: {
    signal: SignalDirection;
    bullishPercent: number | null;
    watchlistCount: number | null;
  };
  newsSentiment: "positive" | "negative" | "mixed";
  catalysts: string[];
  risks: string[];
  keyEvents: string[];
  headlines: Array<{
    title: string;
    source: string;
    url: string;
    publishedAt: string;
  }>;
  recommendation: Recommendation;
  summary: string;
}

export interface StockAnalysis {
  ticker: string;
  overallSignal: SignalDirection;
  overallRecommendation: OverallRecommendation;
  confidence: Confidence;
  shortTerm: SignalDirection;
  mediumTerm: SignalDirection;
  longTerm: SignalDirection;
  technical: TechnicalAnalysis;
  fundamental: FundamentalAnalysis;
  news: NewsAnalysis;
  executiveSummary: string;
}
