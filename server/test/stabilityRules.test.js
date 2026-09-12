import assert from "node:assert/strict";
import test from "node:test";
import "dotenv/config";
import {
  canEditSubmission,
  courseAllowsStudentMutation,
  validateGradeScore,
} from "../src/controllers/learningController.js";

test("grade scores are bounded by the assignment total points", () => {
  assert.equal(validateGradeScore(0, 50).valid, true);
  assert.equal(validateGradeScore(40, 50).valid, true);
  assert.equal(validateGradeScore(50, 50).valid, true);
  assert.equal(validateGradeScore(51, 50).valid, false);
  assert.equal(validateGradeScore(85, 50).valid, false);
  assert.equal(validateGradeScore(100, 50).valid, false);
  assert.equal(validateGradeScore(-1, 50).valid, false);
});

test("archived courses reject student mutations while other statuses allow them", () => {
  assert.equal(courseAllowsStudentMutation({ status: "draft" }), true);
  assert.equal(courseAllowsStudentMutation({ status: "published" }), true);
  assert.equal(courseAllowsStudentMutation({ status: "archived" }), false);
});

test("graded submissions cannot be edited or resubmitted", () => {
  assert.equal(canEditSubmission("draft"), true);
  assert.equal(canEditSubmission("submitted"), true);
  assert.equal(canEditSubmission("late"), true);
  assert.equal(canEditSubmission("graded"), false);
});
