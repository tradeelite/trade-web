import type { DataProvider } from "./types";
import type {
  StockQuote,
  ChartDataPoint,
  SearchResult,
  CompanySummary,
  ChartRange,
} from "@/types/stock";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// Map chart ranges to number of days back + interval
const RANGE_MAP: Record<ChartRange, { daysBack: number; interval: string }> = {
  "1D": { daysBack: 1, interval: "5m" },
  "1W": { daysBack: 7, interval: "15m" },
  "1M": { daysBack: 30, interval: "1d" },
  "3M": { daysBack: 90, interval: "1d" },
  "1Y": { daysBack: 365, interval: "1d" },
  "5Y": { daysBack: 365 * 5, interval: "1wk" },
};

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export class YahooProvider implements DataProvider {
  name = "Yahoo Finance";

  async search(query: string): Promise<SearchResult[]> {
    const result: any = await yahooFinance.search(query, { newsCount: 0 });
    return (result.quotes || [])
      .filter((q: any) => q.symbol && q.shortname)
      .slice(0, 10)
      .map((q: any) => ({
        ticker: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.exchange || "",
        type: q.quoteType || "EQUITY",
      }));
  }

  async getQuote(ticker: string): Promise<StockQuote> {
    const q: any = await yahooFinance.quote(ticker);
    return {
      ticker: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      open: q.regularMarketOpen ?? 0,
      high: q.regularMarketDayHigh ?? 0,
      low: q.regularMarketDayLow ?? 0,
      previousClose: q.regularMarketPreviousClose ?? 0,
      volume: q.regularMarketVolume ?? 0,
      marketCap: q.marketCap ?? null,
      peRatio: q.trailingPE ?? null,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? 0,
      exchange: q.exchange ?? "",
    };
  }

  async getChart(ticker: string, range: ChartRange): Promise<ChartDataPoint[]> {
    const config = RANGE_MAP[range];
    const result: any = await yahooFinance.chart(ticker, {
      period1: daysAgo(config.daysBack),
      interval: config.interval as any,
    });

    return (result.quotes || [])
      .filter((q: any) => q.date && q.open != null && q.close != null)
      .map((q: any) => ({
        time: Math.floor(new Date(q.date).getTime() / 1000),
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume || 0,
      }));
  }

  async getCompanySummary(ticker: string): Promise<CompanySummary> {
    const result: any = await yahooFinance.quoteSummary(ticker, {
      modules: ["assetProfile"],
    });
    const profile = result.assetProfile;
    return {
      description: profile?.longBusinessSummary || "",
      sector: profile?.sector || "",
      industry: profile?.industry || "",
      website: profile?.website || "",
      employees: profile?.fullTimeEmployees ?? null,
    };
  }
}
