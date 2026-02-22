"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  Info,
} from "lucide-react";
import type { IndicatorAnalysisSummary, SignalDirection, SignalResult } from "@/types/analysis";

// ─── Color / Icon Helpers ────────────────────────────────

function signalColor(signal: SignalDirection) {
  switch (signal) {
    case "bullish":
      return "text-green-500";
    case "bearish":
      return "text-red-500";
    case "neutral":
      return "text-yellow-500";
  }
}

function signalBg(signal: SignalDirection) {
  switch (signal) {
    case "bullish":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "bearish":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "neutral":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
  }
}

function SignalIcon({ signal, className = "h-4 w-4" }: { signal: SignalDirection; className?: string }) {
  switch (signal) {
    case "bullish":
      return <TrendingUp className={`${className} text-green-500`} />;
    case "bearish":
      return <TrendingDown className={`${className} text-red-500`} />;
    case "neutral":
      return <Minus className={`${className} text-yellow-500`} />;
  }
}

// ─── Signal Row Component ────────────────────────────────

function SignalRow({ result }: { result: SignalResult }) {
  const row = (
    <div className="flex items-center gap-2 py-1.5">
      <SignalIcon signal={result.signal} />
      <span className={`text-sm ${signalColor(result.signal)}`}>{result.label}</span>
      {result.detail && <Info className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />}
    </div>
  );

  if (!result.detail) return row;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help">{row}</div>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">
        <p className="text-xs">{result.detail}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Section Components ──────────────────────────────────

function TrendSection({ trend }: { trend: IndicatorAnalysisSummary["trend"] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-semibold text-sm">Trend</h4>
        <Badge variant="outline" className={`ml-auto text-xs ${signalBg(trend.overall)}`}>
          {trend.overall}
        </Badge>
      </div>
      <Separator className="mb-2" />
      <div className="space-y-0.5">
        <SignalRow result={trend.priceVsSma20} />
        <SignalRow result={trend.priceVsSma50} />
        <SignalRow result={trend.priceVsSma200} />
        <Separator className="my-1.5" />
        <SignalRow result={trend.sma20Slope} />
        <SignalRow result={trend.sma50Slope} />
        <SignalRow result={trend.sma200Slope} />
      </div>
    </div>
  );
}

function CrossoverSection({ crossover }: { crossover: IndicatorAnalysisSummary["crossover"] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {crossover.state === "golden_cross" ? (
          <ArrowUpCircle className="h-4 w-4 text-green-500" />
        ) : crossover.state === "death_cross" ? (
          <ArrowDownCircle className="h-4 w-4 text-red-500" />
        ) : (
          <Minus className="h-4 w-4 text-muted-foreground" />
        )}
        <h4 className="font-semibold text-sm">Crossover</h4>
        <Badge variant="outline" className={`ml-auto text-xs ${signalBg(crossover.signal)}`}>
          {crossover.signal}
        </Badge>
      </div>
      <Separator className="mb-2" />
      <SignalRow
        result={{
          signal: crossover.signal,
          label: crossover.label,
          detail: crossover.detail,
        }}
      />
      {crossover.lastCrossoverDate && (
        <div className="mt-2 rounded-md bg-muted/50 p-2.5">
          <p className="text-xs text-muted-foreground">Last crossover</p>
          <p className="text-sm font-medium">{crossover.lastCrossoverDate}</p>
          {crossover.daysSinceCrossover != null && (
            <p className="text-xs text-muted-foreground">
              {crossover.daysSinceCrossover} days ago
            </p>
          )}
        </div>
      )}
      {crossover.state === "none" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Select a longer time range (1Y or 5Y) to see SMA50/SMA200 crossover data.
        </p>
      )}
    </div>
  );
}

function MomentumSection({ momentum }: { momentum: IndicatorAnalysisSummary["momentum"] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-semibold text-sm">Momentum</h4>
      </div>
      <Separator className="mb-2" />
      <div className="space-y-0.5">
        <SignalRow result={momentum.rsi} />
        {momentum.rsi.value != null && (
          <div className="ml-6 mb-1">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  momentum.rsi.value > 70
                    ? "bg-red-500"
                    : momentum.rsi.value < 30
                    ? "bg-green-500"
                    : "bg-yellow-500"
                }`}
                style={{ width: `${Math.min(100, momentum.rsi.value)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>Oversold (30)</span>
              <span>Overbought (70)</span>
            </div>
          </div>
        )}
        <Separator className="my-1.5" />
        <SignalRow result={momentum.macdSignal} />
        <SignalRow result={momentum.macdHistogram} />
        <Separator className="my-1.5" />
        <SignalRow result={momentum.bollingerPosition} />
        {momentum.bollingerPosition.squeeze && (
          <div className="ml-6 mt-1 rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2">
            <p className="text-xs text-yellow-500 font-medium">
              Bollinger Squeeze detected — breakout imminent
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

interface IndicatorAnalysisPanelProps {
  analysis: IndicatorAnalysisSummary | null;
  isLoading: boolean;
}

export function IndicatorAnalysisPanel({ analysis, isLoading }: IndicatorAnalysisPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Indicator Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Indicator Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Insufficient data for indicator analysis. Try selecting a longer time range.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Indicator Analysis</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-sm font-semibold ${signalBg(analysis.overallSignal)}`}
            >
              <SignalIcon signal={analysis.overallSignal} className="h-3.5 w-3.5 mr-1" />
              Overall: {analysis.overallSignal.charAt(0).toUpperCase() + analysis.overallSignal.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TrendSection trend={analysis.trend} />
            <CrossoverSection crossover={analysis.crossover} />
            <MomentumSection momentum={analysis.momentum} />
          </div>

          {/* Signal Summary Bar */}
          <Separator className="my-4" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">Signal Summary:</span>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              {analysis.signalCount.bullish} Bullish
            </Badge>
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
              {analysis.signalCount.bearish} Bearish
            </Badge>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              {analysis.signalCount.neutral} Neutral
            </Badge>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
