import type { ChartDataPoint } from "@/types/stock";
import type { IndicatorDataPoint, MacdDataPoint, BollingerBandsDataPoint } from "@/types/indicators";
import type {
  SignalDirection,
  SignalResult,
  TrendAnalysis,
  CrossoverAnalysis,
  MomentumAnalysis,
  IndicatorAnalysisSummary,
} from "@/types/analysis";

// ─── Helpers ──────────────────────────────────────────────

function lastValue(arr: IndicatorDataPoint[]): number | null {
  return arr.length > 0 ? arr[arr.length - 1].value : null;
}

function majority(signals: SignalDirection[]): SignalDirection {
  let b = 0, bear = 0, n = 0;
  for (const s of signals) {
    if (s === "bullish") b++;
    else if (s === "bearish") bear++;
    else n++;
  }
  if (b > bear && b > n) return "bullish";
  if (bear > b && bear > n) return "bearish";
  return "neutral";
}

// ─── Trend Analysis ───────────────────────────────────────

function comparePriceVsSma(
  lastClose: number,
  sma: IndicatorDataPoint[],
  period: number
): SignalResult {
  const smaVal = lastValue(sma);
  if (smaVal == null) {
    return { signal: "neutral", label: `SMA${period}: Insufficient data` };
  }
  const diff = (lastClose - smaVal) / smaVal;
  if (diff > 0.001) {
    return {
      signal: "bullish",
      label: `Price above SMA${period}`,
      detail: `$${lastClose.toFixed(2)} is ${(diff * 100).toFixed(1)}% above SMA${period} ($${smaVal.toFixed(2)})`,
    };
  }
  if (diff < -0.001) {
    return {
      signal: "bearish",
      label: `Price below SMA${period}`,
      detail: `$${lastClose.toFixed(2)} is ${(Math.abs(diff) * 100).toFixed(1)}% below SMA${period} ($${smaVal.toFixed(2)})`,
    };
  }
  return {
    signal: "neutral",
    label: `Price near SMA${period}`,
    detail: `$${lastClose.toFixed(2)} is at SMA${period} ($${smaVal.toFixed(2)})`,
  };
}

function analyzeSmaSlope(sma: IndicatorDataPoint[], period: number, lookback = 5): SignalResult {
  if (sma.length < lookback + 1) {
    return { signal: "neutral", label: `SMA${period} slope: Insufficient data` };
  }
  const recent = sma[sma.length - 1].value;
  const past = sma[sma.length - 1 - lookback].value;
  const pctChange = ((recent - past) / past) * 100;

  if (pctChange > 0.1) {
    return {
      signal: "bullish",
      label: `SMA${period} rising`,
      detail: `SMA${period} up ${pctChange.toFixed(2)}% over last ${lookback} periods`,
    };
  }
  if (pctChange < -0.1) {
    return {
      signal: "bearish",
      label: `SMA${period} falling`,
      detail: `SMA${period} down ${Math.abs(pctChange).toFixed(2)}% over last ${lookback} periods`,
    };
  }
  return {
    signal: "neutral",
    label: `SMA${period} flat`,
    detail: `SMA${period} changed ${pctChange.toFixed(2)}% over last ${lookback} periods`,
  };
}

function analyzeTrend(
  lastClose: number,
  sma20: IndicatorDataPoint[],
  sma50: IndicatorDataPoint[],
  sma200: IndicatorDataPoint[]
): TrendAnalysis {
  const priceVsSma20 = comparePriceVsSma(lastClose, sma20, 20);
  const priceVsSma50 = comparePriceVsSma(lastClose, sma50, 50);
  const priceVsSma200 = comparePriceVsSma(lastClose, sma200, 200);
  const sma20Slope = analyzeSmaSlope(sma20, 20);
  const sma50Slope = analyzeSmaSlope(sma50, 50);
  const sma200Slope = analyzeSmaSlope(sma200, 200);

  const overall = majority([
    priceVsSma20.signal,
    priceVsSma50.signal,
    priceVsSma200.signal,
    sma20Slope.signal,
    sma50Slope.signal,
    sma200Slope.signal,
  ]);

  return { overall, priceVsSma20, priceVsSma50, priceVsSma200, sma20Slope, sma50Slope, sma200Slope };
}

// ─── Crossover Analysis ──────────────────────────────────

