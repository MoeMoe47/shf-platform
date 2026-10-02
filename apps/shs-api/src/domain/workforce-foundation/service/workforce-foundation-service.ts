// Phase 6.5 — Workforce / Fundability Foundation service (internal; no public routes).
//
// Programs are configuration and contracts on shared infrastructure, not course-specific software platforms.
// Funding relationships describe potential alignment; they do not establish eligibility or guarantee funding.
// Every reference is resolved read-only through its owning authority; nothing is copied, written or inferred:
//   operational Program → programs        Curriculum → curriculum-catalog     Arcade → Phase 6 Fabric
//   Missions → published Mission catalog   MOL → MOL System Registry           Careers → careers
//   competencies → competency_definitions credentials → credential_definitions organizations → identity
//   VERIFIED funding → funding_grants / gpa_funding_references                  reporting → report profiles
import { query } from "../../../db/client.js";
import { ArcadeRepo } from "../../arcade/repo/arcade-repo.js";
import { ArcadeIntegrationService } from "../../arcade-integration/service/arcade-integration-service.js";
import { CareerRepo } from "../../careers/repo/career-repo.js";
import { CredentialDefinitionRepo } from "../../credentials/repo/credential-definition-repo.js";
import { CurriculumCatalogRepo } from "../../curriculum-catalog/repo/curriculum-catalog-repo.js";
import { FundingGrantRepo } from "../../funding-grants/repo/funding-grant-repo.js";
import { FundingLineageRepo } from "../../government-assurance/repo/funding-lineage-repo.js";
import { PersistedPublishedMissionResolver } from "../../mission-content/catalog/published-mission-catalog.js";
import { ProgramRepo } from "../../programs/repo/program-repo.js";
import { programReportProfileRegistry } from "../../reporting/program-report-profile-registry.js";
import { WORKFORCE_CAPABILITIES, type ProgramLifecycle, type ProgramPackage } from "../model/workforce-foundation.js";
import {
  evaluateFundabilityGate, evaluateIntegrationReadiness, evaluateLifecycleTransition, evaluateProgramLifecycle, fundingLanes,
  type FundabilityComponent, type ProgramResolutionFacts,
} from "../model/readiness-and-fundability.js";
import { validateProgramPackageStructured } from "../model/workforce-foundation.js";
import { buildWorkforceRegistry, type WorkforceRegistry } from "../registry/workforce-program-registry.js";
import { canonicalSensoryRegistry, resolveSensoryReference, type SensoryRegistry } from "../sensory-bridge.js";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isWorkforceDestinationId, workforceMolSystem } from "../workforce-mol-bridge.js";

// Repository root: same relative depth from src/ and dist/. Governance DOCUMENT refs are fixed docs/*.md paths
// validated by the package contract (no user input, no scanning).
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../../..");

export const WORKFORCE_FOUNDATION_ERRORS = Object.freeze({ PROGRAM_NOT_FOUND: 404, TENANT_SCOPE_MISMATCH: 403, INVALID_REQUEST: 400 } as const);

export class WorkforceFoundationError extends Error {
  readonly statusCode: number;
  constructor(readonly code: keyof typeof WORKFORCE_FOUNDATION_ERRORS, message: string) {
    super(message);
    this.statusCode = WORKFORCE_FOUNDATION_ERRORS[code];
  }
}

export interface WorkforceActor { user_id: string; organization_id: string }

export interface WorkforceFoundationDependencies {
  registry?: () => WorkforceRegistry;
  programs?: { getProgramById(programId: string, scope: any): Promise<any | null> };
  curriculum?: { findCourse(organizationId: string, courseId: string): Promise<any | null>; findCourseByStableKey(organizationId: string, stableKey: string): Promise<any | null> };
  arcade?: { resolve(actor: any, experienceId: unknown): Promise<{ experienceId: string; productType: string; capabilities: string[]; arcadeActivityId: string | null }> };
  arcadeActivities?: { getActivityById(activityId: string): Promise<any | null> };
  missions?: { resolvePublishedMission(identity: { missionId: string; version: number }, scope: { organizationId: string; tenantId: string }): Promise<any | null> };
  careers?: { getById(careerId: string): Promise<any | null> };
  competencies?: { getById(competencyId: string): Promise<any | null> };
  credentials?: { getById(id: string): Promise<any | null> };
  organizations?: { exists(organizationId: string): Promise<boolean> };
  fundingAwards?: { grantExists(grantId: string, organizationId: string): Promise<boolean>; assuranceReferenceExists(referenceId: string, scope: { organizationId: string; tenantId: string }): Promise<boolean> };
  reportProfiles?: () => Array<{ profileKey: string; status: string }>;
  sensory?: () => SensoryRegistry;
  relationships?: { activeLink(kind: "SERVICE_AGREEMENT" | "ORGANIZATION_RELATIONSHIP", id: string, organizationA: string, organizationB: string): Promise<boolean> };
  entitlements?: { hasActive(organizationId: string, serviceKey: string): Promise<boolean> };
  documents?: { exists(repoPath: string): boolean };
}

type Section<T> = { status: "AVAILABLE"; items: T[] } | { status: "UNAVAILABLE"; items: [] };

// Optional authority reads degrade to UNAVAILABLE; unknown is never reported as resolved or as absent.
async function section<T>(work: () => Promise<T[]>): Promise<Section<T>> {
  try {
    return { status: "AVAILABLE", items: await work() };
  } catch {
    return { status: "UNAVAILABLE", items: [] };
  }
}

const resolved = (value: Section<{ resolved: boolean }>) => value.status === "AVAILABLE" && value.items.every((item) => item.resolved);

export class WorkforceFoundationService {
  private readonly registry: () => WorkforceRegistry;
  private readonly deps: Required<Omit<WorkforceFoundationDependencies, "registry">>;

