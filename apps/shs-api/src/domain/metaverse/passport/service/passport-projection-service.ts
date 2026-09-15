import { createHash } from "node:crypto";
import { query } from "../../../../db/client.js";
import type {
  CapabilityGraphEdge,
  CapabilityGraphNode,
  PassportClaim,
  PassportClaimType,
  PassportProjectionSources,
  PassportSourceAuthority,
  PassportVerificationLevel,
  PassportVisibility,
  ReliabilityFact,
  WorkPassportProjection,
} from "../model/passport-contract.js";

type Actor = {
  user_id?: string;
  id?: string;
  active_organization_id?: string;
  organization_id?: string;
  tenant_id?: string;
  permissions?: string[];
};

function actorUserId(actor: Actor) {
  return String(actor.user_id || actor.id || "").trim();
}

function actorOrgId(actor: Actor) {
  return String(actor.active_organization_id || actor.organization_id || "").trim();
}

function stableId(...parts: string[]) {
  return createHash("sha256").update(parts.join("|"), "utf8").digest("hex").slice(0, 24);
}

function iso(value: unknown, fallback = new Date().toISOString()) {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function readJson(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object") return value as Record<string, unknown>;
  try {
    return JSON.parse(String(value));
  } catch {
    return {};
  }
}

function buildClaim(input: {
  learnerUserId: string;
  organizationId: string;
  claimType: PassportClaimType;
  title: string;
  summary: string;
  sourceType: string;
  sourceRef: string;
  sourceAuthority: PassportSourceAuthority;
  status?: string;
  verificationLevel: PassportVerificationLevel;
  issuedAt?: unknown;
  completedAt?: unknown;
  expiresAt?: unknown;
  evidenceRefs?: string[];
  artifactRefs?: string[];
  skillRefs?: string[];
  careerRefs?: string[];
  programRefs?: string[];
  missionRefs?: string[];
  projectRefs?: string[];
  opportunityRefs?: string[];
  metadata?: Record<string, unknown>;
  visibility?: PassportVisibility;
}): PassportClaim {
  return {
    passportClaimId: `passport_claim_${stableId(input.organizationId, input.learnerUserId, input.sourceAuthority, input.sourceType, input.sourceRef, input.claimType)}`,
    learnerUserId: input.learnerUserId,
    organizationId: input.organizationId,
    claimType: input.claimType,
    title: input.title,
    summary: input.summary,
    sourceType: input.sourceType,
    sourceRef: input.sourceRef,
    sourceAuthority: input.sourceAuthority,
    status: input.status || "ACTIVE",
    verificationLevel: input.verificationLevel,
    issuedAt: iso(input.issuedAt),
    completedAt: input.completedAt ? iso(input.completedAt) : null,
    expiresAt: input.expiresAt ? iso(input.expiresAt) : null,
    evidenceRefs: input.evidenceRefs || [],
    artifactRefs: input.artifactRefs || [],
    skillRefs: input.skillRefs || [],
    careerRefs: input.careerRefs || [],
    programRefs: input.programRefs || [],
    missionRefs: input.missionRefs || [],
    projectRefs: input.projectRefs || [],
    opportunityRefs: input.opportunityRefs || [],
    metadata: input.metadata || {},
    visibility: input.visibility || "SELF",
    createdAt: iso(input.issuedAt),
  };
}

function notRevokedCredential(row: any) {
  if (String(row.status || "").toUpperCase() === "REVOKED") return false;
  if (row.revoked_at) return false;
  if (row.expires_at && new Date(row.expires_at) <= new Date()) return false;
  return true;
}

export function projectPassportFromSources(input: {
  learnerUserId: string;
  organizationId: string;
  view?: "SELF" | "SPONSOR" | "PUBLIC";
  sources: PassportProjectionSources;
}): WorkPassportProjection {
  const view = input.view || "SELF";
  const now = new Date().toISOString();
  const claims: PassportClaim[] = [];

  for (const row of input.sources.verifiedEvidence || []) {
    const status = String(row.status || "").toUpperCase();
    if (status === "SUPERSEDED" || status === "WITHDRAWN" || status === "REVOKED") continue;
    const evidenceId = String(row.evidence_id || row.evidenceId || row.id || "");
    if (!evidenceId) continue;
    const competencyId = row.competency_id || row.competencyId || null;
    claims.push(buildClaim({
      learnerUserId: input.learnerUserId,
      organizationId: input.organizationId,
      claimType: "VERIFIED_EVIDENCE",
      title: String(row.criterion || row.title || "Verified evidence"),
      summary: "Evidence record confirmed by the canonical Evidence authority.",
      sourceType: String(row.source_type || row.sourceType || "EVIDENCE"),
      sourceRef: evidenceId,
      sourceAuthority: "VERIFIED_EVIDENCE",
      verificationLevel: status === "REVIEWED" || row.verifier_user_id ? "VERIFIED" : "EVIDENCE_CANDIDATE",
      issuedAt: row.source_occurred_at || row.created_at,
      evidenceRefs: [evidenceId],
      skillRefs: competencyId ? [String(competencyId)] : [],
      projectRefs: row.project_id ? [String(row.project_id)] : [],
      metadata: { evidenceStatus: row.status, competencyId },
    }));
    if (competencyId && (status === "REVIEWED" || row.verifier_user_id)) {
      claims.push(buildClaim({
        learnerUserId: input.learnerUserId,
        organizationId: input.organizationId,
        claimType: "VERIFIED_SKILL",
        title: `Verified capability: ${competencyId}`,
        summary: "Capability label is derived only from reviewed evidence or verifier-backed competency evidence.",
        sourceType: "VERIFIED_EVIDENCE_COMPETENCY",
        sourceRef: evidenceId,
        sourceAuthority: "VERIFIED_EVIDENCE",
        verificationLevel: "VERIFIED",
        issuedAt: row.source_occurred_at || row.created_at,
        evidenceRefs: [evidenceId],
        skillRefs: [String(competencyId)],
        metadata: { evidenceId, verifiedSkillRule: "canonical_verified_evidence_only" },
      }));
    }
  }

  for (const row of input.sources.evidenceCandidates || []) {
    const evidenceId = String(row.evidence_id || row.evidenceId || row.id || "");
    if (!evidenceId) continue;
    claims.push(buildClaim({
      learnerUserId: input.learnerUserId,
      organizationId: input.organizationId,
      claimType: "VERIFIED_EVIDENCE",
      title: String(row.criterion || row.title || "Evidence candidate"),
      summary: "Evidence candidate is not a verified skill or credential.",
      sourceType: String(row.source_type || row.sourceType || "EVIDENCE_CANDIDATE"),
      sourceRef: evidenceId,
      sourceAuthority: "VERIFIED_EVIDENCE",
      verificationLevel: "EVIDENCE_CANDIDATE",
      issuedAt: row.source_occurred_at || row.created_at,
      evidenceRefs: [evidenceId],
      metadata: { evidenceStatus: row.status, notVerifiedSkill: true },
    }));
  }

  for (const row of input.sources.credentials || []) {
    const credentialId = String(row.credential_id || row.id || row.learner_credential_id || "");
    if (!credentialId || !notRevokedCredential(row)) continue;
    claims.push(buildClaim({
      learnerUserId: input.learnerUserId,
      organizationId: input.organizationId,
      claimType: "CREDENTIAL",
      title: String(row.name || row.credential_name || row.slug || "Credential"),
      summary: String(row.issuing_authority || row.issuingAuthority || "Credential issued by the canonical Credential authority."),
      sourceType: "LEARNER_CREDENTIAL",
      sourceRef: credentialId,
      sourceAuthority: "CREDENTIAL",
      verificationLevel: "VERIFIED",
      issuedAt: row.issued_at || row.created_at,
      expiresAt: row.expires_at,
      careerRefs: row.career_id ? [String(row.career_id)] : [],
      metadata: { verificationId: row.verification_id || null },
    }));
  }

  for (const row of input.sources.portfolioArtifacts || []) {
    const artifactId = String(row.artifact_id || row.artifactId || "");
    if (!artifactId || ["REMOVED", "ARCHIVED"].includes(String(row.status || "").toUpperCase())) continue;
    const provenance = readJson(row.provenance_json || row.provenance);
    claims.push(buildClaim({
      learnerUserId: input.learnerUserId,
      organizationId: input.organizationId,
      claimType: "PORTFOLIO_ARTIFACT",
      title: String(row.title || row.presentation?.title || "Portfolio artifact"),
      summary: String(row.summary || row.presentation?.summary || "Portfolio presentation of evidence-backed work."),
      sourceType: "PORTFOLIO_ARTIFACT",
      sourceRef: artifactId,
      sourceAuthority: "PORTFOLIO",
      verificationLevel: "SOURCE_CONFIRMED",
      issuedAt: row.created_at,
      artifactRefs: [artifactId],
      evidenceRefs: list(provenance.evidenceId),
      projectRefs: list(provenance.studioProjectId),
      visibility: row.visibility === "PUBLIC" ? "PUBLIC_PORTFOLIO" : "SELF",
      metadata: { portfolioDoesNotOwnVerification: true },
    }));
  }

  for (const row of input.sources.projects || []) {
    const projectId = String(row.project_id || row.projectId || "");
    if (!projectId) continue;
    claims.push(buildClaim({
      learnerUserId: input.learnerUserId,
      organizationId: input.organizationId,
      claimType: "PROJECT_COMPLETION",
      title: String(row.title || "Completed project"),
      summary: "Project completion or accepted work from canonical project/studio authority; not a verified skill by itself.",
      sourceType: "PROJECT",
      sourceRef: projectId,
      sourceAuthority: row.studio_destination ? "STUDIO_PROJECT" : "STUDIO_PROJECT",
      verificationLevel: "SOURCE_CONFIRMED",
      issuedAt: row.finalized_at || row.updated_at || row.created_at,
      completedAt: row.finalized_at || row.completed_at || null,
      projectRefs: [projectId],
      metadata: { projectStatus: row.status || null, notVerifiedSkill: true },
    }));
  }

  for (const row of input.sources.missions || []) {
    const missionId = String(row.mission_projection_id || row.missionProjectionId || "");
    if (!missionId) continue;
    const missionType = String(row.opportunity_type || row.assignment_type || row.missionType || "MISSION");
    claims.push(buildClaim({
      learnerUserId: input.learnerUserId,
      organizationId: input.organizationId,
      claimType: "MISSION_COMPLETION",
      title: String(row.mission_title || row.missionTitle || "Mission experience"),
      summary: `${missionType} completion is source-confirmed mission history; it is not credential or verified-skill authority.`,
      sourceType: missionType,
      sourceRef: missionId,
      sourceAuthority: "METAVERSE_MISSION",
      verificationLevel: "SOURCE_CONFIRMED",
      issuedAt: row.completed_at || row.computed_at || now,
      completedAt: row.completed_at || null,
      missionRefs: [missionId],
      programRefs: row.program_id ? [String(row.program_id)] : [],
      metadata: { missionStatus: row.mission_status || row.missionStatus || null, notVerifiedSkill: true },
    }));
  }

  for (const row of input.sources.opportunities || []) {
    const opportunityId = String(row.opportunity_id || row.opportunityId || "");
    if (!opportunityId) continue;
    const awardId = String(row.award_id || row.awardId || "");
    const completed = String(row.award_status || row.status || "").toUpperCase() === "COMPLETED";
    claims.push(buildClaim({
      learnerUserId: input.learnerUserId,
      organizationId: input.organizationId,
      claimType: "OPPORTUNITY_COMPLETION",
      title: String(row.title || row.opportunity_title || "Opportunity experience"),
      summary: completed ? "Completed student opportunity; not employment or verified skill." : "Awarded student opportunity; not employment.",
      sourceType: "STUDENT_OPPORTUNITY",
      sourceRef: awardId || opportunityId,
      sourceAuthority: "OPPORTUNITY_EXCHANGE",
      verificationLevel: completed ? "SOURCE_CONFIRMED" : "ACTIVITY_COMPLETED",
      issuedAt: row.awarded_at || row.created_at || now,
      completedAt: completed ? row.updated_at || row.completed_at || null : null,
      opportunityRefs: [opportunityId],
      projectRefs: row.project_ref ? [String(row.project_ref)] : [],
      metadata: { awardId, awardStatus: row.award_status || row.status, notEmployment: true, notVerifiedSkill: true },
      visibility: view === "SPONSOR" ? "AUTHORIZED_SPONSOR" : "SELF",
    }));
  }

  for (const row of input.sources.arcadeSignals || []) {
    const resultId = String(row.arcade_result_id || row.id || row.result_id || "");
    if (!resultId) continue;
    claims.push(buildClaim({
      learnerUserId: input.learnerUserId,
      organizationId: input.organizationId,
      claimType: "ARCADE_MASTERY_SIGNAL",
      title: String(row.title || row.activity_title || "Arcade practice signal"),
      summary: "Learning Arcade practice/mastery signal. It does not directly verify a capability.",
      sourceType: "ARCADE_RESULT",
      sourceRef: resultId,
      sourceAuthority: "LEARNING_ARCADE",
      verificationLevel: row.mastery_achieved ? "ACTIVITY_COMPLETED" : "UNVERIFIED",
      issuedAt: row.created_at,
      metadata: { masteryAchieved: Boolean(row.mastery_achieved), notVerifiedSkill: true },
    }));
  }

  for (const row of input.sources.careerProgress || []) {
    const careerId = String(row.career_id || row.careerId || "");
    if (!careerId) continue;
    claims.push(buildClaim({
      learnerUserId: input.learnerUserId,
      organizationId: input.organizationId,
      claimType: "CAREER_PROGRESS",
      title: String(row.title || row.career_title || "Career pathway progress"),
      summary: "Career pathway progress is projected from career authority and does not declare employment readiness.",
      sourceType: "CAREER_PATHWAY",
      sourceRef: careerId,
      sourceAuthority: "CAREER",
      verificationLevel: "SOURCE_CONFIRMED",
      issuedAt: row.updated_at || row.created_at || now,
      careerRefs: [careerId],
      skillRefs: list(row.related_skills || row.relatedSkills),
      projectRefs: list(row.related_projects || row.relatedProjects),
      metadata: { noJobReadyClaimInvented: true, requirementsRemaining: row.requirements_remaining || [] },
    }));
  }

  for (const row of input.sources.teamExperience || []) {
    const membershipId = String(row.studio_team_membership_id || row.membership_id || row.id || "");
    if (!membershipId) continue;
    claims.push(buildClaim({
      learnerUserId: input.learnerUserId,
      organizationId: input.organizationId,
      claimType: "TEAM_EXPERIENCE",
      title: String(row.team_name || row.name || "Team participation"),
      summary: "Source-backed team participation; contribution quality is not inferred from membership.",
      sourceType: "STUDIO_TEAM_MEMBERSHIP",
      sourceRef: membershipId,
      sourceAuthority: "STUDIO_TEAM",
      verificationLevel: "SOURCE_CONFIRMED",
      issuedAt: row.created_at || row.added_at,
      projectRefs: row.project_id ? [String(row.project_id)] : [],
      metadata: { role: row.role || null, noContributionQualityInference: true },
    }));
  }

  for (const row of input.sources.enterpriseExperience || []) {
    // MET-12 — Membership/role alone is never VERIFIED_SKILL (build brief
    // §Phase F: "Membership alone must NOT become verified skill"). This
    // is a source-confirmed participation record only; actual skill
    // verification, if any, flows through the VERIFIED_EVIDENCE loop above
    // from evidence the Opportunity Exchange or Studio project produced.
    const enterpriseRoleId = String(row.enterprise_role_id || "");
    if (!enterpriseRoleId) continue;
    claims.push(buildClaim({
      learnerUserId: input.learnerUserId,
      organizationId: input.organizationId,
      claimType: "ENTERPRISE_EXPERIENCE",
      title: String(row.enterprise_name || row.name || "Student Enterprise participation"),
      summary: "Source-backed Student Enterprise role; educational/simulated, not employment, and not verified skill by itself.",
      sourceType: "STUDENT_ENTERPRISE_ROLE",
      sourceRef: enterpriseRoleId,
      sourceAuthority: "STUDENT_ENTERPRISE",
      verificationLevel: row.lifecycle_status === "ACTIVE" ? "SOURCE_CONFIRMED" : "ACTIVITY_COMPLETED",
      issuedAt: row.granted_at,
      metadata: { enterpriseId: row.enterprise_id || null, enterpriseRole: row.enterprise_role || null, lifecycleStatus: row.lifecycle_status || null, notEmploymentNotVerifiedSkill: true },
    }));
  }

  for (const row of input.sources.marketHistory || []) {
    const orderId = String(row.order_id || row.orderId || "");
    if (!orderId || String(row.status || "").toUpperCase() !== "FULFILLED") continue;
    claims.push(buildClaim({
      learnerUserId: input.learnerUserId,
      organizationId: input.organizationId,
      claimType: "RELIABILITY_FACT",
      title: "Fulfilled student-market order",
      summary: "Market fulfillment is operational history only; SHF Credits and balances are not capability.",
      sourceType: "MARKET_ORDER",
      sourceRef: orderId,
      sourceAuthority: "MARKET",
      verificationLevel: "SOURCE_CONFIRMED",
      issuedAt: row.fulfilled_at || row.updated_at,
      metadata: { noCreditsAsCapability: true, notVerifiedSkill: true },
      visibility: "SELF",
    }));
  }

  for (const row of input.sources.programCompletions || []) {
    const programId = String(row.program_id || row.programId || "");
    if (!programId) continue;
    claims.push(buildClaim({
      learnerUserId: input.learnerUserId,
      organizationId: input.organizationId,
      claimType: "PROGRAM_COMPLETION",
      title: String(row.title || row.program_title || "Program completion"),
      summary: "Program completion is source-confirmed program history; credentials remain credential authority.",
      sourceType: "PROGRAM_COMPLETION",
      sourceRef: programId,
      sourceAuthority: "PROGRAM",
      verificationLevel: "SOURCE_CONFIRMED",
      issuedAt: row.completed_at || row.updated_at || now,
      completedAt: row.completed_at || null,
      programRefs: [programId],
      metadata: { notCredentialAuthority: true },
    }));
  }

  const filteredClaims = filterClaimsForView(claims, view);
  const reliabilityFacts = buildReliabilityFacts(input.learnerUserId, input.organizationId, filteredClaims, input.sources, view);
  const capabilityGraph = buildCapabilityGraph(input.learnerUserId, filteredClaims);
  return {
    projectionVersion: "MET-10",
    learnerUserId: input.learnerUserId,
    organizationId: input.organizationId,
    view,
    generatedAt: now,
    claims: filteredClaims,
    capabilityGraph,
    reliabilityFacts,
    boundaries: {
      creditsAreCapability: false,
      reputationIsSkill: false,
      arcadeIsSkillAuthority: false,
      missionIsSkillAuthority: false,
      opportunityAwardIsEmployment: false,
      marketIsCredentialAuthority: false,
      noGlobalRanking: true,
    },
    eligibilityProjection: {
      verifiedRequiredSkillsCount: filteredClaims.filter((claim) => claim.claimType === "VERIFIED_SKILL").length,
      relevantProjectsCount: filteredClaims.filter((claim) => claim.claimType === "PROJECT_COMPLETION" || claim.projectRefs.length > 0).length,
      beginnerEligibleWithoutReputation: true,
      safeForOpportunityExchange: true,
    },
  };
}

function filterClaimsForView(claims: PassportClaim[], view: "SELF" | "SPONSOR" | "PUBLIC") {
  if (view === "SELF") return claims;
  if (view === "SPONSOR") {
    return claims.filter((claim) => !["RELIABILITY_FACT"].includes(claim.claimType) || claim.visibility === "AUTHORIZED_SPONSOR");
  }
  return claims.filter((claim) =>
    claim.visibility === "PUBLIC_PORTFOLIO" ||
    ["CREDENTIAL", "PROJECT_COMPLETION", "PORTFOLIO_ARTIFACT"].includes(claim.claimType),
  ).map((claim) => ({ ...claim, learnerUserId: "redacted", metadata: { publicSafe: true, sourceAuthority: claim.sourceAuthority } }));
}

function buildReliabilityFacts(
  learnerUserId: string,
  organizationId: string,
  claims: PassportClaim[],
  sources: PassportProjectionSources,
  view: "SELF" | "SPONSOR" | "PUBLIC",
): ReliabilityFact[] {
  if (view === "PUBLIC") return [];
  const now = new Date().toISOString();
  const facts: ReliabilityFact[] = [];
  const completedOpportunities = (sources.opportunities || []).filter((row) => String(row.award_status || row.status || "").toUpperCase() === "COMPLETED");
  if (completedOpportunities.length) {
    facts.push({
      reliabilityFactId: `reliability_${stableId(organizationId, learnerUserId, "opportunity-follow-through")}`,
      learnerUserId,
      organizationId,
      dimension: "OPPORTUNITY_FOLLOW_THROUGH",
      label: "Opportunity follow-through",
      valueText: `${completedOpportunities.length} awarded opportunit${completedOpportunities.length === 1 ? "y" : "ies"} completed`,
      sourceAuthority: "OPPORTUNITY_EXCHANGE",
      sourceRefs: completedOpportunities.map((row) => String(row.award_id || row.awardId || row.opportunity_id || row.opportunityId)).filter(Boolean),
      visibility: view === "SPONSOR" ? "AUTHORIZED_SPONSOR" : "SELF",
      computedAt: now,
    });
  }
  const teamClaims = claims.filter((claim) => claim.claimType === "TEAM_EXPERIENCE");
  if (teamClaims.length) {
    facts.push({
      reliabilityFactId: `reliability_${stableId(organizationId, learnerUserId, "team-participation")}`,
      learnerUserId,
      organizationId,
      dimension: "TEAM_PARTICIPATION",
      label: "Team participation",
      valueText: `${teamClaims.length} source-backed team experience record${teamClaims.length === 1 ? "" : "s"}`,
      sourceAuthority: "STUDIO_TEAM",
      sourceRefs: teamClaims.map((claim) => claim.sourceRef),
      visibility: "SELF",
      computedAt: now,
    });
  }
  const fulfilledMarket = (sources.marketHistory || []).filter((row) => String(row.status || "").toUpperCase() === "FULFILLED");
  if (fulfilledMarket.length) {
    facts.push({
      reliabilityFactId: `reliability_${stableId(organizationId, learnerUserId, "market-fulfillment")}`,
      learnerUserId,
      organizationId,
      dimension: "MARKET_FULFILLMENT",
      label: "Market fulfillment",
      valueText: `${fulfilledMarket.length} fulfilled student-market order${fulfilledMarket.length === 1 ? "" : "s"}`,
      sourceAuthority: "MARKET",
      sourceRefs: fulfilledMarket.map((row) => String(row.order_id || row.orderId)).filter(Boolean),
      visibility: "SELF",
      computedAt: now,
    });
  }
  return facts;
}

function buildCapabilityGraph(learnerUserId: string, claims: PassportClaim[]) {
  const nodes = new Map<string, CapabilityGraphNode>();
  const edges: CapabilityGraphEdge[] = [];
  nodes.set(`learner:${learnerUserId}`, {
    id: `learner:${learnerUserId}`,
    type: "LEARNER",
    label: "Learner",
    sourceAuthority: "PASSPORT_PROJECTION",
    sourceRef: learnerUserId,
    verificationLevel: "PROJECTION_ONLY",
  });
  const addNode = (node: CapabilityGraphNode) => nodes.set(node.id, node);
  for (const claim of claims) {
    for (const skill of claim.skillRefs) {
      const skillNode = `skill:${skill}`;
      addNode({ id: skillNode, type: "SKILL", label: skill, sourceAuthority: claim.sourceAuthority, sourceRef: claim.sourceRef, verificationLevel: claim.verificationLevel });
      edges.push({ from: `learner:${learnerUserId}`, to: skillNode, relationship: claim.claimType === "VERIFIED_SKILL" ? "VERIFIED_BY" : "CONNECTED_TO", sourceClaimId: claim.passportClaimId, sourceAuthority: claim.sourceAuthority });
    }
    for (const evidence of claim.evidenceRefs) {
      const nodeId = `evidence:${evidence}`;
      addNode({ id: nodeId, type: "EVIDENCE", label: evidence, sourceAuthority: claim.sourceAuthority, sourceRef: evidence, verificationLevel: claim.verificationLevel });
      edges.push({ from: `learner:${learnerUserId}`, to: nodeId, relationship: "EVIDENCED_BY", sourceClaimId: claim.passportClaimId, sourceAuthority: claim.sourceAuthority });
    }
    for (const project of claim.projectRefs) {
      const nodeId = `project:${project}`;
      addNode({ id: nodeId, type: "PROJECT", label: project, sourceAuthority: claim.sourceAuthority, sourceRef: project, verificationLevel: claim.verificationLevel });
      edges.push({ from: `learner:${learnerUserId}`, to: nodeId, relationship: "APPLIED_IN", sourceClaimId: claim.passportClaimId, sourceAuthority: claim.sourceAuthority });
    }
    for (const mission of claim.missionRefs) {
      const nodeId = `mission:${mission}`;
      addNode({ id: nodeId, type: "MISSION", label: mission, sourceAuthority: claim.sourceAuthority, sourceRef: mission, verificationLevel: claim.verificationLevel });
      edges.push({ from: `learner:${learnerUserId}`, to: nodeId, relationship: "COMPLETED_IN", sourceClaimId: claim.passportClaimId, sourceAuthority: claim.sourceAuthority });
    }
    for (const career of claim.careerRefs) {
      const nodeId = `career:${career}`;
      addNode({ id: nodeId, type: "CAREER_PATHWAY", label: career, sourceAuthority: claim.sourceAuthority, sourceRef: career, verificationLevel: claim.verificationLevel });
      edges.push({ from: `learner:${learnerUserId}`, to: nodeId, relationship: "PROGRESSED_TOWARD", sourceClaimId: claim.passportClaimId, sourceAuthority: claim.sourceAuthority });
    }
    for (const opportunity of claim.opportunityRefs) {
      const nodeId = `opportunity:${opportunity}`;
      addNode({ id: nodeId, type: "OPPORTUNITY", label: opportunity, sourceAuthority: claim.sourceAuthority, sourceRef: opportunity, verificationLevel: claim.verificationLevel });
      edges.push({ from: `learner:${learnerUserId}`, to: nodeId, relationship: "COMPLETED_IN", sourceClaimId: claim.passportClaimId, sourceAuthority: claim.sourceAuthority });
    }
    for (const program of claim.programRefs) {
      const nodeId = `program:${program}`;
      addNode({ id: nodeId, type: "PROGRAM", label: program, sourceAuthority: claim.sourceAuthority, sourceRef: program, verificationLevel: claim.verificationLevel });
      edges.push({ from: `learner:${learnerUserId}`, to: nodeId, relationship: "CONNECTED_TO", sourceClaimId: claim.passportClaimId, sourceAuthority: claim.sourceAuthority });
    }
  }
  return {
    nodes: Array.from(nodes.values()),
    edges,
    accessibleTree: claims.map((claim) => ({
      label: claim.title,
      details: [
        `${claim.verificationLevel.replace(/_/g, " ")} from ${claim.sourceAuthority.replace(/_/g, " ")}`,
        `Source ${claim.sourceType}: ${claim.sourceRef}`,
      ],
      sourceClaimId: claim.passportClaimId,
    })),
  };
}

export async function loadPassportSources(actor: Actor, learnerUserId: string): Promise<PassportProjectionSources> {
  const organizationId = actorOrgId(actor);
  const tenantId = `tenant:${organizationId}`;
  const [verifiedEvidence, evidenceCandidates, credentials, portfolioArtifacts, projects, opportunities, arcadeSignals, teamExperience, marketHistory, enterpriseExperience] = await Promise.all([
    query("SELECT * FROM prepare_prove_evidence WHERE organization_id=$1 AND user_id=$2 AND status='REVIEWED' ORDER BY source_occurred_at DESC NULLS LAST, created_at DESC LIMIT 100", [organizationId, learnerUserId]).then((r) => r.rows).catch(() => []),
    query("SELECT * FROM prepare_prove_evidence WHERE organization_id=$1 AND user_id=$2 AND status='REVIEWABLE' ORDER BY created_at DESC LIMIT 50", [organizationId, learnerUserId]).then((r) => r.rows).catch(() => []),
    query(`SELECT lc.*, cd.name, cd.slug, cd.issuing_authority, cd.career_id
      FROM learner_credentials lc JOIN credential_definitions cd ON cd.credential_definition_id=lc.credential_definition_id
      WHERE lc.organization_id=$1 AND lc.learner_user_id=$2 ORDER BY lc.issued_at DESC LIMIT 50`, [organizationId, learnerUserId]).then((r) => r.rows).catch(() => []),
    query("SELECT * FROM portfolio_artifacts WHERE organization_id=$1 AND learner_user_id=$2 AND status IN ('ACTIVE','HIDDEN') ORDER BY created_at DESC LIMIT 50", [organizationId, learnerUserId]).then((r) => r.rows).catch(() => []),
    query("SELECT * FROM projects WHERE organization_id=$1 AND studio_learner_id=$2 ORDER BY updated_at DESC LIMIT 50", [organizationId, learnerUserId]).then((r) => r.rows).catch(() => []),
    query(`SELECT a.*, o.title, o.opportunity_id, o.opportunity_type, o.source_type, o.program_id, o.career_id
      FROM student_opportunity_awards a JOIN student_opportunities o ON o.opportunity_id=a.opportunity_id AND o.organization_id=a.organization_id
      WHERE a.organization_id=$1 AND a.student_id=$2 ORDER BY a.awarded_at DESC LIMIT 50`, [organizationId, learnerUserId]).then((r) => r.rows).catch(() => []),
    query(`SELECT ar.*, aa.title
      FROM arcade_results ar LEFT JOIN arcade_activities aa ON aa.arcade_activity_id=ar.arcade_activity_id
      WHERE ar.organization_id=$1 AND ar.learner_user_id=$2 ORDER BY ar.created_at DESC LIMIT 50`, [organizationId, learnerUserId]).then((r) => r.rows).catch(() => []),
    query(`SELECT m.*, t.name AS team_name
      FROM studio_team_members m JOIN studio_teams t ON t.studio_team_id=m.studio_team_id AND t.organization_id=m.organization_id
      WHERE m.organization_id=$1 AND m.tenant_id=$2 AND m.user_id=$3 ORDER BY m.created_at DESC LIMIT 50`, [organizationId, tenantId, learnerUserId]).then((r) => r.rows).catch(() => []),
    query("SELECT * FROM market_orders WHERE organization_id=$1 AND (buyer_user_id=$2 OR seller_ref=$2) ORDER BY updated_at DESC LIMIT 50", [organizationId, learnerUserId]).then((r) => r.rows).catch(() => []),
    query(`SELECT r.*, e.name AS enterprise_name, e.lifecycle_status
      FROM student_enterprise_roles r JOIN student_enterprises e ON e.enterprise_id=r.enterprise_id AND e.organization_id=r.organization_id AND e.tenant_id=r.tenant_id
      WHERE r.organization_id=$1 AND r.tenant_id=$2 AND r.user_id=$3 AND r.status='ACTIVE' ORDER BY r.granted_at DESC LIMIT 50`, [organizationId, tenantId, learnerUserId]).then((r) => r.rows).catch(() => []),
  ]);
  return {
    verifiedEvidence,
    evidenceCandidates,
    credentials,
    portfolioArtifacts,
    projects,
    opportunities,
    arcadeSignals,
    teamExperience,
    marketHistory,
    enterpriseExperience,
    missions: [],
    careerProgress: [],
    programCompletions: [],
  };
}

export async function getMyPassport(actor: Actor, view: "SELF" | "SPONSOR" | "PUBLIC" = "SELF") {
  const learnerUserId = actorUserId(actor);
  const organizationId = actorOrgId(actor);
  const sources = await loadPassportSources(actor, learnerUserId);
  return projectPassportFromSources({ learnerUserId, organizationId, view, sources });
}

export async function getSponsorSafePassport(actor: Actor, learnerUserId: string) {
  const safeLearnerId = String(learnerUserId || "").trim();
  if (!safeLearnerId) throw new Error("learner_id_required");
  const organizationId = actorOrgId(actor);
  const sources = await loadPassportSources(actor, safeLearnerId);
  return projectPassportFromSources({ learnerUserId: safeLearnerId, organizationId, view: "SPONSOR", sources });
}

export async function getOpportunityEligibilityProjection(actor: Actor, learnerUserId: string) {
  const passport = await getSponsorSafePassport(actor, learnerUserId);
  return {
    learnerUserId,
    organizationId: actorOrgId(actor),
    safeForOpportunityExchange: true,
    verifiedRequiredSkillsCount: passport.eligibilityProjection.verifiedRequiredSkillsCount,
    relevantProjectsCount: passport.eligibilityProjection.relevantProjectsCount,
    beginnerEligibleWithoutReputation: true,
    noCircularDependency: true,
  };
}
