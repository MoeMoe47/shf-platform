import assert from "node:assert/strict";
import test from "node:test";
import { ServiceClaimAssuranceService } from "../src/domain/government-assurance/service/service-claim-assurance-service.js";

const actor = { organizationId: "wave3-assurance-org", tenantId: "tenant:wave3-assurance-org", permissions: ["government.assurance.claim.view"] };
const base = {
  organizationId: "wave3-assurance-org", tenantId: "tenant:wave3-assurance-org",
  provider: { reference: "provider-1", organizationType: "FOR_PROFIT", active: true, qualified: true, authorized: true },
  service: { reference: "service-1", authorized: true, periodStart: "2026-01-01", periodEnd: "2026-03-31", claimDate: "2026-02-01", approvedRate: 100, claimedUnits: 5, claimedAmount: 500, currency: "USD" },
  claim: { reference: "claim-1" }, evidence: { required: true, admitted: true, provenanceComplete: true, integrityVerified: true, references: ["evidence-1"] },
  verification: { status: "PASSED" as const, reference: "verification-1" }, reconciliation: { status: "RESOLVED" as const, reference: "reconciliation-1" },
  externalPayment: { invoiceReference: "invoice-1", authorizedAmount: 500 },
};

test("same assurance spine accepts for-profit and nonprofit providers and keeps payment external", () => {
  const sut = new ServiceClaimAssuranceService();
  const accepted = sut.assess(actor, base);
  assert.equal(accepted.acceptedTruthEligible, true); assert.equal(accepted.payableEligible, true); assert.equal(accepted.externalPaymentAuthority, "EXTERNAL_SYSTEM_OF_RECORD");
  const nonprofit = sut.assess(actor, { ...base, provider: { ...base.provider, organizationType: "NONPROFIT" } });
  assert.equal(nonprofit.acceptedTruthEligible, true); assert.equal(nonprofit.providerType, "NONPROFIT");
});

test("missing evidence and failed verification cannot become accepted or payable", () => {
  const sut = new ServiceClaimAssuranceService();
  const missing = sut.assess(actor, { ...base, evidence: { ...base.evidence, admitted: false, references: [] }, verification: { status: "FAILED", reference: "verification-failed" } });
  assert.equal(missing.acceptedTruthEligible, false); assert.equal(missing.payableEligible, false); assert.ok(missing.blockers.includes("EVIDENCE_NOT_ADMISSIBLE"));
});

test("a failed verification requires a separately authorized, traceable exception", () => {
  const sut = new ServiceClaimAssuranceService();
  const result = sut.assess(actor, { ...base, verification: { status: "FAILED", reference: "verification-failed" }, exception: { authorized: true, decisionReference: "decision-1", rationale: "Documented exception review" } });
  assert.equal(result.acceptedTruthEligible, true); assert.equal(result.payableEligible, true); assert.deepEqual(result.exception, { authorized: true, decisionReference: "decision-1" });
});

test("duplicate, overlapping, unauthorized, out-of-period, and rate-mismatched claims fail closed", () => {
  const sut = new ServiceClaimAssuranceService();
  for (const input of [
    { ...base, claim: { ...base.claim, duplicate: true } },
    { ...base, claim: { ...base.claim, overlapping: true } },
    { ...base, provider: { ...base.provider, authorized: false } },
    { ...base, service: { ...base.service, claimDate: "2027-01-01" } },
    { ...base, service: { ...base.service, claimedAmount: 501 } },
  ]) assert.equal(sut.assess(actor, input).acceptedTruthEligible, false);
});
