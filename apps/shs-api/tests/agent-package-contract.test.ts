import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { canonicalPackageContent, normalizeAgentWork, packageHash, registryReadiness, validateAgentPackageDefinition } from "../src/domain/agent-package/model/agent-package-contract.ts";

const provenance = { projectId: "p", deliveryRecordId: "d", workspaceRevision: 2, projectType: "AI_AGENT" as const, learnerId: "l", organizationId: "o", tenantId: "tenant:o", finalizedAt: "2026-09-02T00:00:00.000Z" };
test("normalizes the current Studio Agent shape into a provider-neutral governed package", () => {
  const definition = normalizeAgentWork({ name: "Study helper", instructions: "Help with study planning.", tools: ["read_context"] });
  const validation = validateAgentPackageDefinition(definition);
  assert.equal(validation.status, "VALID");
  assert.equal(definition.safety.execution, "NOT_AUTHORIZED");
  assert.equal(definition.provider.kind, "PROVIDER_NEUTRAL");
  assert.equal(registryReadiness(validation.status), "READY_FOR_REGISTRY");
});
test("rejects secrets, markup, and executable-shaped tools", () => {
  assert.throws(() => normalizeAgentWork({ name: "x", instructions: "api key=secret", tools: [] }), /SECRET/);
  assert.throws(() => normalizeAgentWork({ name: "x", instructions: "<script>alert(1)</script>", tools: [] }), /MARKUP/);
  assert.throws(() => normalizeAgentWork({ name: "x", instructions: "safe", tools: ["shell:run"] }), /TOOL_NOT_ALLOWED/);
});
test("hash excludes volatile generation time and readiness never means Registry acceptance", () => {
  const content = canonicalPackageContent(provenance, normalizeAgentWork({ name: "x", instructions: "safe", tools: [] }));
  assert.equal(packageHash(content), packageHash({ ...content }));
  assert.equal(registryReadiness("INVALID"), "NOT_READY");
});
test("migration defines scoped immutable package storage and identity uniqueness", () => {
  const sql = readFileSync(new URL("../migrations/077_governed_agent_package.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS studio_agent_packages/);
  assert.match(sql, /project_type TEXT NOT NULL CHECK \(project_type = 'AI_AGENT'\)/);
  assert.match(sql, /studio_agent_package_delivery_scope_fk/);
  assert.match(sql, /studio_agent_package_identity_idx/);
  assert.doesNotMatch(sql, /registry_submission|credential_issued|runtime_execution/);
});
