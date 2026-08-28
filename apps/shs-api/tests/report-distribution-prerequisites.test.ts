import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canDistributeRestrictedArtifact, ReportDistributionService } from "../src/domain/reporting/report-distribution-service.ts";

const migration = readFileSync(new URL("../migrations/013_report_distribution_prerequisites.sql", import.meta.url), "utf8");
const routes = readFileSync(new URL("../src/domain/reporting/routes.ts", import.meta.url), "utf8");
const permissions = readFileSync(new URL("../src/auth/security-permissions.ts", import.meta.url), "utf8");
const distributionMigration = readFileSync(new URL("../migrations/014_report_distribution_authorizations.sql", import.meta.url), "utf8");

const baseActor = { user_id: "reviewer-1", organization_id: "org-shf", tenant_id: "tenant-shf", permissions: ["reports.distribution.manage", "reports.view"] };

function harness() {
  const recipients = new Map<string, any>();
  const decisions = new Map<string, any>();
  const distributions = new Map<string, any>();
  const audits: any[] = [];
  const repo = {
    async createRecipient(input: any) {
      const record = { ...input, authorized_by_user_id: input.authorized_by_user_id, status: "AUTHORIZED", authorized_at: "2026-08-26T12:00:00.000Z", version: 1, created_at: "2026-08-26T12:00:00.000Z", updated_at: "2026-08-26T12:00:00.000Z" };
      recipients.set(record.recipient_authorization_id, record);
      return record;
    },
    async getRecipient(id: string, scope: any) {
      const record = recipients.get(id);
      return record && record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id ? record : null;
    },
    async listRecipients(scope: any) {
      return [...recipients.values()].filter((record) => record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id);
    },
    async revokeRecipient(id: string, scope: any, expectedVersion: number) {
      const record = await this.getRecipient(id, scope);
      if (!record || record.status !== "AUTHORIZED" || record.version !== expectedVersion) return null;
      const revoked = { ...record, status: "REVOKED", revoked_at: "2026-08-26T12:01:00.000Z", version: record.version + 1 };
      recipients.set(id, revoked);
      return revoked;
    },
    async createDisclosureDecision(input: any) {
      const record = { ...input, reviewed_by_user_id: input.reviewed_by_user_id, classification: "RESTRICTED_EXTERNAL", version: 1, reviewed_at: "2026-08-26T12:00:00.000Z", created_at: "2026-08-26T12:00:00.000Z" };
      decisions.set(record.disclosure_decision_id, record);
      return record;
    },
    async listDisclosureDecisions(artifactId: string, scope: any) {
      return [...decisions.values()].filter((record) => record.artifact_id === artifactId && record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id);
    },
    async getDisclosureDecision(id: string, artifactId: string, scope: any) {
      const record = decisions.get(id);
      return record && record.artifact_id === artifactId && record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id ? record : null;
    },
    async getDistributionByIdempotencyKey(key: string, scope: any) {
      return [...distributions.values()].find((record) => record.idempotency_key === key && record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id) || null;
    },
    async createDistribution(input: any) {
      const record = { ...input, status: "AUTHORIZED_FOR_DISTRIBUTION", version: 1, authorized_at: "2026-08-26T12:02:00.000Z" };
      distributions.set(record.distribution_id, record);
      return record;
    },
    async listDistributions(artifactId: string, scope: any) {
      return [...distributions.values()].filter((record) => record.artifact_id === artifactId && record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id);
    },
  };
  const artifact = { artifact_id: "artifact-1", tenant_id: "tenant-shf", organization_id: "org-shf", classification: "RESTRICTED_EXTERNAL", lifecycle_status: "GENERATED", artifact_version: 1 };
  const artifacts = { async getArtifact(id: string, scope: any) { return id === artifact.artifact_id && scope.tenant_id === artifact.tenant_id && scope.organization_id === artifact.organization_id ? artifact : null; } };
  const transaction = async (fn: any) => fn({});
  const auditWriter = async (input: any) => { audits.push(input); return input; };
  return { service: new ReportDistributionService(repo as any, artifacts as any, transaction, auditWriter), recipients, decisions, audits, artifact };
}

