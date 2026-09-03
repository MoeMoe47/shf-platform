import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const component = await readFile(new URL("../src/pages/studio/StudioDeploymentStatus.jsx", import.meta.url), "utf8");
const client = await readFile(new URL("../src/lib/studio/api.js", import.meta.url), "utf8");
const workspace = await readFile(new URL("../src/pages/studio/StudioBuilderWorkspace.jsx", import.meta.url), "utf8");

test("Website Publish uses the canonical deployment API and only renders for Websites", () => {
  assert.match(component, /projectType !== "WEBSITE"/);
  assert.match(component, /createWebsiteDeployment/);
  assert.match(component, /retryWebsiteDeployment/);
  assert.match(component, /Ready to Publish/);
  assert.match(component, /Test Deployment Live/);
  assert.match(component, /state\.deployments\.length > 0/);
  assert.match(component, /public website hosting is not connected/i);
  assert.doesNotMatch(component, /localStorage|sessionStorage/);
  assert.doesNotMatch(component, /https:\/\//);
});

test("Publish client sends only a delivery identifier and keeps provider state server-owned", () => {
  assert.match(client, /deployments\/from-studio-delivery/);
  assert.match(client, /body: JSON\.stringify\(\{ deliveryId \}\)/);
  assert.match(client, /deployments\/\$\{encodeURIComponent\(deploymentId\)\}\/retry/);
  assert.doesNotMatch(client, /providerDeploymentId|liveUrl|workspaceRevision|organizationId|tenantId/);
});

test("Publish status is placed after institutional proof in the Website build flow", () => {
  assert.match(workspace, /<StudioInstitutionalStatus[\s\S]*<StudioDeploymentStatus/);
});

test("Publish experience preserves future boundaries", () => {
  assert.match(component, /AI_AGENT|WEBSITE/);
  assert.match(workspace, /StudioDeploymentStatus[^>]+projectType=\{type\}/);
  assert.match(component, /Finalized means this version is approved and finished in Studio/);
  assert.match(component, /Publishing is a separate, explicit action/);
  assert.doesNotMatch(component, /unpublish|Unpublish/);
});
