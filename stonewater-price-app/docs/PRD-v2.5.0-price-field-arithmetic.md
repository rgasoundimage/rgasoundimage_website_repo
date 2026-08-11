# PRD v2.5.0 - Arithmetic entry in the Quote Builder price field

**Status:** LOCKED, v1.0. IMPLEMENTED. Ratified 2026-08-11. Changes to this document from here require a new
version number, not an edit.
**Built:** `site/expr.js` (§4.1, §4.2, §3b), `site/app.js` (§3a, §4.3, §4.4, §4.5),
`tests/price-expression.test.mjs` (53 assertions) and `tests/quote-price-field.test.mjs`
(51 assertions, jsdom, driving the real handlers). 104 total, all passing.

**Two deviations from the mockups, decided while reading `app.js`:**

1. **The field shows a bare number at rest, not `₹27,176`.** It has always held an unformatted
   number (`value="${line.price}"`), and adding rupee formatting would change the plain-number path
   on every line, which §4.5.3 exists to protect. The mockups show the formatted version. Say the
   word and it becomes a one-line change, but it should be a deliberate one.
2. **`qINR()` already rounds at display time** (`Math.round(v)`), so before this release a price of
   `27175.5` displayed as `₹27,176` while the totals were computed from `27175.5`. Rounding at
   resolve removes that mismatch rather than creating one. The reconciliation risk flagged in §3b
   was already present; it is now closed.
**Target release:** 2.5.0 (minor: new behaviour, no data-model change)
**Files expected to change:** `site/app.js`, `site/styles.css`, `site/index.html`, `tests/`
**Depends on:** v2.4.1 (the 430px quote-grid breakpoint; the expression hint line assumes the two-column layout)

---

## 1. Problem

The **Your price** field on a quote line accepts a finished number only. In practice the number is
almost never known in finished form. It is arrived at from a printed price and a movement:
a percentage off retail, a per-unit figure multiplied out, a landed cost plus a loading, a
round-figure target divided across units.

Today that arithmetic happens on a phone calculator, in another app, and the result is typed in.
Three costs follow:

1. **App switching mid-quote.** On iOS this can suspend the PWA and, because the quote is
   in-memory only, risks losing the working quote entirely.
2. **Transcription error.** A figure calculated correctly and typed wrongly produces a margin that
   looks plausible and is not checked again.
3. **No record of the derivation.** Reviewing a quote later, `₹27,175.50` gives no clue whether that
   was 10% off list, a cost-plus figure, or a typo.

## 2. Goal and non-goals

**Goal.** Let a price be entered as an arithmetic expression, resolved in place when the field
loses focus, with the derivation visible afterwards.

**Non-goals for 2.5.0**
- No cell references between lines (no `=B4*2`). This is a price field, not a spreadsheet.
- No named variables or memory.
- No changes to margin maths, baseline resolution, role gating, or `prices.json`.
- No persistence. Quotes remain in-memory and are still lost on reload, per v2.2.0.
- No calculator applied to the **Qty** field (see 12b).

## 3. Ratified decisions

**3a. Does the expression survive after it resolves? RATIFIED: Option B, retain.**

The field shows the resolved money value. A small `ƒx 30195*0.9` trace line sits beneath it, and
re-opening the field restores the expression for editing rather than the resolved number. Cost is
roughly 18px of card height per line carrying an expression, on top of the ~46px v2.4.1 added.

**3b. Rounding. RATIFIED: round to the nearest whole rupee on resolve.**

Half-up: `27175.50` becomes `27176`.

**Binding invariant.** The rounded rupee figure is the price. It is the only value stored on the
line and the only value every downstream calculation reads. Line total, line margin, blended margin
and the summary bar all compute from the rounded number, never from the unrounded intermediate.
Anything else produces a card where `price x qty` visibly does not equal the line total.

**Accepted trade-off, recorded so it is not raised as a bug later.** Division to hit a round target
will now miss it. `500000/12` resolves to `41667`, and `41667 x 12` is `500004`, not `500000`. The
overshoot is bounded at half a rupee per unit, so it stays under a rupee per unit at any quantity,
but on a 400-unit order it is a visible ~200 rupee drift from the figure that was being aimed at.
This is the cost of whole-rupee prices and it is accepted.

---

## 4. Functional specification

### 4.1 Accepted grammar

