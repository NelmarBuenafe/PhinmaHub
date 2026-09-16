import assert from "node:assert/strict";
import test from "node:test";
import "dotenv/config";
import {
  MAX_LESSON_MATERIAL_BYTES,
  MAX_LESSON_VIDEO_BYTES,
  extractYouTubeVideoId,
  mergeWatchedRanges,
  publicMaterialFields,
  safeLessonMaterialUrl,
  validateLessonMaterialDocument,
  validateLessonMaterialVideo,
  watchedPercent,
} from "../src/controllers/lessonMaterialController.js";

test("lesson material URLs require HTTPS and restrict provider-specific links", () => {
  assert.equal(
    safeLessonMaterialUrl("https://www.youtube.com/watch?v=abcdefghijk", "video"),
    "https://www.youtube.com/watch?v=abcdefghijk",
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

test("YouTube URLs normalize to a video ID and watched ranges exclude seeks", () => {
  assert.equal(extractYouTubeVideoId("https://youtu.be/abcdefghijk"), "abcdefghijk");
  assert.equal(extractYouTubeVideoId("https://www.youtube.com/embed/abcdefghijk"), "abcdefghijk");
  assert.equal(extractYouTubeVideoId("https://www.youtube.com/shorts/abcdefghijk"), "abcdefghijk");
  assert.equal(extractYouTubeVideoId("https://example.com/watch?v=abcdefghijk"), null);
  const ranges = mergeWatchedRanges([[0, 20], [90, 100]], 100);
  assert.deepEqual(ranges, [[0, 20], [90, 100]]);
  assert.equal(watchedPercent(ranges, 100), 30);
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

test("lesson video validation allows only MP4 and WebM files within 100 MB", () => {
  assert.equal(validateLessonMaterialVideo("lecture.mp4", "video/mp4", 1024), null);
  assert.equal(validateLessonMaterialVideo("lecture.webm", "video/webm", 1024), null);
  assert.match(validateLessonMaterialVideo("lecture.mov", "video/quicktime", 1024), /Unsupported video type/);
  assert.match(validateLessonMaterialVideo("lecture.mp4", "video/mp4", MAX_LESSON_VIDEO_BYTES + 1), /too large/);
});

test("student lesson-material fields never include the private storage path", () => {
  assert.doesNotMatch(publicMaterialFields(), /storage_path/);
});
