/* RGA Price App — Face ID / Touch ID unlock vault.   PRD v2.7.0 §3–4.
 *
 * What this is: a WebAuthn passkey whose PRF extension yields a 32-byte secret
 * that only comes out after Face ID / Touch ID succeeds. That secret becomes an
 * AES-GCM key. The passcode and the full catalogue (dealer / distributor prices)
 * are stored ENCRYPTED under it. Locked, the device holds only ciphertext.
 *
 * What this is not: a WebAuthn prompt in front of plain-text storage. That adds
 * no protection (PRD §3.2) and is deliberately not implemented. Where PRF is
 * missing the option is hidden and the passcode flow stays as it was.
 *
 * Self-contained. No dependencies. The only global is RGABio. The DOM is not
 * touched; app.js owns every screen. All crypto is WebCrypto.
 *
 * Vault (localStorage key "sw_vault", JSON):
 *   { v:1, credId:<b64>, salt:<b64, 32 random bytes = the PRF input>,
 *     iv:<b64, 12 bytes, fresh for every write>, ct:<b64 AES-GCM> }
 *   ct encrypts JSON.stringify({ passcode, catalogue }).
 *   Key = HKDF-SHA-256(PRF output, info "rga-prices-vault-v1") -> AES-GCM-256.
 *   HKDF is only domain separation: the PRF output is already uniform.
 *   An unknown "v" is treated as no vault.
 *
 * Session key: after enrol() or unlock() the derived key is held in this
 * closure as a NON-EXTRACTABLE CryptoKey, memory only, never persisted. reseal()
 * uses it to refresh the vault at lock time without a prompt (PRD §4.6).
 *
 * Errors: every rejection is a BioError whose .code is one of
 *   cancelled       user dismissed the prompt (silent in the UI)
 *   unsupported     no WebAuthn / WebCrypto / platform authenticator here
 *   no-prf          the passkey did not provide a PRF secret
 *   decrypt-failed  wrong key, tampered or unreadable vault (passkey deleted)
 *   no-vault        nothing enrolled
 *   storage-full    localStorage refused the vault (nothing was enrolled)
 *   failed          anything else
 *
 * Browser:  <script src="bio.js"></script>  ->  window.RGABio
 * Node:     require('./site/bio.js')        ->  module.exports
 */
