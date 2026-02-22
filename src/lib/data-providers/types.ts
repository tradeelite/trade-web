import type { StockQuote, ChartDataPoint, SearchResult, CompanySummary, ChartRange } from "@/types/stock";

export interface DataProvider {
  name: string;
  search(query: string): Promise<SearchResult[]>;
  getQuote(ticker: string): Promise<StockQuote>;
  getChart(ticker: string, range: ChartRange): Promise<ChartDataPoint[]>;
  getCompanySummary(ticker: string): Promise<CompanySummary>;
}
