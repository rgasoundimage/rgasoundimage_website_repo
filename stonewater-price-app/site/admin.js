/* =========================================================
   RGA Price Catalogue — admin screen
   ---------------------------------------------------------
   Edits the Supabase price tables through /api/admin-prices.
   Only the typed-in prices are edited here (List price, Dist
   cost, MRP…); Dealer, MSRP, margins etc. are calculated by
   the database exactly as the Excel formulas did.

   The passcode is sent with every request and checked by the
   server (ADMIN_PASSCODE env var). It is kept in sessionStorage
   only, so it is forgotten when the tab closes.
========================================================= */
const PASS_KEY = "rga_admin_pass";
const BRAND_KEY = "rga_admin_brand";

let pass = load(sessionStorage, PASS_KEY) || "";
let DATA = null;           // { brands, lists, products }
let brandId = load(localStorage, BRAND_KEY);
let editing = null;        // product being edited, or null when adding

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const inr = (v) => "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const pct = (v) => (Math.round(v * 1000) / 10) + "%";

function load(store, key) { try { return store.getItem(key); } catch { return null; } }
function save(store, key, val) {
  try { val === null ? store.removeItem(key) : store.setItem(key, val); } catch {}
}

/* ---------- API ---------- */
async function api(action, payload = {}) {
  let res, body;
  try {
    res = await fetch("api/admin-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-passcode": pass },
      body: JSON.stringify({ action, ...payload }),
    });
    body = await res.json();
  } catch {
    throw new Error("Couldn't reach the server. Check your connection.");
  }
  if (res.status === 401) { lock(body.error); throw new Error(body.error); }
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

/* ---------- login / lock ---------- */
async function unlock(candidate) {
  pass = candidate;
  $("loginBtn").disabled = true;
  $("loginErr").hidden = true;
  try {
    DATA = await api("list");
    save(sessionStorage, PASS_KEY, pass);
    showEditor();
  } catch (err) {
    $("loginErr").textContent = err.message;
    $("loginErr").hidden = false;
  } finally {
    $("loginBtn").disabled = false;
  }
}

function lock(message) {
  pass = "";
  DATA = null;
  save(sessionStorage, PASS_KEY, null);
  $("editModal").hidden = true;
  $("editor").hidden = true;
  $("lockAdmin").hidden = true;
  $("login").hidden = false;
  $("adminPass").value = "";
  $("loginErr").textContent = message || "";
  $("loginErr").hidden = !message;
}

$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("adminPass").value;
  if (v) unlock(v);
});
$("adminPassToggle").addEventListener("click", () => {
  const inp = $("adminPass");
  const reveal = inp.type === "password";
  inp.type = reveal ? "text" : "password";
  $("adminPassToggle").textContent = reveal ? "Hide" : "Show";
  inp.focus();
});
$("lockAdmin").addEventListener("click", () => lock());

/* ---------- product list ---------- */
const curBrand = () => DATA.brands.find((b) => b.id === brandId) || DATA.brands[0];

function showEditor() {
  checkPublished();
  $("login").hidden = true;
  $("editor").hidden = false;
  $("lockAdmin").hidden = false;
  $("adminBrand").innerHTML = DATA.brands
    .map((b) => `<option value="${esc(b.id)}">${esc(b.name)}</option>`).join("");
  brandId = curBrand().id;
  $("adminBrand").value = brandId;
  render();
}

$("adminBrand").addEventListener("change", () => {
  brandId = $("adminBrand").value;
  save(localStorage, BRAND_KEY, brandId);
  render();
});
$("adminSearch").addEventListener("input", render);

function brandProducts() {
  return DATA.products
    .filter((p) => p.brand === curBrand().id)
    .sort((a, b) => a.sort_order - b.sort_order || a.model.localeCompare(b.model));
}

function inputSummary(p) {
  return curBrand().lists.map((listId) => {
    const L = DATA.lists[listId];
    const vals = p.inputs[listId];
    const head = curBrand().lists.length > 1 ? `${esc(L.label)}: ` : "";
    if (!vals) return `<div>${head}<span class="off">not listed</span></div>`;
    const parts = L.inputs.filter((i) => vals[i.column] !== null)
      .map((i) => `<b>${inr(vals[i.column])}</b>`);
    return `<div>${head}${parts.join(" · ")}</div>`;
  }).join("");
}

