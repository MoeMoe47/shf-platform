import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("OGL-6 storage is versioned presentation-only state", async () => {
  const sql = await readFile(new URL("../apps/shs-api/migrations/140_ogl_authoring_analytics.sql", import.meta.url), "utf8");
  assert.match(sql, /ogl_orientation_versions/);
  assert.match(sql, /DRAFT.*REVIEW.*ACTIVE.*SUPERSEDED.*ARCHIVED/);
  assert.match(sql, /ogl_telemetry_events/);
  assert.doesNotMatch(sql, /CREATE TABLE[^;]*(workflow_completion|acknowledg|evidence|truth)/i);
});

test("OGL-6 authoring validates safe references and content", async () => {
  const source = await readFile(new URL("../apps/shs-api/src/domain/orientation/service/ogl6-service.ts", import.meta.url), "utf8");
  assert.match(source, /javascript:/i);
  assert.match(source, /ORIENTATION_NOT_FOUND/);
  assert.match(source, /withTransaction/);
});
