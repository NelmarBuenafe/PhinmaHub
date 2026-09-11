import assert from "node:assert/strict";
import test from "node:test";
import "dotenv/config";
import {
  MAX_LESSON_MATERIAL_BYTES,
  publicMaterialFields,
  safeLessonMaterialUrl,
  validateLessonMaterialDocument,
} from "../src/controllers/lessonMaterialController.js";

test("lesson material URLs require HTTPS and restrict provider-specific links", () => {
  assert.equal(
    safeLessonMaterialUrl("https://www.youtube.com/watch?v=abc123", "video"),
    "https://www.youtube.com/watch?v=abc123",
  );
  assert.equal(
    safeLessonMaterialUrl("https://docs.google.com/forms/d/example/viewform", "google_form"),
    "https://docs.google.com/forms/d/example/viewform",
  );
  assert.equal(
    safeLessonMaterialUrl("https://forms.gle/example", "google_form"),
    "https://forms.gle/example",
  );
  assert.equal(safeLessonMaterialUrl("http://example.com", "external_link"), null);
  assert.equal(safeLessonMaterialUrl("https://example.com/video", "video"), null);
  assert.equal(safeLessonMaterialUrl("https://forms.google.com/example", "google_form"), null);
});

test("lesson document validation allows only supported file types within 10 MB", () => {
  assert.equal(
    validateLessonMaterialDocument("lesson.pdf", "application/pdf", 1024),
    null,
  );
  assert.equal(
    validateLessonMaterialDocument(
      "lesson.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      1024,
    ),
    null,
  );
  assert.match(
    validateLessonMaterialDocument("lesson.exe", "application/octet-stream", 1024),
    /Unsupported file type/,
  );
  assert.match(
    validateLessonMaterialDocument(
      "lesson.pdf",
      "application/pdf",
      MAX_LESSON_MATERIAL_BYTES + 1,
    ),
    /too large/,
  );
});

test("student lesson-material fields never include the private storage path", () => {
  assert.doesNotMatch(publicMaterialFields(), /storage_path/);
});
