import { supabaseAdmin, selectAll, json, passcodeMatches, LISTS, BRANDS } from "../lib/catalog.mjs";

// POST /api/admin-prices  (header: x-admin-passcode)
//   { action: "list" }                    -> every product with its inputs + calculated prices
//   { action: "save", product, prices }   -> create/update one product and its typed-in prices
//   { action: "delete", id }              -> delete a product (its prices go with it)
//   { action: "publish" }                 -> rebuild the site so the app shows the changes
//
// The passcode is checked HERE against the ADMIN_PASSCODE env var, never in the
// browser: this endpoint writes with the service-role key.
export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) return json(500, { error: "ADMIN_PASSCODE is not set on this site" });
  if (!passcodeMatches(event.headers["x-admin-passcode"] || "", expected)) {
    return json(401, { error: "Incorrect admin passcode" });
  }

  let body;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString() : event.body;
    body = JSON.parse(raw || "{}");
  } catch {
    return json(400, { error: "Request body must be JSON" });
  }

  try {
    const supabase = supabaseAdmin();
    if (body.action === "list") return json(200, await listAll(supabase));
    if (body.action === "save") return json(200, await save(supabase, body));
    if (body.action === "delete") return json(200, await remove(supabase, body.id));
    if (body.action === "publish") return json(200, await publish());
    return json(400, { error: `Unknown action "${body.action}"` });
  } catch (err) {
    if (err.status) return json(err.status, { error: err.message });
    console.error("admin-prices:", err);
    return json(500, { error: err.message || "Something went wrong" });
  }
}

const fail = (status, message) => Object.assign(new Error(message), { status });
const STATUSES = ["active", "discontinued", "draft", "archived"];

/* ---------- list ---------- */
async function listAll(supabase) {
  const [products, prices, calc, categories, prefixes] = await Promise.all([
    selectAll(supabase, "price_product_details", ["id"]),
    selectAll(supabase, "product_prices", ["id"]),
    selectAll(supabase, "price_catalog", ["product_id", "list_id"]),
    selectAll(supabase, "categories", ["id"]),
    selectAll(supabase, "category_barcode_prefix", ["id"]),
  ]);
  // The admin screen works in app brand ids; the database uses brand slugs.
  const idForSlug = Object.fromEntries(BRANDS.map((b) => [b.slug, b.id]));
  // Latest edit time, so the screen can tell whether the published app is
  // behind the database. (Deletes are tracked by the screen itself.)
  const stamps = [...products.map((p) => p.updated_at), ...prices.map((r) => r.updated_at)].filter(Boolean);
  return {
    lastChange: stamps.length ? stamps.reduce((a, b) => (a > b ? a : b)) : null,
    brands: BRANDS.map((b) => ({ id: b.id, name: b.name, lists: b.lists })),
    lists: Object.fromEntries(Object.entries(LISTS).map(([id, L]) => [id, {
      label: L.label, inputs: L.inputs, note: L.note || "", labels: L.labels, percentKeys: L.percentKeys,
    }])),
    statuses: STATUSES,
    types: productTypes(categories, prefixes),
    products: products.filter((p) => p.brand in idForSlug)
      .map((p) => shapeProduct({ ...p, brand: idForSlug[p.brand] }, prices, calc)),
  };
}

// Product types are the shared `categories` (the barcode taxonomy). A
// sub-category inherits its parent's barcode prefix, as generate_upc() does.
function productTypes(categories, prefixes) {
  const byId = Object.fromEntries(categories.map((c) => [c.id, c]));
  const prefixOf = Object.fromEntries(prefixes.map((x) => [x.category_id, x.prefix]));
  return categories.map((c) => {
    const parent = c.parent_id ? byId[c.parent_id] : null;
    return {
      id: c.id,
      label: parent ? `${parent.name} → ${c.name}` : c.name,
      prefix: prefixOf[c.id] ?? (parent ? prefixOf[parent.id] : undefined) ?? null,
    };
  }).sort((a, b) => a.label.localeCompare(b.label));
}

// The calculated prices come from price_catalog, which only covers active
// products, so an inactive product shows its inputs but no calculations.
function shapeProduct(p, prices, calc) {
  const inputs = {}, computed = {};
  for (const r of prices) {
    if (r.product_id !== p.id) continue;
    inputs[r.list_id] = Object.fromEntries(
      LISTS[r.list_id].inputs.map(({ column }) => [column, r[column] === null ? null : Number(r[column])]));
  }
  for (const r of calc) if (r.product_id === p.id) computed[r.list_id] = r.prices;
  return {
    id: p.id, brand: p.brand, category: p.category, subcategory: p.subcategory,
    model: p.model, description: p.description, status: p.status, sort_order: p.sort_order,
    type_id: p.type_id,
    updated_at: p.updated_at, inputs, computed,
  };
}

