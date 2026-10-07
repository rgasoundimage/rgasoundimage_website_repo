/* v2.6.0 — Supabase price tables. Run: node tests/supabase-catalog.test.mjs
   Rehearses the real migration + import against a snapshot of the live
   catalogue (tests/fixtures/existing-catalog-*.sql) in an in-memory Postgres
   (PGlite), then builds the catalogue exactly as the prices function does and
   checks it against the last Excel-built prices.json (tests/fixtures). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { buildCatalog, publicCatalog } from "../netlify/lib/catalog.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8");
const EXCEL = JSON.parse(read("tests", "fixtures", "prices.json"));
const INACTIVE = ["CS-4LM"];   // set to discontinued by the import

let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? (pass++, console.log("  ok   " + msg))
                                 : (fail++, console.error("  FAIL " + msg)); };

const db = new PGlite();
await db.exec(read("tests", "fixtures", "existing-catalog-schema.sql"));
await db.exec(read("tests", "fixtures", "existing-catalog-data.sql"));
const q = async (sql, params) => (await db.query(sql, params)).rows;
const before = Object.fromEntries((await q(`select model_number, id, category_id, primary_image_url
  from public.products`)).map((r) => [r.model_number, r]));

await db.exec(read("supabase", "001_price_tables.sql"));
await db.exec(read("supabase", "001_price_tables.sql"));   // must be re-runnable
await db.exec(read("supabase", "002_seed.sql"));

const save = async (p) => (await q("select public.price_save_product($1::jsonb) as id", [JSON.stringify(p)]))[0].id;
const product = async (model) => (await q(`select p.*, c.slug as type_slug, g.heading, g.name as group_name
  from public.products p join public.categories c on c.id = p.category_id
  left join public.price_groups g on g.id = p.price_group_id where p.model_number = $1`, [model]))[0];
const typeId = async (slug) => (await q(`select id from public.categories where slug = $1`, [slug]))[0].id;

/* ---------- A: catalogue matches the Excel-built one ---------- */
console.log("\nA. SQL formulas reproduce the spreadsheet");
const built = buildCatalog(await q("select * from public.price_catalog"));

// Known, intended differences from the Excel-built file:
//  1. HSN is not stored (it will live on the SKU table).
//  2. Stonewater shares one products table, so Dist/Dealer shows the fuller
//     Price List descriptions/group names.
//  3. MP-01's Excel row was missing its two margin formulas; SQL fills them.
//  4. Inactive products are not in the catalogue.
const norm = (cat) => {
  const c = structuredClone(cat);
  for (const b of c.brands) for (const L of b.lists) {
    for (const k of L.categories) for (const s of k.subcategories) {
      s.products = s.products.filter((p) => !INACTIVE.includes(p.model));
      for (const p of s.products) {
        delete p.hsn;
        if (L.id === "distdealer") { p.description = ""; s.name = s.name.replace(/s$/, ""); }
        if (p.model === "Media Player MP-01" && L.id === "praveen") { delete p.prices.dealerMargin; delete p.prices.msrpMargin; }
      }
    }
  }
  return c;
};
// Object key order is irrelevant to app.js (it reads keys via list.roles);
// array order (categories, products) is not, and is still compared.
const canon = (v) => JSON.stringify(v, (_, x) => x && typeof x === "object" && !Array.isArray(x)
  ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x);
const count = (L) => L.categories.reduce((a, c) => a + c.subcategories.reduce((a, s) => a + s.products.length, 0), 0);
for (const b of EXCEL.brands) for (const L of b.lists) {
  const want = norm(EXCEL).brands.find((x) => x.id === b.id).lists.find((x) => x.id === L.id);
  const got = norm(built).brands.find((x) => x.id === b.id).lists.find((x) => x.id === L.id);
  ok(canon(got) === canon(want), `${b.name} / ${L.label}: all ${count(want)} active products, every price identical`);
  if (canon(got) !== canon(want)) {
    const flat = (x) => x.categories.flatMap((c) => c.subcategories.flatMap((s) => s.products.map((p) => [c.name, s.name, p])));
    const g = flat(got), w = flat(want);
    for (let i = 0; i < Math.max(g.length, w.length); i++)
      if (canon(g[i]) !== canon(w[i])) { console.error("    first diff:", canon(w[i]), "\n    got:       ", canon(g[i])); break; }
  }
}
const allBuilt = (bid, lid) => built.brands.find((b) => b.id === bid).lists.find((L) => L.id === lid)
  .categories.flatMap((c) => c.subcategories).flatMap((s) => s.products);
