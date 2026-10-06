import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Runs every morning on Netlify's schedule (see netlify.toml) to keep the
// free-tier Supabase project from being auto-paused after a week idle.
// Each run is recorded in public.job_runs (see supabase/001_job_runs.sql).
export async function handler() {
  const { error, status } = await supabase
    .from("contact_submissions")
    .select("id", { count: "exact", head: true });

  // HEAD responses have no body, so error.message is often empty; fall back
  // to the HTTP status so the log and job_runs row still say something.
  const errorText = error ? error.message || `HTTP ${status}` : null;

  const { error: logError } = await supabase.from("job_runs").insert({
    job_name: "keep-alive",
    status: error ? "failure" : "success",
    http_status: status,
    error: errorText,
  });
  if (logError) {
    console.error("Failed to record keep-alive run in job_runs:", logError);
  }

  if (error) {
    console.error("Supabase keep-alive ping failed:", status, errorText);
    return { statusCode: 500, body: JSON.stringify({ error: errorText }) };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
}
