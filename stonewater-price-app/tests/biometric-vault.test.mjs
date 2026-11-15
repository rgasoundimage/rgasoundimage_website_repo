/* PRD v2.7.0 — Face ID / Touch ID vault: bio.js on its own, then wired into app.js.
 *
 * Loads the REAL site/index.html, site/bio.js and site/app.js into jsdom, with
 * Node's real WebCrypto doing the AES-GCM / HKDF. Only the authenticator is a stub:
 * navigator.credentials returns a fixed PRF secret, so these tests prove the LOGIC
 * (vault format, lock/unlock, 401, offline, auto-lock, non-enrolled = 2.6.2). They
 * do NOT prove that iOS Face ID returns a stable PRF in the Home Screen app; that is
 * the manual iPhone checklist (docs/HANDOFF-v2.7.0, section 5).
 */
import { JSDOM } from 'jsdom';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const INDEX = readFileSync(join(ROOT, 'site', 'index.html'), 'utf8');
const EXPR = readFileSync(join(ROOT, 'site', 'expr.js'), 'utf8');
const BIO = readFileSync(join(ROOT, 'site', 'bio.js'), 'utf8');
const APP = readFileSync(join(ROOT, 'site', 'app.js'), 'utf8');
const SW = readFileSync(join(ROOT, 'site', 'sw.js'), 'utf8');

let n = 0;
const ok = (c, label) => { n++; assert.ok(c, `#${n} ${label}`); console.log(`  ok ${String(n).padStart(2, '0')}  ${label}`); };
// Values built inside jsdom's realm have another Object.prototype; compare their JSON, not their identity.
const norm = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
const eq = (a, b, label) => { n++; assert.deepEqual(norm(a), norm(b), `#${n} ${label} — got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`); console.log(`  ok ${String(n).padStart(2, '0')}  ${label}`); };
const group = (t) => console.log('\n' + t);

/* ---------- fixtures ---------- */
const mkCat = (stamp, dealer, full) => ({
  generatedAt: stamp,
  brands: [{ id: 'stonewater', name: 'Stonewater', effectiveDate: '01 Apr 2026', lists: [{
    id: 'praveen', label: 'Price List', internalOnly: false,
    labels: { msrp: 'MSRP', dealer: 'Dealer', distInclTax: 'Distributor (tax incl.)' },
    roles: { customer: ['msrp'], dealer: ['dealer', 'msrp'], subdealer: ['msrp'], internal: ['msrp', 'dealer', 'distInclTax'] },
    percentKeys: [],
    categories: [{ name: 'Commercial', subcategories: [{ name: 'Ceiling', products: [{
      model: 'CS-6LE', description: '6.5in ceiling speaker', hsn: 8518,
      prices: full ? { msrp: 30195, dealer, distInclTax: 15400 } : { msrp: 30195 } }] }] }],
  }] }],
});
const PUB = mkCat('2026-11-01T00:00:00Z', 0, false);
const FULL1 = mkCat('2026-11-01T00:00:00Z', 18117, true);
const FULL2 = mkCat('2026-11-10T00:00:00Z', 17000, true);   // fresher, cheaper dealer price

const CRED_ID = Uint8Array.from({ length: 24 }, (_, i) => 200 - i);
const PRF_A = Uint8Array.from({ length: 32 }, (_, i) => i + 1);
const PRF_B = Uint8Array.from({ length: 32 }, (_, i) => 99 - i);
const same = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;
const domErr = (name) => Object.assign(new Error(name), { name });
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 2000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (fn()) return true; await tick(10); }
  return fn();
}

