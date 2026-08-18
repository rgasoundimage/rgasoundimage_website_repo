# Bug Log — Stonewater / RGA Price Catalogue

A running log of bugs and behaviour fixes, newest first. This is **not** a PRD —
it's a lightweight tracker. Each entry records what was wrong, how to reproduce
it, what was expected, and how it was fixed.

**Status key:** `OPEN` · `IN PROGRESS` · `FIXED` · `WON'T FIX`
**Severity:** `LOW` · `MEDIUM` · `HIGH` · `CRITICAL`

---

## BUG-004 — Quote summary bar shows product cards through it
- **Status:** FIXED
- **Severity:** MEDIUM (misreads as a broken/overlapping overlay)
- **Found:** 2026-08-18, owner testing on device and desktop
- **Area:** Quote Builder → summary bar (`.qbar`)
- **Fixed in:** v2.5.1 · `site/styles.css`

**Reproduce**
1. Quote tab, unlock, add three or more products so the list scrolls.
2. Scroll and watch the sticky totals bar at the bottom.

**Expected**
The totals bar is a solid card; nothing behind it is visible through it.

**Actual**
Product card text (model, fields, line totals) showed through the bar, so it
looked like the summary was colliding with the last card.

**Root cause**
Not a z-index or sticky-offset problem — the bar was positioned correctly. Its
fill was `var(--surface2)` = `rgba(20,25,67,.04)`, i.e. 96% transparent, so cards
scrolling behind the sticky bar were visible through it.

**Fix**
Opaque fill: `.qbar{background:#F4F5F8}` (the same navy-4%-on-white tint,
flattened to solid). The bar stays in normal flow, so the last card can still
scroll clear above the bar's resting position; no spacer was needed. Border and
lift shadow unchanged.

---

## BUG-003 — Add-product sheet slides down as results narrow
- **Status:** FIXED
- **Severity:** MEDIUM (the search field moves under the user while typing)
- **Found:** 2026-08-18, owner testing on device and desktop
- **Area:** Quote Builder → product picker sheet (`#pickResults`)
- **Fixed in:** v2.5.1 · `site/styles.css`

**Reproduce**
1. Quote tab → **+ Add product**.
2. Type a broad term (many matches), then add characters to narrow to a few.

**Expected**
The title and search field stay put; only the results list changes.

**Actual**
The whole upper block (title, subtitle, search field) dropped downward as the
match count fell, and rose again as it grew.

**Root cause**
Not "results pushing content." The modal is bottom-anchored
(`.modal{align-items:flex-end}`) and the sheet height was content-driven
(`.sheet-scroll{max-height:86vh}`, `.pickresults{max-height:48vh}`). Fewer
results → shorter list → shorter sheet, and because the sheet is pinned at its
**bottom** edge the shrink came off the **top**, moving the header and field.

**Fix**
Give the results region a **fixed** height so the sheet's overall height — and
therefore the field's position — is constant: `#pickResults{height:46vh}`.
Scoped by id, so the settings modal (also `.sheet-scroll`) is untouched.

---

## BUG-002 — Picker search text and field boundary vanish on focus
- **Status:** FIXED
- **Severity:** MEDIUM (usability; the field is the sheet's primary control)
- **Found:** 2026-08-18, owner testing on device
- **Area:** Quote Builder → product picker search (`#pickSearch`)
- **Fixed in:** v2.5.1 · `site/styles.css`

**Reproduce**
1. Quote tab → **+ Add product** (the field is focused automatically).
2. Type any characters.

**Expected**
Typed text is solid navy on white and the field has a clear edge.

**Actual**
On focus the typed text was hard to read and the field lost its outline against
the sheet.

**Root cause**
On focus the field swapped its white fill for the sheet's own tint:
`#pickSearch:focus{background:var(--surface2)}`. `--surface2` is the near-white
`rgba(20,25,67,.04)`, so the field boundary disappeared and text sat on a
low-contrast ground. On iOS, `type=search` also needs `-webkit-text-fill-color`
set or the system can override the declared `color`.

**Fix**
- Keep the opaque white fill (`--surface`) in rest **and** focus states.
- Force text colour with a WebKit fallback: `color` + `-webkit-text-fill-color`
  + `caret-color`.
- Focus ring is now a 2px navy border (padding drops 1px to absorb it → no
  shift).
- Explicit placeholder colour (`--muted2`), matching the catalogue search.

---

## BUG-001 — Quote Builder adds duplicate lines for the same product
- **Status:** FIXED
- **Severity:** MEDIUM (clutter / usability; no data loss)
- **Found:** 2026-06-23, during owner testing on device
- **Area:** Quote Builder → product picker
- **Fixed in:** v2.2.1 · `site/app.js`, `site/styles.css`

**Reproduce**
1. Open the **Quote** tab and unlock.
2. Tap **+ Add product**, then tap a product (e.g. CS-6LE).
3. Tap **+ Add product** again and tap the same product — or tap the same row
   repeatedly in the picker.

**Expected**
One line per product. Multiples of the same product are handled by that line's
**Qty** field, not by stacking identical lines.

**Actual**
Each tap created another identical line (e.g. three CS-6LE lines, each Qty 1).

**Root cause**
Intentional, per the original Phase 3 PRD edge case ("same product added twice →
allow two lines, since baseline/price could differ"). In real use this proved
counterproductive, so the decision was reversed.

**Fix**
- `addLine()` now ignores a product already in the quote (matched by brand +
  model) and returns a success flag.
- The picker marks already-added products with a dimmed "✓ Added" state and they
  are not re-addable.
- Re-tapping an added product shows an amber notice: "<model> is already in the
  quote — adjust its Qty instead."
- Removing a line frees that product to be added again.

**Note / trade-off**
The same product at two *different* baselines simultaneously is no longer
possible (it was the original justification for allowing duplicates). If that
need arises, add a deliberate "add again" action rather than reverting this fix.

---

<!-- Template for new entries:

## BUG-00X — <short title>
- **Status:** OPEN
- **Severity:** LOW | MEDIUM | HIGH | CRITICAL
- **Found:** YYYY-MM-DD, <how/where>
- **Area:** <feature/screen>
- **Fixed in:** <version · files>   (fill when fixed)

**Reproduce**
1. …

**Expected**
…

**Actual**
…

**Root cause**
…

**Fix**
…

-->
