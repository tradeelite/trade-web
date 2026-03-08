"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundamentalAnalysis } from "@/types/stock-analysis";

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v == null) return "N/A";
  return v.toFixed(decimals);
}

interface FundamentalPanelProps {
  fundamental: FundamentalAnalysis;
}

export function FundamentalPanel({ fundamental }: FundamentalPanelProps) {
  const { valuation, financialHealth, growth, analystConsensus, earnings } = fundamental;
  const totalAnalysts = (analystConsensus.breakdown.strongBuy ?? 0) + (analystConsensus.breakdown.buy ?? 0) + (analystConsensus.breakdown.hold ?? 0) + (analystConsensus.breakdown.sell ?? 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Fundamental Analysis</CardTitle>
          <Badge variant={valuation.signal === "undervalued" ? "default" : valuation.signal === "overvalued" ? "destructive" : "secondary"} className="capitalize">
            {valuation.signal.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Valuation metrics */}
        <div>
          <span className="font-medium text-muted-foreground">Valuation</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-xs">
            <div>P/E: <span className="font-medium">{fmt(valuation.peRatio)}</span></div>
            <div>Fwd P/E: <span className="font-medium">{fmt(valuation.forwardPE)}</span></div>
            <div>PEG: <span className="font-medium">{fmt(valuation.pegRatio)}</span></div>
            <div>P/B: <span className="font-medium">{fmt(valuation.priceToBook)}</span></div>
          </div>
        </div>

        {/* Financial health */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-muted-foreground">Financial Health</span>
            <Badge variant={financialHealth.signal === "strong" ? "default" : financialHealth.signal === "weak" ? "destructive" : "secondary"} className="capitalize">
              {financialHealth.signal}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div>D/E: <span className="text-foreground font-medium">{fmt(financialHealth.debtToEquity)}</span></div>
            <div>Current: <span className="text-foreground font-medium">{fmt(financialHealth.currentRatio)}</span></div>
            <div>Op Margin: <span className="text-foreground font-medium">{financialHealth.operatingMargin || "N/A"}</span></div>
            <div>ROE: <span className="text-foreground font-medium">{financialHealth.returnOnEquity || "N/A"}</span></div>
          </div>
        </div>

        {/* Growth */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-muted-foreground">Growth</span>
            <Badge variant={growth.signal === "strong" ? "default" : growth.signal === "weak" ? "destructive" : "secondary"} className="capitalize">
              {growth.signal}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div>Rev Growth: <span className="text-foreground font-medium">{growth.revenueGrowth || "N/A"}</span></div>
            <div>EPS TTM: <span className="text-foreground font-medium">${fmt(growth.epsTTM)}</span></div>
          </div>
        </div>

        {/* Analyst consensus */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-muted-foreground">Analyst Consensus</span>
            <Badge variant="outline">{analystConsensus.rating}</Badge>
          </div>
          <div className="text-xs text-muted-foreground mb-2">
            Target: <span className="text-foreground font-medium">${fmt(analystConsensus.targetPrice)}</span>
            {" · "}{analystConsensus.numAnalysts} analysts
          </div>
          {totalAnalysts > 0 && (
            <div className="flex rounded-full overflow-hidden h-2">
              {analystConsensus.breakdown.strongBuy > 0 && (
                <div className="bg-green-600" style={{ width: `${(analystConsensus.breakdown.strongBuy / totalAnalysts) * 100}%` }} title={`Strong Buy: ${analystConsensus.breakdown.strongBuy}`} />
              )}
              {analystConsensus.breakdown.buy > 0 && (
                <div className="bg-green-400" style={{ width: `${(analystConsensus.breakdown.buy / totalAnalysts) * 100}%` }} title={`Buy: ${analystConsensus.breakdown.buy}`} />
              )}
              {analystConsensus.breakdown.hold > 0 && (
                <div className="bg-yellow-400" style={{ width: `${(analystConsensus.breakdown.hold / totalAnalysts) * 100}%` }} title={`Hold: ${analystConsensus.breakdown.hold}`} />
              )}
              {analystConsensus.breakdown.sell > 0 && (
                <div className="bg-red-500" style={{ width: `${(analystConsensus.breakdown.sell / totalAnalysts) * 100}%` }} title={`Sell: ${analystConsensus.breakdown.sell}`} />
              )}
            </div>
          )}
        </div>

        {/* Earnings */}
        {earnings.lastQuarters.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-muted-foreground">Earnings</span>
              <Badge variant={earnings.trend === "beating" ? "default" : earnings.trend === "missing" ? "destructive" : "secondary"} className="capitalize">
                {earnings.trend}
              </Badge>
            </div>
            <div className="text-xs space-y-1">
              <div className="grid grid-cols-4 text-muted-foreground font-medium mb-1">
                <span>Quarter</span><span>Est.</span><span>Actual</span><span>Surp.</span>
              </div>
              {earnings.lastQuarters.slice(0, 4).map((q, i) => (
                <div key={i} className="grid grid-cols-4 text-muted-foreground">
                  <span className="truncate">{q.date}</span>
                  <span>${fmt(q.estimated)}</span>
                  <span className={q.actual != null && q.estimated != null && q.actual >= q.estimated ? "text-green-500" : "text-red-500"}>${fmt(q.actual)}</span>
                  <span className={q.surprisePercent != null && q.surprisePercent >= 0 ? "text-green-500" : "text-red-500"}>
                    {q.surprisePercent != null ? `${q.surprisePercent > 0 ? "+" : ""}${fmt(q.surprisePercent)}%` : "N/A"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div className="flex items-center justify-between pt-1 border-t">
          <span className="font-medium text-muted-foreground">Recommendation</span>
          <Badge variant={fundamental.recommendation === "Buy" ? "default" : fundamental.recommendation === "Sell" ? "destructive" : "secondary"}>
            {fundamental.recommendation}
          </Badge>
        </div>

        {/* Summary */}
        <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t">{fundamental.summary}</p>
      </CardContent>
    </Card>
  );
}
