import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";
import { attachLessonCompletionState } from "../src/controllers/learningController.js";
import { deriveMaterialLearningProgress } from "../src/utils/materialProgress.js";

test("lesson completion state belongs only to matching lesson progress", () => {
  const lessons = [
    { id: "lesson-one", module_id: "module-one", title: "Lesson one" },
    { id: "lesson-two", module_id: "module-one", title: "Lesson two" },
  ];
  const progress = [
    {
      lesson_id: "lesson-one",
      progress_percent: 100,
      is_completed: true,
      completed_at: "2026-09-11T00:00:00.000Z",
    },
  ];

  const result = attachLessonCompletionState(lessons, progress);

  assert.deepEqual(result[0].completion, {
    isCompleted: true,
    completedAt: "2026-09-11T00:00:00.000Z",
    progressPercent: 100,
  });
  assert.deepEqual(result[1].completion, {
    isCompleted: false,
    completedAt: null,
    progressPercent: 0,
  });
});

test("lesson progress weights required sections equally and ignores optional materials", () => {
  const result = deriveMaterialLearningProgress(
    [
      { id: "section-a", is_required: true },
      { id: "section-b", is_required: true },
      { id: "section-info", is_required: true },
    ],
    [
      { id: "a-one", section_id: "section-a", is_required: true },
      { id: "a-optional", section_id: "section-a", is_required: false },
      { id: "b-one", section_id: "section-b", is_required: true },
      { id: "b-two", section_id: "section-b", is_required: true },
    ],
    [
      { material_id: "a-one", progress_percent: 100, is_completed: true },
      { material_id: "a-optional", progress_percent: 0, is_completed: false },
      { material_id: "b-one", progress_percent: 100, is_completed: true },
    ],
  );

  assert.equal(result.sectionStates.get("section-a").progressPercent, 100);
  assert.equal(result.sectionStates.get("section-b").progressPercent, 50);
  assert.equal(result.sectionStates.get("section-info").isInformational, true);
  assert.equal(result.lesson.progressPercent, 75);
  assert.equal(result.lesson.isCompleted, false);
});

test("section reading earns 40% when required materials are present", () => {
  const result = deriveMaterialLearningProgress(
    [{ id: "section-a", content: "A section students must read.", is_required: true }],
    [
      { id: "material-one", section_id: "section-a", is_required: true },
      { id: "material-two", section_id: "section-a", is_required: true },
    ],
    [{ material_id: "material-one", progress_percent: 100, is_completed: true }],
    [{ section_id: "section-a", progress_percent: 50 }],
  );

  const section = result.sectionStates.get("section-a");
  assert.equal(section.readingWeight, 40);
  assert.equal(section.materialsWeight, 60);
  assert.equal(section.progressPercent, 50);
  assert.equal(result.lesson.progressPercent, 50);
  assert.equal(section.isCompleted, false);
});

test("content-only sections use reading for their full progression", () => {
  const result = deriveMaterialLearningProgress(
    [{ id: "section-a", content: "A short reading section.", is_required: true }],
    [],
    [],
    [{ section_id: "section-a", progress_percent: 100 }],
  );
  assert.equal(result.sectionStates.get("section-a").progressPercent, 100);
  assert.equal(result.lesson.isCompleted, true);
});
