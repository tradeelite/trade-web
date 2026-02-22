export type SignalDirection = "bullish" | "bearish" | "neutral";

export interface SignalResult {
  signal: SignalDirection;
  label: string;
  detail?: string;
}

export interface TrendAnalysis {
  overall: SignalDirection;
  priceVsSma20: SignalResult;
  priceVsSma50: SignalResult;
  priceVsSma200: SignalResult;
  sma20Slope: SignalResult;
  sma50Slope: SignalResult;
  sma200Slope: SignalResult;
}

export interface CrossoverAnalysis {
  state: "golden_cross" | "death_cross" | "none";
  signal: SignalDirection;
  label: string;
  detail?: string;
  lastCrossoverDate: string | null;
  daysSinceCrossover: number | null;
}

export interface MomentumAnalysis {
  rsi: SignalResult & { value: number | null };
  macdSignal: SignalResult;
  macdHistogram: SignalResult & { direction: "strengthening" | "weakening" | "none" };
  bollingerPosition: SignalResult & {
    percentB: number | null;
    squeeze: boolean;
  };
}

export interface IndicatorAnalysisSummary {
  trend: TrendAnalysis;
  crossover: CrossoverAnalysis;
  momentum: MomentumAnalysis;
  overallSignal: SignalDirection;
  signalCount: { bullish: number; bearish: number; neutral: number };
}
