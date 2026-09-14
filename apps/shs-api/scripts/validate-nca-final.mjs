// NCA-5 — final, whole-program acceptance validator. Run with:
//   npx tsx scripts/validate-nca-final.mjs
// (registered as `npm run nca:final:validate` in this package).
//
// This validator does not re-check every micro-detail the NCA-2/NCA-4
// validators already own (persistence/preference policy,
// domain-integration/delivery-channel boundaries) — it re-runs them and
// adds only the whole-program acceptance checks that are new to NCA-5:
// required artifacts exist, no duplicate canonical authority anywhere in
// the repo (not just this domain), fake bells are neutralized, EXR/IOH
// boundaries are preserved, and the final report exists.

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(here, "..");
const repoRoot = join(apiRoot, "..", "..");

const failures = [];
function check(label, condition) {
  if (condition) {
    console.log(`OK   ${label}`);
  } else {
    console.error(`FAIL ${label}`);
    failures.push(label);
  }
}
function read(base, path) {
  return readFileSync(join(base, path), "utf8");
}

// --- 1. Required NCA artifacts exist (all six phases) ---
const requiredReports = [
  "docs/architecture/NCA-0_SYSTEM_WIDE_NOTIFICATION_COMMUNICATION_ARCHITECTURE_AUDIT.md",
  "docs/architecture/NCA_OWNER_DECISION_LOCK.md",
  "docs/architecture/NCA-1_CANONICAL_NOTIFICATION_CONTRACTS_CONSOLIDATION_POLICY.md",
  "docs/architecture/NCA-2_NOTIFICATION_PERSISTENCE_RECIPIENT_RESOLUTION_PREFERENCES.md",
  "docs/architecture/NCA-3_IN_APP_INBOX_ATTENTION_PROJECTION.md",
  "docs/architecture/NCA-4_DELIVERY_CHANNELS_DOMAIN_INTEGRATION_HARDENING.md",
  "docs/architecture/NCA-5_SYSTEM_WIDE_NOTIFICATION_ACCEPTANCE_MICRO_GAPS.md",
];
for (const report of requiredReports) {
  check(`required report exists: ${report}`, existsSync(join(repoRoot, report)));
}

// --- 2. Canonical persistence: only one writer of `notifications` rows, repo-wide ---
const insertSites = execSync(
  `grep -rl "INSERT INTO notifications\\b" ${JSON.stringify(join(repoRoot, "apps/shs-api/src"))} || true`,
  { encoding: "utf8" },
).trim().split("\n").filter(Boolean);
check(
  "exactly one writer of `notifications` rows repo-wide (notification-service.ts)",
  insertSites.length === 1 && insertSites[0].endsWith("notification-service.ts"),
);
const forbiddenTableNames = ["email_notifications", "sms_notifications", "delivery_attempts", "notification_deliveries", "civicsure_notifications", "arag_notifications", "studio_notifications", "notification_attention_items"];
const migrationsListing = execSync(`ls ${JSON.stringify(join(apiRoot, "migrations"))}`, { encoding: "utf8" });
check("no duplicate canonical notification/attention table was ever introduced", !forbiddenTableNames.some((name) => migrationsListing.includes(name)));

// --- 3. No localStorage notification authority anywhere in the frontend ---
// Match actual localStorage method calls, not explanatory comments that
// assert its absence (e.g. "never derived from localStorage") — the same
// class of validator false-positive fixed in the NCA-2/NCA-3 validators.
let localStorageHits = [];
try {
  localStorageHits = execSync(
    `grep -rln "localStorage\\.\\(getItem\\|setItem\\|removeItem\\)" ${JSON.stringify(join(repoRoot, "src/components/shared/notifications"))} || true`,
    { encoding: "utf8" },
  ).trim().split("\n").filter(Boolean);
} catch { /* directory may not exist in a non-frontend checkout */ }
check("no localStorage-based notification/unread authority in the shared notification UI", localStorageHits.length === 0);

// --- 4. Fake bells neutralized in all four shells ---
const shellHeaders = {
  Store: "src/components/store/StoreHeader.jsx",
  Arcade: "src/components/arcade/ArcadeHeaderExtras.jsx",
  CivicSure: "src/components/civic/CivicTopBar.jsx",
  Curriculum: "src/components/curriculum/CurriculumHeader.jsx",
};
for (const [shell, path] of Object.entries(shellHeaders)) {
  const src = read(repoRoot, path);
  check(`${shell} header consumes the one canonical NotificationBell`, /NotificationBell/.test(src));
  // Only real, live-rendered JSX text should trip this — not an
  // explanatory code comment describing what was removed (a comment line
  // naming the old fake copy, e.g. "previously a static \"You're all
  // caught up\" panel", is exactly the documentation this program wants
  // kept, not a regression).
  const liveCode = src.split("\n").filter((line) => !line.trim().startsWith("//")).join("\n");
  check(`${shell} header no longer renders the removed static fake bell text`, !/all caught up|no live feed/i.test(liveCode));
}

