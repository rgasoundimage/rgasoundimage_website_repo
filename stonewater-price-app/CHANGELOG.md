# Changelog — Stonewater / RGA Price Catalogue

All notable changes to the app, newest first. Each release is tagged with the
**service-worker cache name** (`stonewater-vN`) so you can match an entry to the
build that's live on Netlify. Versions loosely follow semantic versioning.

---

## [2.3.1] — Icon cache fix — 2026-07-23 · cache `stonewater-<commitSHA>`
Patch. v2.3.0 shipped new icons under their existing filenames, but
`netlify.toml` served `/icons/*` with `max-age=31536000, immutable` — which
tells the browser never to revalidate. Anyone who had opened the app before
kept the old amber icons regardless of the deploy.

### Fixed
- Icon URLs now carry `?v=2.3.0` in `index.html`, `manifest.webmanifest` and the
  service-worker precache list. A changed URL is the only thing that escapes an
  `immutable` cache entry that a client already holds.
- `netlify.toml` `/icons/*` changed from `max-age=31536000, immutable` to
  `max-age=86400, must-revalidate`. `immutable` is only correct for
  content-hashed filenames; these names are stable across releases, so the old
  header would have hidden every future icon change for a year too.

### Note
iOS still will not repaint the icon of an existing home-screen shortcut — that
is a springboard cache, separate from HTTP. Delete and re-add the shortcut.

---

## [2.3.0] — Light theme, RGA logo, renamed to RGA Prices — 2026-07-23 · cache `stonewater-<commitSHA>`
Visual refresh to the RGA brand palette. Presentation layer only — no pricing
data, role gating, or Quote Builder logic changed.

### Changed
- **Light theme.** White surfaces, `#141943` navy text throughout. The `:root`
  token names are unchanged and were simply re-pointed, so ~300 of the 334
  stylesheet rules needed no edit. `--amber` is now navy; it kept its name
  because it still marks the accent role.
- **App renamed to RGA Prices.** Five user-facing strings: browser title, iOS
  home-screen title, and the manifest `name` / `short_name` / `description`.
  The app covers both Stonewater and Kasper, so naming it after one brand was
  wrong. **The product ranges keep their names everywhere** — brand switcher,
  price-list labels, quote tags and `prices.json` are untouched.
- **RGA logo** added, centred in the top bar. `.topbar` changed from flex to a
  `1fr auto 1fr` grid to hold it.
- **Icons** regenerated in the brand palette. The meter-bar mark is kept — only
  its colours change. Adds a proper full-bleed maskable icon; the manifest
  previously pointed its `maskable` entry at the rounded-corner tile, which
  Android crops into on circular masks.
- **Semantic colours re-tuned for white.** `--ok` `#3FB97E` → `#157F4F`,
  `--danger` `#E5564B` → `#B3261E`. The originals scored 2.48:1 and 3.64:1 on
  white and failed WCAG AA. Meanings and selectors are unchanged.
- **Active tab** inverts to a solid navy fill. The old surface lift was an 8%
  tint against pure white and did not read.
- `--muted2` raised from 45% to 60% navy — at 45% the footer, breadcrumbs and
  sub-labels rendered 2.87:1 and failed AA.
- `apple-mobile-web-app-status-bar-style` `black-translucent` → `default`.
  iOS draws the status bar over the app background; on a white top bar that
  rendered white-on-white and the clock disappeared.

### Added
- `--warn` / `--warn-soft` / `--warn-dim` tokens for the duplicate-add notice,
  which could no longer borrow `--amber` once that became navy. It stays amber.
- Visible `:focus-visible` rings on all interactive controls. The dark theme
  signalled focus with a border tint that is invisible on white.
- `color-scheme: light` in `:root`, so native pickers and scrollbars match.

### Removed
- **The effective-date pill.** With the date, the top-right block measured
  166 px, exceeded its grid share below 390 px and pushed the logo off centre —
  overlapping the brand name at 320 px. Removing it leaves the ⚙ alone at 34 px
  and the header centres cleanly from 320 px up. `effectiveDate` remains in
  `prices.json`; it is simply no longer displayed.

### Notes
- **iOS will not refresh the icon or label of an already-installed home-screen
  shortcut.** Anyone with the app pinned keeps the old dark icon and the
  "Stonewater" label until they delete and re-add it. Nothing breaks —
  `start_url` and `scope` are unchanged, so this is a rename, not a new app.
