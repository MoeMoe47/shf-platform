import assert from "node:assert/strict";
import test from "node:test";
import {
  PORTFOLIO_INVARIANTS,
  PORTFOLIO_VISIBILITIES,
  assertEligibleEvidenceSource,
  buildImmutableProvenance,
  buildPortfolioArtifactDraft,
  portfolioArtifactCanBeRemoved,
  portfolioCannotAssertInstitutionalFact,
  presentationEditPreservesProvenance,
  sourceIdentity,
} from "../src/domain/portfolio/model/portfolio-contract.ts";

const scope = { learnerId: "learner-a", organizationId: "org-a", tenantId: "tenant:org-a" };
const source = {
  sourceType: "STUDIO_EVIDENCE" as const,
  evidenceId: "evidence-a",
  evidenceStatus: "REVIEWED",
  portfolioEligible: true,
  learnerId: "learner-a",
  organizationId: "org-a",
  tenantId: "tenant:org-a",
  studioProjectId: "project-a",
  studioDeliveryId: "delivery-a",
  workspaceRevision: 4,
  projectType: "WEBSITE" as const,
  finalizedAt: "2026-09-02T00:00:00.000Z",
  assignmentId: "assignment-a",
  curriculumReleaseId: "release-a",
  competencyIds: ["competency-a"],
};

test("Evidence-backed Studio source is required and identity is deterministic", () => {
  const draft = buildPortfolioArtifactDraft({ portfolioId: "portfolio-a", source }, scope);
  assert.equal(draft.provenance.evidenceId, "evidence-a");
  assert.equal(sourceIdentity(source), "STUDIO_EVIDENCE:evidence-a");
  assert.equal(draft.presentation.visibility, "PRIVATE");
});

test("Evidence learner, organization, and tenant cannot be overridden", () => {
  assert.throws(() => assertEligibleEvidenceSource({ ...source, learnerId: "learner-b" }, scope), /different learner or scope/);
  assert.throws(() => assertEligibleEvidenceSource({ ...source, organizationId: "org-b", tenantId: "tenant:org-b" }, scope), /different learner or scope/);
  assert.throws(() => assertEligibleEvidenceSource({ ...source, tenantId: "tenant:org-b" }, scope), /different learner or scope/);
});

test("unsupported or non-eligible sources fail safely", () => {
  assert.throws(() => assertEligibleEvidenceSource({ ...source, portfolioEligible: false }, scope), /not made this source Portfolio-eligible/);
  assert.throws(() => assertEligibleEvidenceSource({ ...source, sourceType: "PROJECT_SUBMISSION" as never }, scope), /Only Evidence-backed Studio sources/);
});

test("provenance is immutable while presentation remains independently editable", () => {
  const provenance = buildImmutableProvenance(source, scope);
  const changedPresentation = buildPortfolioArtifactDraft({ portfolioId: "portfolio-a", source, presentation: { title: "A new title", summary: "A learner summary" } }, scope);
  assert.equal(changedPresentation.provenance.workspaceRevision, 4);
  assert.equal(presentationEditPreservesProvenance(provenance, changedPresentation.provenance), true);
  assert.equal(Object.isFrozen(provenance), true);
});

test("historical revision provenance remains distinct from a later source revision", () => {
  const oldProvenance = buildImmutableProvenance(source, scope);
  const laterProvenance = buildImmutableProvenance({ ...source, evidenceId: "evidence-b", studioDeliveryId: "delivery-b", workspaceRevision: 5 }, scope);
  assert.notEqual(oldProvenance.workspaceRevision, laterProvenance.workspaceRevision);
  assert.notEqual(sourceIdentity({ sourceType: oldProvenance.sourceType, evidenceId: oldProvenance.evidenceId }), sourceIdentity({ sourceType: laterProvenance.sourceType, evidenceId: laterProvenance.evidenceId }));
});

test("Portfolio is not completion, credential, deployment, Registry, or ClientOps authority", () => {
  for (const field of ["evidenceVerified", "assignmentComplete", "lessonComplete", "credentialIssued", "deployed", "registryApproved", "clientOpsDispatched"]) assert.equal(portfolioCannotAssertInstitutionalFact(field), true);
  assert.match(PORTFOLIO_INVARIANTS.completionSeparation, /cannot mark/);
});

test("visibility defaults safely and public states remain reserved", () => {
  assert.deepEqual(PORTFOLIO_VISIBILITIES, ["PRIVATE", "ORGANIZATION", "UNLISTED", "PUBLIC"]);
  assert.throws(() => buildPortfolioArtifactDraft({ portfolioId: "portfolio-a", source, presentation: { visibility: "PUBLIC" as never } }, scope), /not available/);
  assert.throws(() => buildPortfolioArtifactDraft({ portfolioId: "portfolio-a", source, presentation: { visibility: "UNLISTED" as never } }, scope), /not available/);
});

test("removing presentation does not delete canonical source", () => {
  assert.equal(portfolioArtifactCanBeRemoved("ACTIVE"), true);
  assert.equal(portfolioArtifactCanBeRemoved("REMOVED"), false);
  assert.match(PORTFOLIO_INVARIANTS.removalNonDestructive, /does not delete/);
});

test("bounded presentation fields reject oversized content", () => {
  assert.throws(() => buildPortfolioArtifactDraft({ portfolioId: "portfolio-a", source, presentation: { summary: "x".repeat(2001) } }, scope), /exceeds/);
});
