"use client";

import { useState, useRef, useEffect } from "react";
import { X, MessageCircle, Send, User, ChevronDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TeAriaBadge } from "@/components/ai/te-aria-badge";
import { QUERY_KEYS } from "@/lib/constants";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface StockQuote {
  currentPrice?: number;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  averageVolume?: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  trailingPE?: number;
  forwardPE?: number;
  dividendYield?: number;
  shortName?: string;
  longName?: string;
  sector?: string;
  industry?: string;
}

interface StockTeariaProps {
  ticker: string;
  companyName?: string;
  currentTab?: string;
  quote?: StockQuote;
}

// ─── Data serialisers per tab ──────────────────────────────────────────────────

function serializeTabData(tab: string, data: unknown): string {
  if (!data || typeof data !== "object") return "";

  try {
    const d = data as Record<string, unknown>;

    if (tab === "technical") {
      const lines: string[] = ["--- Technical Signals ---"];
      if (d.summary) {
        const s = d.summary as Record<string, unknown>;
        lines.push(`Overall signal: ${s.signal ?? "N/A"} (Buy: ${s.buy ?? 0}, Sell: ${s.sell ?? 0}, Neutral: ${s.neutral ?? 0})`);
        if (s.recommendation) lines.push(`Recommendation: ${s.recommendation}`);
      }
      if (Array.isArray(d.movingAverages)) {
        lines.push("Moving Averages:");
        (d.movingAverages as Record<string, unknown>[]).forEach((ma) => {
          lines.push(`  ${ma.name}: ${ma.value ?? "N/A"} — ${ma.signal ?? "N/A"}`);
        });
      }
      if (Array.isArray(d.oscillators)) {
        lines.push("Oscillators:");
        (d.oscillators as Record<string, unknown>[]).forEach((osc) => {
          lines.push(`  ${osc.name}: ${osc.value ?? "N/A"} — ${osc.signal ?? "N/A"}`);
        });
      }
      if (d.trendStrength) {
        const ts = d.trendStrength as Record<string, unknown>;
        lines.push(`ADX: ${ts.adx ?? "N/A"} (${ts.trend ?? "N/A"})`);
        if (ts.relativeStrength1M != null) lines.push(`Relative Strength vs S&P 500: 1M ${(ts.relativeStrength1M as number).toFixed(2)}%, 3M ${(ts.relativeStrength3M as number ?? 0).toFixed(2)}%, 6M ${(ts.relativeStrength6M as number ?? 0).toFixed(2)}%`);
      }
      if (d.volume) {
        const v = d.volume as Record<string, unknown>;
        lines.push(`Volume: ${v.current ?? "N/A"} (avg ${v.average ?? "N/A"}), Rel. Volume: ${v.relativeVolume ?? "N/A"}x — ${v.signal ?? "N/A"}`);
      }
      if (d.volatility) {
        const vol = d.volatility as Record<string, unknown>;
        lines.push(`Bollinger Bands: ${vol.bollingerSignal ?? "N/A"}, ATR: ${vol.atr ?? "N/A"}`);
      }
      return lines.join("\n");
    }

    if (tab === "fundamental-ai") {
      const lines: string[] = ["--- Fundamental Analysis ---"];
      if (d.summary) lines.push(`Summary: ${d.summary}`);
      if (d.header) {
        const h = d.header as Record<string, unknown>;
        lines.push(`Price: ${h.price}, Market Cap: ${h.marketCap}, Revenue: ${h.revenue}, Net Income: ${h.netIncome}`);
      }
      const sections: [string, string][] = [
        ["valuation", "Valuation"],
        ["profitability", "Profitability"],
        ["financialHealth", "Financial Health"],
        ["growth", "Growth"],
        ["earnings", "Earnings"],
        ["dividends", "Dividends"],
      ];
      for (const [key, label] of sections) {
        if (Array.isArray(d[key])) {
          lines.push(`${label}:`);
          (d[key] as Record<string, unknown>[]).forEach((row) => {
            lines.push(`  ${row.metric}: ${row.value ?? "N/A"} (${row.signalLabel ?? row.signal ?? "N/A"}) — ${row.interpretation ?? ""}`);
          });
        }
      }
      if (Array.isArray(d.verdict)) {
        lines.push("Verdict:");
        (d.verdict as Record<string, unknown>[]).forEach((v) => {
          lines.push(`  ${v.investorType}: ${v.verdict} — ${v.reasoning}`);
        });
      }
      if (d.keyRisk) lines.push(`Key risk: ${d.keyRisk}`);
      return lines.join("\n");
    }

    if (tab === "news") {
      const lines: string[] = ["--- News & Sentiment ---"];
      if (d.overallSentiment) lines.push(`Overall sentiment: ${d.overallSentiment}`);
      if (d.newsSentiment) lines.push(`News sentiment: ${d.newsSentiment}`);
      if (d.recommendation) lines.push(`Recommendation: ${d.recommendation}`);
      if (d.socialSentiment) {
        const ss = d.socialSentiment as Record<string, unknown>;
        if (ss.bullishPercent != null) lines.push(`Social: ${ss.bullishPercent}% bullish`);
        if (ss.watchlistCount != null) lines.push(`Watchlist count: ${ss.watchlistCount}`);
      }
      if (d.summary) lines.push(`AI Summary: ${d.summary}`);
      if (Array.isArray(d.catalysts) && d.catalysts.length > 0) {
        lines.push(`Catalysts: ${(d.catalysts as string[]).join("; ")}`);
      }
      if (Array.isArray(d.risks) && d.risks.length > 0) {
        lines.push(`Risks: ${(d.risks as string[]).join("; ")}`);
      }
      if (Array.isArray(d.articles)) {
        lines.push(`Recent headlines (${(d.articles as unknown[]).length} articles):`);
        (d.articles as Record<string, unknown>[]).slice(0, 5).forEach((a) => {
          lines.push(`  - ${a.title} (${a.source})`);
        });
      }
      return lines.join("\n");
    }

    if (tab === "ai") {
      const lines: string[] = ["--- AI Analysis ---"];
      if (d.summary) lines.push(`Summary: ${d.summary}`);
      if (d.recommendation) lines.push(`Recommendation: ${d.recommendation}`);
      if (d.technicalSummary) lines.push(`Technical: ${d.technicalSummary}`);
      if (d.fundamentalSummary) lines.push(`Fundamental: ${d.fundamentalSummary}`);
      if (d.newsSummary) lines.push(`News: ${d.newsSummary}`);
      if (Array.isArray(d.keyRisks)) lines.push(`Risks: ${(d.keyRisks as string[]).join("; ")}`);
      if (Array.isArray(d.catalysts)) lines.push(`Catalysts: ${(d.catalysts as string[]).join("; ")}`);
      return lines.join("\n");
    }

    if (tab === "info") {
      const lines: string[] = ["--- Company Info ---"];
      if (d.longBusinessSummary) lines.push(`About: ${String(d.longBusinessSummary).slice(0, 500)}...`);
      if (d.sector) lines.push(`Sector: ${d.sector}`);
      if (d.industry) lines.push(`Industry: ${d.industry}`);
      if (d.fullTimeEmployees) lines.push(`Employees: ${Number(d.fullTimeEmployees).toLocaleString()}`);
      if (d.website) lines.push(`Website: ${d.website}`);
      if (d.city && d.country) lines.push(`HQ: ${d.city}, ${d.country}`);
      return lines.join("\n");
    }
  } catch {
    // ignore serialisation errors
  }
  return "";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StockTearia({ ticker, companyName, currentTab, quote }: StockTeariaProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tabLabel = currentTab
    ? ({ chart: "Chart", technical: "Technical Analysis", "fundamental-ai": "Fundamental AI", news: "News & Sentiment", ai: "AI Analysis", info: "Company Info" } as Record<string, string>)[currentTab] ?? currentTab
    : null;

  const send = async (text: string, silent = false) => {
    if (!text.trim() || loading) return;
    if (!silent) {
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setInput("");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/agent/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Server error ${res.status}`);
      }
      const data = await res.json();
      if (data.response?.trim()) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, I couldn't process that. ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  // Build context from quote + cached tab data, send silently on first open
  useEffect(() => {
    if (open && !initialized) {
      setInitialized(true);

      // ── Quote / market data ──
      const price = quote?.currentPrice ?? quote?.regularMarketPrice;
      const change = quote?.regularMarketChange;
      const changePct = quote?.regularMarketChangePercent;
      const fmtDollar = (n?: number) => n != null ? `$${n.toFixed(2)}` : null;
      const fmtB = (n?: number) => n != null ? `$${(n / 1e9).toFixed(2)}B` : null;
      const fmt = (n?: number) => n != null ? n.toLocaleString() : null;

      const quoteLines: string[] = [
        `Stock: ${ticker}${companyName ? ` (${companyName})` : ""}`,
        tabLabel ? `Viewing: ${tabLabel} tab` : "",
        quote?.sector ? `Sector: ${quote.sector}${quote.industry ? ` — ${quote.industry}` : ""}` : "",
        price != null ? `Price: ${fmtDollar(price)}${change != null ? ` (${change >= 0 ? "+" : ""}${change.toFixed(2)}, ${changePct != null ? (changePct >= 0 ? "+" : "") + changePct.toFixed(2) + "%" : ""})` : ""}` : "",
        quote?.marketCap != null ? `Market cap: ${fmtB(quote.marketCap)}` : "",
        quote?.regularMarketVolume != null ? `Volume: ${fmt(quote.regularMarketVolume)}${quote.averageVolume != null ? ` (avg ${fmt(quote.averageVolume)})` : ""}` : "",
        quote?.fiftyTwoWeekHigh != null ? `52-week range: ${fmtDollar(quote.fiftyTwoWeekLow)} – ${fmtDollar(quote.fiftyTwoWeekHigh)}` : "",
        quote?.trailingPE != null ? `P/E: ${quote.trailingPE.toFixed(2)}${quote.forwardPE != null ? ` (fwd ${quote.forwardPE.toFixed(2)})` : ""}` : "",
        quote?.dividendYield != null ? `Dividend yield: ${(quote.dividendYield * 100).toFixed(2)}%` : "",
      ].filter(Boolean);

      // ── Tab-specific cached data ──
      const tabDataMap: Record<string, unknown> = {
        technical: queryClient.getQueryData(QUERY_KEYS.stockTechnicalSignals(ticker)),
        "fundamental-ai": queryClient.getQueryData(QUERY_KEYS.stockFundamentalAnalysis(ticker)),
        news: queryClient.getQueryData(QUERY_KEYS.stockNewsAnalysis(ticker)),
        ai: queryClient.getQueryData(QUERY_KEYS.stockAnalysis(ticker)),
        info: queryClient.getQueryData(QUERY_KEYS.stockSummary(ticker)),
      };

      const tabData = currentTab ? tabDataMap[currentTab] : null;
      const tabSection = tabData && currentTab ? serializeTabData(currentTab, tabData) : "";

      const ctx = [
        "=== TradeElite Page Context ===",
        quoteLines.join("\n"),
        tabSection,
        "===",
        "Use the above data to answer my questions accurately. Do not say you lack access to this data.",
      ].filter(Boolean).join("\n\n");

      send(ctx, true);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const suggestedQuestions = [
    `Is ${ticker} a good buy right now?`,
    `What are the key risks for ${ticker}?`,
    `Summarize what the ${tabLabel ?? "current"} tab is showing`,
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col w-[380px] h-[500px] rounded-2xl border bg-background shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <TeAriaBadge size="sm" />
              <span className="text-xs text-muted-foreground font-medium">· {ticker}</span>
              {tabLabel && (
                <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">· {tabLabel}</span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 p-4">
            {messages.length === 0 && !loading && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 py-4 text-center text-muted-foreground">
                  <TeAriaBadge size="md" />
                  <p className="text-xs">Ask me anything about {ticker}</p>
                </div>
                <div className="space-y-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => send(q)}
                      className="w-full text-left text-xs rounded-lg border px-3 py-2 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2 text-sm", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="mt-0.5 shrink-0"><TeAriaBadge size="sm" /></div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                )}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-start">
                <div className="mt-0.5 shrink-0"><TeAriaBadge size="sm" /></div>
                <div className="space-y-1.5 pt-1">
                  <Skeleton className="h-2.5 w-40" />
                  <Skeleton className="h-2.5 w-28" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
              <input
                ref={inputRef}
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                placeholder={`Ask about ${ticker}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={!input.trim() || loading}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Floating trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-full border px-4 py-2.5 shadow-lg transition-all",
          "bg-background hover:bg-muted text-foreground",
          open && "bg-muted"
        )}
      >
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <MessageCircle className="h-4 w-4 text-primary" />}
        <TeAriaBadge size="sm" />
      </button>
    </div>
  );
}
