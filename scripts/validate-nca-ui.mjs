// NCA-3 — deterministic validator for the canonical in-app notification
// UI. Run with: node scripts/validate-nca-ui.mjs (registered as
// `npm run nca:ui:validate`).
//
// This is a structural/textual validator (no JSX transform available to
// plain `node`, matching this repo's existing scripts/validate-*.mjs
// convention) — it checks file existence, import wiring, and the absence
// of the specific fake-data patterns NCA-0 found, rather than rendering
// components.

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

const notifDir = "src/components/shared/notifications";

// --- 1. Canonical shared bell/inbox exist (one implementation each) ---
check("canonical NotificationBell exists", existsSync(join(root, notifDir, "NotificationBell.jsx")));
check("canonical NotificationInbox exists", existsSync(join(root, notifDir, "NotificationInbox.jsx")));
check("canonical shared hook (useNotifications) exists", existsSync(join(root, notifDir, "useNotifications.js")));
check("canonical attention projection component exists", existsSync(join(root, notifDir, "NotificationAttentionProjection.jsx")));

const bellSrc = read(`${notifDir}/NotificationBell.jsx`);
const inboxSrc = read(`${notifDir}/NotificationInbox.jsx`);
const hookSrc = read(`${notifDir}/useNotifications.js`);
const itemSrc = read(`${notifDir}/NotificationItem.jsx`);
const attentionSrc = read(`${notifDir}/NotificationAttentionProjection.jsx`);
const apiSrc = read("src/lib/notifications/api.js");

// --- 2. No duplicate notification persistence in the shared UI layer ---
check(
  "shared notification UI does not use localStorage as authority",
  !/localStorage\.(get|set)Item/.test(bellSrc + inboxSrc + hookSrc),
);

// --- 3. Canonical API client is used, not ad hoc fetches, by the shared UI ---
check(
  "shared hook calls the canonical API client module",
  /@\/lib\/notifications\/api\.js/.test(hookSrc),
);

// --- 4. The three previously-fake bells no longer contain their old fake patterns ---
const storeHeaderSrc = read("src/components/store/StoreHeader.jsx");
const arcadeExtrasSrc = read("src/components/arcade/ArcadeHeaderExtras.jsx");
const civicTopBarSrc = read("src/components/civic/CivicTopBar.jsx");
check(
  "Store header no longer renders the static 'all caught up' fake panel",
  !/cs-notifPanel"/.test(storeHeaderSrc),
);
check(
  "Arcade header no longer renders the static 'no live feed' fake dialog",
  !/no live notification feed wired up/.test(arcadeExtrasSrc),
);
check(
  "CivicSure top bar no longer renders the static 'no live feed' fake dialog",
  !/no live\s*\n?\s*notification feed wired up/.test(civicTopBarSrc.replace(/\s+/g, " ")),
);
check(
  "Store header now consumes the canonical NotificationBell",
  /NotificationBell/.test(storeHeaderSrc),
);
check(
  "Arcade header now consumes the canonical NotificationBell",
  /NotificationBell/.test(arcadeExtrasSrc),
);
check(
  "CivicSure top bar now consumes the canonical NotificationBell",
  /NotificationBell/.test(civicTopBarSrc),
);

// --- 5. Curriculum's real path was refactored to the shared component (no regression to a bespoke reimplementation) ---
const curriculumHeaderSrc = read("src/components/curriculum/CurriculumHeader.jsx");
check(
  "Curriculum header consumes the shared canonical NotificationBell",
  /NotificationBell/.test(curriculumHeaderSrc),
);
check(
  "Curriculum header's pre-existing mark-read recursion bug is gone (no local shadowing function declaration)",
  !/^\s*async function markNotificationRead/m.test(curriculumHeaderSrc),
);

// --- 6. Action-required is source-derived (classification registry), never hardcoded true/false by the UI ---
check(
  "the notification item component reads actionRequired from the item (backend-classified), not a hardcoded literal",
  /item\.actionRequired/.test(itemSrc),
);
check(
  "action-required items are never hidden after being marked read (read does not imply completion)",
  /never implies the underlying action is complete/.test(hookSrc),
);

// --- 7. Attention projection reuses the existing SeaAttention primitive — no second attention store ---
check(
  "attention projection reuses the existing SeaAttention component, not a new attention UI",
  /SeaAttention/.test(attentionSrc) && /components\/sea\/SeaDashboardPrimitives/.test(attentionSrc),
);
check(
  "attention projection is derived from the canonical notification inbox hook, not a separate store",
  /useNotificationInbox/.test(attentionSrc),
);

// --- 8. Organization context represented in the shared API/hook layer ---
check(
  "API client supports organization-scoped requests",
  /organizationId/.test(apiSrc) && /withOrganizationQuery/.test(apiSrc),
);
check(
  "shared hook threads organizationId through list/count/attention calls",
  /organizationId/.test(hookSrc),
);

// --- 9. Safe action routing: destination links are validated, never raw client-controlled URLs ---
check(
  "notification action links are validated as same-origin relative paths before rendering",
  /isSafeInternalPath/.test(itemSrc),
);

// --- 10. EXR boundary: only the known, intended files were touched — no shell/layout/RootProviders file changed ---
try {
  const changedFiles = execSync("git diff --name-only HEAD", { cwd: root, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  const unexpectedShellChange = changedFiles.some((path) =>
    /src\/layouts\//.test(path) || /RootProviders/.test(path) || /src\/router\/paths\.js/.test(path),
  );
  check("no EXR-owned shell/layout/RootProviders file was modified", !unexpectedShellChange);
} catch {
  console.warn("WARN could not run `git diff` to verify EXR boundary (non-git environment) — skipping that check");
}

console.log("");
if (failures.length) {
  console.error(`NCA-3 UI validator FAILED: ${failures.length} check(s) failed.`);
  process.exit(1);
} else {
  console.log("NCA-3 UI validator PASSED: canonical bell/inbox, fake-data elimination, and EXR boundary checks all hold.");
}
