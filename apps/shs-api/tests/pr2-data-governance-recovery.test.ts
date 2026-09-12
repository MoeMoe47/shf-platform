import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  PR2_SCOPED_GAPS,
  REPRESENTATIVE_LINEAGE_CHAINS,
  correctionPropagationPlan,
  retentionDecision,
  subjectExportRecordAllowed,
  validateLineageChain,
} from "../src/recovery/pr2-data-governance.js";
import {
  createLocalFileBackup,
  databaseBackupPlan,
  restoreLocalFileBackup,
  verifyRestoredBackup,
} from "../src/recovery/pr2-local-backup.js";

test("PR-2 scoped gaps have exact final classifications and no repository-local open work", () => {
  assert.deepEqual(PR2_SCOPED_GAPS.map((gap) => gap.gapId), [
    "PR0-GAP-010",
    "PR0-GAP-011",
    "PR0-GAP-012",
    "PR0-GAP-017",
    "PR0-GAP-024",
    "PR0-GAP-025",
  ]);
  assert.equal(PR2_SCOPED_GAPS.filter((gap) => gap.status === "RESOLVED").length, 2);
  assert.equal(PR2_SCOPED_GAPS.filter((gap) => gap.status === "BLOCKED — EXTERNAL DEPENDENCY").length, 4);
  assert.equal(PR2_SCOPED_GAPS.some((gap) => gap.status === "OPEN — REPOSITORY WORK REMAINS"), false);
  for (const gap of PR2_SCOPED_GAPS) {
    assert.match(gap.evidence, /\S/);
    assert.match(gap.remainingDependency, /\S/);
  }
});

test("representative lineage chains are complete across PR-2 domains", () => {
  const domains = new Set(REPRESENTATIVE_LINEAGE_CHAINS.map((chain) => chain.domain));
  assert.deepEqual(domains, new Set(["education", "civicsure", "studio", "arag1", "agent_fabric", "program"]));
  for (const chain of REPRESENTATIVE_LINEAGE_CHAINS) assert.equal(validateLineageChain(chain), true);

  const terminals = new Map(REPRESENTATIVE_LINEAGE_CHAINS.map((chain) => [chain.domain, chain.terminal]));
  assert.equal(terminals.get("education"), "institutional_report");
  assert.equal(terminals.get("civicsure"), "public_safe_projection");
  assert.equal(terminals.get("studio"), "release_artifact");
  assert.equal(terminals.get("arag1"), "release_decision");
  assert.equal(terminals.get("agent_fabric"), "audit_event");
});

test("retention and export decisions fail closed around legal hold and protected history", () => {
  assert.deepEqual(retentionDecision("STUDENT_DATA", { legalHold: true }), {
    action: "NO_AUTOMATIC_DELETE",
    reason: "LEGAL_HOLD_ACTIVE",
  });
  assert.equal(retentionDecision("IMMUTABLE_INSTITUTIONAL_HISTORY").action, "NO_AUTOMATIC_DELETE");
  assert.equal(retentionDecision("PUBLIC").action, "ARCHIVE_ONLY");
  assert.equal(retentionDecision("CONFIDENTIAL").action, "NO_AUTOMATIC_DELETE");

  assert.equal(subjectExportRecordAllowed({ subjectUserId: "user-1", classification: "STUDENT_DATA" }, "user-1"), true);
  assert.equal(subjectExportRecordAllowed({ subjectUserId: "user-2", classification: "STUDENT_DATA" }, "user-1"), false);
  assert.equal(subjectExportRecordAllowed({ subjectUserId: "user-1", classification: "STUDENT_DATA", internalOnly: true }, "user-1"), false);
  assert.equal(subjectExportRecordAllowed({ subjectUserId: "user-1", classification: "GOVERNMENT_ASSURANCE_INTERNAL" }, "user-1"), false);
});

test("correction propagation requires recompute, report supersession, and public refresh", () => {
  assert.throws(() => correctionPropagationPlan(""), /source_correction_required/);
  assert.deepEqual(correctionPropagationPlan("corrected learner outcome"), {
    sourceCorrection: "corrected learner outcome",
    eventRequired: true,
    recomputeRequired: true,
    projectionRefreshRequired: true,
    metricRefreshRequired: true,
    reportSupersessionRequired: true,
    publicProjectionRefreshRequired: true,
  });
});

test("local backup and restore drill preserves file contents, metadata, and integrity", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shf-pr2-backup-source-"));
  const backupRoot = await mkdtemp(path.join(os.tmpdir(), "shf-pr2-backup-"));
  const restoreRoot = await mkdtemp(path.join(os.tmpdir(), "shf-pr2-restore-"));
  await writeFile(path.join(root, "evidence.txt"), "source evidence\n");
  await writeFile(path.join(root, "report.html"), "<main>report artifact</main>\n");

  const archivePath = path.join(backupRoot, "archive.json");
  const archive = await createLocalFileBackup({
    sourceRoot: root,
    archivePath,
    sourceRootLabel: "pr2-drill",
    classification: "EVIDENCE_ARTIFACT",
  });
  assert.equal(archive.schema, "shs.pr2.local-backup.v1");
  assert.equal(archive.entries.length, 2);
  assert.equal(archive.entries.every((entry) => entry.classification === "EVIDENCE_ARTIFACT"), true);

  const restored = await restoreLocalFileBackup({ archivePath, targetRoot: restoreRoot });
  assert.equal(restored.restoredCount, 2);
  assert.equal((await verifyRestoredBackup({ archivePath, targetRoot: restoreRoot })).verifiedCount, 2);
  assert.equal(await readFile(path.join(restoreRoot, "evidence.txt"), "utf8"), "source evidence\n");
  assert.equal(await readFile(path.join(restoreRoot, "report.html"), "utf8"), "<main>report artifact</main>\n");
});

test("database backup plan is secret-safe and requires an explicit output location", () => {
  assert.throws(() => databaseBackupPlan({}), /SHF_BACKUP_OUTPUT_DIR_REQUIRED/);
  const plan = databaseBackupPlan({
    SHF_BACKUP_OUTPUT_DIR: "/tmp/shf-pr2-backups",
    DATABASE_URL: "postgres://user:secret-password@localhost/db",
  });
  const serialized = JSON.stringify(plan);
  assert.equal(plan.command, "pg_dump");
  assert.equal(plan.restoreCommand, "pg_restore");
  assert.match(serialized, /shs-db\.backup/);
  assert.doesNotMatch(serialized, /secret-password/);
  assert.doesNotMatch(serialized, /postgres:\/\/user/);
});
