# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Fluid Finance visitors follow Ghanaian markets and read the published pump-price reports. Staff enter and publish fuel reports in the separate Fluid Finance Portal.

## Product Purpose

Present financial information and education, with branded images for sharing stock and fuel reports.

## Capabilities and Constraints

The public site shows fuel reports read-only at `#/fuel`; it has no editor. Data entry happens in the Fluid Finance Portal, where staff sign in with Fluid Finance's Firebase project and the backend checks their operations or admin role before any save. Fuel reports live in the Fluid backend on AWS. The app uses React, Vite and Cloudflare Pages.

## Brand Commitments

Preserve the existing Fluid Finance share footer and place the logo at the top left of fuel report images, with no page counter or eyebrow line. The supplied Fluid Pump Report image establishes the report title, date, averages and supplier/price columns. Reports show petrol and diesel prices, followed by separate Petrol % and Diesel % columns comparing each OMC with the previous saved report; premium is no longer shown. The existing app supplies UI styling.

Fuel reports split into pages of ten OMCs with identical branding. Every included OMC must have a working logo before any share image is generated. The user supplied 18 initial OMC names on 7 October 2026; use those exact names and allow additions, removals from reports and uploads of company logos. All 18 user-supplied company logos are bundled in public/fuel; uploaded replacements take precedence for new reports.

## Evidence on Hand

Existing stock share renderers and brand assets live under src/lib and public/logo. Sample prices in the supplied image are illustrative input, not live market data.
