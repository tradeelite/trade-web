"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Newspaper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";

interface NewsItem {
  title: string;
  publisher: string;
  url: string;
  publishedAt: string | null;
  thumbnail: string | null;
}

interface StockNewsProps {
  ticker: string;
}

export function StockNews({ ticker }: StockNewsProps) {
  const { data: news, isLoading } = useQuery<NewsItem[]>({
    queryKey: QUERY_KEYS.stockNews(ticker),
    queryFn: () =>
      fetch(`/api/stocks/${ticker}/news`).then((r) => r.json()),
    staleTime: STALE_TIMES.NEWS,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            Recent News
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-14 w-14 shrink-0 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!news || (news as unknown as { error: string }).error || news.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            Recent News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent news found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-4 w-4" />
          Recent News
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {news.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-3 py-3 first:pt-0 last:pb-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors group"
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
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <span>{item.publisher}</span>
                {item.publishedAt && (
                  <>
                    <span>·</span>
                    <span>
                      {formatDistanceToNow(new Date(item.publishedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </>
                )}
                <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