function render() {
  const q = $("adminSearch").value.trim().toLowerCase();
  const items = brandProducts().filter((p) => !q ||
    p.model.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));

  // Group by category -> subcategory in sort order, like the catalogue.
  const cats = new Map();
  for (const p of items) {
    if (!cats.has(p.category)) cats.set(p.category, new Map());
    const subs = cats.get(p.category);
    if (!subs.has(p.subcategory)) subs.set(p.subcategory, []);
    subs.get(p.subcategory).push(p);
  }
  let html = "";
  for (const [cat, subs] of cats) {
    html += `<section class="cat">`;
    if (cat) html += `<div class="cat-head">${esc(cat)}<span class="rule"></span></div>`;
    for (const [sub, prods] of subs) {
      html += `<div class="subcat">
        ${sub ? `<div class="subcat-head"><h3>${esc(sub)}</h3><span class="meta">${prods.length}</span></div>` : ""}
        <div class="prodlist">${prods.map((p) => `
          <button class="arow-prod" data-id="${p.id}">
            <span class="info">
              <span class="model">${esc(p.model)}${p.status !== "active" ? ` <span class="status">${esc(p.status)}</span>` : ""}</span>
              ${p.description ? `<span class="desc">${esc(p.description)}</span>` : ""}
            </span>
            <span class="inputs">${inputSummary(p)}</span>
          </button>`).join("")}
        </div></div>`;
    }
    html += `</section>`;
  }
  $("adminList").innerHTML = html;
  $("adminEmpty").hidden = items.length > 0;
}

$("adminList").addEventListener("click", (e) => {
  const row = e.target.closest(".arow-prod");
  if (!row) return;
  const p = DATA.products.find((x) => x.id === row.dataset.id);
  if (p) openEdit(p);
});
$("addProduct").addEventListener("click", () => openEdit(null));

/* ---------- edit sheet ---------- */
const form = () => $("editForm");

function openEdit(p) {
  editing = p;
  const b = curBrand();
  $("editTitle").textContent = p ? `Edit ${p.model}` : `Add ${b.name} product`;
  $("editSub").textContent = p
    ? "Change the typed-in prices; the rest are calculated when you save."
    : "Fill in the product and at least the first price of each list it belongs to.";
  const f = form();
  for (const k of ["model", "description", "category", "subcategory", "sort_order"]) {
    f.elements[k].value = p ? (p[k] ?? "") : "";
  }
  f.elements.status.value = p ? p.status : "active";
  f.elements.type_id.innerHTML = `<option value="">Choose a type…</option>` + DATA.types.map((t) =>
    `<option value="${esc(t.id)}">${esc(t.label)}${t.prefix ? ` · barcode ${esc(t.prefix)}` : " · no barcode prefix"}</option>`).join("");
  f.elements.type_id.value = p ? (p.type_id || "") : "";
  // Suggest existing names so new products land in an existing group.
  const prods = brandProducts();
  const uniq = (xs) => [...new Set(xs.filter(Boolean))];
  $("catList").innerHTML = uniq(prods.map((x) => x.category)).map((c) => `<option value="${esc(c)}">`).join("");
  $("subList").innerHTML = uniq(prods.map((x) => x.subcategory)).map((c) => `<option value="${esc(c)}">`).join("");

  $("priceInputs").innerHTML = b.lists.map((listId) => {
    const L = DATA.lists[listId];
    const vals = (p && p.inputs[listId]) || {};
    return `<div class="set-section">
      <div class="set-head">${esc(L.label)}</div>
      ${L.inputs.map((i, n) => `
        <label class="afield"><span>${esc(i.label)}${n === 0 ? " *" : ""}</span>
          <input class="money" data-list="${esc(listId)}" data-col="${esc(i.column)}"
                 inputmode="decimal" autocomplete="off" placeholder="—"
                 value="${vals[i.column] ?? ""}" /></label>`).join("")}
      ${L.note ? `<p class="hint">${esc(L.note)}</p>` : ""}
      ${p && p.computed[listId] ? calcGrid(L, p.computed[listId])
        : p && p.status !== "active" && vals[L.inputs[0].column] ? `<p class="hint">Not shown in the app while ${esc(p.status)}.</p>` : ""}
    </div>`;
  }).join("") + `<p class="calc-note">Leave every price in a list blank to remove the product from that list.</p>`;

  $("deleteProduct").hidden = !p;
  $("editErr").hidden = true;
  $("editModal").hidden = false;
  setTimeout(() => f.elements.model.focus(), 50);
}

