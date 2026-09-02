import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync(new URL("../src/lib/studio/api.js", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/pages/studio/StudioProjectCheck.jsx", import.meta.url), "utf8");
const builder = readFileSync(new URL("../src/pages/studio/StudioBuilderWorkspace.jsx", import.meta.url), "utf8");

test("QA is an explicit project-scoped action with truthful statuses", () => {
  assert.match(api, /getCurrentStudioQa/);
  assert.match(api, /runStudioQa/);
  assert.match(api, /JSON\.stringify\(\{\}\)/);
  assert.match(page, /Check My Project/);
  assert.match(page, /Project changed/);
  assert.match(page, /Check could not finish/);
  assert.doesNotMatch(page, /localStorage|sessionStorage|onComplete|markComplete|createEvidence|approveProject/i);
  assert.match(builder, /StudioProjectCheck/);
});

test("QA presentation exposes findings without project authority controls", () => {
  assert.match(page, /studentGuidance/);
  assert.match(page, /role="alert"/);
  assert.match(page, /role="status"/);
  assert.doesNotMatch(page, /onLifecycleChange|onEvidenceCreate|onPortfolioAdd|onApprove|onDelivery/);
});
