/**
 * Phase 1 contract only. This module defines Portfolio authority and
 * validation boundaries; it intentionally has no database or HTTP behavior.
 */

export const PORTFOLIO_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export type PortfolioStatus = typeof PORTFOLIO_STATUSES[number];

export const PORTFOLIO_ARTIFACT_STATUSES = ["ACTIVE", "HIDDEN", "ARCHIVED", "REMOVED"] as const;
export type PortfolioArtifactStatus = typeof PORTFOLIO_ARTIFACT_STATUSES[number];

export const PORTFOLIO_VISIBILITIES = ["PRIVATE", "ORGANIZATION", "UNLISTED", "PUBLIC"] as const;
export type PortfolioVisibility = typeof PORTFOLIO_VISIBILITIES[number];

export const PORTFOLIO_SUPPORTED_VISIBILITIES = ["PRIVATE", "ORGANIZATION"] as const;
export type SupportedPortfolioVisibility = typeof PORTFOLIO_SUPPORTED_VISIBILITIES[number];

export const PORTFOLIO_SOURCE_TYPES = ["STUDIO_EVIDENCE"] as const;
export type PortfolioSourceType = typeof PORTFOLIO_SOURCE_TYPES[number];

export const PORTFOLIO_INVARIANTS = {
  evidenceOwnsVerification: "Portfolio never manufactures or modifies Evidence.",
  completionSeparation: "Portfolio cannot mark lesson, assignment, course, or pathway completion.",
  credentialSeparation: "Portfolio cannot determine eligibility for or issue credentials.",
  deliverySeparation: "Portfolio cannot deploy Websites, register Agents, or dispatch ClientOps.",
  provenanceImmutable: "Source and institutional provenance cannot be changed by presentation edits.",
  sourceOwnership: "A learner may attach only an Evidence record the canonical service authorizes for that learner and scope.",
  scopeAgreement: "Portfolio, Artifact, Evidence, Studio Project, and Delivery scope must agree.",
  privateDefault: "New Portfolio presentation defaults to PRIVATE.",
  visibilitySeparate: "Portfolio visibility is separate from Evidence verification and public showcase policy.",
  browserNotAuthority: "Browser and localStorage state cannot create canonical Portfolio facts.",
  historicalSource: "Source revision and provenance remain historical even when the source is later stale or superseded.",
  removalNonDestructive: "Removing an Artifact from Portfolio does not delete its source Evidence or Studio history.",
} as const;

export interface PortfolioScope {
  learnerId: string;
  organizationId: string;
  tenantId: string;
}

export interface Portfolio {
  portfolioId: string;
  learnerId: string;
  organizationId: string;
  tenantId: string;
  status: PortfolioStatus;
  createdAt: string;
  updatedAt: string;
}

/** Evidence authority supplies this object; Portfolio never derives it. */
export interface EligibleEvidenceSource {
  sourceType: "STUDIO_EVIDENCE";
  evidenceId: string;
  evidenceStatus: string;
  portfolioEligible: boolean;
  learnerId: string;
  organizationId: string;
  tenantId: string;
  studioProjectId: string;
  studioDeliveryId: string;
  workspaceRevision: number;
  projectType: "WEBSITE" | "AI_AGENT";
  finalizedAt: string;
  assignmentId?: string | null;
  curriculumReleaseId?: string | null;
  competencyIds?: readonly string[];
}

export interface PortfolioArtifactProvenance {
  sourceType: PortfolioSourceType;
  evidenceId: string;
  learnerId: string;
  organizationId: string;
  tenantId: string;
  studioProjectId: string;
  studioDeliveryId: string;
  workspaceRevision: number;
  projectType: "WEBSITE" | "AI_AGENT";
  finalizedAt: string;
  assignmentId: string | null;
  curriculumReleaseId: string | null;
  competencyIds: readonly string[];
}

export interface PortfolioArtifactPresentation {
  title: string;
  summary: string;
  reflection: string;
  visibility: SupportedPortfolioVisibility;
  position: number;
  collectionKey: string | null;
  thumbnailRef: string | null;
}

export interface PortfolioArtifact {
  artifactId: string;
  portfolioId: string;
  learnerId: string;
  organizationId: string;
  tenantId: string;
  status: PortfolioArtifactStatus;
  provenance: Readonly<PortfolioArtifactProvenance>;
  presentation: PortfolioArtifactPresentation;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioArtifactDraftInput {
  portfolioId: string;
  source: EligibleEvidenceSource;
  presentation?: Partial<PortfolioArtifactPresentation>;
}

export class PortfolioContractError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "PortfolioContractError";
  }
}

function required(value: unknown, field: string): string {
  const result = String(value ?? "").trim();
  if (!result) throw new PortfolioContractError("PORTFOLIO_REQUIRED_FIELD", `${field} is required.`);
  return result;
}

function boundedText(value: unknown, field: string, max: number): string {
  const result = String(value ?? "");
  if (result.length > max) throw new PortfolioContractError("PORTFOLIO_TEXT_TOO_LONG", `${field} exceeds the supported length.`);
  return result;
}

