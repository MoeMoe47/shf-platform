import assert from "node:assert/strict";
import test from "node:test";
import { canTransition, validateWebsiteDeploymentPackage } from "../src/domain/deployment/model/deployment-contract.ts";

test("deployment contract permits only safe Website packages", () => {
  const result = validateWebsiteDeploymentPackage({ projectType: "WEBSITE", projectId: "project-a", revision: 2, files: [{ path: "index.html", content: "<h1>Home</h1>" }], packageHash: "hash" });
  assert.equal(result.projectType, "WEBSITE");
  assert.equal(canTransition("DEPLOYING", "LIVE"), true);
  assert.equal(canTransition("LIVE", "DEPLOYING"), false);
});

test("deployment contract rejects traversal, secret files, and secret-shaped content", () => {
  for (const files of [
    [{ path: "../index.html", content: "ok" }],
    [{ path: ".env", content: "ok" }],
    [{ path: "index.html", content: "API_KEY=secret" }],
  ]) assert.throws(() => validateWebsiteDeploymentPackage({ projectType: "WEBSITE", projectId: "project-a", revision: 1, files, packageHash: "hash" }));
});

test("deployment contract rejects AI Agent packages and public targets are not represented", () => {
  assert.throws(() => validateWebsiteDeploymentPackage({ projectType: "AI_AGENT", projectId: "agent-a", revision: 1, files: [], packageHash: "hash" }));
});
