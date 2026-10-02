// Phase 6 — Arcade Integration Fabric service.
//
// Learning Arcade and Classic Arcade share platform infrastructure but remain separate product
// authorities. Arcade Integration Fabric coordinates integrations; it does not absorb the authority
// of connected systems. Every external fact is read from (or requested of) its owning system:
//   activity descriptors → canonical Arcade experience catalog (src/shared/arcade/experience)
//   curriculum links     → CurriculumCatalogRepo (read-only)
//   Missions             → PersistedPublishedMissionResolver + canonical MissionRuntimeStartService
//   teams                → mission-team (read-only summary)
//   careers              → CareerRepo (read-only)
//   evidence             → describe-only candidates; the frozen verified-evidence authority decides
//   world context        → existing MOL contracts via MissionDefinition.metaverseContext / environmentRefs
// The Fabric persists nothing; launches create records only through the owning runtime services.
import { ArcadeRuntimeSessionService } from "../../arcade/service/runtime-session-service.js";
import { ArcadeRepo } from "../../arcade/repo/arcade-repo.js";
import { CareerRepo } from "../../careers/repo/career-repo.js";
import { CurriculumCatalogRepo } from "../../curriculum-catalog/repo/curriculum-catalog-repo.js";
import { PersistedPublishedMissionResolver } from "../../mission-content/catalog/published-mission-catalog.js";
import { MissionRuntimeError, MissionRuntimeService, type MissionRuntimeActor } from "../../mission-runtime/service/mission-runtime-service.js";
import { MissionRuntimeStartService } from "../../mission-runtime/service/mission-runtime-start-service.js";
import { describeMissionEvidenceCandidate } from "../../mission-runtime/service/mission-evidence-candidate.js";
import { MissionTeamRepo } from "../../mission-team/repo/mission-team-repo.js";
import { missionTeamDirectorSummary } from "../../mission-team/service/mission-team-service.js";
import { canonicalArcadeExperiences, type ArcadeExperienceDescriptor } from "../arcade-experience-bridge.js";
import {
  ArcadeIntegrationError,
  type ArcadeIntegrationCapability,
  type ArcadeIntegrationRuntimeRef,
  type ArcadeProductType,
  type ArcadeRuntimeKind,
} from "../model/arcade-integration.js";

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const MAX_CAREER_REFS = 12;

export interface ArcadeIntegrationDependencies {
  experiences?: () => ArcadeExperienceDescriptor[];
  careers?: { getById(careerId: string): Promise<any | null> };
  curriculum?: { listLessonLinksForArcadeActivity(organizationId: string, arcadeActivityId: string): Promise<any[]> };
  missions?: PersistedPublishedMissionResolver;
  missionStart?: MissionRuntimeStartService;
  missionRuntime?: MissionRuntimeService;
  arcadeRuntime?: ArcadeRuntimeSessionService;
  teams?: { listOperational(scope: { organizationId: string; tenantId: string }): Promise<Array<{ status: string }>> };
  arcadeResults?: { listResultsForLearner(organizationId: string, learnerUserId: string): Promise<any[]> };
}

function scopeOf(actor: MissionRuntimeActor) {
  const organizationId = String(actor?.organization_id || "").trim();
  if (!organizationId || !actor?.user_id) throw new ArcadeIntegrationError("TENANT_SCOPE_MISMATCH", "Actor organization/user is required.");
  return { organizationId, tenantId: `tenant:${organizationId}` };
}

