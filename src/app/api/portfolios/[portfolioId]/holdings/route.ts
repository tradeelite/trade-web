import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { holdings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getDataProvider } from "@/lib/data-providers/provider-factory";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;
  const id = parseInt(portfolioId);

  try {
    const holdingsList = await db
      .select()
      .from(holdings)
      .where(eq(holdings.portfolioId, id))
      .all();

    const provider = await getDataProvider();
    const enriched = await Promise.all(
      holdingsList.map(async (h) => {
        try {
          const quote = await provider.getQuote(h.ticker);
          const currentValue = quote.price * h.shares;
          const cost = h.avgCost * h.shares;
          return {
            ...h,
            currentPrice: quote.price,
            currentValue,
            gainLoss: currentValue - cost,
            gainLossPercent: ((currentValue - cost) / cost) * 100,
          };
        } catch {
          return {
            ...h,
            currentPrice: undefined,
            currentValue: undefined,
            gainLoss: undefined,
            gainLossPercent: undefined,
          };
        }
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Holdings GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch holdings" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;
  const id = parseInt(portfolioId);

  try {
    const body = await request.json();
    const { ticker, shares, avgCost } = body;

    if (!ticker || !shares || !avgCost) {
      return NextResponse.json(
        { error: "ticker, shares, and avgCost are required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(holdings)
      .values({
        portfolioId: id,
        ticker: ticker.toUpperCase(),
        shares: parseFloat(shares),
        avgCost: parseFloat(avgCost),
      })
      .onConflictDoUpdate({
        target: [holdings.portfolioId, holdings.ticker],
        set: {
          shares: parseFloat(shares),
          avgCost: parseFloat(avgCost),
        },
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Holding POST error:", error);
    return NextResponse.json(
      { error: "Failed to add holding" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;
  const id = parseInt(portfolioId);
  const holdingId = request.nextUrl.searchParams.get("holdingId");

  if (!holdingId) {
    return NextResponse.json(
      { error: "holdingId is required" },
      { status: 400 }
    );
  }

  try {
    await db
      .delete(holdings)
      .where(
        and(
          eq(holdings.id, parseInt(holdingId)),
          eq(holdings.portfolioId, id)
        )
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Holding DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete holding" },
      { status: 500 }
    );
  }
}
