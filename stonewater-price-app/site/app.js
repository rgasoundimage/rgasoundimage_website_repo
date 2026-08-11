/* =========================================================
   RGA Price Catalogue — app logic
   ---------------------------------------------------------
   CHANGE THE PASSCODE HERE  ↓↓↓  (one line)
========================================================= */
const PASSCODE = "stonewater";
/* ========================================================= */

const GATED = new Set(["dealer", "subdealer", "internal"]);
const LS = {
  brand: "sw_brand", list: "sw_list", role: "sw_role", unlocked: "sw_unlocked",
  collapsed: "sw_collapsed_", roleEnabled: "sw_roleEnabled", priceEnabled: "sw_priceEnabled"
};

const ROLES = [
  { id: "customer",  label: "Customer · retail" },
  { id: "dealer",    label: "Dealer" },
  { id: "subdealer", label: "Sub-dealer" },
  { id: "internal",  label: "Internal · all" },
];

let DATA = null;
let brandId = null;
let listId = null;
let role = "customer";
let unlocked = localStorage.getItem(LS.unlocked) === "1";
let pendingRole = null;          // role awaiting passcode
let query = "";
let roleEnabled = loadRoleEnabled();
let priceEnabled = loadPriceEnabled();   // { fieldKey: bool }; missing key = shown

function loadRoleEnabled() {
  let v = null;
  try { v = JSON.parse(localStorage.getItem(LS.roleEnabled) || "null"); } catch {}
  const def = { customer: true, dealer: true, subdealer: true, internal: true };
  v = Object.assign(def, v || {});
  if (!ROLES.some((r) => v[r.id])) v.customer = true;   // never all-off
  return v;
}
function saveRoleEnabled() {
  localStorage.setItem(LS.roleEnabled, JSON.stringify(roleEnabled));
}
function loadPriceEnabled() {
  try { return JSON.parse(localStorage.getItem(LS.priceEnabled) || "{}") || {}; }
  catch { return {}; }
}
function savePriceEnabled() {
  localStorage.setItem(LS.priceEnabled, JSON.stringify(priceEnabled));
}
const priceOn = (k) => priceEnabled[k] !== false;   // default true

const $ = (id) => document.getElementById(id);
const brandSel = $("brandSelect"), listSel = $("listSelect"), roleSel = $("roleSelect"), search = $("search");

/* ---------- formatting ---------- */
const inr = (v) =>
  "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const pct = (v) => (Math.round(v * 1000) / 10) + "%";

function fmt(list, key, val) {
  return list.percentKeys.includes(key) ? pct(val) : inr(val);
}

/* ---------- brand & list helpers ---------- */
const curBrand = () => DATA.brands.find((b) => b.id === brandId) || DATA.brands[0];
const curList = () => curBrand().lists.find((l) => l.id === listId);

function populateBrands() {
  brandSel.innerHTML = DATA.brands
    .map((b) => `<option value="${esc(b.id)}">${esc(b.name)}</option>`).join("");
  brandSel.value = brandId;
}
function setBrand(id) {
  brandId = id;
  localStorage.setItem(LS.brand, brandId);
  populateLists();   // list set differs per brand; falls back if current id is gone
  render();
}

// Internal-only lists appear ONLY in the unlocked "Internal" view.
function availableLists() {
  return curBrand().lists.filter((l) => !l.internalOnly || (unlocked && role === "internal"));
}
function populateLists() {
  const avail = availableLists();
  if (!avail.some((l) => l.id === listId)) listId = avail[0].id;
  listSel.innerHTML = avail
    .map((l) => `<option value="${l.id}">${esc(l.label)}</option>`).join("");
  listSel.value = listId;
  localStorage.setItem(LS.list, listId);
}

/* ---------- role helpers ---------- */
const enabledRoles = () => ROLES.filter((r) => roleEnabled[r.id]);
function defaultRole() {
  const en = enabledRoles();
  const open = en.find((r) => !GATED.has(r.id) || unlocked);
  return (open || en[0]).id;
}
function populateRoles() {
  const en = enabledRoles();
  if (!en.some((r) => r.id === role)) role = defaultRole();
  roleSel.innerHTML = en.map((r) => {
    const lock = GATED.has(r.id) && !unlocked ? " 🔒" : "";
    return `<option value="${r.id}">${esc(r.label)}${lock}</option>`;
  }).join("");
  roleSel.value = role;
}
// Single entry point for changing role: keeps dropdowns, lists, lock button, view in sync.
function setRole(r) {
  role = r;
  localStorage.setItem(LS.role, role);
  populateRoles();
  populateLists();
  $("lockBtn").hidden = !unlocked;
  render();
}

function flatten(list) {
  const out = [];
  for (const c of list.categories)
    for (const s of c.subcategories)
      for (const p of s.products)
        out.push({ ...p, _cat: c.name, _sub: s.name });
  return out;
}

