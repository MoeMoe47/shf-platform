// Phase 5 — Multiplayer / Team Missions: participation and coordination layer.
//
// Mission Runtime remains the canonical Mission state authority. Multiplayer coordinates
// participants; it does not create a second Mission authority. This service owns team
// membership, mission participation roles, readiness and ephemeral presence. Learner actions
// are delegated to Mission Runtime as server-attributed canonical events; membership, role and
// org/tenant are always resolved from server state, never from the request.
//
// Transport independence: every operation is an authenticated command on this service. HTTP
// routes call it today; polling, SSE, mobile or Metaverse clients can call the same commands later.
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import type { MissionDefinition } from "../../mission-content/model/mission-definition.js";
import type { MissionRuntimeSession } from "../../mission-runtime/model/mission-runtime.js";
import { MissionRuntimeError, MissionRuntimeService, PARTICIPANT_ATTRIBUTION_KEY, type MissionRuntimeActor } from "../../mission-runtime/service/mission-runtime-service.js";
import { MissionTeamRepo, type MissionParticipantRow, type MissionTeamRow, type TeamScope, type TeamTx } from "../repo/mission-team-repo.js";

export const MISSION_PRESENCE_STATES = Object.freeze(["ONLINE", "AWAY", "DISCONNECTED"] as const);
export type MissionPresenceState = (typeof MISSION_PRESENCE_STATES)[number];
// Presence is Mission-participation connection state only (never ecosystem-wide "online"), ephemeral,
// process-local, and expires: a participant not seen within the window reads as DISCONNECTED.
export const MISSION_PRESENCE_EXPIRY_MS = 90_000;
const TERMINAL_RUNTIME = new Set(["SUCCEEDED", "FAILED", "ABANDONED", "EXPIRED"]);
const RECENT_ACTIONS_LIMIT = 20;

// Read-only projection contract for MOL / future MOCC: no membership or Mission authority, no learner identity.
export const MISSION_TEAM_OPERATIONAL_CONTRACT = Object.freeze({
  contractVersion: 1, missionAuthority: false, membershipAuthority: false, containsLearnerIdentity: false, containsAccommodationData: false,
});

type Clock = () => Date;

class MissionPresenceStore {
  private readonly entries = new Map<string, { state: MissionPresenceState; at: number }>();
  constructor(private readonly now: Clock) {}
  record(teamId: string, participantId: string, state: MissionPresenceState) {
    this.entries.set(`${teamId}:${participantId}`, { state, at: this.now().getTime() });
  }
  read(teamId: string, participantId: string): MissionPresenceState {
    const entry = this.entries.get(`${teamId}:${participantId}`);
    if (!entry || this.now().getTime() - entry.at > MISSION_PRESENCE_EXPIRY_MS) return "DISCONNECTED";
    return entry.state;
  }
}

function fail(code: string, message: string, status = 409): never {
  throw new MissionRuntimeError(code, message, status);
}

function scopeOf(actor: MissionRuntimeActor): TeamScope & { userId: string } {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT)) fail("FORBIDDEN", "Missing arcade.attempt permission.", 403);
  const organizationId = String(actor.organization_id || "").trim();
  const userId = String(actor.user_id || "").trim();
  if (!organizationId || !userId) fail("SCOPE_MISSING", "Actor organization/user is required.", 403);
  return { organizationId, tenantId: `tenant:${organizationId}`, userId };
}

function declaration(definition: MissionDefinition) {
  if (!definition.multiplayer?.enabled) fail("MISSION_NOT_MULTIPLAYER", "This Mission does not declare multiplayer participation.");
  return definition.multiplayer!;
}

function readiness(definition: MissionDefinition, participants: MissionParticipantRow[]) {
  const multiplayer = definition.multiplayer!;
  const joined = participants.filter((item) => item.status === "JOINED");
  const missingRequiredRoles = multiplayer.roles.filter((role) => role.required && !joined.some((item) => item.missionRole === role.roleId)).map((role) => role.roleId);
  const notReady = joined.filter((item) => !item.ready).length;
  return {
    joinedCount: joined.length,
    readyCount: joined.length - notReady,
    minParticipants: multiplayer.minParticipants,
    maxParticipants: multiplayer.maxParticipants,
    missingRequiredRoles,
    canActivate: joined.length >= multiplayer.minParticipants && missingRequiredRoles.length === 0 && notReady === 0,
  };
}

export class MissionTeamService {
  private readonly presence: MissionPresenceStore;

  constructor(
    private readonly runtime = new MissionRuntimeService(),
    private readonly repo = new MissionTeamRepo(),
    private readonly now: Clock = () => new Date(),
  ) {
    this.presence = new MissionPresenceStore(now);
  }

