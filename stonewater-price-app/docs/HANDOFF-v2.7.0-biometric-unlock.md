# Handoff — v2.7.0 Face ID / Touch ID unlock (for Claude Code)

**Read first:** `docs/PRD-v2.7.0-biometric-unlock.md` (approved) and open `docs/mockups/v2.7.0-biometric-unlock.html` in a browser.
**Branch:** `feature/v2.7.0-biometric-unlock` (docs only so far). **Base:** `main` @ `069d74c`, app v2.6.2.
**Working folder:** `stonewater-price-app/` inside `rgasoundimage_website_repo`. The Netlify base directory is this folder name; do not rename it.

Confidence tags: **[Certain]** read in the code; **[Likely]** inference; **[Guessing]** unproven.

---

## 0. Before you write any app code: run the spike (go / no-go)

The whole design depends on WebAuthn **PRF** working when the app is launched **from the Home Screen icon** on iOS. **[Guessing]**: no source I found confirms it, and I cannot test Face ID from the chat environment.

1. Copy `docs/spike/prf-spike.html` to `site/prf-spike.html` on a scratch branch. Netlify must serve it over HTTPS **on the same hostname as the app** (passkeys are bound to the hostname).
2. iPhone Safari → open `/prf-spike.html` → tap 1, then 2 twice. Both runs of step 2 must print the **same first 4 bytes**.
3. Share → Add to Home Screen → launch **from the icon** (first line must read `standalone: true`) → repeat.
4. Delete `site/prf-spike.html`. Never merge it.

**Outcomes**
- PRF works in Safari **and** standalone → continue to section 1.
- Works in Safari but **not** standalone → **stop and ask the owner.** Do not improvise the weaker "WebAuthn prompt in front of plain-text storage" design: it adds no protection (PRD §3.2) unless the owner explicitly chooses it.
- Fails in both → stop; report iOS version and the exact error from the page.

## 1. Rules for this project (from the owner's standing workflow)

- PRD first, mockups approved before build. PRD is approved; **mockups still need the owner's OK**. Ask before building the UI.
- **Release = a complete folder-replacement zip**, never a partial overlay. Include `site/`, `tests/`, `scripts/`, `docs/`, `netlify/`, `supabase/`, `netlify.toml`, `package.json`, `CHANGELOG.md`, `README.md`. **Before packaging, ask whether to include `site/prices.json` and `data/*.xlsx`.** (A partial overlay once wiped `prices.json`, icons and a test file.)
- Deploy path: VS Code / Claude Code → GitHub → Netlify auto-deploy. Do not push to `main` without the owner saying so.
- If a Claude Code session and a chat session produce different versions of a file, **the Code session wins**.
- **Never bump the service-worker cache name by hand.** `scripts/stamp-cache.mjs` stamps it from the commit SHA at build.
- Netlify Functions are ES Modules only. (No function change is planned in this release.)
- Update `CHANGELOG.md` (newest first, existing format), `README.md`, `package.json` → `2.7.0`.
- Test suite today: 152 assertions in three files plus a Supabase catalogue test. `npm test` must still pass untouched.

## 2. What the code does today (so you edit the right places)

All in `site/app.js` unless noted. Line numbers are for `069d74c`.

| What | Where |
|---|---|
| localStorage keys, incl. `sw_pass` (plain-text passcode) and `sw_data_full` (full catalogue with dealer/distributor prices) | L13–16 |
| `unlocked` is true only if `sw_unlocked==="1"` **and** `sw_pass` exists | L33 |
| Passcode modal open/close | L284–295 |
| `tryUnlock()`: POSTs the passcode to `/api/prices-full`, then stores `sw_pass` and `sw_data_full` | L310–339 |
| `lockDown()`: deletes `unlocked`, `pass`, `dataFull` and re-shows public data | L342–348 |
| Lock button handler | L350–356 |
| Settings open / apply | L376 / L390 |
| Locked panel for gated roles in `render()` | L192–203 |
| Locked panel for Quote in `renderQuote()` | L528–535 |
| `reflectTabs()`, `setTab()` (opens the passcode modal for Quote) | L434–451 |
| `fetchFull(pass)` | L1007 |
| `refresh()`: **reads the passcode from `localStorage`** at L1043; 401 → `lockDown()`; offline keeps saved full copy | L1040–1056 |
| `boot()`: shows cached full or public data immediately, then `refresh()` | L1058–1074 |
| `startApp()`: sets `lockBtn.hidden = !unlocked` | L1069+ |
| Server: `netlify/functions/prices-full.mjs` checks `x-price-passcode` against `PRICE_PASSCODE` | server, unchanged |
| The quote itself is held in memory (`let quote = []`), not persisted [Certain: no storage key found] | L428 |

