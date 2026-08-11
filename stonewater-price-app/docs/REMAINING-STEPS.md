# What was edited outside app.js, and what to check

All four site files are edited and in the zip. This records what changed in the three beyond
`app.js`, so the diff is reviewable rather than mysterious.

## 1. `site/index.html` — loads expr.js first (done)

```html
<script src="expr.js"></script>
<script src="app.js"></script>
```

`app.js` calls `RGAExpr` and will throw on the first keystroke without it.

## 2. `site/sw.js` — expr.js added to the precache list (done)

`ASSETS` now reads `"./", "index.html", "styles.css", "app.js", "expr.js", "prices.json", ...`

Miss this and the app breaks **offline only**, with `RGAExpr is not defined`. It will pass every
test you run online and then fail on a site with no signal, which is exactly where the app is used.
The cache name itself still auto-stamps from the commit SHA; nothing else in `sw.js` changes.

## 3. `site/styles.css` — two edits (done)

- The block in `docs/v2.5.0-styles-append.css` is appended to the end of the file. The copy in
  `docs/` is kept only as a readable record of what was added.
- `position: relative;` added to the existing `.qline` rule, so the strip anchors to the card.

## 4. Then

```
npm test        # expect: 53 + 57 assertions, 2 test files, 0 failed
npm run dev     # http://localhost:5000
```

On the phone, the checks worth doing by hand:

1. Type a plain number into **Your price**. It must behave exactly as it did in 2.4.1. This is the
   path used on every line and the one this release put at risk.
2. Type `30195*0.9`, tap the `×` key on the strip mid-expression, then tap away. The strip must not
   vanish when you tap it, and the expression must resolve to `27176`.
3. Tap the resolved field again. It must give back `30195*0.9`, not `27176`.
4. With two lines in the quote, focus the price field on the first. The second card must not move.
