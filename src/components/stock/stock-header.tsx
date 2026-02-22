"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { StockQuote } from "@/types/stock";

interface StockHeaderProps {
  quote: StockQuote | undefined;
  isLoading: boolean;
}

export function StockHeader({ quote, isLoading }: StockHeaderProps) {
  if (isLoading || !quote || !quote.ticker) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>
    );
  }

  const change = quote.change ?? 0;
  const changePercent = quote.changePercent ?? 0;
  const isPositive = change >= 0;

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">{quote.ticker}</h1>
        <Badge variant="outline">{quote.exchange}</Badge>
      </div>
      <p className="text-muted-foreground">{quote.name}</p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-4xl font-bold">
          {formatCurrency(quote.price)}
        </span>
        <div
          className={`flex items-center gap-1 text-lg ${
            isPositive ? "text-green-500" : "text-red-500"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="h-5 w-5" />
          ) : (
            <TrendingDown className="h-5 w-5" />
          )}
          {formatCurrency(Math.abs(change))} (
          {formatPercent(changePercent)})
        </div>
      </div>
    </div>
  );
}
