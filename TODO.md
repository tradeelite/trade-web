# TODO — trade-web

## Features
- [ ] Add explicit source-quality UI in Fundamental AI tab.
- [ ] Add tooltip explaining fallback vs deep merged fundamental mode in AI Analysis.
- [ ] Add bottom tab-navigation fallback variant for ultra-small screens (<360px) if drawer discoverability is low.
- [ ] Add source-selection toggles in Social Media tab (StockTwits / Reddit / X when available).

## Bug Fixes
- [ ] Improve loading/error state messaging when deep fundamental endpoint times out.
- [ ] Verify there is no horizontal overflow in all dashboard routes on iOS Safari (including sticky header and cards).
- [ ] Add explicit "session expired / missing user context" UI handling for backend `401` from owned data routes.

## Refactoring
- [ ] Extract shared AI panel loading/error wrapper.
