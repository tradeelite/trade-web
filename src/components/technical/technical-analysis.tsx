"use client";

import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { QUERY_KEYS } from "@/lib/constants";
import { StockAnalysis, SignalDirection } from "@/types/stock-analysis";
import { TechnicalSignalsPanel } from "./technical-signals-panel";

const IndicatorChart = dynamic(
  () =>
    import("./indicator-chart").then((mod) => ({
      default: mod.IndicatorChart,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[540px] w-full rounded-lg" />,
  }
);

function SignalPill({ signal }: { signal: SignalDirection }) {
  const cls =
    signal === "bullish"
      ? "bg-green-600 text-white"
      : signal === "bearish"
      ? "bg-red-600 text-white"
      : "bg-yellow-500 text-white";
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {signal}
    </span>
  );
}

function RecPill({ rec }: { rec: string }) {
  const cls =
    rec === "Buy" || rec === "Strong Buy"
      ? "bg-green-600 text-white"
      : rec === "Sell" || rec === "Strong Sell"
      ? "bg-red-600 text-white"
      : rec === "Watch"
      ? "bg-blue-500 text-white"
      : "bg-yellow-500 text-white";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${cls}`}>
      {rec}
    </span>
  );
}

function AiInsightBanner({ ticker }: { ticker: string }) {
  const qc = useQueryClient();
  const cached = qc.getQueryData<StockAnalysis>(QUERY_KEYS.stockAnalysis(ticker));

  if (!cached?.technical) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        <span>
          AI technical signals not loaded yet — visit the{" "}
          <span className="font-semibold text-foreground">AI Analysis</span> tab to run the analysis.
        </span>
      </div>
    );
  }

  const t = cached.technical;
  const agg = t.aggregatedSignals;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          AI Technical Insight
        </div>
        <RecPill rec={t.recommendation} />
      </div>

      {/* Signal counts + opinions */}
      <div className="flex items-center gap-4 flex-wrap text-xs">
        {agg && (
          <>
            {agg.barchartOpinion && (
              <span className="text-muted-foreground">
                Barchart:{" "}
                <span className="font-semibold text-foreground">{agg.barchartOpinion}</span>
              </span>
            )}
            {agg.tradingViewRating && (
              <span className="text-muted-foreground">
                TradingView:{" "}
                <span className="font-semibold text-foreground">{agg.tradingViewRating}</span>
              </span>
            )}
            <span className="text-muted-foreground">
              Signals:{" "}
              <span className="text-green-600 font-semibold">B:{agg.signalCount.buy}</span>
              {" · "}
              <span className="text-muted-foreground font-semibold">N:{agg.signalCount.neutral}</span>
              {" · "}
              <span className="text-red-500 font-semibold">S:{agg.signalCount.sell}</span>
            </span>
          </>
        )}
      </div>

      {/* Short / Medium / Long chips + key momentum */}
      <div className="flex items-center gap-5 flex-wrap text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Short</span>
          <SignalPill signal={t.signals.shortTerm} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Medium</span>
          <SignalPill signal={t.signals.mediumTerm} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Long</span>
          <SignalPill signal={t.signals.longTerm} />
        </div>
        {t.momentum.rsi != null && (
          <span className="text-muted-foreground">
            RSI <span className="font-semibold text-foreground">{t.momentum.rsi.toFixed(1)}</span>
            {t.momentum.rsiStatus && (
              <span className="ml-1 text-muted-foreground">({t.momentum.rsiStatus})</span>
            )}
          </span>
        )}
        {t.supportResistance.support != null && (
          <span className="text-muted-foreground">
            Support <span className="font-semibold text-green-600">${t.supportResistance.support.toFixed(2)}</span>
          </span>
        )}
        {t.supportResistance.resistance != null && (
          <span className="text-muted-foreground">
            Resistance <span className="font-semibold text-red-500">${t.supportResistance.resistance.toFixed(2)}</span>
          </span>
        )}
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-2">
        {t.summary}
      </p>
    </div>
  );
}

interface TechnicalAnalysisProps {
  ticker: string;
}

export function TechnicalAnalysis({ ticker }: TechnicalAnalysisProps) {
  return (
    <div className="space-y-6">
      <AiInsightBanner ticker={ticker} />
      <IndicatorChart ticker={ticker} />
      <TechnicalSignalsPanel ticker={ticker} />
    </div>
  );
}
