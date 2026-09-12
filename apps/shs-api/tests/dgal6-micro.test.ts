import test from "node:test";
import assert from "node:assert/strict";
import { DocumentCenterService } from "../src/domain/documentation/service/document-center-service.js";
import { ContentVariantService } from "../src/domain/documentation/service/content-variant-service.js";

const actor = { user_id: "user-a", organization_id: "org-a", active_organization_id: "org-a", tenant_id: "tenant:org-a", permissions: ["documentation.variant.manage"] };

test("Document Center applies a selected service to every related source query", async () => {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const db = { query: async (sql: string, params: unknown[] = []) => { queries.push({ sql, params }); return { rows: [] }; } };
  const result = await new DocumentCenterService(db).list({ ...actor, permissions: [] }, { service: "civicsure" });
  assert.equal(result.status, "NO_REQUIREMENTS");
  const related = queries.filter((entry) => /documentation_acknowledgments|manual_signature_records|signature_requests/.test(entry.sql));
  assert.equal(related.length, 3);
  for (const entry of related) { assert.match(entry.sql, /service_key|d\.service_key/); assert.equal(entry.params[2], "civicsure"); }
});

test("content variant activation retires the prior active variant for the exact source/language scope", async () => {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const db = { query: async (sql: string, params: unknown[] = []) => {
    queries.push({ sql, params });
    if (sql.startsWith("SELECT source_reference")) return { rows: [{ source_reference: "guide-1", source_version_reference: "v1", language_code: "es", organization_id: "org-a", tenant_id: "tenant:org-a" }] };
    if (sql.startsWith("UPDATE dgal_content_variants SET status='ACTIVE'")) return { rows: [{ variant_id: "variant-2", status: "ACTIVE", variant_revision: 2 }] };
    return { rows: [] };
  } };
  const service = new ContentVariantService(db);
  const result = await service.activate(actor, "variant-2");
  assert.equal(result.status, "ACTIVE");
  assert.ok(queries.some((entry) => entry.sql.includes("status='RETIRED'") && entry.sql.includes("variant_id<>$6")));
  assert.ok(queries.some((entry) => entry.sql === "COMMIT"));
});
