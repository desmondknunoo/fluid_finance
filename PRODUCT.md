# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Fluid Finance visitors follow Ghanaian markets. Fuel report editors enter supplier prices and save and share dated reports.

## Product Purpose

Present financial information and education, with branded images for sharing stock and fuel reports.

## Capabilities and Constraints

The fuel editor is available by direct hash URL only and has no links from the public landing page, navigation or footer. A fixed username and password in server code control access; users cannot register or change these credentials. Fuel reports use their own table in the existing Supabase project. The app uses React, Vite and Cloudflare Pages.

## Brand Commitments

Preserve the existing Fluid Finance share footer and place the logo at the top right of fuel report images. The supplied Fluid Pump Report image establishes the report title, date, averages and supplier/price columns. The existing app supplies UI styling.

Fuel reports split into pages of ten OMCs with identical branding. Every included OMC must have a working logo before any share image is generated. The user supplied 18 initial OMC names on 7 October 2026; use those exact names and allow additions, removals from reports and uploads of company logos. All 18 user-supplied company logos are bundled in public/fuel; uploaded replacements take precedence for new reports.

## Evidence on Hand

Existing stock share renderers and brand assets live under src/lib and public/logo. Sample prices in the supplied image are illustrative input, not live market data.
