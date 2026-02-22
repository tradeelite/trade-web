export interface Portfolio {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Holding {
  id: number;
  portfolioId: number;
  ticker: string;
  shares: number;
  avgCost: number;
  addedAt: Date;
  currentPrice?: number;
  currentValue?: number;
  gainLoss?: number;
  gainLossPercent?: number;
}

export interface PortfolioWithStats extends Portfolio {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdingsCount: number;
}
