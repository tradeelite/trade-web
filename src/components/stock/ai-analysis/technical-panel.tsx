"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TechnicalAnalysis, SignalDirection } from "@/types/stock-analysis";

// ─── SVG Gauge (TradingView style) ───────────────────────────────────────────

function polarToXY(cx: number, cy: number, deg: number, r: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function donutArc(cx: number, cy: number, a1: number, a2: number, ro: number, ri: number) {
  const p1 = polarToXY(cx, cy, a1, ro);
  const p2 = polarToXY(cx, cy, a2, ro);
  const p3 = polarToXY(cx, cy, a2, ri);
  const p4 = polarToXY(cx, cy, a1, ri);
  const f = (n: number) => n.toFixed(2);
  return (
    `M ${f(p1.x)} ${f(p1.y)} A ${ro} ${ro} 0 0 1 ${f(p2.x)} ${f(p2.y)} ` +
    `L ${f(p3.x)} ${f(p3.y)} A ${ri} ${ri} 0 0 0 ${f(p4.x)} ${f(p4.y)} Z`
  );
}

const ZONE_COLORS = ["#dc2626", "#f97316", "#ca8a04", "#86efac", "#16a34a"];
const ZONE_ANGLES: [number, number][] = [[180, 144], [144, 108], [108, 72], [72, 36], [36, 0]];

function scoreFromCounts(buy: number, neutral: number, sell: number) {
  const total = buy + neutral + sell || 1;
  return (buy - sell) / total;
}

function scoreToLabel(score: number): { label: string; color: string } {
  if (score >= 0.6) return { label: "STRONG BUY", color: "#16a34a" };
  if (score >= 0.2) return { label: "BUY", color: "#22c55e" };
  if (score > -0.2) return { label: "NEUTRAL", color: "#ca8a04" };
  if (score > -0.6) return { label: "SELL", color: "#ea580c" };
  return { label: "STRONG SELL", color: "#dc2626" };
}

function Gauge({
  buy, neutral, sell, label, large = false,
}: {
  buy: number; neutral: number; sell: number; label: string; large?: boolean;
}) {
  const score = scoreFromCounts(buy, neutral, sell);
  const { label: sigLabel, color: sigColor } = scoreToLabel(score);
  const cx = 100, cy = 100, ro = 82, ri = 56;
  const needleAngle = 90 - score * 90;
  const tip = polarToXY(cx, cy, needleAngle, ri - 5);
  const f = (n: number) => n.toFixed(1);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 200 115" className={large ? "w-48 h-28" : "w-32 h-20"}>
        {ZONE_ANGLES.map(([a1, a2], i) => (
          <path key={i} d={donutArc(cx, cy, a1, a2, ro, ri)} fill={ZONE_COLORS[i]} />
        ))}
        {[144, 108, 72, 36].map((angle) => {
          const inner = polarToXY(cx, cy, angle, ri);
          const outer = polarToXY(cx, cy, angle, ro);
          return <line key={angle} x1={f(inner.x)} y1={f(inner.y)} x2={f(outer.x)} y2={f(outer.y)} stroke="white" strokeWidth={1.5} />;
        })}
        <line x1={cx} y1={cy} x2={f(tip.x)} y2={f(tip.y)} stroke="white" strokeWidth={large ? 2.5 : 2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={large ? 5 : 4} fill="white" stroke="#6b7280" strokeWidth={1.5} />
        <text x={cx} y={cy + (large ? 20 : 16)} textAnchor="middle" fill={sigColor} fontSize={large ? 11 : 9} fontWeight="700">{sigLabel}</text>
        <text x={cx} y={cy + (large ? 31 : 26)} textAnchor="middle" fill="#9ca3af" fontSize={large ? 8 : 7}>{`B:${buy} N:${neutral} S:${sell}`}</text>
      </svg>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined, d = 2): string {
  if (v == null) return "—";
  return v.toFixed(d);
}

function pct(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function pctFromPrice(price: number | null | undefined, ma: number | null | undefined): string {
  if (!price || !ma) return "—";
  return pct(((price - ma) / ma) * 100);
}

function MaBadge({ signal }: { signal: "Buy" | "Sell" | "Neutral" }) {
  const cls = signal === "Buy" ? "bg-green-600 text-white" : signal === "Sell" ? "bg-red-600 text-white" : "bg-gray-500 text-white";
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>{signal}</span>;
}

function OpinionBadge({ opinion }: { opinion: string }) {
  const o = opinion.toLowerCase();
  let cls = "bg-yellow-500 text-white";
  if (o.includes("strong buy")) cls = "bg-green-700 text-white";
  else if (o.includes("buy")) cls = "bg-green-500 text-white";
  else if (o.includes("strong sell")) cls = "bg-red-700 text-white";
  else if (o.includes("sell")) cls = "bg-red-500 text-white";
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${cls}`}>{opinion}</span>;
}

function SignalChip({ signal }: { signal: SignalDirection }) {
  const cls = signal === "bullish" ? "bg-green-600 text-white" : signal === "bearish" ? "bg-red-600 text-white" : "bg-yellow-500 text-white";
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold capitalize ${cls}`}>{signal}</span>;
}

function SignalCount({ buy, neutral, sell }: { buy: number; neutral: number; sell: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-green-600 font-semibold">Buy: {buy}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground font-semibold">Neutral: {neutral}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-red-500 font-semibold">Sell: {sell}</span>
    </div>
  );
}

// ─── Derive oscillator table rows ─────────────────────────────────────────────

function deriveOscRows(m: TechnicalAnalysis["momentum"], ts?: TechnicalAnalysis["trendStrength"]) {
  const rows: { name: string; value: string; signal: "Buy" | "Sell" | "Neutral"; explanation: string }[] = [];

  if (m.rsi != null) {
    const sig: "Buy" | "Sell" | "Neutral" = m.rsi < 30 ? "Buy" : m.rsi > 70 ? "Sell" : "Neutral";
    const status = m.rsiStatus ?? (m.rsi > 70 ? "Overbought" : m.rsi < 30 ? "Oversold" : "Neutral");
    const explanation = m.rsi < 30
      ? "Oversold territory — historically a mean-reversion buy zone"
      : m.rsi < 45
      ? "Recovering from weakness — early bullish momentum building"
      : m.rsi < 55
      ? "Neutral momentum — no directional edge"
      : m.rsi < 70
      ? "Healthy bullish momentum — trend strength confirmed"
      : "Overbought — stretched; watch for pullback or consolidation";
    rows.push({ name: "RSI (14)", value: `${fmt(m.rsi, 1)} — ${status}`, signal: sig, explanation });
  }
  if (m.rsiWeekly != null) {
    const sig: "Buy" | "Sell" | "Neutral" = m.rsiWeekly < 30 ? "Buy" : m.rsiWeekly > 70 ? "Sell" : "Neutral";
    const weeklyStatus = m.rsiWeekly > 70 ? "Overbought" : m.rsiWeekly < 30 ? "Oversold" : "Neutral";
    const explanation = m.rsiWeekly < 30
      ? "Weekly oversold — major support zone; high-conviction long-term buy signal"
      : m.rsiWeekly > 70
      ? "Weekly overbought — extended on longer timeframe; proceed with caution"
      : "Weekly RSI neutral — no extreme reading on the weekly chart";
    rows.push({ name: "RSI (14) Weekly", value: `${fmt(m.rsiWeekly, 1)} — ${weeklyStatus}`, signal: sig, explanation });
  }

  const macdStr = (m.macd ?? "").toLowerCase();
  const macdSig: "Buy" | "Sell" | "Neutral" = macdStr === "bullish" ? "Buy" : macdStr === "bearish" ? "Sell" : "Neutral";
  const hist = (m.macdHistogram ?? "").toLowerCase();
  const macdExplanation = macdSig === "Buy"
    ? `MACD above signal line${hist.includes("expand") ? " with expanding histogram" : ""} — upward momentum confirmed`
    : macdSig === "Sell"
    ? `MACD below signal line${hist.includes("contract") ? " with contracting histogram" : ""} — downward pressure building`
    : "MACD near signal line — no clear directional conviction";
  rows.push({ name: "MACD", value: `${m.macd ?? "—"}${m.macdHistogram ? ` (${m.macdHistogram})` : ""}`, signal: macdSig, explanation: macdExplanation });

  if (m.stochasticK != null) {
    const sig: "Buy" | "Sell" | "Neutral" = m.stochasticK < 20 ? "Buy" : m.stochasticK > 80 ? "Sell" : "Neutral";
    const status = m.stochasticStatus ?? (m.stochasticK > 80 ? "Overbought" : m.stochasticK < 20 ? "Oversold" : "Neutral");
    const explanation = m.stochasticK < 20
      ? "Stochastic deeply oversold — short-term reversal likely"
      : m.stochasticK > 80
      ? "Stochastic overbought — short-term pullback risk elevated"
      : "Stochastic neutral — momentum neither extreme nor committed";
    rows.push({ name: "Stochastic (14,3,3)", value: `${fmt(m.stochasticK, 1)} / ${fmt(m.stochasticD, 1)} — ${status}`, signal: sig, explanation });
  }

  if (ts?.adx != null) {
    const sig: "Buy" | "Sell" | "Neutral" = ts.adx > 25 ? (ts.diControl === "bulls" ? "Buy" : "Sell") : "Neutral";
    const strength = ts.adxStrength ?? "moderate";
    const explanation = ts.adx < 20
      ? "Weak trend — price likely in a range or choppy; signals less reliable"
      : ts.adx < 40
      ? `Moderate ${strength} trend — ${ts.diControl === "bulls" ? "bulls" : ts.diControl === "bears" ? "bears" : "neither side"} in control`
      : `Strong trend (ADX ${fmt(ts.adx, 1)}) — ${ts.diControl === "bulls" ? "bulls dominant, ride the trend" : "bears dominant, avoid longs"}`;
    rows.push({ name: "ADX (14)", value: `${fmt(ts.adx, 1)} — ${strength}`, signal: sig, explanation });
  }

  if (m.roc10d != null) {
    const sig: "Buy" | "Sell" | "Neutral" = m.roc10d > 0 ? "Buy" : m.roc10d < 0 ? "Sell" : "Neutral";
    const explanation = m.roc10d > 3
      ? "Strong positive momentum over 10 days — price accelerating upward"
      : m.roc10d > 0
      ? "Mild positive momentum — slight upward bias over 10 days"
      : m.roc10d < -3
      ? "Strong negative momentum over 10 days — price losing ground fast"
      : "Mild negative momentum — slight downward drift over 10 days";
    rows.push({ name: "ROC (10D)", value: pct(m.roc10d), signal: sig, explanation });
  }

  return rows;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TechnicalPanelProps {
  technical: TechnicalAnalysis;
}

export function TechnicalPanel({ technical: t }: TechnicalPanelProps) {
  const ma = t.movingAverages ?? [];
  const agg = t.aggregatedSignals;
  const ts = t.trendStrength;
  const price = t.snapshot?.currentPrice;

  const maBuy = ma.filter((r) => r.signal === "Buy").length;
  const maSell = ma.filter((r) => r.signal === "Sell").length;
  const maNeutral = ma.filter((r) => r.signal === "Neutral").length;

  const oscRows = deriveOscRows(t.momentum, ts);
  const oscBuy = oscRows.filter((r) => r.signal === "Buy").length;
  const oscSell = oscRows.filter((r) => r.signal === "Sell").length;
  const oscNeutral = oscRows.filter((r) => r.signal === "Neutral").length;

  const sumBuy = agg?.signalCount.buy ?? maBuy + oscBuy;
  const sumSell = agg?.signalCount.sell ?? maSell + oscSell;
  const sumNeutral = agg?.signalCount.neutral ?? maNeutral + oscNeutral;

  const stp = t.shortTermPrediction;
  const mtp = t.mediumTermPrediction;
  const ltp = t.longTermPrediction;

  return (
    <div className="space-y-4">

      {/* ── TradingView-style gauge row ─────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-end justify-around gap-4">
            <Gauge buy={oscBuy} neutral={oscNeutral} sell={oscSell} label="Oscillators" />
            <Gauge buy={sumBuy} neutral={sumNeutral} sell={sumSell} label="Summary" large />
            <Gauge buy={maBuy} neutral={maNeutral} sell={maSell} label="Moving Averages" />
          </div>

          {/* Barchart + TradingView opinions */}
          {(agg?.barchartOpinion || agg?.tradingViewRating) && (
            <div className="mt-4 pt-3 border-t flex items-center justify-center flex-wrap gap-5">
              {agg.barchartOpinion && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-medium">Barchart</span>
                  <OpinionBadge opinion={agg.barchartOpinion} />
                </div>
              )}
              {agg.tradingViewRating && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-medium">TradingView</span>
                  <OpinionBadge opinion={agg.tradingViewRating} />
                </div>
              )}
            </div>
          )}

          {/* Short / Medium / Long term */}
          <div className="mt-3 flex items-center justify-center gap-8">
            {(["shortTerm", "mediumTerm", "longTerm"] as const).map((key) => {
              const labels = { shortTerm: "Short Term", mediumTerm: "Medium Term", longTerm: "Long Term" };
              return (
                <div key={key} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{labels[key]}</div>
                  <SignalChip signal={t.signals[key]} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Barchart-style Moving Averages table ──────────────────────────────── */}
      {ma.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Moving Averages
              </CardTitle>
              <div className="flex items-center gap-3">
                <SignalCount buy={maBuy} neutral={maNeutral} sell={maSell} />
                {(t.trend.goldenCross || t.trend.deathCross) && (
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${t.trend.goldenCross ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"}`}>
                    {t.trend.goldenCross ? "Golden Cross" : "Death Cross"}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-1.5 font-medium">Indicator</th>
                  <th className="text-right py-1.5 font-medium">Period</th>
                  <th className="text-right py-1.5 font-medium">Value</th>
                  <th className="text-right py-1.5 font-medium hidden sm:table-cell">% From Price</th>
                  <th className="text-center py-1.5 font-medium">Signal</th>
                </tr>
              </thead>
              <tbody>
                {ma.map((row) => {
                  const isSMA = row.name.startsWith("SMA");
                  const period = row.name.replace(/^[SE]MA/, "").trim();
                  const diffPct = pctFromPrice(price, row.value);
                  const isAbove = row.priceVsMA === "above";
                  return (
                    <tr key={row.name} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-1.5">{isSMA ? "Simple MA" : "Exponential MA"}</td>
                      <td className="py-1.5 text-right text-muted-foreground">{period}</td>
                      <td className="py-1.5 text-right font-mono">${fmt(row.value)}</td>
                      <td className={`py-1.5 text-right font-medium hidden sm:table-cell ${isAbove ? "text-green-600" : "text-red-500"}`}>{diffPct}</td>
                      <td className="py-1.5 text-center"><MaBadge signal={row.signal} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* ── Barchart-style Oscillators table ─────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Oscillators
            </CardTitle>
            <SignalCount buy={oscBuy} neutral={oscNeutral} sell={oscSell} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-1.5 font-medium">Indicator</th>
                <th className="text-left py-1.5 font-medium hidden sm:table-cell">Value</th>
                <th className="text-center py-1.5 font-medium">Signal</th>
                <th className="text-right py-1.5 font-medium hidden lg:table-cell">Explanation</th>
              </tr>
            </thead>
            <tbody>
              {oscRows.map((row, i) => (
                <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-1.5">{row.name}</td>
                  <td className="py-1.5 text-muted-foreground hidden sm:table-cell">{row.value}</td>
                  <td className="py-1.5 text-center"><MaBadge signal={row.signal} /></td>
                  <td className="py-1.5 text-right text-xs text-muted-foreground hidden lg:table-cell max-w-[260px]">{row.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ── Trend + Relative Strength ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <SignalChip signal={t.trend.direction} />
              <Badge variant="outline" className="capitalize text-xs">{t.trend.strength}</Badge>
              {t.trend.chartPattern && t.trend.chartPattern !== "none" && (
                <Badge variant="secondary" className="text-xs">{t.trend.chartPattern}</Badge>
              )}
            </div>
            <p className="text-muted-foreground leading-relaxed">{t.trend.detail}</p>
            <div className="flex gap-4 pt-1">
              <span><span className="text-muted-foreground">Support </span><span className="font-medium text-green-600">${fmt(t.supportResistance.support)}</span></span>
              <span><span className="text-muted-foreground">Resistance </span><span className="font-medium text-red-500">${fmt(t.supportResistance.resistance)}</span></span>
            </div>
          </CardContent>
        </Card>

        {ts ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Relative Strength vs S&P 500</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1.5 text-xs">
              {(["relativeStrength1M", "relativeStrength3M", "relativeStrength6M"] as const).map((key) => {
                const labels = { relativeStrength1M: "1 Month", relativeStrength3M: "3 Months", relativeStrength6M: "6 Months" };
                const val = ts[key] ?? "—";
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{labels[key]}</span>
                    <span className={`rounded px-2 py-0.5 font-medium text-xs ${val === "outperforming" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : val === "underperforming" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
                      {val}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : (
          /* Snapshot fallback when no trendStrength */
          t.snapshot && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Relative Volume</span><span className="font-medium">{fmt(t.snapshot.relativeVolume)}x</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">vs 52w High</span><span className={`font-medium ${(t.snapshot.distanceFrom52wHigh ?? 0) < 0 ? "text-red-500" : "text-green-600"}`}>{pct(t.snapshot.distanceFrom52wHigh)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">vs 200 SMA</span><span className={`font-medium ${(t.snapshot.distanceFrom200SMA ?? 0) >= 0 ? "text-green-600" : "text-red-500"}`}>{pct(t.snapshot.distanceFrom200SMA)}</span></div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* ── Volume + Volatility ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Volume & Accumulation</CardTitle>
              <SignalChip signal={t.volume.signal} />
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Relative Volume</span><span className="font-medium">{fmt(t.volume.relativeVolume)}x</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Trend</span><span className="font-medium capitalize">{t.volume.trend}</span></div>
            {t.volume.obv && (
              <div className="flex justify-between"><span className="text-muted-foreground">OBV</span><span className={`font-medium capitalize ${t.volume.obv === "rising" ? "text-green-600" : t.volume.obv === "falling" ? "text-red-500" : ""}`}>{t.volume.obv}</span></div>
            )}
            {t.volume.vwap != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">VWAP</span>
                <span className="font-medium">${fmt(t.volume.vwap)} <span className={t.volume.priceVsVWAP === "above" ? "text-green-600" : "text-red-500"}>({t.volume.priceVsVWAP})</span></span>
              </div>
            )}
            {t.volume.accDistribution && (
              <div className="flex justify-between"><span className="text-muted-foreground">Acc/Dist</span><span className={`font-medium ${t.volume.accDistribution.includes("buying") ? "text-green-600" : t.volume.accDistribution.includes("selling") ? "text-red-500" : ""}`}>{t.volume.accDistribution}</span></div>
            )}
            {t.volume.volumeConfirms != null && (
              <div className="flex justify-between"><span className="text-muted-foreground">Confirms Price</span><span className={t.volume.volumeConfirms ? "text-green-600 font-medium" : "text-red-500 font-medium"}>{t.volume.volumeConfirms ? "Yes ✓" : "No ✗"}</span></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Volatility</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1.5 text-xs">
            {t.volatility ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bollinger Bands</span>
                  <span className="font-medium capitalize">{t.volatility.bollingerPosition}{t.volatility.bollingerBandwidth && <span className="text-muted-foreground"> ({t.volatility.bollingerBandwidth})</span>}</span>
                </div>
                {t.volatility.atr != null && <div className="flex justify-between"><span className="text-muted-foreground">ATR (14)</span><span className="font-medium">${fmt(t.volatility.atr)}{t.volatility.atrPercent != null && ` (${fmt(t.volatility.atrPercent, 1)}%)`}</span></div>}
                {t.volatility.beta != null && <div className="flex justify-between"><span className="text-muted-foreground">Beta</span><span className="font-medium">{fmt(t.volatility.beta)}</span></div>}
                {t.volatility.iv && t.volatility.iv !== "N/A" && <div className="flex justify-between"><span className="text-muted-foreground">Impl. Volatility</span><span className={`font-medium capitalize ${t.volatility.iv === "elevated" ? "text-orange-500" : t.volatility.iv === "depressed" ? "text-blue-400" : ""}`}>{t.volatility.iv}</span></div>}
              </>
            ) : (
              <div className="flex justify-between"><span className="text-muted-foreground">Bollinger Position</span><span className="font-medium capitalize">{t.momentum.bollingerPosition}</span></div>
            )}
            {t.snapshot && (
              <>
                <div className="h-px bg-border/40 my-1" />
                {t.snapshot.distanceFrom52wHigh != null && <div className="flex justify-between"><span className="text-muted-foreground">vs 52w High</span><span className={`font-medium ${(t.snapshot.distanceFrom52wHigh ?? 0) < 0 ? "text-red-500" : "text-green-600"}`}>{pct(t.snapshot.distanceFrom52wHigh)}</span></div>}
                {t.snapshot.distanceFrom200SMA != null && <div className="flex justify-between"><span className="text-muted-foreground">vs 200 SMA</span><span className={`font-medium ${(t.snapshot.distanceFrom200SMA ?? 0) >= 0 ? "text-green-600" : "text-red-500"}`}>{pct(t.snapshot.distanceFrom200SMA)}</span></div>}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Predictions ───────────────────────────────────────────────────────── */}
      {(stp || mtp || ltp) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Predictions & Outlook</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {stp && (
              <div className="rounded-lg border border-border/60 p-3 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-muted-foreground">SHORT-TERM (1–10 days)</span>
                  <div className="flex items-center gap-2"><SignalChip signal={stp.bias} /><Badge variant="outline" className="text-xs capitalize">{stp.confidence} confidence</Badge></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div><span className="block text-muted-foreground">Entry Zone</span><span className="font-medium">{stp.entryZone ?? "—"}</span></div>
                  <div><span className="block text-muted-foreground">Target</span><span className="font-medium text-green-600">${fmt(stp.target)}</span></div>
                  <div><span className="block text-muted-foreground">Stop Loss</span><span className="font-medium text-red-500">${fmt(stp.stop)}</span></div>
                  <div><span className="block text-muted-foreground">Risk / Reward</span><span className="font-medium">{stp.riskReward ?? "—"}</span></div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{stp.reasoning}</p>
              </div>
            )}
            {mtp && (
              <div className="rounded-lg border border-border/60 p-3 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-muted-foreground">MEDIUM-TERM (2 weeks – 3 months)</span>
                  <div className="flex items-center gap-2"><SignalChip signal={mtp.bias} /><Badge variant="outline" className="text-xs capitalize">{mtp.confidence} confidence</Badge></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {mtp.keyLevel != null && <div><span className="block text-muted-foreground">Key Level</span><span className="font-medium">${fmt(mtp.keyLevel)}</span></div>}
                  <div><span className="block text-muted-foreground">Target Range</span><span className="font-medium text-green-600">{mtp.targetRange ?? "—"}</span></div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{mtp.reasoning}</p>
              </div>
            )}
            {ltp && (
              <div className="rounded-lg border border-border/60 p-3 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-muted-foreground">LONG-TERM (3–12 months)</span>
                  <div className="flex items-center gap-2"><SignalChip signal={ltp.bias} /><Badge variant="outline" className="text-xs capitalize">{ltp.confidence} confidence</Badge></div>
                </div>
                <div className="text-xs"><span className="text-muted-foreground">Target Zone: </span><span className="font-medium text-green-600">{ltp.targetZone ?? "—"}</span></div>
                <p className="text-xs text-muted-foreground leading-relaxed">{ltp.reasoning}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Key Risks ─────────────────────────────────────────────────────────── */}
      {t.risks && t.risks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Key Risks & Watchouts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1.5">
              {t.risks.map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-orange-500 shrink-0 mt-0.5">▲</span>{risk}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Summary + Recommendation ──────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Technical Recommendation</span>
            <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold ${t.recommendation === "Buy" ? "bg-green-600 text-white" : t.recommendation === "Sell" ? "bg-red-600 text-white" : t.recommendation === "Watch" ? "bg-blue-500 text-white" : "bg-yellow-500 text-white"}`}>
              {t.recommendation}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{t.summary}</p>
        </CardContent>
      </Card>
    </div>
  );
}