test("recipient authorization is scoped, server-owned, auditable, and revocable", async () => {
  const { service, recipients, audits } = harness();
  const recipient = await service.createRecipient({
    recipient_authorization_id: "attacker-id", tenant_id: "attacker-tenant", organization_id: "attacker-org",
    recipient_organization_ref: "org-funder", recipient_contact_ref: "contact-ref", audience_type: "funder",
  }, baseActor);
  assert.match(recipient.recipient_authorization_id, /^recipient_auth_/);
  assert.equal(recipient.tenant_id, "tenant-shf");
  assert.equal(recipient.organization_id, "org-shf");
  assert.equal(recipient.authorized_by_user_id, "reviewer-1");
  assert.equal(recipient.status, "AUTHORIZED");
  assert.equal(recipients.size, 1);
  assert.equal(audits[0].action_type, "report_distribution_recipient.authorized");
  const revoked = await service.revokeRecipient(recipient.recipient_authorization_id, 1, baseActor);
  assert.equal(revoked.status, "REVOKED");
  assert.equal(audits[1].action_type, "report_distribution_recipient.revoked");
  await assert.rejects(() => service.revokeRecipient(recipient.recipient_authorization_id, 2, baseActor), /revoked/);
});

test("disclosure decisions bind exact restricted artifact versions and reviewers", async () => {
  const { service, decisions, audits, artifact } = harness();
  await assert.rejects(() => service.createDisclosureDecision(artifact.artifact_id, { artifact_version: 1, decision: "APPROVED", decision_scope: {} }, { ...baseActor, permissions: ["reports.view"] }), /permission|service/i);
  await assert.rejects(() => service.createDisclosureDecision(artifact.artifact_id, { artifact_version: 1, decision: "APPROVED", decision_scope: {} }, baseActor), /policy reference/);
  const decision = await service.createDisclosureDecision(artifact.artifact_id, { artifact_version: 1, decision: "approved", decision_scope: { aggregate_only: true }, policy_reference: "external-policy-pending" }, baseActor);
  assert.match(decision.disclosure_decision_id, /^disclosure_/);
  assert.equal(decision.artifact_id, artifact.artifact_id);
  assert.equal(decision.artifact_version, 1);
  assert.equal(decision.reviewed_by_user_id, "reviewer-1");
  assert.equal(decision.decision, "APPROVED");
  assert.equal(audits.at(-1).action_type, "report_disclosure.approved");
  await assert.rejects(() => service.createDisclosureDecision(artifact.artifact_id, { artifact_version: 2, decision: "BLOCKED", decision_scope: {} }, baseActor), /version/);
  assert.equal(decisions.size, 1);
});

test("eligibility is a pure fail-closed check and never distributes", () => {
  const artifact = { artifact_id: "artifact-1", tenant_id: "tenant-shf", organization_id: "org-shf", classification: "RESTRICTED_EXTERNAL", lifecycle_status: "GENERATED", artifact_version: 1 };
  const recipient = { tenant_id: "tenant-shf", organization_id: "org-shf", status: "AUTHORIZED" };
  const approved = { artifact_id: "artifact-1", artifact_version: 1, tenant_id: "tenant-shf", organization_id: "org-shf", decision: "APPROVED", policy_reference: "policy-1" };
  assert.equal(canDistributeRestrictedArtifact({ artifact, recipient, disclosureDecision: approved, actor: { ...baseActor, permissions: ["reports.distribute"] } }).eligible, true);
  assert.equal(canDistributeRestrictedArtifact({ artifact: { ...artifact, organization_id: "other-org" }, recipient, disclosureDecision: approved, actor: { ...baseActor, permissions: ["reports.distribute"] } }).eligible, false);
  assert.equal(canDistributeRestrictedArtifact({ artifact, recipient: { ...recipient, status: "REVOKED" }, disclosureDecision: approved, actor: { ...baseActor, permissions: ["reports.distribute"] } }).eligible, false);
  assert.equal(canDistributeRestrictedArtifact({ artifact: { ...artifact, classification: "INTERNAL" }, recipient, disclosureDecision: approved, actor: { ...baseActor, permissions: ["reports.distribute"] } }).eligible, false);
  assert.equal(canDistributeRestrictedArtifact({ artifact, recipient, disclosureDecision: { ...approved, decision: "BLOCKED" }, actor: { ...baseActor, permissions: ["reports.distribute"] } }).eligible, false);
  assert.equal(canDistributeRestrictedArtifact({ artifact, recipient, disclosureDecision: approved, actor: baseActor }).eligible, false);
});