  private ownerScope(team: MissionTeamRow) {
    return { organizationId: team.organizationId, tenantId: team.tenantId, userId: team.hostUserId };
  }

  // Team lookup is always org/tenant scoped: another organization's team is NOT_FOUND.
  private async teamFor(scope: TeamScope, runtimeId: string) {
    const team = await this.repo.findByRuntime(scope, String(runtimeId || ""));
    if (!team) fail("MISSION_TEAM_NOT_FOUND", "Mission team was not found.", 404);
    return team;
  }

  private async membership(scope: TeamScope & { userId: string }, runtimeId: string) {
    const team = await this.teamFor(scope, runtimeId);
    const participants = await this.repo.listParticipants(team.teamId);
    const self = participants.find((item) => item.userId === scope.userId && item.status === "JOINED");
    return { team, participants, self };
  }

  private validateRole(definition: MissionDefinition, missionRole: unknown, participants: MissionParticipantRow[], excludeParticipantId?: string) {
    const role = definition.multiplayer!.roles.find((item) => item.roleId === missionRole);
    if (!role) fail("MISSION_ROLE_NOT_DECLARED", "Mission role is not declared by this Mission.", 400);
    const seated = participants.filter((item) => item.status === "JOINED" && item.missionRole === role.roleId && item.participantId !== excludeParticipantId).length;
    if (seated >= role.maxParticipants) fail("MISSION_ROLE_FULL", "This mission role is full.");
    return role.roleId;
  }

  // The runtime owner forms the single team around an ACTIVE runtime started canonically.
  async createTeam(actor: MissionRuntimeActor, runtimeId: string, body: { missionRole?: unknown }) {
    const scope = scopeOf(actor);
    const session = await this.runtime.get(actor, runtimeId);
    declaration(session.definitionSnapshot);
    if (session.status !== "ACTIVE") fail("MISSION_RUNTIME_NOT_ACTIVE", "A team can form only around an ACTIVE runtime.");
    const role = this.validateRole(session.definitionSnapshot, body?.missionRole, []);
    const { team } = await this.repo.createTeam({ ...scope, runtimeId: session.id, hostUserId: scope.userId, hostRole: role, runtimeRevision: session.revision });
    return this.view(actor, team.runtimeId);
  }

  async join(actor: MissionRuntimeActor, runtimeId: string, body: { missionRole?: unknown }) {
    const scope = scopeOf(actor);
    const team = await this.teamFor(scope, runtimeId);
    const session = await this.runtime.getScoped(this.ownerScope(team), team.runtimeId);
    const multiplayer = declaration(session.definitionSnapshot);
    if (TERMINAL_RUNTIME.has(session.status)) fail("MISSION_RUNTIME_TERMINAL", "This Mission has ended.");
    await this.repo.withTeamLock(team.teamId, async (tx) => {
      const lateJoinAllowed = tx.team.status === "ACTIVE" && multiplayer.lateJoinPolicy === "ALLOW_WHILE_ACTIVE";
      if (tx.team.status !== "FORMING" && !lateJoinAllowed) fail("MISSION_TEAM_NOT_JOINABLE", "This team is not accepting participants.");
      const existing = tx.participants.find((item) => item.userId === scope.userId);
      if (existing?.status === "REMOVED") fail("MISSION_PARTICIPANT_REMOVED", "This participant was removed from the team.", 403);
      if (existing?.status === "JOINED") {
        // Idempotent rejoin/reconnect: same membership, role unchanged.
        if (body?.missionRole !== undefined && body.missionRole !== existing.missionRole) fail("MISSION_PARTICIPANT_ALREADY_JOINED", "Already joined in another role; change roles explicitly.");
        return;
      }
      const joined = tx.participants.filter((item) => item.status === "JOINED").length;
      if (joined >= multiplayer.maxParticipants) fail("MISSION_TEAM_FULL", "This team is full.");
      const role = this.validateRole(session.definitionSnapshot, body?.missionRole, tx.participants);
      if (existing) {
        await tx.updateParticipant(existing.participantId, { status: "JOINED", missionRole: role, ready: false, rejoin: true });
        await tx.appendEvent("PARTICIPANT_REJOINED", existing.participantId, role, session.revision);
      } else {
        const participantId = await tx.insertParticipant(scope.userId, role);
        await tx.appendEvent("PARTICIPANT_JOINED", participantId, role, session.revision);
      }
    });
    return this.view(actor, team.runtimeId);
  }

