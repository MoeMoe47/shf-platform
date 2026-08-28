import assert from "node:assert/strict";
import test from "node:test";
import { applyActiveOrganizationContext } from "../src/auth/organization-context";
import { tenantIdForOrganization } from "../src/auth/tenant-context";
import { requirePermission } from "../src/auth/permission-guard";
import {
  ORGANIZATION_RELATIONSHIP_STATUSES,
  ORGANIZATION_RELATIONSHIP_TYPES,
  OrganizationRelationshipService,
} from "../src/domain/organization-relationships/service/organization-relationship-service";
import {
  OrganizationRelationshipConflictError,
  toOrganizationRelationshipResponse,
} from "../src/domain/organization-relationships/model/organization-relationship";
import { ProgramService } from "../src/domain/programs/service/program-service";

function membership(organizationId: string, role: string, extra: Record<string, unknown> = {}) {
  return {
    membership_id: `mem-${organizationId}-${role}`,
    organization_id: organizationId,
    tenant_id: tenantIdForOrganization(organizationId),
    role,
    status: "active",
    organization_status: "active",
    ...extra,
  };
}

function actor(organizationId: string, role = "org_admin") {
  return applyActiveOrganizationContext({
    user_id: `user-${organizationId}-${role}`,
    memberships: [membership(organizationId, role)],
  });
}

function platformActor(activeOrganizationId: string) {
  return applyActiveOrganizationContext({
    user_id: "platform-user",
    organization_id: "shs-core",
    memberships: [membership("shs-core", "super_admin", { role_scope_type: "platform" })],
  }, activeOrganizationId);
}

function stewardshipRepo(programs: any[] = []) {
  return {
    async listPrograms(scope: any) {
      return programs.filter((program) => [
        program.organization_id,
        program.owner_organization_id,
        program.operator_organization_id,
        program.accountable_organization_id,
      ].includes(scope.organization_id));
    },
    async getProgramById(id: string, scope: any) {
      return (await this.listPrograms(scope)).find((program: any) => program.program_id === id) || null;
    },
    async createProgram(input: any) {
      programs.push(input);
      return input;
    },
    async getProgramForTransition(id: string, scope: any) {
      const program = programs.find((item) =>
        item.program_id === id &&
        [item.operator_organization_id || item.organization_id, item.accountable_organization_id || item.organization_id].includes(scope.organization_id)
      );
      return program ? { ...program } : null;
    },
    async updateProgramStatus(id: string, status: string, scope: any, expectedStatus: string) {
      const program = programs.find((item) =>
        item.program_id === id &&
        item.status === expectedStatus &&
        [item.operator_organization_id || item.organization_id, item.accountable_organization_id || item.organization_id].includes(scope.organization_id)
      );
      if (!program) return null;
      program.status = status;
      return { ...program };
    },
  };
}

function relationshipRepo(relationships: any[] = []) {
  return {
    async listRelationshipsForOrganization(organizationId: string) {
      return relationships.filter((item) => item.source_organization_id === organizationId || item.target_organization_id === organizationId);
    },
    async getRelationshipById(id: string, scope: any) {
      const relationship = relationships.find((item) =>
        item.relationship_id === id &&
        (scope.platform_global || item.source_organization_id === scope.organization_id || item.target_organization_id === scope.organization_id)
      );
      return relationship ? { ...relationship } : null;
    },
    async createRelationship(input: any) {
      relationships.push(input);
      return input;
    },
    async updateRelationshipStatus(id: string, status: string, expectedStatus: string, actorId: string, scope: any) {
      const item = relationships.find((relationship) =>
        relationship.relationship_id === id &&
        relationship.status === expectedStatus &&
        (scope.platform_global || relationship.source_organization_id === scope.organization_id || relationship.target_organization_id === scope.organization_id)
      );
      if (!item) return null;
      item.status = status;
      item.updated_by = actorId;
      item.metadata_version = (item.metadata_version || 1) + 1;
      return { ...item };
    },
    async findActiveRelationship(source: string, target: string, type: string, now = new Date()) {
      return relationships.find((item) =>
        item.source_organization_id === source &&
        item.target_organization_id === target &&
        item.relationship_type === type &&
        item.status === ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE &&
        new Date(item.effective_from) <= now &&
        (!item.effective_to || new Date(item.effective_to) >= now)
      ) || null;
    },
  };
}