/* ---------- collapse state ---------- */
function collapseKey() { return LS.collapsed + brandId + "_" + listId; }
function collapsedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(collapseKey()) || "[]")); }
  catch { return new Set(); }
}
function saveCollapsed(set) {
  localStorage.setItem(collapseKey(), JSON.stringify([...set]));
}

/* ---------- price block per role ---------- */
function priceBlock(list, prices) {
  // Role decides what's allowed; settings further hide unchecked prices.
  const keys = (list.roles[role] || [])
    .filter((k) => k in prices)
    .filter((k) => priceOn(k));
  if (role === "internal") {
    if (!keys.length) return `<div class="price"><span class="sub">No pricing</span></div>`;
    const rows = keys.map((k) => {
      const isPct = list.percentKeys.includes(k);
      return `<div class="row ${isPct ? "pct" : ""}">
        <span class="k">${list.labels[k] || k}</span>
        <span class="v ${k === 'msrp' || k === 'mrp' ? 'amber' : ''}">${fmt(list, k, prices[k])}</span></div>`;
    }).join("");
    return `<div class="pgrid">${rows}</div>`;
  }
  if (!keys.length) return `<div class="price"><span class="sub">—</span></div>`;
  const [primary, ...rest] = keys;
  const sub = rest.map((k) =>
    `<div class="sub"><b>${list.labels[k]}</b> ${fmt(list, k, prices[k])}</div>`).join("");
  return `<div class="price">
      <div class="big"><span class="lbl">${list.labels[primary]}</span>${fmt(list, primary, prices[primary])}</div>
      ${sub}</div>`;
}

function productCard(list, p, withCrumb) {
  const full = role === "internal" ? "full" : "";
  const crumb = withCrumb ? `<div class="crumb">${p._cat} · ${p._sub}</div>` : "";
  return `<div class="prod ${full}">
      <div class="info">
        <div class="model">${esc(p.model)}</div>
        ${p.description ? `<div class="desc">${esc(p.description)}</div>` : ""}
        ${crumb}
      </div>
      ${priceBlock(list, p.prices)}
    </div>`;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- render ---------- */
function render() {
  const list = curList();
  const root = $("results");

  // Gated view, still locked → show an unlock prompt instead of products.
  if (GATED.has(role) && !unlocked) {
    root.innerHTML = `<div class="locked">
        <div class="ic">🔒</div>
        <p>This view is locked.<br>Enter the passcode to see pricing.</p>
        <button id="lockedUnlock" class="btn">Enter passcode</button>
      </div>`;
    $("empty").hidden = true;
    $("countLine").textContent = "Locked";
    $("viewLine").textContent = roleName(role);
    const ub = $("lockedUnlock");
    if (ub) ub.onclick = () => { pendingRole = role; openModal(role); };
    return;
  }

  const q = query.trim().toLowerCase();

  if (q) {
    const matches = flatten(list).filter(
      (p) => p.model.toLowerCase().includes(q) ||
             (p.description || "").toLowerCase().includes(q)
    );
    root.innerHTML = `<div class="prodlist" style="margin-top:10px">` +
      matches.map((p) => productCard(list, p, true)).join("") + `</div>`;
    $("empty").hidden = matches.length > 0;
    updateFooter(list, matches.length, true);
    return;
  }

  $("empty").hidden = true;
  const collapsed = collapsedSet();
  let html = "";
  for (const c of list.categories) {
    html += `<section class="cat">`;
    if (c.name) html += `<div class="cat-head">${esc(c.name)}<span class="rule"></span></div>`;
    for (const s of c.subcategories) {
      const id = c.name + "|" + s.name;
      const isCol = collapsed.has(id);
      html += `<div class="subcat ${isCol ? "collapsed" : ""}" data-id="${esc(id)}">
        <div class="subcat-head" role="button" tabindex="0">
          <h3>${esc(s.name)}</h3>
          <span><span class="meta">${s.products.length}</span> <span class="chev">▾</span></span>
        </div>
        <div class="prodlist">${s.products.map((p) => productCard(list, p, false)).join("")}</div>
      </div>`;
    }
    html += `</section>`;
  }
  root.innerHTML = html;
  updateFooter(list, flatten(list).length, false);
}

const roleName = (r) => ({ customer: "Customer view", dealer: "Dealer view", subdealer: "Sub-dealer view", internal: "Internal view" }[r]);

function updateFooter(list, n, searching) {
  $("countLine").textContent = `${n} product${n === 1 ? "" : "s"}${searching ? " found" : ""}`;
  $("viewLine").textContent = roleName(role);
}

/* ---------- events: collapse ---------- */
$("results").addEventListener("click", (e) => {
  const head = e.target.closest(".subcat-head");
  if (!head) return;
  const box = head.parentElement, id = box.dataset.id;
  const set = collapsedSet();
  box.classList.toggle("collapsed");
  box.classList.contains("collapsed") ? set.add(id) : set.delete(id);
  saveCollapsed(set);
});
$("results").addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("subcat-head")) {
    e.preventDefault(); e.target.click();
  }
});

