/* Shared by the build script and the Netlify functions.
 *
 * The price DATA lives in Supabase (supabase/001_price_tables.sql). This file
 * holds the app CONFIG: which brands and price lists exist, their labels, and
 * which prices each role may see. */
import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set on this site");
  return createClient(url, key, { auth: { persistSession: false } });
}

// Supabase caps a single select (1000 rows by default); page through to be
// safe. `order` must give a stable total order or pages can overlap.
export async function selectAll(supabase, table, order, page = 1000) {
  const out = [];
  for (let from = 0; ; from += page) {
    let q = supabase.from(table).select("*");
    for (const col of order) q = q.order(col);
    const { data, error } = await q.range(from, from + page - 1);
    if (error) throw new Error(error.message);
    out.push(...data);
    if (data.length < page) return out;
  }
}

export const json = (statusCode, body, cache = "no-cache") => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": cache },
  body: JSON.stringify(body),
});

// Constant-time passcode check. Hashing both sides makes the comparison
// independent of length.
export function passcodeMatches(given, expected) {
  const a = createHash("sha256").update(String(given)).digest();
  const b = createHash("sha256").update(String(expected)).digest();
  return timingSafeEqual(a, b);
}

/* `inputs` are the typed-in columns of product_prices for this list, in the
   order the admin screen shows them. The first one is required. `note` is
   shown under them on the admin screen. */
const LIST_FROM_MSRP = "List price is calculated from MSRP: MSRP ÷ 1.18, rounded up to the next ₹10. It is only recalculated when you change the MSRP.";
export const LISTS = {
  praveen: {
    appId: "praveen", label: "Price List", internalOnly: false,
    inputs: [
      { column: "msrp", label: "MSRP (tax incl.)" },
      { column: "dist_incl_tax", label: "Distributor price (tax incl.)" },
    ],
    note: LIST_FROM_MSRP,
    labels: {
      listPrice: "List Price +18%", dealer: "Dealer", subdealer: "Sub-dealer",
      distInclTax: "Distributor (tax incl.)", msrp: "MSRP", msrp35: "MSRP −35%",
      msrp30: "MSRP −30%", msrp20: "MSRP −20%", msrp15: "MSRP −15%",
      dealerMargin: "Dealer margin", msrpMargin: "MSRP margin",
    },
    roles: {
      customer: ["msrp"], dealer: ["dealer", "msrp"], subdealer: ["subdealer", "msrp"],
      internal: ["msrp", "msrp35", "msrp30", "msrp20", "msrp15", "dealer", "subdealer",
                 "listPrice", "distInclTax", "dealerMargin", "msrpMargin"],
    },
    percentKeys: ["dealerMargin", "msrpMargin"],
  },
  distdealer: {
    appId: "distdealer", label: "Dist / Dealer", internalOnly: true,
    inputs: [
      { column: "msrp", label: "MSRP (tax incl.)" },
      { column: "dist_cost", label: "Distributor price (pre-tax)" },
    ],
    note: LIST_FROM_MSRP,
    labels: {
      distCost: "Distributor cost", listPrice: "List Price +18%", dealer: "Dealer",
      subdealer: "Sub-dealer", distInclTax: "Distributor (tax incl.)", msrp: "MSRP",
      msrp30: "MSRP −30%", msrp20: "MSRP −20%", dealerDistMargin: "Dealer-dist margin",
      subdealerDistMargin: "Sub-dealer-dist margin",
    },
    roles: {
      customer: ["msrp"], dealer: ["dealer", "msrp"], subdealer: ["subdealer", "msrp"],
      internal: ["msrp", "msrp30", "msrp20", "dealer", "subdealer", "listPrice", "distCost",
                 "distInclTax", "dealerDistMargin", "subdealerDistMargin"],
    },
    percentKeys: ["dealerDistMargin", "subdealerDistMargin"],
  },
  kasper: {
    // "products" is the id the app has always used; kept so saved selections survive.
    appId: "products", label: "Price List", internalOnly: false,
    inputs: [{ column: "mrp", label: "MRP (tax incl.)" }],
    labels: {
      distRga: "Dist RGA cost", distInclTax: "Distributor (tax incl.)", dealer: "Dealer",
      listPlusTax: "List price +Tax", mrp: "MRP", dealerMargin: "Dealer margin",
      distMargin: "Dist margin",
    },
    roles: {
      customer: ["mrp"], dealer: ["dealer", "mrp"], subdealer: ["mrp"],
      internal: ["mrp", "dealer", "listPlusTax", "distRga", "distInclTax", "dealerMargin", "distMargin"],
    },
    percentKeys: ["dealerMargin", "distMargin"],
  },
};

