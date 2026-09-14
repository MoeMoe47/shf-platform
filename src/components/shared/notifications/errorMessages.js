// NCA-3 §19 (Error State): distinguishes "no active organization has been
// selected yet" (ORG_CONTEXT_REQUIRED — expected for a multi-org user
// until an organization switcher exists; that switcher is an EXR
// placement concern, not something this phase builds) from a genuine
// backend outage, so the empty/error state shown is honest rather than a
// generic "something went wrong."
export function messageForError(error, fallback) {
  if (error?.code === "ORG_CONTEXT_REQUIRED") return "Select an organization to view notifications.";
  return fallback;
}