/* ---------- brand & list selects ---------- */
brandSel.addEventListener("change", () => setBrand(brandSel.value));

listSel.addEventListener("change", () => {
  listId = listSel.value;
  localStorage.setItem(LS.list, listId);
  render();
});

roleSel.addEventListener("change", () => {
  const wanted = roleSel.value;
  setRole(wanted);                       // shows products, or a locked panel if gated
  if (GATED.has(wanted) && !unlocked) {
    pendingRole = wanted;
    openModal(wanted);
  }
});

/* ---------- passcode modal ---------- */
function openModal(wanted, customTitle) {
  const titles = { dealer: "Dealer pricing", subdealer: "Sub-dealer pricing", internal: "Internal pricing" };
  $("modalTitle").textContent = customTitle || titles[wanted] || "Enter passcode";
  $("passErr").hidden = true;
  $("passInput").value = "";
  $("passInput").type = "password";
  $("passToggle").textContent = "Show";
  $("modal").hidden = false;
  setTimeout(() => $("passInput").focus(), 50);
}
function closeModal() { $("modal").hidden = true; pendingRole = null; }

$("passToggle").addEventListener("click", () => {
  const inp = $("passInput");
  const reveal = inp.type === "password";
  inp.type = reveal ? "text" : "password";
  $("passToggle").textContent = reveal ? "Hide" : "Show";
  inp.focus();
});

