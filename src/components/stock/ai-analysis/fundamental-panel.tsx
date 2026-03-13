"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundamentalAnalysis } from "@/types/stock-analysis";

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v == null) return "N/A";
  return v.toFixed(decimals);
}

function prettyLabel(value: string): string {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function signalBadgeVariant(
  signal?: string | null
): "default" | "secondary" | "destructive" {
  if (!signal) return "secondary";
  const v = signal.toLowerCase();
  if (v.includes("bull") || v.includes("buy") || v.includes("strong")) return "default";
  if (v.includes("bear") || v.includes("sell") || v.includes("overvalued") || v.includes("weak")) return "destructive";
  return "secondary";
}

function recommendationBadgeVariant(
  recommendation?: string | null
): "default" | "secondary" | "destructive" {
  if (!recommendation) return "secondary";
  const v = recommendation.toLowerCase();
  if (v.includes("buy")) return "default";
  if (v.includes("sell")) return "destructive";
  return "secondary";
}

interface FundamentalPanelProps {
  fundamental: FundamentalAnalysis;
}

export function FundamentalPanel({ fundamental }: FundamentalPanelProps) {
  const { valuation, financialHealth, growth, analystConsensus, earnings } = fundamental;
  const totalAnalysts =
    (analystConsensus.breakdown.strongBuy ?? 0) +
    (analystConsensus.breakdown.buy ?? 0) +
    (analystConsensus.breakdown.hold ?? 0) +
    (analystConsensus.breakdown.sell ?? 0);

  const attributeEntries = Object.entries(fundamental.attributes ?? {}).filter(
    ([, value]) => value && typeof value === "object"
  );
  const hasEnhancedSchema = attributeEntries.length > 0;
  const ai = fundamental.aiAnalysis;
  const finalRecommendation = ai?.recommendation ?? fundamental.recommendation;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Fundamental Analysis</CardTitle>
          <Badge
            variant={hasEnhancedSchema ? recommendationBadgeVariant(finalRecommendation) : valuation.signal === "undervalued" ? "default" : valuation.signal === "overvalued" ? "destructive" : "secondary"}
            className="capitalize"
          >
            {hasEnhancedSchema ? finalRecommendation ?? "N/A" : valuation.signal.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        {hasEnhancedSchema && (
          <>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Overall Score</div>
                <div className="text-sm font-semibold">{fmt(ai?.overallScore)}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Confidence</div>
                <div className="text-sm font-semibold capitalize">{ai?.confidence ?? "N/A"}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">As Of</div>
                <div className="text-sm font-semibold">{fundamental.asOf ?? "N/A"}</div>
              </div>
            </div>

            {attributeEntries.map(([key, value]) => {
              const metrics = Object.entries((value.metrics ?? {}) as Record<string, string | number | null | string[]>);
              const items = Array.isArray(value.items) ? value.items : [];
              const label = prettyLabel(key);
              return (
                <div key={key} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-2">
                      {typeof value.score === "number" && <Badge variant="outline">Score {fmt(value.score, 1)}/10</Badge>}
                      <Badge variant={signalBadgeVariant(value.signal)} className="capitalize">
                        {value.signal ?? "neutral"}
                      </Badge>
                    </div>
                  </div>
                  {metrics.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {metrics.map(([metricKey, metricValue]) => (
                        <div key={metricKey}>
                          {prettyLabel(metricKey)}:{" "}
                          <span className="text-foreground font-medium">
                            {Array.isArray(metricValue)
                              ? metricValue.join(", ")
                              : typeof metricValue === "number"
                                ? fmt(metricValue)
                                : metricValue ?? "N/A"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {items.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {items.slice(0, 5).map((item, i) => (
                        <p key={`${key}-item-${i}`}>- {item}</p>
                      ))}
                    </div>
                  )}
                  {value.explanation && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{value.explanation}</p>
                  )}
                </div>
              );
            })}

            {ai && (
              <div className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">AI Analysis Output</span>
                  <Badge variant={recommendationBadgeVariant(ai.recommendation)}>{ai.recommendation ?? "N/A"}</Badge>
                </div>
                {ai.horizonView && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Short</span>: <span className="font-medium capitalize">{ai.horizonView.shortTerm ?? "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Medium</span>: <span className="font-medium capitalize">{ai.horizonView.mediumTerm ?? "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Long</span>: <span className="font-medium capitalize">{ai.horizonView.longTerm ?? "N/A"}</span>
                    </div>
                  </div>
                )}
                {Array.isArray(ai.keyDrivers) && ai.keyDrivers.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Key Drivers:</span> {ai.keyDrivers.join(" | ")}
                  </div>
                )}
                {ai.finalExplanation && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{ai.finalExplanation}</p>
                )}
              </div>
            )}

            {Array.isArray(fundamental.sources) && fundamental.sources.length > 0 && (
              <div className="rounded-md border p-3 space-y-2">
                <span className="font-medium text-muted-foreground">Sources</span>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {fundamental.sources.slice(0, 8).map((source, i) => (
                    <div key={`source-${i}`} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {source.url ? (
                          <a href={source.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                            {source.name ?? source.url}
                          </a>
                        ) : (
                          source.name ?? "Unknown source"
                        )}
                      </span>
                      <span className="shrink-0 capitalize">{source.quality ?? "N/A"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!hasEnhancedSchema && (
          <>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
