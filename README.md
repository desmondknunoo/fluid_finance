# Fluid Finance

Fluid Finance is a standalone React, TypeScript, and Vite market information site for Ghana Stock
Exchange investors. It includes market snapshots, company and price history views, educational
content, and export/share features. Historical daily closes, fuel reports, FX rates and all
community data come from the Fluid backend's editorial API on AWS; the GSE live view uses the
backend's market snapshot.

It is also an interactive community: visitors can create a free account, read the research team's
articles and comment on them, start and join forum discussions, and keep a public profile. The
team manages all of that from the separate [Fluid Finance Portal](../fluid_finance_portal/README.md).

## Public and member features

| Area | Path | Who |
| --- | --- | --- |
| Front page: quote tape, market bar, Markets Wrap (equal-weight composite chart and auto headline), lead story, stock spotlight, Latest feed, movers, cedi and pump rails, community, social desk feed and learning bands | `/` | Everyone |
| Markets: GSE live, stock pages, weekly trends | `/gse-live`, `/gse-live/heatmap`, `/stock/<SYM>`, `/market-trends` | Everyone |
| Fuel pump report (read-only) and FX rates with converter | `/fuel`, `/fx` | Everyone |
| Articles and single article with comments | `/articles`, `/opinion`, `/articles/<slug>` | Read: everyone · comment: members |
| Forum categories, threads, replies | `/forum`, `/forum/c/<category>`, `/forum/t/<id>`, `/forum/new` | Read: everyone · post: members |
| Account: sign in, register, reset, settings, saved reading | `/login`, `/register`, `/reset-password`, `/settings`, `/saved` | Members |
| Public profile | `/u/<username>` | Everyone |

