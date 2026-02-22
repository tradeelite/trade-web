"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockHeader } from "@/components/stock/stock-header";
import { KeyStats } from "@/components/stock/key-stats";
import { CompanyInfo } from "@/components/stock/company-info";
import { PriceChartWrapper } from "@/components/stock/price-chart-wrapper";
import { TechnicalAnalysis } from "@/components/technical/technical-analysis";
import { StockNews } from "@/components/stock/stock-news";
import { StockSentiment } from "@/components/stock/stock-sentiment";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";

export default function StockDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(params);
  const upperTicker = ticker.toUpperCase();

  const { data: quote, isLoading } = useQuery({
    queryKey: QUERY_KEYS.stockQuote(upperTicker),
    queryFn: () =>
      fetch(`/api/stocks/${upperTicker}/quote`).then((r) => r.json()),
    staleTime: STALE_TIMES.QUOTE,
    refetchInterval: STALE_TIMES.QUOTE,
  });

  return (
    <div className="space-y-6">
      <StockHeader quote={quote} isLoading={isLoading} />

      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
          <TabsTrigger value="info">Company Info</TabsTrigger>
          <TabsTrigger value="news">News & Sentiment</TabsTrigger>
        </TabsList>
        <TabsContent value="chart" className="space-y-4">
          <PriceChartWrapper ticker={upperTicker} />
          <KeyStats quote={quote} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="technical">
          <TechnicalAnalysis ticker={upperTicker} />
        </TabsContent>
        <TabsContent value="info">
          <CompanyInfo ticker={upperTicker} />
        </TabsContent>
        <TabsContent value="news" className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <StockNews ticker={upperTicker} />
          <StockSentiment ticker={upperTicker} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