// id: what app.js and saved selections use. slug: the brands.slug row in Supabase.
export const BRANDS = [
  { id: "stonewater", slug: "stonewater-audio", name: "Stonewater", effectiveDate: "01 Apr 2026", lists: ["praveen", "distdealer"] },
  { id: "kasper", slug: "kasper", name: "Kasper", effectiveDate: "2026", lists: ["kasper"] },
];

/* Rows from the price_catalog view -> the prices.json shape app.js reads:
   { brands: [{ id, name, effectiveDate, lists: [{ id, label, internalOnly,
     labels, roles, percentKeys, categories: [{ name, subcategories: [{ name,
     products: [{ model, description, prices }] }] }] }] }] } */
export function buildCatalog(rows) {
  const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order || a.model.localeCompare(b.model));
  return {
    brands: BRANDS.map((b) => ({
      id: b.id, name: b.name, effectiveDate: b.effectiveDate,
      lists: b.lists.map((listId) => {
        const L = LISTS[listId];
        // Map preserves first-seen order, so categories follow sort_order.
        const cats = new Map();
        for (const r of sorted) {
          if (r.brand !== b.slug || r.list_id !== listId) continue;
          if (!cats.has(r.category)) cats.set(r.category, new Map());
          const subs = cats.get(r.category);
          if (!subs.has(r.subcategory)) subs.set(r.subcategory, []);
          subs.get(r.subcategory).push({
            model: r.model, description: r.description || "",
            prices: cleanPrices(r.prices, Object.keys(L.labels)),
          });
        }
        return {
          id: L.appId, label: L.label, internalOnly: L.internalOnly,
          labels: L.labels, roles: L.roles, percentKeys: L.percentKeys,
          categories: [...cats].map(([name, subs]) => ({
            name, subcategories: [...subs].map(([name, products]) => ({ name, products })),
          })),
        };
      }),
    })),
  };
}

// jsonb sorts its keys, so emit them in the list's label order instead. Zeros
// were always omitted from the catalogue; keep doing that.
function cleanPrices(prices, order) {
  const out = {};
  for (const k of order) {
    if (!prices || !(k in prices)) continue;
    const n = Number(prices[k]);
    if (Number.isFinite(n) && n !== 0) out[k] = n;
  }
  return out;
}

/* The catalogue anyone can download (site/prices.json): customer prices only.
   Internal-only lists (Dist / Dealer) are dropped, and each product keeps just
   the keys of its list's `customer` role (MSRP / MRP). Dealer, distributor and
   margin figures only ever leave the server through the passcode-checked
   prices-full function. */
export function publicCatalog(full) {
  return {
    generatedAt: full.generatedAt,
    brands: full.brands.map((b) => ({
      ...b,
      lists: b.lists.filter((L) => !L.internalOnly).map((L) => {
        const keep = new Set(L.roles.customer || []);
        return {
          ...L,
          categories: L.categories.map((c) => ({
            ...c,
            subcategories: c.subcategories.map((s) => ({
              ...s,
              products: s.products.map((p) => ({
                ...p,
                prices: Object.fromEntries(Object.entries(p.prices).filter(([k]) => keep.has(k))),
              })),
            })),
          })),
        };
      }),
    })),
  };
}
