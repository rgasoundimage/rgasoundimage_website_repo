import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Runs on Netlify's daily schedule (see netlify.toml) purely to keep the
// free-tier Supabase project from being auto-paused after a week idle.
export async function handler() {
  const { error } = await supabase
    .from("contact_submissions")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("Supabase keep-alive ping failed:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
}
