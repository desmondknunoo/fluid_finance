# Uncoming the "Buy → app.fluidterra.com" feature

Status: **built, wired, and fully commented out.** Nothing in this feature runs
today — the site behaves exactly as it did before this file existed. This doc
is the prompt to give Claude when you're ready to flip it on.

## What's already in the repo

- `src/components/stock/buy-redirect-sheet.tsx` — a complete, working modal
  (`BuyRedirectSheet`) modeled on the existing `ShareSheet` pattern. It tells
  the user Fluid Finance is information/education only, and links out to
  `APP_FT_URL` to actually buy. **This file is not imported anywhere yet.**
- `src/lib/links.ts` — has `export const APP_FT_URL = "https://app.fluidterra.com";`
  already defined and live (this constant is not commented out — it's just
  unused until the sheet is wired in).
- `src/components/stock/stock-detail.tsx` — has every integration point
  stubbed and commented, each tagged `FEATURE:BUY-REDIRECT`:
  1. The `BuyRedirectSheet` import (commented).
  2. The `ShoppingCart` icon import from `lucide-react` (commented).
  3. A `buyOpen` state hook (commented).
  4. A `<BuyRedirectSheet ... />` render call near the top of the component,
     next to the existing `<ShareSheet />` (commented).
  5. A "Buy" `ActionChip` (tone `positive`) placed before the "Export CSV"
     chip, which calls `setBuyOpen(true)` (commented).

Search the codebase for `FEATURE:BUY-REDIRECT` to find every touch point.

## The prompt to give Claude when you're ready to ship this

> Uncomment the Buy → app.fluidterra.com feature. Search the codebase for
> `FEATURE:BUY-REDIRECT` markers (they're in `src/components/stock/stock-detail.tsx`)
> and uncomment each block: the `BuyRedirectSheet` import, the `ShoppingCart`
> icon import, the `buyOpen` state hook, the `<BuyRedirectSheet />` render,
> and the "Buy" `ActionChip`. Remove the `FEATURE:BUY-REDIRECT` comment
> markers themselves once uncommented — they were only there to make this
> block easy to find. Confirm `src/lib/links.ts` still points `APP_FT_URL` at
> `https://app.fluidterra.com` (it should already be correct and uncommented).
> Run `npx tsc --noEmit` to confirm it typechecks, then run the app and click
> into a stock's detail page to verify the "Buy" chip appears next to
> "Export CSV", opens the sheet, and the "Continue to app.fluidterra.com"
> button opens that URL in a new tab. Once confirmed working, delete this
> `APP-FT.md` file and remove this todo from tracking.

## Things to double check before deploying live

- Confirm `https://app.fluidterra.com` is the correct, final destination URL
  at the time you uncomment this — if it's changed, update `APP_FT_URL` in
  `src/lib/links.ts` first.
- Decide whether the "Buy" chip should appear on every stock or be
  conditional (e.g., only for symbols actually tradable on Fluid Terra). Right
  now it's unconditional — it appears for any stock detail page.
- Consider whether analytics/tracking should be added to the outbound link
  before launch (e.g., a query param or event fire) so you can measure
  clickthrough to the trading app.
