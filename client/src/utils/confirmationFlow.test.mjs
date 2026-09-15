import test from "node:test";
import assert from "node:assert/strict";
import {
  getConfirmationCallback,
  getConfirmationLoginPath,
  getConfirmationSessionAction,
  getConfirmedLoginRole,
} from "./confirmationFlow.js";

test("confirmation callback recognizes PKCE codes and Supabase error callbacks", () => {
  assert.deepEqual(getConfirmationCallback("?code=pkce-code"), {
    code: "pkce-code",
    error: null,
    errorCode: null,
  });
  assert.deepEqual(
    getConfirmationCallback("?error=access_denied&error_code=otp_expired"),
    { code: null, error: "access_denied", errorCode: "otp_expired" },
  );
});

test("confirmation exchanges a code only when a session is not already available", () => {
  assert.equal(
    getConfirmationSessionAction({
      code: "pkce-code",
      exchangeAttempted: false,
      session: { user: { id: "user-id" } },
    }),
    "existing-session",
  );
  assert.equal(
    getConfirmationSessionAction({
      code: "pkce-code",
      exchangeAttempted: false,
      session: null,
    }),
    "exchange",
  );
  assert.equal(
    getConfirmationSessionAction({
      code: "pkce-code",
      exchangeAttempted: true,
      session: null,
    }),
    "already-exchanged",
  );
});

test("confirmation selects only Student and Teacher login routes", () => {
  assert.equal(getConfirmationLoginPath("teacher"), "/auth/teacher");
  assert.equal(getConfirmationLoginPath("student"), "/auth/student");
  assert.equal(getConfirmationLoginPath("admin"), null);
});

test("only an active trusted public role can select the post-confirmation login", () => {
  assert.equal(getConfirmedLoginRole({ account_status: "active", approved_role: "teacher" }), "teacher");
  assert.equal(getConfirmedLoginRole({ account_status: "active", approved_role: "student" }), "student");
  assert.equal(getConfirmedLoginRole({ account_status: "pending", approved_role: "teacher" }), null);
  assert.equal(getConfirmedLoginRole({ account_status: "active", approved_role: "admin" }), null);
  assert.equal(getConfirmedLoginRole({ account_status: "active", requested_role: "teacher" }), null);
});
