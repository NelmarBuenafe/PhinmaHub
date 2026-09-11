import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";
import { attachLessonCompletionState } from "../src/controllers/learningController.js";

test("lesson completion state belongs only to matching lesson progress", () => {
  const lessons = [
    { id: "lesson-one", module_id: "module-one", title: "Lesson one" },
    { id: "lesson-two", module_id: "module-one", title: "Lesson two" },
  ];
  const progress = [
    {
      lesson_id: "lesson-one",
      is_completed: true,
      completed_at: "2026-09-11T00:00:00.000Z",
    },
  ];

  const result = attachLessonCompletionState(lessons, progress);

  assert.deepEqual(result[0].completion, {
    isCompleted: true,
    completedAt: "2026-09-11T00:00:00.000Z",
  });
  assert.deepEqual(result[1].completion, {
    isCompleted: false,
    completedAt: null,
  });
});
