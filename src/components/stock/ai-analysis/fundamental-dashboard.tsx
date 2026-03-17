"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionJumpBar } from "@/components/ui/section-jump-bar";
import { MetricRow, RichFundamentalAnalysis, SignalType, VerdictRow } from "@/types/stock-analysis";

interface FundamentalDashboardProps {
  data: RichFundamentalAnalysis;
  ticker: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function signalBadgeClass(signal: SignalType): string {
  if (signal === "bullish") {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0";
  }
  if (signal === "bearish") {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0";
  }
  return "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border-0";
}

function HeaderCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex-1 min-w-0">
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <p className="text-xl font-semibold truncate">{value}</p>
      </CardContent>
    </Card>
  );
}

function MetricTable({
  id,
  title,
  rows,
  tickerLabel,
  showBenchmark = true,
}: {
  id: string;
  title: string;
  rows: MetricRow[];
  tickerLabel: string;
  showBenchmark?: boolean;
}) {
  if (!rows || rows.length === 0) return null;

  return (
    <div id={id} className="scroll-mt-32">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">
        {title}
      </p>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Metric
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide w-[18%]">
                    {showBenchmark ? `${tickerLabel} Value` : "Value"}
                  </th>
                  {showBenchmark && (
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide w-[16%]">
                      Benchmark
                    </th>
                  )}
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide w-[14%]">
                    Signal
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide w-[26%]">
                    {showBenchmark ? "Interpretation" : "Note"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{row.metric}</td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      {row.value ?? "N/A"}
                    </td>
                    {showBenchmark && (
                      <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                        {row.benchmark ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-center">
                      <Badge className={`text-xs font-medium px-2 py-0.5 ${signalBadgeClass(row.signal)}`}>
                        {row.signalLabel}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                      {row.interpretation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VerdictTable({ rows, keyRisk }: { rows: VerdictRow[]; keyRisk: string }) {
  if (!rows || rows.length === 0) return null;

  function verdictClass(verdict: string): string {
    const v = verdict.toLowerCase();
    if (v.includes("buy") || v === "hold") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0";
    if (v.includes("sell") || v.includes("avoid") || v.includes("risk")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0";
    return "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border-0";
  }

  return (
    <div id="fa-verdict" className="scroll-mt-32">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">
        Overall Verdict by Investor Type
      </p>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide w-[32%]">
                    Investor Type
                  </th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide w-[16%]">
                    Verdict
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Reasoning
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{row.investorType}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge className={`text-xs font-medium px-2 py-0.5 ${verdictClass(row.verdict)}`}>
                        {row.verdict}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">{row.reasoning}</td>
                  </tr>
                ))}
                {keyRisk && (
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-bold">Key risk to watch</td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge className="text-xs font-medium px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0">
                        Risk
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">{keyRisk}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const FA_SECTIONS = [
  { id: "fa-verdict", label: "Verdict" },
  { id: "fa-valuation", label: "Valuation" },
  { id: "fa-profitability", label: "Profitability" },
  { id: "fa-health", label: "Health" },
  { id: "fa-growth", label: "Growth" },
  { id: "fa-earnings", label: "Earnings" },
  { id: "fa-dividends", label: "Dividends" },
];

export function FundamentalDashboard({ data, ticker }: FundamentalDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Sticky section jump bar */}
      <SectionJumpBar sections={FA_SECTIONS} />

      {/* Summary */}
      {data.summary && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Analysis Summary
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Verdict */}
      <VerdictTable rows={data.verdict} keyRisk={data.keyRisk} />

      {/* Intro */}
      {data.intro && (
        <p className="text-sm text-muted-foreground">{data.intro}</p>
      )}

      {/* Header metric cards */}
      {data.header && (
        <div className="flex gap-3 flex-wrap">
          <HeaderCard label="Price" value={data.header.price} />
          <HeaderCard label="Market Cap" value={data.header.marketCap} />
          <HeaderCard label="Annual Revenue" value={data.header.revenue} />
          <HeaderCard label="Annual Net Income" value={data.header.netIncome} />
        </div>
      )}

      {/* Metric sections */}
      <MetricTable id="fa-valuation" title="Valuation" rows={data.valuation} tickerLabel={ticker} />
      <MetricTable id="fa-profitability" title="Profitability" rows={data.profitability} tickerLabel={ticker} />
      <MetricTable id="fa-health" title="Financial Health" rows={data.financialHealth} tickerLabel={ticker} />
      <MetricTable id="fa-growth" title="Growth" rows={data.growth} tickerLabel={ticker} />
      <MetricTable id="fa-earnings" title="Earnings & Analyst Data" rows={data.earnings} tickerLabel={ticker} showBenchmark={false} />
      <MetricTable id="fa-dividends" title="Dividend & Per-Share Info" rows={data.dividends} tickerLabel={ticker} showBenchmark={false} />

      {/* Sources */}
      {data.sources && data.sources.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Sources: {data.sources.join(", ")}
        </p>
      )}
    </div>
  );
}