  constructor(dependencies: WorkforceFoundationDependencies = {}) {
    this.registry = dependencies.registry ?? (() => buildWorkforceRegistry());
    const grants = new FundingGrantRepo();
    const lineage = new FundingLineageRepo();
    const credentialRepo = new CredentialDefinitionRepo();
    this.deps = {
      programs: dependencies.programs ?? new ProgramRepo(),
      curriculum: dependencies.curriculum ?? new CurriculumCatalogRepo(),
      arcade: dependencies.arcade ?? new ArcadeIntegrationService(),
      arcadeActivities: dependencies.arcadeActivities ?? new ArcadeRepo(),
      missions: dependencies.missions ?? new PersistedPublishedMissionResolver(),
      careers: dependencies.careers ?? new CareerRepo(),
      competencies: dependencies.competencies ?? {
        getById: async (id) => (await query("SELECT competency_id, slug, title, status FROM competency_definitions WHERE competency_id=$1", [id])).rows[0] ?? null,
      },
      credentials: dependencies.credentials ?? { getById: (id) => credentialRepo.getById(id) },
      organizations: dependencies.organizations ?? { exists: (id) => grants.organizationExists(id) },
      fundingAwards: dependencies.fundingAwards ?? {
        grantExists: async (grantId, organizationId) => Boolean(await grants.getGrant(grantId, { organization_id: organizationId })),
        assuranceReferenceExists: async (referenceId, scope) => (await lineage.listReferences(scope)).some((row: any) => row.funding_reference_id === referenceId),
      },
      reportProfiles: dependencies.reportProfiles ?? (() => programReportProfileRegistry.definitions()),
      sensory: dependencies.sensory ?? (() => canonicalSensoryRegistry()),
      // Existing authorities only: service agreements and organization relationships (no partner database).
      relationships: dependencies.relationships ?? {
        activeLink: async (kind, id, a, b) => Boolean((await query(kind === "SERVICE_AGREEMENT"
          ? `SELECT 1 FROM service_agreements WHERE agreement_id=$1 AND status='ACTIVE' AND ((provider_organization_id=$2 AND consumer_organization_id=$3) OR (provider_organization_id=$3 AND consumer_organization_id=$2))`
          : `SELECT 1 FROM organization_relationships WHERE relationship_id=$1 AND status='ACTIVE' AND ((source_organization_id=$2 AND target_organization_id=$3) OR (source_organization_id=$3 AND target_organization_id=$2))`,
        [id, a, b])).rows[0]),
      },
      entitlements: dependencies.entitlements ?? {
        hasActive: async (organizationId, serviceKey) => Boolean((await query(
          `SELECT 1 FROM organization_service_entitlements e JOIN service_catalog c ON c.service_id=e.service_id
           WHERE e.organization_id=$1 AND c.service_key=$2 AND e.status='ACTIVE' AND (e.effective_until IS NULL OR e.effective_until > NOW())`,
          [organizationId, serviceKey])).rows[0]),
      },
      documents: dependencies.documents ?? { exists: (repoPath) => existsSync(path.join(REPO_ROOT, repoPath)) },
    };
  }

  private scope(actor: WorkforceActor) {
    const organizationId = String(actor?.organization_id ?? "").trim();
    if (!organizationId || !actor?.user_id) throw new WorkforceFoundationError("TENANT_SCOPE_MISMATCH", "Actor organization/user is required.");
    return { organizationId, tenantId: `tenant:${organizationId}` };
  }

  // A package is visible only to its owning organization; other tenants cannot even learn it exists.
  private packageFor(actor: WorkforceActor, programId: unknown) {
    const scope = this.scope(actor);
    const registry = this.registry();
    const pkg = registry.packages.find((item) => item.program.programId === String(programId ?? ""));
    if (!pkg || pkg.program.owningOrganizationId !== scope.organizationId) throw new WorkforceFoundationError("PROGRAM_NOT_FOUND", "Program package was not found.");
    return { pkg, scope, registry };
  }

