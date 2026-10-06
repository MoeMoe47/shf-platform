#!/usr/bin/env tsx
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../src/db/client.js";
import { buildReviewPackets } from "../src/domain/commercial-product-registry/review/review-packet-generator.js";
import { CommercialProductReviewerAssignmentService } from "../src/domain/commercial-product-registry/review/reviewer-assignment-service.js";
import { RealReviewPilotError, RealReviewPilotService } from "../src/domain/commercial-product-registry/review/real-review-pilot-service.js";

function parseArgs(argv: string[]) {
  const result: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index++) {
    const item = argv[index];
    if (!item.startsWith("--")) throw new Error(`Unexpected argument: ${item}`);
    const name = item.slice(2);
    if (name === "confirm" || name === "dry-run") {
      result[name] = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${name}`);
    result[name] = value;
    index++;
  }
  return result;
}

function required(args: Record<string, string | boolean>, name: string) {
  const value = args[name];
  if (typeof value !== "string" || !value.trim()) throw new Error(`--${name} is required`);
  return value.trim();
}

async function loadCandidateIdentities() {
  const root = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
  const reviewManifest = JSON.parse(await readFile(path.join(root, "docs/sales/commercial-product-registry-review/commercial-product-review-manifest.json"), "utf8"));
  const onboardingManifest = JSON.parse(await readFile(path.join(root, "docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json"), "utf8"));
  const packets = buildReviewPackets(reviewManifest, onboardingManifest, reviewManifest.reviewed_at);
  return new Map(packets.map((packet: any) => [packet.candidate_id, packet.commercial_product_id]));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const identities = await loadCandidateIdentities();
  const assignmentService = new CommercialProductReviewerAssignmentService(identities);
  const service = new RealReviewPilotService(identities, assignmentService);
  const operator = {
    user_id: required(args, "operator"),
    active_organization_id: required(args, "org"),
    organization_id: required(args, "org"),
    tenant_id: `tenant:${required(args, "org")}`,
    permissions: ["commercial_product.review_assignment.manage"],
  };
  const input = {
    reviewer_actor_id: required(args, "user"),
    reviewer_org_id: required(args, "org"),
    candidate_id: required(args, "candidate"),
    commercial_product_id: typeof args["commercial-product"] === "string" ? args["commercial-product"] : undefined,
    gate_type: required(args, "gate"),
    effective_at: required(args, "effective-at"),
    expires_at: required(args, "expires-at"),
    assignment_authority_reference: required(args, "authority-reference"),
    reason: required(args, "reason"),
    confirm: args.confirm === true,
  };
  const result = input.confirm ? await service.activate(input, operator) : await service.dryRun(input, operator);
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    if (error instanceof RealReviewPilotError) {
      console.error(JSON.stringify({ ok: false, code: error.code, message: error.message }, null, 2));
      process.exit(error.statusCode >= 500 ? 1 : 2);
    }
    console.error(JSON.stringify({ ok: false, code: "REAL_REVIEW_PILOT_FAILED", message: error instanceof Error ? error.message : String(error) }, null, 2));
    process.exit(1);
  })
  .finally(() => pool.end().catch(() => undefined));
