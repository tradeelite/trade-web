"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatLargeNumber, formatNumber } from "@/lib/format";
import type { StockQuote } from "@/types/stock";

interface KeyStatsProps {
  quote: StockQuote | undefined;
  isLoading: boolean;
}

export function KeyStats({ quote, isLoading }: KeyStatsProps) {
  if (isLoading || !quote) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Key Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    { label: "Open", value: formatCurrency(quote.open) },
    { label: "Previous Close", value: formatCurrency(quote.previousClose) },
    { label: "Day High", value: formatCurrency(quote.high) },
    { label: "Day Low", value: formatCurrency(quote.low) },
    { label: "52W High", value: formatCurrency(quote.fiftyTwoWeekHigh) },
    { label: "52W Low", value: formatCurrency(quote.fiftyTwoWeekLow) },
    { label: "Volume", value: formatLargeNumber(quote.volume) },
    {
      label: "Market Cap",
      value: quote.marketCap ? formatLargeNumber(quote.marketCap) : "N/A",
    },
    {
      label: "P/E Ratio",
      value: quote.peRatio ? formatNumber(quote.peRatio) : "N/A",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
