import assert from "node:assert/strict";
import test from "node:test";
import "dotenv/config";
import { teacherAnnouncementSchema } from "../src/controllers/teacherAnnouncementController.js";

test("teacher announcements reject blank titles and content", () => {
  assert.equal(
    teacherAnnouncementSchema.safeParse({ title: "   ", body: "Content" }).success,
    false,
  );
  assert.equal(
    teacherAnnouncementSchema.safeParse({ title: "Title", body: "   " }).success,
    false,
  );
});

test("teacher announcements default to unpublished drafts", () => {
  const result = teacherAnnouncementSchema.safeParse({
    title: "Class schedule",
    body: "The next lesson is available Monday.",
  });
  assert.equal(result.success, true);
  assert.equal(result.data.isPublished, false);
});

test("teacher announcements reject privileged or unrelated fields", () => {
  assert.equal(
    teacherAnnouncementSchema.safeParse({
      title: "Title",
      body: "Body",
      courseId: "another-course",
      teacher_id: "another-teacher",
    }).success,
    false,
  );
});