| Element | Accepted | Notes |
|---|---|---|
| Digits and decimal point | `0-9` `.` | One `.` per number |
| Operators | `+` `-` `*` `/` | Standard precedence: `*` and `/` before `+` and `-` |
| Parentheses | `(` `)` | Must balance |
| Commas | `,` | **Stripped before parsing.** `30,195*0.9` must work, since the app displays Indian-formatted figures and they get pasted back in |
| Rupee sign | `₹` | Stripped before parsing |
| Whitespace | space | Stripped |
| Unary minus | `-500` | Allowed as a leading sign and after an operator |
| Anything else | letters, `^`, `%`, `=` | Rejected as invalid (`%` is reserved for phase 2, see 4.6) |

A bare number remains a bare number. `27175.5` behaves exactly as it does today, with no hint line
and no trace.

### 4.2 Evaluation

Implemented as a **tokenizer plus recursive-descent parser** in `app.js`.

**`eval()` and `new Function()` are prohibited.** This app is passcode-gated and shows dealer and
distributor cost. An `eval()` on a free-text field is a script-injection surface into a page that
holds commercial pricing, and it also silently accepts things like `alert(1)` as "valid input".
The parser is roughly 60 lines and rejects everything outside 4.1 by construction.

### 4.3 States and transitions

| State | Trigger | Behaviour |
|---|---|---|
| **Idle** | Field not focused, holds a resolved value | Displays formatted money. If it came from an expression, the `ƒx` trace line shows beneath (Option B) |
| **Editing** | Field focused | Displays the raw expression, unformatted. Live hint under the field shows `= ₹27,175.50` in green, updating on each keystroke |
| **Editing, incomplete** | Expression ends mid-operator, e.g. `30195*` | No hint shown. Not an error yet. Do not flash red while someone is still typing |
| **Editing, invalid** | Expression cannot parse, e.g. `30195*/0.9` | Hint replaced by `Can't work that out` in red. Border turns red. Field is **not** cleared |
| **Resolve** | Blur, or Enter, or a tap elsewhere in the app | Valid: value replaced by the rounded result, formatted; trace line written. Invalid: text kept as typed, red state persists, line excluded from totals |
| **Re-edit** | Field re-focused | Restores the raw expression, not the resolved number (Option B) |

### 4.4 Effect on totals

An unresolved or invalid expression is treated **exactly as an empty price is treated today**: the
line total, line margin and line margin % show a dash, and the line is excluded from the summary
bar and the blended margin. This is an existing rule from v2.2.0 and must not be re-implemented
separately.

### 4.5 Input method. RATIFIED: operator strip.

`<input type="number">` will not accept `*`. The browser treats the contents as invalid and
`input.value` returns an **empty string**, so the expression cannot be read, let alone parsed. The
price input therefore becomes:

```html
<input type="text" inputmode="decimal" enterkeyhint="done"
       autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
```

`inputmode="decimal"` keeps the numeric keypad, which has no operator keys, so an **operator strip**
supplies them. Three constraints on how it is built, each replacing something lost by leaving
`type="number"`.

**4.5.1 Placement: inside the card, not floating over the keyboard.**
The strip is a full-width row rendered inside the quote line card, directly beneath the field grid,
shown only while **Your price** has focus, and it must not be position-fixed above the keyboard.
Keyboard height is not reliably readable in an installed iOS PWA, and `visualViewport` tracking
there is a known source of jitter and misplacement. On focus, `scrollIntoView` the card so the
field, the hint line and the strip all sit above the keypad. See `quote-calc-strip-b1.png`.

Keys, in order: `+` `-` `x` `/` `(` `)` `CLR`. Displayed as `x` and `/`, inserting `*` and `/`.
Each key inserts at the caret and returns focus to the input without dismissing the keyboard.
Minimum 40px tall.

**4.5.1a Visibility and the focus trap.**
The strip is present only while **Your price** on that line has focus. One strip exists at a time,
never one per line.

Tapping a strip key must not blur the input. Bind the keys on `pointerdown` with `preventDefault()`
so focus never leaves the field, and treat the key press as an insert. If this is missed, the first
tap on `x` blurs the field, the strip vanishes under the finger and the half-typed expression
resolves as invalid. The `blur` handler must additionally ignore any blur whose `relatedTarget` is a
strip key, as a second line of defence for keyboard and assistive-technology navigation.

**4.5.1b The strip overlays, it does not reflow.**
Absolutely positioned within the card, covering the totals row, with the card set `position:relative`.
It must not be inserted as a normal-flow row.

