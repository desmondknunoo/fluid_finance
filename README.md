# Fluid Finance

Fluid Finance is a standalone React, TypeScript, and Vite market information site for Ghana Stock
Exchange investors. It includes market snapshots, company and price history views, educational
content, and export/share features. Historical stock prices are read from and written to the
configured Supabase `stock_prices` table; the GSE live view uses the app's GSE data service.

## Development

```sh
npm install
npm run dev
```

Vite prints the local URL (normally `http://localhost:5173`).

## Commands

```sh
npm run dev      # start the Vite development server
npm run build    # type-check and create dist/
npm run lint     # run ESLint
npm run preview  # serve the built site locally
```

## Data configuration

The current Supabase project URL and public anonymous key are configured in
`src/lib/supabase.ts`. The browser key is public client configuration; access must be protected by
appropriate Supabase Row Level Security policies. Never put a Supabase service-role key in this
frontend. Historical price features require the `stock_prices` table and policies that allow the
intended reads and upserts.

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

`wrangler.jsonc` records the project name and output directory. This is a static
site: it requires no Pages Functions or server environment variables. Pages
serves the app's hash routes directly and falls back to `index.html` for SPA paths.

For a manual deployment to the existing project:

```sh
npm ci
npm run build
npx wrangler@4 pages deploy dist --project-name=fluid-finance --branch=main
```

The direct-upload project's production branch is `main`; the Wrangler command
above publishes the build from the checked-out `develop` branch to production.
Alternatively, ZIP the contents of `dist` (with `index.html` at the archive root)
and upload it as a production deployment in the Pages dashboard.

Register `finance.fluidterra.com` under the Pages project's **Custom domains**,
then point its DNS CNAME at the hostname Cloudflare assigns to the project
(normally `fluid-finance.pages.dev`). Verify the Pages deployment before replacing
the former Vercel DNS target. The Supabase data configuration remains the same.

## Buy redirect and acceptance

The stock-detail Buy action opens the existing redirect sheet and links to
`https://app.fluidterra.com`; the destination is defined in `src/lib/links.ts`.
The sheet implements Escape dismissal, keyboard focus containment, focus restoration,
and background scroll locking.

Browser acceptance remains pending: open a stock, select Buy, follow Continue and confirm
the investor app opens in a new tab. Reopen and dismiss with Escape; focus should return
to Buy. Check keyboard navigation and scroll restoration on phone and desktop.
