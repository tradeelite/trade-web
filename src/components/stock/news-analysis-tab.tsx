"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ExternalLink, Newspaper, TrendingUp, TrendingDown, Users, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";
import type { SignalDirection, Recommendation } from "@/types/stock-analysis";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  summary: string;
  thumbnail: string | null;
}

interface NewsAnalysisData {
  ticker: string;
  overallSentiment: SignalDirection;
  socialSentiment: {
    signal: SignalDirection;
    bullishPercent: number | null;
    watchlistCount: number | null;
  };
  newsSentiment: "positive" | "negative" | "mixed";
  catalysts: string[];
  risks: string[];
  keyEvents: string[];
  articles: NewsArticle[];
  recommendation: Recommendation;
  summary: string;
  asOf: string;
  finnhubScore: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sentimentBadgeClass(signal: SignalDirection): string {
  if (signal === "bullish") return "bg-green-600 text-white";
  if (signal === "bearish") return "bg-red-600 text-white";
  return "bg-yellow-500 text-white";
}

function sentimentLabel(signal: SignalDirection): string {
  return signal.charAt(0).toUpperCase() + signal.slice(1);
}

function recBadgeClass(rec: Recommendation): string {
  if (rec === "Buy") return "bg-green-600 text-white";
  if (rec === "Sell") return "bg-red-600 text-white";
  if (rec === "Watch") return "bg-blue-500 text-white";
  return "bg-yellow-500 text-white";
}

// ─── AI Insight Banner ────────────────────────────────────────────────────────

function AiNewsBanner({ data }: { data: NewsAnalysisData }) {
  const bullish = data.socialSentiment.bullishPercent ?? null;
  const bearish = bullish !== null ? 100 - bullish : null;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          AI News & Sentiment Analysis
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${sentimentBadgeClass(data.overallSentiment)}`}>
            {sentimentLabel(data.overallSentiment)}
          </span>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${recBadgeClass(data.recommendation)}`}>
            {data.recommendation}
          </span>
        </div>
      </div>

      {/* Sentiment signals row */}
      <div className="flex items-center gap-5 flex-wrap text-xs">
        <span className="text-muted-foreground">
          News:{" "}
          <span className={`font-semibold ${data.newsSentiment === "positive" ? "text-green-500" : data.newsSentiment === "negative" ? "text-red-500" : "text-foreground"}`}>
            {data.newsSentiment}
          </span>
        </span>
        {bullish !== null && (
          <span className="text-muted-foreground">
            Social:{" "}
            <span className="text-green-500 font-semibold">{bullish.toFixed(0)}% Bullish</span>
            {" · "}
            <span className="text-red-500 font-semibold">{bearish?.toFixed(0)}% Bearish</span>
          </span>
        )}
        {data.socialSentiment.watchlistCount !== null && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            {data.socialSentiment.watchlistCount.toLocaleString()} watching
          </span>
        )}
        {data.finnhubScore !== null && (
          <span className="text-muted-foreground">
            Finnhub score:{" "}
            <span className="font-semibold text-foreground">{data.finnhubScore.toFixed(2)}</span>
          </span>
        )}
      </div>

      {/* Catalysts + Risks inline */}
      {(data.catalysts.length > 0 || data.risks.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-border/40">
          {data.catalysts.length > 0 && (
            <div>
              <p className="font-semibold text-green-600 dark:text-green-400 mb-1">Catalysts</p>
              <ul className="space-y-1">
                {data.catalysts.slice(0, 5).map((c, i) => (
                  <li key={i} className="flex gap-1.5 text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.risks.length > 0 && (
            <div>
              <p className="font-semibold text-red-600 dark:text-red-400 mb-1">Risks</p>
              <ul className="space-y-1">
                {data.risks.slice(0, 5).map((r, i) => (
                  <li key={i} className="flex gap-1.5 text-muted-foreground">
                    <TrendingDown className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {data.summary && (
        <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-2">
          {data.summary}
        </p>
      )}
    </div>
  );
}

// ─── Articles List ────────────────────────────────────────────────────────────

function ArticlesList({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-0 divide-y">
        {articles.map((item, i) => {
          const hasDate = item.publishedAt && item.publishedAt !== "None" && item.publishedAt !== "";
          return (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 p-4 hover:bg-muted/40 transition-colors group"
            >
              {item.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnail}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded object-cover bg-muted"
                />
              ) : (
                <div className="h-14 w-14 shrink-0 rounded bg-muted flex items-center justify-center">
                  <Newspaper className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary">
                  {item.title}
                </p>
                {item.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.summary}</p>
                )}
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <span>{item.source}</span>
                  {hasDate && (
                    <>
                      <span>·</span>
                      <span>
                        {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}
                      </span>
                    </>
                  )}
                  <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              </div>
            </a>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NewsAnalysisTab({ ticker }: { ticker: string }) {
  const { data, isLoading, isError, error } = useQuery<NewsAnalysisData>({
    queryKey: QUERY_KEYS.stockNewsAnalysis(ticker),
    queryFn: () =>
      fetch(`/api/stocks/${ticker}/news-analysis`).then((r) => {
        if (!r.ok) throw new Error(`Failed to load news analysis (${r.status})`);
        return r.json();
      }),
    staleTime: STALE_TIMES.NEWS,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-14 w-14 shrink-0 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{(error as Error)?.message ?? "Failed to load news analysis"}</span>
      </div>
    );
  }

  const articles = data.articles ?? [];
  const newsLabel = `${articles.length} article${articles.length !== 1 ? "s" : ""}`;

  return (
    <div className="space-y-4">
      <AiNewsBanner data={data} />

      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Recent News · {newsLabel}
        </p>
        {data.asOf && (
          <p className="text-xs text-muted-foreground/60">
            {formatDistanceToNow(new Date(data.asOf), { addSuffix: true })}
          </p>
        )}
      </div>

      <ArticlesList articles={articles} />
    </div>
  );
}
