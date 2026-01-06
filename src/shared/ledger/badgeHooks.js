/**
 * Thin wrappers so UI code calls one place.
 * Swap internals later to hit your real LedgerProvider or API.
 */

export async function awardEvu({ userId, courseId, evu }) {
  // TODO: replace with real ledger call (e.g., shared/ledger/ledgerClient.js)
  const entry = { userId, courseId, evu, awardedAt: Date.now(), txId: null };
  console.debug("[awardEvu]", entry);
  // persist as needed
  return entry;
}

export async function mintBadge({ userId, courseId, badge = "Industry-Verified" }) {
  // TODO: replace with NFT or on-chain badge mint
  const entry = { userId, courseId, badge, mintedAt: Date.now(), tokenId: null };
  console.debug("[mintBadge]", entry);
  return entry;
}
