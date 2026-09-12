import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("DGAL-3 does not introduce later agreement or signature lifecycles", async () => {
  const source = await readFile("apps/shs-api/src/domain/documentation/service/documentation-instance-service.ts", "utf8");
  assert.doesNotMatch(source, /DocuSign|Adobe Sign|signing session|acknowledge/i);
  assert.match(source, /templateVersionId/);
  assert.match(source, /retentionPolicyKey/);
  assert.match(source, /linkEvidence/);
});

test("DGAL-3 uses bounded artifact references", async () => {
  const repo = await readFile("apps/shs-api/src/domain/documentation/repo/documentation-instance-repo.ts", "utf8");
  assert.match(repo, /organization_id=\$[0-9]+ AND tenant_id=\$[0-9]+/);
  assert.match(repo, /dgal_artifact_links/);
  assert.match(repo, /dgal_evidence_links/);
});
