"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsAnalysis, SignalDirection } from "@/types/stock-analysis";
import { ExternalLink } from "lucide-react";

function signalBadge(signal: SignalDirection) {
  const variant = signal === "bullish" ? "default" : signal === "bearish" ? "destructive" : "secondary";
  return <Badge variant={variant} className="capitalize">{signal}</Badge>;
}

interface NewsPanelProps {
  news: NewsAnalysis;
}

export function NewsPanel({ news }: NewsPanelProps) {
  const bullish = news.socialSentiment.bullishPercent ?? 50;
  const bearish = 100 - bullish;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">News & Sentiment</CardTitle>
          {signalBadge(news.overallSentiment)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Social sentiment */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-muted-foreground">Social Sentiment</span>
            {signalBadge(news.socialSentiment.signal)}
          </div>
          <div className="flex rounded-full overflow-hidden h-2 mb-1">
            <div className="bg-green-500 transition-all" style={{ width: `${bullish}%` }} />
            <div className="bg-red-500 transition-all" style={{ width: `${bearish}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="text-green-500">{bullish.toFixed(0)}% Bullish</span>
            <span className="text-red-500">{bearish.toFixed(0)}% Bearish</span>
          </div>
          {news.socialSentiment.watchlistCount != null && (
            <div className="text-xs text-muted-foreground mt-1">
              {news.socialSentiment.watchlistCount.toLocaleString()} on watchlists
            </div>
          )}
        </div>

        {/* News sentiment */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-muted-foreground">News Sentiment</span>
          <Badge variant={news.newsSentiment === "positive" ? "default" : news.newsSentiment === "negative" ? "destructive" : "secondary"} className="capitalize">
            {news.newsSentiment}
          </Badge>
        </div>

        {/* Catalysts */}
        {news.catalysts.length > 0 && (
          <div>
            <span className="font-medium text-muted-foreground">Catalysts</span>
            <ul className="mt-1 space-y-1">
              {news.catalysts.slice(0, 5).map((c, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="text-green-500 shrink-0">&#9650;</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risks */}
        {news.risks.length > 0 && (
          <div>
            <span className="font-medium text-muted-foreground">Risks</span>
            <ul className="mt-1 space-y-1">
              {news.risks.slice(0, 5).map((r, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="text-red-500 shrink-0">&#9660;</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Headlines */}
        {news.headlines.length > 0 && (
          <div>
            <span className="font-medium text-muted-foreground">Recent Headlines</span>
            <div className="mt-1 space-y-2">
              {news.headlines.slice(0, 5).map((h, i) => (
                <div key={i} className="text-xs border-b pb-1 last:border-0">
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary flex items-start gap-1 group"
                  >
                    <span className="flex-1 leading-relaxed">{h.title}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100" />
                  </a>
                  <div className="text-muted-foreground mt-0.5">{h.source}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div className="flex items-center justify-between pt-1 border-t">
          <span className="font-medium text-muted-foreground">Recommendation</span>
          <Badge variant={news.recommendation === "Buy" ? "default" : news.recommendation === "Sell" ? "destructive" : "secondary"}>
            {news.recommendation}
          </Badge>
        </div>

        {/* Summary */}
        <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t">{news.summary}</p>
      </CardContent>
    </Card>
  );
}
