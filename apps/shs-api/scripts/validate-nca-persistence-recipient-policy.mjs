// NCA-2 — deterministic validator for canonical notification persistence,
// recipient resolution, and preference policy. Run with:
//   npx tsx scripts/validate-nca-persistence-recipient-policy.mjs
// (registered as `npm run nca:persistence:validate` in this package).
//
// This intentionally lives inside apps/shs-api (not the repo-root
// scripts/), because it validates this package's backend domain code and
// needs tsx's TypeScript loader to import it directly — the root
// scripts/*.mjs validators check the separate frontend `src/` package and
// cannot import these .ts modules. See NCA-2 report §35 for this
// deviation and why it is intentional, not an oversight.

import { readFileSync } from "node:fs";
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
const preferenceServiceSrc = read("src/domain/notifications/service/preference-service.ts");
const entitlementResolverSrc = read("src/domain/notifications/service/entitlement-resolver.ts");
const routesSrc = read("src/domain/notifications/api/routes.ts");
const notificationsMigration = read("migrations/081_notification_integration.sql");
const outboxMigration = read("migrations/007_integration_outbox.sql");
const preferencesMigration = read("migrations/143_notification_preferences.sql");

// --- 1. Canonical persistence owner: exactly one writer of `notifications` rows ---
const insertNotificationsSites = [];
for (const [path, src] of [
  ["service/notification-service.ts", notificationServiceSrc],
]) {
  if (/INSERT INTO notifications\b/.test(src)) insertNotificationsSites.push(path);
}
const grepInsertElsewhere = execSync(
  `grep -rl "INSERT INTO notifications\\b" ${JSON.stringify(join(root, "src"))} || true`,
  { encoding: "utf8" },
).trim().split("\n").filter(Boolean);
check(
  "canonical notification persistence owner: only notification-service.ts writes `notifications` rows",
  grepInsertElsewhere.length === 1 && grepInsertElsewhere[0].endsWith("notification-service.ts"),
);

// --- 2. No duplicate notification table/domain ---
const forbiddenNames = ["notification_v2", "new_notifications", "universal_notifications", "communication_notifications"];
const migrationsAll = execSync(`ls ${JSON.stringify(join(root, "migrations"))}`, { encoding: "utf8" });
const anyForbidden = forbiddenNames.some((name) => migrationsAll.includes(name));
check("no duplicate notification table/domain name introduced", !anyForbidden);

// --- 3. Recipient resolver exists and is deterministic/server-side ---
const { createNotificationFromEvent, listNotifications, resolveAuthorizedOrganizationIds } = await import(
  "../src/domain/notifications/service/notification-service.ts"
);
check("recipient resolver (createNotificationFromEvent) exists", typeof createNotificationFromEvent === "function");
check("canonical listing entry point (listNotifications) exists", typeof listNotifications === "function");

// --- 4. Organization scoping represented in canonical schema ---
check(
  "organization scoping represented (organization_id + tenant_id on notifications)",
  /organization_id TEXT NOT NULL/.test(notificationsMigration) && /tenant_id TEXT NOT NULL/.test(notificationsMigration),
);

// --- 5. Multi-org semantics represented and correct ---
const multiOrgIds = resolveAuthorizedOrganizationIds({
  active_organization_id: "org-a",
  memberships: [{ organization_id: "org-a" }, { organization_id: "org-b" }, { organization_id: "org-a" }],
});
check(
  "multi-org resolution includes every membership organization, deduplicated",
  JSON.stringify(multiOrgIds) === JSON.stringify(["org-a", "org-b"]),
);

// --- 6. Preference categories valid and mandatory categories are not suppressible ---
const { SUPPRESSIBLE_CATEGORIES, isSuppressibleCategory, classifyNotificationType } = await import(
  "../src/domain/notifications/contracts/notification-classification.ts"
);
check(
  "preference categories are exactly the two approved suppressible categories",
  JSON.stringify([...SUPPRESSIBLE_CATEGORIES].sort()) === JSON.stringify(["DIGEST_ELIGIBLE", "OPTIONAL_PRODUCT"]),
);
check(
  "MANDATORY_OPERATIONAL / REQUIRED_ACTION / TRANSACTIONAL are never suppressible",
  !isSuppressibleCategory("MANDATORY_OPERATIONAL") && !isSuppressibleCategory("REQUIRED_ACTION") && !isSuppressibleCategory("TRANSACTIONAL"),
);
check(
  "a real MANDATORY_OPERATIONAL type (DOCUMENTATION_SIGNATURE_REQUIRED) is classified as non-suppressible",
  classifyNotificationType("DOCUMENTATION_SIGNATURE_REQUIRED").category === "MANDATORY_OPERATIONAL",
);

