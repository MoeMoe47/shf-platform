import assert from "node:assert/strict";
import test from "node:test";
import { validateStudioWorkspaceWork } from "../src/domain/studio/model/studio-workspace.js";
import { evaluateStudioQa } from "../src/domain/studio/model/studio-qa.js";

test("workspace validation drops authority and credential-shaped fields", () => {
  const website = validateStudioWorkspaceWork("WEBSITE", {
    organization_id: "org-b",
    tenant_id: "tenant:org-b",
    project_type: "AI_AGENT",
    lifecycle_status: "DELIVERED",
    apiKey: "test-only-placeholder",
    pages: [{ path: "/", title: "Safe", content: "Content", secret: "ignored" }],
  });
  assert.deepEqual(website, { pages: [{ path: "/", title: "Safe", content: "Content" }] });
  assert.throws(() => validateStudioWorkspaceWork("WEBSITE", { evidence: { verified: true }, pages: [] }), /authority_field_forbidden/);
});

test("workspace path and size boundaries fail closed", () => {
  assert.throws(() => validateStudioWorkspaceWork("WEBSITE", { pages: [{ path: "/../escape", title: "x", content: "x" }] }), /path_invalid/);
  assert.throws(() => validateStudioWorkspaceWork("WEBSITE", { pages: [{ path: "/", title: "x", content: "x".repeat(50_001) }] }), /content_invalid/);
  assert.throws(() => validateStudioWorkspaceWork("AI_AGENT", { name: "Agent", instructions: "Instructions", tools: ["x".repeat(201)] }), /tools_invalid/);
});

test("canonical project type selects the only applicable deterministic QA family", () => {
  const website = evaluateStudioQa("WEBSITE", { pages: [{ path: "/", title: "Home", content: "Content" }] }, true);
  const agent = evaluateStudioQa("AI_AGENT", { name: "Agent", instructions: "Do one safe thing.", tools: [] }, true);
  assert.equal(website.status, "PASSED");
  assert.ok(website.findings.some((finding) => finding.checkId === "WEB_PAGE_TITLE_PRESENT"));
  assert.equal(agent.status, "PASSED");
  assert.ok(agent.findings.some((finding) => finding.checkId === "AGENT_NAME_PRESENT"));
  assert.ok(!agent.findings.some((finding) => finding.checkId === "WEB_PAGE_TITLE_PRESENT"));
});

test("QA errors cannot be represented as a pass", () => {
  const result = evaluateStudioQa("WEBSITE", { pages: [{ path: "/", title: "Home", content: "" }] }, true);
  assert.equal(result.status, "FAILED");
  assert.ok(result.findings.some((finding) => finding.checkId === "WEB_PAGE_CONTENT_PRESENT" && finding.status === "FAIL"));
});

test("Phase 12 source contract keeps high-authority writes server-derived", async () => {
  const fs = await import("node:fs/promises");
  const routes = await fs.readFile(new URL("../src/domain/studio/api/studio-project-routes.ts", import.meta.url), "utf8");
  const api = await fs.readFile(new URL("../../../src/lib/studio/api.js", import.meta.url), "utf8");
  assert.match(routes, /review-submissions\/\:submissionId\/decision/);
  assert.match(routes, /finalize/);
  assert.match(routes, /institutional-status/);
  assert.doesNotMatch(api, /approved\s*:/);
  assert.doesNotMatch(api, /qaPassed\s*:/);
  assert.doesNotMatch(api, /organizationId\s*:/);
  assert.doesNotMatch(api, /tenantId\s*:/);
});
