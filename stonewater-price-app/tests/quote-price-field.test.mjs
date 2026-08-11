/* PRD v2.5.0 — DOM integration tests for the Quote Builder price field.
 *
 * Loads the REAL site/app.js against a jsdom document and drives the real
 * event handlers. Nothing here reimplements app logic: if app.js drifts from
 * the PRD these fail rather than quietly passing.
 *
 * The DOM shell below carries only the ids app.js touches at boot. It is not
 * index.html; if boot() starts reading a new id, this file fails loudly and
 * the shell needs the id added.
 */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

let n = 0;
const ok = (c, label) => { n++; assert.ok(c, `#${n} ${label}`); console.log(`  ok ${String(n).padStart(2, '0')}  ${label}`); };
const eq = (a, b, label) => { n++; assert.deepEqual(a, b, `#${n} ${label} — got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`); console.log(`  ok ${String(n).padStart(2, '0')}  ${label}`); };

/* --- minimal data, shaped like prices.json ------------------------------- */
const PRICES = {
  brands: [{
    id: 'stonewater', name: 'Stonewater', effectiveDate: '01 Apr 2026',
    lists: [{
      id: 'praveen', label: 'Price List', internalOnly: false,
      labels: { msrp: 'MSRP', dealer: 'Dealer', distInclTax: 'Distributor (tax incl.)' },
      roles: { customer: ['msrp'], dealer: ['dealer', 'msrp'], subdealer: ['msrp'], internal: ['msrp', 'dealer', 'distInclTax'] },
      percentKeys: [],
      categories: [{
        name: 'Commercial',
        subcategories: [{
          name: 'Ceiling',
          products: [{ model: 'CS-6LE', description: '6.5in ceiling speaker', hsn: 8518,
                       prices: { msrp: 30195, dealer: 18117, distInclTax: 15400 } }]
        }]
      }]
    }]
  }]
};

const SHELL = `<!doctype html><html><body>
<select id="brandSelect"></select><select id="listSelect"></select><select id="roleSelect"></select>
<input id="search"><div id="searchwrap"></div><button id="clearSearch"></button>
<div id="results"></div><div id="empty"></div><div id="foot"></div>
<span id="countLine"></span><span id="viewLine"></span><span id="priceListHint"></span>
<div id="controls"></div><button id="lockBtn"></button><span id="quoteLockIc"></span>
<div id="modal"><h3 id="modalTitle"></h3><input id="passInput"><button id="passToggle"></button>
  <button id="passOk"></button><button id="passCancel"></button><p id="passErr"></p></div>
<div id="settings"><button id="settingsDone"></button><p id="setErr"></p>
  <div id="priceChecks"></div><button id="priceAll"></button></div>
<button id="settingsBtn"></button>
<button id="tabCatalogue"></button><button id="tabQuote"></button>
<div id="quote"></div><div id="lockedUnlock"></div>
<div id="picker" hidden><input id="pickSearch"><div id="pickResults"></div>
  <div id="pickAdded"></div><button id="pickDone"></button></div>
</body></html>`;

const dom = new JSDOM(SHELL, { url: 'https://example.test/', pretendToBeVisual: true, runScripts: 'outside-only' });
const { window } = dom;
window.localStorage.setItem('sw_unlocked', '1');          // Quote tab is gated
window.fetch = async () => ({ ok: true, json: async () => PRICES });

const ctx = window;
ctx.console = console;

const exprSrc = readFileSync(join(ROOT, 'site', 'expr.js'), 'utf8');
const appSrc = readFileSync(join(ROOT, 'site', 'app.js'), 'utf8');
window.eval(exprSrc);      // test harness only; expr.js itself contains no evaluator
// Each window.eval() gets its own lexical scope, so `let quote` cannot be read
// from outside. Append a read-only handle in the SAME evaluation. This is the
// only line of test-only code injected; app.js itself is untouched.
window.eval(appSrc + '\n;window.__t = { get quote(){ return quote; } };');

await new Promise((r) => setTimeout(r, 30));   // let boot()'s await settle

const doc = window.document;
const $ = (id) => doc.getElementById(id);

console.log('\nPRD v2.5.0 — quote price field (DOM)\n');

