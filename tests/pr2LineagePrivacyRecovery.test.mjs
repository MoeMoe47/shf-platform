import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("source ingestion preserves privacy classification, provenance, and fail-closed storage boundaries", () => {
  const service = read("apps/shs-api/src/domain/source-ingestion/service/source-service.ts");
  const routes = read("apps/shs-api/src/domain/source-ingestion/api/routes.ts");
  const storage = read("apps/shs-api/src/domain/source-ingestion/storage/source-storage.ts");

  assert.match(routes, /requireExplicitAuthentication/);
  assert.match(routes, /requirePermission\(SHS_SECURITY_PERMISSIONS\.CURRICULUM_SOURCE_UPLOAD\)/);
  assert.match(routes, /limits: \{ fileSize: 25 \* 1024 \* 1024, files: 1 \}/);
  assert.match(service, /visibility: "PRIVATE"/);
  assert.match(service, /classification/);
  assert.match(service, /content_hash/);
  assert.match(service, /created_by_user_id/);
  assert.match(service, /source_asset\.uploaded/);
  assert.match(storage, /flag: "wx"/);
  assert.match(storage, /unsafe_storage_key/);
  assert.match(routes, /storage_key: _storageKey/);
});

test("lifecycle cleanup is allowlisted and legal/privacy gaps fail closed", () => {
  const lifecycle = read("apps/shs-api/src/db/lifecycle-manager.ts");
  const contract = read("docs/SHF_TRUSTED_REPORTING_RETENTION_LIFECYCLE_CONTRACT.md");

  assert.match(lifecycle, /forbiddenLifecycleTargets/);
  assert.match(lifecycle, /RATE_LIMIT_WINDOWS/);
  assert.match(lifecycle, /EXPIRED_SESSIONS/);
  assert.match(lifecycle, /REVOKED_SESSIONS/);
  assert.match(lifecycle, /DELIVERED_OUTBOX/);
  assert.match(lifecycle, /production_policy_value_required_no_delete/);
  assert.match(lifecycle, /FOR UPDATE SKIP LOCKED/);
  assert.match(contract, /No legal or institutional duration is asserted/);
  assert.match(contract, /Never-delete boundary/);
  assert.match(contract, /does not accept arbitrary table names/);
});

test("report publication supports immutable supersession and public projection correction", () => {
  const publicationService = read("apps/shs-api/src/domain/reporting/report-publication-service.ts");
  const publicationRepo = read("apps/shs-api/src/domain/reporting/report-publication-action-repo.ts");
  const publicProjection = read("apps/shs-api/src/domain/government-assurance/adapters/public-projection-boundary.ts");

  assert.match(publicationService, /snapshot_hash/);
  assert.match(publicationService, /expectedHash/);
  assert.match(publicationService, /supersed/i);
  assert.match(publicationService, /markNotCurrent/);
  assert.match(publicationService, /async publish/);
  assert.match(publicationRepo, /supersedes_publication_id/);
  assert.match(publicationRepo, /projection_status = 'PUBLISHED'/);
  assert.match(publicProjection, /public_reference/);
  assert.match(publicProjection, /public_display_value/);
  assert.doesNotMatch(publicProjection, /storage_key|evidence_payload|participant_ref|internal_notes/i);
});

test("PR-2 recovery support is provider-neutral and excludes source-control backup semantics", () => {
  const backup = read("apps/shs-api/src/recovery/pr2-local-backup.ts");
  const report = read("docs/architecture/PR-0_HISTORICAL_GAP_CLOSURE_AUDIT.md");

  assert.match(backup, /shs\.pr2\.local-backup\.v1/);
  assert.match(backup, /sha256/);
  assert.match(backup, /flag: "wx"/);
  assert.match(backup, /backup_path_unsafe/);
  assert.match(backup, /DATABASE_URL is supplied by the process environment and is never printed/);
  assert.match(report, /Git restore points do not count as operational DR/);
});