function auditLog(events: any[] = []) {
  return async (event: any) => {
    events.push(event);
    return event;
  };
}

function relationshipService(activePairs: Array<[string, string, string]> = []) {
  return {
    async hasActiveRelationship(source: string, target: string, type: string) {
      return activePairs.some(([s, t, relType]) => s === source && t === target && relType === type);
    },
  };
}

test("SHF-owned program owner and operator resolve separately", async () => {
  const service = new ProgramService(stewardshipRepo() as any, relationshipService() as any);
  const created = await service.createProgram({
    name: "Core Program",
    program_type: "education",
    program_classification: "SHF_OWNED",
  }, actor("org-shf"));

  assert.equal(created.program_classification, "SHF_OWNED");
  assert.equal(created.owner_organization_id, "org-shf");
  assert.equal(created.operator_organization_id, "org-shf");
  assert.equal(created.accountable_organization_id, "org-shf");
});

test("SHF-incubated program classification is represented without legal independence", async () => {
  const service = new ProgramService(stewardshipRepo() as any, relationshipService([
    ["org-shf", "org-incubated", ORGANIZATION_RELATIONSHIP_TYPES.INCUBATES],
  ]) as any);
  const created = await service.createProgram({
    name: "Incubator Pilot",
    program_type: "education",
    program_classification: "SHF_INCUBATED",
    owner_organization_id: "org-shf",
    operator_organization_id: "org-incubated",
    accountable_organization_id: "org-shf",
  }, actor("org-shf"));

  assert.equal(created.program_classification, "SHF_INCUBATED");
  assert.equal(created.owner_organization_id, "org-shf");
  assert.equal(created.operator_organization_id, "org-incubated");
});

test("independent network organization retains isolated program authority", async () => {
  const repo = stewardshipRepo([{ program_id: "prog-independent", organization_id: "org-independent", owner_organization_id: "org-independent", operator_organization_id: "org-independent", accountable_organization_id: "org-independent" }]);
  const service = new ProgramService(repo as any, relationshipService([
    ["org-independent", "org-shf", ORGANIZATION_RELATIONSHIP_TYPES.NETWORK_MEMBER_OF],
  ]) as any);

  assert.equal((await service.getProgram("prog-independent", actor("org-independent")))?.program_id, "prog-independent");
  assert.equal(await service.getProgram("prog-independent", actor("org-shf")), null);
});

test("owner organization may differ from operator organization only through active stewardship relationship", async () => {
  const service = new ProgramService(stewardshipRepo() as any, relationshipService([
    ["org-operator", "org-owner", ORGANIZATION_RELATIONSHIP_TYPES.OPERATES_FOR],
  ]) as any);
  const created = await service.createProgram({
    name: "Operated Service",
    program_type: "workforce",
    program_classification: "SHF_OWNED",
    owner_organization_id: "org-owner",
    operator_organization_id: "org-operator",
    accountable_organization_id: "org-owner",
  }, actor("org-owner"));

  assert.equal(created.owner_organization_id, "org-owner");
  assert.equal(created.operator_organization_id, "org-operator");
});

test("owner authority does not automatically become operator authority", async () => {
  const repo = stewardshipRepo([{ program_id: "prog-operated", organization_id: "org-owner", owner_organization_id: "org-owner", operator_organization_id: "org-operator", accountable_organization_id: "org-operator", status: "draft" }]);
  const service = new ProgramService(repo as any, relationshipService() as any, auditLog());

  await assert.rejects(() => service.transitionProgram("prog-operated", "active", actor("org-owner")), /Program not found/);
});

test("operator authority does not automatically become owner authority", async () => {
  const service = new ProgramService(stewardshipRepo() as any, relationshipService([
    ["org-operator", "org-owner", ORGANIZATION_RELATIONSHIP_TYPES.OPERATES_FOR],
  ]) as any);

  await assert.rejects(() => service.createProgram({
    name: "Spoofed Owner",
    program_type: "workforce",
    owner_organization_id: "org-owner",
    operator_organization_id: "org-operator",
  }, actor("org-operator")), /program_owner_scope_forbidden/);
});

