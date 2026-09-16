import assert from "node:assert/strict";
import test from "node:test";
import { readingCheckpointCount, readingCheckpointPercent } from "./readingCheckpoints.js";

test("reading checkpoints scale with content length", () => {
  assert.equal(readingCheckpointCount(1), 1);
  assert.equal(readingCheckpointCount(4), 2);
  assert.equal(readingCheckpointCount(8), 3);
  assert.equal(readingCheckpointCount(30), 6);
});

test("reading checkpoints advance in discrete persisted percentages", () => {
  assert.deepEqual([0, 1, 2, 3].map((index) => readingCheckpointPercent(index, 4)), [25, 50, 75, 100]);
});
