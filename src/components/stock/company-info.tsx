"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";
import { formatLargeNumber } from "@/lib/format";

interface CompanyInfoProps {
  ticker: string;
}

export function CompanyInfo({ ticker }: CompanyInfoProps) {
  const { data: summary, isLoading } = useQuery({
    queryKey: QUERY_KEYS.stockSummary(ticker),
    queryFn: () =>
      fetch(`/api/stocks/${ticker}/summary`).then((r) => r.json()),
    staleTime: STALE_TIMES.COMPANY,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.error) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {summary.sector && <Badge variant="secondary">{summary.sector}</Badge>}
          {summary.industry && (
            <Badge variant="outline">{summary.industry}</Badge>
          )}
        </div>
        {summary.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {summary.description.length > 500
              ? summary.description.slice(0, 500) + "..."
              : summary.description}
          </p>
        )}
        <div className="flex gap-6 text-sm">
          {summary.employees && (
            <div>
              <span className="text-muted-foreground">Employees: </span>
              <span className="font-medium">
                {formatLargeNumber(summary.employees)}
              </span>
            </div>
          )}
          {summary.website && (
            <div>
              <span className="text-muted-foreground">Website: </span>
              <span className="font-medium">{summary.website}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
