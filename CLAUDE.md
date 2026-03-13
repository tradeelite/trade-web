# CLAUDE.md — trade-web

## Summary
Next.js frontend for TradeElite. Provides dashboard UI, local data features, and API proxy routes to `trade-backend`.

## Important AI Analysis Paths

- `/api/stocks/[ticker]/ai-analysis` → backend full orchestrated analysis
- `/api/stocks/[ticker]/fundamental-analysis` → backend dedicated deep fundamental analysis

Stock detail tabs now include:
- Chart
- Technical Analysis
- Company Info
- News & Sentiment
- Fundamental AI
- AI Analysis

`AI Analysis` merges deep fundamental data when available; otherwise uses existing fundamental payload fallback.

## Auth/Env Notes

`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, and `NEXT_PUBLIC_FIREBASE_PROJECT_ID` must be present for login.

## Build Notes

- Avoid production dependence on `next/font/google` fetches.
- `better-sqlite3` still requires `serverExternalPackages` config.
