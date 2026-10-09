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

## Storage setup

1. In the **existing** Supabase project `agzazndvqrencvgpovyh`, run `supabase/migrations/202610060001_fuel_reports.sql`, then `supabase/migrations/202610070001_fuel_omcs.sql` in the SQL editor. The second migration adds the OMC library and `omc-logos` storage bucket and expands report capacity.
2. In the Cloudflare Pages `fluid-finance` project, add an encrypted `SUPABASE_SERVICE_ROLE_KEY` binding for that same Supabase project. Never use a `VITE_` prefix or put this key in frontend code.
3. Build and deploy through Wrangler from the repository root so it includes both `functions/api/fuel-reports.ts` and `functions/api/fuel-omcs.ts`. Dashboard drag-and-drop of `dist` alone does not include the functions.

The separate `fuel_reports` table leaves stock tables untouched. Each save inserts one complete, dated edition atomically. No edit or deletion endpoint exists. Row-level security blocks direct anonymous and authenticated browser access. Only the server can read and insert reports.

## Local testing

Build with `npm run build`, then use `npx wrangler@4 pages dev dist`. Supply the service-role key as a local encrypted/dev binding (for example `.dev.vars`, which is gitignored). Plain `npm run dev` serves the UI but cannot execute Pages Functions. Alternatively, run Pages on port 8788 alongside Vite; Vite proxies `/api` to that port.

Open `http://localhost:8788/#/fuel-prices`, log in with the code-defined credentials, enter a report date and prices, upload company logos, and save. Share opens numbered 1080×1350 PNG previews, with at most 10 OMCs per image. Every page retains the Fluid Finance logo at the top right, the report date, full-report averages and the stock report footer. Copy, download and native file sharing operate on the selected page; use Previous/Next to export the rest.

Leave unavailable prices blank; they become null and render as an em dash. Averages use only entered prices for the relevant fuel type across the full report. Supplier names must be unique, and prices must be positive with no more than two decimal places. A report supports 1–500 OMCs. The most recent 100 editions are listed, ordered by report date and creation time.

## OMC list and logos

Use **Arrangement** and **Apply arrangement** to reorder the draft: A to Z, Z to A, lowest price to highest, highest price to lowest, or Popular. Price modes offer petrol, diesel or premium; unavailable prices stay last in either direction and ties sort alphabetically. Popular uses the owner's explicit 18-company ranking, followed by unranked companies alphabetically. Applying changes the draft only; save a new edition to retain its order across all share pages. Rows do not jump while typing prices; apply again after edits if needed.

The 18 user-supplied defaults are: MISA Energy, Shell, So Energy, Puma Energy, Allied Oil, TotalEnergies, Power Fuels, Pacific, Petrosol, Frontier, Top Oil, Goil, StarOil, Frimps, JP, Zen, ICON and Benab. No additional companies have been added. Their supplied WebP logos are preserved in `public/fuel` and automatically populate the editor. Uploaded library replacements take precedence over bundled defaults. Only the exact bundled paths and approved Supabase logo URLs are accepted.

Use **Add OMC**, paste names one per line, or select from the saved library. Upload a PNG, JPG or WebP logo (up to 5 MB); the browser preserves its proportions and prepares a 192×192 PNG. The authenticated server saves the immutable image to Supabase Storage and upserts the case-insensitive OMC name into `fuel_omcs`. Public logo reads support canvas rendering; library writes require the code-defined login. Each login loads the supplied defaults plus saved library additions. Removing an OMC from a report does not remove it from the reusable library.

New reports require every OMC to have a bundled or uploaded logo. Sharing first loads **all** logos across **all** pages and aborts completely on any missing, invalid or failed image. Logos retain their proportions. Old reports without logos remain readable but cannot generate images; use **Open in editor / add missing logos** to fill matching library logos, upload any remaining assets and save a new edition. Replacing a library logo does not alter previously saved reports. Preserve bundled asset filenames and contents for those saved editions.

## Verification

`node --test tests/fuel.test.mjs` checks arithmetic, validation and server authentication, using mocked storage. `npm run build` checks the frontend. Check the function separately with:

```sh
npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --lib ES2022,DOM --skipLibCheck --strict functions/api/fuel-reports.ts functions/api/fuel-omcs.ts
```

The migration and Cloudflare binding must be configured before live persistence can be verified.