  async resolveProgram(actor: WorkforceActor, programId: unknown) {
    const { pkg, scope, registry } = this.packageFor(actor, programId);
    const d = this.deps;
    const operational = pkg.program.operationalProgramId
      ? await section(async () => {
        const row = await d.programs.getProgramById(pkg.program.operationalProgramId!, { organization_id: scope.organizationId });
        return [row ? { programId: row.program_id, name: row.name, status: row.status, resolved: true } : { programId: pkg.program.operationalProgramId!, resolved: false }];
      })
      : { status: "AVAILABLE" as const, items: [] };
    const curriculum = await section(() => Promise.all(pkg.curriculumRefs.map(async (ref) => {
      const byKey = "courseStableKey" in ref;
      const row = byKey ? await d.curriculum.findCourseByStableKey(scope.organizationId, ref.courseStableKey) : await d.curriculum.findCourse(scope.organizationId, ref.courseId);
      const identity = byKey ? { courseStableKey: ref.courseStableKey } : { courseId: ref.courseId };
      // Identifier, title and status only: course content stays with Curriculum.
      return row ? { ...identity, courseId: row.courseId ?? row.course_id, title: row.title, status: row.status, resolved: true } : { ...identity, resolved: false };
    })));
    const arcade = await section(() => Promise.all(pkg.arcadeExperienceRefs.map(async ({ experienceId }) => {
      try {
        // Through the Phase 6 Fabric; the experience counts only if its canonical activity row really exists.
        const described = await d.arcade.resolve(actor, experienceId);
        const activity = described.arcadeActivityId ? await d.arcadeActivities.getActivityById(described.arcadeActivityId) : null;
        return {
          experienceId, productType: described.productType, capabilities: described.capabilities, arcadeActivityId: described.arcadeActivityId,
          activityExists: Boolean(activity), resolved: Boolean(activity),
        };
      } catch (error: any) {
        if (error?.code === "ACTIVITY_NOT_FOUND") return { experienceId, resolved: false };
        throw error;
      }
    })));
    const missions = await section(() => Promise.all(pkg.missionRefs.map(async ({ missionId, missionVersion, roleRequirements, worldCapabilities }) => {
      // Exact published version in this organization, through the canonical Mission catalog.
      const definition = await d.missions.resolvePublishedMission({ missionId, version: missionVersion }, scope);
      if (!definition) return { missionId, missionVersion, published: false, resolved: false };
      if (!roleRequirements && !worldCapabilities) return { missionId, missionVersion, title: definition.title, published: true, resolved: true };
      // Role and world-capability requirements are checked against the published definition itself.
      const roles = new Set((definition.multiplayer?.roles ?? []).map((role: any) => role.roleId));
      const declared = new Set([...(definition.metaverseContext?.requiredCapabilities ?? []), ...(definition.metaverseContext?.optionalCapabilities ?? [])]);
      const requirementIssues = [
        ...(roleRequirements ?? []).filter((role) => !roles.has(role)).map((role) => `MISSION_ROLE_NOT_DECLARED:${role}`),
        ...(worldCapabilities ?? []).filter((cap) => !declared.has(cap)).map((cap) => `WORLD_CAPABILITY_NOT_DECLARED:${cap}`),
      ];
      return { missionId, missionVersion, title: definition.title, published: true, resolved: requirementIssues.length === 0, requirementIssues };
    })));
    const metaverse = pkg.metaverseRefs.map(({ molSystemId }) => ({ molSystemId, system: workforceMolSystem(molSystemId) }));
    // Canonical destinations by id only; no geometry, routes or world state are read or copied.
    const destinations = pkg.destinationRefs.map(({ destinationId }) => ({ destinationId, resolved: isWorkforceDestinationId(destinationId) }));
    const governance = await section(() => Promise.all(pkg.governanceRefs.map(async (ref) => ({
      ...ref,
      resolved: ref.refType === "DOCUMENT" ? d.documents.exists(ref.ref) : await d.entitlements.hasActive(scope.organizationId, ref.ref),
    }))));
    const careers = await section(() => Promise.all(pkg.careerRefs.map(async ({ careerId }) => {
      const row = await d.careers.getById(careerId);
      return row ? { careerId, title: row.title, status: row.status, resolved: true, jobEligibilityInferred: false as const } : { careerId, resolved: false, jobEligibilityInferred: false as const };
    })));
    const competencies = await section(() => Promise.all(pkg.competencyRefs.map(async ({ competencyId }) => {
      const row = await d.competencies.getById(competencyId);
      return row ? { competencyId, title: row.title, status: row.status, resolved: true } : { competencyId, resolved: false };
    })));
    const partners = await section(() => Promise.all(pkg.partnerRefs.map(async (ref) => {
      const resolvedOrg = await d.organizations.exists(ref.organizationId);
      // CONFIRMED only counts when an ACTIVE agreement/relationship really links the two organizations.
      const relationshipResolved = ref.status === "CONFIRMED" && ref.relationshipRef
        ? await d.relationships.activeLink(ref.relationshipRef.kind, ref.relationshipRef.id, scope.organizationId, ref.organizationId)
        : null;
      return {
        organizationId: ref.organizationId, role: ref.role, status: ref.status, resolved: resolvedOrg,
        ...(ref.status === "CONFIRMED" ? { relationshipResolved, confirmed: resolvedOrg && relationshipResolved === true } : {}),
        impliesEmployment: false as const, impliesHiring: false as const,
      };
    })));
    const reportProfiles = await section(async () => {
      const known = new Set(d.reportProfiles().filter((profile) => profile.status === "ACTIVE").map((profile) => profile.profileKey));
      return pkg.reportingRequirements.map((item) => ({
        ...item,
        resolved: item.reportProfileKey === null || known.has(item.reportProfileKey),
        // Operational metrics are observation; verified institutional truth comes only from the Truth Spine.
        truthAuthority: item.kind === "VERIFIED_INSTITUTIONAL_TRUTH" ? "truth-spine" as const : null,
        verifiedByThisRegistry: false as const,
      }));
    });
    // Sensory profiles are Experience Layer references: resolved by id only, never copied or owned here.
    const sensoryRegistry = d.sensory();
    const refs = pkg.sensoryRefs;
    const sensory = refs ? [
      resolveSensoryReference(sensoryRegistry, "SOUND_PROFILE", refs.soundProfileRef),
      resolveSensoryReference(sensoryRegistry, "CELEBRATION_PROFILE", refs.celebrationProfileRef),
      resolveSensoryReference(sensoryRegistry, "ENVIRONMENT_AUDIO_PROFILE", refs.environmentAudioProfileRef),
      resolveSensoryReference(sensoryRegistry, "PRESENTATION_POLICY", refs.sensoryPolicyRef),
    ].filter((item): item is { kind: string; id: string; resolved: boolean } => item !== null) : [];
    const facts: ProgramResolutionFacts = {
      curriculumResolved: resolved(curriculum), arcadeResolved: resolved(arcade), missionsResolved: resolved(missions), careersResolved: resolved(careers),
      molSystems: Object.fromEntries([...pkg.metaverseRefs.map((ref) => ref.molSystemId), ...pkg.capabilityRefs.flatMap((cap) => cap.molSystemIds ?? [])]
        .map((id) => [id, workforceMolSystem(id)])),
      fundingSourceTypes: Object.fromEntries(pkg.fundingRefs.map((ref) => [ref.fundingSourceId, registry.fundingSources.find((source) => source.fundingSourceId === ref.fundingSourceId)?.sourceType ?? null])),
    };
    return {
      schemaVersion: pkg.schemaVersion,
      program: { ...pkg.program },
      operationalProgram: operational,
      curriculum, arcade, missions, metaverse, destinations, governance, careers, competencies, partners, reportProfiles,
      evidenceRequirements: pkg.evidenceRequirements.map((item) => ({ ...item, authority: "verified-evidence" as const, createsEvidence: false as const })),
      accessibilityRequirements: [...pkg.accessibilityRequirements],
      sensory: { authority: "experience-layer" as const, references: sensory, ownedByProgram: false as const },
      facts,
    };
  }

