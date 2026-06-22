/* stamp-cache.mjs
 * Runs as the Netlify build command. Rewrites the CACHE constant in
 * site/sw.js to a value that is unique to this deploy, so every push
 * ships a fresh service-worker cache and clients never serve a stale build.
 *
 * Source of the version, in order of preference:
 *   COMMIT_REF  – the git SHA Netlify is building (changes every push)
 *   DEPLOY_ID   – fallback if COMMIT_REF is absent
 *   timestamp   – local runs (e.g. `npm run build` on your machine)
 *
 * No manual cache bumping ever again.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const swPath = join(here, "..", "site", "sw.js");

const ref =
  process.env.COMMIT_REF ||
  process.env.DEPLOY_ID ||
  `local-${Date.now()}`;

const version = `stonewater-${ref.slice(0, 8)}`;

let sw = readFileSync(swPath, "utf8");
if (!/const CACHE = "[^"]*";/.test(sw)) {
  console.error('stamp-cache: could not find `const CACHE = "...";` in site/sw.js');
  process.exit(1);
}
sw = sw.replace(/const CACHE = "[^"]*";/, `const CACHE = "${version}";`);
writeFileSync(swPath, sw);

console.log(`stamp-cache: service-worker cache set to "${version}"`);
