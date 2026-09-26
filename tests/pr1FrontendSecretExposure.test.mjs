import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const files = [
  "src/pages/admin/ReportsDashboard.jsx",
  "src/pages/admin/AlignmentSwitchboard.jsx",
  "src/pages/shf-command/agents/aiAnalystContextAdapter.js",
  "src/pages/shf-command/sections/AgentSyncStatus.jsx",
];

// AFCC-2A.1 supersedes the PR-1 "PROD ? '' :" guard: it did not stop Vite from
// inlining these values (whole-object import.meta.env references elsewhere pulled in
// every VITE_* value), so the private variables are no longer read by browser code at
// all. The bundle itself is checked by tests/afccBrowserSecretScan.test.mjs.
test("private admin VITE variables are never read by browser code", () => {
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /(import\.meta\.env|env)\??\.VITE_(ADMIN_KEY|APP_GATEWAY_KEY|SHF_AGENT_ADMIN_KEY)/, `${file} must not read a private browser env key`);
    assert.doesNotMatch(source, /["']x-admin-key["']\s*[:\]]/i, `${file} must not send X-Admin-Key`);
  }
});