A normal-flow row changes the card's height by ~55px on show and again on hide. Every line below
moves. Tapping the price field of the next line down then shifts the layout between finger-down and
tap-resolve, and the tap lands on the wrong control. Overlaying removes the shift entirely, and it
costs nothing because per 4.4 the totals are already showing dashes while an expression is being
edited. Compare `quote-calc-strip-focus-c1.png` and `-c2.png`: the card below is pixel-identical.

No entry or exit animation. Show and hide are instant.

**4.5.2 Keystroke filtering replaces numeric validation.**
Because the field is now free text, every character must be refused at entry if it falls outside the
section 4.1 grammar. Implement on `beforeinput` (with a `paste` handler for the same rule), not on
`blur`. Two operators in a row are also refused at keystroke. The field can then never hold
arbitrary text despite being `type="text"`. See `quote-calc-strip-b2.png`.

**4.5.3 Regression guard on the common case.**
The overwhelming majority of entries are still a plain number typed straight in. That path must be
byte-identical to today: same keypad, same formatting on blur, no hint line, no trace, no strip
interference. This is the single largest risk in the release, because it changes a field used on
every line to enable a feature used on some of them. Tests must cover plain numeric entry
explicitly, not only expressions.

### 4.6 Percent shorthand: OUT OF SCOPE

`-12%` as 12% off the current baseline was considered and **rejected by the owner as not a primary
need**. It is not in 2.5.0 and is not scheduled. `%` therefore remains an invalid character in the
grammar rather than a reserved one.

---

## 5. Edge cases

| Input | Result |
|---|---|
| `5*2` | `10` |
| `30,195*0.9` | `27,176` (commas stripped, 27175.50 rounds half-up) |
| `₹30195*0.9` | `27,176` (rupee sign stripped) |
| `100000/3` | `33,333` (nearest rupee) |
| `(30195-2000)*1.18` | `33,270` |
| `30195*` | Incomplete. No hint while typing. On blur: invalid |
| `30195/0` | Invalid. Division by zero is not Infinity in a price field |
| `-500` | Parses to `-500`, but `lineCalc()` requires `price > 0`, so the line is excluded from totals exactly as it is today. Unchanged behaviour, corrected here after reading `app.js` |
| `5..2` | Invalid |
| `alert(1)` | Invalid. Rejected by the grammar, never executed |
| `2*3*4*5...` (over 200 chars) | Rejected on length before parsing |
| Empty | Empty. Line excluded from totals, unchanged from today |

## 6. Test plan

Extend the existing runner (`tests/`, currently 42 assertions in `quote-distributor.test.mjs`).
Note that `package.json` `test` points at a single hard-coded file, so **add a second file and it
will not run**. Fix the script to a glob as part of this release.

New file `tests/price-expression.test.mjs`, minimum coverage:

1. Every row of the section 5 table, parser level.
2. Rounding: every expression resolves to an integer number of rupees, half-up. Assert on
   `500000/12` specifically, and assert the line total equals `41667 x 12`, not `500000`.
3. Precedence: `2+3*4` is `14`, not `20`.
4. An invalid expression leaves the line excluded from the summary bar totals.
5. A resolved expression produces identical line margin, margin % and blended margin to the same
   number typed directly. This is the assertion that matters most.
6. `eval` and `Function` do not appear in `app.js` (grep-level assertion).
7. The price input carries `type="text"`, `inputmode="decimal"` and `autocorrect="off"`.
8. Keystroke filtering: a rejected character never reaches the field value.
8b. Focus: a strip key press does not blur the input and does not resolve the expression.
8c. Visibility: the strip is absent from the DOM, or hidden, whenever the price field lacks focus,
    and the card's rendered height is identical in both states.
9. Plain numeric entry, no operators, produces the same stored value, same totals and no trace,
   asserted against the v2.4.1 behaviour.

## 7. Out of scope, recorded so it is not re-litigated

- **Expression entry in Qty. Explicitly rejected by the owner.** Qty stays a plain integer field.
- Expression entry anywhere in the Catalogue.
- Saving or exporting quotes.
- Applying an expression across all lines at once.
- Any change to `build_prices.py` or `prices.json`.

---

## 12. Decision log

| # | Decision | Outcome |
|---|---|---|
| 3a | Expression retained after resolving | **Yes, Option B.** Trace line plus re-edit restores the expression |
| 3b | Rounding | **Nearest whole rupee, half-up.** Rounded value is the single source of truth |
| c | Arithmetic in Qty | **No.** Out of scope, not scheduled |
| d | Percent-off-baseline shorthand | **No.** Not a primary need. `%` stays invalid |
| 4.5 | Input method | **Operator strip**, pinned inside the card rather than floating. Calculator sheet considered and rejected |
