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

| Area | Hash | Who |
| --- | --- | --- |
| Front page: quote tape, market bar, Markets Wrap (equal-weight composite chart and auto headline), lead story, stock spotlight, Latest feed, movers, cedi and pump rails, community, social desk feed and learning bands | `#/` | Everyone |
| Markets: GSE live, stock pages, weekly trends | `#/gse-live`, `#/stock/<SYM>`, `#/market-trends` | Everyone |
| Fuel pump report (read-only) and FX rates with converter | `#/fuel`, `#/fx` | Everyone |
| Articles and single article with comments | `#/articles`, `#/articles/<slug>` | Read: everyone · comment: members |
| Forum categories, threads, replies | `#/forum`, `#/forum/c/<category>`, `#/forum/t/<id>`, `#/forum/new` | Read: everyone · post: members |
| Account: sign in, register, reset, settings | `#/login`, `#/register`, `#/reset-password`, `#/settings` | Members |
| Public profile | `#/u/<username>` | Everyone |

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
npm run build    # type-check and create dist/
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

`wrangler.jsonc` records the project name and output directory. The whole site is static:
every write goes to the Fluid backend with the member's Firebase token, so the Pages project
needs no Functions and no server-side secrets. Set the `VITE_FIREBASE_*` and `VITE_API_BASE_URL`
build variables in the Pages project. Pages serves the app's hash routes directly and falls back
to `index.html` for SPA paths.

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