function calcGrid(L, prices) {
  const rows = Object.keys(L.labels).filter((k) => k in prices).map((k) => {
    const isPct = L.percentKeys.includes(k);
    return `<div class="row ${isPct ? "pct" : ""}"><span class="k">${esc(L.labels[k])}</span>
      <span class="v">${isPct ? pct(prices[k]) : inr(prices[k])}</span></div>`;
  }).join("");
  return `<div class="calc"><div class="hint">Calculated (as last saved)</div><div class="pgrid">${rows}</div></div>`;
}

function closeEdit() { $("editModal").hidden = true; editing = null; }
$("cancelEdit").addEventListener("click", closeEdit);
$("editModal").addEventListener("click", (e) => { if (e.target.id === "editModal") closeEdit(); });

form().addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = form();
  const product = { brand: curBrand().id };
  if (editing) product.id = editing.id;
  for (const k of ["model", "description", "type_id", "category", "subcategory", "status", "sort_order"]) {
    product[k] = f.elements[k].value;
  }
  const prices = {};
  for (const inp of $("priceInputs").querySelectorAll("input[data-list]")) {
    (prices[inp.dataset.list] ||= {})[inp.dataset.col] = inp.value;
  }
  const btn = $("saveProduct");
  btn.disabled = true;
  $("editErr").hidden = true;
  try {
    const { product: saved } = await api("save", { product, prices });
    const i = DATA.products.findIndex((x) => x.id === saved.id);
    if (i >= 0) DATA.products[i] = saved; else DATA.products.push(saved);
    closeEdit();
    render();
    markDirty();
    toast(`Saved ${saved.model}. Publish to update the app.`);
  } catch (err) {
    $("editErr").textContent = err.message;
    $("editErr").hidden = false;
  } finally {
    btn.disabled = false;
  }
});

$("deleteProduct").addEventListener("click", async () => {
  if (!editing) return;
  if (!confirm(`Delete ${editing.model} and all its prices? This can't be undone.`)) return;
  const { id, model } = editing;
  try {
    await api("delete", { id });
    DATA.products = DATA.products.filter((x) => x.id !== id);
    closeEdit();
    render();
    markDirty();
    toast(`Deleted ${model}. Publish to update the app.`);
  } catch (err) {
    $("editErr").textContent = err.message;
    $("editErr").hidden = false;
  }
});

/* ---------- publish ----------
   The app reads prices.json, a copy of the prices made when the site is
   built. Edits reach it only after Publish (a rebuild, ~1–2 minutes). */
let publishedAt = null;     // generatedAt of the live prices.json
let sessionDirty = false;   // saved/deleted something this session
let publishing = false;

async function fetchPublishedAt() {
  try {
    const res = await fetch("prices.json", { cache: "no-store" });
    const d = await res.json();
    return d.generatedAt ? Date.parse(d.generatedAt) : null;
  } catch { return null; }
}
async function checkPublished() {
  publishedAt = await fetchPublishedAt();
  updatePublishBar();
}
function markDirty() { sessionDirty = true; updatePublishBar(); }

function isDirty() {
  const last = DATA && DATA.lastChange ? Date.parse(DATA.lastChange) : null;
  return sessionDirty || (last !== null && publishedAt !== null && last > publishedAt);
}
function updatePublishBar(msg) {
  const bar = $("publishBar");
  if (msg) { $("publishMsg").textContent = msg; bar.hidden = false; $("publishBtn").hidden = publishing; return; }
  if (publishing) return;
  bar.hidden = !isDirty();
  $("publishBtn").hidden = false;
  $("publishMsg").textContent = "You have changes the app doesn't show yet.";
}

$("publishBtn").addEventListener("click", async () => {
  const btn = $("publishBtn");
  btn.disabled = true;
  try {
    await api("publish");
  } catch (err) {
    toast(err.message, true);
    return;
  } finally {
    btn.disabled = false;
  }
  const before = publishedAt || 0;
  publishing = true;
  sessionDirty = false;
  updatePublishBar("Publishing… the app updates in about 1–2 minutes.");
  // Watch for the new prices.json to go live (up to ~6 minutes).
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 15000));
    const at = await fetchPublishedAt();
    if (at && at > before) {
      publishedAt = at;
      publishing = false;
      updatePublishBar("Published ✓ The app now shows your changes.");
      setTimeout(() => updatePublishBar(), 6000);
      return;
    }
  }
  publishing = false;
  updatePublishBar("Still publishing. Check the app again in a few minutes.");
});

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg, isErr) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast" + (isErr ? " err" : "");
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3500);
}

/* ---------- boot ---------- */
if (pass) unlock(pass); else setTimeout(() => $("adminPass").focus(), 50);
