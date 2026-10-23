# Fluid Finance public site — done and to do

Updated 22 October 2026. Public site and community (finance.fluidterra, Firebase project
`finance-fluidterra`, API `https://api.finance.fluidterra.com`, Cloudflare Pages). The
workspace-wide backlog lives in the parent folder's `TODO.md`.

## Done (October 2026)

- 2026-10-22 Buy redirect accepted in the browser (desktop and 375px): the sheet opens from Buy,
  Continue is a real link to `https://app.fluidterra.com` (`target=_blank`,
  `rel="noreferrer noopener"`), focus lands on Close, Tab and Shift+Tab stay inside the sheet,
  Escape closes it, focus returns to Buy and the page scroll lock lifts. The footer named
  "fluidfinance.com"; it now says finance.fluidterra.com and the Fluid app.
- 2026-10-22 Shared code reconciled with the portal (every listed file byte-identical again;
  app differences are parameters: `configureApi()`, `stockHref`, the share sheets' `footer`
  slot); `shared-files.json` + `npm run shared:check` guard against drift and run with
  `npm test`. ESLint config restored (`npm run lint` passes) and the stale GSE tests brought up
  to the live-ticker source.
- 2026-10-20 The unlinked `#/fuel-prices` and `#/team-portal` routes, `team-portal-page.tsx`
  and `team-portal.css` were removed once the portal went live (commit 26d3452); confirmed on
  22 October that nothing references them.
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
- [ ] Google Search Console owner steps after the SEO release (README "SEO").
- [ ] Move the files in `shared-files.json` into a real shared package: needs a repository (or a
      workspace holding both apps) of its own, which is the owner's decision; until then
      `npm run shared:check` keeps the copies identical.
- [ ] Decommission Supabase after the 30-day read-only retention; finish the Vercel to
      Cloudflare cut-over steps in the parent `docs/migration-plan-supabase-aws-vercel-cloudflare.md`.
