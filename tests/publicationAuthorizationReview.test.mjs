import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const contract = readFileSync(new URL("../docs/SHF_PUBLICATION_AUTHORITY_CONTRACT.md", import.meta.url), "utf8");
const routes = readFileSync(new URL("../apps/shs-api/src/domain/reporting/routes.ts", import.meta.url), "utf8");
const permissions = readFileSync(new URL("../apps/shs-api/src/auth/security-permissions.ts", import.meta.url), "utf8");

test("publication authority remains snapshot-bound and institutionally gated", () => {
  assert.match(contract, /SHF_EXECUTIVE_AUTHORITY/);
  assert.match(contract, /PUBLIC_REPORTING_RELEASE_APPROVAL/);
  assert.match(contract, /reports\.publication\.authorize/);
  assert.match(contract, /PUBLICATION_AUTHORIZED/);
  assert.match(contract, /PUBLISHED/);
  assert.match(routes, /publication-authorizations/);
  assert.match(permissions, /REPORTS_PUBLICATION_AUTHORIZE/);
});

test("publication remains separate from snapshot, Truth, and Impact projection", () => {
  assert.match(contract, /PUBLIC SNAPSHOT|public-safe report snapshot/i);
  assert.match(contract, /Truth.*public_approved/s);
  assert.match(contract, /Impact Data Spine.*projection-only/s);
  assert.match(contract, /no.*public URL|public URL/i);
});
