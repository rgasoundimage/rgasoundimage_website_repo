import { json, passcodeMatches } from "../lib/catalog.mjs";
// Written by scripts/build-catalog.mjs during the build. Bundled into this
// function, never published as a file, and no Supabase call per request.
import FULL from "../generated/catalog-full.mjs";

// POST /api/prices-full  (header: x-price-passcode)
// Every price list, including dealer, distributor and margins, for the
// unlocked views and the Quote Builder. The passcode is checked HERE against
// the PRICE_PASSCODE env var; the browser never sees it until a user types it.
export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  const expected = process.env.PRICE_PASSCODE;
  if (!expected) return json(500, { error: "PRICE_PASSCODE is not set on this site" });
  if (!passcodeMatches(event.headers["x-price-passcode"] || "", expected)) {
    return json(401, { error: "Incorrect passcode" });
  }
  return json(200, FULL, "private, no-store");
}
