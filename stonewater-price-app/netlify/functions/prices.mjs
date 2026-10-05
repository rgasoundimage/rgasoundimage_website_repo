import { supabaseAdmin, selectAll, buildCatalog, json } from "../lib/catalog.mjs";

// GET /api/prices -> the full catalogue in the shape app.js expects.
// Served from Supabase on every request, so an edit made on the admin screen
// shows up on the next reload. The service worker keeps the last good copy
// for offline use.
export async function handler(event) {
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });
  try {
    const rows = await selectAll(supabaseAdmin(), "price_catalog", ["product_id", "list_id"]);
    return json(200, buildCatalog(rows));
  } catch (err) {
    console.error("prices:", err);
    return json(500, { error: err.message || "Could not load prices" });
  }
}
