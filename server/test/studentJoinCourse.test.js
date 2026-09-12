import assert from "node:assert/strict";
import test from "node:test";
import "dotenv/config";
import {
  buildStudentEnrollmentRecord,
  canStudentJoinCourse,
  joinCourseSchema,
  normalizeJoinCode,
} from "../src/controllers/courseController.js";

test("join course input trims and normalizes the code", () => {
  const parsed = joinCourseSchema.safeParse({ joinCode: "  it101abc  " });
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.joinCode, "IT101ABC");
  assert.equal(normalizeJoinCode("  AbC123  "), "ABC123");
});

test("join course input requires a code and rejects trusted ownership fields", () => {
  assert.equal(joinCourseSchema.safeParse({ joinCode: " " }).success, false);
  assert.equal(
    joinCourseSchema.safeParse({ joinCode: "IT101ABC", studentId: "other" })
      .success,
    false,
  );
});

test("new student enrollment always uses the authenticated student and active status", () => {
  const record = buildStudentEnrollmentRecord(
    "course-id",
    "student-id",
    "2026-09-11T00:00:00.000Z",
  );
  assert.deepEqual(record, {
    course_id: "course-id",
    student_id: "student-id",
    status: "active",
    enrolled_at: "2026-09-11T00:00:00.000Z",
  });
});

test("only published courses allow student joins", () => {
  assert.equal(canStudentJoinCourse({ status: "published" }), true);
  assert.equal(canStudentJoinCourse({ status: "draft" }), false);
  assert.equal(canStudentJoinCourse({ status: "archived" }), false);
});
