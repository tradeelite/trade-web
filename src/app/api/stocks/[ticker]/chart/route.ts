import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-providers/provider-factory";
import type { ChartRange } from "@/types/stock";

const VALID_RANGES: ChartRange[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const range = (request.nextUrl.searchParams.get("range") || "1M") as ChartRange;

  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  try {
    const provider = await getDataProvider();
    const data = await provider.getChart(ticker.toUpperCase(), range);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Chart error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 }
    );
  }
}
