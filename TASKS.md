# TASKS — trade-web

## In Progress
- [2026-03-12] Improve visual differentiation between legacy and deep fundamental modes in UI.

## Completed
- [2026-03-17] Mobile dashboard responsiveness overhaul
  - Added responsive app shell (`layout.tsx`) with mobile-first spacing and `overflow-x-hidden`
  - Implemented mobile drawer navigation in `sidebar.tsx` (`Sheet` + close-on-link-click)
  - Added hamburger trigger in `header.tsx`
  - Constrained search control width for small screens in `search-command.tsx`
  - Made stock detail tabs horizontally scrollable in `stock/[ticker]/page.tsx`
- [2026-03-12] Added Fundamental AI tab and deep fundamental API proxy route.
- [2026-03-12] Updated AI Analysis panel to merge deep fundamental data with fallback safety.
- [2026-03-12] Fixed production auth/build blockers (Firebase env guarding and font-fetch-safe layout setup).

---
_Format: `- [date] description — notes`_
