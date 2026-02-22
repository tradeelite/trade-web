"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, TrendingDown, Users, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";

interface SentimentMessage {
  id: number;
  body: string;
  user: string;
  sentiment: "Bullish" | "Bearish" | null;
  createdAt: string;
}

interface SentimentData {
  watchlistCount: number | null;
  bullishPercent: number | null;
  bullishCount: number;
  bearishCount: number;
  messages: SentimentMessage[];
  error?: string;
}

interface StockSentimentProps {
  ticker: string;
}

export function StockSentiment({ ticker }: StockSentimentProps) {
  const { data, isLoading } = useQuery<SentimentData>({
    queryKey: QUERY_KEYS.stockSentiment(ticker),
    queryFn: () =>
      fetch(`/api/stocks/${ticker}/sentiment`).then((r) => r.json()),
    staleTime: STALE_TIMES.SENTIMENT,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            StockTwits Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full rounded-full" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            StockTwits Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sentiment data unavailable.
          </p>
        </CardContent>
      </Card>
    );
  }

  const bearishPercent =
    data.bullishPercent !== null ? 100 - data.bullishPercent : null;
  const hasSentiment = data.bullishPercent !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            StockTwits Sentiment
          </span>
          {data.watchlistCount !== null && (
            <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
              <Users className="h-3 w-3" />
              {data.watchlistCount.toLocaleString()} watching
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasSentiment ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUp className="h-3.5 w-3.5" />
                Bullish {data.bullishPercent}%
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                Bearish {bearishPercent}%
                <TrendingDown className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden">
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${data.bullishPercent}%` }}
              />
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${bearishPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {data.bullishCount + data.bearishCount} tagged messages
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No sentiment tags on recent messages.
          </p>
        )}

        {data.messages.length > 0 && (
          <div className="space-y-3 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Latest Messages
            </p>
            {data.messages.slice(0, 10).map((msg) => (
              <div key={msg.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">@{msg.user}</span>
                  {msg.sentiment === "Bullish" && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-green-500 text-green-600 dark:text-green-400"
                    >
                      Bullish
                    </Badge>
                  )}
                  {msg.sentiment === "Bearish" && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-red-500 text-red-600 dark:text-red-400"
                    >
                      Bearish
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(msg.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-snug">
                  {msg.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