test("network membership grants no implicit administration", async () => {
  const service = new ProgramService(stewardshipRepo() as any, relationshipService([
    ["org-independent", "org-shf", ORGANIZATION_RELATIONSHIP_TYPES.NETWORK_MEMBER_OF],
  ]) as any);

  await assert.rejects(() => service.createProgram({
    name: "Network Admin Spoof",
    program_type: "education",
    owner_organization_id: "org-independent",
  }, actor("org-shf")), /program_owner_scope_forbidden/);
});

test("incubation grants no implicit cross-organization access", async () => {
  const repo = stewardshipRepo([{ program_id: "prog-incubated", organization_id: "org-shf", owner_organization_id: "org-shf", operator_organization_id: "org-incubated", accountable_organization_id: "org-incubated", status: "draft" }]);
  const service = new ProgramService(repo as any, relationshipService([
    ["org-shf", "org-incubated", ORGANIZATION_RELATIONSHIP_TYPES.INCUBATES],
  ]) as any);

  assert.equal(await service.getProgram("prog-incubated", actor("org-unrelated")), null);
});

test("active authorized relationship is recognized for stewardship", async () => {
  const service = new ProgramService(stewardshipRepo() as any, relationshipService([
    ["org-shf", "org-incubated", ORGANIZATION_RELATIONSHIP_TYPES.INCUBATES],
  ]) as any);

  const created = await service.createProgram({
    name: "Recognized",
    program_type: "education",
    program_classification: "SHF_INCUBATED",
    owner_organization_id: "org-shf",
    operator_organization_id: "org-incubated",
  }, actor("org-shf"));
  assert.equal(created.operator_organization_id, "org-incubated");
});

test("suspended relationship grants no authority", async () => {
  const service = new OrganizationRelationshipService({
    async findActiveRelationship() {
      return { status: ORGANIZATION_RELATIONSHIP_STATUSES.SUSPENDED, effective_from: new Date(Date.now() - 1000), effective_to: null };
    },
  } as any);
  assert.equal(await service.hasActiveRelationship("org-a", "org-b", ORGANIZATION_RELATIONSHIP_TYPES.OPERATES_FOR), false);
});

test("ended relationship grants no authority", async () => {
  const service = new OrganizationRelationshipService({
    async findActiveRelationship() {
      return { status: ORGANIZATION_RELATIONSHIP_STATUSES.ENDED, effective_from: new Date(Date.now() - 2000), effective_to: new Date(Date.now() - 1000) };
    },
  } as any);
  assert.equal(await service.hasActiveRelationship("org-a", "org-b", ORGANIZATION_RELATIONSHIP_TYPES.OPERATES_FOR), false);
});

test("future relationship grants no current authority", async () => {
  const service = new OrganizationRelationshipService({
    async findActiveRelationship() {
      return { status: ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE, effective_from: new Date(Date.now() + 100000), effective_to: null };
    },
  } as any);
  assert.equal(await service.hasActiveRelationship("org-a", "org-b", ORGANIZATION_RELATIONSHIP_TYPES.OPERATES_FOR), false);
});

test("unknown relationship type fails closed", async () => {
  const service = new OrganizationRelationshipService({ async createRelationship(input: any) { return input; } } as any);
  await assert.rejects(() => service.createRelationship({
    source_organization_id: "org-a",
    target_organization_id: "org-b",
    relationship_type: "RELATED",
  }, actor("org-a")), /unknown_relationship_type/);
});

test("unauthorized relationship creation is denied", async () => {
  const service = new OrganizationRelationshipService({ async createRelationship(input: any) { return input; } } as any);
  await assert.rejects(() => service.createRelationship({
    source_organization_id: "org-a",
    target_organization_id: "org-b",
    relationship_type: ORGANIZATION_RELATIONSHIP_TYPES.OPERATES_FOR,
  }, actor("org-a", "read_only_viewer")), /relationship_permission_required/);
});

test("browser-supplied organization relationship is rejected when no server relationship exists", async () => {
  const service = new ProgramService(stewardshipRepo() as any, relationshipService() as any);
  await assert.rejects(() => service.createProgram({
    name: "Browser Claim",
    program_type: "education",
    owner_organization_id: "org-owner",
    operator_organization_id: "org-operator",
    relationships: [{ relationship_type: ORGANIZATION_RELATIONSHIP_TYPES.OPERATES_FOR, status: "ACTIVE" }],
  }, actor("org-owner")), /program_operator_relationship_required/);
});

