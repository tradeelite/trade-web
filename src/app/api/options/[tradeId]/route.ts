import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { optionTrades } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  const { tradeId } = await params;
  const id = parseInt(tradeId);

  try {
    const trade = await db
      .select()
      .from(optionTrades)
      .where(eq(optionTrades.id, id))
      .get();

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json(trade);
  } catch (error) {
    console.error("Trade GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trade" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  const { tradeId } = await params;
  const id = parseInt(tradeId);

  try {
    const body = await request.json();
    const result = await db
      .update(optionTrades)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(optionTrades.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Trade PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update trade" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  const { tradeId } = await params;
  const id = parseInt(tradeId);

  try {
    await db.delete(optionTrades).where(eq(optionTrades.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Trade DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete trade" },
      { status: 500 }
    );
  }
}
