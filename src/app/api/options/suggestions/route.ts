import { NextResponse } from "next/server";
import { db } from "@/db";
import { optionTrades } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDataProvider } from "@/lib/data-providers/provider-factory";
import { evaluateAllTrades } from "@/lib/options/suggestions";
import type { OptionTrade } from "@/types/options";

export async function GET() {
  try {
    const openTrades = (await db
      .select()
      .from(optionTrades)
      .where(eq(optionTrades.status, "open"))
      .all()) as OptionTrade[];

    if (openTrades.length === 0) {
      return NextResponse.json([]);
    }

    const uniqueTickers = [...new Set(openTrades.map((t) => t.ticker))];
    const provider = await getDataProvider();

    const priceMap: Record<string, number> = {};
    await Promise.allSettled(
      uniqueTickers.map(async (ticker) => {
        try {
          const quote = await provider.getQuote(ticker);
          priceMap[ticker] = quote.price;
        } catch {
          // Skip if price unavailable
        }
      })
    );

    // For earnings, use yahoo finance directly
    const earningsMap: Record<string, string | null> = {};
    // We'll fetch earnings via the earnings endpoint if needed
    // For now, pass empty map - earnings route handles it separately

    const suggestions = evaluateAllTrades(openTrades, priceMap, earningsMap);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