// Normalized capabilities derived from the descriptor's own declarations.
export function deriveArcadeCapabilities(descriptor: ArcadeExperienceDescriptor): ArcadeIntegrationCapability[] {
  const family = descriptor.product?.family;
  const capabilities = descriptor.capabilities ?? {};
  const relationships = descriptor.relationships ?? {};
  const activityId = descriptor.activityReference?.arcadeActivityId ?? null;
  const list: ArcadeIntegrationCapability[] = [];
  if (capabilities.missionLaunch === true && family === "learning" && activityId) list.push("MISSION_LAUNCH");
  if (capabilities.multiplayer === true) list.push("MULTIPLAYER");
  if (capabilities.leaderboardEligible === true) list.push("LEADERBOARD");
  if (capabilities.achievementEligible === true) list.push("ACHIEVEMENTS");
  if (relationships.career?.relationshipType === "reference" && (relationships.career.pathwayReferences ?? []).length) list.push("CAREER_LINK");
  // Curriculum links are resolved from Curriculum's own lesson ↔ activity table, for Learning only.
  if (family === "learning" && activityId) list.push("CURRICULUM_LINK");
  // Classic Arcade never becomes learning Evidence; the descriptor validator also requires an activity.
  if (family === "learning" && capabilities.evidenceResultCapable === true && activityId) list.push("EVIDENCE_CANDIDATE");
  if (relationships.metaverse?.relationshipType === "reference") list.push("METAVERSE_CONTEXT");
  if (["INSTRUCTOR", "AUTHORIZED_CREATOR", "PARTNER"].includes(descriptor.provenance?.source)) list.push("CREATOR_AUTHORED");
  if (capabilities.replay === true) list.push("REPLAY");
  return list;
}

export class ArcadeIntegrationService {
  private readonly experiences: () => ArcadeExperienceDescriptor[];
  private readonly careers: NonNullable<ArcadeIntegrationDependencies["careers"]>;
  private readonly curriculum: NonNullable<ArcadeIntegrationDependencies["curriculum"]>;
  private readonly missions: PersistedPublishedMissionResolver;
  private readonly missionRuntime: MissionRuntimeService;
  private readonly missionStart: MissionRuntimeStartService;
  private readonly arcadeRuntime: ArcadeRuntimeSessionService;
  private readonly teams: NonNullable<ArcadeIntegrationDependencies["teams"]>;
  private readonly arcadeResults: NonNullable<ArcadeIntegrationDependencies["arcadeResults"]>;

  constructor(dependencies: ArcadeIntegrationDependencies = {}) {
    this.experiences = dependencies.experiences ?? (() => canonicalArcadeExperiences().descriptors);
    this.careers = dependencies.careers ?? new CareerRepo();
    this.curriculum = dependencies.curriculum ?? new CurriculumCatalogRepo();
    this.missions = dependencies.missions ?? new PersistedPublishedMissionResolver();
    this.missionRuntime = dependencies.missionRuntime ?? new MissionRuntimeService();
    this.missionStart = dependencies.missionStart ?? new MissionRuntimeStartService(this.missions, this.missionRuntime);
    this.arcadeRuntime = dependencies.arcadeRuntime ?? new ArcadeRuntimeSessionService();
    this.arcadeResults = dependencies.arcadeResults ?? new ArcadeRepo();
    this.teams = dependencies.teams ?? new MissionTeamRepo();
  }

  private descriptor(experienceId: unknown) {
    const id = String(experienceId ?? "").trim();
    const found = this.experiences().find((item) => item.id === id);
    if (!found) throw new ArcadeIntegrationError("ACTIVITY_NOT_FOUND", "Arcade experience was not found.");
    return found;
  }

  private descriptorForActivity(arcadeActivityId: string | null) {
    // arcade_activities is the Learning activity registry; a Classic descriptor never claims one.
    return arcadeActivityId ? this.experiences().find((item) => item.product?.family === "learning" && item.activityReference?.arcadeActivityId === arcadeActivityId) ?? null : null;
  }