  async leave(actor: MissionRuntimeActor, runtimeId: string) {
    const scope = scopeOf(actor);
    const team = await this.teamFor(scope, runtimeId);
    if (team.hostUserId === scope.userId) fail("MISSION_TEAM_HOST_CANNOT_LEAVE", "The host disbands the team instead of leaving.");
    const session = await this.runtime.getScoped(this.ownerScope(team), team.runtimeId);
    await this.repo.withTeamLock(team.teamId, async (tx) => {
      const self = tx.participants.find((item) => item.userId === scope.userId);
      if (!self) fail("MISSION_PARTICIPANT_NOT_FOUND", "Not a participant of this team.", 404);
      if (self.status !== "JOINED") return; // idempotent
      await tx.updateParticipant(self.participantId, { status: "LEFT", ready: false });
      await tx.appendEvent("PARTICIPANT_LEFT", self.participantId, self.missionRole, session.revision);
    });
    return { left: true };
  }

  async setRole(actor: MissionRuntimeActor, runtimeId: string, body: { missionRole?: unknown }) {
    return this.mutateSelf(actor, runtimeId, async (tx, self, session) => {
      if (tx.team.status !== "FORMING") fail("MISSION_TEAM_NOT_FORMING", "Roles change only while the team is forming.");
      if (body?.missionRole === self.missionRole) return;
      const role = this.validateRole(session.definitionSnapshot, body?.missionRole, tx.participants, self.participantId);
      await tx.updateParticipant(self.participantId, { missionRole: role, ready: false });
      await tx.appendEvent("ROLE_ASSIGNED", self.participantId, role, session.revision);
    });
  }

  // Readiness is an explicit declaration, distinct from presence, and never authorization.
  async setReady(actor: MissionRuntimeActor, runtimeId: string, body: { ready?: unknown }) {
    if (typeof body?.ready !== "boolean") fail("MISSION_READY_INVALID", "ready must be boolean.", 400);
    return this.mutateSelf(actor, runtimeId, async (tx, self, session) => {
      if (tx.team.status !== "FORMING") fail("MISSION_TEAM_NOT_FORMING", "Readiness applies while the team is forming.");
      if (self.ready === body.ready) return;
      await tx.updateParticipant(self.participantId, { ready: body.ready as boolean });
      await tx.appendEvent(body.ready ? "PARTICIPANT_READY" : "PARTICIPANT_NOT_READY", self.participantId, self.missionRole, session.revision);
    });
  }

  async activate(actor: MissionRuntimeActor, runtimeId: string) {
    return this.mutateHost(actor, runtimeId, async (tx, session) => {
      if (tx.team.status === "ACTIVE") return;
      if (tx.team.status !== "FORMING") fail("MISSION_TEAM_NOT_FORMING", "Only a forming team can activate.");
      if (session.status !== "ACTIVE") fail("MISSION_RUNTIME_NOT_ACTIVE", "The Mission runtime is not ACTIVE.");
      const state = readiness(session.definitionSnapshot, tx.participants);
      if (!state.canActivate) throw new MissionRuntimeError("MISSION_TEAM_NOT_READY", "The team does not meet its declared readiness rules.", 409, state);
      await tx.updateTeamStatus("ACTIVE");
      await tx.appendEvent("TEAM_ACTIVATED", null, null, session.revision);
    });
  }

  async disband(actor: MissionRuntimeActor, runtimeId: string) {
    return this.mutateHost(actor, runtimeId, async (tx, session) => {
      if (tx.team.status === "DISBANDED") return;
      if (tx.team.status !== "FORMING") fail("MISSION_TEAM_NOT_FORMING", "Only a forming team can be disbanded.");
      for (const participant of tx.participants.filter((item) => item.status === "JOINED")) await tx.updateParticipant(participant.participantId, { ready: false });
      await tx.updateTeamStatus("DISBANDED");
      await tx.appendEvent("TEAM_DISBANDED", null, null, session.revision);
    });
  }

  // Minimal, server-authorized removal by the host (no moderation system).
  async removeParticipant(actor: MissionRuntimeActor, runtimeId: string, participantId: string) {
    return this.mutateHost(actor, runtimeId, async (tx, session) => {
      const target = tx.participants.find((item) => item.participantId === participantId);
      if (!target) fail("MISSION_PARTICIPANT_NOT_FOUND", "Participant was not found.", 404);
      if (target.userId === tx.team.hostUserId) fail("MISSION_TEAM_HOST_CANNOT_LEAVE", "The host cannot remove themselves.");
      if (target.status === "REMOVED") return;
      await tx.updateParticipant(target.participantId, { status: "REMOVED", ready: false });
      await tx.appendEvent("PARTICIPANT_REMOVED", target.participantId, target.missionRole, session.revision);
    });
  }

