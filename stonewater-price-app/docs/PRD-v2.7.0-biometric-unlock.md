# PRD — v2.7.0 · Face ID / Touch ID unlock

**App:** Stonewater / RGA Price Catalogue (PWA)
**Base version:** 2.6.2 (repo `main`, commit `069d74c`)
**Proposed version:** 2.7.0 (minor, new feature, opt-in per device)
**Scope of change:** `site/app.js`, `site/index.html`, `site/styles.css`, `site/sw.js`, new `site/bio.js`, new `tests/biometric-vault.test.mjs`. No server change, no database change, no `prices.json` change.
**Status:** PRD APPROVED 2026-11-15 (decisions D1–D4 below). Mockups (`docs/mockups/v2.7.0-biometric-unlock.html`) APPROVED 2026-11-15. Build happens in Claude Code, see `docs/HANDOFF-v2.7.0-biometric-unlock.md`.

Confidence tags: **[Certain]** read in the code or documented; **[Likely]** strong inference; **[Guessing]** must be proven on a real device.

---

## 1. Problem

Today the app has two states for the gated views (Dealer, Sub-dealer, Internal, Quote Builder):

- **Locked:** customer prices only.
- **Unlocked:** stays unlocked across launches until someone taps **Lock**. [Certain — `sw_unlocked` in localStorage]

While unlocked, the **passcode is stored in plain text** (`sw_pass`) and so is the **full catalogue** with dealer and distributor cost (`sw_data_full`). [Certain — `app.js` lines 13–16, 329–331] So the only real choice a user has is "typed passcode every time" or "anyone holding the phone sees cost prices". That is why nobody will tap Lock in the field, and why a biometric re-lock is worth building.

## 2. Goal

After a one-time opt-in, the app can be **locked cheaply and unlocked with one Face ID / Touch ID glance** instead of retyping the passcode, **including offline**. When locked, the passcode and dealer/distributor prices on the device are **encrypted**, not merely hidden.

Non-goals (v2.7.0):
- No change to the customer view, which stays open with no unlock.
- No change to the server passcode check (`PRICE_PASSCODE`) — it stays the single source of truth.
- No per-user accounts. The passcode is still shared.
- Admin screen (`admin.html`) is not changed. See decision D5.

## 3. Approach — and why not the simpler one

### 3.1 What "Face ID in a PWA" actually is

A web app cannot call Face ID directly. The only route is **WebAuthn** with a platform authenticator (a passkey). Safari asks iOS to verify the user; iOS shows Face ID, or Touch ID, or the device passcode if neither is set up. [Certain — passkeys.dev iOS reference] The app never sees the face or fingerprint, only "verified" or "not".

### 3.2 The tempting version, and why I'm recommending against it

*Store the passcode in localStorage as now, and put a WebAuthn prompt in front of it.* This is a gate on a screen, not on the data. The passcode and the full price catalogue would still sit readable in localStorage, and anyone with the phone unlocked and Safari's inspector, or a device backup, gets them without any biometric. It looks like security and isn't. [Certain]

### 3.3 Recommended: a biometric-locked encrypted vault (WebAuthn PRF)

WebAuthn has a **PRF extension**: the passkey produces a secret 32-byte value that only comes out after Face ID / Touch ID succeeds. That value becomes an AES-GCM key.

- **Enrol (once per device):** user is unlocked with the passcode, taps *Turn on Face ID / Touch ID*. The app creates a passkey, gets the PRF secret, encrypts `{passcode, full catalogue}`, and stores only the **ciphertext** plus the credential ID and a random salt.
- **Lock:** plaintext `sw_pass` and `sw_data_full` are deleted. The ciphertext stays.
- **Unlock:** tap *Unlock with Face ID / Touch ID* → biometric → PRF secret → decrypt → app is unlocked. The passcode is then re-checked against the server in the background as today, so a **changed server passcode invalidates the vault automatically**.
- **Offline:** works, because the catalogue is inside the vault. This is the main reason for choosing this over a server-verified passkey, which would need a connection to unlock and the app is used where signal is poor. [Certain — README and v2.6.1 changelog stress offline use]

### 3.4 Support — the part that can sink this