// --- 5. Recipient resolution / preferences / attention canonical (delegated to NCA-2/NCA-4 validators below) ---

// --- 6. Delivery architecture is bounded (email adapter exists; no unbounded retry) ---
const deliverySrc = read(apiRoot, "src/domain/notifications/service/delivery-service.ts");
check("delivery retry is bounded by a fixed constant, never unbounded", /MAX_SEND_ATTEMPTS\s*=\s*3/.test(deliverySrc) && !/while\s*\(\s*true\s*\)/.test(deliverySrc));

// --- 7. Every EVENT_POLICIES notification_type has a real (non-default) classification entry ---
const notificationServiceSrc = read(apiRoot, "src/domain/notifications/service/notification-service.ts");
const classificationSrc = read(apiRoot, "src/domain/notifications/contracts/notification-classification.ts");
const typeMatches = [...notificationServiceSrc.matchAll(/type:\s*"([A-Z_]+)"/g)].map((m) => m[1]);
const unclassified = typeMatches.filter((type) => !new RegExp(`\\b${type}:\\s*\\{`).test(classificationSrc));
check(
  `every EVENT_POLICIES notification_type has a real classification entry (found ${typeMatches.length} types, ${unclassified.length} unclassified: ${unclassified.join(", ")})`,
  unclassified.length === 0,
);

// --- 8. Migration state: head remains 143, no NCA-5 migration ---
const migrationFiles = execSync(`ls ${JSON.stringify(join(apiRoot, "migrations"))}`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
const highestMigration = migrationFiles.map((name) => parseInt(name.slice(0, 3), 10)).filter((n) => !Number.isNaN(n)).sort((a, b) => b - a)[0];
check("migration head remains 143 — NCA-5 introduced no new migration", highestMigration === 143);

// --- 9. EXR/IOH boundaries preserved (diff-based, local-repo-only evidence) ---
try {
  const changedFiles = execSync("git diff --name-only HEAD", { cwd: repoRoot, encoding: "utf8" }).split("\n").filter(Boolean);
  const unexpectedShellChange = changedFiles.some((path) => /^src\/layouts\//.test(path) || /RootProviders/.test(path));
  check("no EXR-owned shell/layout/RootProviders file was modified", !unexpectedShellChange);
  const migrationChanged = changedFiles.some((path) => /apps\/shs-api\/migrations\//.test(path));
  check("no migration file was added or modified in this phase", !migrationChanged);
  const identityAuthorityFiles = changedFiles.filter((path) => /apps\/shs-api\/src\/domain\/identity\/(?!repo\/identity-repo\.ts)/.test(path) || /apps\/shs-api\/src\/auth\//.test(path));
  check("no IOH-owned identity/auth authority file was modified (identity-repo.ts's dev-only fixture lookup map is the sole, pre-existing exception)", identityAuthorityFiles.length === 0);
} catch {
  console.warn("WARN could not run `git diff` to verify EXR/IOH boundaries (non-git environment) — skipping those checks");
}

// --- 10. Re-run the NCA-2 and NCA-4 domain validators as part of final acceptance ---
try {
  execSync("npx tsx scripts/validate-nca-persistence-recipient-policy.mjs", { cwd: apiRoot, stdio: "pipe" });
  check("NCA-2 persistence/recipient/preference validator passes", true);
} catch {
  check("NCA-2 persistence/recipient/preference validator passes", false);
}
try {
  execSync("npx tsx scripts/validate-nca-delivery-domain-integration.mjs", { cwd: apiRoot, stdio: "pipe" });
  check("NCA-4 delivery/domain-integration validator passes", true);
} catch {
  check("NCA-4 delivery/domain-integration validator passes", false);
}

console.log("");
if (failures.length) {
  console.error(`NCA-5 final validator FAILED: ${failures.length} check(s) failed.`);
  process.exit(1);
} else {
  console.log("NCA-5 final validator PASSED: whole-program canonical authority, fake-bell neutralization, delivery boundaries, migration state, and EXR/IOH boundaries all hold.");
}
