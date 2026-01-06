// Lightweight attestation helpers — swap for real signer / chain later
export function evidenceHash(evidence) {
  // Stable JSON hash surrogate (NOT cryptographically secure; replace with keccak256 on backend/chain)
  const json = JSON.stringify(evidence, Object.keys(evidence).sort());
  let h = 0;
  for (let i = 0; i < json.length; i++) {
    h = (h << 5) - h + json.charCodeAt(i);
    h |= 0;
  }
  // return hex-ish string
  return "0x" + (h >>> 0).toString(16).padStart(8, "0");
}

export function buildAttestation({ studentId, lessonId, evidenceHash, approver }) {
  return {
    type: "attestation.microLesson",
    studentHash: hashStr(studentId || "local:user"),
    lessonId,
    evidenceHash,
    approver: approver || "system",
    issuedAt: Date.now(),
    version: "v1"
  };
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return "0x" + (h >>> 0).toString(16).padStart(8, "0");
}