/* ---------- save ---------- */
async function save(supabase, { product = {}, prices = {} }) {
  const brand = BRANDS.find((b) => b.id === product.brand);
  if (!brand) throw fail(400, "Pick a brand");
  const model = text(product.model);
  if (!model) throw fail(400, "Model number is required");
  if (!text(product.subcategory)) throw fail(400, "Price-list group is required");
  if (!product.id && !text(product.type_id)) throw fail(400, "Pick a product type");
  const status = text(product.status) || "active";
  if (!STATUSES.includes(status)) throw fail(400, `Unknown status "${status}"`);
  let sort_order = null;
  if (text(product.sort_order)) {
    sort_order = Number(product.sort_order);
    if (!Number.isInteger(sort_order)) throw fail(400, "Sort order must be a whole number");
  }

  // Validate every price before writing anything. A list with no prices at
  // all is sent as null, which removes the product from that list.
  const payloadPrices = {};
  for (const listId of brand.lists) {
    const L = LISTS[listId];
    const given = prices[listId] || {};
    const row = {};
    for (const { column, label } of L.inputs) row[column] = money(given[column], `${L.label}: ${label}`);
    const any = L.inputs.some(({ column }) => row[column] !== null);
    const main = L.inputs[0];
    if (any && row[main.column] === null) {
      throw fail(400, `${L.label}: ${main.label} is required (or clear every price to remove it from that list)`);
    }
    payloadPrices[listId] = any ? row : null;
  }

  // One transaction in the database: product, price-group lookup/creation, prices.
  const { data: id, error } = await supabase.rpc("price_save_product", {
    p: {
      id: product.id || null, brand: brand.slug, model, type_id: text(product.type_id) || null,
      description: text(product.description), status, sort_order,
      category: text(product.category), subcategory: text(product.subcategory),
      prices: payloadPrices,
    },
  });
  if (error) {
    if (error.code === "23505") throw fail(409, `${model} already exists for ${brand.name}`);
    if (error.code === "P0001") throw fail(400, error.message);   // raised by price_save_product
    throw new Error(error.message);
  }

  const [{ data: p, error: e1 }, { data: pr, error: e2 }, { data: calc, error: e3 }] = await Promise.all([
    supabase.from("price_product_details").select("*").eq("id", id).single(),
    supabase.from("product_prices").select("*").eq("product_id", id),
    supabase.from("price_catalog").select("*").eq("product_id", id),
  ]);
  const e = e1 || e2 || e3;
  if (e) throw new Error(e.message);
  return { product: shapeProduct({ ...p, brand: brand.id }, pr, calc) };
}

/* ---------- delete ---------- */
async function remove(supabase, id) {
  if (!id) throw fail(400, "Missing product id");
  const { error } = await supabase.from("products").delete().eq("id", id);
  // variants.product_id is ON DELETE RESTRICT (23001); a plain FK gives 23503.
  if (error?.code === "23001" || error?.code === "23503") {
    throw fail(409, "This product has SKUs attached, so it can't be deleted. Set its status to discontinued instead.");
  }
  if (error) throw new Error(error.message);
  return { deleted: id };
}

/* ---------- publish ---------- */
// The app reads a static copy of the prices made at build time, so edits
// reach it only after a rebuild. BUILD_HOOK_URL is this site's build hook.
async function publish() {
  const hook = process.env.BUILD_HOOK_URL;
  if (!hook) throw new Error("BUILD_HOOK_URL is not set on this site");
  const res = await fetch(hook, { method: "POST" });
  if (!res.ok) throw new Error(`Netlify did not start the rebuild (HTTP ${res.status})`);
  return { publishing: true };
}

/* ---------- helpers ---------- */
const text = (v) => (v === undefined || v === null ? "" : String(v).trim());

function money(v, what) {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/[,₹\s]/g, ""));
  if (!Number.isFinite(n) || n <= 0) throw fail(400, `${what} must be a number above 0`);
  if (n >= 1e10) throw fail(400, `${what} is too large`);
  return Math.round(n * 100) / 100;
}
