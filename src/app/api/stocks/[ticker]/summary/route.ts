import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-providers/provider-factory";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    const provider = await getDataProvider();
    const summary = await provider.getCompanySummary(ticker.toUpperCase());
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json(
      { error: "Failed to fetch company summary" },
      { status: 500 }
    );
  }
}
