export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );
}
export function relativeTime(value) {
  if (!value) return "—";
  const seconds = Math.round((new Date(value) - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units)
    if (Math.abs(seconds) >= size)
      return formatter.format(Math.round(seconds / size), unit);
  return "just now";
}
export function fullName(item) {
  return (
    item.full_name ||
    [item.first_name, item.middle_name, item.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Unnamed user"
  );
}