(function (root) {
  'use strict';

  var VAULT_KEY = 'sw_vault';
  var VAULT_VERSION = 1;
  var CONTEXT = 'rga-prices-vault-v1';      // HKDF info and AES-GCM additional data

  var sessionKey = null;                    // CryptoKey | null — never persisted
  var epoch = 0;                            // bumped by remove(): cancels in-flight reseals

  function BioError(code, message, cause) {
    var e = new Error(message || code);
    e.name = 'BioError';
    e.code = code;
    if (cause) e.cause = cause;
    return e;
  }

  /* ---------- small helpers ---------- */
  function utf8(s) { return new root.TextEncoder().encode(s); }
  function rand(n) { return root.crypto.getRandomValues(new Uint8Array(n)); }
  function toB64(buf) {
    var u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    var s = '';
    for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return root.btoa(s);
  }
  function fromB64(str) {
    var s = root.atob(str);
    var u8 = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
    return u8;
  }
  function sameBytes(a, b) {
    a = new Uint8Array(a); b = new Uint8Array(b);
    if (a.length !== b.length) return false;
    var d = 0;
    for (var i = 0; i < a.length; i++) d |= a[i] ^ b[i];
    return d === 0;
  }

  // iOS reports a dismissed or timed-out prompt as NotAllowedError, so those two
  // cannot be told apart. Both are "stay locked, say nothing".
  function mapWebAuthnError(e) {
    var n = e && e.name;
    if (n === 'NotAllowedError' || n === 'AbortError') return BioError('cancelled', 'Prompt dismissed', e);
    if (n === 'NotSupportedError' || n === 'SecurityError') return BioError('unsupported', (e && e.message) || n, e);
    return BioError('failed', (e && e.message) || String(e), e);
  }
  function isQuota(e) {
    return !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                   e.code === 22 || e.code === 1014);
  }

  /* ---------- vault storage ---------- */
  function readVault() {
    var v;
    try { v = JSON.parse(root.localStorage.getItem(VAULT_KEY) || 'null'); } catch (e) { return null; }
    if (!v || v.v !== VAULT_VERSION) return null;                       // unknown version = no vault
    if (typeof v.credId !== 'string' || typeof v.salt !== 'string' ||
        typeof v.iv !== 'string' || typeof v.ct !== 'string') return null;
    return v;
  }
  function writeVault(v) {
    try { root.localStorage.setItem(VAULT_KEY, JSON.stringify(v)); }
    catch (e) { throw isQuota(e) ? BioError('storage-full', 'Not enough storage for the vault', e)
                                 : BioError('failed', (e && e.message) || 'Could not save the vault', e); }
  }

  /* ---------- crypto ---------- */
  async function deriveKey(prfBytes) {
    var subtle = root.crypto.subtle;
    var ikm = await subtle.importKey('raw', prfBytes, 'HKDF', false, ['deriveKey']);
    return subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: utf8(CONTEXT) },
      ikm, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);   // non-extractable
  }
  async function encrypt(key, iv, plaintext) {
    return root.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv, additionalData: utf8(CONTEXT) }, key, utf8(plaintext));
  }
  async function decrypt(key, vault) {
    var buf = await root.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(vault.iv), additionalData: utf8(CONTEXT) }, key, fromB64(vault.ct));
    return new root.TextDecoder().decode(buf);
  }

  /* ---------- WebAuthn ---------- */
  function prfFromAssertion(cred) {
    var ext = cred && cred.getClientExtensionResults && cred.getClientExtensionResults();
    var out = ext && ext.prf && ext.prf.results && ext.prf.results.first;
    return out && out.byteLength >= 16 ? new Uint8Array(out) : null;
  }
  async function getPrf(credId, salt) {
    var a;
    try {
      a = await root.navigator.credentials.get({ publicKey: {
        challenge: rand(32),
        rpId: root.location.hostname,
        allowCredentials: [{ type: 'public-key', id: credId }],
        userVerification: 'required',
        extensions: { prf: { eval: { first: salt } } },
      } });
    } catch (e) { throw mapWebAuthnError(e); }
    if (!a) throw BioError('cancelled', 'No credential returned');
    return prfFromAssertion(a);
  }
  function deviceWord() {
    var ua = (root.navigator && root.navigator.userAgent) || '';
    return /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Mac/.test(ua) ? 'Mac' : 'device';
  }

  /* ---------- public API ---------- */

  // Can this device even try? The definitive PRF check happens at enrol(), because
  // browsers only reveal PRF support by creating a credential.
  async function supported() {
    try {
      if (root.isSecureContext === false) return false;
      if (typeof root.PublicKeyCredential === 'undefined') return false;
      if (!root.crypto || !root.crypto.subtle) return false;
      if (!root.navigator || !root.navigator.credentials) return false;
      if (typeof root.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') return false;
      if (!(await root.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())) return false;
      // Newer browsers can say up front that PRF is unavailable. Only an explicit
      // `false` hides the option; a missing answer lets enrol() find out.
      if (typeof root.PublicKeyCredential.getClientCapabilities === 'function') {
        var caps = await root.PublicKeyCredential.getClientCapabilities();
        if (caps && caps['extension:prf'] === false) return false;
      }
      return true;
    } catch (e) { return false; }
  }

  function enrolled() { return readVault() !== null; }

  // Creates the passkey, reads its PRF secret, encrypts, stores, verifies.
  // Two Face ID / Touch ID prompts: create, then get (PRD §4.2).
  // On any failure nothing is left stored. (A passkey already created cannot be
  // deleted from a web page; it stays in the user's Passwords until they remove it.)
  async function enrol(data) {
    if (!data || !data.passcode || !data.catalogue) throw BioError('failed', 'Nothing to store');
    // Synchronous on purpose: nothing may be awaited before create(), because iOS
    // wants the WebAuthn call to start from the user's tap. supported() is async,
    // so the app calls it earlier, when it decides to show the option.
    if (!root.crypto || !root.crypto.subtle || !root.navigator || !root.navigator.credentials) {
      throw BioError('unsupported', 'Not supported on this device');
    }

    var salt = rand(32);
    var name = 'RGA Prices – ' + deviceWord() + ' ' + new Date().toISOString().slice(0, 10);
    var cred;
    try {
      cred = await root.navigator.credentials.create({ publicKey: {
        rp: { name: 'RGA Prices', id: root.location.hostname },
        // Random per enrolment: a reused user id could make iOS overwrite another
        // device's passkey and silently break its vault (PRD §5.3).
        user: { id: rand(16), name: name, displayName: name },
        challenge: rand(32),
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required' },
        extensions: { prf: { eval: { first: salt } } },
      } });
    } catch (e) { throw mapWebAuthnError(e); }
    if (!cred) throw BioError('cancelled', 'No credential returned');

    var ext = cred.getClientExtensionResults ? cred.getClientExtensionResults() : {};
    var atCreate = prfFromAssertion(cred);                 // some platforms return it here, most do not
    if (!ext.prf || (ext.prf.enabled !== true && !atCreate)) throw BioError('no-prf', 'This passkey has no PRF support');

    var credId = new Uint8Array(cred.rawId);
    var prf = await getPrf(credId, salt);                  // second prompt
    if (!prf) throw BioError('no-prf', 'The passkey returned no PRF secret');
    // Cheap consistency check: if the platform also answered at create time, the
    // two answers must agree, otherwise the secret is not stable and every later
    // unlock would fail. (A fully independent re-read would cost a third prompt.)
    if (atCreate && !sameBytes(atCreate, prf)) throw BioError('no-prf', 'PRF secret was not stable');

    var key = await deriveKey(prf);
    var plaintext = JSON.stringify({ passcode: data.passcode, catalogue: data.catalogue });
    var iv = rand(12);
    var ct = await encrypt(key, iv, plaintext);
    writeVault({ v: VAULT_VERSION, credId: toB64(credId), salt: toB64(salt), iv: toB64(iv), ct: toB64(ct) });

    // Verify what was actually written: read it back and decrypt it.
    var back = readVault(), ok = false;
    try { ok = !!back && (await decrypt(key, back)) === plaintext; } catch (e) { ok = false; }
    if (!ok) { remove(); throw BioError('decrypt-failed', 'The stored vault did not verify'); }

    sessionKey = key;
  }

  // Face ID / Touch ID, then decrypt. Must be called from a user tap.
  async function unlock() {
    var v = readVault();
    if (!v) throw BioError('no-vault', 'Nothing enrolled');
    var prf = await getPrf(fromB64(v.credId), fromB64(v.salt));
    if (!prf) throw BioError('no-prf', 'The passkey returned no PRF secret');
    var key, obj;
    try {
      key = await deriveKey(prf);
      obj = JSON.parse(await decrypt(key, v));
    } catch (e) { throw BioError('decrypt-failed', 'Could not open the vault', e); }
    if (!obj || !obj.passcode || !obj.catalogue) throw BioError('decrypt-failed', 'Vault content is not valid');
    sessionKey = key;
    return { passcode: obj.passcode, catalogue: obj.catalogue };
  }

  // Re-encrypt with the in-memory session key. No prompt. Returns false, and
  // leaves the vault exactly as it was, when there is no key (unlocked by passcode,
  // or the page was reloaded), no vault, or the write fails. The data is
  // serialised before the first await, so the caller may clear its state at once.
  async function reseal(data) {
    var key = sessionKey, v = readVault();
    if (!key || !v || !data || !data.passcode || !data.catalogue) return false;
    var seen = epoch;
    var plaintext = JSON.stringify({ passcode: data.passcode, catalogue: data.catalogue });
    try {
      var iv = rand(12);                                   // never reuse an IV under one key
      var ct = await encrypt(key, iv, plaintext);
      if (seen !== epoch) return false;                    // remove() ran meanwhile: do not resurrect
      var cur = readVault();
      if (!cur || cur.credId !== v.credId || cur.salt !== v.salt) return false;   // vault was replaced
      root.localStorage.setItem(VAULT_KEY, JSON.stringify(
        { v: VAULT_VERSION, credId: v.credId, salt: v.salt, iv: toB64(iv), ct: toB64(ct) }));
      return true;
    } catch (e) { return false; }                          // e.g. quota: the old vault stays
  }

  function remove() {
    epoch++;
    sessionKey = null;
    try { root.localStorage.removeItem(VAULT_KEY); } catch (e) {}
  }

  var API = { supported: supported, enrolled: enrolled, enrol: enrol, unlock: unlock, reseal: reseal, remove: remove };

  root.RGABio = API;
  if (typeof module === 'object' && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
