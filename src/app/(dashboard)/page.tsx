"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Briefcase, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatPercent } from "@/lib/format";

export default function DashboardPage() {
  const { data: portfolios, isLoading: portfoliosLoading } = useQuery({
    queryKey: QUERY_KEYS.portfolios(),
    queryFn: () => fetch("/api/portfolios").then((r) => r.json()),
    staleTime: STALE_TIMES.PORTFOLIO,
  });

  const { data: suggestions } = useQuery({
    queryKey: QUERY_KEYS.optionSuggestions(),
    queryFn: () => fetch("/api/options/suggestions").then((r) => r.json()),
    staleTime: STALE_TIMES.OPTIONS,
  });

  const { data: trades } = useQuery({
    queryKey: QUERY_KEYS.optionTrades("open"),
    queryFn: () => fetch("/api/options?status=open").then((r) => r.json()),
    staleTime: STALE_TIMES.OPTIONS,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your portfolios and active trades
        </p>
      </div>

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Action Required ({suggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestions.slice(0, 5).map((s: any) => (
                <div
                  key={s.tradeId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <span className="font-bold">{s.ticker}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {s.reason}
                    </span>
                  </div>
                  <Badge
                    variant={
                      s.urgency === "high" ? "destructive" : "secondary"
                    }
                  >
                    {s.action}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolios */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Portfolios</h2>
          <Link
            href="/portfolio"
            className="text-sm text-primary hover:underline"
          >
            View All
          </Link>
        </div>
        {portfoliosLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : portfolios && portfolios.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((p: any) => (
              <Link key={p.id} href={`/portfolio/${p.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Briefcase className="h-4 w-4" />
                      {p.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(p.total_value || 0)}
                    </div>
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        (p.total_gain_loss_percent || 0) >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {(p.total_gain_loss_percent || 0) >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatPercent(p.total_gain_loss_percent || 0)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Briefcase className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No portfolios yet</p>
              <Link
                href="/portfolio"
                className="mt-2 text-sm text-primary hover:underline"
              >
                Create your first portfolio
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Open Trades */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Open Option Trades</h2>
          <Link
            href="/options"
            className="text-sm text-primary hover:underline"
          >
            View All
          </Link>
        </div>
        {trades && trades.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">Ticker</th>
                      <th className="px-4 py-3 text-left font-medium">Type</th>
                      <th className="px-4 py-3 text-left font-medium">Strike</th>
                      <th className="px-4 py-3 text-left font-medium">Expiry</th>
                      <th className="px-4 py-3 text-left font-medium">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.slice(0, 5).map((t: any) => (
                      <tr key={t.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-bold">{t.ticker}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">
                            {t.direction} {t.optionType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">${t.strikePrice}</td>
                        <td className="px-4 py-3">{t.expiryDate}</td>
                        <td className="px-4 py-3">${t.premium}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <TrendingUp className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No open trades</p>
              <Link
                href="/options"
                className="mt-2 text-sm text-primary hover:underline"
              >
                Add your first trade
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