/* ---------- one fresh "phone" per scenario ---------- */
async function phone({ ls = {}, pk = true, caps, noBioJs = false, net: netOpts = {}, cred: credOpts = {} } = {}) {
  const dom = new JSDOM(INDEX, { url: 'https://prices.test/', pretendToBeVisual: true, runScripts: 'outside-only' });
  const w = dom.window;
  Object.defineProperty(w, 'crypto', { value: webcrypto, configurable: true });
  w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
  for (const [k, v] of Object.entries(ls)) w.localStorage.setItem(k, v);

  const net = { online: true, pass: 'secret', full: FULL1, pub: PUB, calls: [], ...netOpts };
  w.fetch = async (url, opts = {}) => {
    const pass = opts.headers && opts.headers['x-price-passcode'];
    net.calls.push({ url: String(url), pass });
    if (!net.online) throw new TypeError('offline');
    if (String(url).includes('prices-full')) {
      if (pass !== net.pass) return { ok: false, status: 401, json: async () => ({ error: 'Incorrect passcode' }) };
      return { ok: true, status: 200, json: async () => net.full };
    }
    return { ok: true, status: 200, json: async () => net.pub };
  };

  const cred = { prf: PRF_A, noPrf: false, createError: null, getError: null, noResultOnGet: false,
                 createResult: null, calls: { create: [], get: [] }, ...credOpts };
  if (pk) {
    w.PublicKeyCredential = {
      isUserVerifyingPlatformAuthenticatorAvailable: async () => cred.uvpa !== false,
      ...(caps ? { getClientCapabilities: async () => caps } : {}),
    };
    Object.defineProperty(w.navigator, 'credentials', { configurable: true, value: {
      async create({ publicKey }) {
        cred.calls.create.push(publicKey);
        if (cred.createError) throw domErr(cred.createError);
        return { rawId: CRED_ID.buffer.slice(0), getClientExtensionResults: () => ({
          prf: { enabled: !cred.noPrf, ...(cred.createResult ? { results: { first: cred.createResult.buffer.slice(0) } } : {}) } }) };
      },
      async get({ publicKey }) {
        cred.calls.get.push(publicKey);
        if (cred.getError) throw domErr(cred.getError);
        const asked = new Uint8Array(publicKey.allowCredentials[0].id);
        if (!same(asked, CRED_ID)) throw domErr('NotAllowedError');
        return { getClientExtensionResults: () => (cred.noResultOnGet ? {} : { prf: { results: { first: cred.prf.buffer.slice(0) } } }) };
      },
    } });
  }

  const clock = { now: 1_800_000_000_000 };
  w.Date.now = () => clock.now;
  let vis = 'visible';
  Object.defineProperty(w.document, 'visibilityState', { configurable: true, get: () => vis });

  w.eval(EXPR);
  if (!noBioJs) w.eval(BIO);
  w.eval(APP + '\n;window.__t = { get unlocked(){return unlocked}, get memPass(){return memPass}, get DATA(){return DATA}, refresh };');
  await tick(40);

  const doc = w.document, $ = (id) => doc.getElementById(id);
  const click = (el) => el.dispatchEvent(new w.Event('click', { bubbles: true }));
  const selectRole = (r) => { $('roleSelect').value = r; $('roleSelect').dispatchEvent(new w.Event('change', { bubbles: true })); };
  const setVisibility = (v) => { vis = v; doc.dispatchEvent(new w.Event('visibilitychange')); };
  const ls_ = (k) => w.localStorage.getItem(k);
  const allValues = () => Object.keys(w.localStorage).map((k) => [k, w.localStorage.getItem(k)]);
  return { w, doc, $, click, selectRole, setVisibility, ls: ls_, allValues, net, cred, clock, close: () => w.close(),
           B: w.RGABio, t: w.__t, results: () => $('results').textContent };
}
const vaultOf = async () => {              // a vault made by a real enrolment, to start other "phones" from
  const p = await phone();
  await p.B.enrol({ passcode: 'secret', catalogue: FULL1 });
  const raw = p.ls('sw_vault'); p.close(); return raw;
};
const ct = (p) => JSON.parse(p.ls('sw_vault')).ct;
const codeOf = async (promise) => { try { await promise; return 'resolved'; } catch (e) { return e.code; } };

console.log('\nPRD v2.7.0 — Face ID / Touch ID vault\n');

/* =====================================================================
   1. bio.js on its own
   ===================================================================== */
group('1. supported()');
{
  let p = await phone();
  eq(await p.B.supported(), true, 'platform authenticator present, secure context: supported');
  p.close();
  p = await phone({ pk: false });
  eq(await p.B.supported(), false, 'no PublicKeyCredential: not supported');
  p.close();
  p = await phone({ cred: { uvpa: false } });
  eq(await p.B.supported(), false, 'no platform authenticator: not supported');
  p.close();
  p = await phone({ caps: { 'extension:prf': false } });
  eq(await p.B.supported(), false, 'browser says PRF is unavailable: not supported');
  p.close();
  p = await phone({ caps: { 'extension:prf': true } });
  eq(await p.B.supported(), true, 'browser says PRF is available: supported');
  p.close();
  p = await phone({ caps: {} });
  eq(await p.B.supported(), true, 'browser gives no PRF answer: left to enrol() to find out');
  p.close();
}