const mp01 = allBuilt("stonewater", "praveen").find((p) => p.model === "Media Player MP-01");
ok(mp01.prices.dealerMargin === 0.38 && mp01.prices.msrpMargin === 0.5, "MP-01 margins now filled in (0.38 / 0.5)");
ok(!allBuilt("stonewater", "praveen").some((p) => p.model === "CS-4LM") &&
   !allBuilt("stonewater", "distdealer").some((p) => p.model === "CS-4LM"), "CS-4LM (discontinued) is hidden from both lists");
ok(JSON.stringify(Object.keys(built)) === '["brands"]' && built.brands.every((b) => b.lists.every((L) =>
  ["id", "label", "internalOnly", "labels", "roles", "percentKeys", "categories"].every((k) => k in L))),
  "output keeps the prices.json shape app.js reads");

/* ---------- B: the import against the live snapshot ---------- */
console.log("\nB. Import into the existing catalogue");
const counts = async () => (await q(`select
  (select count(*)::int from public.brands) brands,
  (select count(*)::int from public.categories) categories,
  (select count(*)::int from public.category_barcode_prefix) prefixes,
  (select count(*)::int from public.products) products,
  (select count(*)::int from public.price_groups) groups,
  (select count(*)::int from public.product_prices) prices`))[0];
const c1 = await counts();
ok(canon(c1) === canon({ brands: 3, categories: 12, prefixes: 7, products: 124, groups: 30, prices: 191 }),
   `3 brands, 12 categories, 7 prefixes untouched; 124 products, 30 groups, 191 price rows (got ${canon(c1)})`);
ok((await q(`select name from public.brands where slug = 'stonewater-audio'`))[0].name === "Stonewater",
   'brand "Stonewater Audio" renamed to "Stonewater" (slug unchanged)');
ok(!(await product("D1000")), "D1000 deleted");

const cs6 = await product("CS-6LE");
ok(cs6.id === before["CS-6LE"].id, "CS-6LE updated in place (same id)");
ok(cs6.name === "CS-6LE" && cs6.slug === "stonewater-audio-cs-6le" &&
   cs6.short_description === "30 Watt rms, 6 Inch 2-way speaker without LMT",
   "CS-6LE: name, slug and description replaced from Excel");
ok(cs6.type_slug === "in-ceiling-speakers" && cs6.primary_image_url === before["CS-6LE"].primary_image_url,
   "CS-6LE: product type and image kept");
ok(cs6.heading === "Commercial" && cs6.group_name === "In Ceiling Speakers", "CS-6LE: price-list group Commercial → In Ceiling Speakers");
const cs4 = await product("CS-4LM");
ok(cs4.status === "discontinued" && cs4.id === before["CS-4LM"].id, "CS-4LM discontinued, same id");
const qube = await product("QUBE 3");
ok(qube.id === before["QUBE 3"].id &&
   (await q(`select 1 from public.variants where product_id = $1 and sku_code = 'TEST-VALID'`, [qube.id])).length === 1,
   "QUBE 3 keeps its SKU (TEST-VALID)");
const e5 = await product("ELEMENT 5T N");
ok(e5.id === before["ELEMENT 5T N"].id, "existing models matched despite spacing/case (ELEMENT 5T N)");

const types = { "RZ118": "professional-subwoofer", "RZ8": "professional-speakers", "KMA-8120": "commercial-amplifiers",
  "Avalon X520": "cinema-amplifier", "GPW530": "commercial-speakers", "Media Pro": "media-player",
  "MIX12": "commercial-amplifiers", "DC48": "professional-amplifier", "KSP-A36": "professional-amplifier",
  "KCS-N508T": "in-ceiling-speakers", "PS - 18D20 OD": "professional-subwoofer", "IFR3600": "professional-subwoofer" };
