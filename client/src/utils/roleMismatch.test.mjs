import test from "node:test";
import assert from "node:assert/strict";
import { getRoleMismatchDetails } from "./roleMismatch.js";

test("role mismatch feedback uses the trusted actual role's portal", () => {
  assert.deepEqual(getRoleMismatchDetails("student", "teacher"), {
    destination: "/auth/student",
    label: "Student",
    message: "This account is registered as a Student, but you're signing in through the Teacher portal. Use the Student portal to continue.",
  });
  assert.deepEqual(getRoleMismatchDetails("teacher", "student"), {
    destination: "/auth/teacher",
    label: "Teacher",
    message: "This account is registered as a Teacher, but you're signing in through the Student portal. Use the Teacher portal to continue.",
  });
});

test("untrusted or invalid role values cannot select a portal", () => {
  assert.equal(getRoleMismatchDetails("owner", "student"), null);
  assert.equal(getRoleMismatchDetails("student", undefined), null);
  assert.equal(getRoleMismatchDetails("student", "student"), null);
});
