import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export async function GET(request: NextRequest) {
  const tickers = request.nextUrl.searchParams.get("tickers");
  if (!tickers) {
    return NextResponse.json({});
  }

  const tickerList = tickers.split(",").map((t) => t.trim().toUpperCase());
  const earningsMap: Record<string, string | null> = {};

  await Promise.allSettled(
    tickerList.map(async (ticker) => {
      try {
        const result: any = await yahooFinance.quoteSummary(ticker, {
          modules: ["calendarEvents"],
        });
        const earningsDate =
          result.calendarEvents?.earnings?.earningsDate?.[0];
        earningsMap[ticker] = earningsDate
          ? new Date(earningsDate).toISOString().split("T")[0]
          : null;
      } catch {
        earningsMap[ticker] = null;
      }
    })
  );

  return NextResponse.json(earningsMap);
}