// --- 7. Preference table CHECK constraint enforces the same boundary at the DB level ---
check(
  "notification_preferences CHECK constraint only allows the two suppressible categories",
  /CHECK \(category IN \('OPTIONAL_PRODUCT', 'DIGEST_ELIGIBLE'\)\)/.test(preferencesMigration),
);

// --- 8. Read state cannot imply workflow completion ---
check(
  "actionState is never assigned ACTION_COMPLETED from read/archive state (no direct assignment in source)",
  !/actionState\s*=\s*["']ACTION_COMPLETED["']/.test(notificationServiceSrc) &&
  !/status === ["']READ["'][^;]*ACTION_COMPLETED/.test(notificationServiceSrc),
);

// --- 9. Dedupe / idempotency configured ---
check(
  "notifications dedupe constraint present",
  /UNIQUE \(organization_id, tenant_id, recipient_user_id, notification_type, source_event_id\)/.test(notificationsMigration),
);
check(
  "integration_outbox idempotency constraint present",
  /UNIQUE \(organization_id, producer_id, idempotency_key\)/.test(outboxMigration),
);

// --- 10. Source-event linkage present ---
check(
  "source event linkage columns present (source_event_id/source_event_type)",
  /source_event_id TEXT NOT NULL/.test(notificationsMigration) && /source_event_type TEXT NOT NULL/.test(notificationsMigration),
);

// --- 11. Notification failure isolation preserved (NCA-1 P0 fix not reverted) ---
const outboxRepoSrc = read("src/domain/trusted-reporting/outbox-repo.ts");
check(
  "notification-projection failure isolation (try/catch around createNotificationFromEvent) is present",
  /try\s*{\s*\n\s*await createNotificationFromEvent/.test(outboxRepoSrc),
);

// --- 12. No Evidence/Truth writes from the notifications domain ---
const notificationsDomainHasTruthWrite = /linkTruthSpineRecord|INSERT INTO gpa_truth_determinations/.test(
  notificationServiceSrc + preferenceServiceSrc + entitlementResolverSrc,
);
check("notifications domain does not write Evidence/Truth Spine tables", !notificationsDomainHasTruthWrite);

// --- 13. Entitlement resolver reuses the canonical service_catalog / organization_service_entitlements tables ---
check(
  "entitlement resolver reuses the canonical service_catalog/organization_service_entitlements tables (no parallel entitlement model)",
  /organization_service_entitlements/.test(entitlementResolverSrc) && /service_catalog/.test(entitlementResolverSrc),
);

// --- 14. EXR slot data contract endpoints exist ---
check(
  "attention-item and multi-org projection endpoints exist for the EXR slot contract",
  /\/notifications\/attention-items/.test(routesSrc) && /\/notifications\/organizations/.test(routesSrc),
);
// NCA-2 was backend-only, so this validator originally also asserted that
// no frontend shell/header file had been touched in the diff. As of NCA-3
// (the in-app UI phase), legitimately wiring the canonical bell into each
// shell's header IS the work — that check would now fail on correct,
// intended changes. The more precise version of this concern (EXR-owned
// layout/RootProviders files specifically, which no phase should touch)
// now lives in the frontend's own scripts/validate-nca-ui.mjs, which
// correctly allows header files while still catching layout/RootProviders
// overreach. See docs/architecture/NCA-3_IN_APP_INBOX_ATTENTION_PROJECTION.md.

console.log("");
if (failures.length) {
  console.error(`NCA-2 validator FAILED: ${failures.length} check(s) failed.`);
  process.exit(1);
} else {
  console.log("NCA-2 validator PASSED: all canonical persistence, recipient-resolution, and preference-policy checks hold.");
}