test("cross-organization program read is denied", async () => {
  const service = new ProgramService(stewardshipRepo([{ program_id: "prog-a", organization_id: "org-a", owner_organization_id: "org-a", operator_organization_id: "org-a", accountable_organization_id: "org-a" }]) as any);
  assert.equal(await service.getProgram("prog-a", actor("org-b")), null);
});

test("cross-organization program mutation is denied", async () => {
  const service = new ProgramService(stewardshipRepo([{ program_id: "prog-a", organization_id: "org-a", owner_organization_id: "org-a", operator_organization_id: "org-a", accountable_organization_id: "org-a", status: "draft" }]) as any);
  await assert.rejects(() => service.transitionProgram("prog-a", "active", actor("org-b")), /Program not found/);
});

test("explicit narrowly scoped operator authority succeeds", async () => {
  const service = new ProgramService(stewardshipRepo([{ program_id: "prog-op", organization_id: "org-owner", owner_organization_id: "org-owner", operator_organization_id: "org-operator", accountable_organization_id: "org-operator", status: "draft" }]) as any, relationshipService() as any, auditLog());
  const updated = await service.transitionProgram("prog-op", "active", actor("org-operator"));
  assert.equal(updated.status, "active");
});

test("authorized relationship source and target can read by id while unrelated org is concealed", async () => {
  const service = new OrganizationRelationshipService(relationshipRepo([{
    relationship_id: "rel-1",
    source_organization_id: "org-a",
    target_organization_id: "org-b",
    relationship_type: ORGANIZATION_RELATIONSHIP_TYPES.OPERATES_FOR,
    status: ORGANIZATION_RELATIONSHIP_STATUSES.PROPOSED,
    effective_from: new Date(Date.now() - 1000),
    effective_to: null,
    metadata_version: 1,
  }]) as any, auditLog());
  assert.equal((await service.getRelationship("rel-1", actor("org-a")))?.relationship_id, "rel-1");
  assert.equal((await service.getRelationship("rel-1", actor("org-b")))?.relationship_id, "rel-1");
  assert.equal(await service.getRelationship("rel-1", actor("org-c")), null);
  assert.equal(await service.getRelationship("missing", actor("org-a")), null);
});

test("relationship read requires authentication scope and view permission", async () => {
  const service = new OrganizationRelationshipService(relationshipRepo() as any, auditLog());
  await assert.rejects(() => service.getRelationship("rel-1", null), /relationship_scope_missing/);
  await assert.rejects(() => service.getRelationship("rel-1", actor("org-a", "operator")), /relationship_permission_required/);
});

test("relationship lifecycle transitions are authoritative, atomic, and audited", async () => {
  const events: any[] = [];
  const relationship = {
    relationship_id: "rel-transition",
    source_organization_id: "org-a",
    target_organization_id: "org-b",
    relationship_type: ORGANIZATION_RELATIONSHIP_TYPES.OPERATES_FOR,
    status: ORGANIZATION_RELATIONSHIP_STATUSES.PROPOSED,
    effective_from: new Date(Date.now() - 1000),
    effective_to: null,
    metadata_version: 1,
  };
  const service = new OrganizationRelationshipService(relationshipRepo([relationship]) as any, auditLog(events));
  assert.equal((await service.transitionRelationship("rel-transition", ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE, actor("org-a")))?.status, ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE);
  assert.equal((await service.transitionRelationship("rel-transition", ORGANIZATION_RELATIONSHIP_STATUSES.SUSPENDED, actor("org-a")))?.status, ORGANIZATION_RELATIONSHIP_STATUSES.SUSPENDED);
  assert.equal((await service.transitionRelationship("rel-transition", ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE, actor("org-a")))?.status, ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE);
  assert.equal((await service.transitionRelationship("rel-transition", ORGANIZATION_RELATIONSHIP_STATUSES.ENDED, actor("org-a")))?.status, ORGANIZATION_RELATIONSHIP_STATUSES.ENDED);
  await assert.rejects(() => service.transitionRelationship("rel-transition", ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE, actor("org-a")), /invalid_relationship_transition:ENDED->ACTIVE/);
  assert.equal(events.length, 4);
  assert.equal(events[0].action_type, "organization_relationship.transitioned");
  assert.equal(events[0].previous_state_json.status, ORGANIZATION_RELATIONSHIP_STATUSES.PROPOSED);
  assert.equal(events[0].new_state_json.status, ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE);
  assert.equal(events[0].previous_state_json.relationship_id, "rel-transition");
  assert.equal(events[0].previous_state_json.tenant_id, "tenant:org-a");
});