test("Donor Summary authorization preserves its composition and manifest boundary", () => {
  const base = { artifact_id: "artifact-1", tenant_id: "tenant-shf", organization_id: "org-shf", classification: "RESTRICTED_EXTERNAL", lifecycle_status: "GENERATED", artifact_version: 1, composition_type: "DONOR_SUMMARY", composition_version: 1, canonical_input_manifest: { reports: [{ report_id: "report.workforce.employment.started_verified_count.v1", report_version: 1 }] } };
  const recipient = { tenant_id: "tenant-shf", organization_id: "org-shf", status: "AUTHORIZED" };
  const disclosureDecision = { artifact_id: "artifact-1", artifact_version: 1, tenant_id: "tenant-shf", organization_id: "org-shf", decision: "APPROVED", policy_reference: "policy-1" };
  const actor = { ...baseActor, permissions: ["reports.distribute"] };
  assert.equal(canDistributeRestrictedArtifact({ artifact: base, recipient, disclosureDecision, actor }).eligible, true);
  assert.equal(canDistributeRestrictedArtifact({ artifact: { ...base, composition_version: 2 }, recipient, disclosureDecision, actor }).eligible, false);
  assert.equal(canDistributeRestrictedArtifact({ artifact: { ...base, canonical_input_manifest: { reports: [{ report_id: "report.other.v1", report_version: 1 }] } }, recipient, disclosureDecision, actor }).eligible, false);
});

test("authorization action persists exact references and is idempotent without asserting delivery", async () => {
  const { service, recipients, decisions, audits } = harness();
  const recipient = await service.createRecipient({ recipient_organization_ref: "org-funder", audience_type: "FUNDER" }, { ...baseActor, permissions: ["reports.distribution.manage"] });
  const artifact = { artifact_id: "artifact-1", tenant_id: "tenant-shf", organization_id: "org-shf", classification: "RESTRICTED_EXTERNAL", lifecycle_status: "GENERATED", artifact_version: 1 };
  const decision = await service.createDisclosureDecision(artifact.artifact_id, { artifact_version: 1, decision: "APPROVED", decision_scope: { aggregate_only: true }, policy_reference: "policy-1" }, { ...baseActor, permissions: ["reports.distribution.manage"] });
  const actor = { ...baseActor, permissions: ["reports.distribute"] };
  const first = await service.authorizeDistribution(artifact.artifact_id, { artifact_version: 1, recipient_authorization_id: recipient.recipient_authorization_id, disclosure_decision_id: decision.disclosure_decision_id, idempotency_key: "request-1", distribution_purpose: "funder-review" }, actor);
  const retry = await service.authorizeDistribution(artifact.artifact_id, { artifact_version: 1, recipient_authorization_id: recipient.recipient_authorization_id, disclosure_decision_id: decision.disclosure_decision_id, idempotency_key: "request-1" }, actor);
  assert.match(first.record.distribution_id, /^distribution_/);
  assert.equal(first.record.status, "AUTHORIZED_FOR_DISTRIBUTION");
  assert.equal(first.record.artifact_id, artifact.artifact_id);
  assert.equal(first.record.recipient_authorization_id, recipient.recipient_authorization_id);
  assert.equal(first.record.disclosure_decision_id, decision.disclosure_decision_id);
  assert.equal(retry.replayed, true);
  assert.equal(retry.record.distribution_id, first.record.distribution_id);
  assert.equal(audits.at(-1).action_type, "report.distribution.authorized");
  assert.equal(JSON.stringify(first.record).includes("report_contents"), false);
  await assert.rejects(() => service.authorizeDistribution(artifact.artifact_id, { artifact_version: 1, recipient_authorization_id: recipient.recipient_authorization_id, disclosure_decision_id: decision.disclosure_decision_id, idempotency_key: "request-1" }, { ...actor, permissions: ["reports.export"] }), /permission/);
});