const gotTypes = {};
for (const m of Object.keys(types)) gotTypes[m] = (await product(m))?.type_slug;
ok(canon(gotTypes) === canon(types), "new products got the approved types (spot check of 12)");
const rz = await product("RZ118");
ok(rz.heading === "PRO AUDIO" && rz.group_name === "Rezolution Series" && rz.slug === "stonewater-audio-rz118",
   "RZ118: price-list group PRO AUDIO → Rezolution Series, slug stonewater-audio-rz118");
const kma = await product("KMA-8120");
ok(kma.heading === "" && kma.group_name === "MIXER AMPLIFIER" && kma.slug === "kasper-kma-8120", "KMA-8120: group MIXER AMPLIFIER, slug kasper-kma-8120");

await db.exec(read("supabase", "002_seed.sql"));   // re-run
ok(canon(await counts()) === canon(c1) && (await product("CS-6LE")).id === cs6.id, "re-running the import changes nothing");

/* ---------- C: barcodes ---------- */
console.log("\nC. Barcode prefixes (generate_upc)");
const upc = async (model) => (await q(`select public.generate_upc(id) as u from public.products where model_number = $1`, [model]))[0].u;
const valid = async (u) => (await q(`select public.is_valid_upc($1) as v`, [u]))[0].v;
for (const [model, prefix, why] of [["RZ118", "4", "Professional Subwoofer"], ["KMA-8120", "5", "Commercial Amplifiers"],
                                    ["CS-6LE", "1", "In-Ceiling → parent Commercial Speakers (fixed)"]]) {
  const u = await upc(model);
  ok(u.startsWith(prefix) && await valid(u), `${model}: ${u} — prefix ${prefix} (${why}), valid check digit`);
}
let avalonErr = "";
try { await upc("Avalon X520"); } catch (e) { avalonErr = e.message; }
ok(/No barcode prefix/.test(avalonErr), "Avalon X520 (Cinema Amplifier) has no prefix yet, as agreed");

/* ---------- D: editing one input re-derives everything ---------- */
console.log("\nD. Changing a typed-in price updates the derived ones");
await db.exec(`update public.product_prices set list_price = 3000
  where list_id = 'praveen' and product_id = (select id from public.products where model_number = 'CS-6LE')`);
const cs = (await q(`select prices from public.price_catalog where model = 'CS-6LE' and list_id = 'praveen'`))[0].prices;
ok(Number(cs.dealer) === 2100, "dealer = list × 0.7 → 2100");
ok(Number(cs.msrp) === 3540, "msrp = ROUND(list × 1.18, -1) → 3540");
ok(Number(cs.msrp30) === 2480, "msrp −30% = ROUND(3540 × 0.7, -1) → 2480 (half rounds up, like Excel)");

/* ---------- E: price_save_product (the admin screen's write path) ---------- */
console.log("\nE. price_save_product");
const newId = await save({ brand: "kasper", model: "TEST-1", description: "Test amp", subcategory: "MIXER AMPLIFIER",
  type_id: await typeId("commercial-amplifiers"), prices: { kasper: { mrp: 10000 } } });
const t1 = (await q(`select * from public.price_catalog where product_id = $1`, [newId]))[0];
ok(t1 && t1.subcategory === "MIXER AMPLIFIER" && t1.category === "" && Number(t1.prices.dealer) === 6780,
   "new Kasper product joins the existing group and gets calculated prices (dealer 6780)");
const lastInGroup = (await q(`select max(p.sort_order) m from public.products p join public.price_groups g on g.id = p.price_group_id
  where g.name = 'MIXER AMPLIFIER' and p.model_number <> 'TEST-1'`))[0].m;
ok(t1.sort_order === lastInGroup + 1, "new product is placed at the end of its group");
await save({ id: newId, brand: "kasper", model: "TEST-1", subcategory: "NEW GROUP", status: "discontinued",
  prices: { kasper: { mrp: 12000 } } });
ok((await q(`select 1 from public.price_catalog where product_id = $1`, [newId])).length === 0,
   "setting status to discontinued hides it from the catalogue");