- The repo folder and `package.json` `name` stay `stonewater-price-app`:
  Netlify's **Base directory** setting points at that path, and renaming the
  folder would break the build until the dashboard is changed by hand.

---

## [2.2.1] — Quote Builder: no duplicate lines — 2026-06-23 · cache `stonewater-<commitSHA>`
Bug fix (see `BUGS.md` → BUG-001).

### Fixed
- Adding the same product to a quote no longer creates duplicate lines. One line
  per product; use the line's **Qty** field for multiples.
- The product picker now marks already-added products with a dimmed **✓ Added**
  state (not re-addable), and re-tapping shows an amber "already in the quote —
  adjust its Qty instead" notice. Removing a line frees the product to be re-added.

### Added
- **`BUGS.md`** — a lightweight bug log (this is the first entry).

---

## [2.2.0] — Quote Builder (internal) — 2026-06-20 · cache `stonewater-<commitSHA>`
Adds an internal quote-building tool alongside the catalogue. Front-end only;
no data-model or `prices.json` changes.

### Added
- **Quote tab** — a Catalogue / Quote switcher under the level meter. The Quote
  tool is **internal**, gated behind the existing passcode (same one as the
  Dealer/Internal views). Locked until unlocked; relocking bounces back to Catalogue.
- **Quote Builder**:
  - **Add product** picker that searches across **both brands** (public lists);
    tap to add, add several in one go.
  - Per line: a **Compare-to** selector (**Retail** = MSRP/MRP per brand, or
    **Dealer**), the resolved baseline, a **custom unit price**, and **quantity**.
  - Per line: **line total**, **margin ₹**, and **margin %** (profit margin =
    `(price − baseline) ÷ price`), colour-coded (green positive / red negative).
  - **Mixed-brand quotes** (Stonewater + Kasper together) in one total.
  - **Summary bar**: total at your prices, total baseline, **total margin ₹** and
    **blended margin %** (computed on totals).
  - Un-priced lines are excluded from totals until a price is entered.
  - **In-memory only** — one working quote; nothing is saved and it does not
    survive a reload. No client-facing/export output (internal concept).

### Notes
- No passcode/role/data changes. Files touched: `site/index.html`, `site/app.js`,
  `site/styles.css`.

---

## [2.1.0] — Repo + Git/Netlify deploy — 2026-06-13 · cache `stonewater-<commitSHA>`
Infrastructure release. No app-behaviour changes; restructured for version
control and continuous deployment from the `rgasoundimage` repo.

### Added
- **Repo structure**: app moved into `site/` (the Netlify publish folder);
  tooling (`build_prices.py`, `scripts/`, `data/`) sits alongside it.
- **`netlify.toml`** — `publish = "site"`, Node build that stamps the cache.
- **`scripts/stamp-cache.mjs`** — sets the service-worker cache name to
  `stonewater-<commitSHA>` on every deploy. **Manual `stonewater-vN` bumping is
  gone**; stale-cache risk is eliminated at the source.
- **`package.json`** local scripts: `build`, `data`, `dev`.
- **`.gitignore`**; `data/README.md` documenting where the spreadsheets go.

### Changed
- `build_prices.py` now uses paths relative to itself (`data/` → `site/prices.json`)
  instead of the old sandbox upload paths, so it runs from any machine.
- Deploy is now **commit → push → Netlify auto-deploy**, replacing drag-and-drop.

---

## [2.0.0] — Multi-brand — 2026-06-12 · cache `stonewater-v5`
Phase 2. Turned the single-brand app into a multi-brand catalogue.

### Added
- **Brand switcher** in the top-left header (replaces the static brand title).
  Selecting a brand swaps the entire catalogue, its price lists, the effective-date
  pill, and the category layout. Last-used brand is remembered on the device.
- **Kasper** added as a second brand (from `Kasper_Professional_Audio_Price_List_2026.xlsx`).
- Per-brand **effective date** shown in the header pill.
- Flat-category rendering: brands with no top-level grouping render without a
  redundant category header.

