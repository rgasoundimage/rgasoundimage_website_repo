# RGA Prices (Stonewater / Kasper price app)

Installable PWA price catalogue and quote builder, served at
rgapricelist.netlify.app (Netlify site `rgapricelist`, base directory
`stonewater-price-app`).

## Where the prices live

Prices are edited in **Supabase**, but the app never reads Supabase while
someone is viewing it. Each Netlify build (`scripts/build-catalog.mjs`) reads
Supabase once and writes:

- `site/prices.json`: public, **customer prices only** (MSRP / MRP), served from the CDN.
- `netlify/generated/catalog-full.mjs`: every price, bundled into the
  `prices-full` function. It's returned only to someone who enters the dealer
  passcode (`PRICE_PASSCODE`, checked on the server).

If Supabase can't be read, the build fails and the previous deploy stays live.
The app also keeps its last copy on each phone and refreshes it in the
background, so a slow or dropped connection doesn't blank the screen.

| Table / view | What it holds |
|---|---|
| `products` | Shared product catalogue. `category_id` is the product **type** (barcode prefix); `price_group_id` is where it appears in the price app; `status` = `active` shows it. |
| `price_groups` | The price-list heading + group per brand (e.g. Commercial → In Ceiling Speakers). |
| `product_prices` | Only the prices that were typed into Excel, one row per product per list. |
| `price_catalog` (view) | Every price the app shows, calculated with the Excel formulas. |

Typed-in prices per list:

| List | Brand | You enter | Calculated |
|---|---|---|---|
| Price List (`praveen`) | Stonewater | MSRP, Distributor price (tax incl.) | List price (MSRP ÷ 1.18, rounded up to ₹10, recalculated only when MSRP changes), Dealer, Sub-dealer, MSRP discounts, margins |
| Dist / Dealer (`distdealer`, internal) | Stonewater | MSRP, Distributor price (pre-tax) | List price (as above), Dealer, Sub-dealer, Distributor tax incl., MSRP discounts, margins |
| Price List (`kasper`) | Kasper | MRP (tax incl.) | Dist RGA, Dealer, List + Tax, margins |

## Editing prices

Open **Settings → Edit products & prices** in the app (or `/admin.html`) and
enter the admin passcode. Save your edits, then press **Publish**. That rebuilds
the site, and the app shows the changes about 1–2 minutes later. The screen tells
you when there are unpublished changes. Labels,
roles and which lists exist are configured in `netlify/lib/catalog.mjs`.

## Face ID / Touch ID unlock (v2.7.0)

Opt-in per device, on iOS / macOS 18+. After a passcode unlock the app offers to turn it on
(or Settings → Face ID / Touch ID). Turned on, the passcode and the full catalogue are kept
**encrypted** in `localStorage` (`sw_vault`) under a key that only exists after Face ID / Touch ID
succeeds (a WebAuthn passkey's PRF secret, `site/bio.js`). Locked, the phone holds only ciphertext;
unlocking is one tap and works offline. The server passcode (`PRICE_PASSCODE`) is unchanged and
still checked on every online unlock: change it and enrolled devices fall back to the passcode
sheet automatically.

- Auto-lock: on a cold start, and after 5 minutes in the background (`BIO_AUTOLOCK_MS` in `app.js`).
- The encrypted copy is refreshed when the app locks (Lock, auto-lock, going to the background).
- Each device enrols separately; the Home Screen app and a Safari tab have separate storage.
  Each enrolment adds one passkey to iOS Passwords. Devices without PRF never see the option.
- A device that hasn't turned it on behaves exactly as before.
- If you add a file the app loads, add it to `ASSETS` in `site/sw.js` or it breaks offline only
  (`bio.js` is listed there).
- Details: `docs/PRD-v2.7.0-biometric-unlock.md`. The on-iPhone checks that automated tests can't
  do are in `docs/HANDOFF-v2.7.0-biometric-unlock.md` §5.

## Netlify environment variables (site `rgapricelist`)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (secret; used by the build and the admin screen)
- `ADMIN_PASSCODE` (secret; the admin screen's passcode)
- `PRICE_PASSCODE` (secret; unlocks dealer / sub-dealer / internal views and the Quote Builder)
- `BUILD_HOOK_URL` (the site's "Price admin: Publish" build hook)

## Database scripts

`supabase/001_price_tables.sql` creates the tables, views and functions;
`supabase/002_seed.sql` imported the Excel data (2026-10-05);
`supabase/003_editable_msrp.sql` makes MSRP the typed Stonewater price. All are
safe to re-run, except that re-running 002 after 003 resets typed MSRPs to the
Excel-derived ones. Change the schema with a new numbered file.

## Development

    npm install
    npm test        # includes a rehearsal of the SQL against a copy of the live catalogue
    npm run build   # needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY; writes site/prices.json
    npm run dev     # static preview of site/ (run the build first); /api needs `netlify dev`
