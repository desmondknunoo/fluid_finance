# Buy → trading app

The existing Buy action and redirect sheet are enabled in
`src/components/stock/stock-detail.tsx`. The destination remains
`https://app.fluidterra.com`, defined in `src/lib/links.ts`.

The sheet supports Escape, keyboard focus containment, focus restoration,
and background scroll locking. Existing component styling is preserved.

`npm run build` passes. Browser acceptance is still pending: open a stock,
select Buy, follow Continue, and confirm the trading app opens in a new tab.
Close with Escape and confirm focus returns to Buy. Remove this activation
note after deployed acceptance is complete.
