export const civicSureTerminology = {
  truthFact: { primary: "Verified fact", technical: "Truth Fact" },
  reconciliationCase: { primary: "Data conflict review", technical: "Reconciliation Case" },
  sourceAuthority: { primary: "Authoritative source", technical: "Source Authority" },
  verificationLevel: { primary: "Verification level", technical: "V-level" },
  readinessBlocker: { primary: "What needs attention", technical: "Readiness blocker" },
};

export function presentCivicSureTerm(key, technical = false) {
  const term = civicSureTerminology[key];
  return term ? term[technical ? "technical" : "primary"] : key;
}
