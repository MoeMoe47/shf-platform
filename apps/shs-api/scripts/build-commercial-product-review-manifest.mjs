import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const outDir = path.join(root, "docs/sales/commercial-product-registry-review");
const inputPath = path.join(root, "docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json");
const input = JSON.parse(await readFile(inputPath, "utf8"));
const unverifiedExternalSourceIds = new Set(["cc-009", "cc-027", "cc-028"]);
const gapAssessments = {
  "cc-005": { domain: "Curriculum / professional development program authority", evidence: ["src/data/catalogOfferings.js (explicit seed/demo catalog)"], needed: "Canonical curriculum/program record, content owner, approved delivery scope, and a non-demo source record.", rationale: "The only mapped catalog row explicitly identifies itself as seed/demo data." },
  "cc-011": { domain: "Career pathways plus healthcare training/credential authority", evidence: ["src/data/career-pathways.json (fixture)"], needed: "Approved pathway/program record; named delivering partner; documented credential/licensure scope and applicable external authority references.", rationale: "CNA/STNA and phlebotomy labels in fixture data do not establish an authorized training offering." },
  "cc-012": { domain: "SHF Civic / Fire and Public Safety program authority", evidence: ["keyword scan only; audit found no initiative record"], needed: "Approved initiative/program record, documented delivery owner and partner, and applicable fire/EMS/regulatory authority evidence for any regulated claim.", rationale: "Keyword discovery produced no live program, service, or simulation authority." },
  "cc-014": { domain: "Career pathway and employer validation authority", evidence: ["src/data/career-pathways.json (fixture)"], needed: "Canonical pathway record plus employer validation, delivery owner, and credential source where credential claims are contemplated.", rationale: "A fixture pathway name does not establish a packaged logistics offering or employer pipeline." },
  "cc-015": { domain: "Aviation career/curriculum authority and applicable external aviation regulator or approved provider", evidence: ["keyword scan only; audit found no aviation/UAS offering"], needed: "Approved aviation/UAS program or curriculum record, named delivery partner, and regulator/approved-provider references appropriate to the actual scope.", rationale: "No aviation offering was found; no regulator or training approval is inferred." },
  "cc-016": { domain: "SHNN / Creator Media program and rights authority", evidence: ["keyword scan only; audit found no SHNN/media product or sponsorship inventory"], needed: "Canonical media program/studio record, accountable owner, rights and distribution scope, and approved commercial/sponsorship terms.", rationale: "No operational media offering or sponsorship inventory is present in the mapped evidence." },
  "cc-018": { domain: "Arcade service authority plus sponsorship/tournament commercial authority", evidence: ["src/pages/arcade/ClassicalArcadeRoom.jsx and src/data/arcade.js (front-end game/demo surfaces)"], needed: "Canonical arcade service record and separately approved tournament/sponsorship package with legal/tax terms, rights, owner, and delivery scope.", rationale: "The game surface alone does not establish a commercial tournament or sponsorship offering." },
  "cc-032": { domain: "SHF program authority", evidence: ["SHF V1 audit references recorded in 4A; external checkout not inspected in this repository task"], needed: "A source record in an authoritative SHF program/curriculum system, plus current owner, program identity, delivery scope, and supporting evidence references.", rationale: "Audit-gap documentation is not itself an operational program source; cross-repository references were not independently verified." },
};
const authorityMatrix = [
  ["COMMERCIAL_READINESS", "Commercial product governance owner", "Documented readiness review tied to evidence and accountable delivery scope", "Sales editor alone", "Reviewer identity, source/evidence reference, reviewed_at; expiration when evidence/source becomes stale"],
  ["LEGAL", "Qualified legal authority", "Documented legal review or approved legal record", "Sales, product, or delivery staff without delegated legal authority", "Authority/reference, reviewer, decision time, scope, expiry/review trigger"],
  ["TAX", "Qualified tax authority", "Documented tax analysis for the actual entity and transaction structure", "Sales or non-tax program staff", "Authority/reference, entity/structure scope, reviewer, decision time, review trigger"],
  ["REGULATORY", "External regulator, approved partner authority, or verified regulatory source", "Current external rule, approval, license, or partner authorization applicable to exact scope", "SHU/SHF/SHS by assertion; Sales; unrelated regulator", "External authority and scope reference, version/status, reviewer, date/expiry"],
  ["PROCUREMENT", "Buyer procurement authority / documented procurement source", "Published procurement requirements or recorded buyer-side determination", "Sales assumption", "Reference, jurisdiction/buyer scope, checked date and expiry"],
  ["FUNDING", "Funding program/source authority for product compatibility only", "Published program criteria or documented relationship supporting compatibility", "Registry or Sales as customer eligibility/award authority", "Source/category/reference, status, checked date; never a customer eligibility decision"],
  ["DELIVERY_CAPACITY", "Named delivery owner / operations authority", "Capacity plan, staffing or partner commitment for the scoped offer", "Product existence, marketing, or Sales forecast", "Owner, scope, capacity evidence reference, checked date and review interval"],
  ["EVIDENCE", "Evidence / Truth Spine authority and claim owner", "Verified evidence with provenance for each material claim", "Sales copy or unverified marketing statement", "Evidence reference, claim scope, verification state, verified_at/staleness"],
  ["SUPPORT", "Named support/service owner", "Approved support model, coverage and escalation record", "Sales or product existence alone", "Owner, support reference/tier, scope, reviewed_at and expiry"],
  ["PRICING", "Future approved pricing authority / approved pricing record", "Governed pricing record with effective dates and currency", "Sales or onboarding importer", "Pricing authority/reference, effective period, reviewer and status; no inferred amount"],
  ["MARGIN", "Approved finance/cost authority", "Governed cost/margin record or policy for the offer", "Sales, Product Registry, or inferred price/cost", "Finance authority/reference, scope, effective period, reviewer"],
  ["COMMISSION", "Approved commission policy authority", "Published policy reference and explicit product eligibility review", "Sales, importer, or payout calculation", "Policy authority/reference, reviewed status/date; no rates or calculations"],
  ["ENTITLEMENT", "Service Catalog / Entitlements authority", "Canonical entitlement IDs and status references", "Product Registry duplicating entitlement definitions", "External entitlement IDs, authority and reference/status; source freshness"],
  ["PARTNER", "Partner relationship/legal authority and accountable delivery owner", "Executed/approved partner record or documented authorization for scoped delivery", "Assumed partner, generic product metadata, or Sales assertion", "Partner authority/reference, scope, owner, effective dates and review trigger"],
];

