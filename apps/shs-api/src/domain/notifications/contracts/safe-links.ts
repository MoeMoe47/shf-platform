// NCA-4 §26 (Safe Action Links) / mirrors the frontend's
// src/components/shared/notifications/safeLinks.js — the same rule
// enforced again on the backend, since an external channel (email) never
// goes through the frontend's own check at all. Only a same-origin
// relative path is ever treated as safe to place in an outbound message;
// no authority is ever encoded in the URL itself (no org id, no token) —
// the destination is a bare path the application's own server-side
// authorization re-checks after the user is authenticated, exactly as it
// already does for every in-app action link.
export function isSafeInternalPath(path: unknown): path is string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}
