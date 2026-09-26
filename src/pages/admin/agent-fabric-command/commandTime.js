// src/pages/admin/agent-fabric-command/commandTime.js
// Elapsed-age wording for last-known state. No freshness threshold is applied:
// the Fabric defines none, so age is shown as a fact, never as a verdict.

export function formatAge(seconds) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) return null;
  if (seconds < 60) return "less than a minute ago";
  const units = [
    [86_400, "day"],
    [3_600, "hour"],
    [60, "minute"],
  ];
  for (const [size, name] of units) {
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      return `${n} ${name}${n === 1 ? "" : "s"} ago`;
    }
  }
  return null;
}

// Compact form for dense surfaces (map nodes): "23d ago", "3h ago", "<1m ago".
export function formatAgeShort(seconds) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) return null;
  if (seconds < 60) return "<1m ago";
  for (const [size, unit] of [[86_400, "d"], [3_600, "h"], [60, "m"]]) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${unit} ago`;
  }
  return null;
}