async function existsInRepo(ref) {
  if (!ref || path.isAbsolute(ref) || ref.toLowerCase().includes("keyword scan") || /demo|fixture|seed/i.test(ref)) return false;
  const clean = ref.replace(/\*.*$/, "").replace(/\/$/, "");
  try { await access(path.join(root, clean)); return true; } catch { return false; }
}
function gateAuthority(gateType) {
  const row = authorityMatrix.find(([type]) => type === gateType);
  return row ? { authority: row[1], acceptable_evidence: row[2], prohibited_approver: row[3], provenance_rules: row[4] } : null;
}

const candidates = [];
for (const source of input.candidates) {
  const baselineGap = gapAssessments[source.candidate_id];
  const unverifiedExternal = unverifiedExternalSourceIds.has(source.candidate_id);
  const verifiedReferences = await Promise.all(source.source_authorities.map(async (ref) => ({ ref, exists: await existsInRepo(ref.source_record_id) })));
  const sourceAuthorities = !baselineGap && !unverifiedExternal
    ? verifiedReferences.filter(({ exists }) => exists).map(({ ref }) => ({ ...ref, verification: "REPOSITORY_REFERENCE_PRESENT; source authority remains owner of truth" }))
    : [];
  const sourceResolved = sourceAuthorities.length > 0;
  const gates = source.review_gates.map((gate) => ({
    ...gate,
    authority: gateAuthority(gate.gate_type),
    review_status: gate.status,
    resolution_reference: gate.reference,
    resolved_at: null,
  }));
  if (!gates.some((gate) => gate.gate_type === "COMMISSION")) gates.push({
    gate_type: "COMMISSION", status: "UNKNOWN", review_status: "UNKNOWN", reference: null,
    reason: "4A had no Commission gate row. 3A requires a governed Commission gate; no approval evidence is present.",
    authority: gateAuthority("COMMISSION"), resolution_reference: null, resolved_at: null,
  });
  const unresolved = [];
  if (!sourceResolved) unresolved.push(baselineGap ? baselineGap.needed : "Re-verify the mapped source in its owning repository and provide a current source version/status; this checkout cannot substantiate that external reference.");
  for (const gate of gates) if (["PENDING", "BLOCKED", "STALE", "UNKNOWN"].includes(gate.status)) unresolved.push(`${gate.gate_type}:${gate.status}`);
  const lifecycleDisposition = sourceResolved ? "SOURCE_RESOLVED_REVIEW_PENDING" : "SOURCE_UNRESOLVED";
  const reviewsByType = (type) => gates.find((gate) => gate.gate_type === type)?.status || "UNKNOWN";
  candidates.push({
    candidate_id: source.candidate_id,
    commercial_product_id: source.proposed_commercial_product_id,
    candidate_name: source.candidate_name,
    family: source.family,
    source_resolution_status: sourceResolved ? "SOURCE_RESOLVED" : "SOURCE_UNRESOLVED",
    resolved_source_authorities: sourceAuthorities,
    unresolved_source_requirements: sourceResolved ? [] : [{ suspected_domain: baselineGap?.domain || "External source authority", existing_refs: baselineGap?.evidence || source.source_authorities.map((ref) => ref.source_record_id), reason: baselineGap?.rationale || "Source is outside the verified repository scope.", required_evidence: baselineGap?.needed || unresolved[0] }],
    review_gates: gates,
    review_authorities: gates.map(({ gate_type, authority }) => ({ gate_type, ...(authority || { authority: "No approval authority evidenced", acceptable_evidence: "A gate-specific source and reviewer must be established before approval.", prohibited_approver: "Unqualified Sales or importer", provenance_rules: "Do not mark APPROVED without authority/reference and actual reviewer evidence." }) })),
    review_references: gates.filter((gate) => gate.reference).map((gate) => ({ gate_type: gate.gate_type, reference: gate.reference, meaning: "Design-2 review-state provenance, not evidence of approval." })),
    regulated_review: { required: source.regulated_metadata.external_training_authority_required === "PENDING" || source.regulated_metadata.external_training_authority_required === "APPROVED", external_authority: source.regulated_metadata.regulatory_authority, credential_authority: source.regulated_metadata.credential_authority, external_training_authority_required: source.regulated_metadata.external_training_authority_required, scope_limitations: source.regulated_metadata.scope_limitations, sales_language_restrictions: source.regulated_metadata.sales_language_restrictions, status: reviewsByType("REGULATORY") },
    selling_entity_review: { entity: source.selling_entity, joint_structure_required: source.joint_structure_required, review_flags: source.entity_review_flags, status: source.selling_entity === "UNKNOWN" || source.selling_entity === "JOINT_STRUCTURE_REVIEW_REQUIRED" ? "PENDING" : "UNKNOWN", charitable_commercial_boundary: source.selling_entity === "SHF" ? "SHF charitable/community authority; legal/tax review remains separate" : "No entity authorization inferred from candidate classification." },
    delivery_entity_review: { entity: source.delivery_entity, partner_required: source.partner_required, status: source.delivery_entity === "UNKNOWN" || source.partner_required ? "PENDING" : "UNKNOWN", owner: source.implementation_metadata.implementation_owner, implementation: source.implementation_metadata },
    funding_review: { compatibility_status: source.funding_relationships[0]?.status || "UNKNOWN", categories: source.funding_relationships[0]?.categories || [], source_refs: source.source_authorities.filter((ref) => ref.source_authority_type === "FUNDING"), status: reviewsByType("FUNDING"), limitation: "Product compatibility only; no customer eligibility, award approval, or guarantee." },
    entitlement_review: { refs: source.entitlement_refs, status: source.entitlement_refs.length ? reviewsByType("ENTITLEMENT") : "UNKNOWN", limitation: "Entitlement definitions remain external to Product Registry." },
    pricing_review: { pricing_status: source.pricing_metadata.pricing_status, gate_status: reviewsByType("PRICING"), numeric_price_present: false },
    margin_review: { margin_status: source.margin_metadata.margin_status, gate_status: reviewsByType("MARGIN"), numeric_margin_present: false },
    commission_review: { commission_status: source.commission_metadata.commission_eligible_status, gate_status: reviewsByType("COMMISSION"), commission_numeric_present: false, recruiting_revenue: false },
    evidence_review: { status: reviewsByType("EVIDENCE"), source_refs: source.source_authorities.filter((ref) => ["EVIDENCE", "REPORTING"].includes(ref.source_authority_type)), verified_claims_inferred: false },
    support_review: { status: reviewsByType("SUPPORT"), support: source.support_metadata, delivery_capacity_status: reviewsByType("DELIVERY_CAPACITY") },
    partner_review: { status: reviewsByType("PARTNER"), partner_required: source.partner_required, joint_structure_required: source.joint_structure_required },
    readiness: source.readiness,
    sellability: source.sellability,
    remaining_blockers: [...new Set([...source.blockers, ...unresolved])],
    production_onboarding_eligibility: false,
    production_onboarding_reasons: ["Human gate approvals and authority references are incomplete; 4B does not authorize production execution."],
    review_resolution_state: lifecycleDisposition,
    reviewed_at: null,
    review_version: 1,
  });
}