  // Ephemeral connection presence. Never changes membership, role or readiness.
  async recordPresence(actor: MissionRuntimeActor, runtimeId: string, body: { state?: unknown }) {
    const scope = scopeOf(actor);
    if (!MISSION_PRESENCE_STATES.includes(body?.state as MissionPresenceState)) fail("MISSION_PRESENCE_INVALID", "Presence state is invalid.", 400);
    const { team, self } = await this.membership(scope, runtimeId);
    if (!self) fail("MISSION_PARTICIPANT_NOT_FOUND", "Not a participant of this team.", 404);
    this.presence.record(team.teamId, self.participantId, body.state as MissionPresenceState);
    return { participantId: self.participantId, presence: this.presence.read(team.teamId, self.participantId) };
  }

  // A learner action in a team Mission. Participant and role come from server state; Mission Runtime
  // applies CAS, declared-event validation, the canonical condition engine and idempotency.
  async submitAction(actor: MissionRuntimeActor, runtimeId: string, body: { expectedRevision?: unknown; eventType?: unknown; payload?: unknown; idempotencyKey?: unknown }) {
    const scope = scopeOf(actor);
    const { team, self } = await this.membership(scope, runtimeId);
    if (!self) fail("MISSION_PARTICIPANT_NOT_FOUND", "Not a participant of this team.", 404);
    if (team.status !== "ACTIVE") fail("MISSION_TEAM_NOT_ACTIVE", "Team actions are accepted only while the team is ACTIVE.");
    const result = await this.runtime.appendParticipantEvent(this.ownerScope(team), team.runtimeId, {
      expectedRevision: body?.expectedRevision, eventType: body?.eventType, payload: body?.payload ?? {},
      participant: { participantId: self.participantId, missionRole: self.missionRole }, actionKey: body?.idempotencyKey,
    });
    if (TERMINAL_RUNTIME.has(result.session.status)) await this.completeIfTerminal(team);
    return { replayed: result.replayed, eventSequence: result.event?.sequence ?? null, runtime: this.runtimeSummary(result.session) };
  }

  private async completeIfTerminal(team: MissionTeamRow) {
    const session = await this.runtime.getScoped(this.ownerScope(team), team.runtimeId);
    if (!TERMINAL_RUNTIME.has(session.status)) return;
    await this.repo.withTeamLock(team.teamId, async (tx) => {
      if (tx.team.status !== "ACTIVE") return;
      await tx.updateTeamStatus("COMPLETED");
      await tx.appendEvent("TEAM_COMPLETED", null, null, session.revision);
    });
  }

  private runtimeSummary(session: MissionRuntimeSession) {
    return { status: session.status, revision: session.revision, objectiveStates: session.objectiveStates, stageStates: session.stageStates };
  }

  // Participant-safe team view: participant IDs and mission roles only — no user IDs, emails, profiles or accommodations.
  async view(actor: MissionRuntimeActor, runtimeId: string) {
    const scope = scopeOf(actor);
    const { team, participants, self } = await this.membership(scope, runtimeId);
    const isHost = team.hostUserId === scope.userId;
    if (!self && !isHost) fail("MISSION_TEAM_NOT_FOUND", "Mission team was not found.", 404);
    if (team.status === "ACTIVE") await this.completeIfTerminal(team);
    const current = (await this.teamFor(scope, runtimeId));
    const session = await this.runtime.getScoped(this.ownerScope(current), current.runtimeId);
    const events = await this.runtime.listEventsScoped(this.ownerScope(current), current.runtimeId);
    const actions = events.filter((event) => (event.payload?.[PARTICIPANT_ATTRIBUTION_KEY] as any)?.attributedBy === "MISSION_TEAM");
    return {
      team: {
        teamId: current.teamId, status: current.status, missionId: session.missionId, missionVersion: session.missionVersion,
        readiness: readiness(session.definitionSnapshot, participants),
        declaredRoles: session.definitionSnapshot.multiplayer!.roles.map((role) => ({ roleId: role.roleId, label: role.label, required: role.required, maxParticipants: role.maxParticipants })),
      },
      self: self ? { participantId: self.participantId, missionRole: self.missionRole, ready: self.ready, isHost } : null,
      participants: participants.filter((item) => item.status === "JOINED").map((item) => ({
        participantId: item.participantId, missionRole: item.missionRole, ready: item.ready, presence: this.presence.read(current.teamId, item.participantId),
        isHost: item.userId === current.hostUserId,
      })),
      runtime: this.runtimeSummary(session),
      // Learner team actions only; runtime-owned projections (world context, accommodation) are never shown to teammates.
      recentActions: actions.slice(-RECENT_ACTIONS_LIMIT).map((event) => {
        const participant = event.payload[PARTICIPANT_ATTRIBUTION_KEY] as any;
        return { sequence: event.sequence, eventType: event.eventType, participantId: participant.participantId, missionRole: participant.missionRole };
      }),
    };
  }

