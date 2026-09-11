import { randomBytes } from "node:crypto";
import { access, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.qa", override: true });

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const manifestPath = path.resolve(scriptDirectory, "../.qa-fixtures.json");
export const QA_COURSE_CODE = "QA_IT101";

export function qaClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be configured locally.");
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function productionWarning() {
  console.warn("WARNING: QA fixtures will be created in the configured Supabase project using isolated QA_ records.");
  if (process.env.QA_ALLOW_PRODUCTION !== "true") {
    throw new Error("Set QA_ALLOW_PRODUCTION=true in server/.env.qa before creating QA fixtures.");
  }
}

export function loadQaConfig() {
  const config = {
    teacherId: process.env.QA_TEACHER_USER_ID?.trim(),
    studentAId: process.env.QA_STUDENT_A_USER_ID?.trim(),
    studentBId: process.env.QA_STUDENT_B_USER_ID?.trim() || null,
  };
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  for (const [name, id] of Object.entries(config)) {
    if (name === "studentBId" && !id) continue;
    if (!id || !uuidPattern.test(id)) {
      throw new Error(`${name} must be a dedicated QA profile UUID in server/.env.qa.`);
    }
  }
  if (config.teacherId === config.studentAId || config.teacherId === config.studentBId || config.studentAId === config.studentBId) {
    throw new Error("QA Teacher, Student A, and Student B must be different accounts.");
  }
  return config;
}

export async function verifyQaProfiles(db, config) {
  const ids = [config.teacherId, config.studentAId, config.studentBId].filter(Boolean);
  const { data, error } = await db
    .from("profiles")
    .select("id,email,approved_role,account_status")
    .in("id", ids);
  if (error) throw error;

  const byId = new Map((data || []).map((profile) => [profile.id, profile]));
  const required = [
    [config.teacherId, "teacher", "QA_TEACHER_USER_ID"],
    [config.studentAId, "student", "QA_STUDENT_A_USER_ID"],
    ...(config.studentBId ? [[config.studentBId, "student", "QA_STUDENT_B_USER_ID"]] : []),
  ];

  for (const [id, role, name] of required) {
    const profile = byId.get(id);
    if (!profile || profile.approved_role !== role || profile.account_status !== "active") {
      throw new Error(`${name} must identify an active ${role} profile. No QA data was changed.`);
    }
  }
  return byId;
}

export async function readManifest() {
  try {
    await access(manifestPath);
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export async function writeManifest(manifest) {
  const temporaryPath = `${manifestPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await rename(temporaryPath, manifestPath);
}

export function qaJoinCode() {
  return `QA${randomBytes(5).toString("hex").toUpperCase()}`;
}

export function isQaCourse(course) {
  return course?.course_code === QA_COURSE_CODE && course?.title?.startsWith("[QA]");
}

export function futureDate(daysFromNow) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + daysFromNow);
  return value.toISOString();
}

export function report(name, status, detail = "") {
  console.log(`${status.padEnd(24)} ${name}${detail ? ` — ${detail}` : ""}`);
}
