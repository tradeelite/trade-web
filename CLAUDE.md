# CLAUDE.md — TradeView Project Context

## Project Summary

TradeView is a personal trading dashboard built with **Next.js + TypeScript + SQLite**. It lets a single user track stocks, ETFs, options positions, and portfolios with real-time market data, technical analysis, and AI-powered screenshot OCR for trade extraction.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **UI:** shadcn/ui + Tailwind CSS 4 + Lucide React icons
- **Charting:** lightweight-charts (TradingView)
- **Data APIs:** `yahoo-finance2` (default, no key) + Twelve Data (optional, key required)
- **Database:** SQLite via Drizzle ORM + better-sqlite3 (WAL mode, file: `./data/trade.db`)
- **State:** TanStack React Query 5 (server state) + next-themes (dark/light)
- **OCR:** Anthropic Claude Vision (`@anthropic-ai/sdk`) — model: claude-sonnet-4-5
- **Validation:** Zod 4
- **Notifications:** Sonner toasts

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout with QueryClient + ThemeProvider
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Sidebar + Header shell
│   │   ├── page.tsx                  # Dashboard home
│   │   ├── portfolio/                # Portfolio list + detail
│   │   ├── stock/[ticker]/           # Stock detail (chart, technical, company info)
│   │   ├── options/                  # Options tracker + OCR upload
│   │   └── settings/                 # Data provider toggle, preferences
│   └── api/
│       ├── stocks/                   # search, quote, chart, summary, indicators, earnings
│       ├── portfolios/               # CRUD + holdings endpoints
│       ├── options/                  # CRUD + suggestions + OCR upload
│       └── settings/                 # GET/PUT app_settings key-value store
├── components/
│   ├── ui/                           # shadcn/ui base components
│   ├── layout/                       # Sidebar, header, Cmd+K search palette, providers
│   ├── stock/                        # PriceChart, TimeframeSelector, KeyStats
│   ├── technical/                    # IndicatorChart, IndicatorAnalysis panel
│   └── options/                      # TradeForm, TradesTable, ScreenshotUpload, Suggestions
├── db/
│   ├── index.ts                      # DB init (better-sqlite3 + drizzle, WAL mode, FK enabled)
│   └── schema.ts                     # All table definitions
├── lib/
│   ├── data-providers/               # DataProvider interface, YahooProvider, TwelveDataProvider, factory
│   ├── analysis/                     # compute-analysis.ts — pure TS indicator analysis functions
│   ├── options/                      # suggestions.ts, pnl.ts, dte.ts
│   ├── constants.ts
│   └── utils.ts
├── hooks/
│   └── use-debounce.ts
└── types/
    ├── stock.ts, options.ts, portfolio.ts, indicators.ts, analysis.ts
```

## Database Schema

| Table | Key Columns |
|-------|-------------|
| `portfolios` | id, name, description, createdAt, updatedAt |
| `holdings` | id, portfolioId (FK→portfolios), ticker, shares, avgCost; UNIQUE(portfolioId, ticker) |
| `optionTrades` | id, ticker, optionType, direction, strikePrice, expiryDate, premium, quantity, brokerage, status, closePremium, closeDate, notes, source, createdAt, updatedAt |
| `appSettings` | key (PK), value — stores `data_provider` and other preferences |
| `ocrUploads` | id, filename, status (pending/processed/failed), extractedData (JSON), createdAt |

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/stocks/search?q=` | Stock/ETF search |
| GET | `/api/stocks/[ticker]/quote` | Current price quote |
| GET | `/api/stocks/[ticker]/chart?range=` | OHLCV chart data |
| GET | `/api/stocks/[ticker]/indicators?range=` | SMA/EMA/RSI/MACD/BB values |
| GET | `/api/stocks/[ticker]/summary` | Company info |
| GET | `/api/stocks/earnings` | Earnings dates for open option positions |
| GET/POST | `/api/portfolios` | List / create portfolios |
| GET/PUT | `/api/portfolios/[id]` | Get / update portfolio |
| GET | `/api/portfolios/[id]/holdings` | Holdings with live valuations |
| GET/POST | `/api/options` | List / create option trades |
| PUT/DELETE | `/api/options/[id]` | Update (close) / delete trade |
| POST | `/api/options/ocr` | Upload screenshot → Claude extracts trade |
| GET | `/api/options/suggestions` | Rule-based trading suggestions |
| GET/PUT | `/api/settings` | Read / write app_settings |

