import type { ChartDataPoint } from "@/types/stock";
import type {
  IndicatorDataPoint,
  MacdDataPoint,
  BollingerBandsDataPoint,
} from "@/types/indicators";

export function computeSMA(
  data: ChartDataPoint[],
  period: number
): IndicatorDataPoint[] {
  const result: IndicatorDataPoint[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j].close;
    }
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

export function computeEMA(
  data: ChartDataPoint[],
  period: number
): IndicatorDataPoint[] {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  const result: IndicatorDataPoint[] = [];

  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i].close;
  let ema = sum / period;
  result.push({ time: data[period - 1].time, value: ema });

  for (let i = period; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    result.push({ time: data[i].time, value: ema });
  }
  return result;
}

export function computeRSI(
  data: ChartDataPoint[],
  period: number = 14
): IndicatorDataPoint[] {
  if (data.length < period + 1) return [];
  const result: IndicatorDataPoint[] = [];

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push({ time: data[period].time, value: 100 - 100 / (1 + rs) });

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
    const currentRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push({
      time: data[i].time,
      value: 100 - 100 / (1 + currentRs),
    });
  }
  return result;
}

export function computeMACD(
  data: ChartDataPoint[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MacdDataPoint[] {
  const fastEMA = computeEMA(data, fastPeriod);
  const slowEMA = computeEMA(data, slowPeriod);

  const offset = fastPeriod < slowPeriod ? slowPeriod - fastPeriod : 0;
  const macdLine: IndicatorDataPoint[] = [];
  for (let i = 0; i < slowEMA.length; i++) {
    const fastVal = fastEMA[i + offset];
    if (!fastVal) continue;
    macdLine.push({
      time: slowEMA[i].time,
      value: fastVal.value - slowEMA[i].value,
    });
  }

  if (macdLine.length < signalPeriod) return [];

  const k = 2 / (signalPeriod + 1);
  let signalEma = 0;
  for (let i = 0; i < signalPeriod; i++) signalEma += macdLine[i].value;
  signalEma /= signalPeriod;

  const result: MacdDataPoint[] = [];
  result.push({
    time: macdLine[signalPeriod - 1].time,
    macd: macdLine[signalPeriod - 1].value,
    signal: signalEma,
    histogram: macdLine[signalPeriod - 1].value - signalEma,
  });

  for (let i = signalPeriod; i < macdLine.length; i++) {
    signalEma = macdLine[i].value * k + signalEma * (1 - k);
    result.push({
      time: macdLine[i].time,
      macd: macdLine[i].value,
      signal: signalEma,
      histogram: macdLine[i].value - signalEma,
    });
  }
  return result;
}

export function computeBollingerBands(
  data: ChartDataPoint[],
  period = 20,
  stdDev = 2
): BollingerBandsDataPoint[] {
  const sma = computeSMA(data, period);
  const result: BollingerBandsDataPoint[] = [];

  for (let i = 0; i < sma.length; i++) {
    const sliceStart = i;
    const sliceEnd = i + period;
    const slice = data.slice(sliceStart, sliceEnd);
    const mean = sma[i].value;
    const variance =
      slice.reduce((sum, d) => sum + Math.pow(d.close - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);

    result.push({
      time: sma[i].time,
      upper: mean + stdDev * sd,
      middle: mean,
      lower: mean - stdDev * sd,
    });
  }
  return result;
}
