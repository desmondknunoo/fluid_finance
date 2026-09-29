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
