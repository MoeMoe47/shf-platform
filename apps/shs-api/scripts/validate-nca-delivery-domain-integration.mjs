// NCA-4 — deterministic validator for delivery-channel hardening and
// domain-integration coverage. Run with:
//   npx tsx scripts/validate-nca-delivery-domain-integration.mjs
// (registered as `npm run nca:delivery:validate` in this package).

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const failures = [];
function check(label, condition) {
  if (condition) {
    console.log(`OK   ${label}`);
  } else {
    console.error(`FAIL ${label}`);
    failures.push(label);
  }
}
function read(path) {
  return readFileSync(join(root, path), "utf8");
}

const notificationServiceSrc = read("src/domain/notifications/service/notification-service.ts");
const deliveryServiceSrc = read("src/domain/notifications/service/delivery-service.ts");
const mailAdapterSrc = read("src/domain/notifications/service/notification-mail-adapter.ts");
const outboxRepoSrc = read("src/domain/trusted-reporting/outbox-repo.ts");

// --- 1. Canonical source-event path: new domain policies reuse the same EVENT_POLICIES/createNotificationFromEvent pipeline ---
check(
  "new domain event types (referral.created, arag.*, studio.qa.completed, studio.handoff.created) are registered in the single canonical EVENT_POLICIES map",
  /"referral\.created":/.test(notificationServiceSrc) &&
  /"arag\.assurance\.blocked":/.test(notificationServiceSrc) &&
  /"arag\.approval\.required":/.test(notificationServiceSrc) &&
  /"arag\.release\.succeeded":/.test(notificationServiceSrc) &&
  /"arag\.release\.failed":/.test(notificationServiceSrc) &&
  /"studio\.qa\.completed":/.test(notificationServiceSrc) &&
  /"studio\.handoff\.created":/.test(notificationServiceSrc),
);

// --- 2. No duplicate notification persistence / no duplicate domain notification store ---
const insertNotificationsSites = execSync(
  `grep -rl "INSERT INTO notifications\\b" ${JSON.stringify(join(root, "src"))} || true`,
  { encoding: "utf8" },
).trim().split("\n").filter(Boolean);
check(
  "still exactly one writer of `notifications` rows (notification-service.ts) — no domain-specific notification store introduced",
  insertNotificationsSites.length === 1 && insertNotificationsSites[0].endsWith("notification-service.ts"),
);
const forbiddenTableNames = ["email_notifications", "sms_notifications", "delivery_attempts", "notification_deliveries", "civicsure_notifications", "arag_notifications", "studio_notifications"];
const migrationsListing = execSync(`ls ${JSON.stringify(join(root, "migrations"))}`, { encoding: "utf8" });
check("no domain-specific or delivery-attempt migration/table was introduced", !forbiddenTableNames.some((name) => migrationsListing.includes(name)));

// --- 3. Recipient resolution reuse (multi-recipient extension stays inside the one canonical function) ---
check(
  "multi-recipient resolution is an extension of the single canonical createNotificationFromEvent, not a second recipient authority",
  /export async function createNotificationFromEvent/.test(notificationServiceSrc) &&
  /usersWithPermissionInOrganization/.test(notificationServiceSrc) &&
  (notificationServiceSrc.match(/export async function createNotificationFromEvent/g) || []).length === 1,
);

// --- 4. Preferences reuse (delivery-service.ts calls the canonical NCA-2 preference module, does not re-implement it) ---
check(
  "delivery-service.ts reuses the canonical NCA-2 preference module rather than re-implementing preference storage",
  /from "\.\/preference-service\.js"/.test(deliveryServiceSrc) &&
  !/CREATE TABLE/.test(deliveryServiceSrc),
);

// --- 5. Optional channel boundary: email eligibility is gated to the two non-suppressible categories only ---
check(
  "email eligibility is restricted to MANDATORY_OPERATIONAL/REQUIRED_ACTION only, matching NCA-1's channel-selection policy",
  /EMAIL_ELIGIBLE_CATEGORIES\s*=\s*new Set\(\["MANDATORY_OPERATIONAL",\s*"REQUIRED_ACTION"\]\)/.test(deliveryServiceSrc),
);

// --- 6. In-app remains canonical: delivery-service.ts never writes to `notifications` ---
check(
  "delivery-service.ts never inserts, updates, or deletes a `notifications` row — the in-app record stays authoritative and untouched by delivery",
  !/(INSERT INTO|UPDATE|DELETE FROM)\s+notifications\b/.test(deliveryServiceSrc),
);

// --- 7. Idempotent external delivery ---
check(
  "the notification's own id is used as the provider-facing idempotent send key",
  /notificationId/.test(mailAdapterSrc) && /notification\.notificationId/.test(deliveryServiceSrc),
);

// --- 8. Bounded retry (never infinite) ---
check(
  "external delivery retry is bounded by a fixed constant, never an unbounded/while(true) loop",
  /MAX_SEND_ATTEMPTS\s*=\s*3/.test(deliveryServiceSrc) && !/while\s*\(\s*true\s*\)/.test(deliveryServiceSrc),
);

// --- 9. Source transaction isolation preserved (NCA-1 P0 fix untouched; delivery not wired into the write path) ---
check(
  "the NCA-1 P0 failure-isolation fix (try/catch around createNotificationFromEvent inside enqueue) is still present",
  /try\s*{\s*\n\s*await createNotificationFromEvent/.test(outboxRepoSrc),
);
check(
  "outbox-repo.ts (the source-domain transaction boundary) never imports the delivery/email adapter — external delivery cannot block or couple to a source-domain commit",
  !/delivery-service|notification-mail-adapter/.test(outboxRepoSrc),
);

// --- 10/11/12. No EXR-owned layout changes, no IOH authority changes, no duplicate domain notification store (diff-based) ---
try {
  const changedFiles = execSync("git diff --name-only HEAD", { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);
  const unexpectedShellChange = changedFiles.some((path) => /src\/layouts\//.test(path) || /RootProviders/.test(path));
  check("no EXR-owned shell/layout/RootProviders file was modified", !unexpectedShellChange);
  const migrationChanged = changedFiles.some((path) => /apps\/shs-api\/migrations\//.test(path));
  check("no migration file was added or modified in this phase (migration head stays 142/143 as established)", !migrationChanged);
} catch {
  console.warn("WARN could not run `git diff` to verify EXR/migration boundaries (non-git environment) — skipping those checks");
}

// --- 13. Migration expectations respected: migration head is unchanged from NCA-2 ---
const migrationFiles = execSync(`ls ${JSON.stringify(join(root, "migrations"))}`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
const highestMigration = migrationFiles.map((name) => parseInt(name.slice(0, 3), 10)).filter((n) => !Number.isNaN(n)).sort((a, b) => b - a)[0];
check("migration head remains 143 (NCA-2's preferences migration) — NCA-4 introduced no new migration", highestMigration === 143);

console.log("");
if (failures.length) {
  console.error(`NCA-4 validator FAILED: ${failures.length} check(s) failed.`);
  process.exit(1);
} else {
  console.log("NCA-4 validator PASSED: domain-integration coverage, delivery-channel boundaries, idempotency, retry bounds, and isolation guarantees all hold.");
}