  // Replay/audit: the team-lifecycle history in order, with its relation to runtime revisions.
  async history(actor: MissionRuntimeActor, runtimeId: string) {
    const scope = scopeOf(actor);
    const { team, self } = await this.membership(scope, runtimeId);
    if (!self && team.hostUserId !== scope.userId) fail("MISSION_TEAM_NOT_FOUND", "Mission team was not found.", 404);
    return this.repo.listEvents(team.teamId);
  }

  private async mutateSelf(actor: MissionRuntimeActor, runtimeId: string, fn: (tx: TeamTx, self: MissionParticipantRow, session: MissionRuntimeSession) => Promise<void>) {
    const scope = scopeOf(actor);
    const team = await this.teamFor(scope, runtimeId);
    const session = await this.runtime.getScoped(this.ownerScope(team), team.runtimeId);
    await this.repo.withTeamLock(team.teamId, async (tx) => {
      const self = tx.participants.find((item) => item.userId === scope.userId && item.status === "JOINED");
      if (!self) fail("MISSION_PARTICIPANT_NOT_FOUND", "Not a participant of this team.", 404);
      await fn(tx, self, session);
    });
    return this.view(actor, team.runtimeId);
  }

  private async mutateHost(actor: MissionRuntimeActor, runtimeId: string, fn: (tx: TeamTx, session: MissionRuntimeSession) => Promise<void>) {
    const scope = scopeOf(actor);
    const team = await this.teamFor(scope, runtimeId);
    if (team.hostUserId !== scope.userId) fail("MISSION_TEAM_HOST_REQUIRED", "Only the team host may do this.", 403);
    const session = await this.runtime.getScoped(this.ownerScope(team), team.runtimeId);
    await this.repo.withTeamLock(team.teamId, (tx) => fn(tx, session));
    return this.view(actor, team.runtimeId);
  }

  // Read-only bounded projection for MOL / future MOCC: counts, role distribution, presence summary,
  // Mission status and canonical environment references. No learner identity or accommodation data.
  async operationalProjection(scope: TeamScope) {
    const teams = await this.repo.listOperational(scope);
    const rows = [];
    for (const team of teams) {
      const session = await this.runtime.getScoped(this.ownerScope(team), team.runtimeId);
      const joined = (await this.repo.listParticipants(team.teamId)).filter((item) => item.status === "JOINED");
      const roleDistribution: Record<string, number> = {};
      const presenceSummary: Record<MissionPresenceState, number> = { ONLINE: 0, AWAY: 0, DISCONNECTED: 0 };
      for (const participant of joined) {
        roleDistribution[participant.missionRole] = (roleDistribution[participant.missionRole] ?? 0) + 1;
        presenceSummary[this.presence.read(team.teamId, participant.participantId)] += 1;
      }
      rows.push({
        teamRef: team.teamId, missionId: session.missionId, missionVersion: session.missionVersion, teamStatus: team.status,
        missionStatus: session.status, participantCount: joined.length, roleDistribution, presenceSummary,
        environmentRefs: session.definitionSnapshot.environmentRefs.map((ref) => ({ system: ref.system, environmentId: ref.environmentId })),
      });
    }
    return { ...MISSION_TEAM_OPERATIONAL_CONTRACT, teams: rows };
  }
}

export interface MissionTeamDirectorSummary {
  teamStatus: string;
  teamSize: number;
  rolesPresent: string[];
  readyCount: number;
}

// Minimal team summary for the Director executor: counts and declared role IDs only — no participant
// identities, accommodations or profile data. Null for single-player Missions.
export async function missionTeamDirectorSummary(session: MissionRuntimeSession, repo = new MissionTeamRepo()): Promise<MissionTeamDirectorSummary | null> {
  if (!session.definitionSnapshot.multiplayer) return null;
  const team = await repo.findByRuntime({ organizationId: session.organizationId, tenantId: session.tenantId }, session.id);
  if (!team) return { teamStatus: "NONE", teamSize: 0, rolesPresent: [], readyCount: 0 };
  const joined = (await repo.listParticipants(team.teamId)).filter((item) => item.status === "JOINED");
  return {
    teamStatus: team.status, teamSize: joined.length,
    rolesPresent: [...new Set(joined.map((item) => item.missionRole))].sort(), readyCount: joined.filter((item) => item.ready).length,
  };
}
