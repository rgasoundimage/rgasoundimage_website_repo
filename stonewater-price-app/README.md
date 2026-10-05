# RGA Prices (Stonewater / Kasper price app)

Installable PWA price catalogue and quote builder, served at
rgapricelist.netlify.app (Netlify site `rgapricelist`, base directory
`stonewater-price-app`).

## Where the prices live

Since v2.6.0 prices are in **Supabase**, not Excel. The app loads them from
`/api/prices` on every visit; the service worker keeps the last good copy for
offline use.

| Table / view | What it holds |
|---|---|
| `products` | Shared product catalogue. `category_id` is the product **type** (barcode prefix); `price_group_id` is where it appears in the price app; `status` = `active` shows it. |
| `price_groups` | The price-list heading + group per brand (e.g. Commercial → In Ceiling Speakers). |
| `product_prices` | Only the prices that were typed into Excel, one row per product per list. |
| `price_catalog` (view) | Every price the app shows, calculated with the Excel formulas. |

Typed-in prices per list:

| List | Brand | You enter | Calculated |
|---|---|---|---|
| Price List (`praveen`) | Stonewater | List price (pre-tax), Distributor price (tax incl.) | Dealer, Sub-dealer, MSRP and its discounts, margins |
| Dist / Dealer (`distdealer`, internal) | Stonewater | List price (pre-tax), Distributor price (pre-tax) | Dealer, Sub-dealer, Distributor tax incl., MSRP, margins |
| Price List (`kasper`) | Kasper | MRP (tax incl.) | Dist RGA, Dealer, List + Tax, margins |

## Editing prices

Open **Settings → Edit products & prices** in the app (or `/admin.html`) and
enter the admin passcode. Changes show in the app on the next reload. Labels,
roles and which lists exist are configured in `netlify/lib/catalog.mjs`.

## Netlify environment variables (site `rgapricelist`)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (secret)
- `ADMIN_PASSCODE` (secret; the admin screen's passcode, checked server-side)

## Database scripts

`supabase/001_price_tables.sql` creates the tables, views and functions;
`supabase/002_seed.sql` imported the Excel data (2026-10-05). Both are safe to
re-run. Change the schema with a new numbered file.

## Development

    npm install
    npm test        # includes a rehearsal of the SQL against a copy of the live catalogue
    npm run dev     # static preview only; /api needs `netlify dev` with the env vars above