$("passOk").addEventListener("click", tryUnlock);
$("passInput").addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
$("passCancel").addEventListener("click", closeModal);
$("modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });

function tryUnlock() {
  if ($("passInput").value === PASSCODE) {
    unlocked = true;
    localStorage.setItem(LS.unlocked, "1");
    const wasQuote = pendingQuote;
    const target = pendingRole || role;
    closeModal();
    reflectTabs();
    if (wasQuote) { pendingQuote = false; setTab("quote"); }
    else setRole(target);
  } else {
    $("passErr").hidden = false;
    $("passInput").select();
  }
}

/* ---------- lock ---------- */
$("lockBtn").addEventListener("click", () => {
  unlocked = false;
  localStorage.removeItem(LS.unlocked);
  setRole(defaultRole());
  reflectTabs();
  if (tab === "quote") setTab("catalogue");
});

/* ---------- settings ---------- */
const setCbs = () => [...document.querySelectorAll('#settings input[data-role]')];
const priceCbs = () => [...document.querySelectorAll('#settings input[data-price]')];

function buildPriceChecks() {
  const list = curList();
  const keys = list.roles.internal || [];          // full field set for this list
  $("priceListHint").textContent = "· " + list.label;
  $("priceChecks").innerHTML = keys.map((k) =>
    `<label class="chk"><input type="checkbox" data-price="${esc(k)}" ${priceOn(k) ? "checked" : ""} />
       <span>${esc(list.labels[k] || k)}</span></label>`).join("");
  updatePriceAllLabel();
}
function updatePriceAllLabel() {
  const cbs = priceCbs();
  const allOn = cbs.length && cbs.every((c) => c.checked);
  $("priceAll").textContent = allOn ? "None" : "All";
}

$("settingsBtn").addEventListener("click", () => {
  setCbs().forEach((cb) => { cb.checked = !!roleEnabled[cb.dataset.role]; });
  $("setErr").hidden = true;
  buildPriceChecks();
  $("settings").hidden = false;
});
$("priceAll").addEventListener("click", () => {
  const cbs = priceCbs();
  const allOn = cbs.length && cbs.every((c) => c.checked);
  cbs.forEach((c) => { c.checked = !allOn; });
  updatePriceAllLabel();
});
$("priceChecks").addEventListener("change", updatePriceAllLabel);

function applySettings() {
  const next = {};
  setCbs().forEach((cb) => { next[cb.dataset.role] = cb.checked; });
  if (!Object.values(next).some(Boolean)) { $("setErr").hidden = false; return; }
  roleEnabled = next;
  saveRoleEnabled();
  priceCbs().forEach((cb) => { priceEnabled[cb.dataset.price] = cb.checked; });
  savePriceEnabled();
  setRole(enabledRoles().some((r) => r.id === role) ? role : defaultRole());
  $("settings").hidden = true;
}
$("settingsDone").addEventListener("click", applySettings);
$("settings").addEventListener("click", (e) => { if (e.target.id === "settings") $("settings").hidden = true; });
setCbs().forEach((cb) => cb.addEventListener("change", () => { $("setErr").hidden = true; }));

/* ---------- search ---------- */
search.addEventListener("input", () => {
  query = search.value;
  $("clearSearch").hidden = !query;
  render();
});
$("clearSearch").addEventListener("click", () => {
  search.value = ""; query = ""; $("clearSearch").hidden = true; render(); search.focus();
});

/* =========================================================
   QUOTE BUILDER (internal) — in-memory only, nothing saved.
   A line: { uid, brandId, brandName, model, description,
             retail, dealer, dist,
             basis:'retail'|'dealer'|'distributor', price:'', qty:1 }

   NOTE ON TAX: retail, dealer and the entered price are all pre-tax. `dist`
   is the distributor price INCLUDING taxes (Stonewater `distInclTax`, Kasper
   `distInclTax`). This asymmetry is deliberate -- see PRD v2.4.0 section 4.
   Distributor margins therefore read lower than a like-for-like comparison
   by roughly the tax rate, because they measure against real landed cost.
========================================================= */
let tab = "catalogue";
let quote = [];
let pendingQuote = false;
let uidSeq = 0;
let PRODUCT_INDEX = null;

/* ----- tab + view toggling ----- */
function reflectTabs() {
  $("tabCatalogue").classList.toggle("active", tab === "catalogue");
  $("tabQuote").classList.toggle("active", tab === "quote");
  $("quoteLockIc").hidden = unlocked;
}
function showCatalogue(show) {
  $("controls").hidden = !show;
  $("searchwrap").hidden = !show;
  $("results").hidden = !show;
  $("foot").hidden = !show;
  $("quote").hidden = show;
  if (!show) $("empty").hidden = true;
}
function setTab(t) {
  if (t === "quote" && !unlocked) {
    tab = "quote"; reflectTabs(); showCatalogue(false); renderQuote();
    pendingQuote = true; openModal("quote", "Quote — internal pricing");
    return;
  }
  tab = t; reflectTabs();
  if (t === "catalogue") { showCatalogue(true); render(); }
  else { showCatalogue(false); renderQuote(); }
}
$("tabCatalogue").addEventListener("click", () => setTab("catalogue"));
$("tabQuote").addEventListener("click", () => setTab("quote"));

/* ----- number formatting (signed) ----- */
function qINR(v) {
  const n = Math.round(v);
  return (n < 0 ? "−₹" : "₹") + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
function qPCT(v) {
  return (v < 0 ? "−" : "") + (Math.round(Math.abs(v) * 1000) / 10) + "%";
}
const marginClass = (v) => (v > 0 ? "pos" : v < 0 ? "neg" : "zero");

/* ----- per-line + total math (profit margin = (price − base) / price) ----- */
function lineBaseline(line) {
  const b = line.basis === "dealer" ? line.dealer
          : line.basis === "distributor" ? line.dist
          : line.retail;
  return Number.isFinite(b) ? b : NaN;
}
function lineCalc(line) {
  const price = parseFloat(line.price);
  const qty = Math.max(1, parseInt(line.qty, 10) || 1);
  const base = lineBaseline(line);
  const priced = Number.isFinite(price) && price > 0 && Number.isFinite(base);
  if (!priced) return { priced: false, qty, base };
  return {
    priced: true, qty, base, price,
    lineTotal: price * qty,
    baseTotal: base * qty,
    marginRs: (price - base) * qty,
    marginPct: (price - base) / price,
  };
}
function quoteTotals() {
  let te = 0, tb = 0, any = false;
  for (const l of quote) {
    const c = lineCalc(l);
    if (c.priced) { any = true; te += c.lineTotal; tb += c.baseTotal; }
  }
  const tm = te - tb;
  return { te, tb, tm, tp: te > 0 ? tm / te : 0, any };
}

/* ----- build the cross-brand product index from PUBLIC lists ----- */
function buildProductIndex() {
  const out = [];
  for (const b of DATA.brands) {
    for (const L of b.lists) {
      if (L.internalOnly) continue;
      for (const c of L.categories)
        for (const s of c.subcategories)
          for (const p of s.products) {
            const retail = "msrp" in p.prices ? p.prices.msrp : p.prices.mrp;
            out.push({
              brandId: b.id, brandName: b.name,
              model: p.model, description: p.description || "",
              retail: Number(retail), dealer: Number(p.prices.dealer),
              // Tax-inclusive distributor price. Same key on both brands.
              dist: Number(p.prices.distInclTax),
            });
          }
    }
  }
  return out;
}

/* ----- render the quote view ----- */
function renderQuote() {
  const q = $("quote");
  if (!unlocked) {
    q.innerHTML = `<div class="locked">
        <div class="ic">🔒</div>
        <p>The Quote Builder is internal.<br>Enter the passcode to use it.</p>
        <button id="qUnlock" class="btn">Enter passcode</button>
      </div>`;
    const ub = $("qUnlock");
    if (ub) ub.onclick = () => { pendingQuote = true; openModal("quote", "Quote — internal pricing"); };
    return;
  }
  const lines = quote.length
    ? quote.map(qLineHTML).join("")
    : `<div class="qempty">No products yet.<br><span>Tap “Add product” to start a quote.</span></div>`;

  q.innerHTML = `
    <div class="qhead">
      <button id="qAdd" class="btn qadd">+ Add product</button>
      <button id="qClear" class="btn ghost qclear" ${quote.length ? "" : "disabled"}>Clear</button>
    </div>
    <div class="qlines">${lines}</div>
    ${quoteBarHTML()}`;
  updateSummary();
  // innerHTML wiped the trace nodes; repaint them for any line that carries
  // an expression. (Keystroke updates never re-render — they patch by id.)
  for (const l of quote) setTrace(l.uid, l.priceExpr);
}

function qLineHTML(line) {
  const hasRetail = Number.isFinite(line.retail);
  const hasDealer = Number.isFinite(line.dealer);
  const hasDist = Number.isFinite(line.dist);
  const c = lineCalc(line);
  const baseStr = Number.isFinite(c.base) ? inr(c.base) : "—";
  return `<div class="qline" data-uid="${line.uid}">
    <div class="qline-top">
      <div class="qline-id">
        <span class="qmodel">${esc(line.model)}</span>
        <span class="qtag">${esc(line.brandName)}</span>
      </div>
      <button class="qremove" data-uid="${line.uid}" aria-label="Remove">✕</button>
    </div>
    ${line.description ? `<div class="qline-desc">${esc(line.description)}</div>` : ""}
    <div class="qline-grid">
      <label class="qf">
        <span>Compare to</span>
        <select class="qbasis" data-uid="${line.uid}">
          <option value="retail" ${line.basis === "retail" ? "selected" : ""} ${hasRetail ? "" : "disabled"}>Retail</option>
          <option value="dealer" ${line.basis === "dealer" ? "selected" : ""} ${hasDealer ? "" : "disabled"}>Dealer</option>
          <option value="distributor" ${line.basis === "distributor" ? "selected" : ""} ${hasDist ? "" : "disabled"}>Distributor</option>
        </select>
      </label>
      <label class="qf">
        <span>Baseline</span>
        <div class="qbase" id="bl-${line.uid}">${baseStr}</div>
      </label>
      <label class="qf">
        <span>Your price</span>
        <input class="qprice" data-uid="${line.uid}" type="text" inputmode="decimal"
               enterkeyhint="done" autocomplete="off" autocorrect="off" autocapitalize="off"
               spellcheck="false" placeholder="0" value="${esc(priceFieldValue(line))}" />
        <div class="qexpr-slot">
          <div class="qexpr-hint" id="eh-${line.uid}" hidden></div>
          <div class="qexpr-trace" id="et-${line.uid}" hidden></div>
        </div>
      </label>
      <label class="qf qf-qty">
        <span>Qty</span>
        <input class="qqty" data-uid="${line.uid}" type="number" inputmode="numeric" min="1" step="1" value="${line.qty}" />
      </label>
    </div>
    <div class="qline-calc">
      <div class="qc"><span>Line total</span><b id="lt-${line.uid}">—</b></div>
      <div class="qc"><span>Margin</span><b id="mr-${line.uid}" class="qm">—</b></div>
      <div class="qc"><span>Margin %</span><b id="mp-${line.uid}" class="qm">—</b></div>
    </div>
  </div>`;
}

function quoteBarHTML() {
  return `<div class="qbar">
    <div class="qsum-row"><span>Total · your price</span><b id="sumEntered">—</b></div>
    <div class="qsum-row"><span>Total · baseline</span><b id="sumBase">—</b></div>
    <div class="qsum-row total"><span>Total margin</span>
      <span class="qsum-m"><b id="sumMargin">—</b><span id="sumPct" class="qsum-pct">—</span></span>
    </div>
  </div>`;
}

function updateLineComputed(uid) {
  const line = quote.find((l) => l.uid === uid);
  if (!line) return;
  const c = lineCalc(line);
  const bl = $("bl-" + uid), lt = $("lt-" + uid), mr = $("mr-" + uid), mp = $("mp-" + uid);
  if (bl) bl.textContent = Number.isFinite(c.base) ? inr(c.base) : "—";
  if (!c.priced) {
    if (lt) lt.textContent = "—";
    if (mr) { mr.textContent = "—"; mr.className = "qm"; }
    if (mp) { mp.textContent = "—"; mp.className = "qm"; }
    return;
  }
  if (lt) lt.textContent = qINR(c.lineTotal);
  if (mr) { mr.textContent = qINR(c.marginRs); mr.className = "qm " + marginClass(c.marginRs); }
  if (mp) { mp.textContent = qPCT(c.marginPct); mp.className = "qm " + marginClass(c.marginRs); }
}
function updateSummary() {
  const t = quoteTotals();
  const se = $("sumEntered"), sb = $("sumBase"), sm = $("sumMargin"), sp = $("sumPct");
  if (!se) return;
  if (!t.any) {
    se.textContent = "—"; sb.textContent = "—";
    sm.textContent = "—"; sm.className = ""; sp.textContent = ""; sp.className = "qsum-pct";
    return;
  }
  se.textContent = qINR(t.te);
  sb.textContent = qINR(t.tb);
  sm.textContent = qINR(t.tm); sm.className = marginClass(t.tm);
  sp.textContent = qPCT(t.tp); sp.className = "qsum-pct " + marginClass(t.tm);
}

/* ----- mutations ----- */
// A product is identified by brand + model. One line per product:
// re-adding is a no-op (use the Qty field for multiples).
function inQuote(prod) {
  return quote.some((l) => l.brandId === prod.brandId && l.model === prod.model);
}
function addLine(prod) {
  if (inQuote(prod)) return false;            // no duplicate lines
  // Distributor is never auto-selected -- it is an opt-in comparison. It is
  // only reached as a last resort when neither public price exists.
  const basis = Number.isFinite(prod.retail) ? "retail"
              : Number.isFinite(prod.dealer) ? "dealer"
              : "distributor";
  quote.push({
    uid: "q" + (++uidSeq),
    brandId: prod.brandId, brandName: prod.brandName,
    model: prod.model, description: prod.description,
    retail: prod.retail, dealer: prod.dealer, dist: prod.dist,
    basis, price: "", priceExpr: null, qty: 1,
  });
  renderQuote();
  if (!$("picker").hidden) renderPickResults($("pickSearch").value);   // refresh "Added" marks
  return true;
}
function clearQuote() {
  if (!quote.length) return;
  if (confirm("Clear all products from this quote?")) { quote = []; renderQuote(); }
}

/* ==========================================================
   v2.5.0 — arithmetic in the Your price field  (PRD §4)
   ----------------------------------------------------------
   Parsing lives in expr.js (window.RGAExpr): a tokenizer plus a
   recursive-descent parser. No eval(), no new Function() — this app is
   passcode-gated and shows dealer and distributor cost, so a free-text
   field that reaches an evaluator is a script-injection surface into a
   page holding commercial pricing.

   Line state:
     line.price      resolved value. Integer rupees once resolved, or ""
                     when empty/unresolved. lineCalc() reads only this.
     line.priceExpr  the expression it came from, or null. Display only:
                     it is the trace, and it is what goes back in the
                     field on re-focus. Never used in arithmetic.
   ========================================================== */

// What the input shows AT REST: the resolved number. The expression is put
// back only on focus (see the focusin handler), per PRD §3a.
// Deliberately NOT rupee-formatted — the field has always held a bare number,
// and formatting it would change the plain-number path on every line, which
// is the one path this release must not touch.
function priceFieldValue(line) {
  return (line.price === "" || line.price === null || line.price === undefined)
    ? "" : String(line.price);
}

function setHint(uid, text, isError) {
  const el = $("eh-" + uid);
  if (!el) return;
  if (!text) { el.hidden = true; el.textContent = ""; el.className = "qexpr-hint"; return; }
  el.hidden = false;
  el.textContent = text;
  el.className = isError ? "qexpr-hint qexpr-hint--error" : "qexpr-hint";
}
function setTrace(uid, expr) {
  const el = $("et-" + uid);
  if (!el) return;
  if (!expr) { el.hidden = true; el.innerHTML = ""; return; }
  el.hidden = false;
  el.innerHTML = '<span class="qexpr-badge">\u0192x</span>' + esc(expr);
}
function setPriceError(input, on) {
  if (input) input.classList.toggle("is-expr-error", !!on);
}

/* --- live, on every keystroke (PRD §4.3) ---------------------------------
   A plain number still updates the totals live, exactly as it did in 2.4.1.
   An expression holds the line out of the totals until it resolves on blur,
   which is the same rule an empty price has followed since 2.2.0. */
function priceInputLive(line, input) {
  const r = RGAExpr.evaluate(input.value);
  setPriceError(input, false);
  if (r.state === "ok" && !r.isExpression) {
    line.price = input.value;              // unchanged 2.4.1 behaviour
    setHint(line.uid, "");
  } else if (r.state === "ok") {
    line.price = "";
    setHint(line.uid, "= " + qINR(r.value), false);
  } else if (r.state === "invalid") {
    line.price = "";
    setHint(line.uid, "Can't work that out", true);
    setPriceError(input, true);
  } else {
    // empty, or incomplete mid-keystroke: no hint, and no error flash.
    line.price = "";
    setHint(line.uid, "");
  }
}

/* --- resolve on blur (PRD §3b, §4.3) -------------------------------------
   The rounded whole-rupee figure is the price. It is the only value stored
   and the only value lineCalc() ever sees. Nothing downstream may read the
   unrounded intermediate, or price × qty stops matching the line total. */
function priceResolve(line, input) {
  const r = RGAExpr.evaluate(input.value);
  if (r.state === "ok") {
    line.price = r.value;
    line.priceExpr = r.isExpression ? r.raw : null;
    input.value = String(r.value);
    setPriceError(input, false);
    setHint(line.uid, "");
    setTrace(line.uid, line.priceExpr);
  } else if (r.state === "empty") {
    line.price = "";
    line.priceExpr = null;
    input.value = "";
    setPriceError(input, false);
    setHint(line.uid, "");
    setTrace(line.uid, null);
  } else {
    // invalid, or incomplete at the moment focus left. Keep the text exactly
    // as typed so it can be corrected; the line stays out of the totals.
    line.price = "";
    line.priceExpr = null;
    setPriceError(input, true);
    setHint(line.uid, "Can't work that out", true);
    setTrace(line.uid, null);
  }
  updateLineComputed(line.uid);
  updateSummary();
}

/* --- the operator strip (PRD §4.5.1) -------------------------------------
   inputmode="decimal" gives a keypad with no operator keys on iOS. One strip
   exists and is moved into whichever .qline has focus. It is positioned
   absolutely over .qline-calc, so showing and hiding it causes no reflow and
   the lines below never shift under a finger mid-tap. */
const QEXPR_KEYS = [
  { label: "+",   ch: "+" },
  { label: "\u2212", ch: "-" },
  { label: "\u00D7", ch: "*" },
  { label: "\u00F7", ch: "/" },
  { label: "(",   ch: "(",  secondary: true },
  { label: ")",   ch: ")",  secondary: true },
  { label: "CLR", ch: null, secondary: true },
];
let stripEl = null;
let activePrice = null;

function buildStrip() {
  if (stripEl) return stripEl;
  stripEl = document.createElement("div");
  stripEl.className = "qexpr-strip";
  stripEl.setAttribute("aria-hidden", "true");   // the keys duplicate typing
  stripEl.innerHTML = QEXPR_KEYS.map((k) =>
    '<button type="button" tabindex="-1" class="qexpr-key' +
    (k.secondary ? " qexpr-key--secondary" : "") + '"' +
    (k.ch === null ? ' data-clear="1"' : ' data-ch="' + esc(k.ch) + '"') +
    '>' + esc(k.label) + '</button>').join("");

  // pointerdown + preventDefault, NOT click. A click handler lets the tap
  // blur the input first: the strip vanishes under the finger and the
  // half-typed expression resolves as invalid.
  stripEl.addEventListener("pointerdown", (e) => {
    const key = e.target.closest(".qexpr-key");
    if (!key) return;
    e.preventDefault();
    const inp = activePrice;
    if (!inp) return;
    if (key.dataset.clear) {
      inp.value = "";
      inp.setSelectionRange(0, 0);
    } else {
      insertAtCaret(inp, key.dataset.ch);
    }
    inp.dispatchEvent(new Event("input", { bubbles: true }));
  });
  return stripEl;
}

function insertAtCaret(inp, ch) {
  const start = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
  const end = inp.selectionEnd == null ? start : inp.selectionEnd;
  const next = inp.value.slice(0, start) + ch + inp.value.slice(end);
  if (!RGAExpr.isAcceptableValue(next)) return;   // same rule as typing
  inp.value = next;
  const pos = start + ch.length;
  inp.setSelectionRange(pos, pos);
}

function showStrip(input) {
  const qline = input.closest(".qline");
  if (!qline) return;
  qline.appendChild(buildStrip());
  stripEl.hidden = false;
}
function hideStrip() {
  if (stripEl) stripEl.hidden = true;
}

/* --- keystroke filtering (PRD §4.5.2) ------------------------------------
   The field is type="text" now, so this is what replaces the validation
   type="number" used to provide. Characters outside the grammar never enter
   the value at all. */
$("quote").addEventListener("beforeinput", (e) => {
  const t = e.target;
  if (!t.classList || !t.classList.contains("qprice")) return;
  if (!e.inputType || e.inputType.indexOf("delete") === 0 || e.inputType.indexOf("history") === 0) return;
  const data = e.data == null ? (e.dataTransfer ? e.dataTransfer.getData("text") : "") : e.data;
  if (data === "") return;
  const start = t.selectionStart == null ? t.value.length : t.selectionStart;
  const end = t.selectionEnd == null ? start : t.selectionEnd;
  const next = t.value.slice(0, start) + data + t.value.slice(end);
  if (!RGAExpr.isAcceptableValue(next)) e.preventDefault();
});

/* --- focus in and out ----------------------------------------------------- */
$("quote").addEventListener("focusin", (e) => {
  const t = e.target;
  if (!t.classList || !t.classList.contains("qprice")) return;
  const line = quote.find((l) => l.uid === t.dataset.uid);
  if (!line) return;
  activePrice = t;
  // Re-editing gives back the expression, not the number it resolved to.
  if (line.priceExpr) t.value = line.priceExpr;
  showStrip(t);
});

$("quote").addEventListener("focusout", (e) => {
  const t = e.target;
  if (!t.classList || !t.classList.contains("qprice")) return;
  // A tap on a strip key is itself a blur. Ignore it: focus never really left.
  if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(".qexpr-strip")) return;
  const line = quote.find((l) => l.uid === t.dataset.uid);
  activePrice = null;
  hideStrip();
  if (!line) return;
  priceResolve(line, t);
});

$("quote").addEventListener("keydown", (e) => {
  const t = e.target;
  if (!t.classList || !t.classList.contains("qprice")) return;
  if (e.key === "Enter") { e.preventDefault(); t.blur(); }
});

/* ----- delegated events on the quote view ----- */
$("quote").addEventListener("click", (e) => {
  if (e.target.closest("#qAdd")) return openPicker();
  if (e.target.closest("#qClear")) return clearQuote();
  const rm = e.target.closest(".qremove");
  if (rm) {
    quote = quote.filter((l) => l.uid !== rm.dataset.uid);
    renderQuote();
  }
});
$("quote").addEventListener("input", (e) => {
  const t = e.target;
  const line = quote.find((l) => l.uid === t.dataset.uid);
  if (!line) return;
  if (t.classList.contains("qprice")) priceInputLive(line, t);
  else if (t.classList.contains("qqty")) line.qty = t.value;   // Qty stays a plain integer field
  else return;
  updateLineComputed(line.uid);
  updateSummary();
});
$("quote").addEventListener("change", (e) => {
  const t = e.target;
  if (!t.classList.contains("qbasis")) return;
  const line = quote.find((l) => l.uid === t.dataset.uid);
  if (!line) return;
  line.basis = t.value;
  updateLineComputed(line.uid);
  updateSummary();
});

/* ----- product picker ----- */
function openPicker() {
  if (!PRODUCT_INDEX) PRODUCT_INDEX = buildProductIndex();
  $("pickSearch").value = "";
  $("pickAdded").hidden = true;
  renderPickResults("");
  $("picker").hidden = false;
  setTimeout(() => $("pickSearch").focus(), 50);
}
function closePicker() { $("picker").hidden = true; }
function renderPickResults(q) {
  const term = q.trim().toLowerCase();
  let items = PRODUCT_INDEX;
  if (term) {
    items = items.filter((p) =>
      p.model.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
  }
  const shown = items.slice(0, 80);
  $("pickResults").innerHTML = shown.length
    ? shown.map((p) => {
        const idx = PRODUCT_INDEX.indexOf(p);
        const added = inQuote(p);
        return `<button class="pickrow ${added ? "added" : ""}" data-idx="${idx}">
          <span class="pickinfo">
            <span class="pickmodel">${esc(p.model)}</span>
            ${p.description ? `<span class="pickdesc">${esc(p.description)}</span>` : ""}
          </span>
          ${added
            ? `<span class="pickcheck">✓ Added</span>`
            : `<span class="picktag">${esc(p.brandName)}</span>`}
        </button>`;
      }).join("")
    : `<div class="qempty">No matches.</div>`;
}
$("pickSearch").addEventListener("input", () => renderPickResults($("pickSearch").value));
$("pickResults").addEventListener("click", (e) => {
  const row = e.target.closest(".pickrow");
  if (!row) return;
  const prod = PRODUCT_INDEX[parseInt(row.dataset.idx, 10)];
  if (!prod) return;
  const added = $("pickAdded");
  if (addLine(prod)) {
    added.textContent = `Added ${prod.model} (${prod.brandName})`;
    added.className = "pickadded";
  } else {
    added.textContent = `${prod.model} is already in the quote — adjust its Qty instead.`;
    added.className = "pickadded warn";
  }
  added.hidden = false;
});
$("pickDone").addEventListener("click", closePicker);
$("picker").addEventListener("click", (e) => { if (e.target.id === "picker") closePicker(); });

/* ========================================================= */

/* ---------- boot ---------- */
async function boot() {
  const res = await fetch("prices.json", { cache: "no-cache" });
  DATA = await res.json();

  const savedBrand = localStorage.getItem(LS.brand);
  brandId = savedBrand && DATA.brands.some((b) => b.id === savedBrand) ? savedBrand : DATA.brands[0].id;
  populateBrands();

  const saved = localStorage.getItem(LS.list);
  listId = saved && curBrand().lists.some((l) => l.id === saved) ? saved : curBrand().lists[0].id;

  const savedRole = localStorage.getItem(LS.role);
  if (savedRole && roleEnabled[savedRole] && (!GATED.has(savedRole) || unlocked)) role = savedRole;
  else role = defaultRole();

  populateRoles();
  populateLists();
  $("lockBtn").hidden = !unlocked;
  reflectTabs();
  render();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
    // When an updated service worker takes control, refresh once to show new files.
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });
  }
}
boot();
