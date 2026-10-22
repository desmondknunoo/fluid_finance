# Fluid Finance public site — done and to do

Updated 22 October 2026. Public site and community (finance.fluidterra, Firebase project
`finance-fluidterra`, API `https://api.finance.fluidterra.com`, Cloudflare Pages). The
workspace-wide backlog lives in the parent folder's `TODO.md`.

## Done (October 2026)

- 2026-10-21 Public site rounded and softened to match the investor apps (two passes); stray
  class text under social embeds removed.
- 2026-10-20 Help Center rewritten to match what the product does; real page URLs,
  server-rendered metadata, FAQ schema, sitemap, prerendering and faster loads; official
  Instagram and TikTok feeds on the home page; company logos on the Live Market Data board and
  heatmap; every public page on the editorial design system; fuel % change; social desk feed;
  legacy editor routes dropped; public signup and session handling made reliable; historical
  closing prices served from the Finance API (all 668 valid source rows reconciled).
- 2026-10-19 Sign-in with finance-fluidterra and the Fluid Finance backend; honest copy when the
  editorial backend is unreachable; GSE board read from the live ticker.
- 2026-10-16 Member accounts, articles, forum and profiles on Firebase; pump reports moved to the
  Fluid backend and Supabase dropped; Bloomberg-style editorial front page; quotes and daily
  closes from the Fluid backend.
- 2026-10-05/07 Cloudflare Pages direct-upload deployment; public read-only pump reports.

## To do

- [ ] Browser acceptance with real accounts: register, verify email, comment, start a thread,
      reply, report.
- [ ] Manual acceptance of historical-date browsing and Excel export.
- [ ] Buy redirect acceptance: open a stock, select Buy, follow Continue and confirm focus
      behavior (README "Buy redirect and acceptance").
- [ ] Google Search Console owner steps after the SEO release (README "SEO").
- [ ] Once the portal is in use, remove the unlinked `#/fuel-prices` and `#/team-portal`
      routes, `team-portal-page.tsx` and `team-portal.css`.
- [ ] Extract the byte-identical code shared with `fluid_finance_portal` (`src/lib/*`,
      `src/components/stock/*`, fuel pages) into a package.
- [ ] Decommission Supabase after the 30-day read-only retention; finish the Vercel to
      Cloudflare cut-over steps in the parent `docs/migration-plan-supabase-aws-vercel-cloudflare.md`.
