import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCommercialProductOnboardingManifest } from "../src/domain/commercial-product-registry/onboarding/commercial-product-onboarding.ts";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(apiRoot, "../..");
const auditPath = path.join(repoRoot, "docs/sales/commercial-catalog-audit/commercial-candidate-inventory.json");
const designPath = path.join(repoRoot, "docs/sales/commercial-product-registry-design/initial-32-candidate-design-mapping.json");
const outputPath = path.join(repoRoot, "docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json");
const matrixPath = path.join(repoRoot, "docs/sales/commercial-product-registry-onboarding/32_CANDIDATE_ONBOARDING_MATRIX.md");

const [audit, design] = await Promise.all([
  readFile(auditPath, "utf8").then(JSON.parse),
  readFile(designPath, "utf8").then(JSON.parse),
]);
const manifest = buildCommercialProductOnboardingManifest(audit, design);
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
const cell = (value) => String(value ?? "UNKNOWN").replaceAll("|", "\\|").replaceAll("\n", " ");
const table = [
  "| Candidate | Family | Lifecycle | Readiness | Sellability | Source Authority | Selling Entity | Delivery Entity | Regulated? | Primary Reviews | Disposition | Can Register? | Why |",
  "|---|---|---|---|---|---|---|---|---|---|---|---|---|",
  ...manifest.candidates.map((c) => `| ${cell(c.candidate_id)} ${cell(c.candidate_name)} | ${cell(c.family)} | ${cell(c.lifecycle)} | ${cell(c.readiness)} | ${cell(c.sellability)} | ${cell(c.source_authorities.map((s) => `${s.source_authority_type}:${s.source_status}`).join(", ") || "MISSING")} | ${cell(c.selling_entity)} | ${cell(c.delivery_entity)} | ${REGULATED(c)} | ${cell(c.review_requirements.join(", ") || "None recorded")} | ${cell(c.onboarding_disposition)} | ${c.registration_allowed ? "Yes, preserving state" : "No"} | ${cell(c.onboarding_reason)} |`),
].join("\n");
await writeFile(matrixPath, `# 32 Candidate Onboarding Matrix\n\nGenerated from the governed manifest on 2026-10-05. A registration-ready result means safe to persist as a governed record; it is not sale approval.\n\n${table}\n`);
console.log(`Wrote ${manifest.candidates.length} candidates to ${path.relative(repoRoot, outputPath)} and matrix.`);

function REGULATED(candidate) {
  return candidate.regulated_metadata.external_training_authority_required === "PENDING" || candidate.regulated_metadata.scope_limitations.length
    ? "Yes, review required" : "No specific flag";
}
