"use client";

import { useMemo, useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type StoredBarsResponse = {
  path: string;
  symbol: string;
  timeframe: string;
  source?: string;
  range?: string;
  providerInterval?: string;
  providerPeriod?: string;
  count: number;
  startTs: number;
  endTs: number;
  firstBar: Bar;
  lastBar: Bar;
  bars: Bar[];
};

type Bar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const TIMEFRAMES = ["1d", "1h", "5m", "1m"] as const;
const SORT_FIELDS = ["time", "open", "high", "low", "close", "volume"] as const;

type SortField = (typeof SORT_FIELDS)[number];
type SortDirection = "asc" | "desc";

function formatTimestamp(ts: number) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(ts * 1000));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function toDateInputValue(ts: number) {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

function startOfDayUtc(dateValue: string) {
  return Math.floor(new Date(`${dateValue}T00:00:00Z`).getTime() / 1000);
}

function endOfDayUtc(dateValue: string) {
  return Math.floor(new Date(`${dateValue}T23:59:59Z`).getTime() / 1000);
}

export default function DataViewerPage() {
  const [symbolInput, setSymbolInput] = useState("AAPL");
  const [timeframeInput, setTimeframeInput] = useState<(typeof TIMEFRAMES)[number]>("1d");
  const [querySymbol, setQuerySymbol] = useState("AAPL");
  const [queryTimeframe, setQueryTimeframe] = useState<(typeof TIMEFRAMES)[number]>("1d");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortField, setSortField] = useState<SortField>("time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isPending, startTransition] = useTransition();

  const { data, isLoading, isError, error } = useQuery<StoredBarsResponse>({
    queryKey: ["stocks", querySymbol, "stored-bars", queryTimeframe],
    queryFn: async () => {
      const res = await fetch(
        `/api/stocks/${querySymbol}/stored-bars?timeframe=${queryTimeframe}`
      );
      if (!res.ok) {
        throw new Error(await res.text());
      }
      return res.json();
    },
  });

  const bars = useMemo(() => data?.bars ?? [], [data?.bars]);

  const filteredBars = useMemo(() => {
    const fromTs = fromDate ? startOfDayUtc(fromDate) : null;
    const toTs = toDate ? endOfDayUtc(toDate) : null;

    return [...bars]
      .filter((bar) => {
        if (fromTs != null && bar.time < fromTs) return false;
        if (toTs != null && bar.time > toTs) return false;
        return true;
      })
      .sort((a, b) => {
        const left = a[sortField];
        const right = b[sortField];
        if (left === right) return 0;
        const result = left < right ? -1 : 1;
        return sortDirection === "asc" ? result : -result;
      });
  }, [bars, fromDate, toDate, sortDirection, sortField]);

  const previewBars = useMemo(() => filteredBars.slice(0, 100), [filteredBars]);

  const handleLoad = () =>
    startTransition(() => {
      setQuerySymbol(symbolInput.trim().toUpperCase() || "AAPL");
      setQueryTimeframe(timeframeInput);
    });

  const resetFilters = () => {
    setFromDate(data ? toDateInputValue(data.startTs) : "");
    setToDate(data ? toDateInputValue(data.endTs) : "");
    setSortField("time");
    setSortDirection("desc");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Market Data Viewer</h1>
        <p className="text-sm text-muted-foreground">
          Inspect the chunked historical bars already stored in Firestore.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lookup</CardTitle>
          <CardDescription>
            Start with a stored symbol and timeframe, then inspect the Firestore-backed response.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full max-w-xs space-y-2">
            <label className="text-sm font-medium">Symbol</label>
            <Input
              value={symbolInput}
              onChange={(event) => setSymbolInput(event.target.value.toUpperCase())}
              placeholder="AAPL"
            />
          </div>
          <div className="w-full max-w-xs space-y-2">
            <label className="text-sm font-medium">Timeframe</label>
            <Select value={timeframeInput} onValueChange={(value) => setTimeframeInput(value as (typeof TIMEFRAMES)[number])}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map((timeframe) => (
                  <SelectItem key={timeframe} value={timeframe}>
                    {timeframe}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleLoad}
            disabled={isPending}
          >
            Load Stored Bars
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chunk Summary</CardTitle>
          <CardDescription>
            Metadata for the first stored chunk found for the selected symbol and timeframe.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Path</div>
            <div className="mt-2 break-all font-mono text-sm">{data?.path ?? "Not loaded"}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Bars</div>
            <div className="mt-2 text-2xl font-semibold">{data?.count ?? "-"}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Start (UTC)</div>
            <div className="mt-2 text-sm">{data ? formatTimestamp(data.startTs) : "-"}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">End (UTC)</div>
            <div className="mt-2 text-sm">{data ? formatTimestamp(data.endTs) : "-"}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Provider Mapping</div>
            <div className="mt-2 text-sm">
              {data ? `${data.providerInterval ?? "-"} / ${data.providerPeriod ?? "-"}` : "-"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bar Preview</CardTitle>
          <CardDescription>
            Filter by date range and sort the loaded Firestore bars. Showing up to the first 100 matching rows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">From</label>
              <Input
                type="date"
                value={fromDate}
                min={data ? toDateInputValue(data.startTs) : undefined}
                max={toDate || (data ? toDateInputValue(data.endTs) : undefined)}
                onChange={(event) => setFromDate(event.target.value)}
                disabled={!data}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To</label>
              <Input
                type="date"
                value={toDate}
                min={fromDate || (data ? toDateInputValue(data.startTs) : undefined)}
                max={data ? toDateInputValue(data.endTs) : undefined}
                onChange={(event) => setToDate(event.target.value)}
                disabled={!data}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_FIELDS.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Direction</label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
                disabled={!data}
              >
                <span>{sortDirection === "asc" ? "Ascending" : "Descending"}</span>
                {sortDirection === "asc" ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button type="button" variant="secondary" className="w-full" onClick={resetFilters} disabled={!data}>
                Reset Filters
              </Button>
            </div>
          </div>

          {!isLoading && !isError && data ? (
            <p className="mb-4 text-sm text-muted-foreground">
              {filteredBars.length} matching bars out of {data.count} loaded.
            </p>
          ) : null}
          {isLoading ? <p className="text-sm text-muted-foreground">Loading stored bars…</p> : null}
          {isError ? (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to load stored bars."}
            </p>
          ) : null}
          {!isLoading && !isError && previewBars.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stored bars found for this selection.</p>
          ) : null}
          {previewBars.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time (UTC)</TableHead>
                  <TableHead>Open</TableHead>
                  <TableHead>High</TableHead>
                  <TableHead>Low</TableHead>
                  <TableHead>Close</TableHead>
                  <TableHead>Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewBars.map((bar) => (
                  <TableRow key={bar.time}>
                    <TableCell>{formatTimestamp(bar.time)}</TableCell>
                    <TableCell>{formatNumber(bar.open)}</TableCell>
                    <TableCell>{formatNumber(bar.high)}</TableCell>
                    <TableCell>{formatNumber(bar.low)}</TableCell>
                    <TableCell>{formatNumber(bar.close)}</TableCell>
                    <TableCell>{formatNumber(bar.volume)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
