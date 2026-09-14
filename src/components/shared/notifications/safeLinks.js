// NCA-3 §28 (Security): only ever treat a destination as safe to link if it
// is a same-origin relative path. Every real backend policy already only
// ever produces paths like "/studio/...", "/curriculum/...",
// "/documentation/..." — this is a defensive backstop against a future
// policy author's mistake, or any value this UI did not itself generate,
// never a trust boundary the UI depends on being perfect elsewhere.
export function isSafeInternalPath(path) {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}
