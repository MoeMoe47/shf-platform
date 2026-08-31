// SHF Ecosystem Phase 12.1 — External Account Security foundation.
//
// Only an internal, allowlisted app path may be recorded as an OAuth
// return path — never an arbitrary caller-supplied URL. This is checked
// once at state-issuance time (not just re-validated at callback) so an
// attacker cannot get a malicious return path persisted into a state
// record in the first place.
const ALLOWED_RETURN_PATH_PREFIXES = ["/career/settings", "/curriculum/settings"];

export function isSafeInternalReturnPath(path: unknown): path is string {
  if (typeof path !== "string" || path.length === 0) return false;
  if (!path.startsWith("/")) return false; // must be relative, not absolute
  if (path.startsWith("//")) return false; // protocol-relative ("//evil.example") rejected
  if (/^\/\s*[\\/]/.test(path)) return false; // "/\evil.example" and similar backslash tricks
  if (/[a-z][a-z0-9+.-]*:/i.test(path)) return false; // any "scheme:" anywhere, e.g. "javascript:", "data:"
  if (/[\x00-\x1f]/.test(path)) return false; // control characters, incl. embedded newlines
  if (path.split(/[?#]/)[0].split("/").includes("..")) return false; // "/career/settings/../../evil" — a string-prefix match alone would accept this
  return ALLOWED_RETURN_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`));
}