### Changed
- Data model restructured to **brands → lists → categories → subcategories → products**
  (previously a single brand's `lists`).
- Customer view label changed from "Customer · MSRP" to **"Customer · retail"** so it
  reads correctly for brands that use MRP (Kasper) instead of MSRP (Stonewater).
- Internal price grid now highlights **MRP** in amber as well as MSRP.
- Collapse (expanded/closed) state is now stored **per brand + list**.

### Notes
- Kasper has no sub-dealer tier → the Sub-dealer view falls back to retail (MRP) for Kasper.
- The internal-only **Dist / Dealer** list remains **Stonewater-only**.
- PRD consolidated to **v1.0** (supersedes v0.3).
- Known constraint: *Views* and *Prices shown* settings remain global by role/field
  (shared across brands).

---

## [1.3.0] — Per-product price selection — 2026-06-11 · cache `stonewater-v4`

### Added
- **"Prices shown"** section in Settings: a checkbox per price field to choose which
  price rows appear on each product, with an **All / None** shortcut.
- The price-field list reflects the price list currently being viewed.

### Changed
- Product price rendering now hides any unchecked fields. Selection is still **bounded
  by the active view** — e.g. a customer can't reveal dealer/cost prices by ticking them.
- Settings choices persist on the device.

---

## [1.2.0] — Passcode reveal, View settings, internal-only gating — 2026-06-11 · cache `stonewater-v3`

### Added
- **Show / Hide passcode** toggle on the passcode prompt.
- **Settings panel** (⚙ gear, top-right) → *Views in dropdown*: enable/disable which
  views (Customer / Dealer / Sub-dealer / Internal) appear in the View dropdown
  (at least one must stay on).
- **Locked-view panel**: when the only available view is gated and not yet unlocked,
  a clean "Enter passcode" screen is shown instead of an empty list.

### Changed
- **Dist / Dealer** list is now shown **only in the unlocked "Internal · all" view** —
  it no longer appears in the Dealer or Sub-dealer views, and disappears on Lock.
- The View dropdown is now generated dynamically from the enabled views (was hardcoded).
- Passcode field switched to a text-friendly keyboard.

---

## [1.1.1] — Offline cache fix — 2026-06-11 · cache `stonewater-v2`
Resolved redeploys not appearing on the installed PWA.

### Fixed
- Reworked the service worker from **cache-first to network-first** (fresh files when
  online, cache only as an offline fallback), which fixed the stale-cache problem where
  Netlify redeploys didn't show up.

### Added
- Auto-reload when a new version takes over (service-worker `controllerchange`), so
  updates appear without a manual hard refresh.
- Cache versioning convention (`stonewater-vN`) so each deploy invalidates the old cache.

---

## [1.1.0] — Rename & internal-only price list — 2026-06-11 · cache `stonewater-v1`

### Changed
- Renamed the first price list **"Praveen Price List" → "Price List"**.
- **Dist / Dealer** price list hidden by default; appears in the price-list dropdown
  only after the passcode is entered (later tightened to Internal-view-only in 1.2.0).

> Note: this iteration did not bump the cache version, which contributed to the stale
> cache observed on Netlify and was addressed in 1.1.1.

---

## [1.0.0] — Phase 1 MVP — 2026-06-11 · cache `stonewater-v1`
First working app, built from `Master_price_list_Stonewater_com_pro_wef_01_04_2026.xlsx`.

### Added
- Installable **PWA**: web manifest, service worker (offline), iOS home-screen icon,
  full-screen standalone mode, "Eff. 01 Apr 2026" date pill.
- **Two Stonewater price lists** (public list + Dist/Dealer) selectable via dropdown.
- **Role views** — Customer (MSRP), Dealer, Sub-dealer, Internal — with the sensitive
  views gated behind a single shared **passcode** (`stonewater`); **Lock** button to
  drop back to Customer.
- **Search** by model and description with category breadcrumbs.
- **Collapsible category browse** mirroring the spreadsheet grouping
  (Commercial / PRO AUDIO → sub-groups).
- ₹ **Indian number formatting**; margins displayed as percentages.
- Matte-black "rack-gear" theme with an amber level-meter motif and monospace
  (tabular) price numerals.
- Deployable as a static folder to Netlify (drag-and-drop).

### Fixed (during initial build)
- Category grouping: sub-headers that carried `0` values (instead of blanks) were being
  read as products — corrected so groups like Wall Mount, Pendant, Subwoofers parse.
- Passcode modal showing on load (a `display:flex` rule overrode the `hidden` attribute).
- Large empty gap between the controls and the search bar (sticky-position offset).
- Duplicate clear "✕" on the search field (native control hidden in favour of the styled one).

---

### Legend
- **Added** — new features.
- **Changed** — changes to existing behaviour.
- **Fixed** — bug fixes.
- **cache `stonewater-vN`** — the service-worker cache name for that build; bumping it
  forces clients to pick up the new files on next load.
