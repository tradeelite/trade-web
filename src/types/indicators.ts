export interface IndicatorDataPoint {
  time: number;
  value: number;
}

export interface MacdDataPoint {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerBandsDataPoint {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface IndicatorConfig {
  sma: { enabled: boolean; periods: number[] };
  ema: { enabled: boolean; periods: number[] };
  rsi: { enabled: boolean; period: number };
  macd: { enabled: boolean; fastPeriod: number; slowPeriod: number; signalPeriod: number };
  bollingerBands: { enabled: boolean; period: number; stdDev: number };
}

export const defaultIndicatorConfig: IndicatorConfig = {
  sma: { enabled: true, periods: [20, 50, 200] },
  ema: { enabled: false, periods: [12, 26] },
  rsi: { enabled: true, period: 14 },
  macd: { enabled: true, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  bollingerBands: { enabled: false, period: 20, stdDev: 2 },
};
