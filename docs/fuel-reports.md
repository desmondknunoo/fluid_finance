# Fluid Pump Report

Open entry point: `https://finance.fluidterra.com/#/fuel-prices` (after deployment).
There are no homepage, navbar or footer links to this page. It renders without the public site navigation and footer.

## Login (none)

There is no sign-in: anyone with the link can record, update and delete reports. Saving without
an open edition inserts a new one; opening an edition and saving overwrites it in place.
`GET`/`POST`/`PUT`/`DELETE /api/fuel-reports` all skip credentials. Git history has the
Basic-auth version (`server/fuel-editor-credentials.ts`, kept out of git) that gated writes.
Change them there and redeploy to rotate access. There is no user database, registration or password-reset screen.
The Cloudflare Pages Function validates the login on every read and save. Credentials remain in browser memory only and refreshing signs the editor out.

## Storage

Reports and the OMC logo library live in the Fluid backend (`fluid-backend`, AWS):
`GET /api/v1/editorial/fuel/reports` and `/fuel/omcs` are public reads; creating, overwriting and
deleting editions (`/api/v1/editorial/desk/fuel/reports`) and uploading logos
(`/desk/fuel/omcs`) require a signed-in operations or admin staff member, whose Firebase ID token
accompanies every request. Logos are stored once, immutably, in the S3 documents bucket under
`editorial/omc-logos/` and served from `/api/v1/editorial/media/omc-logos/<file>`. There are no
Pages Functions and no server-side secrets in this app any more.

The same editor also ships in [`fluid_finance_portal`](../../fluid_finance_portal/README.md) at
the same `#/fuel-prices` hash against the same backend. Keep this copy until the portal is live,
then remove the route from the public site.

## Local testing

`npm run dev` and open `http://localhost:5175/#/fuel-prices`; point `VITE_API_BASE_URL` at a local
backend (`http://localhost:8000/api/v1`) or at production. Enter a report date and prices, upload
company logos, and save. Share opens numbered 1080×1350 PNG previews, with at most 10 OMCs per
image. Every page retains the Fluid Finance logo at the top right, the report date, full-report
averages and the stock report footer. Copy, download and native file sharing operate on the
selected page; use Previous/Next to export the rest.

Leave unavailable prices blank; they become null and render as an em dash. Averages use only
entered prices for the relevant fuel type across the full report. Supplier names must be unique,
and prices must be positive with no more than two decimal places. A report supports 1–500 OMCs.
The most recent 100 editions are listed, ordered by report date and creation time.

## OMC list and logos

Use **Arrangement** and **Apply arrangement** to reorder the draft: A to Z, Z to A, lowest price to highest, highest price to lowest, or Popular. Price modes offer petrol, diesel or premium; unavailable prices stay last in either direction and ties sort alphabetically. Popular uses the owner's explicit 18-company ranking, followed by unranked companies alphabetically. Applying changes the draft only; save a new edition to retain its order across all share pages. Rows do not jump while typing prices; apply again after edits if needed.

The 18 user-supplied defaults are: MISA Energy, Shell, So Energy, Puma Energy, Allied Oil, TotalEnergies, Power Fuels, Pacific, Petrosol, Frontier, Top Oil, Goil, StarOil, Frimps, JP, Zen, ICON and Benab. No additional companies have been added. Their supplied WebP logos are preserved in `public/fuel` and automatically populate the editor. Uploaded library replacements take precedence over bundled defaults. Only the exact bundled paths and the backend's `/editorial/media/omc-logos/` URLs are accepted.

Use **Add OMC**, paste names one per line, or select from the saved library. Upload a PNG, JPG or WebP logo (up to 5 MB); the browser preserves its proportions and prepares a 192×192 PNG. The backend saves the immutable image to S3 and upserts the case-insensitive OMC name into `editorial_omcs`. Public logo reads support canvas rendering; library writes require a staff sign-in. The editor loads the supplied defaults plus saved library additions. Removing an OMC from a report does not remove it from the reusable library.

New reports require every OMC to have a bundled or uploaded logo. Sharing first loads **all** logos across **all** pages and aborts completely on any missing, invalid or failed image. Logos retain their proportions. Old reports without logos remain readable but cannot generate images; use **Open in editor / add missing logos** to fill matching library logos, upload any remaining assets and save a new edition. Replacing a library logo does not alter previously saved reports. Preserve bundled asset filenames and contents for those saved editions.

## Verification

`node --test tests/fuel.test.mjs` checks arithmetic, validation, sorting and pagination.
`npm run build` checks the frontend. The server side is covered by the backend's
`uv run pytest tests/test_editorial_workflow.py` and its fuel validation in
`app/domains/editorial/service.py`.
