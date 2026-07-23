/* v2.4.0 — Distributor baseline. Run: node tests/quote-distributor.test.mjs
   Exercises the real app.js against the real prices.json in a jsdom DOM. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "site");
const PRICES = JSON.parse(fs.readFileSync(path.join(SITE, "prices.json"), "utf8"));

let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? (pass++, console.log("  ok   " + msg))
                                 : (fail++, console.error("  FAIL " + msg)); };
const eq = (a, b, msg) => ok(a === b, `${msg}  (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
const near = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, `${msg}  (got ${a}, want ~${b})`);

const products = (bid, lid) => {
  const b = PRICES.brands.find((x) => x.id === bid);
  const L = b.lists.find((x) => x.id === lid);
  const out = {};
  for (const c of L.categories) for (const s of c.subcategories)
    for (const p of s.products) out[p.model] = p.prices;
  return out;
};

/* ---------- Group A: data integrity (guards the column-shift bug) ---------- */
console.log("\nA. prices.json integrity");
const KA = products("kasper", "products");
const SW = products("stonewater", "praveen");

eq(KA["KMA-8120"].mrp, 33900, "Kasper KMA-8120 mrp is the real MRP, not List+Tax");
eq(KA["KMA-8120"].dealer, 22983, "Kasper KMA-8120 dealer is the real dealer price");
eq(KA["KMA-8120"].distInclTax, 18645, "Kasper KMA-8120 distInclTax present");
ok(Object.values(KA).every((p) => p.dealerMargin > 0 && p.dealerMargin < 1),
   "every Kasper dealerMargin is a fraction, not a rupee value");
ok(Object.values(KA).every((p) => p.distMargin > 0 && p.distMargin < 1),
   "every Kasper distMargin is a fraction, not a rupee value");
ok(Object.values(KA).every((p) => p.mrp > p.dealer && p.dealer > p.distRga),
   "Kasper price ordering mrp > dealer > distRga holds for all 57");

eq(Object.keys(SW).length, 67, "Stonewater public list has 67 products");
eq(Object.keys(KA).length, 57, "Kasper list has 57 products");
ok(Object.values(SW).every((p) => Number.isFinite(p.distInclTax)),
   "all 67 Stonewater products carry distInclTax");
ok(Object.values(KA).every((p) => Number.isFinite(p.distInclTax)),
   "all 57 Kasper products carry distInclTax");
ok(Object.values(KA).every((p) => Math.abs(p.distInclTax / p.distRga - 1.18) < 0.002),
   "Kasper distInclTax is distRga + 18% throughout");
ok("Media Player MP-01" in SW && !("MP-01" in SW),
   "Stonewater MP-01 renamed to 'Media Player MP-01'");

/* ---------- Group B: load the real app in a DOM ---------- */
console.log("\nB. app.js boots");
const dom = new JSDOM(fs.readFileSync(path.join(SITE, "index.html"), "utf8"), {
  runScripts: "outside-only", url: "https://localhost/",
});
const { window } = dom;
window.matchMedia ||= () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
window.fetch = async () => ({ ok: true, json: async () => PRICES });
window.navigator.serviceWorker = { register: async () => {}, ready: Promise.resolve({}) };
window.confirm = () => true;

const src = fs.readFileSync(path.join(SITE, "app.js"), "utf8");
window.eval(src + "\n;globalThis.__t = { buildProductIndex, lineBaseline, lineCalc, addLine, renderQuote, qLineHTML, quoteTotals, get quote(){return quote}, set quote(v){quote=v}, set unlocked(v){unlocked=v}, set DATA(v){DATA=v} };");
const T = window.__t;
T.DATA = PRICES;
T.unlocked = true;
ok(!!T.buildProductIndex, "test hooks exposed");

/* ---------- Group C: product index ---------- */
console.log("\nC. buildProductIndex carries dist");
const idx = T.buildProductIndex();
eq(idx.length, 124, "index spans both public lists (67 + 57)");
ok(idx.every((p) => Number.isFinite(p.dist)), "every indexed product has a finite dist");
const kma = idx.find((p) => p.model === "KMA-8120");
const swp = idx.find((p) => p.brandId === "stonewater" && p.model === "CS-4LM");
eq(kma.dist, 18645, "Kasper dist = distInclTax");
eq(swp.dist, 1254.34, "Stonewater dist = distInclTax");
ok(idx.every((p) => p.dist < p.retail), "dist is below retail for every product");

