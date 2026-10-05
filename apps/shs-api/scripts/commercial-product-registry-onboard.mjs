import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CommercialProductRegistryService } from "../src/domain/commercial-product-registry/service/commercial-product-registry-service.ts";
import { runOnboarding } from "../src/domain/commercial-product-registry/onboarding/commercial-product-onboarding.ts";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(apiRoot, "../..");
const apply = process.argv.includes("--apply");
const manifestArg = process.argv.find((arg) => arg.startsWith("--manifest="));
const manifestPath = manifestArg ? path.resolve(manifestArg.slice("--manifest=".length)) : path.join(repoRoot, "docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json");
const mode = apply ? "APPLY" : "DRY_RUN";

if (apply && process.env.SHS_ONBOARDING_TARGET !== "disposable") {
  throw new Error("APPLY_REQUIRES_SHS_ONBOARDING_TARGET_DISPOSABLE");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_REQUIRED");
const organizationId = process.env.CPR_ONBOARDING_ORGANIZATION_ID;
const userId = process.env.CPR_ONBOARDING_USER_ID;
const systemId = process.env.CPR_ONBOARDING_SYSTEM_ID;
if (!organizationId || (!userId && !systemId)) throw new Error("ONBOARDING_ACTOR_AND_ORGANIZATION_REQUIRED");

process.env.DATABASE_URL = process.env.DATABASE_URL;
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const { GOVERNANCE_CAPABILITIES } = await import("../src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts");
const service = new CommercialProductRegistryService();
const actor = {
  user_id: userId,
  actor_system_id: systemId,
  active_organization_id: organizationId,
  capabilities: GOVERNANCE_CAPABILITIES,
};
const result = await runOnboarding({ manifest, service, actor, mode });
const counts = result.results.reduce((sum, item) => ({ ...sum, [item.disposition]: (sum[item.disposition] || 0) + 1 }), {});
console.log(JSON.stringify({ mode, manifest: path.relative(repoRoot, manifestPath), total: result.results.length, counts, results: result.results }, null, 2));
