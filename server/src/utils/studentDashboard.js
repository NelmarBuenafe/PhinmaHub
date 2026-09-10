export function progressPercent(completed, total) {
  return total ? Math.min(100, Math.round((completed / total) * 100)) : 0;
}

export function isPendingSubmission(status) {
  return !status || status === "draft";
}
