import { universeDestinations } from "../../pages/universe-v1/universeDestinationRegistry.js";
import { OGL_ORIENTATION_CONTRACTS } from "./orientationRegistry.js";

// This is a derived rollout inventory, not a second destination authority.
// Every id is checked against the Universe registry at validation time.
const coverage = [
  ["bos", "TIER_A", ["instructor", "org_admin", "shs_admin"], "orientation:hub:workspace", "COMPLETE", "Authenticated /hub and admin.html#/hub routes normalize to canonical BOS identity bos; public Solutions discovery remains a separate public identity."],
  ["silicon-heartland-foundation", "TIER_C", ["public", "shf_admin"], null, "NOT_APPLICABLE", "The current public reports surface has no OGL-owned critical workflow or authenticated guidance contract."],
  ["aos", "TIER_A", ["operator", "shs_admin"], null, "EXTERNAL_OR_PRODUCT_DEPENDENCY_BLOCKED", "Destination is restricted and has no confirmed production OGL contract."],
  ["open-autonomous-standard", "TIER_C", ["public"], null, "NOT_APPLICABLE", "Public standards landing surface; lightweight OGL remains optional."],
  ["autonomous-registry", "TIER_C", ["public"], null, "NOT_APPLICABLE", "Independent application authority; no SHS OGL runtime ownership."],
  ["autonomous-trust-bureau", "TIER_C", ["public"], null, "EXTERNAL_OR_PRODUCT_DEPENDENCY_BLOCKED", "Destination is planned and access is not confirmed."],
  ["shs-bos-executive-command", "TIER_A", ["shs_admin", "operator", "auditor", "org_admin"], "orientation:shs-bos:executive-command", "COMPLETE", "Protected Executive Command contract, Guidance Center, anchor, permission-backed fixture, and Chromium acceptance are complete."],
  ["agent-fabric", "TIER_A", ["operator", "reviewer", "shs_admin"], "orientation:agent-fabric:operator", "COMPLETE", "Protected Agent Fabric contract, Guidance Center, semantic anchor, governed operator fixture, and Chromium acceptance are complete."],
  ["career", "TIER_B", ["student", "staff"], "orientation:career:learner", "NOT_APPLICABLE", "The only contract is DRAFT, so no live OGL experience is eligible for this destination."],
  ["curriculum", "TIER_A", ["student", "instructor", "shf_admin"], "orientation:curriculum:student-dashboard", "COMPLETE", "Student and instructor contracts, role-aware Guidance Center selection, semantic anchors, disposable fixtures, and Chromium acceptance are complete."],
  ["arcade", "TIER_C", ["learner", "public"], null, "NOT_APPLICABLE", "Game-specific progression guidance is domain-local and no critical OGL workflow is evidenced."],
  ["civic", "TIER_A", ["provider", "operator", "reviewer"], "orientation:civicsure:provider", "COMPLETE", "Provider and operator/reviewer contracts, role-safe Guidance Center surfaces, semantic anchors, and server/browser separation evidence are complete."],
  ["credit", "TIER_C", ["public", "user"], null, "NOT_APPLICABLE", "Public educational surface; no critical OGL tour requirement identified."],
  ["debt", "TIER_C", ["public", "user"], null, "NOT_APPLICABLE", "Public educational surface; no critical OGL tour requirement identified."],
  ["employer", "TIER_B", ["employer", "user"], null, "NOT_APPLICABLE", "The registered route is public and no canonical employer workflow/context source is currently evidenced for an OGL-owned experience."],
  ["treasury", "TIER_B", ["public", "operator"], null, "NOT_APPLICABLE", "The registered route is a public financial-information surface; OGL does not own payment, accounting, or funding authority."],
  ["sales", "TIER_B", ["client", "client_admin"], "orientation:sales:pipeline", "COMPLETE", "Hub Sales Pipeline now uses the canonical OGL runtime and bounded Sales contract; unrelated Hub compatibility consumers remain separately inventoried for later rollout."],
  ["store", "TIER_C", ["public", "user"], null, "NOT_APPLICABLE", "Catalog surface has no critical guided workflow identified."],
  ["ai-job-compass", "TIER_C", ["public", "user"], null, "NOT_APPLICABLE", "Public utility surface; contextual OGL remains optional."],
  ["allocation", "TIER_B", ["public", "shf_admin"], null, "NOT_APPLICABLE", "The current public allocation surface has no OGL-owned critical workflow or evidenced authenticated context."],
  ["verifier", "TIER_C", ["public"], null, "COMPLETE", "Existing public verifier is lightweight and independently accepted."],
  ["lord-of-outcomes", "TIER_C", ["public"], null, "NOT_APPLICABLE", "Dormant public surface; no rollout required while dormant."],
  ["shf-impact", "TIER_B", ["public", "shf_admin"], null, "NOT_APPLICABLE", "Dormant impact surface has no active OGL contract or live OGL workflow."],
].map(([destinationId, tier, roles, orientationId, status, note]) => Object.freeze({ destinationId, tier, roles: Object.freeze(roles), orientationId, status, note }));

