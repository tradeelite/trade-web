"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, type IChartApi } from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";
import type { ChartRange, ChartDataPoint } from "@/types/stock";
import { computeIndicatorAnalysis } from "@/lib/analysis/compute-analysis";
import { IndicatorAnalysisPanel } from "./indicator-analysis";

const RANGES: ChartRange[] = ["1M", "3M", "1Y", "5Y"];

const INDICATOR_COLORS: Record<string, string> = {
  sma20: "#f59e0b",
  sma50: "#3b82f6",
  sma200: "#8b5cf6",
  ema12: "#06b6d4",
  ema26: "#ec4899",
};

interface IndicatorChartProps {
  ticker: string;
}

export function IndicatorChart({ ticker }: IndicatorChartProps) {
  const [range, setRange] = useState<ChartRange>("3M");
  const [enabledIndicators, setEnabledIndicators] = useState<Set<string>>(
    new Set(["sma20", "sma50"])
  );
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);

  const mainChartRef = useRef<HTMLDivElement>(null);
  const rsiChartRef = useRef<HTMLDivElement>(null);
  const macdChartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const rsiChartInstanceRef = useRef<IChartApi | null>(null);
  const macdChartInstanceRef = useRef<IChartApi | null>(null);

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: QUERY_KEYS.stockChart(ticker, range),
    queryFn: () =>
      fetch(`/api/stocks/${ticker}/chart?range=${range}`).then((r) => r.json()),
    staleTime: STALE_TIMES.CHART,
  });

  const { data: indicators, isLoading: indicatorsLoading } = useQuery({
    queryKey: QUERY_KEYS.stockIndicators(ticker, range),
    queryFn: () =>
      fetch(`/api/stocks/${ticker}/indicators?range=${range}`).then((r) =>
        r.json()
      ),
    staleTime: STALE_TIMES.CHART,
    enabled: !!chartData && chartData.length > 0,
  });

  const analysis = useMemo(() => {
    if (!chartData || !Array.isArray(chartData) || chartData.length === 0 || !indicators) return null;
    return computeIndicatorAnalysis(chartData, indicators);
  }, [chartData, indicators]);

  const toggleIndicator = (key: string) => {
    setEnabledIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    if (!mainChartRef.current || !chartData || chartData.length === 0) return;

    // Cleanup previous charts
    chartInstanceRef.current?.remove();
    rsiChartInstanceRef.current?.remove();
    macdChartInstanceRef.current?.remove();

    const chartOpts = {
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af",
        attributionLogo: false,
      },
      grid: { vertLines: { color: "#1f2937" }, horzLines: { color: "#1f2937" } },
      width: mainChartRef.current.clientWidth,
      crosshair: { mode: 0 as const },
      timeScale: { borderColor: "#374151" },
      rightPriceScale: { borderColor: "#374151" },
    };

    // Main chart
    const mainChart = createChart(mainChartRef.current, {
      ...chartOpts,
      height: 300,
    });

    const candles = mainChart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      wickUpColor: "#22c55e",
    });
    candles.setData(
      chartData.map((d: ChartDataPoint) => ({
        time: d.time as any,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    );

    // Overlay indicators
    if (indicators) {
      const overlayMap: Record<string, any[]> = {
        sma20: indicators.sma20,
        sma50: indicators.sma50,
        sma200: indicators.sma200,
        ema12: indicators.ema12,
        ema26: indicators.ema26,
      };
      for (const [key, data] of Object.entries(overlayMap)) {
        if (enabledIndicators.has(key) && data && data.length > 0) {
          const series = mainChart.addSeries(LineSeries,{
            color: INDICATOR_COLORS[key],
            lineWidth: 1,
            title: key.toUpperCase(),
          });
          series.setData(
            data.map((d: any) => ({ time: d.time as any, value: d.value }))
          );
        }
      }

      // Bollinger Bands
      if (
        enabledIndicators.has("bb") &&
        indicators.bollingerBands?.length > 0
      ) {
        const upper = mainChart.addSeries(LineSeries,{
          color: "#6366f180",
          lineWidth: 1,
          title: "BB Upper",
        });
        const lower = mainChart.addSeries(LineSeries,{
          color: "#6366f180",
          lineWidth: 1,
          title: "BB Lower",
        });
        upper.setData(
          indicators.bollingerBands.map((d: any) => ({
            time: d.time as any,
            value: d.upper,
          }))
        );
        lower.setData(
          indicators.bollingerBands.map((d: any) => ({
            time: d.time as any,
            value: d.lower,
          }))
        );
      }
    }

    mainChart.timeScale().fitContent();
    chartInstanceRef.current = mainChart;

    // RSI chart
    if (showRSI && rsiChartRef.current && indicators?.rsi?.length > 0) {
      const rsiChart = createChart(rsiChartRef.current, {
        ...chartOpts,
        height: 120,
        width: rsiChartRef.current.clientWidth,
      });
      const rsiSeries = rsiChart.addSeries(LineSeries,{
        color: "#f59e0b",
        lineWidth: 2,
        title: "RSI(14)",
      });
      rsiSeries.setData(
        indicators.rsi.map((d: any) => ({ time: d.time as any, value: d.value }))
      );

      // Overbought/oversold lines
      const ob = rsiChart.addSeries(LineSeries,{
        color: "#ef444450",
        lineWidth: 1,
        lineStyle: 2,
      });
      const os = rsiChart.addSeries(LineSeries,{
        color: "#22c55e50",
        lineWidth: 1,
        lineStyle: 2,
      });
      const times = indicators.rsi.map((d: any) => d.time);
      ob.setData(times.map((t: any) => ({ time: t as any, value: 70 })));
      os.setData(times.map((t: any) => ({ time: t as any, value: 30 })));

      rsiChart.timeScale().fitContent();
      rsiChartInstanceRef.current = rsiChart;
    }

    // MACD chart
    if (showMACD && macdChartRef.current && indicators?.macd?.length > 0) {
      const macdChart = createChart(macdChartRef.current, {
        ...chartOpts,
        height: 120,
        width: macdChartRef.current.clientWidth,
      });
      const macdLine = macdChart.addSeries(LineSeries,{
        color: "#3b82f6",
        lineWidth: 2,
        title: "MACD",
      });
      const signalLine = macdChart.addSeries(LineSeries,{
        color: "#f97316",
        lineWidth: 1,
        title: "Signal",
      });
      const histogram = macdChart.addSeries(HistogramSeries,{
        title: "Histogram",
      });

      macdLine.setData(
        indicators.macd.map((d: any) => ({ time: d.time as any, value: d.macd }))
      );
      signalLine.setData(
        indicators.macd.map((d: any) => ({
          time: d.time as any,
          value: d.signal,
        }))
      );
      histogram.setData(
        indicators.macd.map((d: any) => ({
          time: d.time as any,
          value: d.histogram,
          color: d.histogram >= 0 ? "#22c55e80" : "#ef444480",
        }))
      );

      macdChart.timeScale().fitContent();
      macdChartInstanceRef.current = macdChart;
    }

    const handleResize = () => {
      if (mainChartRef.current)
        mainChart.applyOptions({ width: mainChartRef.current.clientWidth });
      if (rsiChartRef.current && rsiChartInstanceRef.current)
        rsiChartInstanceRef.current.applyOptions({
          width: rsiChartRef.current.clientWidth,
        });
      if (macdChartRef.current && macdChartInstanceRef.current)
        macdChartInstanceRef.current.applyOptions({
          width: macdChartRef.current.clientWidth,
        });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      mainChart.remove();
      rsiChartInstanceRef.current?.remove();
      macdChartInstanceRef.current?.remove();
      chartInstanceRef.current = null;
      rsiChartInstanceRef.current = null;
      macdChartInstanceRef.current = null;
    };
  }, [chartData, indicators, enabledIndicators, showRSI, showMACD]);

  const isLoading = chartLoading || indicatorsLoading;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Technical Analysis</CardTitle>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <Button
                key={r}
                variant={range === r ? "default" : "ghost"}
                size="sm"
                onClick={() => setRange(r)}
              >
                {r}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap gap-2">
            {Object.entries(INDICATOR_COLORS).map(([key, color]) => (
              <Button
                key={key}
                variant={enabledIndicators.has(key) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleIndicator(key)}
                style={
                  enabledIndicators.has(key)
                    ? { backgroundColor: color, borderColor: color }
                    : {}
                }
              >
                {key.toUpperCase()}
              </Button>
            ))}
            <Button
              variant={enabledIndicators.has("bb") ? "default" : "outline"}
              size="sm"
              onClick={() => toggleIndicator("bb")}
            >
              BB
            </Button>
            <div className="ml-auto flex gap-2">
              <Button
                variant={showRSI ? "default" : "outline"}
                size="sm"
                onClick={() => setShowRSI(!showRSI)}
              >
                RSI
              </Button>
              <Button
                variant={showMACD ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMACD(!showMACD)}
              >
                MACD
              </Button>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div ref={mainChartRef} />
          )}
        </CardContent>
      </Card>
      {showRSI && (
        <Card>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-[120px] w-full" />
            ) : (
              <div ref={rsiChartRef} />
            )}
          </CardContent>
        </Card>
      )}
      {showMACD && (
        <Card>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-[120px] w-full" />
            ) : (
              <div ref={macdChartRef} />
            )}
          </CardContent>
        </Card>
      )}
      <IndicatorAnalysisPanel analysis={analysis} isLoading={isLoading} />
    </div>
  );
}
