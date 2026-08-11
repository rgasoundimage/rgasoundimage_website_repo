/* PRD v2.5.0 — parser-level tests for site/expr.js
 *
 * Run: npm test
 *
 * These cover everything that does NOT need the app: grammar, rounding,
 * rejection, keystroke filtering. DOM integration tests (strip visibility,
 * focus behaviour, totals exclusion) live in a second file and require
 * site/app.js, which is not in this package yet.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const EXPR_PATH = join(HERE, '..', 'site', 'expr.js');
const E = require(EXPR_PATH);

let n = 0;
const ok = (cond, label) => {
  n++;
  assert.ok(cond, `#${n} ${label}`);
  console.log(`  ok ${String(n).padStart(2, '0')}  ${label}`);
};
const eq = (a, b, label) => {
  n++;
  assert.deepEqual(a, b, `#${n} ${label} — got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
  console.log(`  ok ${String(n).padStart(2, '0')}  ${label}`);
};

const val = (s) => E.evaluate(s).value;
const state = (s) => E.evaluate(s).state;

console.log('\nPRD v2.5.0 — price expression\n');

/* ---- 1. PRD §5 edge-case table, verbatim ---- */
console.log('§5 edge cases');
eq(val('5*2'), 10, '5*2 = 10');
eq(val('30,195*0.9'), 27176, '30,195*0.9 = 27176 (commas stripped, half-up)');
eq(val('\u20B930195*0.9'), 27176, 'rupee sign stripped');
eq(val('100000/3'), 33333, '100000/3 = 33333');
eq(val('(30195-2000)*1.18'), 33270, '(30195-2000)*1.18 = 33270');
eq(state('30195*'), 'incomplete', '30195* is incomplete, not invalid');
eq(state('30195/0'), 'invalid', 'divide by zero is invalid, not Infinity');
eq(val('-500'), -500, 'negative price allowed');
eq(state('5..2'), 'invalid', '5..2 rejected');
eq(state('alert(1)'), 'invalid', 'alert(1) rejected by the grammar');
eq(state(''), 'empty', 'empty is empty');
eq(state('   '), 'empty', 'whitespace only is empty');
eq(state('2'.repeat(E.MAX_LEN + 1)), 'invalid', 'over MAX_LEN rejected');

/* ---- 2. rounding, PRD §3b ---- */
console.log('\n§3b rounding — nearest rupee, half away from zero');
eq(E.roundRupee(27175.5), 27176, '27175.50 rounds up');
eq(E.roundRupee(27175.49), 27175, '27175.49 rounds down');
eq(E.roundRupee(27175.0), 27175, 'exact rupee unchanged');
eq(E.roundRupee(-27175.5), -27176, 'negative half rounds away from zero');
eq(E.roundRupee(0.1 + 0.2), 0, 'float noise does not leak');
ok(Number.isInteger(val('100000/3')), 'every resolved value is an integer');
ok(Number.isInteger(val('1/7')), 'repeating decimal resolves to an integer');

/* ---- 3. the round-target trade-off, PRD §3b ---- */
console.log('\n§3b accepted trade-off — division misses the round total');
eq(val('500000/12'), 41667, '500000/12 = 41667');
eq(val('500000/12') * 12, 500004, 'line total is 500004, not 500000 — accepted and asserted');
ok(Math.abs(val('500000/12') * 12 - 500000) < 12, 'drift bounded at under a rupee per unit');

/* ---- 4. precedence and associativity ---- */
console.log('\n§4.1 grammar');
eq(val('2+3*4'), 14, '2+3*4 = 14, not 20');
eq(val('(2+3)*4'), 20, 'brackets override precedence');
eq(val('100-10-10'), 80, 'subtraction is left-associative');
eq(val('100/10/2'), 5, 'division is left-associative');
eq(val('-5+10'), 5, 'leading unary minus');
eq(val('10*-5'), -50, 'unary minus after an operator');
eq(val('((30195))'), 30195, 'nested brackets');
eq(state('(30195'), 'incomplete', 'unclosed bracket is incomplete');
eq(state('30195)'), 'invalid', 'unbalanced closing bracket is invalid');
eq(state('30195*/0.9'), 'invalid', 'two operators together is invalid');

/* ---- 5. plain numbers must behave exactly as they do today ---- */
console.log('\n§4.5.3 plain-number regression guard');
eq(val('27176'), 27176, 'plain integer passes through');
eq(val('27175.50'), 27176, 'plain decimal rounds by the same rule');
eq(E.evaluate('27176').isExpression, false, 'plain number is not flagged as an expression');
eq(E.evaluate('-500').isExpression, false, 'leading minus alone is not an expression');
eq(E.evaluate('5*2').isExpression, true, '5*2 is flagged as an expression');
eq(E.evaluate('30195*0.9').raw, '30195*0.9', 'raw expression is preserved for the trace');

/* ---- 6. keystroke filtering, PRD §4.5.2 ---- */
console.log('\n§4.5.2 keystroke filter');
ok(E.isAllowedChar('7'), 'digit allowed');
ok(E.isAllowedChar('*'), 'operator allowed');
ok(E.isAllowedChar(','), 'comma allowed on input');
ok(!E.isAllowedChar('a'), 'letter refused');
ok(!E.isAllowedChar('%'), 'percent refused — §4.6 rejected, stays invalid not reserved');
ok(!E.isAllowedChar('^'), 'caret refused');
ok(!E.isAllowedChar('='), 'equals refused');
ok(E.isAcceptableValue('30195*0.9'), 'valid partial accepted');
ok(!E.isAcceptableValue('30195*/'), 'two operators refused at keystroke');
ok(!E.isAcceptableValue('alert(1)'), 'letters refused at keystroke');
ok(!E.isAcceptableValue('2'.repeat(E.MAX_LEN + 1)), 'over-length refused at keystroke');

/* ---- 7. no evaluator anywhere in the module ---- */
console.log('\n§4.2 security');
const src = readFileSync(EXPR_PATH, 'utf8');
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
ok(!/\beval\s*\(/.test(code), 'no eval( in expr.js');
ok(!/new\s+Function\s*\(/.test(code), 'no new Function( in expr.js');
ok(!/setTimeout\s*\(\s*['"`]/.test(code), 'no string-form setTimeout');

console.log(`\n${n} assertions passed.\n`);
