import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const contract = fs.readFileSync(new URL("../docs/SHF_CANONICAL_REPORT_FILE_AUTHORITY_CONTRACT.md", import.meta.url), "utf8");
const donorUx = fs.readFileSync(new URL("../src/pages/shf-command/SHFImpactCommandCenter.jsx", import.meta.url), "utf8");
const downloads = fs.readFileSync(new URL("../src/utils/downloads.js", import.meta.url), "utf8");
const exportStore = fs.readFileSync(new URL("../apps/shs-api/src/domain/reporting/export-history.store.ts", import.meta.url), "utf8");

test("canonical file authority review preserves the artifact/bytes boundary", () => {
  assert.match(contract, /SERVER_RENDERER_EXISTS_BUT_DURABLE_STORAGE_MISSING/);
  assert.match(contract, /report_artifact.*immutable rendered bytes/s);
  assert.match(contract, /`content_hash` is null until real\s+bytes/s);
  assert.match(contract, /exact `artifact_id` and `artifact_version`/);
  assert.match(contract, /tenant.*organization.*generating actor/s);
});

test("browser exports and local export history are not canonical bytes authority", () => {
  assert.match(contract, /LEGACY_PRESENTATION_EXPORT/);
  assert.match(downloads, /URL\.createObjectURL/);
  assert.match(exportStore, /const EXPORT_HISTORY: ExportRecord\[\] = \[\]/);
  assert.match(contract, /Browser Blob\/data-URL\/localStorage downloads/);
});

test("restricted authorization does not imply delivery and Donor Summary remains bounded", () => {
  assert.match(contract, /AUTHORIZED_FOR_DISTRIBUTION/);
  assert.match(contract, /does not mean sent, shared, delivered/);
  assert.match(donorUx, /Authorized for Distribution/);
  assert.match(donorUx, /Delivery is handled separately/);
  assert.doesNotMatch(contract, /canonical delivery candidate exists/i);
});

test("no public bytes or unsupported Donor Summary claims are introduced", () => {
  assert.match(contract, /No reusable `CANONICAL_BYTES_OWNER`/);
  assert.match(contract, /aggregate-only content/);
  assert.match(contract, /must not add placement, retention, wage, success, or\s+impact claims/);
  assert.match(contract, /`SENT`\/`DELIVERED` state is introduced/);
});
