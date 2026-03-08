"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockAnalysis, SignalDirection, OverallRecommendation, Confidence } from "@/types/stock-analysis";

function signalBadgeVariant(signal: SignalDirection): "default" | "secondary" | "destructive" {
  if (signal === "bullish") return "default";
  if (signal === "bearish") return "destructive";
  return "secondary";
}

function recommendationColor(rec: OverallRecommendation): string {
  if (rec === "Strong Buy") return "bg-green-600 text-white";
  if (rec === "Buy") return "bg-green-400 text-white";
  if (rec === "Hold") return "bg-yellow-500 text-white";
  if (rec === "Sell") return "bg-orange-500 text-white";
  if (rec === "Strong Sell") return "bg-red-600 text-white";
  return "bg-gray-500 text-white";
}

function confidenceColor(conf: Confidence): string {
  if (conf === "high") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  if (conf === "medium") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
}

interface AnalysisSummaryProps {
  analysis: StockAnalysis;
}

export function AnalysisSummary({ analysis }: AnalysisSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg">Overall Assessment — {analysis.ticker}</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${recommendationColor(analysis.overallRecommendation)}`}>
              {analysis.overallRecommendation}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${confidenceColor(analysis.confidence)}`}>
              {analysis.confidence.charAt(0).toUpperCase() + analysis.confidence.slice(1)} Confidence
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          {(["shortTerm", "mediumTerm", "longTerm"] as const).map((key) => {
            const labels = { shortTerm: "Short Term", mediumTerm: "Medium Term", longTerm: "Long Term" };
            const signal = analysis[key];
            return (
              <div key={key} className="text-center">
                <div className="text-xs text-muted-foreground mb-1">{labels[key]}</div>
                <Badge variant={signalBadgeVariant(signal)} className="capitalize">
                  {signal}
                </Badge>
              </div>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{analysis.executiveSummary}</p>
      </CardContent>
    </Card>
  );
}
