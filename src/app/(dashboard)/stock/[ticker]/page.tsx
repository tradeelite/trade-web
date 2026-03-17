"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockHeader } from "@/components/stock/stock-header";
import { KeyStats } from "@/components/stock/key-stats";
import { CompanyInfo } from "@/components/stock/company-info";
import { PriceChartWrapper } from "@/components/stock/price-chart-wrapper";
import { TechnicalAnalysis } from "@/components/technical/technical-analysis";
import { NewsAnalysisTab } from "@/components/stock/news-analysis-tab";
import { StockAnalysisPanel } from "@/components/stock/ai-analysis/stock-analysis-panel";
import { FundamentalAnalysisTab } from "@/components/stock/ai-analysis/fundamental-analysis-tab";
import { StockTearia } from "@/components/ai/stock-tearia";
import { Building2, LineChart, BarChart3, Activity, Newspaper, Brain } from "lucide-react";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";

export default function StockDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(params);
  const upperTicker = ticker.toUpperCase();
  const [activeTab, setActiveTab] = useState("info");

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

      <Tabs defaultValue="info" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info" className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Company Info
          </TabsTrigger>
          <TabsTrigger value="chart" className="flex items-center gap-1.5">
            <LineChart className="h-3.5 w-3.5" />
            Chart
          </TabsTrigger>
          <TabsTrigger value="fundamental-ai" className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Fundamental AI
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Technical Analysis
          </TabsTrigger>
          <TabsTrigger value="news" className="flex items-center gap-1.5">
            <Newspaper className="h-3.5 w-3.5" />
            News & Sentiment
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5" />
            AI Analysis
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <CompanyInfo ticker={upperTicker} />
        </TabsContent>
        <TabsContent value="chart" className="space-y-4">
          <PriceChartWrapper ticker={upperTicker} />
          <KeyStats quote={quote} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="fundamental-ai">
          <FundamentalAnalysisTab ticker={upperTicker} />
        </TabsContent>
        <TabsContent value="technical">
          <TechnicalAnalysis ticker={upperTicker} />
        </TabsContent>
        <TabsContent value="news">
          <NewsAnalysisTab ticker={upperTicker} />
        </TabsContent>
        <TabsContent value="ai">
          <StockAnalysisPanel ticker={upperTicker} />
        </TabsContent>
      </Tabs>

      <StockTearia
        ticker={upperTicker}
        companyName={quote?.longName ?? quote?.shortName}
        currentTab={activeTab}
        quote={quote}
      />
    </div>
  );
}
