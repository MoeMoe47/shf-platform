import { DIRECT_SOURCE_EVIDENCE_REFS } from "./directSourceEvidenceRefs";
import { DIRECT_SOURCE_PROOF_RECORDS } from "./directSourceProofRecords";
import { calculateDirectSourceProofReadiness } from "./directSourceProofSafety";

export const DIRECT_SOURCE_PROOF_STORAGE_KEY = "shs.directConnect.directSourceProofRecords.v1";
export const DIRECT_SOURCE_EVIDENCE_STORAGE_KEY = "shs.directConnect.sourceEvidenceRefs.v1";

function canUseStorage() {
  try {
    return Boolean(globalThis?.localStorage);
  } catch {
    return false;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readJson(key, fallback) {
  if (!canUseStorage()) return clone(fallback);
  try {
    const stored = globalThis.localStorage.getItem(key);
    if (!stored) return clone(fallback);
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : clone(fallback);
  } catch {
    return clone(fallback);
  }
}

function saveJson(key, value) {
  const safeValue = Array.isArray(value) ? value : [];
  if (canUseStorage()) globalThis.localStorage.setItem(key, JSON.stringify(safeValue));
  return safeValue;
}

function withReadiness(proofs, evidenceRefs) {
  return proofs.map((proof) => calculateDirectSourceProofReadiness(
    proof,
    evidenceRefs.filter((ref) => ref.direct_source_proof_id === proof.direct_source_proof_id)
  ));
}

export function getStoredDirectSourceEvidenceRefs() {
  return readJson(DIRECT_SOURCE_EVIDENCE_STORAGE_KEY, DIRECT_SOURCE_EVIDENCE_REFS);
}

export function getStoredDirectSourceProofRecords() {
  return withReadiness(readJson(DIRECT_SOURCE_PROOF_STORAGE_KEY, DIRECT_SOURCE_PROOF_RECORDS), getStoredDirectSourceEvidenceRefs());
}

export function resetDirectSourceProofCenter() {
  saveJson(DIRECT_SOURCE_EVIDENCE_STORAGE_KEY, DIRECT_SOURCE_EVIDENCE_REFS);
  return saveJson(DIRECT_SOURCE_PROOF_STORAGE_KEY, DIRECT_SOURCE_PROOF_RECORDS);
}

export function applyDirectSourceProofAction(proofId, action, note = "") {
  const evidenceRefs = getStoredDirectSourceEvidenceRefs();
  const nextProofs = getStoredDirectSourceProofRecords().map((proof) => {
    if (proof.direct_source_proof_id !== proofId) return proof;
    const auditEvent = `operator_${action}_${Date.now().toString(36)}`;
    const warnings = [...(proof.warnings || [])];
    const blockers = [...(proof.blockers || [])];
    let next = {
      ...proof,
      audit_events: [...(proof.audit_events || []), auditEvent],
      updated_at: new Date().toISOString(),
    };

    if (action === "mark_internal_review") {
      next = { ...next, approval_status: "internal_review", verification_status: "in_review" };
    }
    if (action === "mark_privacy_clear") next = { ...next, privacy_status: "clear" };
    if (action === "mark_ownership_clear") next = { ...next, ownership_status: "clear" };
    if (action === "block") {
      blockers.push(note || "operator_blocked");
      next = { ...next, verification_pathway: "blocked", verification_status: "blocked", approval_status: "blocked" };
    }
    if (action === "note") warnings.push(note || "Operator note recorded.");

    return calculateDirectSourceProofReadiness({ ...next, warnings, blockers }, evidenceRefs.filter((ref) => ref.direct_source_proof_id === proofId));
  });

  saveJson(DIRECT_SOURCE_PROOF_STORAGE_KEY, nextProofs);
  return nextProofs;
}