/* ---------- Group D: baseline + margin maths ---------- */
console.log("\nD. lineBaseline / lineCalc");
const mkLine = (prod, basis, price, qty = 1) =>
  ({ uid: "t", ...prod, dist: prod.dist, basis, price: String(price), qty });

eq(T.lineBaseline(mkLine(kma, "distributor")), 18645, "distributor basis resolves dist");
eq(T.lineBaseline(mkLine(kma, "dealer")), 22983, "dealer basis unchanged");
eq(T.lineBaseline(mkLine(kma, "retail")), 33900, "retail basis unchanged (MRP)");
eq(T.lineBaseline(mkLine(swp, "distributor")), 1254.34, "Stonewater distributor basis");

// Hand-computed: price 25000, base 18645 -> margin 6355, pct 0.2542
const c = T.lineCalc(mkLine(kma, "distributor", 25000, 2));
eq(c.priced, true, "priced line");
eq(c.base, 18645, "base");
eq(c.lineTotal, 50000, "line total = price x qty");
eq(c.marginRs, 12710, "margin rupees = (25000-18645) x 2");
near(c.marginPct, 0.2542, 0.0001, "margin pct = (price-base)/price");

// Distributor must show a LARGER margin than dealer on the same entered price.
const cd = T.lineCalc(mkLine(kma, "dealer", 25000));
ok(c.marginPct / 2 > 0 && T.lineCalc(mkLine(kma, "distributor", 25000)).marginPct > cd.marginPct,
   "distributor margin exceeds dealer margin at the same price");

// A distributor baseline is unpriced when dist is missing.
eq(T.lineCalc({ uid: "z", retail: 100, dealer: 80, dist: NaN, basis: "distributor", price: "90", qty: 1 }).priced,
   false, "missing dist leaves the line unpriced");

/* ---------- Group E: dropdown markup ---------- */
console.log("\nE. dropdown");
const html = T.qLineHTML(mkLine(kma, "distributor", 25000));
const opts = [...html.matchAll(/<option value="([a-z]+)"([^>]*)>([^<]+)<\/option>/g)];
eq(opts.map((o) => o[1]).join(","), "retail,dealer,distributor", "option order Retail, Dealer, Distributor");
eq(opts[2][3], "Distributor", "label is exactly 'Distributor' with no tax annotation");
ok(opts[2][2].includes("selected"), "selected state reflects basis");
ok(!opts[2][2].includes("disabled"), "enabled when dist is present");
const html2 = T.qLineHTML({ uid: "t", model: "X", brandName: "B", description: "",
  retail: 100, dealer: 80, dist: NaN, basis: "retail", price: "", qty: 1 });
ok(/value="distributor"[^>]*disabled/.test(html2), "disabled when dist is absent");

/* ---------- Group F: defaults and totals ---------- */
console.log("\nF. defaults + totals");
T.quote = [];
T.addLine(kma);
eq(T.quote[0].basis, "retail", "new line defaults to retail, never distributor");
eq(T.quote[0].dist, 18645, "dist carried onto the line");
T.quote[0].basis = "distributor"; T.quote[0].price = "25000"; T.quote[0].qty = "2";
T.quote.push({ uid: "q9", ...swp, basis: "distributor", price: "2000", qty: 1 });
const tot = T.quoteTotals();
eq(tot.te, 52000, "blended entered total");
near(tot.tb, 18645 * 2 + 1254.34, 0.01, "blended baseline total mixes brands");
near(tot.tp, (52000 - (18645 * 2 + 1254.34)) / 52000, 0.0001, "blended margin pct");

/* ---------- Group G: internal list stays internal ---------- */
console.log("\nG. containment");
ok(idx.every((p) => !("distCost" in p)), "distCost never enters the product index");
ok(!src.includes("distdealer"), "app.js contains no reference to the internal list id");
ok(!fs.readFileSync(path.join(SITE, "index.html"), "utf8").includes("Distributor"),
   "no Distributor string hard-coded in index.html");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
