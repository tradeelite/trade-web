# MEMORY — trade-web

## Current State

- Stock page now includes `Fundamental AI` tab.
- `AI Analysis` tab merges deep fundamental payload when available.
- Dashboard shell is now responsive:
  - Desktop uses fixed sidebar
  - Mobile uses hamburger-triggered left drawer
- Web proxy routes used:
  - `/api/stocks/[ticker]/ai-analysis`
  - `/api/stocks/[ticker]/fundamental-analysis`

## Runtime Notes

- Production URL: `https://trade-app-s33r4afwbq-uc.a.run.app`
- `BACKEND_URL` must point to deployed backend service.
- Firebase public env vars are required for login:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- Latest verified frontend deploy:
  - Date: 2026-03-17
  - Cloud Run revision: `trade-app-00042-cfg`
  - Deployment path: Cloud Build (`cloudbuild.yaml`) with `SHORT_SHA=c0d3cfd`

## Behavior Notes

- Fundamental panel supports both legacy and enhanced schema.
- Deep endpoint is preferred when present; fallback remains active.
- Stock detail tabs are horizontally scrollable on mobile to prevent clipped tab labels.
- Search trigger width is constrained for small screens.
- Multi-user data isolation path:
  - Auth context writes signed-in email into `te_user_email` cookie
  - Catch-all API proxy injects `x-user-email` header from cookie to backend
  - Backend filters portfolio/options data by `user_email`
- Settings page behavior:
  - Admin users can manage allowlist and global data provider setting
  - Demo/regular users see settings in read-only scope for admin controls

## Known Gaps

- Visual distinction between fallback and deep-merged mode can be clearer.
- Source quality presentation can be improved.
- Need device QA pass for iOS Safari safe-area and drawer ergonomics.
- User identity is forwarded as header from cookie and not yet verified via Firebase token on backend.