/* --- boot sanity ---------------------------------------------------------- */
console.log('boot');
ok(window.RGAExpr, 'RGAExpr is on the window (expr.js must load before app.js)');
ok(typeof window.addLine === 'function', 'app.js loaded and addLine is reachable');

window.setTab('quote');
const prod = window.buildProductIndex()[0];
ok(window.addLine(prod), 'a product can be added to the quote');

const line = window.__t.quote[0];
const input = doc.querySelector('.qprice');
const qty = doc.querySelector('.qqty');
ok(input, 'the price input rendered');

/* --- §4.5 the input element ---------------------------------------------- */
console.log('\n§4.5 input element');
eq(input.getAttribute('type'), 'text', 'price input is type="text" (type=number cannot hold 5*2)');
eq(input.getAttribute('inputmode'), 'decimal', 'price input keeps the decimal keypad');
eq(input.getAttribute('autocorrect'), 'off', 'autocorrect off');
eq(qty.getAttribute('type'), 'number', 'Qty is still type="number" — arithmetic there was rejected');
eq(input.getAttribute('min'), null, 'min dropped: meaningless on a text input');
eq(input.getAttribute('step'), null, 'step dropped');

/* --- helpers to drive the real handlers ----------------------------------- */
const type = (v) => { input.value = v; input.dispatchEvent(new window.Event('input', { bubbles: true })); };
const focus = () => input.dispatchEvent(new window.FocusEvent('focusin', { bubbles: true }));
const blur = (related = null) => input.dispatchEvent(new window.FocusEvent('focusout', { bubbles: true, relatedTarget: related }));
const hint = () => $('eh-' + line.uid);
const trace = () => $('et-' + line.uid);
const lineTotal = () => $('lt-' + line.uid).textContent;

/* --- §4.5.3 the plain-number path must not regress ------------------------ */
console.log('\n§4.5.3 plain-number regression guard');
focus(); type('27176');
eq(String(line.price), '27176', 'a plain number updates the line live, as in 2.4.1');
ok(hint().hidden, 'no hint for a plain number');
eq(lineTotal(), '₹27,176', 'totals update live while typing a plain number (qty 1)');
blur();
eq(line.price, 27176, 'plain number resolves to the same integer');
eq(line.priceExpr, null, 'plain number leaves no expression trace');
ok(trace().hidden, 'no trace element shown for a plain number');
eq(input.value, '27176', 'field still shows a bare number, not a formatted one');

/* --- §4.3 expression editing --------------------------------------------- */
console.log('\n§4.3 expression editing');
focus(); type('30195*0.9');
eq(hint().hidden, false, 'hint appears while an expression is being typed');
eq(hint().textContent, '= ₹27,176', 'hint shows the rounded result');
eq(line.price, '', 'an unresolved expression holds the line out of the totals');
eq(lineTotal(), '—', 'line total shows a dash while the expression is unresolved');

type('30195*');
ok(hint().hidden, 'a trailing operator is incomplete: no hint');
ok(!input.classList.contains('is-expr-error'), 'and no error flash mid-keystroke');

type('30195*/0.9');
eq(hint().textContent, "Can't work that out", 'invalid expression shows the error hint');
ok(input.classList.contains('is-expr-error'), 'and marks the input');

/* --- §3a resolve, trace, re-edit ------------------------------------------ */
console.log('\n§3a resolve and trace');
type('30195*0.9'); blur();
eq(line.price, 27176, 'expression resolves to whole rupees on blur');
eq(line.priceExpr, '30195*0.9', 'the expression is retained as the trace');
eq(input.value, '27176', 'the field shows the resolved number at rest, not the expression');
eq(trace().hidden, false, 'the trace line is visible');
ok(/30195\*0\.9/.test(trace().textContent), 'the trace shows the expression');
focus();
eq(input.value, '30195*0.9', 're-focusing restores the expression, not the number');
blur();

/* --- the assertion that matters most -------------------------------------- */
console.log('\n§6.5 expression and typed number agree');
const viaExpr = { total: lineTotal(), margin: $('mr-' + line.uid).textContent, pct: $('mp-' + line.uid).textContent };
focus(); type('27176'); blur();
const viaNumber = { total: lineTotal(), margin: $('mr-' + line.uid).textContent, pct: $('mp-' + line.uid).textContent };
eq(viaExpr, viaNumber, '30195*0.9 gives identical total, margin and margin % to typing 27176');

