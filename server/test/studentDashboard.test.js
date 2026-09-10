import test from "node:test";
import assert from "node:assert/strict";
import {
  isPendingSubmission,
  progressPercent,
} from "../src/utils/studentDashboard.js";

test("student dashboard progress is rounded and safe for empty courses", () => {
  assert.equal(progressPercent(8, 12), 67);
  assert.equal(progressPercent(0, 0), 0);
  assert.equal(progressPercent(4, 3), 100);
});

test("student dashboard treats missing and draft submissions as pending", () => {
  assert.equal(isPendingSubmission(undefined), true);
  assert.equal(isPendingSubmission("draft"), true);
  assert.equal(isPendingSubmission("submitted"), false);
  assert.equal(isPendingSubmission("late"), false);
  assert.equal(isPendingSubmission("graded"), false);
});
