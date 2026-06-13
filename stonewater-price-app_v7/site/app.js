/* =========================================================
   Stonewater Price Catalogue — app logic
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
  $("effDate").textContent = "Eff. " + curBrand().effectiveDate;
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
function openModal(wanted) {
  const titles = { dealer: "Dealer pricing", subdealer: "Sub-dealer pricing", internal: "Internal pricing" };
  $("modalTitle").textContent = titles[wanted] || "Enter passcode";
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
    const target = pendingRole || role;
    closeModal();
    setRole(target);
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

/* ---------- boot ---------- */
async function boot() {
  const res = await fetch("prices.json", { cache: "no-cache" });
  DATA = await res.json();

  const savedBrand = localStorage.getItem(LS.brand);
  brandId = savedBrand && DATA.brands.some((b) => b.id === savedBrand) ? savedBrand : DATA.brands[0].id;
  populateBrands();
  $("effDate").textContent = "Eff. " + curBrand().effectiveDate;

  const saved = localStorage.getItem(LS.list);
  listId = saved && curBrand().lists.some((l) => l.id === saved) ? saved : curBrand().lists[0].id;

  const savedRole = localStorage.getItem(LS.role);
  if (savedRole && roleEnabled[savedRole] && (!GATED.has(savedRole) || unlocked)) role = savedRole;
  else role = defaultRole();

  populateRoles();
  populateLists();
  $("lockBtn").hidden = !unlocked;
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