  // Mission Runtime carries no Arcade product classification: MissionDefinition.family is Mission Content's
  // own taxonomy and arcadeActivityId is an optional reference. A Mission Runtime is therefore addressable
  // through Arcade Integration only when exactly one canonical Learning descriptor establishes the link:
  // same arcadeActivityId, MISSION_LAUNCH capability, and the exact missionId/missionVersion declared.
  // Anything else is not an Arcade runtime and is never labeled "learning".
  private linkedLearningDescriptor(session: { missionId: string; missionVersion: number; definitionSnapshot: { arcadeActivityId?: string } }) {
    const activityId = session.definitionSnapshot?.arcadeActivityId;
    if (typeof activityId !== "string" || !activityId) return null;
    const linked = this.experiences().filter((item) =>
      item.product?.family === "learning"
      && item.activityReference?.arcadeActivityId === activityId
      && deriveArcadeCapabilities(item).includes("MISSION_LAUNCH")
      && ((item.relationships?.mission?.missionReferences ?? []) as Array<{ missionId: string; missionVersion: number }>)
        .some((ref) => ref.missionId === session.missionId && ref.missionVersion === session.missionVersion));
    // Ambiguous links are not resolved by guessing.
    return linked.length === 1 ? linked[0] : null;
  }

  private linkedMission(session: any) {
    const descriptor = this.linkedLearningDescriptor(session);
    if (!descriptor) throw new ArcadeIntegrationError("RUNTIME_NOT_FOUND", "Mission Runtime is not linked to a canonical Learning Arcade experience.");
    return descriptor;
  }

  // Optional dependency: Career outages degrade the projection; they never block play or fabricate data.
  private async careerProjection(descriptor: ArcadeExperienceDescriptor) {
    const refs: string[] = (descriptor.relationships?.career?.pathwayReferences ?? []).slice(0, MAX_CAREER_REFS);
    if (!refs.length) return { status: "NOT_DECLARED" as const, careers: [], authority: "career" as const, eligibilityClaims: false as const };
    try {
      const careers = [];
      for (const ref of refs) {
        const row = await this.careers.getById(ref);
        careers.push(row ? { careerId: row.career_id, slug: row.slug, title: row.title, status: row.status, resolved: true } : { careerId: ref, resolved: false });
      }
      return { status: "AVAILABLE" as const, careers, authority: "career" as const, eligibilityClaims: false as const };
    } catch {
      return { status: "UNAVAILABLE" as const, careers: [], authority: "career" as const, eligibilityClaims: false as const };
    }
  }

  // Canonical activity reference: the descriptor's product semantics plus read-only external links.
  async resolve(actor: MissionRuntimeActor, experienceId: unknown) {
    const scope = scopeOf(actor);
    const descriptor = this.descriptor(experienceId);
    const productType: ArcadeProductType = descriptor.product.family;
    const capabilities = deriveArcadeCapabilities(descriptor);
    const activityId: string | null = descriptor.activityReference?.arcadeActivityId ?? null;
    // Optional read-only dependencies degrade explicitly (status UNAVAILABLE, unknown ≠ false); nothing is fabricated.
    let curriculum: { authority: "curriculum"; status: "AVAILABLE" | "UNAVAILABLE" | "NOT_APPLICABLE"; lessons: Array<{ lessonId: string; lessonTitle: string; unitId: string; courseId: string }> };
    if (!capabilities.includes("CURRICULUM_LINK")) curriculum = { authority: "curriculum", status: "NOT_APPLICABLE", lessons: [] };
    else {
      try {
        const links = await this.curriculum.listLessonLinksForArcadeActivity(scope.organizationId, activityId!);
        // Identifiers and titles only: lesson content stays with Curriculum.
        curriculum = { authority: "curriculum", status: "AVAILABLE", lessons: links.map((link) => ({ lessonId: link.lessonId, lessonTitle: link.lessonTitle, unitId: link.unitId, courseId: link.courseId })) };
      } catch {
        curriculum = { authority: "curriculum", status: "UNAVAILABLE", lessons: [] };
      }
    }
    const declared = (descriptor.relationships?.mission?.missionReferences ?? []) as Array<{ missionId: string; missionVersion: number }>;
    let published: Array<{ missionId: string; missionVersion: number }> | null = [];
    if (capabilities.includes("MISSION_LAUNCH")) {
      try {
        published = await this.missions.listPublishedMissionsForArcadeActivity(scope, activityId!);
      } catch {
        published = null;
      }
    }
    const missions = declared.map((ref) => ({
      missionId: ref.missionId, missionVersion: ref.missionVersion,
      published: published === null ? null : published.some((item) => item.missionId === ref.missionId && item.missionVersion === ref.missionVersion),
    }));
    return {
      experienceId: descriptor.id,
      slug: descriptor.slug,
      productType,
      experienceType: descriptor.product.experienceType,
      lifecycle: { status: descriptor.lifecycle.status, launchable: descriptor.lifecycle.launchable, playable: descriptor.lifecycle.playable },
      runtimeType: descriptor.launch?.runtimeType ?? null,
      arcadeActivityId: activityId,
      capabilities,
      curriculum,
      missions: { authority: "mission-content" as const, status: published === null ? "UNAVAILABLE" as const : "AVAILABLE" as const, references: missions },
      career: await this.careerProjection(descriptor),
      metaverse: { authority: "metaverse" as const, experienceReferences: descriptor.relationships?.metaverse?.experienceReferences ?? [] },
      accessibility: {
        reducedMotionRequired: descriptor.accessibility?.reducedMotionRequired === true,
        keyboardRequired: descriptor.accessibility?.keyboardRequired === true,
        supports: { ...(descriptor.accessibility?.supports ?? {}) },
        accommodationAuthority: "accessibility-accommodations" as const,
      },
      provenance: { classification: descriptor.provenance?.classification, source: descriptor.provenance?.source ?? "SYSTEM", grantsPublishingAuthority: false as const },
    };
  }

