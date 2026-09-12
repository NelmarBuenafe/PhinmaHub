import assert from "node:assert/strict";
import test from "node:test";
import { validateEnv } from "../src/utils/validateEnv.js";

const productionEnvironment = {
  NODE_ENV: "production",
  CLIENT_URL: "https://app.example.edu",
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SECRET_KEY: "server-secret",
  CAPTCHA_SECRET: "a-secure-captcha-secret-with-32-characters",
  PHINMA_ALLOWED_EMAIL_DOMAINS: "example.edu",
};

test("production environment accepts an exact HTTPS client origin", () => {
  assert.doesNotThrow(() => validateEnv(undefined, productionEnvironment));
});

test("production environment rejects localhost and non-origin client URLs", () => {
  assert.throws(
    () =>
      validateEnv(undefined, {
        ...productionEnvironment,
        CLIENT_URL: "http://localhost:5173",
      }),
    /exact deployed HTTPS frontend origin/,
  );
  assert.throws(
    () =>
      validateEnv(undefined, {
        ...productionEnvironment,
        CLIENT_URL: "https://app.example.edu/path",
      }),
    /exact deployed HTTPS frontend origin/,
  );
});

test("production environment rejects a weak CAPTCHA secret", () => {
  assert.throws(
    () =>
      validateEnv(undefined, {
        ...productionEnvironment,
        CAPTCHA_SECRET: "too-short",
      }),
    /at least 32 characters/,
  );
});
