import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-providers/provider-factory";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json([]);
  }

  try {
    const provider = await getDataProvider();
    const results = await provider.search(q);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search stocks" },
      { status: 500 }
    );
  }
}