- PRF in Safari with iCloud Keychain passkeys: **iOS 18+ / macOS 15+ / Safari 18+**. [Certain — Apple developer forum posts, Corbado support table]
- iOS 18.0–18.3 had reported PRF bugs, with fixes landing by 18.4. [Likely — Corbado, Apple forums]
- **Does PRF work when launched from the Home Screen icon (standalone mode)?** WebAuthn does work in installed iOS web apps. [Likely] PRF specifically in standalone mode: **[Guessing]. I found no source that confirms it. It must be tested on your actual iPhone before I call this done**, and I can't test Face ID from my environment.
- On devices without PRF (iOS ≤17, or a password manager holding the passkey without PRF), the app **hides the option** and keeps the passcode flow. It does **not** fall back to the plain-text-behind-a-prompt version in 3.2.

## 4. Behaviour

### 4.1 Opt-in
After a successful passcode unlock, if PRF is supported and the device is not yet enrolled, show a one-line card in the unlocked view: *Unlock faster with Face ID / Touch ID — Turn on · Not now*. "Not now" hides it for 30 days. Settings gets a *Face ID / Touch ID* row with **Turn on / Turn off**. Turning off deletes the vault.

### 4.2 Enrolment
1. `navigator.credentials.create` with `authenticatorAttachment: "platform"`, `userVerification: "required"`, PRF requested.
2. If the result reports PRF not enabled, abort cleanly, delete nothing, tell the user "This device can't do it", hide the option.
3. Immediately run a `get` to read the PRF value (some platforms don't return it at create time). That is the second Face ID prompt at enrolment; expect two prompts once.
4. Encrypt and save the vault. Verify by decrypting once before reporting success.

### 4.3 Locking
- **Lock** button: as today, plus the plaintext is removed and the vault is kept.
- **Auto-lock (enrolled devices only):** cold start, and returning after the app has been hidden longer than N minutes (D2). Devices that haven't enrolled behave exactly as in 2.6.2.
- On an enrolled device the passcode is kept **in memory only** while unlocked; background refresh uses that memory copy (`refresh()` currently reads `LS.pass`).

### 4.6 Refreshing the vault (D7)
Re-encrypting needs the vault key, and getting that key normally costs a Face ID prompt. Auto-lock cannot show a prompt (iOS needs a tap). So:

- When the user unlocks with Face ID / Touch ID, the app keeps the derived key **in memory only, as a non-extractable WebCrypto key**, for that session. It is never written to storage and disappears when the page closes.
- **At lock time** (Lock button, auto-lock, or the page going to the background) the app re-encrypts the current passcode and catalogue with that in-memory key. No prompt.
- If there is no in-memory key (the session was unlocked with the passcode, or iOS closed the page before it could lock), the vault is left as it was. It is then as old as the last biometric session. Online unlocks are unaffected, because the server is always asked for fresh prices; only an **offline** unlock shows the older copy, and the footer's "Updated <date>" shows how old.
- Enrolment writes the first vault with its own key.

### 4.4 Locked screen on an enrolled device
The existing locked panel gets a primary button **Unlock with Face ID / Touch ID** and a secondary **Use passcode**. It must be a button: iOS requires a user tap to start the biometric prompt, so I can't auto-prompt on launch. [Likely]

### 4.5 Failure handling

| Situation | Result |
|---|---|
| User cancels the prompt | Stay locked, no error banner, button still there |
| Face ID fails, iOS offers device passcode | iOS handles it; same result as success if the device passcode is right |
| Passkey deleted in iOS Passwords | Decrypt fails → vault removed → passcode modal, message "Face ID needs setting up again" |
| Server passcode changed | Vault decrypts, server returns 401 → vault removed → passcode modal |
| Offline unlock | Decrypt, show the saved catalogue, skip the server check, retry when online |
| Storage cleared by iOS | Looks like a new device → passcode, offer enrolment again |
| iOS < 18 / no PRF | Option never shown |

## 5. Honest limits (read before approving)

1. **Anyone who knows the iPhone's own passcode can pass Face ID** (iOS offers it after failures). That is true of every biometric on iOS.
2. **Each device enrols separately.** The passkey syncs through iCloud, but the vault lives in that device's storage. The Home Screen app and the Safari tab are **separate storage** — enrol in the one you use. [Likely]
3. **Passkeys will accumulate** in the iOS Passwords app, one per enrolment, named "RGA Prices – <device> <date>". I use a random user ID per enrolment because reusing one could make iOS overwrite an earlier passkey and silently break another device's vault. [Likely]
4. **The customer price file is public** by design; this feature doesn't touch that.
5. While unlocked, the data is of course readable in the running app.
6. This is device-side protection. It does **not** replace the shared passcode as the server's gate, and the passcode is still shared by everyone who has it.

## 6. Implementation plan

- **New `site/bio.js`** (no globals except `RGABio`, same pattern as `expr.js`): feature detection, `enrol()`, `unlock()`, `remove()`, AES-GCM wrap/unwrap, vault format with a version field. All crypto via WebCrypto; no libraries, no new dependencies.
- **`app.js`:** wire the opt-in card, locked-panel button, Settings row, auto-lock timer on `visibilitychange`, and in-memory passcode for enrolled devices. `lockDown()` keeps the vault but removes `sw_pass` and `sw_data_full`. `refresh()` reads the passcode from memory first.
- **`sw.js`:** add `bio.js` to `ASSETS`. **Miss this and the app breaks offline only** (this exact failure is recorded in `docs/REMAINING-STEPS.md` for `expr.js`). Cache name stays auto-stamped; do not bump manually.
- **`index.html`:** load `bio.js` before `app.js`.
- **`styles.css`:** the two buttons, the opt-in card, a Settings row. Navy `#141943` and white only, existing tokens.
- **Docs:** CHANGELOG 2.7.0, README note, BUGS.md untouched unless a bug is found, `package.json` → 2.7.0.

## 7. Tests

Automated (`npm test`, new file `tests/biometric-vault.test.mjs`):
- Vault round trip: encrypt, decrypt, wrong key fails, tampered ciphertext fails, version field rejected if unknown.
- Lock removes `sw_pass` and `sw_data_full` and keeps the vault; unlock restores them.
- 401 after decrypt removes the vault; offline decrypt skips the server check.
- Non-enrolled devices behave exactly as 2.6.2 (the existing 152 assertions must still pass).
- PRF-unsupported device: option hidden.
- A browser-level run in Chromium with a **virtual authenticator** (PRF-capable) for the enrol → lock → unlock flow. [Likely feasible; I'll confirm during the build]

Manual, on your iPhone (I can't do these):
1. Safari tab: enrol, lock, unlock, in airplane mode too.
2. **Home Screen app:** the same. This is the one that decides whether the feature ships. [Guessing until done]
3. Delete the passkey in Passwords → app recovers to the passcode prompt.
4. Change `PRICE_PASSCODE` on Netlify → vault is cleared on next online unlock.
5. A second device: enrolling it must not break the first.

## 8. Decisions (settled 2026-11-15)

| # | Decision | Outcome |
|---|---|---|
| D1 | Require iOS/macOS 18+ for this feature | **Approved** (the default; device versions not checked) |
| D2 | Auto-lock on enrolled devices | **Approved:** cold start, and after **5 min** hidden |
| D3 | Offline unlock (catalogue stored encrypted) | **Approved** |
| D4 | Delivery | **Handoff for development in Claude Code**: branch `feature/v2.7.0-biometric-unlock` with PRD, mockups, handoff and spike; nothing on `main`. Final release is still a complete folder-replacement zip per the standing rule |
| D5 | Admin screen biometric | **Out of scope** (default, not explicitly confirmed) |
| D6 | Label "Face ID / Touch ID" everywhere | **Yes** (default, not explicitly confirmed) |
| D7 | When the encrypted copy of the prices is refreshed | **Approved: at lock time only** (not on every price refresh). Mechanism in 4.6 |

## 9. Risks

- **PRF in Home Screen mode fails** [Guessing]. Outcome: feature hidden there, and we decide whether a lighter version is acceptable. I will not ship the plain-text-behind-a-prompt version without you explicitly choosing it.
- iOS 18.0–18.3 PRF bugs: mitigated by the verify-by-decrypting step in 4.2.
- Vault size: the fixture catalogue is ~62 KB; localStorage allows ~5 MB. No problem expected, measured during the build.
