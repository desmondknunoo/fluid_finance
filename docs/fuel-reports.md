# Fluid Pump Report

Public entry point: `https://finance.fluidterra.com/#/fuel` (read-only). It is linked from the
front page's pump rail and renders inside the normal site chrome.

Staff enter, update, delete and share editions in the separate
[`fluid_finance_portal`](../../fluid_finance_portal/README.md) behind Firebase staff sign-in. The
editor that used to ship on this site at a direct hash URL has been removed now that the portal is
live; this app no longer contains any fuel data-entry screen.

## What this app holds

- `src/components/ui/fuel-public-page.tsx`: the public `#/fuel` page. It lists published editions,
  shows per-fuel averages and opens the share sheet.
- `src/components/stock/fuel-share-sheet.tsx` and `src/lib/fuel-share-card.ts`: the branded
  1080×1350 PNG share pages (at most 10 OMCs per image). Each page has the Fluid Finance logo top
  left; an "AVERAGE · GHS / LITRE" block with petrol and diesel stacked in the top right; "FLUID
  PUMP" over "REPORT" with the report date right-aligned on the REPORT line; the price and % change columns; a right-aligned "% change
  vs <date>" line under the table; and the stock report footer. Copy, download and native file sharing
  operate on the selected page; use Previous/Next in the share sheet to export the rest.
- `src/lib/fuel-prices.ts`: types, validation, averages, sorting, pagination, the 18 bundled OMC
  defaults, the Popular ranking and logo URL rules. The portal's editor shares this module.
- `src/lib/fuel-reports.ts`: the desk API client (list, save, update, delete, OMC library, logo
  upload). Nothing on the public site calls it any more; it is kept as the shared client the portal
  mirrors.
- `public/fuel`: the 18 user-supplied WebP OMC logos. Preserve their filenames and contents, since
  saved editions reference those exact paths.

## Storage

Reports and the OMC logo library live in the Fluid Finance backend (`fluid_finance_backend`, AWS):
`GET /api/v1/editorial/fuel/reports` and `/fuel/omcs` are public reads; creating, overwriting and
deleting editions (`/api/v1/editorial/desk/fuel/reports`) and uploading logos
(`/desk/fuel/omcs`) require a signed-in operations or admin staff member, whose Firebase ID token
accompanies every request. Logos are stored once, immutably, in the S3 documents bucket under
`editorial/omc-logos/` and served from `/api/v1/editorial/media/omc-logos/<file>`. There are no
Pages Functions and no server-side secrets in this app.

## Data rules (shared with the portal)

Reports carry petrol and diesel only. Premium was dropped in October 2026; older editions may
still hold premium prices, which are no longer entered or shown. In its place each report has two
change columns, **Petrol %** and **Diesel %**: each OMC's price for that fuel against the same OMC,
matched by name, in the previous saved edition. The previous edition is the latest one dated on or before the report, and for a
same-day edition the one saved before it. Changes round to one decimal place. A dash means the OMC
or that fuel's price is missing from either edition. Rises show in rose and falls in green. The
editor, the public `#/fuel` page, the share images and the home page averages all use this rule
(`fuelPriceChange`, `previousFuelReport` and `fuelRowChange` in `src/lib/fuel-prices.ts`).

Unavailable prices are null and render as an em dash. Averages use only entered prices for the
relevant fuel type across the full report. Supplier names must be unique, and prices must be
positive with no more than two decimal places. A report supports 1–500 OMCs. The most recent 100
editions are listed, ordered by report date and creation time.

The 18 user-supplied defaults are: MISA Energy, Shell, So Energy, Puma Energy, Allied Oil,
TotalEnergies, Power Fuels, Pacific, Petrosol, Frontier, Top Oil, Goil, StarOil, Frimps, JP, Zen,
ICON and Benab. Popular order is the owner's explicit 18-company ranking, followed by unranked
companies alphabetically. Only the exact bundled logo paths and the backend's
`/editorial/media/omc-logos/` URLs are accepted. Uploaded library replacements take precedence over
bundled defaults for new editions; replacing a library logo does not alter previously saved reports.

Sharing first loads **all** logos across **all** pages and aborts completely on any missing,
invalid or failed image. Old editions without logos remain readable on `#/fuel` but cannot
generate images until a staff member re-saves them with logos in the portal.

## Local testing

`npm run dev` and open `http://localhost:5175/#/fuel`; point `VITE_API_BASE_URL` at a local backend
(`http://localhost:8001/api/v1`) or at production. Published editions should list with averages,
and Share should open the numbered PNG previews.

## Verification

`node --test tests/fuel.test.mjs` checks arithmetic, validation, sorting and pagination.
`npm run build` checks the frontend. The server side is covered by the backend's
`uv run pytest tests/test_editorial_workflow.py` and its fuel validation in
`app/domains/editorial/service.py`.
