"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";

interface UpgradeRow {
  date: string;
  firm: string;
  toGrade: string;
  fromGrade: string;
  action: string;
}

interface AnalystData {
  ticker: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: string;
  targetMeanPrice: number | null;
  targetHighPrice: number | null;
  targetLowPrice: number | null;
  targetMedianPrice: number | null;
  numAnalysts: number | null;
  recentUpgradesDowngrades: UpgradeRow[];
  recommendationTrend: Array<{
    period: string;
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  }>;
}

function consensusBadgeClass(c: string): string {
  const s = c.toLowerCase();
  if (s.includes("strong buy")) return "bg-green-500/20 text-green-600 border-green-500";
  if (s.includes("buy")) return "bg-green-400/20 text-green-500 border-green-400";
  if (s.includes("strong sell") || s.includes("sell")) return "bg-red-500/20 text-red-500 border-red-500";
  return "bg-yellow-400/20 text-yellow-600 border-yellow-400";
}

function actionBadge(action: string, toGrade: string): { label: string; cls: string } {
  const a = action.toLowerCase();
  const g = toGrade.toLowerCase();
  if (a === "up" || a === "upgrade") return { label: "Upgrade", cls: "border-green-500 text-green-600" };
  if (a === "down" || a === "downgrade") return { label: "Downgrade", cls: "border-red-400 text-red-500" };
  if (a === "init" || a === "initiated") return { label: "Initiated", cls: "border-blue-400 text-blue-500" };
  if (a === "reit" || a === "reiterated" || a === "maintain") return { label: "Reiterated", cls: "border-muted-foreground text-muted-foreground" };
  if (g.includes("buy") || g.includes("outperform") || g.includes("overweight")) return { label: toGrade, cls: "border-green-500 text-green-600" };
  if (g.includes("sell") || g.includes("underperform") || g.includes("underweight")) return { label: toGrade, cls: "border-red-400 text-red-500" };
  return { label: action || toGrade || "—", cls: "border-muted-foreground text-muted-foreground" };
}

export function AnalystRatings({ ticker }: { ticker: string }) {
  const { data, isLoading } = useQuery<AnalystData>({
    queryKey: QUERY_KEYS.stockAnalystRatings(ticker),
    queryFn: () => fetch(`/api/stocks/${ticker}/analyst-ratings`).then((r) => r.json()),
    staleTime: STALE_TIMES.COMPANY,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Analyst Ratings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-full" />
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const total = (data.strongBuy ?? 0) + (data.buy ?? 0) + (data.hold ?? 0) + (data.sell ?? 0) + (data.strongSell ?? 0);
  const bars = [
    { label: "Strong Buy", count: data.strongBuy ?? 0, cls: "bg-green-600" },
    { label: "Buy", count: data.buy ?? 0, cls: "bg-green-400" },
    { label: "Hold", count: data.hold ?? 0, cls: "bg-yellow-400" },
    { label: "Sell", count: data.sell ?? 0, cls: "bg-red-400" },
    { label: "Strong Sell", count: data.strongSell ?? 0, cls: "bg-red-600" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Analyst Ratings</CardTitle>
          {data.numAnalysts && (
            <span className="text-xs text-muted-foreground">{data.numAnalysts} analysts</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Consensus + Price Target */}
        <div className="flex items-center gap-6 flex-wrap">
          {data.consensus && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Consensus</p>
              <Badge variant="outline" className={`text-sm px-3 py-1 font-semibold ${consensusBadgeClass(data.consensus)}`}>
                {data.consensus}
              </Badge>
            </div>
          )}
          {data.targetMeanPrice && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Mean Target</p>
              <p className="font-bold text-lg flex items-center gap-1">
                <Target className="h-4 w-4 text-muted-foreground" />
                ${data.targetMeanPrice.toFixed(2)}
              </p>
            </div>
          )}
          {data.targetHighPrice && data.targetLowPrice && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Range</p>
              <p className="text-sm">
                <span className="text-green-500">${data.targetHighPrice.toFixed(2)}</span>
                <span className="text-muted-foreground mx-1">–</span>
                <span className="text-red-500">${data.targetLowPrice.toFixed(2)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Rating breakdown bars */}
        {total > 0 && (
          <div className="space-y-1.5">
            {bars.map(({ label, count, cls }) => {
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-muted-foreground text-right">{label}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className={`${cls} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 tabular-nums text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent upgrades/downgrades */}
        {data.recentUpgradesDowngrades?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Recent Analyst Actions
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-1.5 pr-3 font-medium">Date</th>
                    <th className="text-left py-1.5 pr-3 font-medium">Firm</th>
                    <th className="text-left py-1.5 pr-3 font-medium">Action</th>
                    <th className="text-left py-1.5 font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentUpgradesDowngrades.slice(0, 15).map((u, i) => {
                    const { label, cls } = actionBadge(u.action, u.toGrade);
                    return (
                      <tr key={i} className="border-b border-border/40 hover:bg-muted/30">
                        <td className="py-1.5 pr-3 text-muted-foreground text-xs">{u.date}</td>
                        <td className="py-1.5 pr-3 font-medium">{u.firm || "—"}</td>
                        <td className="py-1.5 pr-3">
                          <Badge variant="outline" className={`text-xs ${cls}`}>{label}</Badge>
                        </td>
                        <td className="py-1.5 text-muted-foreground text-xs">
                          {u.fromGrade && u.toGrade ? `${u.fromGrade} → ${u.toGrade}` : u.toGrade || u.fromGrade || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
