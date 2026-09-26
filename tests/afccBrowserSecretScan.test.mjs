// AFCC-2A.1: browser bundles must contain no privileged credential.
//
// 1. Source scan (fast): no whole-object `import.meta.env` (which makes Vite inline
//    EVERY VITE_* value), no key-like VITE_* reads, no X-Admin-Key header setting,
//    and no localStorage admin-key reads in browser code.
// 2. Build scan: a real production build (to a temp dir) with sentinel values
//    injected into the old VITE_* key variables, then every output file is
//    searched for the sentinels, the real server-only secret values from local
//    env files, known test fixtures, and credential markers.
//
// Secret values are never printed — only counts and file names.
// Run: node --test tests/afccBrowserSecretScan.test.mjs   (npm run security:bundle-secret-scan)
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const ROOT = new URL("../", import.meta.url).pathname;
const SRC = path.join(ROOT, "src");

// Public-by-design browser tokens (Mapbox public "pk." tokens are meant for browsers).
const ALLOWED_VITE_TOKENS = new Set(["VITE_MAPBOX_TOKEN"]);
const REMOVED_VITE_SECRETS = ["VITE_SHF_AGENT_ADMIN_KEY", "VITE_ADMIN_KEY", "VITE_APP_GATEWAY_KEY"];

function browserSourceFiles(dir = SRC, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_patchbak" || entry.name === "node_modules") continue;
      browserSourceFiles(full, out);
    } else if (/\.(js|jsx|ts|tsx|mjs)$/.test(entry.name) && !/\.bak/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

// Drop only whole comment lines. Regex-stripping block comments is unsafe here:
// strings such as "src/**/*.js" would open a fake comment and hide real code.
function stripComments(code) {
  return code
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\/\*|\*)/.test(line))
    .join("\n");
}

function parseEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

// Real server-only secret VALUES present on this machine (never printed).
function localSecretValues() {
  const files = [".env", ".env.local", ".env.production", "services/shf-agent-fabric/.env", "apps/shs-api/.env"];
  const values = new Set();
  for (const rel of files) {
    const env = parseEnvFile(path.join(ROOT, rel));
    for (const [name, value] of Object.entries(env)) {
      if (ALLOWED_VITE_TOKENS.has(name)) continue;
      if (!/(KEY|SECRET|TOKEN|PASSWORD|PASSWD|HMAC|KEYRING|PRIVATE)/.test(name)) continue;
      if (/_JSON$/.test(name)) {
        try {
          for (const v of Object.values(JSON.parse(value) || {})) if (String(v).length >= 8) values.add(String(v));
        } catch {}
        continue;
      }
      if (value.length >= 8) values.add(value);
    }
  }
  return [...values];
}

const TEST_FIXTURE_SECRETS = ["afcc-local-test", "test-admin-key", "test-only-secret", "test-secret"];
const MARKERS = [
  { name: "removed VITE secret variable name", re: new RegExp(REMOVED_VITE_SECRETS.join("|")) },
  { name: "X-Admin-Key header assignment", re: /["']x-admin-key["']\s*[:\]]/i },
  { name: "localStorage admin-key read", re: /getItem\(\s*["'](ADMIN_API_KEY|shf_admin_key)["']\s*\)/ },
  { name: "HMAC service keyring variable", re: /SHF_(INTERNAL_SERVICE_KEYS|ATTEST_KEYRING)_JSON/ },
];

test("source: browser code never references import.meta.env as a whole object", () => {
  const offenders = [];
  for (const file of browserSourceFiles()) {
    const code = stripComments(fs.readFileSync(file, "utf8"));
    if (/import\.meta\.env(?![\w$.])/.test(code) || /import\.meta\.env\?\./.test(code)) offenders.push(path.relative(ROOT, file));
  }
  assert.deepEqual(offenders, [], "whole-object import.meta.env inlines every VITE_* value into the bundle");
});

test("source: no key-like VITE_* variable is read by browser code (public Mapbox token excepted)", () => {
  const offenders = [];
  for (const file of browserSourceFiles()) {
    const code = stripComments(fs.readFileSync(file, "utf8"));
    for (const m of code.matchAll(/import\.meta\.env\.(VITE_[A-Z0-9_]*(KEY|SECRET|TOKEN|PASSWORD|HMAC)[A-Z0-9_]*)/g)) {
      if (!ALLOWED_VITE_TOKENS.has(m[1])) offenders.push(`${path.relative(ROOT, file)}: ${m[1]}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("source: browser code neither sets X-Admin-Key nor reads an admin key from storage", () => {
  const offenders = [];
  for (const file of browserSourceFiles()) {
    const code = stripComments(fs.readFileSync(file, "utf8"));
    if (/["']x-admin-key["']\s*[:\]]/i.test(code)) offenders.push(`${path.relative(ROOT, file)}: sets X-Admin-Key`);
    if (/getItem\(\s*["'](ADMIN_API_KEY|shf_admin_key)["']\s*\)/.test(code)) offenders.push(`${path.relative(ROOT, file)}: reads admin key from storage`);
  }
  assert.deepEqual(offenders, []);
});

test("build: BROWSER BUNDLE PRIVILEGED SECRET COUNT = 0", { timeout: 600_000 }, () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "afcc-secret-scan-"));
  const sentinels = Object.fromEntries(
    REMOVED_VITE_SECRETS.map((name) => [name, `afcc-sentinel-${name.toLowerCase()}-${crypto.randomBytes(12).toString("hex")}`]),
  );
  try {
    // Sentinels are injected even if a developer still has these variables in .env.local:
    // the build must not inline them regardless.
    execFileSync(process.execPath, [path.join(ROOT, "node_modules/vite/bin/vite.js"), "build", "--outDir", outDir, "--emptyOutDir", "--logLevel", "error"], {
      cwd: ROOT,
      env: { ...process.env, ...sentinels },
      stdio: ["ignore", "ignore", "pipe"],
    });

    const needles = [
      ...Object.values(sentinels).map((value) => ({ kind: "injected sentinel", value })),
      ...localSecretValues().map((value) => ({ kind: "local server-only secret", value })),
      ...TEST_FIXTURE_SECRETS.map((value) => ({ kind: "test fixture secret", value })),
    ];
    const findings = [];
    let scanned = 0;
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { walk(full); continue; }
        if (!/\.(js|mjs|html|css|map|json|txt|webmanifest)$/.test(entry.name)) continue;
        scanned += 1;
        const text = fs.readFileSync(full, "utf8");
        for (const n of needles) if (text.includes(n.value)) findings.push(`${n.kind} in ${path.relative(outDir, full)}`);
        for (const m of MARKERS) if (m.re.test(text)) findings.push(`${m.name} in ${path.relative(outDir, full)}`);
      }
    };
    walk(outDir);
    console.log(`[secret-scan] scanned ${scanned} browser files for ${needles.length} secret values and ${MARKERS.length} markers; privileged findings: ${findings.length}`);
    assert.ok(scanned > 10, "build produced browser files to scan");
    assert.deepEqual(findings, [], "BROWSER BUNDLE PRIVILEGED SECRET COUNT must be 0");
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});