  async describeProgramReadiness(actor: WorkforceActor, programId: unknown) {
    const { pkg } = this.packageFor(actor, programId);
    const resolution = await this.resolveProgram(actor, programId);
    const readiness = evaluateIntegrationReadiness(pkg, resolution.facts);
    return { programId: pkg.program.programId, lifecycle: pkg.program.lifecycle, ...readiness };
  }

  async evaluateLifecycle(actor: WorkforceActor, programId: unknown, to: ProgramLifecycle) {
    const { pkg } = this.packageFor(actor, programId);
    const readiness = await this.describeProgramReadiness(actor, programId);
    return { programId: pkg.program.programId, from: pkg.program.lifecycle, to, ...evaluateLifecycleTransition(pkg.program.lifecycle, to, readiness), readinessStatus: readiness.status };
  }

  async evaluateFundability(actor: WorkforceActor, programId: unknown, component: FundabilityComponent) {
    const { pkg } = this.packageFor(actor, programId);
    const resolution = await this.resolveProgram(actor, programId);
    const readiness = evaluateIntegrationReadiness(pkg, resolution.facts);
    const lanes = fundingLanes(pkg, resolution.facts);
    const gate = evaluateFundabilityGate(component, { fundingLaneCount: lanes.length, blockingDependencyCount: readiness.blockingDependencies.length, readinessStatus: readiness.status });
    return { programId: pkg.program.programId, componentId: component.componentId, bucket: component.bucket, fundingLanes: lanes, ...gate };
  }

  async resolveCapabilities(actor: WorkforceActor, programId: unknown) {
    const { pkg } = this.packageFor(actor, programId);
    const resolution = await this.resolveProgram(actor, programId);
    const issues = evaluateIntegrationReadiness(pkg, resolution.facts).maturityIssues;
    return pkg.capabilityRefs.map((declaration) => ({
      capability: declaration.capability, providedBy: WORKFORCE_CAPABILITIES[declaration.capability], required: declaration.required,
      maturity: declaration.maturity, fundingBucket: declaration.fundingBucket,
      molSystems: (declaration.molSystemIds ?? []).map((id) => resolution.facts.molSystems[id] ? { systemId: id, ...resolution.facts.molSystems[id]! } : { systemId: id, unresolved: true }),
      issues: issues.filter((issue) => issue.capability === declaration.capability).map((issue) => issue.reason),
    }));
  }

  resolveDependencies(actor: WorkforceActor, programId: unknown) {
    const { pkg } = this.packageFor(actor, programId);
    return pkg.dependencyRefs.map((dep) => ({
      ...dep,
      blocking: dep.required && dep.status !== "AVAILABLE",
      degradesReadiness: !dep.required && dep.status !== "AVAILABLE",
    }));
  }

  // Who owns the truth, who may read/request/verify/issue, and who may not control. Credential issuance is
  // never inferred from owning or operating the Program.
  async describeAuthority(actor: WorkforceActor, programId: unknown) {
    const { pkg } = this.packageFor(actor, programId);
    const declaredIssuers = await Promise.all(pkg.authorityRefs.filter((ref) => ref.levels.includes("ISSUE")).map(async (ref) => {
      const basis = ref.issuanceBasis ?? null;
      // An internal issuance claim holds only if its basis is an existing INTERNAL credential definition.
      let basisResolved: boolean | null = null;
      if (basis?.type === "INTERNAL_CREDENTIAL_DEFINITION") {
        try {
          basisResolved = (await this.deps.credentials.getById(basis.reference))?.credentialType === "INTERNAL";
        } catch {
          basisResolved = null;
        }
      }
      return { domain: ref.domain, owner: ref.owner, external: ref.external, basis, basisResolved };
    }));
    const credentialAuthorities = await section(() => Promise.all(pkg.credentialAuthorityRefs.map(async (ref) => {
      const definition = ref.credentialDefinitionId ? await this.deps.credentials.getById(ref.credentialDefinitionId) : null;
      return {
        authorityType: ref.authorityType, name: ref.name, status: ref.status,
        credentialDefinition: definition ? { id: definition.id, credentialType: definition.credentialType, issuingAuthority: definition.issuingAuthority } : null,
        resolved: ref.credentialDefinitionId ? Boolean(definition) : true,
      };
    })));
    return {
      programId: pkg.program.programId,
      authorityOwner: pkg.program.authorityOwner,
      owningOrganizationId: pkg.program.owningOrganizationId,
      authorities: pkg.authorityRefs.map((ref) => ({ ...ref, levels: [...ref.levels] })),
      credentialIssuers: declaredIssuers,
      credentialIssuerStatus: declaredIssuers.length ? "DECLARED" as const : "NOT_DECLARED" as const,
      owningOrganizationIsIssuer: declaredIssuers.some((issuer) => !issuer.external && issuer.basis?.type === "INTERNAL_CREDENTIAL_DEFINITION" && issuer.basisResolved === true),
      credentialAuthorities,
    };
  }

