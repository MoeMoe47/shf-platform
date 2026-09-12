import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const files = [
  "src/pages/admin/ReportsDashboard.jsx",
  "src/pages/admin/AlignmentSwitchboard.jsx",
  "src/pages/shf-command/agents/aiAnalystContextAdapter.js",
  "src/pages/shf-command/sections/AgentSyncStatus.jsx",
];

test("private admin VITE variables are ignored by production browser bundles", () => {
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const privateEnvReads = source
      .split("\n")
      .filter((line) => /(import\.meta\.env|env)\.VITE_(ADMIN_KEY|APP_GATEWAY_KEY|SHF_AGENT_ADMIN_KEY)/.test(line));
    assert.ok(privateEnvReads.length > 0, `${file} should contain the reviewed private key reference`);
    for (const line of privateEnvReads) {
      assert.match(line, /PROD\s*\?\s*""\s*:/, `${file} must fail closed for private browser env keys in production`);
    }
  }
});
