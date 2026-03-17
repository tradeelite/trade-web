"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";
import { FundamentalAnalysis, RichFundamentalAnalysis } from "@/types/stock-analysis";
import { FundamentalPanel } from "./fundamental-panel";
import { FundamentalDashboard } from "./fundamental-dashboard";
import { FinancialStatements } from "@/components/stock/fundamental/financial-statements";
import { InsiderTransactions } from "@/components/stock/fundamental/insider-transactions";
import { InstitutionalHolders } from "@/components/stock/fundamental/institutional-holders";
import { AnalystRatings } from "@/components/stock/fundamental/analyst-ratings";

class SectionErrorBoundary extends React.Component<
  { label: string; children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { label: string; children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-destructive font-mono">[{this.props.label} crash] {this.state.error.message}</p>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

interface FundamentalAnalysisTabProps {
  ticker: string;
}

export function FundamentalAnalysisTab({ ticker }: FundamentalAnalysisTabProps) {
  const { data, isLoading, isError, error, refetch } = useQuery<FundamentalAnalysis>({
    queryKey: QUERY_KEYS.stockFundamentalAnalysis(ticker),
    queryFn: async () => {
      const r = await fetch(`/api/stocks/${ticker}/fundamental-analysis`);
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

  return (
    <div className="space-y-6">
      {/* AI Fundamental Analysis — agent-generated insights */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span className="text-sm">Generating deep fundamental analysis...</span>
            </div>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ) : isError || !data ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <AlertCircle className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {(error as Error)?.message ?? "AI fundamental analysis unavailable."}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      ) : (() => {
        const isRich = data && "header" in data && Array.isArray((data as any).valuation);
        return (
          <SectionErrorBoundary label={isRich ? "FundamentalDashboard" : "FundamentalPanel"}>
            {isRich ? (
              <FundamentalDashboard data={data as unknown as RichFundamentalAnalysis} ticker={ticker} />
            ) : (
              <FundamentalPanel fundamental={data} />
            )}
          </SectionErrorBoundary>
        );
      })()}

      <SectionErrorBoundary label="AnalystRatings">
        <AnalystRatings ticker={ticker} />
      </SectionErrorBoundary>

      <SectionErrorBoundary label="FinancialStatements">
        <FinancialStatements ticker={ticker} />
      </SectionErrorBoundary>

      <SectionErrorBoundary label="InsiderTransactions">
        <InsiderTransactions ticker={ticker} />
      </SectionErrorBoundary>

      <SectionErrorBoundary label="InstitutionalHolders">
        <InstitutionalHolders ticker={ticker} />
      </SectionErrorBoundary>
    </div>
  );
}