  describeCapabilities(experienceId: unknown) {
    const descriptor = this.descriptor(experienceId);
    return { experienceId: descriptor.id, productType: descriptor.product.family as ArcadeProductType, capabilities: deriveArcadeCapabilities(descriptor) };
  }

  // One bounded launch contract. It creates runtimes only through their owning services and never
  // creates curriculum truth, Evidence, credentials, career eligibility, rewards or world state.
  async launch(actor: MissionRuntimeActor, experienceId: unknown, body: { mode?: unknown; missionId?: unknown; missionVersion?: unknown; idempotencyKey?: unknown }) {
    scopeOf(actor);
    const descriptor = this.descriptor(experienceId);
    if (descriptor.lifecycle?.launchable !== true) throw new ArcadeIntegrationError("ACTIVITY_NOT_LAUNCHABLE", "This Arcade experience is not launchable.");
    const capabilities = deriveArcadeCapabilities(descriptor);
    const idempotencyKey = typeof body?.idempotencyKey === "string" && ID.test(body.idempotencyKey) ? body.idempotencyKey : null;
    if (!idempotencyKey) throw new ArcadeIntegrationError("LAUNCH_INVALID", "A bounded idempotencyKey is required.");
    if (body?.mode === "MISSION") {
      if (!capabilities.includes("MISSION_LAUNCH")) throw new ArcadeIntegrationError("CAPABILITY_NOT_SUPPORTED", "This experience does not launch Missions.");
      const missionId = String(body.missionId ?? "");
      const missionVersion = Number(body.missionVersion);
      const declared = (descriptor.relationships.mission.missionReferences as Array<{ missionId: string; missionVersion: number }>).filter((ref) => ref.missionId === missionId);
      if (!declared.length) throw new ArcadeIntegrationError("CAPABILITY_NOT_SUPPORTED", "This Mission is not linked to the experience.");
      if (!declared.some((ref) => ref.missionVersion === missionVersion)) throw new ArcadeIntegrationError("MISSION_VERSION_MISMATCH", "Only the exact linked Mission version can launch.");
      const activityId: string = descriptor.activityReference.arcadeActivityId;
      // The link must be unambiguous, or the resulting runtime could not be classified afterwards.
      if (this.linkedLearningDescriptor({ missionId, missionVersion, definitionSnapshot: { arcadeActivityId: activityId } }) !== descriptor) {
        throw new ArcadeIntegrationError("CAPABILITY_NOT_SUPPORTED", "This Mission version is linked by more than one Arcade experience.");
      }
      // The frozen published definition itself must reference this activity (Mission Content's own link),
      // checked before start so no unclassifiable runtime is ever created.
      let publishedForActivity: Array<{ missionId: string; missionVersion: number }>;
      try {
        publishedForActivity = await this.missions.listPublishedMissionsForArcadeActivity(scopeOf(actor), activityId);
      } catch {
        throw new ArcadeIntegrationError("DEPENDENCY_UNAVAILABLE", "Published Mission lookup is unavailable.");
      }
      if (!publishedForActivity.some((item) => item.missionId === missionId && item.missionVersion === missionVersion)) {
        throw new ArcadeIntegrationError("MISSION_NOT_PUBLISHED", "The linked Mission version is not published for this organization and Arcade activity.");
      }
      try {
        // Canonical start authority: exact published version, org-scoped, no latest fallback.
        const started = await this.missionStart.startPublishedMission(actor, { missionId, missionVersion, idempotencyKey });
        // The start response is a public projection; classify from Mission Runtime's own frozen snapshot.
        const session = await this.missionRuntime.get(actor, started.session.id);
        return { runtimeRef: this.missionRef(session, this.linkedMission(session)), reused: started.reused };
      } catch (error) {
        if (error instanceof MissionRuntimeError && error.code === "PUBLISHED_MISSION_NOT_FOUND") throw new ArcadeIntegrationError("MISSION_NOT_PUBLISHED", "The linked Mission version is not published for this organization.");
        if (error instanceof MissionRuntimeError || error instanceof ArcadeIntegrationError) throw error;
        throw new ArcadeIntegrationError("DEPENDENCY_UNAVAILABLE", "Mission start is unavailable.");
      }
    }
    if (body?.mode !== undefined && body.mode !== "ARCADE_SESSION") throw new ArcadeIntegrationError("LAUNCH_INVALID", "mode must be ARCADE_SESSION or MISSION.");
    const productType: ArcadeProductType = descriptor.product.family;
    const started = await this.arcadeRuntime.start(actor as any, {
      family: productType,
      experienceId: descriptor.id,
      ...(productType === "learning" && descriptor.activityReference?.arcadeActivityId ? { activityId: descriptor.activityReference.arcadeActivityId } : {}),
      sessionType: ["game", "simulation", "mission", "challenge", "practice"].includes(descriptor.product.experienceType) ? descriptor.product.experienceType : "game",
      idempotencyKey,
    });
    const session = (started as any).session ?? started;
    return { runtimeRef: this.arcadeRef(session), reused: Boolean((started as any).reused) };
  }