/* --- §3b rounding is the single source of truth --------------------------- */
console.log('\n§3b rounding');
focus(); type('500000/12'); blur();
eq(line.price, 41667, '500000/12 resolves to 41667');
line.qty = 12; window.updateLineComputed(line.uid);
eq(lineTotal(), '₹5,00,004', 'the line total is 41667 x 12 — computed from the ROUNDED price');
line.qty = 1; window.updateLineComputed(line.uid);

/* --- §4.4 invalid excluded from totals ------------------------------------ */
console.log('\n§4.4 totals exclusion');
focus(); type('30195*/'); blur();
eq(line.price, '', 'an unresolved expression is excluded from totals, like an empty price');
eq(input.value, '30195*/', 'the text is kept exactly as typed so it can be corrected');
ok(input.classList.contains('is-expr-error'), 'the error state persists after blur');
eq($('sumEntered').textContent, '—', 'the summary bar excludes the line too');

/* --- §4.5.2 keystroke filtering -------------------------------------------- */
console.log('\n§4.5.2 keystroke filter');
focus(); input.value = ''; 
let ev = new window.InputEvent('beforeinput', { bubbles: true, cancelable: true, data: 'a', inputType: 'insertText' });
input.dispatchEvent(ev);
ok(ev.defaultPrevented, 'a letter is refused before it enters the field');
ev = new window.InputEvent('beforeinput', { bubbles: true, cancelable: true, data: '5', inputType: 'insertText' });
input.dispatchEvent(ev);
ok(!ev.defaultPrevented, 'a digit is allowed through');

/* --- §4.5.1 the strip ------------------------------------------------------ */
console.log('\n§4.5.1 operator strip');
focus();
const strip = doc.querySelector('.qexpr-strip');
ok(strip, 'the strip exists while the price field has focus');
ok(!strip.hidden, 'and is visible');
eq(strip.closest('.qline').dataset.uid, line.uid, 'it sits inside the focused line');
eq(strip.querySelectorAll('.qexpr-key').length, 7, 'seven keys: + − × ÷ ( ) CLR');
eq(strip.parentElement.querySelectorAll('.qexpr-strip').length, 1, 'exactly one strip, never one per line');

input.value = '30195'; 
const mulKey = [...strip.querySelectorAll('.qexpr-key')].find((k) => k.dataset.ch === '*');
ok(mulKey, 'the × key inserts *, not ×');
const pd = new window.Event('pointerdown', { bubbles: true, cancelable: true });
Object.defineProperty(pd, 'target', { value: mulKey });
strip.dispatchEvent(pd);
ok(pd.defaultPrevented, 'pointerdown is prevented so focus never leaves the input');
eq(input.value, '30195*', 'the key inserted at the caret');

blur(mulKey);
eq(line.price, '', 'a blur whose relatedTarget is a strip key does not resolve the expression');
ok(!strip.hidden, 'and does not hide the strip');

blur();
ok(strip.hidden, 'a real blur hides the strip');

/* --- card height stability (PRD §4.5.1b) ---------------------------------
   jsdom does no layout, so height itself is measured in the Playwright pass.
   What is asserted here is the structure that makes it constant: the hint and
   the trace share one always-present fixed-height slot, so neither can grow
   the card when it appears. */
console.log('\n§4.5.1b constant card height');
const slot = doc.querySelector('.qexpr-slot');
ok(slot, 'the hint/trace slot is always in the DOM');
eq(hint().parentElement, slot, 'the hint lives in the slot');
eq(trace().parentElement, slot, 'the trace lives in the slot');
focus(); type('30195*0.9');
ok(!hint().hidden && trace().hidden, 'hint and trace are never shown at the same time');
blur();
ok(hint().hidden && !trace().hidden, 'after resolving they swap, still one at a time');
eq(doc.querySelectorAll('.qline')[0].querySelectorAll('.qexpr-slot').length, 1, 'one slot per line');

console.log(`\n${n} assertions passed.\n`);