  async listFundingRelationships(actor: WorkforceActor, programId: unknown) {
    const { pkg, scope, registry } = this.packageFor(actor, programId);
    return Promise.all(pkg.fundingRefs.map(async (ref) => {
      const source = registry.fundingSources.find((item) => item.fundingSourceId === ref.fundingSourceId) ?? null;
      let verificationResolved: boolean | null = null;
      if (ref.alignment === "VERIFIED" && ref.verification) {
        try {
          verificationResolved = ref.verification.source === "FUNDING_GRANT"
            ? await this.deps.fundingAwards.grantExists(ref.verification.recordId, scope.organizationId)
            : await this.deps.fundingAwards.assuranceReferenceExists(ref.verification.recordId, scope);
        } catch {
          verificationResolved = null;
        }
      }
      return {
        fundingSourceId: ref.fundingSourceId, sourceType: source?.sourceType ?? null, sourceStatus: source?.status ?? null,
        // The declared status is preserved exactly; a VERIFIED claim whose record does not resolve is reported, not upgraded or erased.
        alignment: ref.alignment, verification: ref.verification ?? null, verificationResolved,
        capabilityRefs: [...ref.capabilityRefs],
        eligibilityEstablished: false as const, fundingGuaranteed: false as const,
      };
    }));
  }

  // BOS read contract: program readiness, fundability, capability maturity, dependency risk, partner readiness and
  // authority clarity, composed only from this service's existing read methods. Read-only; BOS gets no commands.
  async bosProgramProjection(actor: WorkforceActor, programId: unknown, component?: FundabilityComponent) {
    const { pkg } = this.packageFor(actor, programId);
    const readiness = await this.describeProgramReadiness(actor, programId);
    const assessment = component ?? this.assessmentFor(pkg.program.programId)?.component;
    if (!assessment) throw new WorkforceFoundationError("INVALID_REQUEST", "No fundability assessment is declared for this program.");
    const fundability = await this.evaluateFundability(actor, programId, assessment);
    const capabilities = await this.resolveCapabilities(actor, programId);
    const dependencies = this.resolveDependencies(actor, programId);
    const authority = await this.describeAuthority(actor, programId);
    return {
      readOnly: true as const, controls: [] as const,
      programId: pkg.program.programId, lifecycle: pkg.program.lifecycle,
      readiness: { status: readiness.status, gaps: readiness.gaps, maturityIssues: readiness.maturityIssues.map((issue) => issue.reason) },
      fundability: { decision: fundability.decision, reasons: fundability.reasons, fundingLanes: fundability.fundingLanes, eligibilityEstablished: false as const },
      capabilityMaturity: capabilities.map((cap) => ({ capability: cap.capability, maturity: cap.maturity, required: cap.required, issues: cap.issues })),
      dependencyRisk: {
        blocking: dependencies.filter((dep) => dep.blocking).map((dep) => dep.dependencyId),
        degraded: dependencies.filter((dep) => dep.degradesReadiness).map((dep) => dep.dependencyId),
      },
      partnerReadiness: {
        declared: pkg.partnerRefs.length,
        confirmed: pkg.partnerRefs.filter((ref) => ref.status === "CONFIRMED").length,
        status: pkg.partnerRefs.some((ref) => ref.status === "CONFIRMED") ? "PARTIAL" as const : pkg.partnerRefs.length ? "DECLARED_ONLY" as const : "NONE" as const,
      },
      authorityClarity: { authorityOwner: authority.authorityOwner, credentialIssuerStatus: authority.credentialIssuerStatus, owningOrganizationIsIssuer: authority.owningOrganizationIsIssuer },
    };
  }

  private assessmentFor(programId: string) {
    return this.registry().modules.find((module) => module.package.program.programId === programId)?.fundabilityAssessment ?? null;
  }

  // ---------------------------------------------------------------- Phase 8 — generic integration pipeline

  // Read-only resolution of every section against its canonical authority. No learner data.
  async resolveProgramIntegration(actor: WorkforceActor, programId: unknown) {
    const { pkg } = this.packageFor(actor, programId);
    const resolution = await this.resolveProgram(actor, programId);
    const readiness = evaluateIntegrationReadiness(pkg, resolution.facts);
    const authority = await this.describeAuthority(actor, programId);
    const funding = await this.listFundingRelationships(actor, programId);
    const confirmedPartners = resolution.partners.items.filter((item: any) => item.confirmed === true).length;
    const internalIssuerUnresolved = authority.credentialIssuers.some((issuer) => !issuer.external && issuer.basis?.type === "INTERNAL_CREDENTIAL_DEFINITION" && issuer.basisResolved !== true);
    const lifecycle = evaluateProgramLifecycle(pkg, readiness, { confirmedPartners, internalIssuerUnresolved });
    const assessment = this.assessmentFor(pkg.program.programId);
    const lanes = fundingLanes(pkg, resolution.facts);
    const fundability = assessment
      ? { assessed: true as const, ...evaluateFundabilityGate(assessment.component, { fundingLaneCount: lanes.length, blockingDependencyCount: readiness.blockingDependencies.length, readinessStatus: readiness.status }), fundingLanes: lanes }
      : { assessed: false as const, decision: null, reasons: ["NOT_ASSESSED"], fundingLanes: lanes, eligibilityEstablished: false as const, fundingGuaranteed: false as const };
    return { pkg, resolution, readiness, authority, funding, lifecycle, fundability, confirmedPartners, internalIssuerUnresolved };
  }

