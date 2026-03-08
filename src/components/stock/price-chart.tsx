"use client";

import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, HistogramSeries, type IChartApi } from "lightweight-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";
import type { ChartRange, ChartDataPoint } from "@/types/stock";
import { useState } from "react";

const RANGES: ChartRange[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"];

interface PriceChartProps {
  ticker: string;
}

export function PriceChart({ ticker }: PriceChartProps) {
  const [range, setRange] = useState<ChartRange>("1M");
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const { data: chartData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.stockChart(ticker, range),
    queryFn: () =>
      fetch(`/api/stocks/${ticker}/chart?range=${range}`).then((r) =>
        r.json()
      ),
    staleTime: STALE_TIMES.CHART,
  });

  useEffect(() => {
    if (!chartContainerRef.current || !chartData || !Array.isArray(chartData) || chartData.length === 0)
      return;

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderColor: "#374151",
        timeVisible: range === "1D" || range === "1W",
      },
      rightPriceScale: {
        borderColor: "#374151",
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      wickUpColor: "#22c55e",
    });

    const formattedData = chartData.map((d: ChartDataPoint) => ({
      time: d.time as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeries.setData(formattedData);

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#6366f1",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    volumeSeries.setData(
      chartData.map((d: ChartDataPoint) => ({
        time: d.time as any,
        value: d.volume,
        color: d.close >= d.open ? "#22c55e40" : "#ef444440",
      }))
    );

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [chartData, range]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Price Chart</CardTitle>
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
        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="relative">
            <div ref={chartContainerRef} />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-2xl font-bold tracking-widest select-none"
              style={{ color: "rgba(0,184,160,0.10)", fontFamily: "var(--font-orbitron,'Orbitron',monospace)" }}>
              TradeElite.AI
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
