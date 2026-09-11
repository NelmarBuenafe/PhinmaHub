import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const adminEmail = process.env.VERIFY_ADMIN_EMAIL?.trim();
const adminPassword = process.env.VERIFY_ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  throw new Error(
    "VERIFY_ADMIN_EMAIL and VERIFY_ADMIN_PASSWORD must be set in server/.env.",
  );
}

if (adminPassword.length < 8) {
  throw new Error("VERIFY_ADMIN_PASSWORD must be at least 8 characters.");
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be configured.");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("id,email,approved_role,account_status")
  .eq("email", adminEmail)
  .maybeSingle();

if (profileError) throw profileError;
if (!profile) throw new Error("No profile matches VERIFY_ADMIN_EMAIL.");
if (profile.approved_role !== "admin" || profile.account_status !== "active") {
  throw new Error("The configured account is not an active Admin; no password was changed.");
}

const { error: updateError } = await supabase.auth.admin.updateUserById(
  profile.id,
  { password: adminPassword },
);

if (updateError) throw updateError;
console.log("Local Admin password reset successfully. The password was not displayed.");