const manifest = {
  manifest_id: "SHU-COMMERCIAL-PRODUCT-REGISTRY-4B",
  derived_from: "docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json",
  review_contract: "apps/shs-api/src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts",
  reviewed_at: null,
  human_approvals_recorded: false,
  production_onboarding_executed: false,
  locked_audit_totals: { candidates: 32, sellability: { SELL_NOW: 0, PILOT: 10, DEVELOP: 12, NEEDS_REVIEW: 6, NOT_SELLABLE: 4 }, readiness: { YELLOW: 10, RED: 4, UNKNOWN: 18, GREEN: 0, BLUE: 0 } },
  source_search_scope: "Current SHRV1 repository only. Cross-repository paths are not treated as independently verified.",
  counts: {
    total_candidates: candidates.length,
    source_resolved: candidates.filter((candidate) => candidate.source_resolution_status === "SOURCE_RESOLVED").length,
    source_unresolved: candidates.filter((candidate) => candidate.source_resolution_status === "SOURCE_UNRESOLVED").length,
    baseline_source_authority_missing: Object.keys(gapAssessments).length,
    review_resolved: 0,
    review_partially_resolved: 0,
    review_pending: candidates.filter((candidate) => candidate.review_gates.some((gate) => ["PENDING", "BLOCKED", "STALE", "UNKNOWN"].includes(gate.status))).length,
    production_onboarding_candidate: 0,
    sell_now: candidates.filter((candidate) => candidate.sellability === "SELL_NOW").length,
    green: candidates.filter((candidate) => candidate.readiness === "GREEN").length,
  },
  review_authority_matrix: authorityMatrix.map(([gate_type, canonical_authority, acceptable_evidence, who_cannot_approve, required_provenance_and_staleness]) => ({ gate_type, canonical_authority, acceptable_evidence, who_cannot_approve, required_provenance_and_staleness })),
  candidates,
};

