import { NextRequest, NextResponse } from "next/server";

interface StockTwitsMessage {
  id: number;
  body: string;
  created_at: string;
  user: { username: string };
  entities?: { sentiment?: { basic: string } };
}

interface StockTwitsResponse {
  symbol?: {
    watchlist_count?: number;
  };
  messages?: StockTwitsMessage[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();

  try {
    const res = await fetch(
      `https://api.stocktwits.com/api/2/streams/symbol/${symbol}.json`,
      { headers: { "User-Agent": "TradeView/1.0" }, next: { revalidate: 120 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "StockTwits unavailable" },
        { status: res.status }
      );
    }

    const data: StockTwitsResponse = await res.json();

    const messages = (data.messages ?? []).map((m) => ({
      id: m.id,
      body: m.body,
      user: m.user.username,
      sentiment: m.entities?.sentiment?.basic ?? null,
      createdAt: m.created_at,
    }));

    const bullishCount = messages.filter((m) => m.sentiment === "Bullish").length;
    const bearishCount = messages.filter((m) => m.sentiment === "Bearish").length;
    const taggedTotal = bullishCount + bearishCount;
    const bullishPercent =
      taggedTotal > 0 ? Math.round((bullishCount / taggedTotal) * 100) : null;

    return NextResponse.json({
      watchlistCount: data.symbol?.watchlist_count ?? null,
      bullishPercent,
      bullishCount,
      bearishCount,
      messages,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch sentiment" },
      { status: 500 }
    );
  }
}
