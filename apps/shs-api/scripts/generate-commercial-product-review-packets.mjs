import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildReviewPackets } from "../src/domain/commercial-product-registry/review/review-packet-generator.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const reviewPath = path.join(root, "docs/sales/commercial-product-registry-review/commercial-product-review-manifest.json");
const onboardingPath = path.join(root, "docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json");
const packetDir = path.join(root, "docs/sales/commercial-product-registry-human-review/packets");
const review = JSON.parse(await readFile(reviewPath, "utf8"));
const onboarding = JSON.parse(await readFile(onboardingPath, "utf8"));
const generatedAt = process.env.REVIEW_PACKET_GENERATED_AT || new Date().toISOString();
const packets = buildReviewPackets(review, onboarding, generatedAt);
await mkdir(packetDir, { recursive: true });
for (const packet of packets) {
  const gates = packet.current_review_gates.map((gate) => `| ${gate.gate_type} | ${gate.current_status} | \`${gate.required_capability}\` | ${gate.authority_types.join(", ")} |`).join("\n");
  const refs = packet.existing_evidence_references.map((ref) => `- \`${ref}\``).join("\n") || "- None recorded.";
  const blockers = packet.unresolved_blockers.map((item) => `- ${item}`).join("\n") || "- None recorded.";
  const externalRefs = packet.resolved_source_authorities.map((source) => `- ${source.source_authority_type}: \`${source.source_record_id}\` (status ${source.source_status || "not stated"}, version ${source.source_version || "not stated"})`).join("\n") || "- None resolved.";
  const unresolvedRefs = packet.unresolved_source_requirements.map((source) => `- ${source.required_evidence || source.reason || "Source evidence is unresolved."}`).join("\n") || "- None.";
  const regulated = packet.regulated_metadata;
  const content = `# Review Packet ${packet.candidate_id}: ${packet.candidate_name}

- Packet version: ${packet.packet_version}
- Generated at: ${packet.generated_at}
- Product identity: \`${packet.commercial_product_id}\`
- Family: ${packet.family}
- Current lifecycle: ${packet.current_lifecycle}
- Readiness: ${packet.current_readiness}
- Sellability: ${packet.current_sellability}
- Source status: ${packet.source_resolution_status}
- Selling entity: ${packet.selling_entity}
- Delivery entity: ${packet.delivery_entity}
- Production onboarding eligible: ${packet.production_onboarding_eligibility ? "Yes" : "No"}

## Source Authorities

${externalRefs}

### Unresolved Source Requirements

${unresolvedRefs}

## Required Review Gates

| Gate | Current status | Required capability | Accepted authority type(s) |
|---|---|---|---|
${gates}

## Evidence

Existing references (references/provenance only; payloads remain with source authorities):
${refs}

Unresolved blockers:
${blockers}

## Regulated Program Review

- External regulator/reference: ${regulated.external_authority || "Unresolved / not provided"}
- Credential authority: ${regulated.credential_authority || "Unresolved / not provided"}
- External training authority required: ${regulated.external_training_authority_required || "UNKNOWN"}
- Partner dependency: ${regulated.partner_required ? "Required/review pending" : "Not established"}
- Scope limitations: ${(regulated.scope_limitations || []).join(", ") || "None recorded"}
- Sales-language restrictions: ${(regulated.sales_language_restrictions || []).join("; ") || "No additional restrictions recorded"}
- No external approval is inferred by this packet.

## Entity, Legal, Tax, and Sponsorship Review

- SHF/SHS/partner entity mapping is a candidate projection, not a legal determination.
- Charitable/commercial boundary: requires qualified review where SHF or sponsorship is involved.
- Sponsorship, tax, and contracting terms: no conclusion recorded; use LEGAL and TAX decisions with authoritative references.
- Partner/joint structure: ${packet.selling_entity === "JOINT_STRUCTURE_REVIEW_REQUIRED" || packet.delivery_entity === "PARTNER" ? "review required" : "not determined by this packet"}.

## Funding, Entitlements, and Financial Boundaries

- Funding decision covers product compatibility only. It cannot approve customer eligibility, grant awards, reimbursement, or guarantees.
- Entitlement definitions remain in the external Service Catalog/Entitlements authority.
- Pricing, margin, and commission are status/reference metadata only. Do not enter arbitrary numeric price, percentage, rate, payout, or leadership override values here.
- Recruiting is not product revenue.

## Questions for Reviewer

- Is the cited authority current, canonical, and applicable to this exact candidate/scope?
- What evidence supports the decision, and what is its effective period or staleness trigger?
- Are the selling and delivery entities authorized and sufficiently specific?
- What limitations must remain on external claims or Sales language?
- Is the decision APPROVED, NOT_REQUIRED, PENDING, BLOCKED, STALE, or UNKNOWN, and why?

## Decision Section (Leave Blank Until Authorized Decision Capture)

- Decision status:
- Decision reason:
- Authority type/reference:
- Evidence references:
- Reviewer actor and organization:
- Effective/reviewed/expiry/stale dates:
- Supersedes decision ID:

No approval has been prefilled. Decision history reference: none recorded.

## Production Onboarding Implication

This review packet does not authorize production onboarding. Any future eligibility decision is separate from readiness and sellability; neither is changed here. A separate human authorization and production execution plan are required.
`;
  await writeFile(path.join(packetDir, `${packet.candidate_id}.md`), content);
}
await writeFile(path.join(packetDir, "review-packets.json"), `${JSON.stringify({ packet_version: 1, generated_at: generatedAt, packets }, null, 2)}\n`);
process.stdout.write(`Generated ${packets.length} packets at ${packetDir}\n`);
