"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";

interface Transaction {
  insider: string;
  position: string;
  transaction: string;
  date: string;
  shares: number | null;
  value: number | null;
  ownership: string;
  text: string;
}

interface InsiderData {
  ticker: string;
  transactions: Transaction[];
  summary: { buyCount: number; sellCount: number; netSignal: string };
}

function fmtValue(v: number | null): string {
  if (v == null || v === 0) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e9) return `$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(abs / 1e3).toFixed(0)}K`;
  return `$${abs.toFixed(0)}`;
}

function fmtShares(v: number | null): string {
  if (v == null) return "—";
  return Math.abs(v).toLocaleString();
}

function txType(tx: Transaction): "buy" | "sell" | "other" {
  const t = (tx.transaction || tx.text || "").toLowerCase();
  if (t.includes("purchase") || t.includes("buy") || t.includes("acquisition")) return "buy";
  if (t.includes("sale") || t.includes("sell") || t.includes("disposed")) return "sell";
  return "other";
}

export function InsiderTransactions({ ticker }: { ticker: string }) {
  const { data, isLoading } = useQuery<InsiderData>({
    queryKey: QUERY_KEYS.stockInsiderTransactions(ticker),
    queryFn: () => fetch(`/api/stocks/${ticker}/insider-transactions`).then((r) => r.json()),
    staleTime: STALE_TIMES.COMPANY,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Insider Transactions</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.transactions?.length) return null;

  const { summary, transactions } = data;
  const SignalIcon =
    summary.netSignal === "bullish" ? TrendingUp :
    summary.netSignal === "bearish" ? TrendingDown : Minus;
  const signalColor =
    summary.netSignal === "bullish" ? "text-green-500" :
    summary.netSignal === "bearish" ? "text-red-500" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Insider Transactions</CardTitle>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <TrendingUp className="h-3.5 w-3.5" /> {summary.buyCount} Buys
            </span>
            <span className="flex items-center gap-1 text-red-500 font-medium">
              <TrendingDown className="h-3.5 w-3.5" /> {summary.sellCount} Sells
            </span>
            <span className={`flex items-center gap-1 font-semibold capitalize ${signalColor}`}>
              <SignalIcon className="h-3.5 w-3.5" />
              {summary.netSignal}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 pr-3 font-medium">Insider</th>
                <th className="text-left py-2 pr-3 font-medium">Position</th>
                <th className="text-left py-2 pr-3 font-medium">Type</th>
                <th className="text-left py-2 pr-3 font-medium">Date</th>
                <th className="text-right py-2 pr-3 font-medium">Shares</th>
                <th className="text-right py-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 20).map((tx, i) => {
                const type = txType(tx);
                return (
                  <tr key={i} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="py-2 pr-3 font-medium">{tx.insider || "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground text-xs">{tx.position || "—"}</td>
                    <td className="py-2 pr-3">
                      <Badge
                        variant="outline"
                        className={
                          type === "buy" ? "border-green-500 text-green-600 text-xs" :
                          type === "sell" ? "border-red-400 text-red-500 text-xs" :
                          "text-xs"
                        }
                      >
                        {tx.transaction || tx.text?.split(" ").slice(0, 2).join(" ") || "—"}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{tx.date || "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{fmtShares(tx.shares)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtValue(tx.value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
