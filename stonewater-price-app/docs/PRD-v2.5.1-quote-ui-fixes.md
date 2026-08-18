# PRD — v2.5.1 · Quote module UI fixes

**App:** Stonewater / RGA Price Catalogue (PWA)
**Base version:** 2.5.0
**Proposed version:** 2.5.1 (patch — presentation only, no behaviour change)
**Scope of change:** `site/styles.css` only. No JavaScript, no HTML, no `prices.json`, no data pipeline.
**Author:** RGA
**Status:** DRAFT — awaiting approval before build

---

## 1. Why this is a patch, not a feature release

All three defects are visual. None touch the data model, pricing maths, the passcode gate, or the expression parser shipped in 2.5.0. The correct semantic step is a patch (`2.5.0` → `2.5.1`), and the whole thing is one `styles.css` diff plus three BUGS.md entries and one CHANGELOG line.

Bugs 1 and 2 both live in the product picker sheet; bug 3 lives in the quote summary bar. They ship together as one coordinated CSS pass so the two picker fixes do not collide on adjacent rules.

---

## 2. Defects

### BUG-002 — Picker search field: text and field boundary vanish on focus

**Area:** Quote Builder → Add product picker (`#pickSearch`)
**Severity:** MEDIUM (usability; the field is the primary control of the sheet)

**Reproduce**
1. Quote tab → Add product.
2. The search field is focused automatically.
3. Type any characters.

**Actual**
The typed text is hard to read and the field loses its outline against the sheet.

**Root cause**
The field's own background collapses to the sheet's background on focus:

```css
#pickSearch{ background:var(--surface); ... color:var(--text); }         /* white */
#pickSearch:focus{ background:var(--surface2); border-color:var(--amber-dim) }
```

`--surface2` is `rgba(20,25,67,.04)` — the same near-white tint as the `.sheet`. On focus the input fill and the sheet fill become identical, so the field boundary disappears and typed text sits on a muddy low-contrast ground. On iOS, `type="search"` fields also need `-webkit-text-fill-color` set explicitly, or the system can override the declared `color`.

**Fix**
- Keep an opaque white fill (`--surface`) in **both** rest and focus states; do not swap to `--surface2` on focus.
- Set text colour explicitly with a WebKit fallback: `color:var(--text); -webkit-text-fill-color:var(--text); caret-color:var(--text)`.
- Strengthen the focus ring so the boundary reads on a near-white sheet (border to `--text` or a 2px navy ring rather than the faint `--amber-dim`).
- Add an explicit placeholder colour (`--muted2`) to match the catalogue search, which already has one.

**Acceptance**
- Typed text is solid navy (`#141943`) on white in both light rest and focused states.
- The field has a clearly visible edge when empty and when focused.
- Placeholder is legible but distinct from typed text.
- Verified in iOS Safari standalone (home-screen) and desktop Chrome.

---

### BUG-003 — Picker sheet slides down as results narrow

**Area:** Add product picker sheet (`#picker .sheet`, `.pickresults`)
**Severity:** MEDIUM (the search box moves under the user while they type)

**Reproduce**
1. Add product → type a broad term (many matches).
2. Add characters to narrow to a few matches.

**Actual**
The whole upper block (title, subtitle, search field) drops downward as the result count falls, and rises again as it grows. The field the user is typing into does not hold still.

**Root cause**
Not "results pushing content." The modal is bottom-anchored and the sheet height is content-driven:

```css
.modal{ display:flex; align-items:flex-end; ... }   /* sheet pinned to bottom */
.sheet-scroll{ max-height:86vh; overflow-y:auto }    /* height follows content */
.pickresults{ max-height:48vh; overflow-y:auto }
```

With fewer results, `.pickresults` gets shorter, the sheet gets shorter, and because the sheet is pinned at its **bottom** edge, the shrink is taken off the **top** — so everything above the results (including the search field) moves down.

**Fix**
Pin the sheet's height so its top edge is stable, and make the results list the only region that changes:
- `#picker .sheet` becomes a flex column with a **fixed** height (e.g. `height:86dvh` capped by `max-height`) instead of `max-height` alone.
- Header block (h2, sub, `.pickbar`, `.pickadded`) and the `.modal-actions` footer are `flex:0 0 auto`.
- `#pickResults` is `flex:1 1 auto; overflow-y:auto` and absorbs all height change internally.

Scope these rules to `#picker` so the settings modal, which shares `.sheet-scroll`, is unaffected.

**Acceptance**
- Typing to narrow or widen results does not move the search field or the title by a single pixel.
- Long result lists scroll inside the results region; the Done button stays reachable at the bottom.
- Short result lists leave empty space below the list rather than repositioning the header.
- Settings modal layout unchanged.

---

### BUG-004 — Quote summary bar shows product cards through it

**Area:** Quote Builder summary bar (`.qbar`)
**Severity:** MEDIUM (misreads as a broken overlay; can be mistaken for wrong totals)

**Reproduce**
1. Add three or more products so the quote scrolls.
2. Scroll; watch the sticky totals bar at the bottom.

**Actual**
Product card text (model, fields, line totals) shows through the totals bar, so the bar looks like it is overlapping and colliding with the last card.

**Root cause**
Not z-index or sticky offset. The bar is positioned correctly; its fill is almost fully transparent:

```css
.qbar{ position:sticky; bottom:calc(8px + var(--safe-b));
       background:var(--surface2); ... }   /* rgba(20,25,67,.04) = 96% transparent */
```

Cards scrolling behind the sticky bar are visible through it because there is no opaque backing.

**Fix**
- Give `.qbar` an **opaque** fill — a flat navy-4%-on-white colour (`#F4F5F8`) or `--bg` (`#FFFFFF`) with the existing border and lift shadow. Nothing behind it should show through.
- Add bottom clearance so the last product card can scroll clear of the bar rather than staying permanently hidden under it: bottom padding / spacer on `.qlines` (or `scroll-margin`/`scroll-padding`) equal to the bar's height plus its offset.

**Acceptance**
- No product content is ever visible through the summary bar while scrolling.
- The last product card can be scrolled fully into view above the bar.
- The bar keeps its rounded card look, border, and upward shadow.

---

## 3. Out of scope

- No change to totals maths, margin logic, expression parser, or picker add/remove behaviour.
- No new controls, copy, or brands.
- Dynamic-viewport (`dvh`) keyboard behaviour on iOS is used where it strengthens the fix but a full keyboard-safe-area overhaul is not part of this patch.

## 4. Files touched

| File | Change |
|---|---|
| `site/styles.css` | Rules for `#pickSearch`, `#picker .sheet` / `#pickResults`, `.qbar` and `.qlines` clearance |
| `BUGS.md` | BUG-002, BUG-003, BUG-004 entries (mark Fixed in 2.5.1) |
| `CHANGELOG.md` | 2.5.1 patch entry |
| `site/sw.js` + `scripts/stamp-cache.mjs` | cache name bumps as usual on deploy |

## 5. Test plan

- iOS Safari home-screen (the primary field device) and desktop Chrome.
- Picker: focus the search, type to widen/narrow, confirm header and field do not move; confirm text is legible.
- Quote: 3+ lines, scroll top to bottom, confirm no bleed-through and the last card clears the bar.
- Regression: settings modal opens and lays out as before; passcode modal unaffected; existing Playwright/jsdom tests still pass (they assert maths, not these styles, so no test changes expected).