  // Only called with a descriptor that canonically links the runtime; product type comes from that descriptor.
  private missionRef(session: any, descriptor: ArcadeExperienceDescriptor): ArcadeIntegrationRuntimeRef {
    return {
      runtimeKind: "MISSION_RUNTIME", runtimeId: session.id, experienceId: descriptor.id,
      arcadeActivityId: descriptor.activityReference.arcadeActivityId, productType: descriptor.product.family, status: session.status,
    };
  }

  private arcadeRef(session: any): ArcadeIntegrationRuntimeRef {
    return {
      runtimeKind: "ARCADE_RUNTIME", runtimeId: session.id, experienceId: session.experienceId, arcadeActivityId: session.arcadeActivityId ?? null,
      productType: session.family, status: session.status,
    };
  }

  // Shared reference ≠ shared authority: each kind is read through its own owner-scoped service.
  async describeRuntime(actor: MissionRuntimeActor, runtimeKind: unknown, runtimeId: unknown): Promise<ArcadeIntegrationRuntimeRef> {
    scopeOf(actor);
    const id = String(runtimeId ?? "");
    try {
      if (runtimeKind === "MISSION_RUNTIME") {
        const session = await this.missionRuntime.get(actor, id);
        return this.missionRef(session, this.linkedMission(session));
      }
      if (runtimeKind === "ARCADE_RUNTIME") return this.arcadeRef(await this.arcadeRuntime.get(actor as any, id));
    } catch (error) {
      if (error instanceof ArcadeIntegrationError) throw error;
      throw new ArcadeIntegrationError("RUNTIME_NOT_FOUND", "Runtime was not found.");
    }
    throw new ArcadeIntegrationError("LAUNCH_INVALID", "runtimeKind must be ARCADE_RUNTIME or MISSION_RUNTIME.");
  }

