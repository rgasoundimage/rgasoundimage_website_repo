# Stonewater / RGA Price Catalogue — PWA

An installable, offline-capable phone app for looking up product prices across
RGA Sound Image brands (Stonewater, Kasper, …). Pure static files served from a
`site/` folder; deployed to Netlify from Git. No backend, no login.

Live: **stonewaterproductprice.netlify.app**

---

## Repo layout

```
stonewater-price-app/
├── netlify.toml          Netlify build config (publish=site, stamps cache version)
├── package.json          local convenience scripts (build / data / dev)
├── build_prices.py       generates site/prices.json from the Excel sheets
├── scripts/
│   └── stamp-cache.mjs    rewrites sw.js cache name per deploy (anti-stale)
├── data/                 source spreadsheets (.xlsx) live here
└── site/                 ← THIS is what Netlify publishes
    ├── index.html  styles.css  app.js
    ├── prices.json       generated data (committed)
    ├── sw.js  manifest.webmanifest
    └── icons/
```

The `site/` folder is the deployable app. Everything outside it is tooling.

---

## Everyday workflow (VS Code → commit → push → Netlify deploys)

This mirrors how the rest of the `rgasoundimage` repo works.

**Change app code or styling** (`site/index.html`, `site/styles.css`, `site/app.js`):
edit → commit → push. Netlify rebuilds and stamps a fresh service-worker cache
from the commit SHA, so phones pick up the new build on next open. You never
touch the cache version by hand.

**Change prices** (a sheet changed):
```bash
cd stonewater-price-app
python build_prices.py            # regenerates site/prices.json
git add site/prices.json data/*.xlsx
git commit -m "Update prices wef <date>"
git push
```

**Change the passcode:** edit `PASSCODE` near the top of `site/app.js`, commit, push.

**Add a brand:** drop the workbook in `data/`, add a column-mapping block in
`build_prices.py`, run `python build_prices.py`, commit `site/prices.json` +
the sheet, push.

### Local preview (optional)
```bash
npm run dev      # serves site/ at http://localhost:5000
```

---

## One-time Netlify setup

You already have the `rgasoundimage` repo connected to Netlify. To serve this app
from a **subfolder** of that repo without disturbing the existing company site:

1. **Commit this folder** (`stonewater-price-app/`) to the repo and push.
2. In Netlify, open the existing **stonewaterproductprice** site →
   **Site configuration → Build & deploy → Continuous deployment**.
3. **Link the repository** to `rgasoundimage` (this switches the site from
   drag-and-drop to Git, and keeps the same URL + existing home-screen installs).
4. Set **Base directory** = `stonewater-price-app`.
   Netlify then reads `stonewater-price-app/netlify.toml`, which already sets
   `publish = "site"` and the cache-stamp build command. Leave publish/command
   blank in the UI — the toml wins.
5. Trigger a deploy. Future pushes to `main` redeploy automatically.

> Prefer a brand-new site instead of relinking? Same steps via
> **Add new site → Import from Git → pick `rgasoundimage` → Base directory =
> `stonewater-price-app`** — but you'll get a new URL, and existing home-screen
> installs keep pointing at the old one. Relinking the existing site avoids that.

---

## Install on iPhone (home-screen app)
1. Open the site URL in **Safari**.
2. **Share → Add to Home Screen → Add.** Launches full-screen, works offline.

---

## Why the cache auto-bumps
The service worker is **network-first** with a named cache. If two deploys share
a cache name, phones can serve a stale build. `scripts/stamp-cache.mjs` runs on
every Netlify build and sets the cache name to `stonewater-<commitSHA>`, so each
deploy is guaranteed fresh. This replaces the old "remember to bump `stonewater-vN`
by hand" step.

## Notes / limitations
- Passcode is a **deterrent**, not auth — it's readable in page source.
- Settings are global by role/field, not per-brand.
- Read-only (no in-app price editing yet).

Prices effective **01 Apr 2026** (Stonewater).
