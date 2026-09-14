import assert from "node:assert/strict";
import test from "node:test";
import "dotenv/config";
import {
  MAX_SUBMISSION_FILE_BYTES,
  MAX_SUBMISSION_FILES,
  MAX_SUBMISSION_LINKS,
  MAX_SUBMISSION_VIDEO_BYTES,
  sanitizeSubmissionFileName,
  validateSubmissionFile,
  validateSubmissionLink,
} from "../src/controllers/submissionAttachmentController.js";

test("accepts supported assignment file formats with their matching MIME", () => {
  for (const [name, mime] of [
    ["photo.jpg", "image/jpeg"],
    ["photo.webp", "image/webp"],
    ["report.doc", "application/msword"],
    ["report.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ["report.pdf", "application/pdf"],
    ["demo.mp4", "video/mp4"],
    ["demo.webm", "video/webm"],
  ]) {
    assert.equal(validateSubmissionFile(name, mime, 1024).valid, true, name);
  }
});

test("rejects mismatched MIME, unsupported extensions, and oversized files", () => {
  assert.equal(validateSubmissionFile("photo.jpg", "image/png", 1024).valid, false);
  assert.equal(validateSubmissionFile("script.exe", "application/octet-stream", 1024).valid, false);
  assert.equal(validateSubmissionFile("report.pdf", "application/pdf", MAX_SUBMISSION_FILE_BYTES + 1).valid, false);
  assert.equal(validateSubmissionFile("demo.mp4", "video/mp4", MAX_SUBMISSION_VIDEO_BYTES + 1).valid, false);
});

test("accepts only HTTP and HTTPS external links", () => {
  assert.equal(validateSubmissionLink("https://example.com/project").valid, true);
  assert.equal(validateSubmissionLink("http://localhost:3000").valid, true);
  assert.equal(validateSubmissionLink("javascript:alert(1)").valid, false);
  assert.equal(validateSubmissionLink("not-a-url").valid, false);
});

test("sanitizes path separators and unsafe filename characters", () => {
  assert.equal(sanitizeSubmissionFileName("..\\private/report final?.pdf"), "report-final-.pdf");
  assert.ok(!sanitizeSubmissionFileName("../../secret").includes("/"));
});

test("exposes the configured attachment caps", () => {
  assert.equal(MAX_SUBMISSION_FILES, 5);
  assert.equal(MAX_SUBMISSION_LINKS, 5);
  assert.equal(MAX_SUBMISSION_FILE_BYTES, 10 * 1024 * 1024);
  assert.equal(MAX_SUBMISSION_VIDEO_BYTES, 50 * 1024 * 1024);
});
