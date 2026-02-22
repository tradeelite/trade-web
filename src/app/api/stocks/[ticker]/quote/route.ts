import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-providers/provider-factory";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    const provider = await getDataProvider();
    const quote = await provider.getQuote(ticker.toUpperCase());
    return NextResponse.json(quote);
  } catch (error) {
    console.error("Quote error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 }
    );
  }
}
