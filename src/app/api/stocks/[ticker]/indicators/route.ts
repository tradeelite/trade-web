import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-providers/provider-factory";
import {
  computeSMA,
  computeEMA,
  computeRSI,
  computeMACD,
  computeBollingerBands,
} from "@/lib/data-providers/indicators";
import type { ChartRange } from "@/types/stock";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const range = (request.nextUrl.searchParams.get("range") || "1M") as ChartRange;

  try {
    const provider = await getDataProvider();
    const chartData = await provider.getChart(ticker.toUpperCase(), range);

    const indicators = {
      sma20: computeSMA(chartData, 20),
      sma50: computeSMA(chartData, 50),
      sma200: computeSMA(chartData, 200),
      ema12: computeEMA(chartData, 12),
      ema26: computeEMA(chartData, 26),
      rsi: computeRSI(chartData, 14),
      macd: computeMACD(chartData, 12, 26, 9),
      bollingerBands: computeBollingerBands(chartData, 20, 2),
    };

    return NextResponse.json(indicators);
  } catch (error) {
    console.error("Indicators error:", error);
    return NextResponse.json(
      { error: "Failed to compute indicators" },
      { status: 500 }
    );
  }
}
