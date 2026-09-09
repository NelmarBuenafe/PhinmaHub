import assert from "node:assert/strict";
import test from "node:test";
import "dotenv/config";
import {
  buildNewCourseRecord,
  courseCreationSchema,
  generateJoinCode,
} from "../src/controllers/courseController.js";

const validCourse = {
  courseCode: "IT101",
  title: "Introduction to Information Technology",
  description: "A real course description.",
  category: "Information Technology",
  difficulty: "beginner",
  visibility: "private",
};

test("Teacher course creation validates only supported course fields", () => {
  assert.equal(courseCreationSchema.safeParse(validCourse).success, true);
  assert.equal(
    courseCreationSchema.safeParse({ ...validCourse, teacher_id: "other-user" })
      .success,
    false,
  );
  assert.equal(
    courseCreationSchema.safeParse({ ...validCourse, difficulty: "expert" })
      .success,
    false,
  );
});

test("new Teacher courses use authenticated ownership and start as private drafts", () => {
  const record = buildNewCourseRecord(validCourse, "teacher-a", "ABC123DEF456");
  assert.equal(record.teacher_id, "teacher-a");
  assert.equal(record.status, "draft");
  assert.equal(record.visibility, "private");
  assert.equal(record.join_code, "ABC123DEF456");
});

test("generated join codes satisfy the database length requirement", () => {
  const first = generateJoinCode();
  const second = generateJoinCode();
  assert.match(first, /^[A-F0-9]{12}$/);
  assert.notEqual(first, second);
});
