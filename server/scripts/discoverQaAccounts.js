import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env" });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be configured locally.");
}

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function maskEmail(email) {
  return email?.replace(/^[^@]+/, "***") || "unknown";
}

const { data, error } = await db
  .from("profiles")
  .select("id,email,approved_role,account_status")
  .in("approved_role", ["teacher", "student"])
  .eq("account_status", "active");

if (error) throw error;

const candidates = (data || []).filter((profile) =>
  /^(test|qa|demo)[._-]/i.test(profile.email || ""),
);

if (!candidates.length) {
  console.log("No clearly named active QA/Test Student or Teacher accounts were found.");
} else {
  console.log("Clearly named QA/Test account candidates:");
  for (const profile of candidates) {
    console.log(`${profile.approved_role.padEnd(8)} ${profile.id} ${maskEmail(profile.email)}`);
  }
}

console.log("Copy only dedicated QA account UUIDs into server/.env.qa. Do not use an Admin or normal user account.");
