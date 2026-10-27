import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readSource, validateCatalog, validateSchema, serialize, digest, root } from './oas-catalog.mjs';

export const reviewPath = 'standards/oas/authoring/first-release.json';
export const mappingPath = 'standards/oas/authoring/domain-mapping.json';
export const loadReview = () => JSON.parse(readFileSync(path.join(root, reviewPath), 'utf8'));
export const loadMappings = () => JSON.parse(readFileSync(path.join(root, mappingPath), 'utf8'));
const schemaFiles = readdirSync(path.join(root, 'schemas/oas/review')).filter((p) => p.endsWith('.schema.json')).sort();
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const name of schemaFiles) ajv.addSchema(JSON.parse(readFileSync(path.join(root, 'schemas/oas/review', name), 'utf8')));
for (const name of schemaFiles) ajv.getSchema(JSON.parse(readFileSync(path.join(root, 'schemas/oas/review', name), 'utf8')).$id);
function ensure(condition, message) { if (!condition) throw new Error(message); }
export function validateReviewSchema(name, value) {
  const validate = ajv.getSchema(`urn:oas:schema:review:${name}:1`);
  ensure(validate(value), `${name}: ${ajv.errorsText(validate.errors)}`);
}
const sourceCache = new Map();
function baselineSource(revision, sourcePath) {
  const key = `${revision}:${sourcePath}`;
  if (!sourceCache.has(key)) sourceCache.set(key, execFileSync('git', ['show', key], { cwd: root, encoding: 'utf8' }));
  return sourceCache.get(key);
}
const normalize = (s) => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
export const statementChecksum = (r) => digest(r.normative_text);
export const reviewChecksum = (review) => digest(serialize(review));
export function validateMappings(mapping, catalog = readSource()) {
  validateReviewSchema('domain-mapping', mapping);
  const keys = new Set();
  for (const row of mapping.mappings) {
    const key = `${row.namespace}:${row.label}`;
    ensure(!keys.has(key), 'Duplicate namespaced domain label'); keys.add(key);
    for (const id of [...row.canonical_domain_ids, ...row.related_domain_ids]) ensure(catalog.domains.some((d) => d.domain_id === id), 'Unknown mapping domain');
    if (row.classification === 'canonical' || row.classification === 'alias') {
      ensure(row.canonical_domain_ids.length === 1, 'Deterministic mapping requires exactly one domain');
      const domain = catalog.domains.find((d) => d.domain_id === row.canonical_domain_ids[0]);
      ensure(row.classification === 'canonical' ? domain.domain_name === row.label && row.namespace === 'oas-public' && row.decision_status === 'existing_canonical' : domain.aliases.includes(row.label) && row.decision_status === 'existing_canonical_alias', 'Unreviewed canonical alias');
    } else ensure(row.canonical_domain_ids.length === 0 && row.decision_status === 'requires_governance_review', 'Unresolved alias cannot enter canonical output');
  }
  for (const domain of catalog.domains) ensure(mapping.mappings.some((r) => r.namespace === 'oas-public' && r.label === domain.domain_name && r.canonical_domain_ids[0] === domain.domain_id), 'Missing canonical label');
  for (const legacy of catalog.legacy_taxonomies[0].domains) ensure(mapping.mappings.some((r) => r.namespace === 'shs-oas-reporting-v1' && r.label === legacy.legacy_label), 'Missing legacy mapping disposition');
  return mapping;
}
export function resolveDomainLabel(namespace, label, mapping = loadMappings()) {
  validateMappings(mapping);
  const row = mapping.mappings.find((r) => r.namespace === namespace && r.label === label);
  ensure(row, 'Unknown domain label');
  ensure(['canonical', 'alias'].includes(row.classification), `Domain label ${row.classification}: ${label}`);
  return row.canonical_domain_ids[0];
}
export function validateReview(review, mapping = loadMappings(), catalog = readSource()) {
  validateReviewSchema('authoring', review); validateMappings(mapping, catalog); validateCatalog(catalog);
  ensure(catalog.releases.some((r) => r.release_id === review.baseline_release_id && r.release_status === 'public_review'), 'Missing draft baseline release');
  const ids = new Set(), statements = new Set(), questionIds = new Set();
  for (const q of review.open_questions) { ensure(!questionIds.has(q.question_id), 'Duplicate question ID'); questionIds.add(q.question_id); }
  for (const r of review.requirements) {
    ensure(!ids.has(r.requirement_id), 'Duplicate requirement ID'); ids.add(r.requirement_id);
    ensure(!statements.has(normalize(r.normative_text)), 'Duplicate normative statement'); statements.add(normalize(r.normative_text));
    ensure(catalog.domains.some((d) => d.domain_id === r.domain_id), 'Unknown canonical domain');
    ensure(r.normative_text.includes(` ${r.requirement_level} `), 'Normative keyword missing');
    ensure(r.normative_text_reference.anchor === r.requirement_id.toLowerCase(), 'Normative anchor mismatch');
    for (const q of r.open_question_ids) ensure(questionIds.has(q), 'Unresolved question reference');
    for (const s of r.sources) {
      ensure(!path.isAbsolute(s.source_path) && !s.source_path.split('/').includes('..'), 'Invalid source path');
      const source = baselineSource(s.source_revision, s.source_path);
      ensure(source.includes(s.exact_excerpt) && source.split('\n')[s.source_line - 1]?.includes(s.exact_excerpt), 'Source excerpt/line mismatch');
    }
    if (r.review_decision) {
      ensure(r.review_decision.statement_checksum === statementChecksum(r), 'Review decision refers to different wording');
      ensure((r.status === 'review_approved') === (r.review_decision.decision === 'approved'), 'Review decision/status mismatch');
      ensure((r.status === 'rejected') === (r.review_decision.decision === 'rejected'), 'Rejection status mismatch');
    } else ensure(r.status === 'candidate', 'Candidate cannot be approved or released without review');
  }
  for (const r of review.requirements) for (const [edge, inverse] of [['supersedes', 'superseded_by'], ['superseded_by', 'supersedes']]) for (const id of r[edge]) {
    const target = review.requirements.find((r) => r.requirement_id === id);
    ensure(target && id !== r.requirement_id && target[inverse].includes(r.requirement_id) && target.standard_id === r.standard_id, 'Invalid candidate supersession');
  }
  const visiting = new Set(), visited = new Set();
  function visit(id) { ensure(!visiting.has(id), 'Circular candidate supersession'); if (visited.has(id)) return; visiting.add(id); for (const next of review.requirements.find((r) => r.requirement_id === id).superseded_by) visit(next); visiting.delete(id); visited.add(id); }
  for (const id of ids) visit(id);
  return review;
}
export function validateReviewDeclaration(declaration, review = loadReview()) {
  validateReviewSchema('declaration', declaration); validateReview(review);
  ensure(declaration.authoring_reference.review_source_checksum === reviewChecksum(review), 'Declaration review pin mismatch');
  const ids = new Set();
  for (const item of declaration.requirement_declarations) {
    ensure(!ids.has(item.requirement_id), 'Duplicate declaration requirement'); ids.add(item.requirement_id);
    const requirement = review.requirements.find((r) => r.requirement_id === item.requirement_id);
    ensure(requirement && requirement.status !== 'rejected' && item.statement_checksum === statementChecksum(requirement), 'Unknown, rejected or changed declaration requirement');
    ensure(item.state !== 'not_applicable' || item.reason.trim().length > 0, 'Not applicable requires reason');
    ensure(item.state !== 'declared_satisfied' || item.evidence_references.length > 0, 'Declared satisfied requires offered evidence references');
  }
  return declaration;
}
export function releaseGates(review = loadReview(), mapping = loadMappings()) {
  validateReview(review, mapping);
  return [
    { gate: 'schema_and_source_traceability', status: 'READY' },
    { gate: 'requirement_content_review', status: review.requirements.every((r) => r.status === 'review_approved') ? 'READY' : 'BLOCKED' },
    { gate: 'open_questions', status: review.open_questions.every((q) => q.status === 'resolved') ? 'READY' : 'BLOCKED' },
    { gate: 'domain_mapping_review', status: mapping.mappings.some((r) => ['ambiguous', 'unmapped'].includes(r.classification)) ? 'BLOCKED' : 'READY' },
    { gate: 'governance_adoption', status: 'BLOCKED' },
    { gate: 'released_catalog_and_effective_date', status: 'BLOCKED' },
    { gate: 'publication', status: 'BLOCKED' },
  ];
}
export function assertAdoptable(review = loadReview(), mapping = loadMappings()) {
  const blocked = releaseGates(review, mapping).filter((g) => g.status !== 'READY');
  ensure(blocked.length === 0, `Not adoptable: ${blocked.map((g) => g.gate).join(', ')}`);
}
export function validateReleasedRequirement(requirement, catalog, governance) {
  validateCatalog(catalog); validateSchema('requirement', requirement);
  const release = catalog.releases.find((r) => r.release_id === requirement.release_id);
  ensure(release && requirement.standard_id === release.standard_id && requirement.standard_version === release.standard_version && release.release_status === 'released', 'Adopted requirement requires valid released standard');
  ensure(catalog.domains.some((d) => d.domain_id === requirement.domain_id) && requirement.status === 'active', 'Invalid adopted requirement domain/status');
  ensure(catalog.requirements.some((row) => serialize(row) === serialize(requirement)), 'Adopted requirement must match its catalog record');
  ensure(governance?.decision === 'adopted' && governance.release_id === release.release_id && governance.approved_by?.trim() && governance.approval_record_reference?.trim() && governance.catalog_source_checksum === digest(serialize(catalog)) && release.effective_date, 'Governance adoption and effective date required');
  return requirement;
}
function renderRequirement(r) {
  return [`<a id="${r.requirement_id.toLowerCase()}"></a>`, `### ${r.requirement_id} — ${r.title}`, '', `**${r.status.toUpperCase()} — NOT ADOPTED.**`, '', r.normative_text, '', `Applicability: ${r.applicability}`, '', `Domain: ${r.domain_id}. Level: ${r.requirement_level}. R0–R4 applicability: not assigned. Introduced: not published; proposed ${r.proposed_version_introduced}.`, '', `Rationale: ${r.rationale}`, '', `Implementation notes: ${r.implementation_notes}`, '', `Evidence expectations: ${r.evidence_expectations.join('; ')}. Evidence presence does not establish conformance.`, '', `Verification notes: ${r.verification_notes}`, '', `Source: ${r.sources.map((s) => `\`${s.source_path}:${s.source_line}\` / ${s.source_section} — “${s.exact_excerpt}”`).join('; ')}`, '', `Review: ${r.review_decision ? r.review_decision.decision : 'PENDING — no approval recorded'}. Questions: ${r.open_question_ids.join(', ')}.`, '', `Declaration states: ${r.declaration_states.join(', ')}; NOT_EVALUATED in every state.`, '', `Supersedes: ${r.supersedes.join(', ') || 'none'}. Superseded by: ${r.superseded_by.join(', ') || 'none'}.`, ''].join('\n');
}
export function generatedViews(review = loadReview(), mapping = loadMappings()) {
  validateReview(review, mapping);
  const checksum = reviewChecksum(review), domains = readSource().domains, out = new Map();
  const header = `Generated from \`${reviewPath}\`; source digest \`${checksum}\`. Edit the source, then run oas:first:generate.\n\nREVIEW ONLY — proposed obligations, no adopted release, no certification or conformance determination. Candidate version ${review.candidate_version} is reserved for a future reviewed draft, not a published pin.\n`;
  const sections = domains.map((d) => `## ${d.domain_id} — ${d.domain_name}\n\n${review.requirements.filter((r) => r.domain_id === d.domain_id).map(renderRequirement).join('\n')}`);
  out.set('docs/OAS_FIRST_REQUIREMENTS_REVIEW.md', `# First OAS normative requirement review\n\n${header}\n${sections.join('\n')}`);
  domains.forEach((d, i) => out.set(`evidence/oas-first-release/review-package/DOMAIN-${d.ordinal}.md`, `# ${d.domain_name} — individual requirement review\n\n${header}\nApprove/reject each ID against its statement checksum and list any required changes. No decision below is prefilled. Decision records require an authorized reviewer and immutable record reference.\n\n${sections[i]}`));
  out.set('evidence/oas-first-release/review-package/CANDIDATE_METADATA.json', serialize({ standard_id: review.standard_id, proposed_version: review.candidate_version, release_id: null, status: 'review_only', normative_status: 'not_adopted', release_date: null, effective_date: null, governance_approval: null, baseline_release_id: review.baseline_release_id, source_checksum: checksum, requirements: review.requirements.map((r) => ({ requirement_id: r.requirement_id, statement_checksum: statementChecksum(r), review_decision: r.review_decision })), release_gates: releaseGates(review, mapping) }));
  out.set('docs/OAS_DOMAIN_MAPPING.md', `# OAS domain mapping\n\nGenerated from \`${mappingPath}\`. Resolve labels only within the named namespace. Exact canonical labels and the existing D06 alias resolve deterministically; ambiguous/unmapped labels never return a canonical ID. Related concepts are not equivalence mappings. Legacy report ordinals and report payloads remain unchanged.\n\n| Namespace | Label | Classification | Canonical domain | Related concepts only | Disposition |\n| --- | --- | --- | --- | --- | --- |\n${mapping.mappings.map((r) => `| ${r.namespace} | ${r.label} | ${r.classification} | ${r.canonical_domain_ids.join(', ') || 'none'} | ${r.related_domain_ids.join(', ') || 'none'} | ${r.rationale} |`).join('\n')}\n\nReporting taxonomy migration remains BLOCKED: seven labels need governance disposition. Human Oversight maps lexically to D06 as an already recorded alias, not to public ordinal 05. This does not establish the meaning or equivalence of a historical report assessment. No existing reporting record is rewritten.\n`);
  out.set('evidence/oas-first-release/review-package/OPEN_QUESTIONS.md', `# Open questions\n\n${review.open_questions.map((q) => `## ${q.question_id} — ${q.title}\n\nStatus: ${q.status}. Scope: ${q.scope}.\n\n${q.detail}\n`).join('\n')}`);
  out.set('evidence/oas-first-release/review-package/RELEASE_BLOCKERS.md', `# Release blockers\n\n${releaseGates(review,mapping).map((g) => `- ${g.gate}: ${g.status}`).join('\n')}\n\nAll ${review.requirements.length} requirements await individual decisions. Every open question requires a documented disposition; no numeric review threshold substitutes for OAS approval.\n`);
  out.set('evidence/oas-first-release/review-package/CANDIDATE_CHANGELOG.md', `# Candidate changelog\n\nFrom ${review.baseline_commit}: author ${review.requirements.length} traceable description-record requirement proposals; reserve serials 0001–0017; preserve all eight domains and existing ID syntax; specify review declaration states; distinguish one existing alias from seven unresolved reporting labels; preserve R0–R4 as informative; leave profiles and published requirement catalog empty. No standard release, RC, adoption, certification, Registry change or deployment. Historical public-review.1 artifact is unchanged.\n`);
  out.set('evidence/oas-first-release/review-package/DISPUTED_REQUIREMENTS.md', `# Disputed or unresolved candidate requirements\n\nAll candidates await review. A source concept does not approve its authored interpretation.\n\n| Requirement | Proposed scope | Open questions | Decision |\n| --- | --- | --- | --- |\n${review.requirements.map((r) => `| ${r.requirement_id} — ${r.title} | Description-record obligation, runtime effectiveness unclaimed | ${r.open_question_ids.join(', ')}; Q10; Q12 | ${r.review_decision?.decision || 'PENDING'} |`).join('\n')}\n\nThe per-domain sheets contain exact wording, rationale, evidence expectations and verification notes. Do not approve a row without resolving its applicability and referenced issues.\n`);
  out.set('evidence/oas-first-release/review-package/DOMAIN_MAPPING_ISSUES.md', `# Domain mapping issues\n\n${mapping.mappings.filter((r) => r.namespace === 'shs-oas-reporting-v1').map((r) => `- ${r.label}: ${r.classification}; canonical result ${r.canonical_domain_ids.join(', ') || 'none'}. ${r.rationale}`).join('\n')}\n\nSeven labels remain release/report-migration blockers. Reviewers must record approved equivalence or explicit non-equivalence/exclusion; related concepts are not resolver output. See docs/OAS_DOMAIN_MAPPING.md for the complete generated table.\n`);
  return out;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] || 'validate';
  const review = validateReview(loadReview());
  if (command === 'generate' || command === 'check') for (const [file, contents] of generatedViews(review)) {
    if (command === 'generate') { mkdirSync(path.dirname(path.join(root,file)), { recursive: true }); writeFileSync(path.join(root,file), contents); }
    else ensure(readFileSync(path.join(root,file),'utf8') === contents, `Generated review drift: ${file}`);
  }
  else ensure(command === 'validate', 'Unknown first-release command');
  console.log(`OAS first-release ${command}: ${review.requirements.length} traceable candidates valid; adoption remains BLOCKED`);
}
