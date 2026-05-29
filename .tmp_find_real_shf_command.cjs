const fs = require("fs");
const path = require("path");
const parser = require("./node_modules/@babel/parser");

const root = process.cwd();
const active = path.join(root, "src/pages/shf-command/SHFImpactCommandCenter.jsx");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    let st;

    try {
      st = fs.statSync(p);
    } catch {
      continue;
    }

    if (st.isDirectory()) {
      if (["node_modules", "dist", ".git"].includes(name)) continue;
      walk(p, out);
    } else {
      if (/SHFImpactCommandCenter.*\.jsx(\.bak)?$/.test(name)) {
        out.push(p);
      }
    }
  }

  return out;
}

function canParse(file) {
  try {
    const code = fs.readFileSync(file, "utf8");

    // Exclude temporary shells and broken snapshots.
    if (code.includes("SHF RECOVERY MODE")) return false;
    if (code.includes("temporary safe shell")) return false;
    if (file.includes("RECOVERY_SHELL")) return false;
    if (file.includes("BROKEN")) return false;

    // Require signs of the real full command center.
    if (!code.includes("ImpactKpiBand")) return false;
    if (!code.includes("AIAnalystPanel")) return false;
    if (!code.includes("SHFImpactOhioMap")) return false;

    parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx"],
    });

    return true;
  } catch {
    return false;
  }
}

const candidates = walk(root)
  .filter((p) => p !== active)
  .map((p) => ({
    file: p,
    rel: path.relative(root, p),
    mtime: fs.statSync(p).mtimeMs,
    valid: canParse(p),
  }))
  .sort((a, b) => b.mtime - a.mtime);

const valid = candidates.filter((x) => x.valid);

console.log("Total candidates:", candidates.length);
console.log("Valid real full candidates:", valid.length);

for (const item of valid.slice(0, 20)) {
  console.log("VALID:", item.rel);
}

if (!valid.length) {
  process.exit(2);
}

fs.writeFileSync(".tmp_real_shf_candidate.txt", valid[0].file);
console.log("SELECTED:", valid[0].rel);
