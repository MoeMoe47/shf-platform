import fs from "fs";
import path from "path";
import crypto from "crypto";

function die(msg) {
  console.error("❌ UI CONTRACT:", msg);
  process.exit(1);
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    die(`Failed to read JSON: ${p}\n${e?.message || e}`);
  }
}

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function loadContract(contractPathAbs) {
  const raw = fs.readFileSync(contractPathAbs, "utf8");
  const j = JSON.parse(raw);

  if (!j || typeof j !== "object") die(`Contract JSON invalid: ${contractPathAbs}`);
  if (!j.id || typeof j.id !== "string") die(`Missing contract.id in ${contractPathAbs}`);
  if (typeof j.version !== "number") die(`Missing contract.version (number) in ${contractPathAbs}`);
  if (!j.component || typeof j.component !== "string") die(`Missing contract.component in ${contractPathAbs}`);
  if (!Array.isArray(j.requiredClassHooks)) die(`Missing contract.requiredClassHooks[] in ${contractPathAbs}`);

  return { raw, j, hash: sha256(raw) };
}

function loadLock(lockPathAbs) {
  if (!exists(lockPathAbs)) {
    die(`Missing lock file: ${lockPathAbs}\nRun the lock command to generate it.`);
  }
  const j = readJson(lockPathAbs);
  if (!j || typeof j !== "object") die(`Lock JSON invalid: ${lockPathAbs}`);
  if (!j.id || typeof j.id !== "string") die(`Missing lock.id in ${lockPathAbs}`);
  if (typeof j.lastVersion !== "number") die(`Missing lock.lastVersion (number) in ${lockPathAbs}`);
  if (!j.lastHash || typeof j.lastHash !== "string") die(`Missing lock.lastHash in ${lockPathAbs}`);
  return j;
}

// Extract all className="..."
// IMPORTANT: we only validate hooks appear inside className strings (NOT anywhere else).
function extractClassNameStrings(componentSource) {
  const out = [];
  const re = /className\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(componentSource))) out.push(m[1]);
  return out;
}

function validateHooks(contract, componentPathAbs) {
  if (!exists(componentPathAbs)) die(`Component file missing: ${componentPathAbs}`);

  const src = fs.readFileSync(componentPathAbs, "utf8");
  const classStrings = extractClassNameStrings(src);

  if (!classStrings.length) {
    die(`No className="..." strings found in component: ${contract.component}\nContract requires hooks be present in className strings.`);
  }

  const hay = classStrings.join("\n");
  const missing = [];

  for (const hook of contract.requiredClassHooks) {
    if (typeof hook !== "string" || !hook.trim()) continue;
    // ensure hook appears as a discrete class token somewhere inside className strings
    const tokenRe = new RegExp(`(^|\\s)${hook.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`);
    if (!tokenRe.test(hay)) missing.push(hook);
  }

  if (missing.length) {
    die(
      `Missing required class hooks (must appear inside className="...")\n` +
      `Component: ${contract.component}\n` +
      `Missing: ${missing.join(", ")}`
    );
  }
}

function validateLock(contractPathAbs, lockPathAbs) {
  const { raw, j: contract, hash } = loadContract(contractPathAbs);
  const lock = loadLock(lockPathAbs);

  if (lock.id !== contract.id) {
    die(`Lock id mismatch.\nContract: ${contract.id}\nLock: ${lock.id}`);
  }

  // Strict: lock must match current contract exactly
  if (lock.lastHash !== hash) {
    die(
      `Contract hash changed but lock was NOT updated.\n` +
      `Contract: ${path.relative(process.cwd(), contractPathAbs)}\n` +
      `Lock:     ${path.relative(process.cwd(), lockPathAbs)}\n\n` +
      `Fix:\n` +
      `  1) Bump version in contract JSON\n` +
      `  2) Re-lock (update lastVersion + lastHash)\n`
    );
  }

  if (lock.lastVersion !== contract.version) {
    die(
      `Lock version mismatch.\n` +
      `Contract version: ${contract.version}\n` +
      `Lock lastVersion: ${lock.lastVersion}\n\n` +
      `Fix: re-lock after bumping contract version.`
    );
  }

  return contract;
}

function main() {
  const contractsDir = path.resolve("ui/contracts");
  if (!exists(contractsDir)) die(`Missing directory: ui/contracts`);

  const files = fs.readdirSync(contractsDir).filter((f) => f.endsWith(".contract.json"));
  if (!files.length) die(`No *.contract.json found in ui/contracts`);

  let ok = 0;

  for (const f of files) {
    const contractPathAbs = path.resolve(contractsDir, f);
    const lockPathAbs = path.resolve(contractsDir, f.replace(/\.contract\.json$/, ".contract.lock.json"));

    const contract = validateLock(contractPathAbs, lockPathAbs);

    const componentPathAbs = path.resolve(contract.component);
    validateHooks(contract, componentPathAbs);

    ok++;
  }

  console.log(`✅ UI contracts validated (${ok}).`);
}

main();
