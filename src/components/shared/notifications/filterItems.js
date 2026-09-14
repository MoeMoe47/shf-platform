// NCA-5 micro-gap fix: the UNREAD filter previously fetched the exact same
// unfiltered list as ALL (there is no separate backend endpoint for it,
// unlike ACTION_REQUIRED's listAttentionItems) and nothing downstream ever
// narrowed it — the "Unread" tab silently showed every notification,
// including already-read ones. `status` here is the same
// backend-authoritative field NotificationItem.jsx and the unread count
// already trust; filtering on it client-side reuses that same authority
// rather than introducing a new one. Kept as its own dependency-free
// module (no React/alias imports) so it can be unit-tested directly under
// plain `node --test`, matching domainLabels.js/safeLinks.js/errorMessages.js.
export function filterItemsForView(items, filter) {
  return filter === "unread" ? items.filter((item) => item.status === "UNREAD") : items;
}