  // Bounded result projection. Completion, score, team performance, individual action and the
  // learning evidence candidate are separate dimensions; none implies another, and no score is invented.
  async describeResult(actor: MissionRuntimeActor, runtimeKind: ArcadeRuntimeKind | "ARCADE_RESULT", runtimeId: string) {
    const runtime = runtimeKind === "ARCADE_RESULT" ? null : await this.describeRuntime(actor, runtimeKind, runtimeId);
    if (runtimeKind === "MISSION_RUNTIME") {
      const session = await this.missionRuntime.get(actor, runtimeId);
      const events = await this.missionRuntime.listEvents(actor, runtimeId);
      // describeRuntime above already rejected runtimes without a canonical Learning link.
      const capabilities = deriveArcadeCapabilities(this.linkedMission(session));
      const candidate = describeMissionEvidenceCandidate(session, events);
      const team = await missionTeamDirectorSummary(session);
      const completed = session.status === "SUCCEEDED";
      return {
        runtimeRef: runtime,
        completion: { status: session.status, completed, terminal: ["SUCCEEDED", "FAILED", "ABANDONED", "EXPIRED"].includes(session.status) },
        score: { value: null, authoritative: false, reason: "MISSION_HAS_NO_SCORE" },
        teamPerformance: team ? { teamStatus: team.teamStatus, teamSize: team.teamSize, rolesPresent: team.rolesPresent, scope: "TEAM_PERFORMANCE" as const } : null,
        individualActions: candidate.provenance.team?.individualDemonstration ?? null,
        learningEvidenceCandidate: {
          eligible: capabilities.includes("EVIDENCE_CANDIDATE") && candidate.canBecomeEvidenceCandidate, isVerifiedEvidence: false as const, addressableByEvidenceAuthority: candidate.addressableByEvidenceAuthority,
          individualEvidenceInferred: false as const, authority: "verified-evidence" as const,
        },
        replayRef: { kind: "MISSION_RUNTIME_EVENT_LOG", runtimeId: session.id, eventCount: events.length, lastSequence: events.at(-1)?.sequence ?? 0 },
        leaderboard: { eligible: false, reason: capabilities.includes("LEADERBOARD") ? "NO_AUTHORITATIVE_SCORE" : "CAPABILITY_NOT_DECLARED" },
        achievement: this.achievement(capabilities, completed),
      };
    }
    if (runtimeKind === "ARCADE_RUNTIME") {
      const descriptor = this.experiences().find((item) => item.id === runtime!.experienceId) ?? null;
      const capabilities = descriptor ? deriveArcadeCapabilities(descriptor) : [];
      const completed = runtime!.status === "COMPLETED";
      return {
        runtimeRef: runtime,
        completion: { status: runtime!.status, completed, terminal: ["COMPLETED", "ABANDONED", "EXPIRED"].includes(runtime!.status) },
        // Arcade runtime sessions carry no score authority; scores exist only on canonical Arcade Results.
        score: { value: null, authoritative: false, reason: "SESSION_HAS_NO_SCORE" },
        teamPerformance: null,
        individualActions: null,
        learningEvidenceCandidate: runtime!.productType === "classic"
          ? { eligible: false, reason: "CLASSIC_ARCADE_IS_NOT_LEARNING_EVIDENCE", isVerifiedEvidence: false as const }
          : { eligible: false, reason: "EVIDENCE_REQUIRES_ARCADE_RESULT", isVerifiedEvidence: false as const },
        replayRef: null,
        leaderboard: { eligible: false, reason: capabilities.includes("LEADERBOARD") ? "NO_AUTHORITATIVE_SCORE" : "CAPABILITY_NOT_DECLARED" },
        achievement: this.achievement(capabilities, completed),
      };
    }
    // Canonical Learning Arcade Result (attempt-based): score and mastery are owned by the activity's
    // deterministic rule; a candidate is addressable by the Evidence authority only through ARCADE_RESULT.
    if (runtimeKind !== "ARCADE_RESULT") throw new ArcadeIntegrationError("LAUNCH_INVALID", "kind must be ARCADE_RUNTIME, MISSION_RUNTIME or ARCADE_RESULT.");
    // Owner-scoped: only the actor's own Results in the actor's organization are addressable.
    const scope = scopeOf(actor);
    const results = await this.arcadeResults.listResultsForLearner(scope.organizationId, String(actor.user_id));
    const result = results.find((item: any) => item.id === runtimeId);
    if (!result) throw new ArcadeIntegrationError("RUNTIME_NOT_FOUND", "Arcade Result was not found.");
    const descriptor = this.descriptorForActivity(result.arcadeActivityId);
    const capabilities = descriptor ? deriveArcadeCapabilities(descriptor) : [];
    return {
      runtimeRef: { runtimeKind: "ARCADE_RESULT", runtimeId: result.id, experienceId: descriptor?.id ?? null, arcadeActivityId: result.arcadeActivityId, productType: "learning", status: "COMPLETED" },
      completion: { status: "COMPLETED", completed: true, terminal: true },
      score: { value: result.score, maxScore: result.maxScore, authoritative: result.score !== null, reason: result.score === null ? "ACTIVITY_SCORES_PASS_FAIL" : null },
      masteryAchieved: result.masteryAchieved,
      teamPerformance: null,
      individualActions: null,
      learningEvidenceCandidate: {
        eligible: capabilities.includes("EVIDENCE_CANDIDATE") && result.masteryAchieved === true,
        isVerifiedEvidence: false as const, addressableByEvidenceAuthority: true, possibleSourceType: "ARCADE_RESULT", authority: "verified-evidence" as const,
      },
      replayRef: { kind: "ARCADE_RESULT_REPLAY", resultId: result.id },
      leaderboard: { eligible: capabilities.includes("LEADERBOARD") && result.score !== null, reason: !capabilities.includes("LEADERBOARD") ? "CAPABILITY_NOT_DECLARED" : result.score === null ? "NO_AUTHORITATIVE_SCORE" : null },
      achievement: this.achievement(capabilities, true),
    };
  }

