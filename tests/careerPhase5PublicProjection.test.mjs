import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Phase 5 uses an explicit private-by-default publication boundary", async () => {
  const migration = await read("apps/shs-api/migrations/113_career_public_opportunity_visibility.sql");
  const repo = await read("apps/shs-api/src/domain/opportunities/repo/opportunity-repo.ts");
  assert.match(migration, /DEFAULT 'PRIVATE'/);
  assert.match(migration, /PUBLIC/);
  assert.match(repo, /o\.public_visibility = 'PUBLIC'/);
  assert.match(repo, /o\.status = 'OPEN'/);
  assert.match(repo, /o\.audience_scope = 'ORGANIZATION'/);
  assert.match(repo, /o\.program_id IS NULL/);
  assert.match(repo, /o\.cohort_id IS NULL/);
  assert.match(repo, /o\.action_url IS NOT NULL OR o\.action_route IS NOT NULL/);
});

test("public projection has an explicit safe DTO and protected routes remain protected", async () => {
  const model = await read("apps/shs-api/src/domain/opportunities/model/opportunity.ts");
  const routes = await read("apps/shs-api/src/domain/opportunities/api/routes.ts");
  const repo = await read("apps/shs-api/src/domain/opportunities/repo/opportunity-repo.ts");
  assert.match(model, /export interface PublicOpportunity/);
  assert.doesNotMatch(model.slice(model.indexOf("export interface PublicOpportunity")), /tenantId|createdByUserId|audienceScope|programId|cohortId/);
  assert.match(routes, /app\.get\("\/public\/career\/opportunities"/);
  assert.match(routes, /app\.get\("\/public\/career\/employers"/);
  assert.match(routes, /app\.get\("\/opportunities", requirePermission\(SHS_SECURITY_PERMISSIONS\.OPPORTUNITY_VIEW\)/);
  assert.match(repo, /organization: \{ id: row\.public_organization_id/);
  assert.doesNotMatch(repo, /career_employers|CREATE TABLE employers|CREATE TABLE career_employers/);
});

test("publication cannot be enabled for private audience scopes or inactive records", async () => {
  const service = await read("apps/shs-api/src/domain/opportunities/service/opportunity-service.ts");
  assert.match(service, /visibility === "PUBLIC"/);
  assert.match(service, /opportunity\.status !== "OPEN"/);
  assert.match(service, /opportunity\.audienceScope !== "ORGANIZATION"/);
  assert.match(service, /opportunity\.programId \|\| opportunity\.cohortId/);
});