test("illegal, unknown, stale, and spoofed relationship transitions fail closed", async () => {
  const relationship = {
    relationship_id: "rel-guarded",
    source_organization_id: "org-a",
    target_organization_id: "org-b",
    relationship_type: ORGANIZATION_RELATIONSHIP_TYPES.OPERATES_FOR,
    status: ORGANIZATION_RELATIONSHIP_STATUSES.PROPOSED,
    effective_from: new Date(Date.now() - 1000),
    effective_to: null,
    metadata_version: 1,
  };
  const service = new OrganizationRelationshipService(relationshipRepo([relationship]) as any, auditLog());
  await assert.rejects(() => service.transitionRelationship("rel-guarded", ORGANIZATION_RELATIONSHIP_STATUSES.SUSPENDED, actor("org-a")), /invalid_relationship_transition:PROPOSED->SUSPENDED/);
  await assert.rejects(() => service.transitionRelationship("rel-guarded", "UNKNOWN", actor("org-a")), /unknown_relationship_status/);
  assert.equal(await service.transitionRelationship("rel-guarded", ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE, actor("org-c")), null);

  const staleService = new OrganizationRelationshipService({
    async getRelationshipById() { return { ...relationship }; },
    async updateRelationshipStatus() { return null; },
  } as any, auditLog());
  await assert.rejects(() => staleService.transitionRelationship("rel-guarded", ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE, actor("org-a")), /relationship_transition_conflict/);
});

test("concurrent relationship transition permits only one success from the original state", async () => {
  const relationship = {
    relationship_id: "rel-race",
    source_organization_id: "org-a",
    target_organization_id: "org-b",
    relationship_type: ORGANIZATION_RELATIONSHIP_TYPES.OPERATES_FOR,
    status: ORGANIZATION_RELATIONSHIP_STATUSES.PROPOSED,
    effective_from: new Date(Date.now() - 1000),
    effective_to: null,
    metadata_version: 1,
  };
  const service = new OrganizationRelationshipService(relationshipRepo([relationship]) as any, auditLog());
  const first = await service.transitionRelationship("rel-race", ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE, actor("org-a"));
  await assert.rejects(() => service.transitionRelationship("rel-race", ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE, actor("org-a")), /invalid_relationship_transition:ACTIVE->ACTIVE/);
  assert.equal(first?.status, ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE);
});

test("program transition uses authoritative stored status and audits before and after", async () => {
  const events: any[] = [];
  const service = new ProgramService(stewardshipRepo([{ program_id: "prog-auth", organization_id: "org-a", owner_organization_id: "org-a", operator_organization_id: "org-a", accountable_organization_id: "org-a", status: "paused" }]) as any, relationshipService() as any, auditLog(events));
  const updated = await service.transitionProgram("prog-auth", "closed", actor("org-a"), "complete");
  assert.equal(updated.status, "closed");
  assert.equal(events[0].action_type, "program.transitioned");
  assert.equal(events[0].previous_state_json.status, "paused");
  assert.equal(events[0].new_state_json.status, "closed");
  assert.equal(events[0].previous_state_json.program_id, "prog-auth");
  assert.equal(events[0].new_state_json.tenant_id, "tenant:org-a");
});

test("false client current status cannot bypass authoritative program rules", async () => {
  const service = new ProgramService(stewardshipRepo([{ program_id: "prog-auth", organization_id: "org-a", owner_organization_id: "org-a", operator_organization_id: "org-a", accountable_organization_id: "org-a", status: "closed" }]) as any, relationshipService() as any, auditLog());
  await assert.rejects(() => service.transitionProgram("prog-auth", "active", actor("org-a")), /Invalid program transition: closed -> active/);
});

