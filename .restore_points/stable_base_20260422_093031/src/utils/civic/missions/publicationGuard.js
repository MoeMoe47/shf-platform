// Decide if external publishing (e.g., posting content) is allowed.
// For now, block by default; later, allow under specific conditions/policies.
export function canPublishExternally({ attestation, lesson }) {
  // Example policy: block if lesson is marked as politicalPublishBlock === true
  if (lesson?.politicalPublishBlock) return false;
  // Default: block until backend moderation exists
  return false;
}
