"use client";

import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";

// Key rows to display per statement (yfinance metric names)
const INCOME_ROWS = [
  "Total Revenue",
  "Cost Of Revenue",
  "Gross Profit",
  "Operating Expense",
  "Operating Income",
  "EBITDA",
  "Net Income",
  "Basic EPS",
  "Diluted EPS",
];

const BALANCE_ROWS = [
  "Total Assets",
  "Current Assets",
  "Cash And Cash Equivalents",
  "Total Liabilities Net Minority Interest",
  "Current Liabilities",
  "Total Debt",
  "Net Debt",
  "Stockholders Equity",
];

const CASHFLOW_ROWS = [
  "Operating Cash Flow",
  "Capital Expenditure",
  "Free Cash Flow",
  "Investing Cash Flow",
  "Financing Cash Flow",
  "Dividends Paid",
  "Repurchase Of Capital Stock",
  "Changes In Cash",
];

type Period = Record<string, number | string>;

function fmtVal(v: number | null | undefined): string {
  if (v == null) return "—";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${v.toFixed(2)}`;
}

function fmtDate(d: string): string {
  // "2025-09-30" → "FY Sep '25" or "Q3 '25"
  const parts = d.split("-");
  if (parts.length < 3) return d;
  const year = parts[0].slice(2);
  const month = parseInt(parts[1]);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[month - 1]} '${year}`;
}

function isEPS(metric: string): boolean {
  return metric.toLowerCase().includes("eps");
}

function StatementTable({ rows, periods }: { rows: string[]; periods: Period[] }) {
  if (!periods.length) return <p className="text-sm text-muted-foreground py-4">No data available.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-48">Metric</th>
            {periods.map((p) => (
              <th key={p.date as string} className="text-right py-2 px-3 font-medium min-w-[90px]">
                {fmtDate(p.date as string)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((metric) => {
            const hasData = periods.some((p) => p[metric] != null);
            if (!hasData) return null;
            return (
              <tr key={metric} className="border-b border-border/40 hover:bg-muted/30">
                <td className="py-2 pr-4 text-muted-foreground">{metric}</td>
                {periods.map((p) => {
                  const raw = p[metric] as number | undefined;
                  const formatted = isEPS(metric)
                    ? raw != null ? `$${raw.toFixed(2)}` : "—"
                    : fmtVal(raw);
                  const isNeg = raw != null && raw < 0;
                  return (
                    <td
                      key={p.date as string}
                      className={`py-2 px-3 text-right tabular-nums ${isNeg ? "text-red-500" : ""}`}
                    >
                      {formatted}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PeriodTabs({
  annual,
  quarterly,
  rows,
}: {
  annual: Period[];
  quarterly: Period[];
  rows: string[];
}) {
  return (
    <Tabs defaultValue="annual">
      <TabsList className="mb-3">
        <TabsTrigger value="annual">Annual</TabsTrigger>
        <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
      </TabsList>
      <TabsContent value="annual">
        <StatementTable rows={rows} periods={annual} />
      </TabsContent>
      <TabsContent value="quarterly">
        <StatementTable rows={rows} periods={quarterly} />
      </TabsContent>
    </Tabs>
  );
}

export function FinancialStatements({ ticker }: { ticker: string }) {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.stockFinancialStatements(ticker),
    queryFn: () => fetch(`/api/stocks/${ticker}/financial-statements`).then((r) => r.json()),
    staleTime: STALE_TIMES.COMPANY,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Financial Statements</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Financial Statements</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="income">
          <TabsList className="mb-4">
            <TabsTrigger value="income">Income Statement</TabsTrigger>
            <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          </TabsList>
          <TabsContent value="income">
            <PeriodTabs
              annual={data.incomeStatement?.annual ?? []}
              quarterly={data.incomeStatement?.quarterly ?? []}
              rows={INCOME_ROWS}
            />
          </TabsContent>
          <TabsContent value="balance">
            <PeriodTabs
              annual={data.balanceSheet?.annual ?? []}
              quarterly={data.balanceSheet?.quarterly ?? []}
              rows={BALANCE_ROWS}
            />
          </TabsContent>
          <TabsContent value="cashflow">
            <PeriodTabs
              annual={data.cashFlow?.annual ?? []}
              quarterly={data.cashFlow?.quarterly ?? []}
              rows={CASHFLOW_ROWS}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