## Data Provider Architecture

- `src/lib/data-providers/types.ts` — shared `DataProvider` interface
- `YahooProvider` — uses `yahoo-finance2` npm package, no API key
- `TwelveDataProvider` — REST calls, requires `TWELVE_DATA_API_KEY`
- `provider-factory.ts` — reads `app_settings.data_provider` from DB, returns correct instance
- Switching providers: Settings page writes to DB → TanStack Query cache invalidated → next fetch uses new provider

## Chart Range → Interval Mapping

| Range | Interval |
|-------|----------|
| 1D | 5m |
| 1W | 15m |
| 1M | 1d |
| 3M | 1d |
| 1Y | 1d |
| 5Y | 1wk |

## Technical Analysis (compute-analysis.ts)

Pure functions, no API calls — computed client-side via `useMemo`:

- `analyzeTrend()` — Price vs SMA20/50/200, SMA slope (5-period lookback); majority vote of 6 signals
- `analyzeCrossover()` — Aligns SMA50/SMA200 by timestamp, detects golden/death cross state, walks back to find last crossover date
- `analyzeMomentum()` — RSI (<30 bullish, >70 bearish), MACD vs signal line, MACD histogram direction, Bollinger %B (<0.2 bullish, >0.8 bearish) + squeeze detection (bandwidth <4%)
- `computeOverallSignal()` — Count bullish/bearish/neutral across all signals, majority wins

## Options Suggestions Rules (suggestions.ts)

| Rule | Condition | Action |
|------|-----------|--------|
| Profit target | Sold option, current premium ≤ 50% of entry | Close to lock profit |
| DTE roll | DTE < 21 days | Roll to next expiry (urgent if < 7) |
| Assignment risk | Underlying within 3% of strike | Close to avoid assignment |
| Earnings conflict | Earnings date within 14 days of expiry | Review/close before earnings |

## Key Implementation Notes

- `lightweight-charts` requires `"use client"` + `dynamic(() => import(...), { ssr: false })`
- `better-sqlite3` requires `serverExternalPackages: ["better-sqlite3"]` in `next.config.ts`
- TanStack Query stale times: quotes 30s, charts 5min, portfolios 30s, options 60s, company info 1hr
- DB path: `./data/trade.db` (create `data/` dir before first run or run migrations)
- OCR uses `claude-sonnet-4-5` vision with confidence scoring; low-confidence fields are highlighted in the review dialog
- All indicators (SMA, EMA, RSI, MACD, Bollinger Bands) are computed locally from raw OHLCV data — not fetched from external APIs

## Environment Variables

```bash
# Required for OCR screenshot feature
ANTHROPIC_API_KEY=sk-ant-...

# Required only if using Twelve Data provider
TWELVE_DATA_API_KEY=...
```

## Common Commands

```bash
npm run dev           # Start dev server on :3000
npm run build         # Production build
npm run db:migrate    # Run Drizzle migrations (creates tables in ./data/trade.db)
npm run lint          # ESLint
npm run docker:build  # Build Docker image (trade-app)
npm run docker:run    # Run container on :8080 with persistent SQLite volume
```

## Development Workflow

1. Run `npm run db:migrate` once to create the SQLite schema
2. Add `.env.local` with `ANTHROPIC_API_KEY`
3. `npm run dev` — app available at `http://localhost:3000`
4. Stock data works immediately via Yahoo Finance (no key needed)
5. OCR upload requires valid `ANTHROPIC_API_KEY`

## Docker Deployment

```bash
npm run docker:build
npm run docker:run
# App runs at http://localhost:8080
# SQLite persists in Docker volume: trade-data
```

The Dockerfile uses a multi-stage build (deps → builder → runner) with Node.js 22 Alpine, handles better-sqlite3 native bindings, runs as non-root user, and sets `PORT=8080`.
