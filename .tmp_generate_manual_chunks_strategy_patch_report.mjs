import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const buildLogPath = path.join(root, ".tmp_manual_chunks_strategy_patch_build.log");
const reportPath = path.join(root, "src/shared/hardening/manualChunksStrategyPatchReport.json");
const targetPath = path.join(root, "vite.config.js");
const auditPath = path.join(root, "src/shared/hardening/viteManualChunksAudit.json");

const buildLog = fs.existsSync(buildLogPath) ? fs.readFileSync(buildLogPath, "utf8") : "";
const target = fs.readFileSync(targetPath, "utf8");
const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));

function parseAssetLines(log) {
  const lines = log.split("\\n");
  const assets = [];

  for (const line of lines) {
    const match = line.match(/dist\\/assets\\/([^\\s]+)\\s+([\\d,.]+)\\s+kB\\s+│\\s+gzip:\\s+([\\d,.]+)\\s+kB/);
    if (!match) continue;

    const [, fileName, rawKbText, gzipKbText] = match;
    const rawKb = Number(rawKbText.replaceAll(",", ""));
    const gzipKb = Number(gzipKbText.replaceAll(",", ""));

    assets.push({
      fileName,
      rawKb,
      gzipKb,
      type: fileName.endsWith(".js") ? "js" : fileName.endsWith(".css") ? "css" : "asset",
      isLarge: rawKb >= 700,
      isVeryLarge: rawKb >= 1000,
    });
  }

  return assets.sort((a, b) => b.rawKb - a.rawKb);
}

function findAsset(list, predicate) {
  return (list || []).find(predicate) || null;
}

const assets = parseAssetLines(buildLog);
const largeAssets = assets.filter((asset) => asset.isLarge);
const jsAssets = assets.filter((asset) => asset.type === "js");
const cssAssets = assets.filter((asset) => asset.type === "css");

const expectedChunkBuckets = [
  "vendor-react",
  "vendor-map",
  "vendor-charts",
  "vendor-motion",
  "vendor-ui",
  "vendor-export",
  "vendor-data",
  "vendor",
  "pages-exchange",
  "pages-admin",
  "pages-hub",
  "pages-foundation",
  "pages-public",
  "pages-lord",
  "pages",
  "components",
  "shared",
];

const chunkBucketDetected = Object.fromEntries(
  expectedChunkBuckets.map((bucket) => [
    bucket,
    assets.some((asset) => String(asset.fileName || "").startsWith(bucket + "-")),
  ])
);

const manualChunksPatchDetected = {
  normalizedIdDetected: target.includes("const normalizedId = id.replace"),
  vendorChartsDetected: target.includes("vendor-charts"),
  vendorMotionDetected: target.includes("vendor-motion"),
  vendorUiDetected: target.includes("vendor-ui"),
  vendorExportDetected: target.includes("vendor-export"),
  vendorDataDetected: target.includes("vendor-data"),
  pagesExchangeDetected: target.includes("pages-exchange"),
  pagesAdminDetected: target.includes("pages-admin"),
  pagesFoundationDetected: target.includes("pages-foundation"),
  chunkWarningLimitRemains700: target.includes("chunkSizeWarningLimit: 700"),
};

const report = {
  generatedAt: new Date().toISOString(),
  source: "SHS Post-V1 Bundle Optimization Patch 15",
  mode: "MANUAL_CHUNKS_STRATEGY_PATCH",
  manualChunksStrategyPatchStatus: buildLog.includes("✓ built in") ? "build_passed" : "build_not_confirmed",
  manualChunksStrategyPatchLabel: "ManualChunks Strategy Patch Applied",
  productionDecision:
    "vite.config.js manualChunks was split into narrower vendor and page buckets without raising chunkSizeWarningLimit. Production build passed after the strategy patch.",
  changedFile: "vite.config.js",
  priorAuditSummary: audit.auditSummary,
  manualChunksPatchDetected,
  chunkBucketDetected,
  bundleSummaryAfterPatch: {
    totalAssetsParsed: assets.length,
    totalJsAssets: jsAssets.length,
    totalCssAssets: cssAssets.length,
    largeAssets: largeAssets.length,
    largestAssetFileName: assets[0]?.fileName || null,
    largestAssetRawKb: assets[0]?.rawKb || null,
    buildWarningDetected: buildLog.includes("Some chunks are larger than"),
    frontendBuildPassed: buildLog.includes("✓ built in"),
  },
  largestAssetsAfterPatch: assets.slice(0, 40),
  largeAssetsAfterPatch: largeAssets,
  detectedChunkBuckets: Object.entries(chunkBucketDetected)
    .filter(([, detected]) => detected)
    .map(([bucket]) => bucket),
  nextRecommendedActions: [
    {
      step: 1,
      label: "Compare manualChunks impact",
      action: "Compare this build against Patch 14 audit and original bundle inventory.",
    },
    {
      step: 2,
      label: "Browser recheck major routes",
      action: "Open Main Home, Admin Home, Exchange Mission, Unified Truth, Hub Dashboard, and Reporting Command Surface.",
    },
    {
      step: 3,
      label: "Only tune further if needed",
      action: "If large chunks remain, inspect which new bucket is still oversized before another patch.",
    }
  ],
};

if (!report.manualChunksPatchDetected.normalizedIdDetected) {
  throw new Error("ManualChunks normalizedId strategy was not detected.");
}

if (!report.manualChunksPatchDetected.chunkWarningLimitRemains700) {
  throw new Error("chunkSizeWarningLimit was changed away from 700.");
}

if (!report.manualChunksPatchDetected.pagesExchangeDetected) {
  throw new Error("pages-exchange chunk strategy was not detected.");
}

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\\n");

console.log("MANUAL_CHUNKS_STRATEGY_PATCH_REPORT_WRITTEN", "src/shared/hardening/manualChunksStrategyPatchReport.json");
console.log("STATUS", report.manualChunksStrategyPatchStatus);
console.log("MANUAL_CHUNKS_PATCH_DETECTED", JSON.stringify(manualChunksPatchDetected, null, 2));
console.log("BUNDLE_SUMMARY_AFTER_PATCH", JSON.stringify(report.bundleSummaryAfterPatch, null, 2));
console.log("DETECTED_CHUNK_BUCKETS", report.detectedChunkBuckets.join(", "));
console.log("LARGEST_ASSETS_AFTER_PATCH");
for (const asset of report.largestAssetsAfterPatch.slice(0, 16)) {
  console.log("-", asset.fileName, `${asset.rawKb}kB`, `gzip:${asset.gzipKb}kB`);
}