  // MOCC read-only projection: catalog-level counts and active team counts for the actor's organization.
  // No user ids, no learner data, no commands; MOCC observes and never controls Arcade.
  async operationalProjection(actor: MissionRuntimeActor) {
    const scope = scopeOf(actor);
    const descriptors = this.experiences();
    const byProduct = { learning: 0, classic: 0 } as Record<ArcadeProductType, number>;
    const byCapability: Record<string, number> = {};
    for (const descriptor of descriptors) {
      byProduct[descriptor.product.family as ArcadeProductType] += 1;
      for (const capability of deriveArcadeCapabilities(descriptor)) byCapability[capability] = (byCapability[capability] ?? 0) + 1;
    }
    let teams: { status: "AVAILABLE" | "UNAVAILABLE"; forming: number; active: number };
    try {
      const rows = await this.teams.listOperational(scope);
      teams = { status: "AVAILABLE", forming: rows.filter((row) => row.status === "FORMING").length, active: rows.filter((row) => row.status === "ACTIVE").length };
    } catch {
      teams = { status: "UNAVAILABLE", forming: 0, active: 0 };
    }
    return { readOnly: true as const, controls: [] as const, experiences: { total: descriptors.length, byProduct, byCapability }, teams };
  }

  // Achievements are Arcade-native eligibility only; no achievement store exists yet, and an
  // achievement is never a credential, certificate, Evidence or career readiness.
  private achievement(capabilities: ArcadeIntegrationCapability[], completed: boolean) {
    return {
      eligible: capabilities.includes("ACHIEVEMENTS") && completed,
      reason: !capabilities.includes("ACHIEVEMENTS") ? "CAPABILITY_NOT_DECLARED" : completed ? null : "NOT_COMPLETED",
      ownedBy: "arcade" as const, storeAvailable: false as const, credential: false as const,
    };
  }
}
