import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessRole,
  getAuthenticationResult,
  getAllowedEmailDomains,
  getProfileDestination,
  getRegistrationActivationError,
  hasExactEmailDomain,
  isInstitutionalEmail,
  isGoogleUser,
} from "../src/utils/auth.js";

test("email-domain matching is exact and case-insensitive", () => {
  assert.equal(hasExactEmailDomain("Person@School.EDU", "school.edu"), true);
  assert.equal(hasExactEmailDomain("person@school.edu", "@SCHOOL.EDU"), true);
  assert.equal(
    hasExactEmailDomain("person@evil-school.edu", "school.edu"),
    false,
  );
  assert.equal(
    hasExactEmailDomain("school.edu@attacker.example", "school.edu"),
    false,
  );
  assert.equal(
    hasExactEmailDomain("person@attacker.example@school.edu", "school.edu"),
    false,
  );
  assert.equal(
    hasExactEmailDomain("person@school.edu.attacker.example", "school.edu"),
    false,
  );
  assert.equal(hasExactEmailDomain("not-an-email", "school.edu"), false);
});

test("registration activation requires verification and preserves the role", () => {
  const pendingStudent = {
    requested_role: "student",
    approved_role: null,
    account_status: "pending",
  };

  assert.equal(
    getRegistrationActivationError(pendingStudent, "student", false),
    "EMAIL_NOT_VERIFIED",
  );
  assert.equal(
    getRegistrationActivationError(pendingStudent, "student", true),
    null,
  );
  assert.equal(
    getRegistrationActivationError(pendingStudent, "teacher", true),
    "ROLE_CONFLICT",
  );
  assert.equal(
    getRegistrationActivationError(pendingStudent, "admin", true),
    "INVALID_ROLE",
  );
  assert.equal(
    getRegistrationActivationError(
      { ...pendingStudent, account_status: "suspended" },
      "student",
      true,
    ),
    "ACCOUNT_BLOCKED",
  );
});

test("institutional email configuration supports an exact domain allowlist", () => {
  const environment = {
    PHINMA_ALLOWED_EMAIL_DOMAINS: "students.example.edu, staff.example.edu",
  };

  assert.deepEqual(getAllowedEmailDomains(environment), [
    "students.example.edu",
    "staff.example.edu",
  ]);
  assert.equal(
    isInstitutionalEmail("person@students.example.edu", environment),
    true,
  );
  assert.equal(isInstitutionalEmail("person@gmail.com", environment), false);
  assert.equal(
    isInstitutionalEmail(
      "person@students.example.edu.attacker.test",
      environment,
    ),
    false,
  );
});

test("Google provider must be present in verified user metadata", () => {
  assert.equal(isGoogleUser({ app_metadata: { provider: "google" } }), true);
  assert.equal(isGoogleUser({ identities: [{ provider: "google" }] }), true);
  assert.equal(isGoogleUser({ app_metadata: { provider: "email" } }), false);
});

test("profile routing enforces requested role and account status", () => {
  assert.equal(getProfileDestination(null), "/unauthorized");
  assert.equal(getProfileDestination({ requested_role: null }), "/select-role");
  assert.equal(
    getProfileDestination({
      requested_role: "student",
      account_status: "pending",
    }),
    "/pending",
  );
  assert.equal(
    getProfileDestination({
      requested_role: "student",
      account_status: "suspended",
    }),
    "/unauthorized",
  );
  assert.equal(
    getProfileDestination({
      requested_role: "student",
      account_status: "rejected",
    }),
    "/unauthorized",
  );
  assert.equal(
    getProfileDestination({
      requested_role: "student",
      account_status: "active",
      approved_role: null,
    }),
    "/unauthorized",
  );
});

test("active users can access only their approved role", () => {
  const admin = {
    requested_role: "student",
    account_status: "active",
    approved_role: "admin",
  };
  const teacher = {
    requested_role: "teacher",
    account_status: "active",
    approved_role: "teacher",
  };
  const student = {
    requested_role: "student",
    account_status: "active",
    approved_role: "student",
  };

  assert.equal(canAccessRole(admin, "admin"), true);
  assert.equal(canAccessRole(admin, "student"), false);
  assert.equal(canAccessRole(teacher, "teacher"), true);
  assert.equal(canAccessRole(teacher, "admin"), false);
  assert.equal(canAccessRole(student, "student"), true);
  assert.equal(canAccessRole(student, "teacher"), false);
});

test("post-CAPTCHA result uses database status and approved role", () => {
  assert.deepEqual(
    getAuthenticationResult(
      { account_status: "active", approved_role: "student" },
      { flow: "login", selectedRole: "student" },
    ),
    { destination: "/student", roleMismatch: false },
  );
  assert.deepEqual(
    getAuthenticationResult(
      { account_status: "active", approved_role: "teacher" },
      { flow: "login", selectedRole: "teacher" },
    ),
    { destination: "/teacher", roleMismatch: false },
  );
  assert.deepEqual(
    getAuthenticationResult(
      { account_status: "active", approved_role: "teacher" },
      { flow: "login", selectedRole: "student" },
    ),
    { destination: null, roleMismatch: true },
  );
  assert.deepEqual(
    getAuthenticationResult(
      { account_status: "pending", approved_role: null },
      { flow: "login", selectedRole: "student" },
    ),
    { destination: "/pending", roleMismatch: false },
  );
  assert.deepEqual(
    getAuthenticationResult(
      { account_status: "pending", approved_role: null },
      { flow: "register", selectedRole: "teacher" },
    ),
    { destination: "/register/teacher", roleMismatch: false },
  );
  assert.deepEqual(
    getAuthenticationResult(
      { account_status: "suspended", approved_role: "student" },
      { flow: "login", selectedRole: "student" },
    ),
    { destination: "/unauthorized", roleMismatch: false },
  );
});
