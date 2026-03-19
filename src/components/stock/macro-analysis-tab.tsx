"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, Globe, ShieldAlert, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";
import type { Recommendation } from "@/types/stock-analysis";

type MacroMetric = {
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number | null;
};

type MacroData = {
  ticker: string;
  regime: "risk-on" | "risk-off" | "mixed";
  metrics: Record<string, MacroMetric>;
  analyst: {
    recommendation: Recommendation;
    confidence: "high" | "medium" | "low";
    summary: string;
    impacts: string[];
    risks: string[];
  };
  asOf: string;
};

function recClass(rec: Recommendation): string {
  if (rec === "Buy") return "bg-green-600 text-white";
  if (rec === "Sell") return "bg-red-600 text-white";
  if (rec === "Watch") return "bg-blue-500 text-white";
  return "bg-yellow-500 text-white";
}

export function MacroAnalysisTab({ ticker }: { ticker: string }) {
  const { data, isLoading, isError, error } = useQuery<MacroData>({
    queryKey: QUERY_KEYS.stockMacroAnalysis(ticker),
    queryFn: () =>
      fetch(`/api/stocks/${ticker}/macro-analysis`).then((r) => {
        if (!r.ok) throw new Error(`Failed to load macro analysis (${r.status})`);
        return r.json();
      }),
    staleTime: STALE_TIMES.NEWS,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{(error as Error)?.message ?? "Failed to load macro analysis"}</span>
      </div>
    );
  }

  const metricEntries = Object.entries(data.metrics || {});

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Macro Regime Analyst</div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase">{data.regime}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${recClass(data.analyst.recommendation)}`}>{data.analyst.recommendation}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed border-t pt-2">{data.analyst.summary}</p>
          <p className="text-xs text-muted-foreground/80">
            As of {formatDistanceToNow(new Date(data.asOf), { addSuffix: true })} · Confidence:{" "}
            <span className="capitalize">{data.analyst.confidence}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" />Macro Market Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metricEntries.map(([key, metric]) => (
            <div key={key} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{metric.name || key}</p>
              <p className="text-lg font-semibold">{metric.price != null ? metric.price.toLocaleString() : "N/A"}</p>
              <p className={`text-xs ${metric.changePercent != null && metric.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                {metric.changePercent != null ? `${metric.changePercent >= 0 ? "+" : ""}${metric.changePercent.toFixed(2)}%` : "N/A"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" />Macro Drivers</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {(data.analyst.impacts.length ? data.analyst.impacts : ["No major macro drivers identified"]).map((x, i) => <p key={i}>• {x}</p>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-500" />Macro Risks</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {(data.analyst.risks.length ? data.analyst.risks : ["No major macro risks identified"]).map((x, i) => <p key={i}>• {x}</p>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
