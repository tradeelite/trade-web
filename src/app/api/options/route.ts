import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { optionTrades } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");

  try {
    let trades;
    if (status && (status === "open" || status === "closed")) {
      trades = await db
        .select()
        .from(optionTrades)
        .where(eq(optionTrades.status, status))
        .all();
    } else {
      trades = await db.select().from(optionTrades).all();
    }

    return NextResponse.json(trades);
  } catch (error) {
    console.error("Options GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trades" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ticker,
      optionType,
      direction,
      strikePrice,
      expiryDate,
      premium,
      quantity,
      brokerage,
      notes,
      source,
    } = body;

    if (!ticker || !optionType || !direction || !strikePrice || !expiryDate || !premium || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(optionTrades)
      .values({
        ticker: ticker.toUpperCase(),
        optionType,
        direction,
        strikePrice: parseFloat(strikePrice),
        expiryDate,
        premium: parseFloat(premium),
        quantity: parseInt(quantity),
        brokerage: brokerage || null,
        notes: notes || null,
        source: source || "manual",
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Options POST error:", error);
    return NextResponse.json(
      { error: "Failed to create trade" },
      { status: 500 }
    );
  }
}