function supportedVisibility(value: unknown): SupportedPortfolioVisibility {
  const visibility = value ?? "PRIVATE";
  if (!(PORTFOLIO_SUPPORTED_VISIBILITIES as readonly unknown[]).includes(visibility)) {
    throw new PortfolioContractError("PORTFOLIO_VISIBILITY_NOT_SUPPORTED", "This visibility is not available in the current Portfolio contract.");
  }
  return visibility as SupportedPortfolioVisibility;
}

export function assertPortfolioScope(scope: PortfolioScope): PortfolioScope {
  const learnerId = required(scope.learnerId, "learnerId");
  const organizationId = required(scope.organizationId, "organizationId");
  const tenantId = required(scope.tenantId, "tenantId");
  if (tenantId !== `tenant:${organizationId}`) throw new PortfolioContractError("PORTFOLIO_SCOPE_MISMATCH", "Organization and tenant scope must agree.");
  return { learnerId, organizationId, tenantId };
}

export function assertEligibleEvidenceSource(source: EligibleEvidenceSource, scope: PortfolioScope): EligibleEvidenceSource {
  const expected = assertPortfolioScope(scope);
  if (source.sourceType !== "STUDIO_EVIDENCE") throw new PortfolioContractError("PORTFOLIO_SOURCE_UNSUPPORTED", "Only Evidence-backed Studio sources are supported.");
  if (!source.portfolioEligible) throw new PortfolioContractError("PORTFOLIO_SOURCE_NOT_ELIGIBLE", "The canonical Evidence authority has not made this source Portfolio-eligible.");
  if (source.learnerId !== expected.learnerId || source.organizationId !== expected.organizationId || source.tenantId !== expected.tenantId) {
    throw new PortfolioContractError("PORTFOLIO_SOURCE_SCOPE_MISMATCH", "Evidence belongs to a different learner or scope.");
  }
  if (!Number.isInteger(source.workspaceRevision) || source.workspaceRevision < 1) throw new PortfolioContractError("PORTFOLIO_REVISION_INVALID", "Source workspace revision must be a positive integer.");
  required(source.evidenceId, "evidenceId");
  required(source.studioProjectId, "studioProjectId");
  required(source.studioDeliveryId, "studioDeliveryId");
  return source;
}

export function buildImmutableProvenance(source: EligibleEvidenceSource, scope: PortfolioScope): Readonly<PortfolioArtifactProvenance> {
  assertEligibleEvidenceSource(source, scope);
  return Object.freeze({
    sourceType: source.sourceType,
    evidenceId: source.evidenceId,
    learnerId: source.learnerId,
    organizationId: source.organizationId,
    tenantId: source.tenantId,
    studioProjectId: source.studioProjectId,
    studioDeliveryId: source.studioDeliveryId,
    workspaceRevision: source.workspaceRevision,
    projectType: source.projectType,
    finalizedAt: source.finalizedAt,
    assignmentId: source.assignmentId ?? null,
    curriculumReleaseId: source.curriculumReleaseId ?? null,
    competencyIds: Object.freeze([...(source.competencyIds || [])]),
  });
}

export function buildPortfolioArtifactDraft(input: PortfolioArtifactDraftInput, scope: PortfolioScope) {
  const provenance = buildImmutableProvenance(input.source, scope);
  const presentation = input.presentation || {};
  const position = presentation.position ?? 0;
  if (!Number.isInteger(position) || position < 0) throw new PortfolioContractError("PORTFOLIO_POSITION_INVALID", "Artifact position must be a non-negative integer.");
  return {
    portfolioId: required(input.portfolioId, "portfolioId"),
    learnerId: provenance.learnerId,
    organizationId: provenance.organizationId,
    tenantId: provenance.tenantId,
    provenance,
    presentation: {
      title: boundedText(presentation.title ?? "Untitled project", "title", 200),
      summary: boundedText(presentation.summary ?? "", "summary", 2000),
      reflection: boundedText(presentation.reflection ?? "", "reflection", 5000),
      visibility: supportedVisibility(presentation.visibility),
      position,
      collectionKey: presentation.collectionKey == null ? null : boundedText(presentation.collectionKey, "collectionKey", 100),
      thumbnailRef: presentation.thumbnailRef == null ? null : boundedText(presentation.thumbnailRef, "thumbnailRef", 500),
    },
  };
}

export function presentationEditPreservesProvenance(before: PortfolioArtifactProvenance, after: PortfolioArtifactProvenance): boolean {
  return JSON.stringify(before) === JSON.stringify(after);
}

export function sourceIdentity(source: Pick<EligibleEvidenceSource, "sourceType" | "evidenceId">) {
  return `${source.sourceType}:${source.evidenceId}`;
}

export function portfolioArtifactCanBeRemoved(status: PortfolioArtifactStatus): boolean {
  return status === "ACTIVE" || status === "HIDDEN" || status === "ARCHIVED";
}

export function portfolioCannotAssertInstitutionalFact(field: string): boolean {
  return ["evidenceVerified", "assignmentComplete", "lessonComplete", "credentialIssued", "deployed", "registryApproved", "clientOpsDispatched"].includes(field);
}
