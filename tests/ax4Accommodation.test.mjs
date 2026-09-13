import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("AX-4 lifecycle allows only bounded institutional transitions", () => {
  const lifecycle = fs.readFileSync(new URL("../apps/shs-api/src/domain/accessibility-accommodations/model/lifecycle.ts", import.meta.url), "utf8");
  assert.match(lifecycle, /DRAFT: \["SUBMITTED"\]/);
  assert.match(lifecycle, /UNDER_REVIEW: \["INFORMATION_REQUESTED", "APPROVED", "DECLINED", "WITHDRAWN"\]/);
  assert.match(lifecycle, /APPROVED: \["ACTIVE", "SUPERSEDED"\]/);
  assert.match(lifecycle, /CLOSED: \[\]/);
  assert.match(lifecycle, /canTransition/);
});

test("AX-4 support and fulfillment vocabularies are bounded", () => {
  const lifecycle = fs.readFileSync(new URL("../apps/shs-api/src/domain/accessibility-accommodations/model/lifecycle.ts", import.meta.url), "utf8");
  assert.match(lifecycle, /REQUIREMENT_TYPES = \[.*ALTERNATIVE_FORMAT.*INTERPRETER/);
  assert.match(lifecycle, /FULFILLMENT_STATES = \[.*DELIVERED.*EXTERNAL_DEPENDENCY/);
  assert.doesNotMatch(lifecycle, /FULFILLMENT_STATES = \[.*APPROVED/);
});

test("AX-4 schema preserves the existing active grant table and uses structured lifecycle records", () => {
  const migration = fs.readFileSync(new URL("../apps/shs-api/migrations/141_accessibility_accommodation_lifecycle.sql", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS accessibility_accommodation_cases/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS accessibility_accommodation_requirements/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DROP COLUMN/);
  assert.match(migration, /FOREIGN KEY \(organization_id, subject_user_id\)/);
  assert.match(migration, /fulfillment_status TEXT NOT NULL/);
});

test("AX-4 domain has no personal profile, Truth, Evidence, or DGAL lifecycle dependency", () => {
  const service = fs.readFileSync(new URL("../apps/shs-api/src/domain/accessibility-accommodations/service/accommodation-service.ts", import.meta.url), "utf8");
  assert.doesNotMatch(service, /user_accessibility_profiles|Truth|Evidence|dgal.*signature/i);
  assert.match(service, /writeAuditEvent/);
  assert.match(service, /requestType/);
});
