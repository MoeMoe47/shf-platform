import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import { buildHtml } from "./buildHtml.js";

function arg(name, fallback=null) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i+1] : fallback;
}

const mode = arg("--mode", "executive"); // executive | technical
const input = arg("--input", "inputs/report-data.json");

if (!fs.existsSync(input)) {
  console.error(`❌ Missing input JSON: ${input}`);
  console.error(`Create it at services/shf-report-engine/inputs/report-data.json`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(input, "utf8"));
const { html, reportId, reportDate } = buildHtml({ mode, data });

const outDir = path.resolve("outputs");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${reportId}.${mode}.${reportDate}.pdf`);

const browser = await chromium.launch();
const page = await browser.newPage();

// Load HTML directly
await page.setContent(html, { waitUntil: "networkidle" });

// Generate PDF
await page.pdf({
  path: outFile,
  format: "Letter",
  printBackground: true
});

await browser.close();

console.log("✅ PDF generated:");
console.log(outFile);
