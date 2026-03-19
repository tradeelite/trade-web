"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, MessageCircle, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";
import type { Recommendation, SignalDirection } from "@/types/stock-analysis";

type SocialPost = {
  source: string;
  user: string;
  text: string;
  url: string;
  sentiment: string | null;
  createdAt: string | number | null;
};

type SocialAnalysisData = {
  ticker: string;
  overallSentiment: SignalDirection;
  metrics: {
    bullishPercent: number | null;
    bearishPercent: number | null;
    totalTaggedMentions: number;
    watchlistCount: number | null;
    redditPostCount: number | null;
  };
  sources: {
    stocktwits: { available: boolean; bullishPercent: number | null; messageCount: number };
    reddit: { available: boolean; bullishPercent: number | null; postCount: number };
    twitter: { available: boolean; note: string };
  };
  trendingTopics: string[];
  analyst: {
    recommendation: Recommendation;
    confidence: "high" | "medium" | "low";
    summary: string;
    catalysts: string[];
    risks: string[];
  };
  posts: SocialPost[];
  asOf: string;
};

function sentimentClass(signal: SignalDirection): string {
  if (signal === "bullish") return "bg-green-600 text-white";
  if (signal === "bearish") return "bg-red-600 text-white";
  return "bg-yellow-500 text-white";
}

function recClass(rec: Recommendation): string {
  if (rec === "Buy") return "bg-green-600 text-white";
  if (rec === "Sell") return "bg-red-600 text-white";
  if (rec === "Watch") return "bg-blue-500 text-white";
  return "bg-yellow-500 text-white";
}

export function SocialAnalysisTab({ ticker }: { ticker: string }) {
  const { data, isLoading, isError, error } = useQuery<SocialAnalysisData>({
    queryKey: QUERY_KEYS.stockSocialAnalysis(ticker),
    queryFn: () =>
      fetch(`/api/stocks/${ticker}/social-analysis`).then((r) => {
        if (!r.ok) throw new Error(`Failed to load social analysis (${r.status})`);
        return r.json();
      }),
    staleTime: STALE_TIMES.NEWS,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full rounded-lg" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{(error as Error)?.message ?? "Failed to load social analysis"}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Social Sentiment Analyst
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${sentimentClass(data.overallSentiment)}`}>
                {data.overallSentiment}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${recClass(data.analyst.recommendation)}`}>
                {data.analyst.recommendation}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
            {data.metrics.bullishPercent != null && (
              <span>
                <span className="font-semibold text-green-500">{data.metrics.bullishPercent.toFixed(1)}%</span> bullish
              </span>
            )}
            {data.metrics.bearishPercent != null && (
              <span>
                <span className="font-semibold text-red-500">{data.metrics.bearishPercent.toFixed(1)}%</span> bearish
              </span>
            )}
            <span>{data.metrics.totalTaggedMentions} tagged mentions</span>
            {data.metrics.watchlistCount != null && (
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{data.metrics.watchlistCount.toLocaleString()} watching</span>
            )}
            <span className="capitalize">Confidence: {data.analyst.confidence}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed border-t pt-2">{data.analyst.summary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" />Catalysts</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {(data.analyst.catalysts.length ? data.analyst.catalysts : ["No strong catalysts detected"]).map((c, i) => <p key={i}>• {c}</p>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-500" />Risks</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {(data.analyst.risks.length ? data.analyst.risks : ["No major social risks detected"]).map((r, i) => <p key={i}>• {r}</p>)}
          </CardContent>
        </Card>
      </div>

      {data.trendingTopics.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Trending Topics</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.trendingTopics.map((topic, i) => (
              <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{topic}</span>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><MessageCircle className="h-4 w-4" />Recent Social Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.posts.slice(0, 12).map((p, i) => (
            <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border p-3 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{p.source}</span>
                <span>@{p.user || "unknown"}</span>
                {p.createdAt && (
                  <>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(typeof p.createdAt === "number" ? p.createdAt * 1000 : p.createdAt), { addSuffix: true })}</span>
                  </>
                )}
                {p.sentiment && <span className="ml-auto capitalize">{p.sentiment}</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.text}</p>
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