group('2. enrol(): vault format and what is asked of the authenticator');
{
  const p = await phone();
  eq(p.B.enrolled(), false, 'nothing enrolled at the start');
  await p.B.enrol({ passcode: 'secret', catalogue: FULL1 });
  eq(p.B.enrolled(), true, 'enrolled after enrol()');
  const raw = p.ls('sw_vault'), v = JSON.parse(raw);
  eq(v.v, 1, 'vault carries a version field (1)');
  eq(Object.keys(v).sort(), ['credId', 'ct', 'iv', 'salt', 'v'], 'vault has exactly v, credId, salt, iv, ct');
  eq(Buffer.from(v.salt, 'base64').length, 32, 'salt is 32 random bytes');
  eq(Buffer.from(v.iv, 'base64').length, 12, 'iv is 12 bytes');
  ok(same(Buffer.from(v.credId, 'base64'), CRED_ID), 'credId is the passkey id');
  ok(!raw.includes('secret') && !raw.includes('CS-6LE') && !raw.includes('18117'),
     'the stored vault holds neither the passcode nor any price (ciphertext only)');
  const c = p.cred.calls;
  eq([c.create.length, c.get.length], [1, 1], 'two prompts: one create, then one get');
  const cr = c.create[0].publicKey || c.create[0];
  eq(cr.rp.id, 'prices.test', 'passkey is bound to the hostname');
  eq(cr.authenticatorSelection, { authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required' },
     'platform authenticator, resident key preferred, user verification required');
  ok(same(new Uint8Array(cr.extensions.prf.eval.first), Buffer.from(v.salt, 'base64')), 'the vault salt is the PRF input');
  eq(new Uint8Array(cr.user.id).length, 16, 'user.id is 16 random bytes');
  ok(/^RGA Prices – device \d{4}-\d{2}-\d{2}$/.test(cr.user.name), 'passkey is named "RGA Prices – <device> <date>"');
  const g = c.get[0];
  eq([g.userVerification, g.rpId], ['required', 'prices.test'], 'the get also requires user verification');
  ok(same(new Uint8Array(g.extensions.prf.eval.first), Buffer.from(v.salt, 'base64')), 'the get reads PRF for the same salt');
  const firstUser = new Uint8Array(cr.user.id), firstSalt = v.salt;
  p.B.remove();
  await p.B.enrol({ passcode: 'secret', catalogue: FULL1 });
  const cr2 = p.cred.calls.create[1];
  ok(!same(firstUser, new Uint8Array(cr2.user.id)), 'a second enrolment uses a different random user.id');
  ok(JSON.parse(p.ls('sw_vault')).salt !== firstSalt, '...and a different salt');
  p.close();
}

group('3. unlock(): round trip, wrong key, tampering, cancel, unknown version');
{
  const raw = await vaultOf();
  let p = await phone({ ls: { sw_vault: raw } });
  const out = await p.B.unlock();
  eq(out, { passcode: 'secret', catalogue: FULL1 }, 'round trip: passcode and catalogue come back intact');
  p.close();

  p = await phone({ ls: { sw_vault: raw }, cred: { prf: PRF_B } });
  eq(await codeOf(p.B.unlock()), 'decrypt-failed', 'wrong key (a different PRF secret) fails to decrypt');
  eq(p.B.enrolled(), true, '...and bio.js itself leaves the vault alone (app.js decides to remove it)');
  p.close();

  const flip = (s) => { const b = Buffer.from(s, 'base64'); b[Math.floor(b.length / 2)] ^= 1; return b.toString('base64'); };
  const v = JSON.parse(raw);
  p = await phone({ ls: { sw_vault: JSON.stringify({ ...v, ct: flip(v.ct) }) } });
  eq(await codeOf(p.B.unlock()), 'decrypt-failed', 'tampered ciphertext fails (GCM tag)');
  p.close();
  p = await phone({ ls: { sw_vault: JSON.stringify({ ...v, iv: flip(v.iv) }) } });
  eq(await codeOf(p.B.unlock()), 'decrypt-failed', 'tampered iv fails');
  p.close();

  p = await phone({ ls: { sw_vault: raw }, cred: { getError: 'NotAllowedError' } });
  eq(await codeOf(p.B.unlock()), 'cancelled', 'dismissed prompt is "cancelled"');
  eq(p.B.enrolled(), true, '...and the vault is untouched');
  p.close();

  p = await phone({ ls: { sw_vault: raw }, cred: { noResultOnGet: true } });
  eq(await codeOf(p.B.unlock()), 'no-prf', 'a get with no PRF result is "no-prf"');
  p.close();

  p = await phone({ ls: { sw_vault: JSON.stringify({ ...v, v: 2 }) } });
  eq(p.B.enrolled(), false, 'unknown vault version is treated as no vault');
  eq(await codeOf(p.B.unlock()), 'no-vault', '...and unlock() says no-vault');
  p.close();
  p = await phone({ ls: { sw_vault: '{not json' } });
  eq(p.B.enrolled(), false, 'an unreadable vault is treated as no vault');
  p.close();
  p = await phone();
  eq(await codeOf(p.B.unlock()), 'no-vault', 'nothing enrolled: no-vault');
  p.close();
}

group('4. enrol() failures store nothing');
{
  let p = await phone({ cred: { createError: 'NotAllowedError' } });
  eq(await codeOf(p.B.enrol({ passcode: 'secret', catalogue: FULL1 })), 'cancelled', 'dismissed at create: cancelled');
  eq(p.ls('sw_vault'), null, '...nothing stored');
  p.close();

  p = await phone({ cred: { noPrf: true } });
  eq(await codeOf(p.B.enrol({ passcode: 'secret', catalogue: FULL1 })), 'no-prf', 'passkey without PRF: no-prf');
  eq([p.ls('sw_vault'), p.cred.calls.get.length], [null, 0], '...nothing stored, no second prompt');
  p.close();

  p = await phone({ cred: { noResultOnGet: true } });
  eq(await codeOf(p.B.enrol({ passcode: 'secret', catalogue: FULL1 })), 'no-prf', 'PRF enabled but no secret returned: no-prf');
  eq(p.ls('sw_vault'), null, '...nothing stored');
  p.close();

  p = await phone({ cred: { createResult: PRF_B } });             // platform answers at create, and disagrees with get
  eq(await codeOf(p.B.enrol({ passcode: 'secret', catalogue: FULL1 })), 'no-prf', 'unstable PRF (create and get disagree): refused');
  eq(p.ls('sw_vault'), null, '...nothing stored');
  p.close();

  p = await phone({ cred: { createResult: PRF_A } });
  await p.B.enrol({ passcode: 'secret', catalogue: FULL1 });
  eq(p.B.enrolled(), true, 'create and get agreeing is accepted');
  p.close();

  p = await phone();
  const Storage = p.w.Storage.prototype, real = Storage.setItem;
  Storage.setItem = function (k, v) { if (k === 'sw_vault') throw Object.assign(new Error('full'), { name: 'QuotaExceededError', code: 22 }); return real.call(this, k, v); };
  eq(await codeOf(p.B.enrol({ passcode: 'secret', catalogue: FULL1 })), 'storage-full', 'QuotaExceededError: storage-full');
  eq([p.B.enrolled(), p.ls('sw_vault')], [false, null], '...no vault, not enrolled');
  p.close();
}

group('5. reseal(): the in-memory key, no prompt');
{
  const raw = await vaultOf();
  let p = await phone({ ls: { sw_vault: raw } });
  eq(await p.B.reseal({ passcode: 'secret', catalogue: FULL2 }), false, 'no session key (fresh page): reseal returns false');
  eq(p.ls('sw_vault'), raw, '...and leaves the vault byte-for-byte as it was');
  await p.B.unlock();
  const before = ct(p), prompts = p.cred.calls.get.length;
  eq(await p.B.reseal({ passcode: 'secret', catalogue: FULL2 }), true, 'after unlock(): reseal succeeds');
  ok(ct(p) !== before, '...ciphertext changed');
  eq(p.cred.calls.get.length, prompts, '...without another prompt');
  p.B.remove();
  eq(await p.B.unlock().then((x) => x, (e) => e.code), 'no-vault', 'remove() deletes the vault');
  eq(await p.B.reseal({ passcode: 'secret', catalogue: FULL2 }), false, 'after remove(): reseal returns false');
  p.close();

  p = await phone({ ls: { sw_vault: raw } });
  await p.B.unlock();
  await p.B.reseal({ passcode: 'secret', catalogue: FULL2 });
  const p2 = await phone({ ls: { sw_vault: p.ls('sw_vault') } });
  eq((await p2.B.unlock()).catalogue, FULL2, 'a new page unlocks the resealed vault and gets the newer catalogue');
  p2.close();

  const racing = p.B.reseal({ passcode: 'secret', catalogue: FULL1 });
  p.B.remove();                                                    // remove() while a reseal is in flight
  eq(await racing, false, 'reseal in flight when remove() runs gives up');
  eq(p.ls('sw_vault'), null, '...and does not bring the vault back');
  p.close();

  p = await phone();
  await p.B.enrol({ passcode: 'secret', catalogue: FULL1 });
  eq(await p.B.reseal({ passcode: 'secret', catalogue: FULL2 }), true, 'enrolment leaves a session key, so reseal works straight after');
  p.close();

  p = await phone({ ls: { sw_vault: raw } });
  await p.B.unlock();
  const store = p.w.Storage.prototype, realSet = store.setItem;
  store.setItem = function (k, v) { if (k === 'sw_vault') throw Object.assign(new Error('full'), { name: 'QuotaExceededError' }); return realSet.call(this, k, v); };
  eq(await p.B.reseal({ passcode: 'secret', catalogue: FULL2 }), false, 'reseal that cannot write returns false');
  eq(p.ls('sw_vault'), raw, '...and the old vault survives');
  p.close();
}

/* =====================================================================
   2. In the app
   ===================================================================== */
group('6. a device that never turned it on behaves as in 2.6.2');
{
  const plain = { sw_unlocked: '1', sw_pass: 'secret', sw_data_full: JSON.stringify(FULL1) };
  const p = await phone({ ls: plain });
  eq(p.t.unlocked, true, 'saved passcode + flag: starts unlocked');
  eq(p.$('lockBtn').hidden, false, 'Lock button visible');
  ok(p.net.calls.some((c) => c.url.includes('prices-full') && c.pass === 'secret'), 'refresh sends the saved passcode');
  ok(p.ls('sw_pass') === 'secret' && p.ls('sw_data_full'), 'passcode and full catalogue stay in storage');
  eq(p.$('bioCard').hidden, true, 'no opt-in card on a plain start');
  eq(p.doc.querySelector('#bioUnlockBtn'), null, 'no Face ID button');
  p.click(p.$('lockBtn'));
  eq([p.ls('sw_unlocked'), p.ls('sw_pass'), p.ls('sw_data_full'), p.ls('sw_vault')], [null, null, null, null], 'Lock deletes passcode and full prices; no vault is created');
  p.selectRole('dealer');
  eq(p.$('modal').hidden, false, 'picking a locked view opens the passcode sheet at once');
  eq(p.$('passNote').hidden, true, '...with no recovery line');
  eq(p.$('lockedUnlock').textContent, 'Enter passcode', 'locked panel keeps its "Enter passcode" button');
  eq(p.doc.querySelector('#bioUnlockBtn'), null, '...and shows no Face ID button');
  p.$('passInput').value = 'secret';
  p.click(p.$('passOk'));
  await until(() => p.t.unlocked);
  eq([p.ls('sw_unlocked'), p.ls('sw_pass')], ['1', 'secret'], 'passcode unlock writes the passcode and flag as before');
  ok(JSON.parse(p.ls('sw_data_full')).brands, '...and the full catalogue');
  eq(p.t.memPass, null, 'nothing is held only in memory');
  await until(() => !p.$('bioCard').hidden);
  eq(p.$('bioCard').hidden, false, 'the one visible change: the opt-in card appears (supported, not enrolled)');
  p.close();
}

group('7. unsupported device, or bio.js missing');
{
  for (const [label, opts] of [['no WebAuthn', { pk: false }], ['bio.js not loaded', { noBioJs: true }], ['browser says no PRF', { caps: { 'extension:prf': false } }]]) {
    const p = await phone({ ...opts, ls: { sw_unlocked: '1', sw_pass: 'secret', sw_data_full: JSON.stringify(FULL1) } });
    await tick(60);
    eq(p.t.unlocked, true, `${label}: starts unlocked as in 2.6.2`);
    p.click(p.$('settingsBtn'));
    await tick(60);
    eq(p.$('bioSettings').hidden, true, `${label}: no Settings section`);
    eq(p.$('bioCard').hidden, true, `${label}: no opt-in card`);
    p.click(p.$('lockBtn'));
    p.selectRole('dealer');
    eq(p.doc.querySelector('#bioUnlockBtn'), null, `${label}: no Face ID button on the locked panel`);
    p.close();
  }
}

group('8. the opt-in card: "Not now" snoozes it for 30 days');
{
  const p = await phone();
  p.selectRole('dealer');
  p.$('passInput').value = 'secret'; p.click(p.$('passOk'));
  await until(() => !p.$('bioCard').hidden);
  eq(p.$('bioCard').hidden, false, 'card shown after a passcode unlock');
  p.click(p.$('bioNot'));
  eq(p.$('bioCard').hidden, true, '"Not now" hides it');
  eq(p.ls('sw_bioSnooze'), String(p.clock.now), '...and records when');
  p.click(p.$('lockBtn')); p.selectRole('dealer');
  p.$('passInput').value = 'secret'; p.click(p.$('passOk'));
  await until(() => p.t.unlocked); await tick(60);
  eq(p.$('bioCard').hidden, true, 'next unlock a day later: still hidden');
  p.click(p.$('lockBtn'));
  p.clock.now += 29 * 24 * 3600 * 1000;
  p.selectRole('dealer'); p.$('passInput').value = 'secret'; p.click(p.$('passOk'));
  await until(() => p.t.unlocked); await tick(60);
  eq(p.$('bioCard').hidden, true, 'after 29 days: still hidden');
  p.click(p.$('lockBtn'));
  p.clock.now += 2 * 24 * 3600 * 1000;
  p.selectRole('dealer'); p.$('passInput').value = 'secret'; p.click(p.$('passOk'));
  await until(() => !p.$('bioCard').hidden);
  eq(p.$('bioCard').hidden, false, 'after 31 days: offered again');
  p.close();
}

group('9. turning it on from the card');
{
  const p = await phone({ ls: { sw_unlocked: '1', sw_pass: 'secret', sw_data_full: JSON.stringify(FULL1) } });
  await until(() => !p.$('bioCard').hidden || false, 300);
  p.click(p.$('lockBtn')); p.selectRole('dealer');
  p.$('passInput').value = 'secret'; p.click(p.$('passOk'));
  await until(() => !p.$('bioCard').hidden);
  p.click(p.$('bioOn'));
  await until(() => p.B.enrolled());
  await until(() => p.ls('sw_pass') === null);
  eq(p.B.enrolled(), true, 'vault written');
  eq([p.ls('sw_pass'), p.ls('sw_data_full'), p.ls('sw_unlocked')], [null, null, null], 'the readable passcode and catalogue are removed from storage');
  eq([p.t.unlocked, p.t.memPass], [true, 'secret'], 'still unlocked; the passcode now lives in memory only');
  eq(p.$('bioCard').hidden, true, 'card gone');
  eq(p.$('lockBtn').hidden, false, 'Lock button still there');
  const leaks = p.allValues().filter(([k, v]) => k !== 'sw_vault' && (/secret/.test(v) || /18117|15400/.test(v)));
  eq(leaks, [], 'no key other than sw_vault holds the passcode or a dealer / distributor price');
  p.net.calls.length = 0;
  await p.t.refresh();
  ok(p.net.calls.some((c) => c.url.includes('prices-full') && c.pass === 'secret'), 'background refresh uses the in-memory passcode');
  eq(p.ls('sw_data_full'), null, '...and does not write the full catalogue back to storage');
  p.close();
}

group('10. turning it on can fail without side effects');
{
  const fresh = async (cred) => {
    const p = await phone({ cred });
    p.selectRole('dealer'); p.$('passInput').value = 'secret'; p.click(p.$('passOk'));
    await until(() => !p.$('bioCard').hidden);
    return p;
  };
  let p = await fresh({ createError: 'NotAllowedError' });
  p.click(p.$('bioOn')); await tick(80);
  eq([p.$('bioErr').hidden, p.$('bioCard').hidden], [true, false], 'cancel: silent, the card stays');
  eq([p.ls('sw_pass'), p.ls('sw_vault')], ['secret', null], '...passcode still stored as before, no vault');
  p.close();

  p = await fresh({ noPrf: true });
  p.click(p.$('bioOn')); await until(() => !p.$('bioErr').hidden);
  eq(p.$('bioErr').textContent, "This device can't do it.", 'no PRF: says so');
  eq(p.$('bioCard').hidden, true, '...and the card goes away');
  ok(p.ls('sw_bioNo'), '...and the option stays hidden on this device');
  eq([p.ls('sw_pass'), p.ls('sw_vault'), p.t.unlocked], ['secret', null, true], '...nothing changed: passcode kept, no vault, still unlocked');
  p.click(p.$('settingsBtn')); await tick(60);
  eq(p.$('bioSettings').hidden, true, '...and Settings no longer offers it');
  p.close();

  p = await fresh();
  const proto = p.w.Storage.prototype, real = proto.setItem;
  proto.setItem = function (k, v) { if (k === 'sw_vault') throw Object.assign(new Error('full'), { name: 'QuotaExceededError', code: 22 }); return real.call(this, k, v); };
  p.click(p.$('bioOn')); await until(() => !p.$('bioErr').hidden);
  ok(/Not enough free storage/.test(p.$('bioErr').textContent), 'storage full: explained');
  eq([p.ls('sw_pass'), p.ls('sw_vault'), p.B.enrolled()], ['secret', null, false], '...no vault, passcode kept');
  p.close();
}

/* a phone that is enrolled, unlocked, and holding a fresher catalogue than the vault */
async function enrolledPhone(extra = {}) {
  const raw = await vaultOf();
  return phone({ ls: { sw_vault: raw }, ...extra });
}

group('11. enrolled device: cold start is locked, with the Face ID button');
{
  const raw = await vaultOf();
  const stale = { sw_vault: raw, sw_unlocked: '1', sw_pass: 'secret', sw_data_full: JSON.stringify(FULL1) };
  const p = await phone({ ls: stale });
  eq(p.t.unlocked, false, 'starts locked even though plain-text copies were lying around');
  eq([p.ls('sw_pass'), p.ls('sw_data_full'), p.ls('sw_unlocked')], [null, null, null], '...and those copies are deleted');
  eq(p.ls('sw_vault'), raw, 'the vault is kept');
  eq(p.$('lockBtn').hidden, true, 'no Lock button while locked');
  p.selectRole('dealer');
  eq(p.$('modal').hidden, true, 'picking a locked view does NOT open the passcode sheet');
  ok(p.$('bioUnlockBtn') && /Unlock with Face ID \/ Touch ID/.test(p.$('bioUnlockBtn').textContent), 'locked panel has the primary Face ID / Touch ID button');
  eq(p.$('lockedUnlock').textContent, 'Use passcode', '...and a "Use passcode" link');
  eq(p.cred.calls.get.length, 0, 'no prompt without a tap');
  p.click(p.$('tabQuote'));
  eq(p.$('modal').hidden, true, 'Quote tab: no passcode sheet either');
  ok(p.$('bioUnlockBtnQ') && p.$('qUnlock').textContent === 'Use passcode', 'Quote locked panel has the same two controls');
  p.click(p.$('qUnlock'));
  eq(p.$('modal').hidden, false, '"Use passcode" opens the passcode sheet');
  p.close();
}

group('12. unlock with Face ID / Touch ID, lock, unlock again (offline)');
{
  const p = await enrolledPhone();
  p.selectRole('dealer');
  p.click(p.$('bioUnlockBtn'));
  await until(() => p.t.unlocked);
  eq(p.t.unlocked, true, 'tap -> unlocked');
  eq(p.t.memPass, 'secret', 'passcode held in memory');
  ok(/18,117/.test(p.results()), 'dealer price visible');
  eq([p.ls('sw_pass'), p.ls('sw_data_full'), p.ls('sw_unlocked')], [null, null, null], 'nothing readable written to storage');
  eq(p.$('lockBtn').hidden, false, 'Lock button shown');
  eq(p.$('bioCard').hidden, true, 'no opt-in card on an enrolled device');
  p.net.full = FULL2;
  await p.t.refresh();
  ok(/17,000/.test(p.results()), 'a later refresh brings the newer price');
  const before = ct(p);
  p.click(p.$('lockBtn'));
  await until(() => ct(p) !== before);
  ok(ct(p) !== before, 'Lock re-encrypted the vault with the newer catalogue (no prompt)');
  eq(p.cred.calls.get.length, 1, '...only one prompt in the whole session so far');
  eq([p.t.unlocked, p.t.memPass, p.ls('sw_pass'), p.ls('sw_data_full')], [false, null, null, null], 'locked: memory and storage hold no readable copy');
  ok(p.B.enrolled(), '...but the vault is kept');
  ok(!/17,000|18,117/.test(p.results()), 'no dealer price on screen');

  p.net.online = false;
  p.selectRole('dealer');
  p.click(p.$('bioUnlockBtn'));
  await until(() => p.t.unlocked);
  eq(p.t.unlocked, true, 'offline: unlocks from the vault');
  ok(/17,000/.test(p.results()), '...showing the catalogue saved at the last lock (newer price)');
  eq(p.ls('sw_pass'), null, '...still nothing readable in storage');
  ok(p.net.calls.some((c) => c.url.includes('prices-full')), 'the server check was attempted in the background');
  eq(p.ls('sw_vault') !== null, true, 'failed server check does not touch the vault');
  p.net.online = true;
  p.net.full = FULL1;
  await p.t.refresh();
  ok(/18,117/.test(p.results()), 'back online, the next refresh replaces it');
  p.close();
}

group('13. Face ID unlock from the Quote tab');
{
  const p = await enrolledPhone();
  p.click(p.$('tabQuote'));
  p.click(p.$('bioUnlockBtnQ'));
  await until(() => p.t.unlocked);
  eq(p.t.unlocked, true, 'unlocked');
  ok(p.$('qAdd'), 'Quote Builder is shown');
  p.close();
}

group('14. things that go wrong at unlock');
{
  let p = await enrolledPhone({ cred: { getError: 'NotAllowedError' } });
  p.selectRole('dealer');
  p.click(p.$('bioUnlockBtn')); await tick(80);
  eq([p.t.unlocked, p.B.enrolled(), p.$('modal').hidden, p.$('bioLockErr').hidden], [false, true, true, true], 'cancelled: stays locked, vault kept, no sheet, no error banner');
  ok(p.$('bioUnlockBtn'), '...and the button is still there');
  p.close();

  p = await enrolledPhone({ cred: { prf: PRF_B } });
  p.selectRole('dealer');
  p.click(p.$('bioUnlockBtn'));
  await until(() => !p.B.enrolled());
  eq(p.B.enrolled(), false, 'passkey gone / secret changed: the vault is removed');
  eq([p.t.unlocked, p.$('modal').hidden], [false, false], '...locked, with the passcode sheet open');
  eq([p.$('passNote').hidden, p.$('passNote').textContent], [false, 'Face ID / Touch ID needs setting up again. Enter the passcode to continue.'], '...and the recovery line');
  eq(p.$('lockedUnlock').textContent, 'Enter passcode', 'the panel behind is the plain 2.6.2 one now');
  p.$('passInput').value = 'secret'; p.click(p.$('passOk'));
  await until(() => p.t.unlocked);
  eq(p.t.unlocked, true, 'entering the passcode unlocks as usual');
  eq(p.ls('sw_pass'), 'secret', '...and, no longer enrolled, behaves as 2.6.2');
  p.close();

  p = await enrolledPhone({ net: { pass: 'changed-on-server' } });
  p.selectRole('dealer');
  p.click(p.$('bioUnlockBtn'));
  await until(() => !p.B.enrolled());
  eq(p.B.enrolled(), false, 'server answers 401 after a good decrypt: the vault is removed');
  eq([p.t.unlocked, p.t.memPass, p.$('modal').hidden, p.$('passNote').hidden], [false, null, false, false], '...locked, passcode sheet open with the recovery line');
  ok(!/18,117/.test(p.results()), '...and no dealer price is left on screen');
  eq([p.ls('sw_pass'), p.ls('sw_data_full')], [null, null], '...nor in storage');
  p.close();

  p = await enrolledPhone({ cred: { noResultOnGet: true } });
  p.selectRole('dealer');
  p.click(p.$('bioUnlockBtn')); await until(() => !p.$('bioLockErr').hidden);
  ok(/isn't available right now/.test(p.$('bioLockErr').textContent), 'no PRF at unlock: explains, offers the passcode');
  eq([p.B.enrolled(), p.t.unlocked], [true, false], '...vault kept (not a proven-bad vault)');
  p.close();
}

group('15. passcode unlock on an enrolled device keeps storage clean');
{
  const p = await enrolledPhone();
  p.selectRole('dealer');
  p.click(p.$('lockedUnlock'));
  p.$('passInput').value = 'secret'; p.click(p.$('passOk'));
  await until(() => p.t.unlocked);
  eq(p.t.unlocked, true, 'unlocked with the passcode');
  eq([p.t.memPass, p.ls('sw_pass'), p.ls('sw_data_full'), p.ls('sw_unlocked')], ['secret', null, null, null], 'passcode in memory only; nothing readable stored');
  await tick(80);
  eq(p.$('bioCard').hidden, true, 'no opt-in card (already enrolled)');
  const raw = p.ls('sw_vault');
  p.setVisibility('hidden'); await tick(60);
  eq(p.ls('sw_vault'), raw, 'no in-memory key (never used Face ID this session): the vault is left exactly as it was');
  p.setVisibility('visible');
  p.click(p.$('lockBtn')); await tick(60);
  eq(p.ls('sw_vault'), raw, 'lock without a key: vault unchanged');
  eq([p.t.unlocked, p.B.enrolled()], [false, true], '...locked, vault kept');
  p.close();
}

group('16. auto-lock after 5 minutes in the background');
{
  const p = await enrolledPhone();
  p.selectRole('dealer');
  p.click(p.$('bioUnlockBtn')); await until(() => p.t.unlocked);
  const MIN = 60 * 1000;
  p.setVisibility('hidden');
  p.clock.now += 4 * MIN;
  p.setVisibility('visible');
  eq(p.t.unlocked, true, 'away 4 min: still unlocked');
  p.setVisibility('hidden');
  p.clock.now += 5 * MIN + 1000;
  p.setVisibility('visible');
  eq(p.t.unlocked, false, 'away just over 5 min: locked on return');
  eq([p.t.memPass, p.ls('sw_pass'), p.ls('sw_data_full')], [null, null, null], '...no readable copy left');
  ok(p.B.enrolled(), '...vault kept');
  p.selectRole('dealer');
  ok(p.$('bioUnlockBtn'), '...and picking a locked view offers the Face ID button');
  p.close();
}

group('17. going to the background refreshes the vault without locking');
{
  const p = await enrolledPhone();
  p.selectRole('dealer');
  p.click(p.$('bioUnlockBtn')); await until(() => p.t.unlocked);
  p.net.full = FULL2;
  await p.t.refresh();
  const before = ct(p);
  p.setVisibility('hidden');
  await until(() => ct(p) !== before);
  ok(ct(p) !== before, 'page hidden: vault re-encrypted with the current catalogue');
  eq(p.t.unlocked, true, '...but not locked yet');
  p.setVisibility('visible');
  const p2 = await phone({ ls: { sw_vault: p.ls('sw_vault') } });
  eq((await p2.B.unlock()).catalogue, FULL2, '...and the saved copy has the newer prices');
  p2.close(); p.close();
}

group('18. Settings section');
{
  let p = await enrolledPhone();
  p.click(p.$('settingsBtn')); await until(() => !p.$('bioSettings').hidden);
  eq([p.$('bioStateTxt').textContent, p.$('bioToggle').textContent], ['On for this device', 'Turn off'], 'enrolled: "On for this device", button "Turn off"');
  eq(p.$('bioStateSub').textContent, 'Locks after 5 min in the background', '...with the auto-lock time');
  p.selectRole('dealer'); p.click(p.$('bioUnlockBtn')); await until(() => p.t.unlocked);
  p.click(p.$('bioToggle'));
  eq(p.B.enrolled(), false, 'Turn off deletes the vault');
  eq([p.t.unlocked, p.t.memPass], [false, null], '...and locks (the readable copy only ever existed in memory)');
  await until(() => p.$('bioToggle').textContent === 'Turn on');
  eq([p.$('bioStateTxt').textContent, p.$('bioToggle').disabled], ['Not set up', true], 'row now reads "Not set up"; Turn on waits for a passcode unlock');
  p.close();

  p = await phone({ ls: { sw_unlocked: '1', sw_pass: 'secret', sw_data_full: JSON.stringify(FULL1) } });
  p.click(p.$('settingsBtn')); await until(() => !p.$('bioSettings').hidden);
  eq([p.$('bioStateTxt').textContent, p.$('bioToggle').textContent, p.$('bioToggle').disabled], ['Not set up', 'Turn on', false], 'supported, not enrolled, unlocked: "Not set up" with an active Turn on');
  p.click(p.$('bioToggle'));
  await until(() => p.B.enrolled());
  await until(() => p.ls('sw_pass') === null);
  eq([p.B.enrolled(), p.ls('sw_pass'), p.t.unlocked], [true, null, true], 'Turn on from Settings enrols the same way');
  await until(() => p.$('bioToggle').textContent === 'Turn off');
  eq(p.$('bioStateTxt').textContent, 'On for this device', 'row updates');
  p.close();
}

group('19. offline and release wiring');
{
  ok(/"bio\.js"/.test(SW), 'sw.js ASSETS lists bio.js (miss this and the app breaks offline only)');
  ok(/const CACHE = "stonewater-dev";/.test(SW), 'service-worker cache name untouched (stamped at build)');
  const i = INDEX.indexOf('<script src="bio.js">'), j = INDEX.indexOf('<script src="app.js">');
  ok(i > 0 && j > i, 'index.html loads bio.js before app.js');
  ok(!/eval\(|new Function/.test(BIO), 'bio.js contains no eval / Function');
}

console.log(`\n${n} assertions passed.`);
process.exit(0);
