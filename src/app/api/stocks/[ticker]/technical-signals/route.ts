import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? process.env.TRADE_BACKEND_URL ?? "http://localhost:8000";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/stocks/${ticker.toUpperCase()}/technical-signals`,
      { next: { revalidate: 600 } }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch signals" }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }
}