  // Deterministic validation report. Each section: status (RESOLVED | UNRESOLVED | UNAVAILABLE | BLOCKED | DEGRADED),
  // issues, warnings, resolvedRefs, unresolvedRefs. No timestamps, no learner data.
  async validateProgramIntegration(actor: WorkforceActor, programId: unknown) {
    const { pkg, resolution, readiness, authority, funding, lifecycle, fundability, confirmedPartners, internalIssuerUnresolved } = await this.resolveProgramIntegration(actor, programId);
    type Status = "RESOLVED" | "UNRESOLVED" | "UNAVAILABLE" | "BLOCKED" | "DEGRADED";
    const sectionOf = (status: Status, issues: string[] = [], warnings: string[] = [], resolvedRefs: string[] = [], unresolvedRefs: string[] = []) =>
      ({ status, issues: [...issues].sort(), warnings: [...warnings].sort(), resolvedRefs: [...resolvedRefs].sort(), unresolvedRefs: [...unresolvedRefs].sort() });
    const split = (items: any[], key: (item: any) => string) => [items.filter((item) => item.resolved).map(key), items.filter((item) => !item.resolved).map(key)];
    const groups: Array<[string, { status: string; items: any[] }, (item: any) => string]> = [
      ["curriculum", resolution.curriculum, (item) => `curriculum:${item.courseStableKey ?? item.courseId}`],
      ["arcade", resolution.arcade, (item) => `arcade:${item.experienceId}`],
      ["mission", resolution.missions, (item) => `mission:${item.missionId}@${item.missionVersion}`],
      ["career", resolution.careers, (item) => `career:${item.careerId}`],
      ["competency", resolution.competencies, (item) => `competency:${item.competencyId}`],
    ];
    const refResolved: string[] = [];
    const refUnresolved: string[] = [];
    let unavailable = false;
    for (const [, group, key] of groups) {
      if (group.status === "UNAVAILABLE") unavailable = true;
      const [ok, missing] = split(group.items, key);
      refResolved.push(...ok);
      refUnresolved.push(...missing);
    }
    const [destOk, destMissing] = split(resolution.destinations, (item) => `destination:${item.destinationId}`);
    refResolved.push(...destOk, ...resolution.metaverse.filter((item) => item.system).map((item) => `mol:${item.molSystemId}`));
    refUnresolved.push(...destMissing, ...resolution.metaverse.filter((item) => !item.system).map((item) => `mol:${item.molSystemId}`));
    const operationalWarnings = resolution.operationalProgram.items.filter((item: any) => !item.resolved).map((item: any) => `OPERATIONAL_PROGRAM_UNRESOLVED:${item.programId}`);
    const missionIssues = resolution.missions.items.flatMap((item: any) => item.requirementIssues ?? []);

    const blockingRequirements = readiness.requirementIssues.filter((issue) => issue.effect === "BLOCKING");
    const degradedRequirements = readiness.requirementIssues.filter((issue) => issue.effect === "DEGRADED");
    const credentialQuestion = readiness.questions.find((item) => item.question === "EXTERNAL_CREDENTIAL_AUTHORITY")!;
    const credentialItems = authority.credentialAuthorities.items as any[];
    const verifiedUnresolved = funding.filter((item) => item.alignment === "VERIFIED" && item.verificationResolved !== true).map((item) => `funding:${item.fundingSourceId}`);
    const sensoryRefs = resolution.sensory.references;
    const governanceItems = resolution.governance.items as any[];
    const reportItems = resolution.reportProfiles.items as any[];

    const sections = {
      schema: sectionOf(validateProgramPackageStructured(pkg).valid ? "RESOLVED" : "BLOCKED", [], [], [`schemaVersion:${pkg.schemaVersion}`]),
      references: sectionOf(unavailable ? "UNAVAILABLE" : refUnresolved.length ? "UNRESOLVED" : "RESOLVED", missionIssues, operationalWarnings, refResolved, refUnresolved),
      authority: sectionOf(internalIssuerUnresolved ? "BLOCKED" : "RESOLVED", internalIssuerUnresolved ? ["INTERNAL_ISSUER_UNRESOLVED"] : [],
        authority.credentialIssuerStatus === "NOT_DECLARED" ? ["CREDENTIAL_ISSUER_NOT_DECLARED"] : [], pkg.authorityRefs.map((ref) => `authority:${ref.domain}`)),
      capabilities: sectionOf(readiness.maturityIssues.length || blockingRequirements.length ? "BLOCKED" : degradedRequirements.length ? "DEGRADED" : "RESOLVED",
        [...readiness.maturityIssues.map((issue) => `${issue.capability}:${issue.reason}`), ...blockingRequirements.map((issue) => `${issue.capability}:${issue.reason}`)],
        degradedRequirements.map((issue) => `${issue.capability}:${issue.reason}`), pkg.capabilityRefs.map((cap) => `capability:${cap.capability}`)),
      dependencies: sectionOf(readiness.blockingDependencies.length ? "BLOCKED" : readiness.degradedDependencies.length ? "DEGRADED" : "RESOLVED",
        readiness.blockingDependencies.map((id) => `REQUIRED_DEPENDENCY_BLOCKING:${id}`), readiness.degradedDependencies.map((dep) => `OPTIONAL_DEPENDENCY_DEGRADED:${dep.dependencyId}`)),
      integrationReadiness: sectionOf(readiness.status === "READY" ? "RESOLVED" : readiness.status, readiness.gaps.map((gap) => `READINESS_GAP:${gap}`)),
      executionLevel: sectionOf(readiness.executionLevel.issues.length ? "BLOCKED" : "RESOLVED", readiness.executionLevel.issues, [],
        [`declared:${readiness.executionLevel.declared}`, `evaluated:${readiness.executionLevel.evaluated}`]),
      partners: sectionOf(confirmedPartners > 0 ? "RESOLVED" : "UNRESOLVED", confirmedPartners > 0 ? [] : ["PARTNER_VALIDATION_INCOMPLETE"],
        resolution.partners.items.filter((item: any) => item.status === "CONFIRMED" && item.confirmed !== true).map((item: any) => `CONFIRMED_WITHOUT_ACTIVE_RELATIONSHIP:${item.organizationId}`),
        resolution.partners.items.filter((item: any) => item.confirmed === true).map((item: any) => `partner:${item.organizationId}`),
        resolution.partners.items.filter((item: any) => item.confirmed !== true).map((item: any) => `partner:${item.organizationId}`)),
      credentials: sectionOf(credentialQuestion.status === "GAP" ? "UNRESOLVED" : credentialItems.some((item) => !item.resolved) ? "UNRESOLVED" : "RESOLVED",
        credentialQuestion.status === "GAP" ? ["CREDENTIAL_AUTHORITY_NOT_DECLARED"] : [], credentialItems.filter((item) => item.status === "PLACEHOLDER").map((item) => `CREDENTIAL_AUTHORITY_PLACEHOLDER:${item.name}`),
        credentialItems.filter((item) => item.resolved && item.credentialDefinition).map((item) => `credential:${item.credentialDefinition.id}`),
        credentialItems.filter((item) => !item.resolved).map((item) => `credential:${item.name}`)),
      funding: sectionOf(verifiedUnresolved.length ? "BLOCKED" : fundability.fundingLanes.length ? "RESOLVED" : "UNRESOLVED",
        [...(verifiedUnresolved.length ? verifiedUnresolved.map((ref) => `VERIFIED_WITHOUT_CANONICAL_SOURCE:${ref}`) : []), ...(fundability.fundingLanes.length ? [] : ["NO_FUNDING_LANES"])],
        ["ALIGNMENT_IS_NOT_ELIGIBILITY"], funding.filter((item) => item.alignment !== "UNKNOWN").map((item) => `funding:${item.fundingSourceId}`)),
      reporting: sectionOf(resolution.reportProfiles.status === "UNAVAILABLE" ? "UNAVAILABLE" : reportItems.every((item) => item.resolved) ? "RESOLVED" : "UNRESOLVED", [], [],
        reportItems.filter((item) => item.resolved && item.reportProfileKey).map((item) => `report:${item.metric}`),
        reportItems.filter((item) => !item.resolved).map((item) => `report:${item.metric}`)),
      accessibility: sectionOf(pkg.accessibilityRequirements.length ? "RESOLVED" : "UNRESOLVED", pkg.accessibilityRequirements.length ? [] : ["NO_ACCESSIBILITY_REQUIREMENTS"], [],
        pkg.accessibilityRequirements.map((item) => `support:${item}`)),
      sensory: sectionOf(sensoryRefs.some((ref) => !ref.resolved) ? "UNRESOLVED" : "RESOLVED", [], sensoryRefs.length ? [] : ["NO_SENSORY_REFS"],
        sensoryRefs.filter((ref) => ref.resolved).map((ref) => `${ref.kind}:${ref.id}`), sensoryRefs.filter((ref) => !ref.resolved).map((ref) => `${ref.kind}:${ref.id}`)),
      governance: sectionOf(resolution.governance.status === "UNAVAILABLE" ? "UNAVAILABLE" : governanceItems.some((item) => !item.resolved) ? "UNRESOLVED" : "RESOLVED", [], [],
        governanceItems.filter((item) => item.resolved).map((item) => `${item.refType}:${item.ref}`), governanceItems.filter((item) => !item.resolved).map((item) => `${item.refType}:${item.ref}`)),
      lifecycle: sectionOf(lifecycle.allowed ? "RESOLVED" : "BLOCKED", lifecycle.blockingReasons, [], [`requested:${lifecycle.requestedState}`, `evaluated:${lifecycle.evaluatedState}`]),
      fundability: sectionOf(!fundability.assessed ? "UNRESOLVED" : fundability.decision === "BUILD" ? "RESOLVED" : fundability.decision === "HOLD" ? "UNRESOLVED" : "BLOCKED",
        fundability.reasons, ["ALIGNMENT_IS_NOT_ELIGIBILITY"], fundability.fundingLanes.map((lane) => `lane:${lane}`)),
    };
    const order = ["RESOLVED", "DEGRADED", "UNRESOLVED", "UNAVAILABLE", "BLOCKED"];
    const overall = Object.values(sections).map((item) => item.status).sort((a, b) => order.indexOf(b) - order.indexOf(a))[0];
    return {
      programId: pkg.program.programId, schemaVersion: pkg.schemaVersion, overall,
      lifecycle: { requestedState: lifecycle.requestedState, evaluatedState: lifecycle.evaluatedState, allowed: lifecycle.allowed, blockingReasons: lifecycle.blockingReasons },
      executionLevel: { declared: readiness.executionLevel.declared, evaluated: readiness.executionLevel.evaluated },
      fundability: { decision: fundability.decision, reasons: fundability.reasons, eligibilityEstablished: false as const },
      sections,
      createsEvidence: false as const, createsCredential: false as const, establishesEligibility: false as const, writes: [] as const,
    };
  }

