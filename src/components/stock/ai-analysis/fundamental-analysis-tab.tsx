"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";
import { FundamentalAnalysis } from "@/types/stock-analysis";
import { FundamentalPanel } from "./fundamental-panel";

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

  if (isLoading) {
    return (
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
    );
  }

  if (isError || !data) {
    const errMsg = (error as Error)?.message ?? "Fundamental analysis unavailable.";
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{errMsg}</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <FundamentalPanel fundamental={data} />;
}