## 3. Design to implement (summary of PRD §3–4; the PRD wins on any difference)

### 3.1 New file `site/bio.js`, global `window.RGABio`, loaded **before** `app.js` (same pattern as `expr.js`)

```
RGABio.supported()                 -> Promise<boolean>   // PublicKeyCredential + platform authenticator + secure context
RGABio.enrolled()                  -> boolean            // vault present in localStorage
RGABio.enrol({passcode, catalogue})-> Promise<void>      // create passkey (random user.id), get PRF, encrypt, verify-by-decrypt, store
RGABio.unlock()                    -> Promise<{passcode, catalogue}>   // get with PRF, decrypt; throws typed errors
RGABio.remove()                    -> void
```
Typed errors for the app to branch on: `cancelled` (user dismissed, silent), `unsupported`, `no-prf`, `decrypt-failed` (passkey deleted or tampered → remove vault, passcode modal with the recovery line), `no-vault`.

### 3.2 Vault format (localStorage key `sw_vault`, JSON)
```
{ v: 1, credId: <b64>, salt: <b64 32 random bytes, used as the PRF input>, iv: <b64 12>, ct: <b64 AES-GCM> }
```
- `ct` encrypts `JSON.stringify({passcode, catalogue})`. Key = PRF output (32 bytes) imported as AES-GCM. Optionally run through HKDF with a context label; either is fine, document the choice.
- Unknown `v` → treat as no vault.
- Use `rp.id = location.hostname`, `authenticatorAttachment: "platform"`, `residentKey: "preferred"`, `userVerification: "required"`, `extensions.prf.eval.first = salt`.
- `user.id` = **random 16 bytes per enrolment**; `user.name`/`displayName` = `RGA Prices – <device word> <date>`. Reason: reusing one user id could make iOS overwrite another device's passkey and silently break its vault. **[Likely]**
- After `create`, **read PRF with a separate `get`** (some platforms don't return results at create). Expect two Face ID prompts at enrolment; say so in the UI.
- Verify the enrolment by decrypting once before reporting success.
- If `getClientExtensionResults().prf.enabled` is false: abort, store nothing, hide the option.
- Size: fixture catalogue is ~62 KB; localStorage ~5 MB. Measure the real catalogue and fail gracefully on `QuotaExceededError` (do not enrol).

### 3.3 Changes in `app.js`
1. On an **enrolled** device, keep the passcode **in memory only** (`let memPass`) while unlocked; do not write `sw_pass` / `sw_data_full`. `refresh()` (L1043) must use `memPass` first, `localStorage` second (non-enrolled devices unchanged). **Non-enrolled devices must behave exactly as 2.6.2.**
2. Initial `unlocked` (L33): on an enrolled device start **locked** (cold start = locked, per D2).
3. `lockDown()`: keep `sw_vault`; clear `memPass`, `sw_pass`, `sw_unlocked`, `sw_data_full`.
4. **Auto-lock** on enrolled devices: on `visibilitychange` to hidden record a timestamp; on visible, if > 5 minutes → `lockDown()` + re-render. (iOS may kill the page anyway; cold start is already locked.) Put the 5 minutes in one named constant.
5. Locked panels (L192 and L528): when `RGABio.enrolled()`, add the primary **Unlock with Face ID / Touch ID** button and a **Use passcode** link (mockup screen 2). It **must** be a user-tap handler; do not auto-prompt on load (iOS requires a gesture). **[Likely]**
6. Biometric unlock handler: `RGABio.unlock()` → `{passcode, catalogue}` → set `memPass`, `unlocked = true`, `useData(catalogue)` straight away (works offline), then call `fetchFull(passcode)` in the background. On **401** → `RGABio.remove()` + passcode modal with the recovery line. On network failure → keep the vault catalogue and retry on the next `refresh()`.
7. After a successful passcode `tryUnlock()`, if `await RGABio.supported()` and not enrolled and not snoozed (`sw_bioSnooze` < 30 days) → show the opt-in card (mockup 1). "Turn on" → `enrol`. "Not now" → set snooze.
8. Settings (L376): add the *Face ID / Touch ID* section (mockup 3) only when supported. **Turn off** → `RGABio.remove()`.
9. When the catalogue refreshes while unlocked on an enrolled device, **re-encrypt the vault** with the new catalogue (needs one more biometric prompt, so don't do it silently every refresh). Simplest acceptable rule: refresh the vault only at Lock time **if** it's older than the live data, or skip and let `generatedAt` show staleness; pick one, document it in CHANGELOG. **Open question for the owner if it's not obvious.**
10. Labels: "Face ID / Touch ID" everywhere (D6).

### 3.4 Other files
- `site/sw.js`: add `"bio.js"` to `ASSETS`. **Miss this and the app breaks offline only** and passes every online test. (`docs/REMAINING-STEPS.md` records the same trap for `expr.js`.) Do not touch the cache name.
- `site/index.html`: `<script src="bio.js"></script>` before `app.js`.
- `site/styles.css`: copy the block marked "NEW CSS for the build" from the mockup, into the main stylesheet. Navy/white tokens only; `--warn*` for the recovery note.
- `README.md`, `CHANGELOG.md`, `package.json` (2.7.0).

## 4. Tests to add: `tests/biometric-vault.test.mjs`

The runner runs each `*.test.mjs` in its own process; match the style of `quote-price-field.test.mjs` (jsdom).
- Vault: round trip; wrong key fails; tampered `ct` fails; unknown `v` ignored; QuotaExceeded → no enrol.
- Stub `navigator.credentials` to return a fixed PRF output.
- Lock removes `sw_pass` and `sw_data_full`, keeps `sw_vault`; unlock restores state.
- 401 after decrypt → vault removed. Offline decrypt → app shows saved catalogue, no server call needed.
- Unsupported device → no card, no Settings section, no button.
- **Non-enrolled device: identical to 2.6.2** (existing suites untouched and green).
- Optional but valuable: a Chromium run with a **virtual authenticator** (CDP `WebAuthn.addVirtualAuthenticator`, `hasPrf: true`) for enrol → lock → unlock. Playwright and a Chrome binary were available in the chat sandbox. Whether the virtual authenticator's PRF behaves like iCloud Keychain's is **[Guessing]**; treat it as a logic test, not proof.

## 5. Manual checks only the owner can do (iPhone, iOS 18+)
1. Safari tab: enrol, lock, unlock; repeat in airplane mode.
2. **Home Screen app:** the same. This decides the release.
3. Delete the passkey in Settings → Passwords → app falls back to the passcode with the recovery line.
4. Change `PRICE_PASSCODE` on Netlify → next online unlock clears the vault and asks for the passcode.
5. A second device enrols without breaking the first.
6. Customer view needs nothing and looks unchanged on every device.

## 6. Known limits to keep in the release notes
Anyone who knows the iPhone passcode can pass Face ID; each device enrols separately; Home Screen app and Safari tab have separate storage; one passkey per enrolment accumulates in iOS Passwords. Details in PRD §5.

## 7. Open points
- Mockups: awaiting owner approval (D-level change requests go back to the PRD).
- Vault refresh policy (§3.3 item 9).
- Admin screen biometric: out of scope this release (D5).
