"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";

interface Holder {
  holder: string;
  shares: number | null;
  value: number | null;
  pctHeld: number | null;
  dateReported: string;
  pctChange?: number | null;
}

interface HoldersData {
  ticker: string;
  majorHolders: Record<string, string>;
  topInstitutionalHolders: Holder[];
  topMutualFundHolders: Holder[];
}

function fmtShares(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toLocaleString();
}

function fmtValue(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toLocaleString()}`;
}

function fmtPct(v: number | null): string {
  if (v == null) return "—";
  return `${(v * 100).toFixed(2)}%`;
}

function HolderTable({ holders }: { holders: Holder[] }) {
  if (!holders.length) return <p className="text-sm text-muted-foreground py-4">No data available.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-2 pr-3 font-medium">Holder</th>
            <th className="text-right py-2 pr-3 font-medium">Shares</th>
            <th className="text-right py-2 pr-3 font-medium">Value</th>
            <th className="text-right py-2 pr-3 font-medium">% Held</th>
            <th className="text-right py-2 font-medium">Reported</th>
          </tr>
        </thead>
        <tbody>
          {holders.map((h, i) => (
            <tr key={i} className="border-b border-border/40 hover:bg-muted/30">
              <td className="py-2 pr-3 font-medium">{h.holder || "—"}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmtShares(h.shares)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmtValue(h.value)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmtPct(h.pctHeld)}</td>
              <td className="py-2 text-right text-muted-foreground text-xs">{h.dateReported || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InstitutionalHolders({ ticker }: { ticker: string }) {
  const { data, isLoading } = useQuery<HoldersData>({
    queryKey: QUERY_KEYS.stockInstitutionalHolders(ticker),
    queryFn: () => fetch(`/api/stocks/${ticker}/institutional-holders`).then((r) => r.json()),
    staleTime: STALE_TIMES.COMPANY,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Institutional Holdings</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const majorEntries = Object.entries(data.majorHolders || {}).filter(([, v]) => v);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">Institutional Holdings</CardTitle>
          {majorEntries.length > 0 && (
            <div className="flex gap-4 text-xs text-right">
              {majorEntries.map(([label, value]) => (
                <div key={label}>
                  <p className="font-semibold text-sm">{value}</p>
                  <p className="text-muted-foreground leading-tight">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="institutional">
          <TabsList className="mb-4">
            <TabsTrigger value="institutional">Institutional ({data.topInstitutionalHolders?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="mutualfunds">Mutual Funds ({data.topMutualFundHolders?.length ?? 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="institutional">
            <HolderTable holders={data.topInstitutionalHolders ?? []} />
          </TabsContent>
          <TabsContent value="mutualfunds">
            <HolderTable holders={data.topMutualFundHolders ?? []} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
