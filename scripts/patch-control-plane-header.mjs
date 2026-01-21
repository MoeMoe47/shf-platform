import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

// Heuristic: find "header-ish" files in components/layouts that likely render the global header
function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function isCandidate(p) {
  const okDir = p.includes(`${path.sep}src${path.sep}components${path.sep}`) || p.includes(`${path.sep}src${path.sep}layouts${path.sep}`);
  if (!okDir) return false;
  if (!p.endsWith(".jsx") && !p.endsWith(".tsx")) return false;
  const base = path.basename(p).toLowerCase();
  if (base.includes("registry")) return false;
  return base.includes("header") || base.includes("shell") || base.includes("nav") || base.includes("topbar") || base.includes("layout");
}

function scoreContent(s) {
  let score = 0;
  if (s.includes("unified-shell")) score += 5;
  if (s.includes("<header")) score += 4;
  if (s.includes("data-app")) score += 2;
  if (s.includes("AppLink") || s.includes("HashRouter")) score += 1;
  if (s.includes("sidebar")) score += 1;
  return score;
}

const files = walk(SRC).filter(isCandidate);

let best = null;
for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  const sc = scoreContent(s);
  if (!best || sc > best.sc) best = { f, sc, s };
}

if (!best || best.sc < 5) {
  console.error("❌ Could not confidently find a global header file to patch.");
  console.error("   Tip: rename your global header file to include 'Header' or 'Shell' and rerun this script.");
  process.exit(1);
}

let s = best.s;

// Skip if already patched
if (s.includes("ControlPlaneStrip")) {
  console.log("✅ Header already contains ControlPlaneStrip:", path.relative(ROOT, best.f));
  process.exit(0);
}

// Add import
const importLine = `import ControlPlaneStrip from "@/components/platform/ControlPlaneStrip.jsx";\n`;
if (s.includes('from "react"') || s.includes("from 'react'")) {
  // Insert after first react import block
  const m = s.match(/import\s+React[^;]*;\s*\n/);
  if (m) {
    const idx = m.index + m[0].length;
    s = s.slice(0, idx) + importLine + s.slice(idx);
  } else {
    s = importLine + s;
  }
} else {
  s = importLine + s;
}

// Inject JSX: put strip near end of header, right side.
// Strategy: find first <header ...> ... </header> and insert before closing </header>.
const headerClose = s.indexOf("</header>");
if (headerClose === -1) {
  console.error("❌ Found candidate file but no </header> tag to patch:", path.relative(ROOT, best.f));
  process.exit(1);
}

const inject = `\n      {/* Control Plane (global) */}\n      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>\n        <ControlPlaneStrip />\n      </div>\n`;

s = s.slice(0, headerClose) + inject + s.slice(headerClose);

fs.writeFileSync(best.f, s, "utf8");
console.log("✅ Patched global header:", path.relative(ROOT, best.f));