test("stale program compare-and-set transition returns conflict", async () => {
  const repo = {
    async getProgramForTransition() {
      return { program_id: "prog-stale", organization_id: "org-a", owner_organization_id: "org-a", operator_organization_id: "org-a", accountable_organization_id: "org-a", status: "draft" };
    },
    async updateProgramStatus() {
      return null;
    },
  };
  const service = new ProgramService(repo as any, relationshipService() as any, auditLog());
  await assert.rejects(() => service.transitionProgram("prog-stale", "active", actor("org-a")), /program_transition_conflict/);
});

test("concurrent program transition permits only one success from the original state", async () => {
  const program = { program_id: "prog-race", organization_id: "org-a", owner_organization_id: "org-a", operator_organization_id: "org-a", accountable_organization_id: "org-a", status: "draft" };
  const repo = {
    async getProgramForTransition() {
      return { ...program };
    },
    async updateProgramStatus(_id: string, status: string, _scope: any, expectedStatus: string) {
      if (program.status !== expectedStatus) return null;
      program.status = status;
      return { ...program };
    },
  };
  const service = new ProgramService(repo as any, relationshipService() as any, auditLog());
  const first = await service.transitionProgram("prog-race", "active", actor("org-a"));
  await assert.rejects(() => service.transitionProgram("prog-race", "active", actor("org-a")), /Invalid program transition: active -> active/);
  assert.equal(first.status, "active");
});

test("Phase 1 role isolation remains intact", () => {
  const scoped = applyActiveOrganizationContext({
    user_id: "multi",
    memberships: [membership("org-a", "org_admin"), membership("org-b", "read_only_viewer")],
  }, "org-b");
  assert.equal(scoped.permissions.includes("program.create"), false);
});

test("tenant and organization scope remain preserved", () => {
  const scoped = actor("org-a");
  assert.equal(scoped.active_organization_id, "org-a");
  assert.equal(scoped.tenant_id, "tenant:org-a");
});

test("platform-global roles remain explicit", () => {
  const scoped = platformActor("org-b");
  assert.equal(scoped.active_organization_id, "org-b");
  assert.ok(scoped.permissions.includes("organization.relationship.manage"));
});

test("permission guard still fails closed before relationship routes", () => {
  const req: any = { user: { org_context_error: "ORG_CONTEXT_REQUIRED", permissions: ["organization.relationship.manage"] } };
  let statusCode = 0;
  const res: any = {
    status(code: number) { statusCode = code; return this; },
    json(payload: any) { this.payload = payload; return this; },
  };
  requirePermission("organization.relationship.manage")(req, res, () => {
    throw new Error("next should not run");
  });
  assert.equal(statusCode, 403);
});

test("ordinary organization relationship API projection excludes persistence and audit internals", () => {
  const projected = toOrganizationRelationshipResponse({
    relationship_id: "rel-safe",
    source_organization_id: "org-a",
    target_organization_id: "org-b",
    relationship_type: ORGANIZATION_RELATIONSHIP_TYPES.OPERATES_FOR,
    status: ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE,
    effective_from: "2026-01-01T00:00:00.000Z",
    effective_to: null,
    created_by: "user-a",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_by: "user-b",
    updated_at: "2026-01-02T00:00:00.000Z",
    metadata_version: 9,
  });

  assert.deepEqual(Object.keys(projected).sort(), [
    "effective_from",
    "effective_to",
    "relationship_id",
    "relationship_type",
    "source_organization_id",
    "status",
    "target_organization_id",
  ]);
  assert.equal("created_by" in projected, false);
  assert.equal("created_at" in projected, false);
  assert.equal("updated_by" in projected, false);
  assert.equal("updated_at" in projected, false);
  assert.equal("metadata_version" in projected, false);
});

test("relationship active-overlap conflict uses safe public message", () => {
  const error = new OrganizationRelationshipConflictError();
  assert.equal(error.statusCode, 409);
  assert.equal(error.message, "An overlapping active organization relationship already exists.");
  assert.doesNotMatch(error.message, /constraint|SQLSTATE|conflicting key|organization_relationship_no_active_overlap/i);
});