  async evaluateProgramLifecycle(actor: WorkforceActor, programId: unknown) {
    return (await this.resolveProgramIntegration(actor, programId)).lifecycle;
  }

  // Future activation concept, read-only: what activation would require. Nothing is written; there is no
  // activation record in Phase 8, so PILOT/ACTIVE can never be reached from configuration alone.
  async evaluateActivation(actor: WorkforceActor, programId: unknown) {
    const report = await this.validateProgramIntegration(actor, programId);
    const entitlementRefs = this.packageFor(actor, programId).pkg.governanceRefs.filter((ref) => ref.refType === "SERVICE_ENTITLEMENT");
    const conditions = {
      REGISTERED: true,
      VALIDATES: report.sections.schema.status === "RESOLVED",
      REQUIRED_REFERENCES_RESOLVE: report.sections.references.status === "RESOLVED",
      LIFECYCLE_ALLOWS_ACTIVATION: report.lifecycle.allowed && ["PILOT_READY", "PILOT", "ACTIVE"].includes(report.lifecycle.evaluatedState),
      ORGANIZATION_AUTHORIZED: true,
      DEPENDENCIES_MEET_POLICY: report.sections.dependencies.status !== "BLOCKED" && report.sections.capabilities.status !== "BLOCKED",
      ENTITLEMENTS_PRESENT: entitlementRefs.length === 0 || report.sections.governance.status === "RESOLVED",
    };
    return {
      programId: report.programId, activatable: Object.values(conditions).every(Boolean), conditions,
      unmet: Object.entries(conditions).filter(([, ok]) => !ok).map(([name]) => name).sort(),
      activationRecord: "NOT_PERSISTED" as const, writes: [] as const,
    };
  }

