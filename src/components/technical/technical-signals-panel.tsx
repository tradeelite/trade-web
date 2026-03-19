"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";
import { SectionJumpBar } from "@/components/ui/section-jump-bar";

const TA_SECTIONS = [
  { id: "ta-summary", label: "Summary" },
  { id: "ta-moving-averages", label: "Moving Averages" },
  { id: "ta-oscillators", label: "Oscillators" },
  { id: "ta-volume", label: "Volume & Volatility" },
  { id: "ta-trend", label: "Trend Strength" },
  { id: "ta-levels", label: "Key Levels" },
  { id: "ta-market-context", label: "VIX" },
  { id: "ta-relative-strength", label: "vs S&P 500" },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface MaRow {
  name: string;
  period: number;
  type: string;
  value: number | null;
  priceVsMA: "above" | "below";
  direction: "up" | "down" | "flat";
  signal: "Buy" | "Sell" | "Neutral";
  pctFromPrice: number | null;
}

interface OscRow {
  name: string;
  signal: "Buy" | "Sell" | "Neutral";
  value?: number | null;
  status?: string;
  k?: number | null;
  d?: number | null;
  macdLine?: number | null;
  signalLine?: number | null;
  histogram?: number | null;
  histogramDirection?: string;
  crossover?: string | null;
  adx?: number | null;
  plusDI?: number | null;
  minusDI?: number | null;
  strength?: string;
  diControl?: string;
  percentB?: number | null;
  position?: string;
  trend?: string;
  levels?: { oversold: number; overbought: number };
}

interface Composite {
  score: number;
  rawScore: number;
  label: string;
  buy: number;
  neutral: number;
  sell: number;
  movingAverages: { buy: number; neutral: number; sell: number };
  oscillators: { buy: number; neutral: number; sell: number };
}

interface TechnicalSignals {
  ticker: string;
  price: number;
  changePercent: number | null;
  generatedAt: string;
  composite: Composite;
  movingAverages: MaRow[];
  oscillators: OscRow[];
  volume: {
    today: number;
    avg20d: number;
    relativeVolume: number | null;
    signal: "Buy" | "Sell" | "Neutral";
  };
  volatility: {
    atr: { value: number | null; percent: number | null };
    bollingerBands: {
      upper: number | null;
      middle: number | null;
      lower: number | null;
      percentB: number | null;
      position: string;
      bandwidthTrend: string;
    };
  };
  trendStrength: {
    adx: number | null;
    plusDI: number | null;
    minusDI: number | null;
    strength: string;
    diControl: string;
    relativeStrength1M?: number | null;
    relativeStrength3M?: number | null;
    relativeStrength6M?: number | null;
  };
  supportResistance?: {
    support: number | null;
    resistance: number | null;
    support2?: number | null;
    resistance2?: number | null;
  };
  marketContext?: {
    vix?: {
      value: number | null;
      changePercent: number | null;
      status: "complacent" | "normal" | "elevated";
      signal: "Buy" | "Sell" | "Neutral";
    };
  };
  snapshot: {
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
    distanceFrom52wHigh: number | null;
    distanceFrom52wLow: number | null;
    distanceFrom200SMA: number | null;
    goldenCross: boolean;
    deathCross: boolean;
    crossDate: string | null;
  };
}

// ─── SVG Gauge ────────────────────────────────────────────────────────────────

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

function scoreToLabel(score: number): { label: string; color: string } {
  if (score >= 0.5) return { label: "STRONG BUY", color: "#16a34a" };
  if (score >= 0.1) return { label: "BUY", color: "#22c55e" };
  if (score > -0.1) return { label: "NEUTRAL", color: "#ca8a04" };
  if (score > -0.5) return { label: "SELL", color: "#ea580c" };
  return { label: "STRONG SELL", color: "#dc2626" };
}

function Gauge({
  buy, neutral, sell, label, large = false, rawScore,
}: {
  buy: number; neutral: number; sell: number; label: string; large?: boolean; rawScore: number;
}) {
  const { label: sigLabel, color: sigColor } = scoreToLabel(rawScore);
  const cx = 100, cy = 100, ro = 82, ri = 56;
  const needleAngle = 90 - rawScore * 90;
  const tip = polarToXY(cx, cy, needleAngle, ri - 5);
  const f = (n: number) => n.toFixed(1);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 200 115" className={large ? "w-52 h-32" : "w-36 h-24"}>
        {ZONE_ANGLES.map(([a1, a2], i) => (
          <path key={i} d={donutArc(cx, cy, a1, a2, ro, ri)} fill={ZONE_COLORS[i]} />
        ))}
        {[144, 108, 72, 36].map((angle) => {
          const inner = polarToXY(cx, cy, angle, ri);
          const outer = polarToXY(cx, cy, angle, ro);
          return (
            <line key={angle}
              x1={f(inner.x)} y1={f(inner.y)} x2={f(outer.x)} y2={f(outer.y)}
              stroke="white" strokeWidth={1.5}
            />
          );
        })}
        <line x1={cx} y1={cy} x2={f(tip.x)} y2={f(tip.y)}
          stroke="white" strokeWidth={large ? 2.5 : 2} strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={large ? 5 : 4} fill="white" stroke="#6b7280" strokeWidth={1.5} />
        <text x={cx} y={cy + (large ? 20 : 16)} textAnchor="middle" fill={sigColor}
          fontSize={large ? 11 : 9} fontWeight="700">{sigLabel}</text>
        <text x={cx} y={cy + (large ? 31 : 26)} textAnchor="middle" fill="#9ca3af"
          fontSize={large ? 8 : 7}>{`B:${buy} N:${neutral} S:${sell}`}</text>
      </svg>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined, d = 2): string {
  if (v == null) return "—";
  return v.toFixed(d);
}

function pct(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function SignalBadge({ signal }: { signal: "Buy" | "Sell" | "Neutral" }) {
  const cls =
    signal === "Buy" ? "bg-green-600 text-white"
    : signal === "Sell" ? "bg-red-600 text-white"
    : "bg-gray-500 text-white";
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {signal}
    </span>
  );
}

function DirectionIcon({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "up") return <TrendingUp className="h-3 w-3 text-green-500" />;
  if (dir === "down") return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

function oscDisplayValue(osc: OscRow): string {
  if (osc.name.startsWith("RSI")) return fmt(osc.value, 1);
  if (osc.name.startsWith("MACD")) return fmt(osc.macdLine);
  if (osc.name.startsWith("Stoch")) return `K:${fmt(osc.k, 1)} D:${fmt(osc.d, 1)}`;
  if (osc.name.startsWith("Williams")) return fmt(osc.value, 1);
  if (osc.name.startsWith("Bollinger")) return `%B:${fmt(osc.percentB, 2)}`;
  if (osc.name.startsWith("ADX")) return `${fmt(osc.adx, 1)} (+${fmt(osc.plusDI, 1)} / -${fmt(osc.minusDI, 1)})`;
  if (osc.name === "OBV") return osc.trend ?? "—";
  if (osc.name === "Ichimoku Cloud") return osc.status ?? "—";
  if (osc.name.startsWith("ROC")) return osc.value != null ? `${osc.value >= 0 ? "+" : ""}${fmt(osc.value, 2)}%` : "—";
  if (osc.name === "Acc/Distribution") return osc.trend ?? "—";
  return "—";
}

function oscDetail(osc: OscRow): string | null {
  if (osc.name.startsWith("RSI") && osc.status && osc.status !== "neutral") return osc.status;
  if (osc.name.startsWith("MACD")) {
    const parts = [];
    if (osc.crossover) parts.push(osc.crossover + " cross");
    if (osc.histogramDirection && osc.histogramDirection !== "flat") parts.push("hist " + osc.histogramDirection);
    return parts.join(", ") || null;
  }
  if (osc.name.startsWith("Stoch") && osc.status && osc.status !== "neutral") return osc.status;
  if (osc.name.startsWith("Bollinger") && osc.position) return "at " + osc.position + " band";
  if (osc.name.startsWith("ADX")) return osc.strength + " trend · " + osc.diControl + " in control";
  if (osc.name === "Ichimoku Cloud" && osc.trend) return osc.trend;
  return null;
}

async function fetchTechnicalSignals(ticker: string): Promise<TechnicalSignals> {
  const res = await fetch(`/api/stocks/${ticker}/technical-signals`);
  if (!res.ok) throw new Error("Failed to fetch technical signals");
  return res.json();
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TechnicalSignalsPanel({ ticker }: { ticker: string }) {
  const { data, isLoading, isError, error } = useQuery<TechnicalSignals>({
    queryKey: QUERY_KEYS.stockTechnicalSignals(ticker),
    queryFn: () => fetchTechnicalSignals(ticker),
    staleTime: STALE_TIMES.TECHNICAL_SIGNALS,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{(error as Error)?.message ?? "Failed to load technical signals"}</span>
      </div>
    );
  }

  const { composite, movingAverages, oscillators, volume, volatility, trendStrength, snapshot } = data;
  const levels = data.supportResistance;
  const vix = data.marketContext?.vix;
  const maOsc = composite.movingAverages;
  const oscComp = composite.oscillators;

  return (
    <div className="space-y-4">

      <SectionJumpBar sections={TA_SECTIONS} />

      {/* ── Gauge Row ──────────────────────────────────────────────────────── */}
      <div id="ta-summary" className="scroll-mt-32 rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <Gauge
            buy={maOsc.buy} neutral={maOsc.neutral} sell={maOsc.sell}
            label="Moving Averages"
            rawScore={(maOsc.buy - maOsc.sell) / (maOsc.buy + maOsc.neutral + maOsc.sell || 1)}
          />
          <Gauge
            buy={composite.buy} neutral={composite.neutral} sell={composite.sell}
            label="Summary"
            large
            rawScore={composite.rawScore}
          />
          <Gauge
            buy={oscComp.buy} neutral={oscComp.neutral} sell={oscComp.sell}
            label="Oscillators"
            rawScore={(oscComp.buy - oscComp.sell) / (oscComp.buy + oscComp.neutral + oscComp.sell || 1)}
          />
        </div>

        {/* Snapshot badges */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          {snapshot.goldenCross && (
            <span className="rounded-full bg-green-600/15 px-2.5 py-0.5 font-semibold text-green-500">
              Golden Cross {snapshot.crossDate ? `(${snapshot.crossDate})` : ""}
            </span>
          )}
          {snapshot.deathCross && (
            <span className="rounded-full bg-red-600/15 px-2.5 py-0.5 font-semibold text-red-500">
              Death Cross {snapshot.crossDate ? `(${snapshot.crossDate})` : ""}
            </span>
          )}
          {snapshot.distanceFrom52wHigh != null && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">
              52w High: <span className={snapshot.distanceFrom52wHigh < 0 ? "text-red-400" : "text-green-400"}>
                {pct(snapshot.distanceFrom52wHigh)}
              </span>
            </span>
          )}
          {snapshot.distanceFrom52wLow != null && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">
              52w Low: <span className="text-green-400">+{snapshot.distanceFrom52wLow?.toFixed(1)}%</span>
            </span>
          )}
          {snapshot.distanceFrom200SMA != null && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">
              200 SMA: <span className={snapshot.distanceFrom200SMA < 0 ? "text-red-400" : "text-green-400"}>
                {pct(snapshot.distanceFrom200SMA)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ── Moving Averages Table ─────────────────────────────────────────── */}
      <div id="ta-moving-averages" className="scroll-mt-32 rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <h3 className="text-sm font-semibold">Moving Averages</h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-500 font-semibold">B:{maOsc.buy}</span>
            <span className="text-muted-foreground">N:{maOsc.neutral}</span>
            <span className="text-red-500 font-semibold">S:{maOsc.sell}</span>
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Indicator</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Value</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">% From Price</th>
              <th className="px-4 py-2 text-center font-medium text-muted-foreground">Dir</th>
              <th className="px-4 py-2 text-center font-medium text-muted-foreground">Signal</th>
            </tr>
          </thead>
          <tbody>
            {movingAverages.map((ma, i) => (
              <tr key={ma.name} className={`border-b border-border/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                <td className="px-4 py-2 font-medium">{ma.name}</td>
                <td className="px-4 py-2 text-right font-mono">{fmt(ma.value)}</td>
                <td className={`px-4 py-2 text-right font-mono ${
                  ma.pctFromPrice == null ? "text-muted-foreground"
                  : ma.pctFromPrice > 0 ? "text-green-500" : "text-red-500"
                }`}>
                  {ma.pctFromPrice != null ? `${ma.pctFromPrice > 0 ? "+" : ""}${ma.pctFromPrice.toFixed(2)}%` : "—"}
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex justify-center"><DirectionIcon dir={ma.direction} /></div>
                </td>
                <td className="px-4 py-2 text-center">
                  <SignalBadge signal={ma.signal} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Oscillators Table ─────────────────────────────────────────────── */}
      <div id="ta-oscillators" className="scroll-mt-32 rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <h3 className="text-sm font-semibold">Oscillators &amp; Trend</h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-500 font-semibold">B:{oscComp.buy}</span>
            <span className="text-muted-foreground">N:{oscComp.neutral}</span>
            <span className="text-red-500 font-semibold">S:{oscComp.sell}</span>
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Indicator</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Value</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Detail</th>
              <th className="px-4 py-2 text-center font-medium text-muted-foreground">Signal</th>
            </tr>
          </thead>
          <tbody>
            {oscillators.map((osc, i) => (
              <tr key={osc.name} className={`border-b border-border/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                <td className="px-4 py-2 font-medium">{osc.name}</td>
                <td className="px-4 py-2 text-right font-mono">{oscDisplayValue(osc)}</td>
                <td className="px-4 py-2 text-muted-foreground capitalize">{oscDetail(osc) ?? "—"}</td>
                <td className="px-4 py-2 text-center">
                  <SignalBadge signal={osc.signal} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Volume & Volatility row ────────────────────────────────────────── */}
      <div id="ta-volume" className="scroll-mt-32 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Volume */}
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Volume</h3>
            <SignalBadge signal={volume.signal} />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Today</dt>
            <dd className="text-right font-mono">{volume.today.toLocaleString()}</dd>
            <dt className="text-muted-foreground">20d Avg</dt>
            <dd className="text-right font-mono">{volume.avg20d.toLocaleString()}</dd>
            <dt className="text-muted-foreground">Relative Vol</dt>
            <dd className={`text-right font-mono font-semibold ${
              volume.relativeVolume == null ? "" : volume.relativeVolume > 1.2 ? "text-green-500" : volume.relativeVolume < 0.7 ? "text-red-500" : ""
            }`}>
              {volume.relativeVolume != null ? `${volume.relativeVolume.toFixed(2)}x` : "—"}
            </dd>
          </dl>
        </div>

        {/* Volatility */}
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold">Volatility</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <dt className="text-muted-foreground">ATR (14)</dt>
            <dd className="text-right font-mono">
              {volatility.atr.value != null ? `$${volatility.atr.value.toFixed(2)}` : "—"}
              {volatility.atr.percent != null ? ` (${volatility.atr.percent.toFixed(1)}%)` : ""}
            </dd>
            <dt className="text-muted-foreground">BB Upper</dt>
            <dd className="text-right font-mono">{fmt(volatility.bollingerBands.upper)}</dd>
            <dt className="text-muted-foreground">BB Middle</dt>
            <dd className="text-right font-mono">{fmt(volatility.bollingerBands.middle)}</dd>
            <dt className="text-muted-foreground">BB Lower</dt>
            <dd className="text-right font-mono">{fmt(volatility.bollingerBands.lower)}</dd>
            <dt className="text-muted-foreground">Position</dt>
            <dd className="text-right capitalize text-muted-foreground">{volatility.bollingerBands.position}</dd>
            <dt className="text-muted-foreground">BW Trend</dt>
            <dd className="text-right capitalize text-muted-foreground">{volatility.bollingerBands.bandwidthTrend}</dd>
          </dl>
        </div>
      </div>

      {/* ── Trend Strength (ADX) ──────────────────────────────────────────── */}
      <div id="ta-trend" className="scroll-mt-32 rounded-xl border border-border/60 bg-card p-4 space-y-2">
        <h3 className="text-sm font-semibold">Trend Strength (ADX)</h3>
        <div className="flex flex-wrap gap-6 text-xs">
          <div>
            <div className="text-muted-foreground mb-0.5">ADX</div>
            <div className="font-mono font-semibold text-base">{fmt(trendStrength.adx, 1)}</div>
            <div className="capitalize text-muted-foreground">{trendStrength.strength}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5">+DI</div>
            <div className="font-mono font-semibold text-base text-green-500">{fmt(trendStrength.plusDI, 1)}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5">-DI</div>
            <div className="font-mono font-semibold text-base text-red-500">{fmt(trendStrength.minusDI, 1)}</div>
          </div>
          <div className="flex items-end">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              trendStrength.diControl === "bulls" ? "bg-green-600/15 text-green-500"
              : trendStrength.diControl === "bears" ? "bg-red-600/15 text-red-500"
              : "bg-muted text-muted-foreground"
            }`}>
              {trendStrength.diControl === "bulls" ? "Bulls in control"
               : trendStrength.diControl === "bears" ? "Bears in control"
               : "Neutral"}
            </span>
          </div>
        </div>

        {/* ADX bar */}
        {trendStrength.adx != null && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>0 Weak</span><span>25 Moderate</span><span>40 Strong</span><span>60+</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  trendStrength.strength === "strong" ? "bg-green-500"
                  : trendStrength.strength === "moderate" ? "bg-yellow-500"
                  : "bg-gray-500"
                }`}
                style={{ width: `${Math.min(trendStrength.adx / 60, 1) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Key Support / Resistance ─────────────────────────────────────── */}
      {levels && (levels.support != null || levels.resistance != null || levels.support2 != null || levels.resistance2 != null) && (
        <div id="ta-levels" className="scroll-mt-32 rounded-xl border border-border/60 bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">Support &amp; Resistance Levels</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-muted-foreground">Support (20D)</p>
              <p className="mt-1 font-mono font-semibold text-green-500">
                {levels.support != null ? `$${levels.support.toFixed(2)}` : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-muted-foreground">Resistance (20D)</p>
              <p className="mt-1 font-mono font-semibold text-red-500">
                {levels.resistance != null ? `$${levels.resistance.toFixed(2)}` : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-muted-foreground">Support (50D)</p>
              <p className="mt-1 font-mono font-semibold text-green-500">
                {levels.support2 != null ? `$${levels.support2.toFixed(2)}` : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-muted-foreground">Resistance (50D)</p>
              <p className="mt-1 font-mono font-semibold text-red-500">
                {levels.resistance2 != null ? `$${levels.resistance2.toFixed(2)}` : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Market Context: VIX ──────────────────────────────────────────── */}
      {vix && (
        <div id="ta-market-context" className="scroll-mt-32 rounded-xl border border-border/60 bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold">Market Volatility (VIX)</h3>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-muted-foreground">VIX</span>
            <span className="font-mono font-semibold text-base">{vix.value != null ? vix.value.toFixed(2) : "—"}</span>
            <span className={`font-mono ${vix.changePercent != null && vix.changePercent >= 0 ? "text-red-500" : "text-green-500"}`}>
              {vix.changePercent != null ? `${vix.changePercent >= 0 ? "+" : ""}${vix.changePercent.toFixed(2)}%` : "—"}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 capitalize text-muted-foreground">{vix.status}</span>
            <SignalBadge signal={vix.signal} />
          </div>
          <p className="text-xs text-muted-foreground">
            VIX above 25 indicates elevated market stress; below 15 often signals calm risk appetite.
          </p>
        </div>
      )}

      {/* ── Relative Strength vs S&P 500 ──────────────────────────────────── */}
      {(trendStrength.relativeStrength1M != null || trendStrength.relativeStrength3M != null || trendStrength.relativeStrength6M != null) && (
        <div id="ta-relative-strength" className="scroll-mt-32 rounded-xl border border-border/60 bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold">Relative Strength vs S&P 500</h3>
          <div className="flex flex-wrap gap-6 text-xs">
            {([
              ["1 Month", trendStrength.relativeStrength1M],
              ["3 Months", trendStrength.relativeStrength3M],
              ["6 Months", trendStrength.relativeStrength6M],
            ] as [string, number | null | undefined][]).map(([label, val]) => val != null && (
              <div key={label}>
                <div className="text-muted-foreground mb-0.5">{label}</div>
                <div className={`font-mono font-semibold text-base ${val >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {val >= 0 ? "+" : ""}{val.toFixed(2)}%
                </div>
                <div className={`text-xs ${val >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {val >= 0 ? "Outperforming" : "Underperforming"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Generated at ──────────────────────────────────────────────────── */}
      <p className="text-right text-xs text-muted-foreground/60">
        Signals computed from 400 days of daily data · {new Date(data.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}