function analyzeCrossover(
  sma50: IndicatorDataPoint[],
  sma200: IndicatorDataPoint[]
): CrossoverAnalysis {
  if (sma50.length === 0 || sma200.length === 0) {
    return {
      state: "none",
      signal: "neutral",
      label: "Insufficient data for crossover analysis",
      detail: "Need both SMA50 and SMA200 data (requires longer time range)",
      lastCrossoverDate: null,
      daysSinceCrossover: null,
    };
  }

  // Build time map for sma200
  const sma200Map = new Map<number, number>();
  for (const p of sma200) sma200Map.set(p.time, p.value);

  // Pair sma50 with sma200 at matching times
  const paired: { time: number; s50: number; s200: number }[] = [];
  for (const p of sma50) {
    const val200 = sma200Map.get(p.time);
    if (val200 != null) {
      paired.push({ time: p.time, s50: p.value, s200: val200 });
    }
  }

  if (paired.length < 2) {
    return {
      state: "none",
      signal: "neutral",
      label: "Insufficient overlapping SMA data",
      lastCrossoverDate: null,
      daysSinceCrossover: null,
    };
  }

  const latest = paired[paired.length - 1];
  const currentState: "golden_cross" | "death_cross" =
    latest.s50 > latest.s200 ? "golden_cross" : "death_cross";

  // Walk backward to find last crossover
  let lastCrossoverDate: string | null = null;
  let daysSinceCrossover: number | null = null;

  for (let i = paired.length - 2; i >= 0; i--) {
    const prevAbove = paired[i].s50 > paired[i].s200;
    const currAbove = paired[i + 1].s50 > paired[i + 1].s200;
    if (prevAbove !== currAbove) {
      const crossTime = paired[i + 1].time * 1000;
      lastCrossoverDate = new Date(crossTime).toISOString().split("T")[0];
      daysSinceCrossover = Math.floor((Date.now() - crossTime) / (1000 * 60 * 60 * 24));
      break;
    }
  }

  const signal: SignalDirection = currentState === "golden_cross" ? "bullish" : "bearish";
  const label =
    currentState === "golden_cross"
      ? "Golden Cross (SMA50 > SMA200)"
      : "Death Cross (SMA50 < SMA200)";
  const detail = lastCrossoverDate
    ? `Last crossover on ${lastCrossoverDate} (${daysSinceCrossover} days ago)`
    : "No recent crossover detected in this range";

  return { state: currentState, signal, label, detail, lastCrossoverDate, daysSinceCrossover };
}

// ─── Momentum Analysis ───────────────────────────────────

function analyzeRsi(rsi: IndicatorDataPoint[]): SignalResult & { value: number | null } {
  if (rsi.length === 0) {
    return { signal: "neutral", label: "RSI: Insufficient data", value: null };
  }
  const value = rsi[rsi.length - 1].value;

  if (value > 70) {
    return {
      signal: "bearish",
      label: `RSI overbought (${value.toFixed(1)})`,
      detail: "RSI above 70 suggests the stock may be overbought — potential pullback",
      value,
    };
  }
  if (value > 60) {
    return {
      signal: "neutral",
      label: `RSI elevated (${value.toFixed(1)})`,
      detail: "RSI between 60-70, approaching overbought territory",
      value,
    };
  }
  if (value < 30) {
    return {
      signal: "bullish",
      label: `RSI oversold (${value.toFixed(1)})`,
      detail: "RSI below 30 suggests the stock may be oversold — potential bounce",
      value,
    };
  }
  if (value < 40) {
    return {
      signal: "neutral",
      label: `RSI depressed (${value.toFixed(1)})`,
      detail: "RSI between 30-40, approaching oversold territory",
      value,
    };
  }
  return {
    signal: "neutral",
    label: `RSI neutral (${value.toFixed(1)})`,
    detail: "RSI in the 40-60 range indicates balanced momentum",
    value,
  };
}

function analyzeMacdSignal(macd: MacdDataPoint[]): SignalResult {
  if (macd.length === 0) {
    return { signal: "neutral", label: "MACD: Insufficient data" };
  }
  const latest = macd[macd.length - 1];
  if (latest.macd > latest.signal) {
    return {
      signal: "bullish",
      label: "MACD above signal line",
      detail: `MACD (${latest.macd.toFixed(2)}) > Signal (${latest.signal.toFixed(2)})`,
    };
  }
  return {
    signal: "bearish",
    label: "MACD below signal line",
    detail: `MACD (${latest.macd.toFixed(2)}) < Signal (${latest.signal.toFixed(2)})`,
  };
}

