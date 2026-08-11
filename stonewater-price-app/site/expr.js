/* RGA Price App — arithmetic expression support for the Quote Builder price field.
 * PRD v2.5.0 §4.1–4.3.
 *
 * Self-contained. No dependencies, no DOM access, no state.
 *
 * SECURITY: eval() and new Function() are deliberately absent. This app is
 * passcode-gated and displays dealer and distributor cost. A free-text field
 * that reaches an evaluator is a script-injection surface into a page holding
 * commercial pricing. Everything outside the grammar below is rejected by the
 * tokenizer, by construction, before any arithmetic happens.
 *
 * Grammar (PRD §4.1):
 *   expr    := term (('+' | '-') term)*
 *   term    := factor (('*' | '/') factor)*
 *   factor  := ('+' | '-') factor | primary
 *   primary := number | '(' expr ')'
 *
 * Browser:  <script src="expr.js"></script>  ->  window.RGAExpr
 * Node:     require('./site/expr.js')        ->  module.exports
 */
(function (root) {
  'use strict';

  var MAX_LEN = 200;

  /* Characters permitted in the raw field value. Commas, spaces and the rupee
   * sign are accepted on input (they get pasted back in from formatted
   * figures) and stripped before parsing. '%' is NOT allowed: percent-off
   * shorthand was rejected in PRD §4.6, so it stays invalid rather than
   * reserved. */
  var ALLOWED = /^[0-9.,+\-*/() \u20B9]$/;

  function isAllowedChar(ch) {
    return typeof ch === 'string' && ch.length === 1 && ALLOWED.test(ch);
  }

  /* PRD §4.5.2 — keystroke filter. Returns the string that should be allowed
   * through, given the value that WOULD result. Used from beforeinput and
   * paste. Rejects disallowed characters and two operators in a row. */
  function isAcceptableValue(next) {
    if (typeof next !== 'string') return false;
    if (next.length > MAX_LEN) return false;
    for (var i = 0; i < next.length; i++) {
      if (!isAllowedChar(next[i])) return false;
    }
    // two binary operators adjacent, e.g. "30195*/" — refuse at keystroke.
    if (/[+\-*/]\s*[*/]/.test(next)) return false;
    if (/[*/]{2}/.test(next)) return false;
    return true;
  }

  function strip(raw) {
    return String(raw).replace(/[,\s\u20B9]/g, '');
  }

  /* True when the value is more than a plain number, i.e. the expression path
   * applies. A leading unary minus alone is still a plain number. */
  function looksLikeExpression(raw) {
    var s = strip(raw);
    if (s === '') return false;
    return /[+\-*/()]/.test(s.slice(1)) || /[*/()]/.test(s.charAt(0));
  }

  /* ---------------- tokenizer ---------------- */

  function tokenize(s) {
    var out = [], i = 0;
    while (i < s.length) {
      var c = s[i];
      if (c >= '0' && c <= '9' || c === '.') {
        var j = i, dots = 0;
        while (j < s.length && ((s[j] >= '0' && s[j] <= '9') || s[j] === '.')) {
          if (s[j] === '.') dots++;
          j++;
        }
        var lit = s.slice(i, j);
        if (dots > 1) throw new SyntaxError('bad number');
        if (lit === '.') throw new SyntaxError('bad number');
        out.push({ t: 'num', v: parseFloat(lit) });
        i = j;
      } else if ('+-*/()'.indexOf(c) !== -1) {
        out.push({ t: c });
        i++;
      } else {
        throw new SyntaxError('bad character');
      }
    }
    return out;
  }

  /* ---------------- recursive-descent parser ---------------- */

  function parse(tokens) {
    var p = 0;

    function peek() { return tokens[p]; }
    function eat(t) {
      var k = tokens[p];
      if (!k || k.t !== t) throw new SyntaxError('expected ' + t);
      p++;
      return k;
    }

    function expr() {
      var v = term();
      while (peek() && (peek().t === '+' || peek().t === '-')) {
        var op = tokens[p++].t;
        var r = term();
        v = op === '+' ? v + r : v - r;
      }
      return v;
    }

    function term() {
      var v = factor();
      while (peek() && (peek().t === '*' || peek().t === '/')) {
        var op = tokens[p++].t;
        var r = factor();
        if (op === '*') {
          v = v * r;
        } else {
          // PRD §5 — division by zero is not Infinity in a price field.
          if (r === 0) throw new RangeError('divide by zero');
          v = v / r;
        }
      }
      return v;
    }

    function factor() {
      var k = peek();
      if (!k) throw new SyntaxError('unexpected end');
      if (k.t === '+') { p++; return factor(); }
      if (k.t === '-') { p++; return -factor(); }
      return primary();
    }

    function primary() {
      var k = peek();
      if (!k) throw new SyntaxError('unexpected end');
      if (k.t === 'num') { p++; return k.v; }
      if (k.t === '(') {
        p++;
        var v = expr();
        eat(')');
        return v;
      }
      throw new SyntaxError('unexpected token');
    }

    var value = expr();
    if (p !== tokens.length) throw new SyntaxError('trailing input');
    return value;
  }

  /* ---------------- rounding (PRD §3b) ---------------- */

  /* Nearest whole rupee, half away from zero. The rounded figure is the price:
   * it is the only value stored on the line and the only value any downstream
   * total reads. Never pass the unrounded intermediate anywhere. */
  function roundRupee(n) {
    if (!isFinite(n)) return null;
    var sign = n < 0 ? -1 : 1;
    var a = Math.abs(n);
    // toFixed(6) first, so 0.1+0.2 style float noise cannot flip a .5 boundary.
    return sign * Math.round(Number(a.toFixed(6)));
  }

  /* ---------------- public evaluation ---------------- */

  /* Returns one of:
   *   { state:'empty' }
   *   { state:'ok',         value:<int rupees>, raw:<as typed>, isExpression:<bool> }
   *   { state:'incomplete' }                      -> still typing, show no hint, no error
   *   { state:'invalid',    reason:<string> }     -> show the error state
   *
   * 'incomplete' exists so the field does not flash red mid-keystroke
   * (PRD §4.3). On blur, treat 'incomplete' exactly as 'invalid'.
   */
  function evaluate(raw) {
    if (raw === null || raw === undefined) return { state: 'empty' };
    var s = strip(raw);
    if (s === '') return { state: 'empty' };
    if (s.length > MAX_LEN) return { state: 'invalid', reason: 'too long' };

    // Trailing operator or an unclosed bracket: the user is mid-expression.
    if (/[+\-*/(]$/.test(s)) return { state: 'incomplete' };

    var toks;
    try {
      toks = tokenize(s);
    } catch (e) {
      return { state: 'invalid', reason: 'bad character' };
    }

    var opens = 0;
    for (var i = 0; i < toks.length; i++) {
      if (toks[i].t === '(') opens++;
      else if (toks[i].t === ')') opens--;
      if (opens < 0) return { state: 'invalid', reason: 'unbalanced brackets' };
    }
    if (opens > 0) return { state: 'incomplete' };

    var val;
    try {
      val = parse(toks);
    } catch (e) {
      if (e instanceof RangeError) return { state: 'invalid', reason: 'divide by zero' };
      return { state: 'invalid', reason: 'cannot parse' };
    }

    if (typeof val !== 'number' || !isFinite(val)) {
      return { state: 'invalid', reason: 'not a number' };
    }

    return {
      state: 'ok',
      value: roundRupee(val),
      raw: String(raw),
      isExpression: looksLikeExpression(raw)
    };
  }

  var API = {
    evaluate: evaluate,
    roundRupee: roundRupee,
    isAllowedChar: isAllowedChar,
    isAcceptableValue: isAcceptableValue,
    looksLikeExpression: looksLikeExpression,
    MAX_LEN: MAX_LEN
  };

  root.RGAExpr = API;
  if (typeof module === 'object' && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
