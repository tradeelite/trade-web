import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { portfolios, holdings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getDataProvider } from "@/lib/data-providers/provider-factory";

export async function GET() {
  try {
    const allPortfolios = await db.select().from(portfolios).all();
    const provider = await getDataProvider();

    const result = await Promise.all(
      allPortfolios.map(async (p) => {
        const holdingsList = await db
          .select()
          .from(holdings)
          .where(eq(holdings.portfolioId, p.id))
          .all();

        let totalValue = 0;
        let totalCost = 0;

        await Promise.allSettled(
          holdingsList.map(async (h) => {
            try {
              const quote = await provider.getQuote(h.ticker);
              const currentValue = quote.price * h.shares;
              const cost = h.avgCost * h.shares;
              totalValue += currentValue;
              totalCost += cost;
            } catch {
              totalCost += h.avgCost * h.shares;
            }
          })
        );

        const totalGainLoss = totalValue - totalCost;
        const totalGainLossPercent =
          totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

        return {
          ...p,
          totalValue,
          totalCost,
          totalGainLoss,
          totalGainLossPercent,
          holdingsCount: holdingsList.length,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Portfolios GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolios" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(portfolios)
      .values({ name, description: description || null })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Portfolio POST error:", error);
    return NextResponse.json(
      { error: "Failed to create portfolio" },
      { status: 500 }
    );
  }
}
