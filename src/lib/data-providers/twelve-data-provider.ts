import type { DataProvider } from "./types";
import type {
  StockQuote,
  ChartDataPoint,
  SearchResult,
  CompanySummary,
  ChartRange,
} from "@/types/stock";

const BASE_URL = "https://api.twelvedata.com";

const RANGE_MAP: Record<ChartRange, { interval: string; outputsize: number }> = {
  "1D": { interval: "5min", outputsize: 78 },
  "1W": { interval: "15min", outputsize: 130 },
  "1M": { interval: "1day", outputsize: 22 },
  "3M": { interval: "1day", outputsize: 65 },
  "1Y": { interval: "1day", outputsize: 252 },
  "5Y": { interval: "1week", outputsize: 260 },
};

async function fetchTwelveData(endpoint: string, params: Record<string, string>) {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) throw new Error("TWELVE_DATA_API_KEY not set");
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("apikey", apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Twelve Data API error: ${res.status}`);
  return res.json();
}

export class TwelveDataProvider implements DataProvider {
  name = "Twelve Data";

  async search(query: string): Promise<SearchResult[]> {
    const data = await fetchTwelveData("symbol_search", {
      symbol: query,
      outputsize: "10",
    });
    return (data.data || []).map((item: any) => ({
      ticker: item.symbol,
      name: item.instrument_name,
      exchange: item.exchange,
      type: item.instrument_type,
    }));
  }

  async getQuote(ticker: string): Promise<StockQuote> {
    const data = await fetchTwelveData("quote", { symbol: ticker });
    return {
      ticker: data.symbol,
      name: data.name || ticker,
      price: parseFloat(data.close) || 0,
      change: parseFloat(data.change) || 0,
      changePercent: parseFloat(data.percent_change) || 0,
      open: parseFloat(data.open) || 0,
      high: parseFloat(data.high) || 0,
      low: parseFloat(data.low) || 0,
      previousClose: parseFloat(data.previous_close) || 0,
      volume: parseInt(data.volume) || 0,
      marketCap: null,
      peRatio: null,
      fiftyTwoWeekHigh: parseFloat(data.fifty_two_week?.high) || 0,
      fiftyTwoWeekLow: parseFloat(data.fifty_two_week?.low) || 0,
      exchange: data.exchange || "",
    };
  }

  async getChart(ticker: string, range: ChartRange): Promise<ChartDataPoint[]> {
    const config = RANGE_MAP[range];
    const data = await fetchTwelveData("time_series", {
      symbol: ticker,
      interval: config.interval,
      outputsize: config.outputsize.toString(),
    });

    return (data.values || [])
      .map((v: any) => ({
        time: Math.floor(new Date(v.datetime).getTime() / 1000),
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseInt(v.volume) || 0,
      }))
      .reverse();
  }

  async getCompanySummary(ticker: string): Promise<CompanySummary> {
    const data = await fetchTwelveData("profile", { symbol: ticker });
    return {
      description: data.description || "",
      sector: data.sector || "",
      industry: data.industry || "",
      website: data.website || "",
      employees: data.employees ? parseInt(data.employees) : null,
    };
  }
}
