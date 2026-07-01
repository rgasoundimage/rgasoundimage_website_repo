# Bug Log — Stonewater / RGA Price Catalogue

A running log of bugs and behaviour fixes, newest first. This is **not** a PRD —
it's a lightweight tracker. Each entry records what was wrong, how to reproduce
it, what was expected, and how it was fixed.

**Status key:** `OPEN` · `IN PROGRESS` · `FIXED` · `WON'T FIX`
**Severity:** `LOW` · `MEDIUM` · `HIGH` · `CRITICAL`

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
