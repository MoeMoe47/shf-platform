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
  evaluateFundabilityGate, evaluateIntegrationReadiness, evaluateLifecycleTransition, fundingLanes,
  type FundabilityComponent, type ProgramResolutionFacts,
} from "../model/readiness-and-fundability.js";
import { buildWorkforceRegistry, type WorkforceRegistry } from "../registry/workforce-program-registry.js";
import { canonicalSensoryRegistry, resolveSensoryReference, type SensoryRegistry } from "../sensory-bridge.js";
import { workforceMolSystem } from "../workforce-mol-bridge.js";

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
  curriculum?: { findCourse(organizationId: string, courseId: string): Promise<any | null> };
  arcade?: { describeCapabilities(experienceId: unknown): { experienceId: string; productType: string; capabilities: string[] } };
  missions?: { resolvePublishedMission(identity: { missionId: string; version: number }, scope: { organizationId: string; tenantId: string }): Promise<any | null> };
  careers?: { getById(careerId: string): Promise<any | null> };
  competencies?: { getById(competencyId: string): Promise<any | null> };
  credentials?: { getById(id: string): Promise<any | null> };
  organizations?: { exists(organizationId: string): Promise<boolean> };
  fundingAwards?: { grantExists(grantId: string, organizationId: string): Promise<boolean>; assuranceReferenceExists(referenceId: string, scope: { organizationId: string; tenantId: string }): Promise<boolean> };
  reportProfiles?: () => Array<{ profileKey: string; status: string }>;
  sensory?: () => SensoryRegistry;
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
    const curriculum = await section(() => Promise.all(pkg.curriculumRefs.map(async ({ courseId }) => {
      const row = await d.curriculum.findCourse(scope.organizationId, courseId);
      // Identifier, title and status only: course content stays with Curriculum.
      return row ? { courseId, title: row.title, status: row.status, resolved: true } : { courseId, resolved: false };
    })));
    const arcade = await section(async () => pkg.arcadeExperienceRefs.map(({ experienceId }) => {
      try {
        const described = d.arcade.describeCapabilities(experienceId);
        return { experienceId, productType: described.productType, capabilities: described.capabilities, resolved: true };
      } catch (error: any) {
        if (error?.code === "ACTIVITY_NOT_FOUND") return { experienceId, resolved: false };
        throw error;
      }
    }));
    const missions = await section(() => Promise.all(pkg.missionRefs.map(async ({ missionId, missionVersion }) => {
      // Exact published version in this organization, through the canonical Mission catalog.
      const definition = await d.missions.resolvePublishedMission({ missionId, version: missionVersion }, scope);
      return definition ? { missionId, missionVersion, title: definition.title, published: true, resolved: true } : { missionId, missionVersion, published: false, resolved: false };
    })));
    const metaverse = pkg.metaverseRefs.map(({ molSystemId }) => ({ molSystemId, system: workforceMolSystem(molSystemId) }));
    const careers = await section(() => Promise.all(pkg.careerRefs.map(async ({ careerId }) => {
      const row = await d.careers.getById(careerId);
      return row ? { careerId, title: row.title, status: row.status, resolved: true, jobEligibilityInferred: false as const } : { careerId, resolved: false, jobEligibilityInferred: false as const };
    })));
    const competencies = await section(() => Promise.all(pkg.competencyRefs.map(async ({ competencyId }) => {
      const row = await d.competencies.getById(competencyId);
      return row ? { competencyId, title: row.title, status: row.status, resolved: true } : { competencyId, resolved: false };
    })));
    const partners = await section(() => Promise.all(pkg.partnerRefs.map(async (ref) => ({
      organizationId: ref.organizationId, role: ref.role, status: ref.status, resolved: await d.organizations.exists(ref.organizationId),
      impliesEmployment: false as const, impliesHiring: false as const,
    }))));
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
      contractVersion: pkg.contractVersion,
      program: { ...pkg.program },
      operationalProgram: operational,
      curriculum, arcade, missions, metaverse, careers, competencies, partners, reportProfiles,
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
        affectedMissions: pkg.missionRefs.map((ref) => ({ ...ref })),
        fundingBuckets: [...new Set(pkg.capabilityRefs.filter((cap) => capabilities.includes(cap.capability)).map((cap) => cap.fundingBucket))],
        authorityOwner: pkg.program.authorityOwner,
      }];
    });
    return { readOnly: true as const, controls: [] as const, system, programs };
  }
}
