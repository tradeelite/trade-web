"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Plus,
  Upload,
  AlertTriangle,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { QUERY_KEYS, STALE_TIMES, BROKERAGES } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { calculateDTE, getDteUrgency, getDteColor } from "@/lib/options/dte";
import { calculateTradePnL, calculateTotalPnL } from "@/lib/options/pnl";
import { toast } from "sonner";

export default function OptionsPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    ticker: "",
    optionType: "put",
    direction: "sell",
    strikePrice: "",
    expiryDate: "",
    premium: "",
    quantity: "1",
    brokerage: "",
    notes: "",
  });

  const { data: trades, isLoading } = useQuery({
    queryKey: QUERY_KEYS.optionTrades(statusFilter),
    queryFn: () =>
      fetch(`/api/options?status=${statusFilter}`).then((r) => r.json()),
    staleTime: STALE_TIMES.OPTIONS,
  });

  const { data: suggestions } = useQuery({
    queryKey: QUERY_KEYS.optionSuggestions(),
    queryFn: () => fetch("/api/options/suggestions").then((r) => r.json()),
    staleTime: STALE_TIMES.OPTIONS,
  });

  const createTrade = useMutation({
    mutationFn: (data: any) =>
      fetch("/api/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] });
      setAddOpen(false);
      setForm({
        ticker: "",
        optionType: "put",
        direction: "sell",
        strikePrice: "",
        expiryDate: "",
        premium: "",
        quantity: "1",
        brokerage: "",
        notes: "",
      });
      toast.success("Trade created");
    },
    onError: () => toast.error("Failed to create trade"),
  });

  const closeTrade = useMutation({
    mutationFn: ({
      tradeId,
      closePremium,
    }: {
      tradeId: number;
      closePremium: number;
    }) =>
      fetch(`/api/options/${tradeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "closed",
          closePremium,
          closeDate: new Date().toISOString().split("T")[0],
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] });
      toast.success("Trade closed");
    },
  });

  const deleteTrade = useMutation({
    mutationFn: (tradeId: number) =>
      fetch(`/api/options/${tradeId}`, { method: "DELETE" }).then((r) =>
        r.json()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] });
      toast.success("Trade deleted");
    },
  });

  const uploadScreenshot = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/options/ocr", {
        method: "POST",
        body: formData,
      });
      return res.json();
    },
    onSuccess: (extractedTrades) => {
      if (extractedTrades.length === 0) {
        toast.error("No trades found in screenshot");
        return;
      }
      // Auto-fill form with first extracted trade
      const t = extractedTrades[0];
      setForm({
        ticker: t.ticker || "",
        optionType: t.optionType || "put",
        direction: t.direction || "sell",
        strikePrice: t.strikePrice?.toString() || "",
        expiryDate: t.expiryDate || "",
        premium: t.premium?.toString() || "",
        quantity: t.quantity?.toString() || "1",
        brokerage: t.brokerage || "",
        notes: "",
      });
      setAddOpen(true);
      toast.success(`Extracted ${extractedTrades.length} trade(s) from screenshot`);
    },
    onError: () => toast.error("Failed to process screenshot"),
  });

  const pnlSummary = trades ? calculateTotalPnL(trades) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Option Trades</h1>
          <p className="text-muted-foreground">
            Track and manage your options positions
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadScreenshot.mutate(file);
            }}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadScreenshot.isPending}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploadScreenshot.isPending ? "Processing..." : "Upload Screenshot"}
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Trade
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Option Trade</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ticker</Label>
                  <Input
                    value={form.ticker}
                    onChange={(e) =>
                      setForm({ ...form, ticker: e.target.value })
                    }
                    placeholder="AAPL"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={form.optionType}
                    onValueChange={(v) =>
                      setForm({ ...form, optionType: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="put">Put</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Direction</Label>
                  <Select
                    value={form.direction}
                    onValueChange={(v) =>
                      setForm({ ...form, direction: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Strike Price</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.strikePrice}
                    onChange={(e) =>
                      setForm({ ...form, strikePrice: e.target.value })
                    }
                    placeholder="150"
                  />
                </div>
                <div>
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) =>
                      setForm({ ...form, expiryDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Premium</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.premium}
                    onChange={(e) =>
                      setForm({ ...form, premium: e.target.value })
                    }
                    placeholder="2.50"
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label>Brokerage</Label>
                  <Select
                    value={form.brokerage}
                    onValueChange={(v) =>
                      setForm({ ...form, brokerage: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BROKERAGES.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    placeholder="Any additional notes..."
                  />
                </div>
                <Button
                  className="col-span-2"
                  onClick={() => createTrade.mutate(form)}
                  disabled={
                    !form.ticker ||
                    !form.strikePrice ||
                    !form.expiryDate ||
                    !form.premium ||
                    createTrade.isPending
                  }
                >
                  {createTrade.isPending ? "Creating..." : "Add Trade"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Suggestions ({suggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestions.map((s: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <span className="font-bold">{s.ticker}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {s.reason}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {s.details}
                    </p>
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

      {/* P&L Summary */}
      {pnlSummary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Realized P&L</p>
              <p
                className={`text-2xl font-bold ${
                  pnlSummary.totalRealized >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {formatCurrency(pnlSummary.totalRealized)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Premium Received</p>
              <p className="text-2xl font-bold">
                {formatCurrency(pnlSummary.totalPremiumReceived)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Premium Paid</p>
              <p className="text-2xl font-bold">
                {formatCurrency(pnlSummary.totalPremiumPaid)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Trades</CardTitle>
            <Tabs
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <TabsList>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : trades && trades.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Strike</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>DTE</TableHead>
                    <TableHead className="text-right">Premium</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Brokerage</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((t: any) => {
                    const dte = calculateDTE(t.expiryDate);
                    const urgency = getDteUrgency(dte);
                    const dteColor = getDteColor(urgency);
                    const pnl = calculateTradePnL(t);

                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-bold">{t.ticker}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {t.direction} {t.optionType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ${t.strikePrice}
                        </TableCell>
                        <TableCell>{t.expiryDate}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${dteColor}`}>
                            {dte}d
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          ${t.premium}
                        </TableCell>
                        <TableCell className="text-right">
                          {t.quantity}
                        </TableCell>
                        <TableCell>{t.brokerage || "—"}</TableCell>
                        <TableCell className="text-right">
                          {pnl.realizedPnL != null ? (
                            <span
                              className={
                                pnl.realizedPnL >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            >
                              {formatCurrency(pnl.realizedPnL)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {t.status === "open" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const premium = prompt(
                                    "Close premium per contract:"
                                  );
                                  if (premium) {
                                    closeTrade.mutate({
                                      tradeId: t.id,
                                      closePremium: parseFloat(premium),
                                    });
                                  }
                                }}
                              >
                                Close
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteTrade.mutate(t.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center py-10">
              <TrendingUp className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No trades found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
