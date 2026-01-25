import fs from "fs";
import crypto from "crypto";
import path from "path";

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function sha256(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

/**
 * Extract all string literals that appear inside className=... attributes.
 * Covers:
 *   className="a b"
 *   className={'a b'}
 *   className={"a b"}
 *   className={cond ? "a" : "a b"}
 *   className={["a","b"].join(" ")}
 *
 * Strategy: find each className=... attribute chunk, then collect quoted strings within it.
 */
function extractClassNameStrings(src) {
  const out = [];
  const reAttr = /className\s*=\s*(\{[\s\S]*?\}|"(?:\\.|[^"])*"|'(?:\\.|[^'])*')/g;
  let m;
  while ((m = reAttr.exec(src))) {
    const attrVal = m[1] || "";
    // collect all quoted strings inside the attribute value
    const reQuotes = /"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/g;
    let q;
    while ((q = reQuotes.exec(attrVal))) {
      const raw = q[0];
      const unq = raw.slice(1, -1);
      out.push(unq);
    }
  }
  return out;
}

function collectHookHits(classStrings) {
  // split by whitespace; keep full string too because some hooks appear as combined tokens
  const tokens = new Set();
  for (const s of classStrings) {
    tokens.add(s);
    for (const t of s.split(/\s+/).filter(Boolean)) tokens.add(t);
  }
  return tokens;
}

function fail(msg) {
  console.error("❌ UI Contract Validation Failed:");
  console.error("   " + msg);
  process.exit(1);
}

const contractPath = path.resolve("ui/contracts/appRegistry.contract.json");
const lockPath = path.resolve("ui/contracts/appRegistry.contract.lock.json");

if (!fs.existsSync(contractPath)) fail(`Missing contract: ${contractPath}`);
if (!fs.existsSync(lockPath)) fail(`Missing lock: ${lockPath}`);

const contractRaw = fs.readFileSync(contractPath, "utf8");
const contract = JSON.parse(contractRaw);
const lock = readJson(lockPath);

const hashNow = sha256(contractRaw);
const versionNow = Number(contract.version || 0);
const lastHash = String(lock.lastHash || "");
const lastVersion = Number(lock.lastVersion || 0);

// Enforce: if contract JSON changed, version must increase
if (lastHash && hashNow !== lastHash) {
  if (!(versionNow > lastVersion)) {
    fail(
      `Contract changed but version not bumped. lastVersion=${lastVersion}, currentVersion=${versionNow}. ` +
      `Bump ui/contracts/appRegistry.contract.json -> version: ${lastVersion + 1}+`
    );
  }
}

// Validate required hooks appear ONLY via className attributes
const componentPath = path.resolve(contract.component);
if (!fs.existsSync(componentPath)) fail(`Missing component file: ${componentPath}`);

const src = fs.readFileSync(componentPath, "utf8");
const classStrings = extractClassNameStrings(src);
const hits = collectHookHits(classStrings);

const required = Array.isArray(contract.requiredClassHooks) ? contract.requiredClassHooks : [];
const missing = required.filter((h) => !hits.has(h));

if (missing.length) {
  fail(
    `Missing required class hooks in className=... attributes:\n` +
    missing.map((x) => `   - ${x}`).join("\n")
  );
}

// If we get here, success. Update lock to new hash/version (atomic write).
const nextLock = {
  id: contract.id || "app-registry",
  lastVersion: versionNow,
  lastHash: hashNow
};
fs.writeFileSync(lockPath, JSON.stringify(nextLock, null, 2) + "\n", "utf8");

console.log("✅ UI Contract OK:", contract.id, "v" + versionNow);