export const OGL_ROLLOUT_COVERAGE = Object.freeze(coverage);

export function validateOglRolloutCoverage(entries = OGL_ROLLOUT_COVERAGE) {
  const errors = [];
  const destinations = new Set(universeDestinations.map(({ id }) => id));
  const knownContracts = new Map(OGL_ORIENTATION_CONTRACTS.map((contract) => [contract.orientationId, contract]));
  const ids = new Set();
  const allowedTiers = new Set(["TIER_A", "TIER_B", "TIER_C"]);
  const allowedStatuses = new Set(["COMPLETE", "NOT_APPLICABLE", "EXTERNAL_OR_PRODUCT_DEPENDENCY_BLOCKED"]);

  for (const entry of entries) {
    if (ids.has(entry.destinationId)) errors.push(`duplicate coverage entry: ${entry.destinationId}`);
    ids.add(entry.destinationId);
    if (!destinations.has(entry.destinationId)) errors.push(`unknown destination: ${entry.destinationId}`);
    if (!allowedTiers.has(entry.tier)) errors.push(`${entry.destinationId}: invalid tier ${entry.tier}`);
    if (!allowedStatuses.has(entry.status)) errors.push(`${entry.destinationId}: invalid status ${entry.status}`);
    if (!Array.isArray(entry.roles) || entry.roles.length === 0) errors.push(`${entry.destinationId}: at least one role/audience group is required`);
    if (entry.orientationId && !knownContracts.has(entry.orientationId)) errors.push(`${entry.destinationId}: unknown orientation ${entry.orientationId}`);
    if (entry.orientationId && knownContracts.get(entry.orientationId)?.destinationId !== entry.destinationId) errors.push(`${entry.destinationId}: orientation binding points elsewhere`);
    if (!entry.note || !entry.note.trim()) errors.push(`${entry.destinationId}: rollout note is required`);
    if (entry.status === "EXTERNAL_OR_PRODUCT_DEPENDENCY_BLOCKED" && !/(route|contract|fixture|acceptance|planned|authority|migration|surface|destination)/i.test(entry.note)) errors.push(`${entry.destinationId}: blocked status must identify an operational dependency`);
  }
  for (const destination of universeDestinations) if (!ids.has(destination.id)) errors.push(`missing coverage entry: ${destination.id}`);
  return { valid: errors.length === 0, errors };
}

export function assertValidOglRolloutCoverage(entries = OGL_ROLLOUT_COVERAGE) {
  const result = validateOglRolloutCoverage(entries);
  if (!result.valid) throw new Error(`Invalid OGL rollout coverage:\n${result.errors.join("\n")}`);
  return entries;
}

assertValidOglRolloutCoverage();
