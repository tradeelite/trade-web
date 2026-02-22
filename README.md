# TradeView

A personal trading dashboard for tracking stocks, ETFs, options positions, and portfolios. Built with Next.js, featuring real-time market data, technical analysis, and AI-powered screenshot import for options trades.

## Features

- **Stock Research** — Search any stock/ETF, view candlestick charts across multiple timeframes (1D to 5Y), key statistics, and company information
- **Technical Analysis** — SMA/EMA overlays, RSI, MACD, Bollinger Bands with a human-readable bullish/bearish/neutral signal panel
- **Portfolio Management** — Create multiple portfolios, track holdings with real-time P&L calculations
- **Options Tracker** — Log options trades manually or import from brokerage screenshots via AI (Claude Vision OCR)
- **Smart Suggestions** — Automated alerts for profit targets, DTE rolling, assignment risk, and earnings conflicts
- **Data Provider Toggle** — Switch between Yahoo Finance (no key) and Twelve Data via the Settings page
- **Dark/Light Theme** — Full theme support via next-themes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| UI | shadcn/ui + Tailwind CSS 4 + Lucide icons |
| Charting | lightweight-charts (TradingView) |
| Database | SQLite + Drizzle ORM + better-sqlite3 |
| State | TanStack React Query 5 |
| Market Data | Yahoo Finance (`yahoo-finance2`) / Twelve Data |
| AI / OCR | Anthropic Claude Vision (`@anthropic-ai/sdk`) |
| Validation | Zod 4 |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone <repo-url>
cd trade
npm install
```

### Environment Variables

Create a `.env.local` file:

```bash
# Required for OCR screenshot feature
ANTHROPIC_API_KEY=sk-ant-...

# Required only if switching to Twelve Data provider in Settings
TWELVE_DATA_API_KEY=...
```

### Database Setup

Run migrations to create the SQLite schema (creates `./data/trade.db`):

```bash
npm run db:migrate
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

### Stock Research

Use `Cmd+K` (or the search bar) to search for any stock or ETF by ticker or company name. The stock detail page shows:

- **Chart tab** — Candlestick price chart with timeframe controls (1D / 1W / 1M / 3M / 1Y / 5Y)
- **Technical tab** — Indicator overlays (SMA20/50/200, EMA, Bollinger Bands) + RSI and MACD panels + analysis signal summary
- **Company tab** — Sector, industry, market cap, description

### Portfolio Management

Go to **Portfolios** → **New Portfolio** to create a portfolio. Add holdings by ticker, shares, and average cost. The app fetches live prices and shows total value, cost basis, and gain/loss in real time.

### Options Tracker

Go to **Options** to manage options trades:

- **Add Trade** — Manual entry form (ticker, type, direction, strike, expiry, premium, quantity, brokerage)
- **Upload Screenshot** — Drag and drop a brokerage screenshot; Claude Vision extracts all trade fields automatically and pre-fills the form for review
- **Table view** — DTE color-coded badges (red <7d, yellow <21d, green <45d), P&L per trade, realized/unrealized summary
- **Suggestions** — Automated alerts appear at the top for any open trades that hit key thresholds

### Settings

Go to **Settings** to switch the data provider between Yahoo Finance and Twelve Data. Changing the provider invalidates all cached market data immediately.

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Main UI pages
│   │   ├── page.tsx          # Dashboard
│   │   ├── portfolio/        # Portfolio list + detail
│   │   ├── stock/[ticker]/   # Stock detail
│   │   ├── options/          # Options tracker
│   │   └── settings/         # App settings
│   └── api/                  # API routes (stocks, portfolios, options, settings)
├── components/
│   ├── layout/               # Sidebar, header, Cmd+K search
│   ├── stock/                # Price chart, key stats
│   ├── technical/            # Indicator chart, analysis panel
│   └── options/              # Trade form, table, OCR upload, suggestions
├── db/                       # Drizzle schema + DB connection
├── lib/
│   ├── data-providers/       # Yahoo + Twelve Data providers + factory
│   ├── analysis/             # Client-side technical indicator analysis
│   └── options/              # Suggestions engine, P&L, DTE logic
└── types/                    # TypeScript interfaces
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/stocks/search?q=` | Search stocks/ETFs |
| `GET /api/stocks/[ticker]/quote` | Current price |
| `GET /api/stocks/[ticker]/chart?range=` | OHLCV chart data |
| `GET /api/stocks/[ticker]/indicators?range=` | Technical indicator values |
| `GET /api/stocks/[ticker]/summary` | Company info |
| `GET/POST /api/portfolios` | List / create portfolios |
| `GET /api/portfolios/[id]/holdings` | Holdings with live valuations |
| `GET/POST /api/options` | List / create option trades |
| `PUT/DELETE /api/options/[id]` | Update / delete trade |
| `POST /api/options/ocr` | AI screenshot extraction |
| `GET /api/options/suggestions` | Trading suggestions |
| `GET/PUT /api/settings` | App settings |

## Docker

```bash
# Build image
npm run docker:build

# Run (persists SQLite in a Docker volume)
npm run docker:run
# App available at http://localhost:8080
```

The container runs as a non-root user on port 8080 with SQLite data mounted at `/app/data`.

## Database

SQLite database at `./data/trade.db` with 5 tables: `portfolios`, `holdings`, `optionTrades`, `appSettings`, `ocrUploads`.

Managed with Drizzle ORM. To generate and apply schema changes:

```bash
npx drizzle-kit generate   # Generate migration files
npm run db:migrate         # Apply migrations
```

## Scripts

```bash
npm run dev           # Dev server on :3000
npm run build         # Production build
npm run start         # Run production server
npm run lint          # ESLint
npm run db:migrate    # Apply database migrations
npm run docker:build  # Build Docker image
npm run docker:run    # Run Docker container on :8080
```
