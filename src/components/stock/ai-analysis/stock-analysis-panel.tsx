"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles } from "lucide-react";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";
import { StockAnalysis } from "@/types/stock-analysis";
import { AnalysisSummary } from "./analysis-summary";
import { TechnicalPanel } from "./technical-panel";
import { FundamentalPanel } from "./fundamental-panel";
import { NewsPanel } from "./news-panel";

interface StockAnalysisPanelProps {
  ticker: string;
}

export function StockAnalysisPanel({ ticker }: StockAnalysisPanelProps) {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<StockAnalysis>({
    queryKey: QUERY_KEYS.stockAnalysis(ticker),
    queryFn: async () => {
      const r = await fetch(`/api/stocks/${ticker}/ai-analysis`);
      if (!r.ok) {
        let msg = `Request failed (${r.status})`;
        try {
          const body = await r.json();
          msg = body?.detail ?? body?.error ?? msg;
        } catch {}
        throw new Error(msg);
      }
      return r.json();
    },
    staleTime: STALE_TIMES.ANALYSIS,
    retry: 1,
  });

  if (isLoading || isFetching) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span className="text-sm">AI analysis in progress — this may take 15-30 seconds...</span>
            </div>
            <Skeleton className="h-6 w-48 mb-3" />
            <div className="flex gap-3 mb-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    const errMsg = (error as Error)?.message ?? "";
    const isNotConfigured = errMsg.toLowerCase().includes("not configured") || errMsg.includes("TRADEVIEW_AGENT_RESOURCE_ID");
    const isBackendDown = errMsg.includes("503") || errMsg.toLowerCase().includes("unavailable");

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1.5">
              <p className="font-medium">Analysis unavailable</p>
              {isNotConfigured ? (
                <p className="text-sm text-muted-foreground">
                  Vertex AI agent is not configured. Set <code className="rounded bg-muted px-1 py-0.5 text-xs">TRADEVIEW_AGENT_RESOURCE_ID</code> in trade-backend <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code>.
                </p>
              ) : isBackendDown ? (
                <p className="text-sm text-muted-foreground">
                  trade-backend is not reachable. Start it with{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">uv run uvicorn app.main:app --port 8000</code>.
                </p>
              ) : errMsg ? (
                <p className="text-sm text-muted-foreground">{errMsg}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The AI analysis service could not be reached. Make sure trade-backend is running and the agent is configured.
                </p>
              )}
            </div>
            <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <AnalysisSummary analysis={data} />
      {/* Technical takes full width — it has a rich multi-card layout */}
      <TechnicalPanel technical={data.technical} />
      {/* Fundamental + News side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FundamentalPanel fundamental={data.fundamental} />
        <NewsPanel news={data.news} />
      </div>
    </div>
  );
}
