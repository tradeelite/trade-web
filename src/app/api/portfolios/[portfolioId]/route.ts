import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { portfolios } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;
  const id = parseInt(portfolioId);

  try {
    const portfolio = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, id))
      .get();

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error("Portfolio GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;
  const id = parseInt(portfolioId);

  try {
    const body = await request.json();
    const { name, description } = body;

    const result = await db
      .update(portfolios)
      .set({
        name,
        description,
        updatedAt: new Date(),
      })
      .where(eq(portfolios.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Portfolio PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update portfolio" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;
  const id = parseInt(portfolioId);

  try {
    await db.delete(portfolios).where(eq(portfolios.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Portfolio DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete portfolio" },
      { status: 500 }
    );
  }
}
