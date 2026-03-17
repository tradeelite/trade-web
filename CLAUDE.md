# CLAUDE.md — trade-web

## Summary
Next.js frontend for TradeElite. Provides dashboard UI, local data features, and API proxy routes to `trade-backend`.

## Dashboard Shell Responsiveness

- `src/app/(dashboard)/layout.tsx` uses a responsive shell:
  - Desktop (`md+`): fixed left sidebar + content offset (`md:pl-72`)
  - Mobile (`<md`): full-width content + sheet/drawer navigation
- `src/components/layout/sidebar.tsx`:
  - Desktop sidebar is `hidden md:flex`
  - Mobile nav uses `Sheet` (`side="left"`) and auto-closes on route navigation
- `src/components/layout/header.tsx`:
  - Adds mobile hamburger button (`md:hidden`) to open drawer
  - Keeps search + actions compact for narrow screens
- `src/components/layout/search-command.tsx`:
  - Search trigger is constrained on mobile (`w-full max-w-[220px]`)
  - Uses typed search result model (`StockSearchResult`)
- `src/app/(dashboard)/stock/[ticker]/page.tsx`:
  - Tab bar is wrapped with horizontal scrolling container on mobile (`overflow-x-auto`, `min-w-max`)

## Stock Detail Page Tabs

Order (left → right) and default tab:

| # | Tab | Value | Icon | Default |
|---|-----|-------|------|---------|
| 1 | Company Info | `info` | `Building2` | ✓ |
| 2 | Chart | `chart` | `LineChart` | |
| 3 | Fundamental AI | `fundamental-ai` | `BarChart3` | |
| 4 | Technical Analysis | `technical` | `Activity` | |
| 5 | News & Sentiment | `news` | `Newspaper` | |
| 6 | AI Analysis | `ai` | `Brain` | |

File: `src/app/(dashboard)/stock/[ticker]/page.tsx`

### Tab Content Components
- `info` → `<CompanyInfo>`
- `chart` → `<PriceChartWrapper>` + `<KeyStats>`
- `fundamental-ai` → `<FundamentalAnalysisTab>` — calls `/api/stocks/{ticker}/fundamental-analysis`
- `technical` → `<TechnicalAnalysis>` — renders `AiInsightBanner` → `TechnicalSignalsPanel` → `IndicatorChart`
- `news` → `<NewsAnalysisTab>` — calls `/api/stocks/{ticker}/news-analysis`
- `ai` → `<StockAnalysisPanel>` — calls `/api/stocks/{ticker}/ai-analysis`

## API Proxy Routes

- `/api/stocks/[ticker]/ai-analysis` → backend full orchestrated analysis
- `/api/stocks/[ticker]/fundamental-analysis` → backend dedicated deep fundamental analysis
- `/api/stocks/[ticker]/news-analysis` → caught by catch-all proxy → backend news synthesis
- `/api/stocks/[ticker]/technical-signals` → caught by catch-all proxy → backend technical signals
- `/api/*` catch-all proxy now forwards `x-user-email` from `te_user_email` cookie for user-owned backend routes (`portfolios`, `options`)

## Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| `NewsAnalysisTab` | `src/components/stock/news-analysis-tab.tsx` | AI banner + merged article list |
| `TechnicalAnalysis` | `src/components/technical/technical-analysis.tsx` | Wraps insight banner + signals + chart |
| `TechnicalSignalsPanel` | `src/components/technical/technical-signals-panel.tsx` | Tier 1 indicator gauges + Relative Strength section |
| `FundamentalAnalysisTab` | `src/components/stock/ai-analysis/fundamental-analysis-tab.tsx` | Rich fundamental dashboard |
| `StockAnalysisPanel` | `src/components/stock/ai-analysis/stock-analysis-panel.tsx` | Full AI analysis with oscillator explanations |
| `technical-panel.tsx` | `src/components/stock/ai-analysis/technical-panel.tsx` | Oscillator table with Explanation column |
| `SectionJumpBar` | `src/components/ui/section-jump-bar.tsx` | Shared sticky pill-button jump bar; used in FA, Technical, AI Analysis tabs |
| `StockTearia` | `src/components/ai/stock-tearia.tsx` | Floating TEARIA chat widget (bottom-right) on stock detail page; context-aware |
| `TeAriaBadge` | `src/components/ai/te-aria-badge.tsx` | `[TE] ARIA` brand badge; sizes sm/md/lg |
| `AgentChat` | `src/components/ai/agent-chat.tsx` | Core chat UI used by TEARIA assistant page and floating widget |

## TEARIA — AI Chat Assistant

- **Name**: TEARIA = TE monogram (TradeElite) + ARIA (AI Research & Insights Assistant)
- **Floating widget**: `StockTearia` renders bottom-right on every stock detail page
- **Context priming**: on first open, sends silent message with live quote data (price, market cap, P/E, etc.) + active tab data serialized from TanStack Query cache
- **Tab data access**: `useQueryClient().getQueryData(QUERY_KEYS.*)` — reads already-fetched data, no extra network calls
- **Backend**: `POST /api/agent/query` → `agent.py` → Gemini Flash direct call with per-session history (max 40 msgs)
- **Session**: keyed by widget mount; history is in-memory in trade-backend (`defaultdict(list)`)

## Section Jump Bars

All three long-scroll tabs have a sticky `SectionJumpBar`:
- **Fundamental AI**: 7 sections — Verdict · Valuation · Profitability · Health · Growth · Earnings · Dividends
- **Technical Analysis**: 6 sections — Summary · Moving Averages · Oscillators · Volume · Trend · Relative Strength
- **AI Analysis**: 4 sections — Summary · Technical · Fundamental · News
- Scroll offset: 120px JS + `scroll-mt-32` (128px) on section wrappers so headings stay visible

## Query Keys / Stale Times (constants.ts)

- `stockNewsAnalysis` → 5 min (`STALE_TIMES.NEWS`)
- `stockTechnicalSignals` → 10 min (`STALE_TIMES.TECHNICAL_SIGNALS`)
- `stockAnalysis` → 10 min (`STALE_TIMES.ANALYSIS`)
- `stockFundamentalAnalysis` → 10 min (`STALE_TIMES.ANALYSIS`)

## Auth/Env Notes

`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, and `NEXT_PUBLIC_FIREBASE_PROJECT_ID` must be present for login. These are baked in at Docker build time — pass as `--substitutions` in Cloud Build.

Backend allowlist check (`/api/users/check`) is **fail-open**: only blocks login if the response is OK AND `data.allowed === false`. Network errors or non-OK responses allow login through. See `src/context/auth-context.tsx`.
- Auth provider syncs signed-in email to `te_user_email` cookie; proxy uses it to send user context header to backend for data isolation.
- Settings page is role-aware:
  - Admin users can manage allowlist and global data provider
  - Demo/regular users see admin controls disabled/hidden

## Build Notes

- Avoid production dependence on `next/font/google` fetches.
- `better-sqlite3` still requires `serverExternalPackages` config.
- Chrome can serve stale JS after deploy — always Cmd+Shift+R after frontend deploys.