Old hash links (`/#/articles/<slug>`, `/#/stock/GCB`) still work: the app swaps them for the path
before it renders. See [SEO](#seo).

Members can edit their own posts and report others'; moderation, publishing, fuel/FX data entry
and role assignment happen only in the portal. The portal is an internal tool and is never linked
or mentioned anywhere on this site, including the account menu. The legacy fuel editor and team
portal preview that once shipped here were removed once the portal went live.

Authentication is Firebase Authentication in **Fluid Finance's own Firebase project**,
`finance-fluidterra` (the finance.fluidterra Google account), not the investor app's
`app-fluidterra`: email + password, or **Continue with Google**. In that project's console enable the Email/Password and
Google sign-in providers, add `finance.fluidterra.com`, `finance-portal.fluidterra.com` and
`localhost` under Authentication → Settings → Authorised domains, and copy the web app's
`apiKey`, `authDomain` and `projectId` into `.env` (see `.env.example`). The web API key is public
client configuration. Members sign in with the Firebase SDK and every API call carries the ID
token; the backend verifies it and creates the member's profile on first contact. Roles are set
only by administrators in the portal, never by the client.

## Development

```sh
npm install
npm run dev
```

Vite prints the local URL (normally `http://localhost:5173`). In development the market client
calls `/market-api`, which `vite.config.ts` proxies to `https://api.fluidterra.com/api/v1/market`
so live quotes load from any local port despite the API's origin allow-list; production builds
call the API directly.

## Commands

```sh
npm run dev      # start the Vite development server
npm run build    # type-check, create dist/ and prerender every static and stock page
npm test         # node --test tests/*.test.mjs
npm run lint     # run ESLint
npm run preview  # serve the built site locally
```

## Data configuration

Live quotes come from the investor platform's public market snapshot:
`https://api.fluidterra.com/api/v1/market/stocks`. That backend uses the official GSE Market Watch
provider in production and refreshes quotes automatically. Company metadata still comes from
Kwayisi. It must allow `https://finance.fluidterra.com` and `https://fluid-finance.pages.dev` in
its CORS origins.

Run the market client regression tests with:

```sh
node --experimental-strip-types --test tests/gse.test.mjs
```

All other data is served by the Fluid Finance backend (`fluid_finance_backend`, FastAPI on the
finance AWS account) under `/api/v1/editorial`: daily closes (`/closes`, recorded by the backend from the live snapshot),
fuel reports and OMC logos (`/fuel/*`, logos in the S3 documents bucket), FX rates (`/fx`),
the social desk's posted items for the front page's "From our socials" band (`/social/posts`),
articles, comments, forum, profiles and reports. `VITE_API_BASE_URL` selects the backend
(default `https://api.finance.fluidterra.com/api/v1`; the local Compose stack is
`http://localhost:8001/api/v1`). Live GSE quotes still come from the investor platform's public
market API. Nothing Supabase remains in this app.

History cutover verified on 20 October 2026: all 668 valid Supabase closing-price rows
(10 August–15 October 2026) match the Finance API by symbol, trading date and price.
The 32 source rows with missing or non-positive prices were excluded. The API also holds
newer daily snapshots. History tables and Excel exports now read the public
`/editorial/closes` endpoint without requiring sign-in. Supabase is retained unchanged
during the migration retention period.

Run the history-client checks with `node --test tests/closes.test.mjs`.

## Hosting on Cloudflare Pages

The site uses the `fluid-finance` Pages project and the production domain
`https://finance.fluidterra.com`. Deploy the build from
`desmondknunoo/fluid_finance` on `develop` using Direct Upload. The current Pages
project is not connected to GitHub; pushing code alone does not publish it.

| Setting | Value |
| --- | --- |
| Source branch | `develop` |
| Build command | `npm run build` |
| Build output | `dist` |
| Root directory | Repository root |
| Node.js | 22 (from `.node-version`) |

`wrangler.jsonc` records the project name and output directory. Every write goes to the Fluid
backend with the member's Firebase token, so the Pages project needs no server-side secrets. Set
the `VITE_FIREBASE_*` and `VITE_API_BASE_URL` build variables in the Pages project. The
`functions/` directory adds read-only Pages Functions for search metadata and the sitemap (see
[SEO](#seo)); `wrangler pages deploy dist` uploads them with the build. The build must not contain
a top-level `404.html`: without one, Pages answers unknown paths with `index.html`, which is what
client routes rely on (the prerender step fails the build if one appears).

For a manual deployment to the existing project:

```sh
npm ci
npm run build
npx wrangler@4 pages deploy dist --project-name=fluid-finance --branch=main
```

The direct-upload project's production branch is `main`; the Wrangler command
above publishes the build from the checked-out `develop` branch to production.

Register `finance.fluidterra.com` under the Pages project's **Custom domains**,
then point its DNS CNAME at the hostname Cloudflare assigns to the project
(normally `fluid-finance.pages.dev`). Verify the Pages deployment before replacing
the former Vercel DNS target.

## Buy redirect and acceptance

The stock-detail Buy action opens the existing redirect sheet and links to
`https://app.fluidterra.com`; the destination is defined in `src/lib/links.ts`.
The sheet implements Escape dismissal, keyboard focus containment, focus restoration,
and background scroll locking.

Browser acceptance remains pending: open a stock, select Buy, follow Continue and confirm
the investor app opens in a new tab. Reopen and dismiss with Escape; focus should return
to Buy. Check keyboard navigation and scroll restoration on phone and desktop.

## SEO

### Routes

The app uses History API paths (`src/lib/navigation.ts`). Internal links are plain `href`s; a
document-level click handler turns same-origin left clicks without modifier keys into
`pushState` navigations, restores the scroll position on back/forward and leaves in-page anchors
(`/#listen`, the privacy and terms contents) to the browser. Legacy `/#/…` URLs from the portal,
the backend's publication ledger, share cards, emails and bookmarks are replaced in place
(`history.replaceState`) before the first render, so `/#/articles/<slug>` lands on
`/articles/<slug>`. Firebase's email continue URLs (`/#/login`) are handled the same way.

### Metadata

`src/lib/seo-routes.ts` is the single source for every page's title, description, canonical URL
(always `https://finance.fluidterra.com` + the clean path), robots rule, Open Graph and Twitter
tags and JSON-LD (NewsMediaOrganization, WebSite, BreadcrumbList, Corporation with
`tickerSymbol: "GSE:<SYM>"`, NewsArticle, DiscussionForumPosting, ProfilePage, FAQPage, ItemList
and Dataset). There is no SearchAction because the site has no search results URL. Sign-in,
register, password reset, settings, saved reading and the thread composer are `noindex`.

To add metadata for a new page:

1. Add its path to `STATIC_PAGES` in `src/lib/seo-routes.ts` (title, a 140–160 character
   description, the on-page heading and intro for crawlers, breadcrumbs and any JSON-LD). If the
   route kind is new, map it in `routeMeta`.
2. For a page whose content comes from the API, call `useSeo(meta)` from `src/lib/seo.ts` once
   the record loads (see `article-page.tsx`), and add a Function if the page should be indexed.
3. Run `npm test`; `tests/seo.test.mjs` checks description lengths, canonicals and that every
   JSON-LD block parses.

The App applies route metadata on every navigation; pages with API content refine it.

### Prerendering

`npm run build` runs `scripts/prerender.mjs` after `vite build`. It writes `dist/<route>.html`
for every static route, the `/about` and `/gse-live/table` aliases and all 39 stock pages in
`COMPANY_META` (`dist/stock/<SYM>.html`), each with that route's head and a short summary inside
`#root` that React replaces on mount. Files are `<route>.html` rather than `<route>/index.html`
because Pages serves `fuel.html` at `/fuel` (200) but would redirect `/fuel` to `/fuel/` for a
directory index. No prices are fetched at build time. `dist/shell.html` (`/shell`) is a neutral
noindex copy used by the Functions and as the service worker's offline fallback.

### Pages Functions

| Path | File | What it does |
| --- | --- | --- |
| `/articles/<slug>` | `functions/articles/[slug].ts` | Article title, excerpt, cover as `og:image`, NewsArticle JSON-LD |
| `/forum/t/<id>` | `functions/forum/t/[id].ts` | Thread title and opening post, DiscussionForumPosting JSON-LD |
| `/forum/c/<slug>` | `functions/forum/c/[slug].ts` | Category name and description |
| `/u/<username>` | `functions/u/[username].ts` | Member name, bio, ProfilePage JSON-LD |
| `/sitemap.xml` | `functions/sitemap.xml.ts` | Static pages, stock pages, published articles, forum categories and threads |

Each page Function fetches the record from the editorial API (edge-cached for five minutes),
rewrites the shell with HTMLRewriter (`server/edge-seo.ts`) and returns it with
`Cache-Control: public, max-age=0, must-revalidate`, like Pages' own HTML, so a browser never
keeps HTML that points at assets a later deployment removed. A missing record returns 404 with
`noindex`; any other failure returns the shell with a self canonical, so the page always loads.
`API_BASE_URL` (optional Pages environment variable) points the Functions at another backend.
Static assets are served exactly as before; only the paths above invoke a Function.

The sitemap (`server/sitemap.ts`) lists articles up to the API's 100-per-request limit, widening
with one request per article category when the first page is full, and pages through forum
threads 20 at a time. `lastmod` is included only where the API returns a date. `public/robots.txt`
allows everything public, disallows the account, saved-reading, composer and shell paths, and
points to the sitemap.

Test the built site with Functions locally:

```sh
npm run build
npx wrangler@4 pages dev dist --port 8788
curl -s http://localhost:8788/stock/GCB | grep -E '<title|canonical'
curl -s http://localhost:8788/sitemap.xml | head
```

### Assets

`scripts/brand-icons.py` (one-off, needs Pillow) generated `favicon.ico`, `apple-touch-icon.png`,
`icons/*.png` and `og/default.png` (the existing 1200×630 brand card) from `public/logo/`. The web
app manifest is `public/manifest.webmanifest`.

### Google Search Console (owner steps)

1. Open [Search Console](https://search.google.com/search-console), choose **Add property** →
   **Domain** and enter `fluidterra.com` (this covers `finance.fluidterra.com` and every other
   subdomain).
2. Copy the `google-site-verification=…` TXT value Google shows.
3. In Namecheap: **Domain List** → `fluidterra.com` → **Manage** → **Advanced DNS** → **Add new
   record** → type `TXT Record`, host `@`, value the string from step 2, TTL automatic. Save.
4. Back in Search Console, select **Verify** (DNS can take from minutes to a few hours).
5. In the verified property open **Sitemaps** and submit
   `https://finance.fluidterra.com/sitemap.xml`.
6. Use **URL Inspection** on `https://finance.fluidterra.com/` and a stock page such as
   `/stock/GCB` and choose **Request indexing**; check **Pages** and **Enhancements** (breadcrumbs,
   FAQ, articles) over the following weeks.
