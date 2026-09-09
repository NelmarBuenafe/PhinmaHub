import assert from "node:assert/strict";
import test from "node:test";
import { authorizeRole } from "../src/middleware/authorizeRole.js";

function responseRecorder() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("admin authorization rejects an active Student with 403", () => {
  const middleware = authorizeRole("admin");
  const response = responseRecorder();
  let nextCalled = false;
  middleware(
    {
      auth: {
        profile: {
          requested_role: "student",
          approved_role: "student",
          account_status: "active",
        },
      },
    },
    response,
    () => {
      nextCalled = true;
    },
  );
  assert.equal(response.statusCode, 403);
  assert.equal(response.payload.code, "ACCESS_DENIED");
  assert.equal(nextCalled, false);
});

test("admin authorization rejects an active Teacher with 403", () => {
  const middleware = authorizeRole("admin");
  const response = responseRecorder();
  let nextCalled = false;
  middleware(
    {
      auth: {
        profile: {
          requested_role: "teacher",
          approved_role: "teacher",
          account_status: "active",
        },
      },
    },
    response,
    () => {
      nextCalled = true;
    },
  );
  assert.equal(response.statusCode, 403);
  assert.equal(response.payload.code, "ACCESS_DENIED");
  assert.equal(nextCalled, false);
});

test("admin authorization rejects a non-active Admin with 403", () => {
  const middleware = authorizeRole("admin");
  const response = responseRecorder();
  let nextCalled = false;
  middleware(
    {
      auth: {
        profile: {
          requested_role: "admin",
          approved_role: "admin",
          account_status: "suspended",
        },
      },
    },
    response,
    () => {
      nextCalled = true;
    },
  );
  assert.equal(response.statusCode, 403);
  assert.equal(nextCalled, false);
});

test("admin authorization accepts only an active approved Admin", () => {
  const middleware = authorizeRole("admin");
  const response = responseRecorder();
  let nextCalled = false;
  middleware(
    {
      auth: {
        profile: {
          requested_role: "student",
          approved_role: "admin",
          account_status: "active",
        },
      },
    },
    response,
    () => {
      nextCalled = true;
    },
  );
  assert.equal(nextCalled, true);
});

test("student resources accept Students and reject Teachers", () => {
  const middleware = authorizeRole("student");
  const studentResponse = responseRecorder();
  let studentAccepted = false;
  middleware(
    {
      auth: {
        profile: {
          requested_role: "student",
          approved_role: "student",
          account_status: "active",
        },
      },
    },
    studentResponse,
    () => {
      studentAccepted = true;
    },
  );
  assert.equal(studentAccepted, true);

  const teacherResponse = responseRecorder();
  middleware(
    {
      auth: {
        profile: {
          requested_role: "teacher",
          approved_role: "teacher",
          account_status: "active",
        },
      },
    },
    teacherResponse,
    () => assert.fail("Teacher must not access Student resources"),
  );
  assert.equal(teacherResponse.statusCode, 403);
});

test("teacher resources accept Teachers and reject Students", () => {
  const middleware = authorizeRole("teacher");
  let teacherAccepted = false;
  middleware(
    {
      auth: {
        profile: {
          requested_role: "teacher",
          approved_role: "teacher",
          account_status: "active",
        },
      },
    },
    responseRecorder(),
    () => {
      teacherAccepted = true;
    },
  );
  assert.equal(teacherAccepted, true);

  const studentResponse = responseRecorder();
  middleware(
    {
      auth: {
        profile: {
          requested_role: "student",
          approved_role: "student",
          account_status: "active",
        },
      },
    },
    studentResponse,
    () => assert.fail("Student must not access Teacher resources"),
  );
  assert.equal(studentResponse.statusCode, 403);
});
