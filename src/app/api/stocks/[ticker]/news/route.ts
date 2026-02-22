import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    const result: any = await yahooFinance.search(ticker.toUpperCase(), {
      newsCount: 10,
      quotesCount: 0,
    });

    const news = (result.news ?? []).map((item: any) => ({
      title: item.title,
      publisher: item.publisher,
      url: item.link,
      publishedAt: item.providerPublishTime
        ? new Date(item.providerPublishTime).toISOString()
        : null,
      thumbnail: item.thumbnail?.resolutions?.[0]?.url ?? null,
    }));

    return NextResponse.json(news);
  } catch (err: any) {
    console.error("[news]", err?.message);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
