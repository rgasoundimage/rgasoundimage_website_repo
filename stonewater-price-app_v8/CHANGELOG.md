# Changelog — Stonewater / RGA Price Catalogue

All notable changes to the app, newest first. Each release is tagged with the
**service-worker cache name** (`stonewater-vN`) so you can match an entry to the
build that's live on Netlify. Versions loosely follow semantic versioning.

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
