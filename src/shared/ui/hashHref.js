/**
 * HashRouter-safe href builder.
 * If you are inside HashRouter, absolute URLs must include #/
 * Example: /#/metaverse/growth-observatory
 */
export function hashHref(path) {
  const p = String(path || "/").startsWith("/") ? String(path) : `/${path}`;
  // keep origin + /#/path so it works even if launched from a different base
  return `/#${p}`;
}
