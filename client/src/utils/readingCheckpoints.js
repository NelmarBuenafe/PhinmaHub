export function readingCheckpointCount(blockCount) {
  if (blockCount <= 2) return 1;
  if (blockCount <= 4) return 2;
  if (blockCount <= 8) return 3;
  return Math.min(6, Math.max(4, Math.ceil(blockCount / 3)));
}

export function readingCheckpointPercent(checkpointIndex, checkpointCount) {
  return Math.round(((checkpointIndex + 1) / checkpointCount) * 100);
}
