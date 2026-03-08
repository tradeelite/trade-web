"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatPercent } from "@/lib/format";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";
import { toast } from "sonner";

export default function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ portfolioId: string }>;
}) {
  const { portfolioId } = use(params);
  const id = portfolioId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: QUERY_KEYS.portfolio(id),
    queryFn: () => fetch(`/api/portfolios/${id}`).then((r) => r.json()),
    staleTime: STALE_TIMES.PORTFOLIO,
  });

  const { data: holdings, isLoading: holdingsLoading } = useQuery({
    queryKey: QUERY_KEYS.portfolioHoldings(id),
    queryFn: () =>
      fetch(`/api/portfolios/${id}/holdings`).then((r) => r.json()),
    staleTime: STALE_TIMES.PORTFOLIO,
  });

  const addHolding = useMutation({
    mutationFn: (data: { ticker: string; shares: string; avgCost: string }) =>
      fetch(`/api/portfolios/${id}/holdings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: data.ticker,
          shares: parseFloat(data.shares),
          avg_cost: parseFloat(data.avgCost),
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.portfolioHoldings(id),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.portfolios() });
      setAddOpen(false);
      setTicker("");
      setShares("");
      setAvgCost("");
      toast.success("Holding added");
    },
    onError: () => toast.error("Failed to add holding"),
  });

  const deleteHolding = useMutation({
    mutationFn: (holdingId: string) =>
      fetch(`/api/portfolios/${id}/holdings?holdingId=${holdingId}`, {
        method: "DELETE",
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.portfolioHoldings(id),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.portfolios() });
      toast.success("Holding removed");
    },
  });

  const deletePortfolio = useMutation({
    mutationFn: () =>
      fetch(`/api/portfolios/${id}`, { method: "DELETE" }).then((r) =>
        r.json()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.portfolios() });
      toast.success("Portfolio deleted");
      router.push("/portfolio");
    },
  });

  const totalValue =
    holdings?.reduce(
      (sum: number, h: any) => sum + (h.currentValue || 0),
      0
    ) || 0;
  const totalCost =
    holdings?.reduce(
      (sum: number, h: any) => sum + h.avgCost * h.shares,
      0
    ) || 0;
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/portfolio">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          {portfolioLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <>
              <h1 className="text-3xl font-bold">{portfolio?.name}</h1>
              {portfolio?.description && (
                <p className="text-muted-foreground">
                  {portfolio.description}
                </p>
              )}
            </>
          )}
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deletePortfolio.mutate()}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
            <div className="flex items-center gap-2">
              <p
                className={`text-2xl font-bold ${
                  totalGainLoss >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {formatCurrency(totalGainLoss)}
              </p>
              <Badge
                variant={totalGainLoss >= 0 ? "default" : "destructive"}
              >
                {formatPercent(totalGainLossPercent)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Holdings</CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Holding
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Holding</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Ticker</Label>
                  <Input
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    placeholder="AAPL"
                  />
                </div>
                <div>
                  <Label>Shares</Label>
                  <Input
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label>Average Cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={avgCost}
                    onChange={(e) => setAvgCost(e.target.value)}
                    placeholder="150.00"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() =>
                    addHolding.mutate({ ticker, shares, avgCost })
                  }
                  disabled={
                    !ticker || !shares || !avgCost || addHolding.isPending
                  }
                >
                  {addHolding.isPending ? "Adding..." : "Add Holding"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {holdingsLoading ? (
            <Skeleton className="h-40" />
          ) : holdings && holdings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Avg Cost</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Gain/Loss</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((h: any) => (
                  <TableRow key={h.id}>
                    <TableCell>
                      <Link
                        href={`/stock/${h.ticker}`}
                        className="font-bold hover:underline"
                      >
                        {h.ticker}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{h.shares}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(h.avgCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {h.currentPrice
                        ? formatCurrency(h.currentPrice)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {h.currentValue
                        ? formatCurrency(h.currentValue)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {h.gainLoss != null ? (
                        <div className="flex items-center justify-end gap-1">
                          {h.gainLoss >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span
                            className={
                              h.gainLoss >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            {formatCurrency(Math.abs(h.gainLoss))} (
                            {formatPercent(h.gainLossPercent)})
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteHolding.mutate(h.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center py-10">
              <p className="text-muted-foreground">No holdings yet</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add your first holding
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
