"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_KEYS } from "@/lib/constants";
import { toast } from "sonner";

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: QUERY_KEYS.settings(),
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  });

  const updateSetting = useMutation({
    mutationFn: (data: { key: string; value: string }) =>
      fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings() });
      // Invalidate all stock data when provider changes
      if (variables.key === "data_provider") {
        queryClient.invalidateQueries({ queryKey: ["stocks"] });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.portfolios() });
      }
      toast.success("Setting updated");
    },
    onError: () => toast.error("Failed to update setting"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your trading app</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Stock Data Source</Label>
            <p className="mb-2 text-sm text-muted-foreground">
              Choose which API to use for stock data. Yahoo Finance requires no
              API key. Twelve Data requires an API key set in .env.local.
            </p>
            {isLoading ? (
              <Skeleton className="h-10 w-60" />
            ) : (
              <Select
                value={settings?.data_provider || "yahoo"}
                onValueChange={(v) =>
                  updateSetting.mutate({ key: "data_provider", value: v })
                }
              >
                <SelectTrigger className="w-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yahoo">Yahoo Finance</SelectItem>
                  <SelectItem value="twelvedata">Twelve Data</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">TradeView</span> —
              Personal trading dashboard for stocks, ETFs, and options.
            </p>
            <p>
              Built with Next.js, shadcn/ui, TanStack Query, and lightweight-charts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
