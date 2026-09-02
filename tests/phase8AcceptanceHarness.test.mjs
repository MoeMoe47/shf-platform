import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";

test("database disposable identity resolver is unavailable in production", async () => {
  const result = await new Promise((resolve, reject) => {
    const child = spawn("node", ["--import", "tsx", "--input-type=module", "-e", [
      'process.env.SHS_AUTH_ENV = "production";',
      'process.env.NODE_ENV = "production";',
      'process.env.SHS_DEV_DATABASE_IDENTITY_ENABLED = "1";',
      'process.env.DATABASE_URL = "postgres://production-probe.invalid/shs";',
      'const { IdentityRepo } = await import("./apps/shs-api/src/domain/identity/repo/identity-repo.ts");',
      'const identity = await new IdentityRepo().getUserById("disposable_production_probe");',
      'if (identity !== null) process.exit(1);',
    ].join("")], { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => resolve({ code, stderr }));
  });
  assert.equal(result.code, 0, result.stderr);
});