await writeFile(path.join(outDir, "commercial-product-review-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
const gatesFor = (candidate, gate) => candidate.review_gates.find((item) => item.gate_type === gate)?.status || "UNKNOWN";
const matrix = ["# 32 Candidate Review Matrix", "", "Statuses reflect source/design evidence only. No human gate approval was recorded; every candidate is ineligible for production onboarding.", "", "| Candidate | Family | Source Status | Readiness | Sellability | Legal | Regulatory | Funding | Pricing | Margin | Entitlement | Evidence | Support | Partner | Remaining Blockers | Production Onboarding Eligible? | Resolution State |", "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"];
for (const candidate of candidates) matrix.push(`| ${candidate.candidate_id} ${candidate.candidate_name} | ${candidate.family} | ${candidate.source_resolution_status} | ${candidate.readiness} | ${candidate.sellability} | ${gatesFor(candidate, "LEGAL")} | ${gatesFor(candidate, "REGULATORY")} | ${gatesFor(candidate, "FUNDING")} | ${gatesFor(candidate, "PRICING")} | ${gatesFor(candidate, "MARGIN")} | ${gatesFor(candidate, "ENTITLEMENT")} | ${gatesFor(candidate, "EVIDENCE")} | ${gatesFor(candidate, "SUPPORT")} | ${gatesFor(candidate, "PARTNER")} | ${candidate.remaining_blockers.join("; ").replaceAll("|", "\\|")} | No | ${candidate.review_resolution_state} |`);
await writeFile(path.join(outDir, "32_CANDIDATE_REVIEW_MATRIX.md"), `${matrix.join("\n")}\n`);

const gaps = ["# 8 Source Authority Gaps", "", "These are the eight baseline SOURCE_AUTHORITY_MISSING candidates from 4A. Repository search found no sufficient governed commercial source. Evidence below is explicitly classified as insufficient, not silently promoted.", "", "| Candidate | Missing Authority | Likely Canonical Domain | Repo Evidence Found | Authority Resolved? | Remaining Evidence Needed | Can Register? | Why |", "|---|---|---|---|---|---|---|---|"];
for (const [id, gap] of Object.entries(gapAssessments)) {
  const candidate = candidates.find((item) => item.candidate_id === id);
  gaps.push(`| ${id} ${candidate.candidate_name} | ${gap.domain} | ${gap.domain} | ${gap.evidence.join("; ")} | No | ${gap.needed} | No | ${gap.rationale} |`);
}
await writeFile(path.join(outDir, "8_SOURCE_AUTHORITY_GAPS.md"), `${gaps.join("\n")}\n`);

const authorityDoc = ["# Review Authority Matrix", "", "No gate is APPROVED in the 4B manifest. The cited Design-2 references document prior statuses only; they are not approvals. A reviewer must be authorized for the gate, and must record an authority/reference, identity, decision time, scope, and staleness/expiry basis.", "", "| Gate | Canonical Authority | Acceptable Evidence | Who Cannot Approve | Required Provenance / Staleness |", "|---|---|---|---|---|"];
for (const row of authorityMatrix) authorityDoc.push(`| ${row.join(" | ")} |`);
authorityDoc.push("", "`APPROVED` is invalid without a gate-specific authority/reference and actual reviewer evidence. `NOT_REQUIRED` likewise needs authority explaining why the gate does not apply. `UNKNOWN` is not approval and fails closed. Funding review is product compatibility only, never buyer eligibility.");
await writeFile(path.join(outDir, "REVIEW_AUTHORITY_MATRIX.md"), `${authorityDoc.join("\n")}\n`);
