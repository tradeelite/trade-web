"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

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

interface TechnicalAnalysisProps {
  ticker: string;
}

export function TechnicalAnalysis({ ticker }: TechnicalAnalysisProps) {
  return <IndicatorChart ticker={ticker} />;
}
