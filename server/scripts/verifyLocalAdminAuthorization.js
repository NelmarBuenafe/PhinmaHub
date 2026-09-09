import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const adminEmail = process.env.VERIFY_ADMIN_EMAIL?.trim();
const adminPassword = process.env.VERIFY_ADMIN_PASSWORD;
if (!adminEmail || !adminPassword) {
  throw new Error(
    "VERIFY_ADMIN_EMAIL and VERIFY_ADMIN_PASSWORD must be set in the local server environment.",
  );
}

const { data, error } = await supabase.auth.signInWithPassword({
  email: adminEmail,
  password: adminPassword,
});
if (error || !data.session) throw error || new Error("No session created.");

const apiUrl = (process.env.VERIFY_API_URL || "http://localhost:5000/api").replace(
  /\/$/,
  "",
);
const response = await fetch(`${apiUrl}/auth/me`, {
  headers: { Authorization: `Bearer ${data.session.access_token}` },
});
const body = await response.json();
console.log(JSON.stringify({ status: response.status, code: body.code, profile: body.profile }));