  // BOS program readiness packet (generic). BOS stays advisory/coordination; it owns none of these domains.
  async bosProgramReadinessPacket(actor: WorkforceActor, programId: unknown) {
    const { pkg, readiness, authority, lifecycle, fundability, confirmedPartners } = await this.resolveProgramIntegration(actor, programId);
    const report = await this.validateProgramIntegration(actor, programId);
    const assessment = this.assessmentFor(pkg.program.programId);
    return {
      readOnly: true as const, controls: [] as const,
      program: { programId: pkg.program.programId, name: pkg.program.name, owningOrganizationId: pkg.program.owningOrganizationId, authorityOwner: pkg.program.authorityOwner },
      lifecycle: { requestedState: lifecycle.requestedState, evaluatedState: lifecycle.evaluatedState, allowed: lifecycle.allowed, blockingReasons: lifecycle.blockingReasons },
      fundability: { decision: fundability.decision, reasons: fundability.reasons, fundingLanes: fundability.fundingLanes, eligibilityEstablished: false as const },
      integrationReadiness: { status: readiness.status, gaps: readiness.gaps },
      capabilityMaturity: pkg.capabilityRefs.map((cap) => ({ capability: cap.capability, maturity: cap.maturity, minimumMaturity: cap.minimumMaturity, required: cap.required })),
      dependencies: { blocking: readiness.blockingDependencies, degraded: readiness.degradedDependencies.map((dep) => dep.dependencyId) },
      authorityGaps: [...report.sections.authority.issues, ...report.sections.authority.warnings],
      partnerGaps: confirmedPartners > 0 ? [] : ["PARTNER_VALIDATION_INCOMPLETE"],
      credentialGaps: [...report.sections.credentials.issues, ...report.sections.credentials.warnings],
      fundingGaps: report.sections.funding.issues,
      reportingReadiness: report.sections.reporting.status,
      sensoryReadiness: report.sections.sensory.status,
      risk: { implementationRisk: assessment?.component.implementationRisk ?? "UNKNOWN", executionLevel: readiness.executionLevel.evaluated, credentialIssuerStatus: authority.credentialIssuerStatus },
    };
  }

  // MOCC program packets (generic): bounded aggregates for the actor's organization. No learner identity, no
  // private health/accommodation detail, no write or control path.
  async moccProgramPackets(actor: WorkforceActor) {
    const scope = this.scope(actor);
    const packages = this.registry().packages.filter((pkg) => pkg.program.owningOrganizationId === scope.organizationId);
    const packets = [];
    for (const pkg of packages) {
      const { readiness, lifecycle } = await this.resolveProgramIntegration(actor, pkg.program.programId);
      packets.push({
        programId: pkg.program.programId, status: lifecycle.evaluatedState, executionLevel: readiness.executionLevel.evaluated,
        affectedSystems: readiness.executionLevel.systems,
        requiredCapabilities: pkg.capabilityRefs.filter((cap) => cap.required).map((cap) => cap.capability).sort(),
        degradedCapabilities: [...new Set(readiness.requirementIssues.map((issue) => issue.capability))].sort(),
        blockingDependencies: readiness.blockingDependencies,
        activeMissionTypes: pkg.missionRefs.map((ref) => `${ref.missionId}@${ref.missionVersion}`),
        authorityOwner: pkg.program.authorityOwner,
        sensoryProfileRefs: pkg.sensoryRefs ? Object.values(pkg.sensoryRefs).filter(Boolean) : [],
        fundingBuckets: [...new Set(pkg.capabilityRefs.map((cap) => cap.fundingBucket))].sort(),
      });
    }
    return { readOnly: true as const, controls: [] as const, programs: packets };
  }

  // Future MOCC: which programs depend on a MOL system, which capabilities and dependencies would be affected.
  // Read-only, aggregate, learner-agnostic; it controls nothing.
  moccSystemImpact(actor: WorkforceActor, molSystemId: string) {
    const scope = this.scope(actor);
    const system = workforceMolSystem(molSystemId);
    const programs = this.registry().packages.filter((pkg) => pkg.program.owningOrganizationId === scope.organizationId).flatMap((pkg) => {
      const viaRefs = pkg.metaverseRefs.some((ref) => ref.molSystemId === molSystemId);
      const capabilities = pkg.capabilityRefs.filter((cap) => (cap.molSystemIds ?? []).includes(molSystemId)).map((cap) => cap.capability);
      if (!viaRefs && !capabilities.length) return [];
      return [{
        programId: pkg.program.programId, lifecycle: pkg.program.lifecycle, affectedCapabilities: capabilities,
        affectedMissions: pkg.missionRefs.map((ref) => ({ missionId: ref.missionId, missionVersion: ref.missionVersion })),
        fundingBuckets: [...new Set(pkg.capabilityRefs.filter((cap) => capabilities.includes(cap.capability)).map((cap) => cap.fundingBucket))],
        authorityOwner: pkg.program.authorityOwner,
        sensoryRefs: pkg.sensoryRefs ? { ...pkg.sensoryRefs } : null,
      }];
    });
    return { readOnly: true as const, controls: [] as const, system, programs };
  }
}
