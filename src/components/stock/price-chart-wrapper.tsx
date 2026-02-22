"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const PriceChart = dynamic(
  () => import("./price-chart").then((mod) => ({ default: mod.PriceChart })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[460px] w-full rounded-lg" />,
  }
);

interface PriceChartWrapperProps {
  ticker: string;
}

export function PriceChartWrapper({ ticker }: PriceChartWrapperProps) {
  return <PriceChart ticker={ticker} />;
}