ok((await product("TEST-1")).type_slug === "commercial-amplifiers", "an update without type_id keeps the type");
ok((await q(`select 1 from public.price_groups where name = 'NEW GROUP'`)).length === 1, "an unknown group is created");
const swId = await save({ brand: "stonewater-audio", model: "TEST-2", category: "Commercial", subcategory: "Streamer",
  type_id: await typeId("media-player"),
  prices: { praveen: { list_price: 1000 }, distdealer: { list_price: 900, dist_cost: 500 } } });
await save({ id: swId, brand: "stonewater-audio", model: "TEST-2", category: "Commercial", subcategory: "Streamer",
  prices: { praveen: { list_price: 1000 }, distdealer: null } });
ok(canon((await q(`select list_id from public.product_prices where product_id = $1`, [swId])).map((r) => r.list_id)) === '["praveen"]',
   "a null price list removes the product from that list only");

/* ---------- F: guard rails ---------- */
console.log("\nF. Database constraints");
const rejects = async (fn, msg) => {
  try { await fn(); ok(false, msg); } catch { ok(true, msg); }
};
await rejects(() => db.exec(`insert into public.product_prices (product_id, list_id, mrp)
  select id, 'kasper', 100 from public.products where model_number = 'CS-6LE'`),
  "a Stonewater product cannot get a Kasper price row");
await rejects(async () => save({ brand: "stonewater-audio", model: "CS-6LE", subcategory: "Streamer",
  type_id: await typeId("media-player"), prices: {} }), "duplicate model within a brand is rejected");
await rejects(() => db.exec(`update public.product_prices set list_price = -5 where list_id = 'praveen'`),
  "negative prices are rejected");
await rejects(() => save({ brand: "kasper", model: "TEST-3", subcategory: "X", prices: {} }), "a new product needs a type");
await rejects(async () => save({ brand: "kasper", model: "TEST-3", type_id: await typeId("media-player"), prices: {} }),
  "a product needs a price-list group");
await db.exec(`delete from public.products where model_number = 'KMA-8120'`);
const left = (await q(`select count(*)::int as n from public.product_prices pr
  left join public.products p on p.id = pr.product_id where p.id is null`))[0].n;
ok(left === 0, "deleting a product deletes its prices");
await rejects(() => db.exec(`delete from public.products where model_number = 'QUBE 3'`),
  "a product with SKUs cannot be deleted");

/* ---------- G: public file vs full catalogue (v2.6.1) ---------- */
console.log("\nG. Public prices.json carries customer prices only");
const fullCat = { generatedAt: "2026-10-07T00:00:00.000Z", ...built };
const pub = publicCatalog(fullCat);
const pubLists = pub.brands.flatMap((b) => b.lists);
ok(!pubLists.some((L) => L.internalOnly) && !pubLists.some((L) => L.id === "distdealer"), "internal-only Dist / Dealer list is not public");
const pubKeys = new Set(pubLists.flatMap((L) => L.categories.flatMap((c) => c.subcategories.flatMap((s) => s.products.flatMap((p) => Object.keys(p.prices))))));
ok(canon([...pubKeys].sort()) === canon(["mrp", "msrp"]), `only MSRP / MRP are public (got ${[...pubKeys].join(", ")})`);
const pubJson = JSON.stringify(pub);
ok(!/dealer"|distInclTax|distRga|distCost|Margin"|listPrice"|listPlusTax/.test(pubJson.replace(/"labels":\{[^}]*\}|"roles":\{[^}]*\}|"percentKeys":\[[^\]]*\]/g, "")),
   "no dealer, distributor, list or margin figures anywhere in the public file");
ok(count(pubLists.find((L) => L.id === "praveen")) === 66 && count(pubLists.find((L) => L.id === "products")) === 57,
   "public file still has every active product (66 Stonewater, 57 Kasper)");
ok(pub.generatedAt === fullCat.generatedAt, "public file carries the build time (shown in the app footer)");
const appJs = read("site", "app.js");
ok(!/PASSCODE\s*=|"stonewater"/.test(appJs), "app.js no longer contains the passcode");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