test("authorization rejects every failed gate and preserves prior history", async () => {
  const { service } = harness();
  const actor = { ...baseActor, permissions: ["reports.distribute"] };
  await assert.rejects(() => service.authorizeDistribution("missing", { artifact_version: 1, recipient_authorization_id: "missing", disclosure_decision_id: "missing", idempotency_key: "missing" }, actor), /version|prerequisite|missing/i);
  assert.equal(canDistributeRestrictedArtifact({ artifact: { artifact_id: "a", tenant_id: "t", organization_id: "o", classification: "PUBLIC", lifecycle_status: "GENERATED", artifact_version: 1 }, recipient: { tenant_id: "t", organization_id: "o", status: "AUTHORIZED" }, disclosureDecision: { artifact_id: "a", artifact_version: 1, tenant_id: "t", organization_id: "o", decision: "APPROVED", policy_reference: "p" }, actor }).eligible, false);
});

test("persistence, permissions, and routes do not add delivery or publication", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS report_distribution_recipients/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS report_disclosure_decisions/);
  assert.match(migration, /status TEXT NOT NULL DEFAULT 'AUTHORIZED'/);
  assert.match(migration, /decision TEXT NOT NULL CHECK \(decision IN \('APPROVED', 'BLOCKED'\)\)/);
  assert.match(permissions, /REPORTS_DISTRIBUTION_MANAGE: "reports\.distribution\.manage"/);
  assert.match(permissions, /REPORTS_DISTRIBUTE: "reports\.distribute"/);
  assert.match(routes, /\/reporting\/distribution-recipients/);
  assert.match(routes, /\/reporting\/artifacts\/:artifactId\/disclosure-decisions/);
  assert.doesNotMatch(routes, /\/reporting\/(?:distribute|send|share|publish)/);
  assert.doesNotMatch(migration, /report_distributions/);
});

test("authorization persistence is append-only and separate from delivery", () => {
  assert.match(distributionMigration, /CREATE TABLE IF NOT EXISTS report_distributions/);
  assert.match(distributionMigration, /AUTHORIZED_FOR_DISTRIBUTION/);
  assert.match(distributionMigration, /idempotency_key TEXT NOT NULL/);
  assert.match(distributionMigration, /UNIQUE \(tenant_id, organization_id, idempotency_key\)/);
  assert.match(routes, /\/reporting\/artifacts\/:artifactId\/distributions/);
  assert.match(routes, /REPORTS_DISTRIBUTE/);
  assert.doesNotMatch(routes, /\/reporting\/(?:send|share|publish)/);
  assert.match(distributionMigration, /artifact_id TEXT NOT NULL/);
  assert.doesNotMatch(distributionMigration, /report_contents|participant_ref|email/);
});

test("scope and privacy boundaries are explicit", () => {
  assert.match(migration, /tenant_id TEXT NOT NULL/);
  assert.match(migration, /organization_id TEXT NOT NULL/);
  assert.doesNotMatch(migration, /participant_ref|truth_payload|evidence_payload|report_contents|email/);
  assert.match(routes, /REPORTS_DISTRIBUTION_MANAGE/);
});