function analyzeMacdHistogram(
  macd: MacdDataPoint[]
): SignalResult & { direction: "strengthening" | "weakening" | "none" } {
  if (macd.length < 2) {
    return {
      signal: "neutral",
      label: "MACD histogram: Insufficient data",
      direction: "none",
    };
  }
  const latest = macd[macd.length - 1].histogram;
  const previous = macd[macd.length - 2].histogram;
  const isStrengthening = Math.abs(latest) > Math.abs(previous);
  const direction = isStrengthening ? "strengthening" : "weakening";

  if (latest > 0 && isStrengthening) {
    return {
      signal: "bullish",
      label: "Bullish momentum strengthening",
      detail: `Histogram: ${latest.toFixed(3)} (increasing)`,
      direction,
    };
  }
  if (latest > 0 && !isStrengthening) {
    return {
      signal: "neutral",
      label: "Bullish momentum weakening",
      detail: `Histogram: ${latest.toFixed(3)} (decreasing)`,
      direction,
    };
  }
  if (latest < 0 && isStrengthening) {
    return {
      signal: "bearish",
      label: "Bearish momentum strengthening",
      detail: `Histogram: ${latest.toFixed(3)} (increasingly negative)`,
      direction,
    };
  }
  return {
    signal: "neutral",
    label: "Bearish momentum weakening",
    detail: `Histogram: ${latest.toFixed(3)} (less negative)`,
    direction,
  };
}

function analyzeBollinger(
  bb: BollingerBandsDataPoint[],
  lastClose: number
): SignalResult & { percentB: number | null; squeeze: boolean } {
  if (bb.length === 0) {
    return {
      signal: "neutral",
      label: "Bollinger Bands: Insufficient data",
      percentB: null,
      squeeze: false,
    };
  }
  const latest = bb[bb.length - 1];
  const range = latest.upper - latest.lower;
  if (range === 0) {
    return { signal: "neutral", label: "Bollinger Bands: No range", percentB: null, squeeze: false };
  }

  const percentB = (lastClose - latest.lower) / range;
  const bandwidth = range / latest.middle;
  const squeeze = bandwidth < 0.04;

  let signal: SignalDirection = "neutral";
  let label = `Within Bollinger Bands (%B: ${(percentB * 100).toFixed(0)}%)`;
  let detail = `Price at ${(percentB * 100).toFixed(1)}% of band range`;

  if (percentB > 0.8) {
    signal = "bearish";
    label = `Near upper BB (%B: ${(percentB * 100).toFixed(0)}%)`;
    detail = "Price near upper Bollinger Band — potential resistance";
  } else if (percentB < 0.2) {
    signal = "bullish";
    label = `Near lower BB (%B: ${(percentB * 100).toFixed(0)}%)`;
    detail = "Price near lower Bollinger Band — potential support";
  }

  if (squeeze) {
    detail += ". Bollinger squeeze detected — breakout may be imminent";
  }

  return { signal, label, detail, percentB, squeeze };
}

function analyzeMomentum(
  rsi: IndicatorDataPoint[],
  macd: MacdDataPoint[],
  bb: BollingerBandsDataPoint[],
  lastClose: number
): MomentumAnalysis {
  return {
    rsi: analyzeRsi(rsi),
    macdSignal: analyzeMacdSignal(macd),
    macdHistogram: analyzeMacdHistogram(macd),
    bollingerPosition: analyzeBollinger(bb, lastClose),
  };
}

// ─── Overall ─────────────────────────────────────────────

export function computeIndicatorAnalysis(
  chartData: ChartDataPoint[],
  indicators: {
    sma20: IndicatorDataPoint[];
    sma50: IndicatorDataPoint[];
    sma200: IndicatorDataPoint[];
    ema12: IndicatorDataPoint[];
    ema26: IndicatorDataPoint[];
    rsi: IndicatorDataPoint[];
    macd: MacdDataPoint[];
    bollingerBands: BollingerBandsDataPoint[];
  }
): IndicatorAnalysisSummary | null {
  if (!chartData || chartData.length === 0) return null;

  const lastClose = chartData[chartData.length - 1].close;

  const trend = analyzeTrend(lastClose, indicators.sma20, indicators.sma50, indicators.sma200);
  const crossover = analyzeCrossover(indicators.sma50, indicators.sma200);
  const momentum = analyzeMomentum(indicators.rsi, indicators.macd, indicators.bollingerBands, lastClose);

  // Collect all signals
  const allSignals: SignalDirection[] = [
    trend.priceVsSma20.signal,
    trend.priceVsSma50.signal,
    trend.priceVsSma200.signal,
    trend.sma20Slope.signal,
    trend.sma50Slope.signal,
    trend.sma200Slope.signal,
    crossover.signal,
    momentum.rsi.signal,
    momentum.macdSignal.signal,
    momentum.macdHistogram.signal,
    momentum.bollingerPosition.signal,
  ];

  const signalCount = { bullish: 0, bearish: 0, neutral: 0 };
  for (const s of allSignals) signalCount[s]++;

  const overallSignal = majority(allSignals);

  return { trend, crossover, momentum, overallSignal, signalCount };
}
