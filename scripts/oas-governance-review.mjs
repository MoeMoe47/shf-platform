import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { root, readSource, serialize, digest } from './oas-catalog.mjs';
import { loadReview, loadMappings, validateReview } from './oas-first-release.mjs';

export const baselineCommit = '47b12e3066ca6d83650eed62ae780ce03bf8e6e7';
export const decisionPath = 'standards/oas/governance/first-release-review.json';
export const loadDecisions = () => JSON.parse(readFileSync(path.join(root, decisionPath), 'utf8'));
const baselineReview = JSON.parse(execFileSync('git', ['show', `${baselineCommit}:standards/oas/authoring/first-release.json`], { cwd: root, encoding: 'utf8' }));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateShape = ajv.compile(JSON.parse(readFileSync(path.join(root, 'schemas/oas/governance/review.schema.json'), 'utf8')));
const ensure = (condition, message) => { if (!condition) throw new Error(message); };
const same = (a, b) => serialize(a) === serialize(b);
const recordChecksum = (r) => digest(serialize(r));
export function dispositionCounts(decisions = loadDecisions()) {
  return Object.fromEntries(['APPROVE','APPROVE WITH REVISION','HOLD','REJECT'].map((decision) => [decision, decisions.requirements.filter((r) => r.decision === decision).length]));
}
export function validateDecisions(decisions, authoring = loadReview(), mapping = loadMappings()) {
  ensure(validateShape(decisions), ajv.errorsText(validateShape.errors));
  validateReview(authoring, mapping);
  ensure(decisions.authoring_checksum_before === recordChecksum(baselineReview), 'Incorrect baseline authoring checksum');
  ensure(decisions.authoring_checksum_after === recordChecksum(authoring), 'Stale reviewed authoring checksum');
  const ids = baselineReview.requirements.map((r) => r.requirement_id).sort();
  ensure(same(authoring.requirements.map((r) => r.requirement_id).sort(), ids), 'Reserved IDs changed or reused');
  ensure(same(decisions.requirements.map((r) => r.requirement_id).sort(), ids), 'Every candidate needs exactly one disposition');
  ensure(new Set(decisions.requirements.map((r) => r.requirement_id)).size === ids.length, 'Duplicate disposition');
  const revisionIds = new Set();
  for (const revision of decisions.revisions) {
    ensure(!revisionIds.has(revision.requirement_id), 'Duplicate revision'); revisionIds.add(revision.requirement_id);
    ensure(decisions.requirements.find((r) => r.requirement_id === revision.requirement_id)?.decision === 'APPROVE WITH REVISION', 'Revision needs explicit revision disposition');
    ensure(!revision.material_normative_change && revision.change_type === 'editorial_clarification' && revision.reapproval_required, 'Material changes need a separately allocated replacement ID');
  }
  for (const row of decisions.requirements) {
    const before = baselineReview.requirements.find((r) => r.requirement_id === row.requirement_id);
    const after = authoring.requirements.find((r) => r.requirement_id === row.requirement_id);
    ensure(row.domain_id === before.domain_id && after.domain_id === before.domain_id && after.standard_id === before.standard_id, 'Requirement ID repurposed');
    ensure(row.title === after.title && row.baseline_record_checksum === recordChecksum(before) && row.reviewed_record_checksum === recordChecksum(after), 'Disposition binds incorrect requirement metadata');
    ensure(after.review_decision === null && after.status === 'candidate', 'Repository disposition is not institutional approval');
    ensure(!row.release_eligible, 'No requirement eligible while authorization and gates are absent');
    const changes = Object.keys(before).filter((field) => !same(before[field],after[field])).map((field) => ({ field, before:before[field], after:after[field] }));
    const revision = decisions.revisions.find((r) => r.requirement_id === row.requirement_id);
    ensure(row.decision === 'APPROVE WITH REVISION' ? revision && changes.length > 0 && same(revision.changes,changes) : changes.length === 0 && !revision, 'Unrecorded or inconsistent requirement change');
    ensure(same(after.sources,before.sources) && same(after.applicability,before.applicability) && same(after.supersedes,before.supersedes) && same(after.superseded_by,before.superseded_by), 'Editorial review cannot repurpose source, applicability or supersession');
  }
  ensure(same(decisions.questions.map((q) => q.question_id).sort(), baselineReview.open_questions.map((q) => q.question_id).sort()), 'Every open question needs exactly one disposition');
  const questions = new Map(decisions.questions.map((q) => [q.question_id,q]));
  for (const row of decisions.requirements) for (const id of row.open_question_ids) ensure(questions.has(id), 'Unknown disposition question');
  for (const row of decisions.questions) {
    for (const id of row.affected_requirement_ids) ensure(ids.includes(id), 'Unknown affected requirement');
    const after = authoring.open_questions.find((q) => q.question_id === row.question_id);
    const before = baselineReview.open_questions.find((q) => q.question_id === row.question_id);
    const changes = Object.keys(before).filter((field) => !same(before[field], after[field])).map((field) => ({ field, before:before[field], after:after[field] }));
    ensure(same(row.source_changes, changes), 'Unrecorded question source change');
    ensure((after.status === 'resolved') === (row.classification === 'RESOLVED'), 'Question disposition and source disagree');
    if (row.classification === 'DEFERRED') ensure(row.decision.length > 40 && row.source_change.length > 0, 'Deferral needs an exclusion rationale');
  }
  const unresolved = mapping.mappings.filter((r) => r.namespace === 'shs-oas-reporting-v1' && ['ambiguous','unmapped'].includes(r.classification));
  ensure(same(decisions.domain_mapping_decisions.map((r) => r.label).sort(),unresolved.map((r) => r.label).sort()), 'Every unresolved legacy mapping needs one disposition');
  for (const row of decisions.domain_mapping_decisions) {
    const current = unresolved.find((r) => r.label === row.label);
    ensure(row.namespace === current.namespace && row.canonical_domain_ids.length === 0, 'Unresolved mapping cannot enter canonical output');
    ensure(row.decision === (current.classification === 'ambiguous' ? 'AMBIGUOUS — HOLD' : 'UNMAPPED — HOLD'), 'Unsupported mapping approval');
  }
  ensure(!decisions.rc_issued && decisions.rc_release_id === null && decisions.rc_checksum === null && decisions.rc_source_revision === null && decisions.rc_requirement_ids.length === 0 && decisions.adopted_release_id === null, 'No RC or adopted release has been authorized');
  return decisions;
}
// This is a content consideration list, never an issued release membership.
export function proposedMembership(decisions = loadDecisions()) {
  return decisions.requirements.filter((r) => r.decision === 'APPROVE').map((r) => r.requirement_id).sort();
}
export function validateMembership(ids, decisions = loadDecisions()) {
  ensure(new Set(ids).size === ids.length, 'Duplicate RC membership');
  const approved = proposedMembership(decisions);
  for (const id of ids) ensure(approved.includes(id), 'Held, rejected, revision-pending or unknown requirement cannot enter RC');
  return ids;
}
export function rcGates(decisions = loadDecisions()) {
  validateDecisions(decisions);
  return [
    {gate:'explicit_dispositions_and_metadata',status:'PASS',reason:'All 17 candidates have complete, checksum-bound repository review dispositions.'},
    {gate:'stable_identifiers_and_domains',status:'PASS',reason:'Reserved IDs and eight domains remain unchanged; no IDs reused.'},
    {gate:'no_certification_claims',status:'PASS',reason:'All evaluation boundaries remain NOT_EVALUATED; no certification scheme or scores.'},
    {gate:'institutionally_approved_membership',status:'FAIL',reason:'Content APPROVE is a repository disposition; authorized OAS approval fields and issuance authorization remain null.'},
    {gate:'considered_wording_stability',status:'PASS',reason:'The six content-APPROVE rows retain exact baseline wording and complete metadata. The three revised rows are excluded pending re-review; no institutional finalization is inferred.'},
    {gate:'blocking_questions_and_scope',status:'FAIL',reason:'Q01, Q05, Q08, Q10, Q11 and Q12 remain blocking.'},
    {gate:'declaration_compatibility',status:'FAIL',reason:'Per-requirement declaration states exist only in a review-only schema; no approved operational migration.'},
    {gate:'taxonomy_disposition',status:'FAIL',reason:'Five ambiguous and two unmapped legacy labels lack approved mapping or explicit migration exclusion.'},
    {gate:'rc_release_contract',status:'FAIL',reason:'The published release schema has no release_candidate status; no governed RC contract exists.'},
    {gate:'source_revision_checksum_and_changelog',status:'PASS',reason:'Baseline revision, exact input digests, deterministic review views and no-issuance changelog are provided; RC provenance remains null.'},
  ];
}
export function assertRcIssuable(decisions = loadDecisions()) {
  const failures = rcGates(decisions).filter((g) => g.status === 'FAIL');
  ensure(failures.length === 0, `RC not ready: ${failures.map((g) => g.gate).join(', ')}`);
}
export const governanceInputPaths = [
  decisionPath,'standards/oas/authoring/first-release.json','standards/oas/authoring/domain-mapping.json',
  'schemas/oas/governance/review.schema.json','schemas/oas/review/declaration.schema.json','schemas/oas/release.schema.json',
  'scripts/oas-governance-review.mjs','scripts/oas-first-release.mjs','docs/OAS_RELEASE_ADOPTION_POLICY.md',
].sort();
export function sourceManifest(decisions = loadDecisions()) {
  validateDecisions(decisions);
  const source_files = governanceInputPaths.map((p) => ({path:p,checksum:digest(readFileSync(path.join(root,p)))}));
  const payload = { reviewed_baseline_revision:baselineCommit, source_revision:null, source_revision_note:'Current input bytes are pinned by the commit containing this review, not misattributed to the reviewed baseline. No RC source revision exists.', source_files, source_checksum:digest(serialize(source_files)), authoring_checksum:decisions.authoring_checksum_after, decision_checksum:recordChecksum(decisions), rc_issued:false, rc_source_revision:null, rc_checksum:null, proposed_content_membership:proposedMembership(decisions), issued_membership:[] };
  return {...payload,review_checksum:digest(serialize(payload))};
}
export function governanceViews(decisions = loadDecisions()) {
  validateDecisions(decisions);
  const out = new Map(), authoring = loadReview(), catalog = readSource(), counts = dispositionCounts(decisions);
  const warning = 'This is the repository technical review requested by the user. APPROVE is a content disposition, not manufactured institutional authorization, adoption or RC issuance. Authorized OAS approval fields remain null. No RC exists.\n';
  const row = (r) => authoring.requirements.find((a) => a.requirement_id === r.requirement_id);
  const idsFor = (d) => decisions.requirements.filter((r) => r.decision === d).map((r) => r.requirement_id).join(', ') || 'none';
  out.set('evidence/oas-governance-review/REQUIREMENT_DECISION_MATRIX.md', `# Requirement decision matrix\n\n${warning}\n| Requirement ID | Domain | Decision | Reason | Required Revision | Open Question | Release Eligible |\n| --- | --- | --- | --- | --- | --- | --- |\n${decisions.requirements.map((r) => `| ${r.requirement_id} | ${r.domain_id} | ${r.decision} | ${r.reason} | ${r.required_revision} | ${r.open_question_ids.join(', ')}; global Q01/Q10/Q12 | NO — issuance gates fail |`).join('\n')}\n\nCounts: ${Object.entries(counts).map(([d,n]) => `${d}: ${n}`).join('; ')}. Each candidate appears exactly once. Exact metadata/checksums and all ten criterion assessments are in standards/oas/governance/first-release-review.json and REQUIREMENT_REVIEW_DETAILS.md.\n`);
  out.set('evidence/oas-governance-review/REQUIREMENT_REVIEW_DETAILS.md', `# Individual review findings\n\n${warning}\n${decisions.requirements.map((r) => {
    const a=row(r);
    return `## ${r.requirement_id} — ${a.title}\n\nDomain: ${a.domain_id}. Disposition: ${r.decision}.\n\n${a.normative_text}\n\nApplicability: ${a.applicability}\n\nRationale: ${a.rationale}\n\nEvidence: ${a.evidence_expectations.join('; ')}\n\nVerification: ${a.verification_notes}\n\nQuestions: ${a.open_question_ids.join(', ')}; global Q01/Q10/Q12.\n\nProvenance: ${a.sources.map((s) => `\`${s.source_path}:${s.source_line}\` at ${s.source_revision}, ${s.source_section}: “${s.exact_excerpt}”`).join('; ')}\n\nReviewed record checksum: ${r.reviewed_record_checksum}.\n\n${Object.entries(r.criteria).map(([k,v]) => `- ${k}: ${v.result}. ${v.reason}`).join('\n')}\n`;
  }).join('\n')}`);
  out.set('evidence/oas-governance-review/REQUIREMENT_REVISIONS.md', `# Requirement revisions\n\n${warning}\nThree reserved IDs retained. Only editorial clarification is applied; no substantive applicability, source authority or supersession change. Every APPROVE WITH REVISION remains excluded until an explicit re-review of the final text; revision application does not auto-upgrade its disposition.\n\n${decisions.revisions.map((r) => `## ${r.requirement_id}\n\n${r.meaning_preserved_reason}\n\n${r.changes.map((c) => `Field: ${c.field}\n\nBefore: ${typeof c.before === 'string' ? c.before : JSON.stringify(c.before)}\n\nAfter: ${typeof c.after === 'string' ? c.after : JSON.stringify(c.after)}\n`).join('\n')}`).join('\n')}\nThe Q03 label mismatch is clarified editorially, but Q03 as a whole remains open and DEFERRED because multiple-party and organization-identifier semantics are not resolved. No canonical question is marked resolved.\n`);
  out.set('evidence/oas-governance-review/OPEN_QUESTION_DISPOSITIONS.md', `# Open question dispositions\n\n${warning}\nNo question is fully RESOLVED. A local wording clarification does not close the broader Q03 policy question. DEFERRED excludes the affected held/revision-pending concepts from the considered subset; it does not erase domain-coverage gaps or the global Q12 blocker.\n\n| Question | Classification | Decision / rationale | Affected requirements | Release gate / deferred scope | Exact source change |\n| --- | --- | --- | --- | --- | --- |\n${decisions.questions.map((q) => `| ${q.question_id} | ${q.classification} | ${q.decision} | ${q.affected_requirement_ids.join(', ')} | ${q.blocked_gate_or_deferred_scope} | ${q.source_change} |`).join('\n')}\n\n## Exact question source changes\n\n${decisions.questions.filter((q) => q.source_changes.length).map((q) => `### ${q.question_id}\n\n${q.source_changes.map((c) => `Field: ${c.field}\n\nBefore: ${c.before}\n\nAfter: ${c.after}\n`).join('\n')}`).join('\n') || 'None; all canonical questions remain open.'}`);
  out.set('evidence/oas-governance-review/DOMAIN_MAPPING_DECISIONS.md', `# Domain mapping decisions\n\n${warning}\n| Legacy reporting label | Decision | Canonical mapping | Reason | Source change |\n| --- | --- | --- | --- | --- |\n${decisions.domain_mapping_decisions.map((m) => `| ${m.label} | ${m.decision} | none | ${m.reason} | ${m.source_change} |`).join('\n')}\n\nNo new canonical mapping, alias or deprecation is approved. Existing public labels/D01–D08 remain canonical. The previously recorded lexical Human Oversight → D06 alias remains valid within its namespace; it does not reinterpret report ordinal 05 or assess a historical report. Canonical mapping source and docs/OAS_DOMAIN_MAPPING.md remain unchanged because no new equivalence is supportable.\n`);
  out.set('evidence/oas-governance-review/RELEASE_SCOPE_ASSESSMENT.md', `# First-release scope assessment\n\n${warning}\nThe six content-APPROVE rows form a partial documentation subset: intended purpose/boundaries, capability inventory, permissions/mechanism references and verification/monitoring plans. They are bounded and inspectable as descriptions, and do not create runtime assurance. Scope is too incomplete to claim a coherent first OAS standard without an explicit, authorized narrowed-scope decision. A count or eight-domain vocabulary alone does not establish adequacy.\n\n| Domain | APPROVE | APPROVE WITH REVISION | HOLD | REJECT | Assessment |\n| --- | --- | --- | --- | --- | --- |\n${catalog.domains.map((d) => `| ${d.domain_id} ${d.domain_name} | ${decisions.requirements.filter((r)=>r.domain_id===d.domain_id&&r.decision==='APPROVE').length} | ${decisions.requirements.filter((r)=>r.domain_id===d.domain_id&&r.decision==='APPROVE WITH REVISION').length} | ${decisions.requirements.filter((r)=>r.domain_id===d.domain_id&&r.decision==='HOLD').length} | ${decisions.requirements.filter((r)=>r.domain_id===d.domain_id&&r.decision==='REJECT').length} | ${decisions.requirements.some((r)=>r.domain_id===d.domain_id&&r.decision==='APPROVE')?'Partial description coverage; global scope/authorization gates remain.':'No as-written content-approved member; cannot silently omit the domain.'} |`).join('\n')}\n\nD01/D05/D06/D08 have no as-written content-approved member. Most serious gaps: provenance granularity, safety-policy scope, human-intervention applicability, evidence/declaration semantics and lifecycle vocabulary. Equal counts are not required; explicit scope, dependency and coverage decisions are. No rejected IDs exist; held/reserved IDs are retained and never repurposed.\n`);
  out.set('evidence/oas-governance-review/RELEASE_GATE_STATUS.md', `# RC gate status\n\n${warning}\n| Gate | Result | Evidence / blocker |\n| --- | --- | --- |\n${rcGates(decisions).map((g)=>`| ${g.gate} | ${g.status} | ${g.reason} |`).join('\n')}\n\nRuntime validation results are recorded separately in TEST_RESULTS.md; structural review gates do not substitute for actual unit/build checks. RC decision: NOT ISSUED. No release_candidate metadata, candidate date, effective date, supersession event or production release is created.\n`);
  out.set('evidence/oas-governance-review/REGISTRY_READINESS_AFTER_REVIEW.md', `# Registry readiness after review\n\nRegistry must not treat repository dispositions or any future RC as final adopted normative authority. No Registry files changed.\n\n| Field | Classification | Boundary |\n| --- | --- | --- |\n| Standard ID | READY | OAS-1, unchanged canonical authority |\n| RC version | BLOCKED | No RC issued; proposed spellings are not resolvable versions |\n| Domain IDs | READY | D01–D08, unchanged; ambiguous report labels are not aliases |\n| Requirement IDs | BLOCKED | Reserved review IDs only; content dispositions confer no published release membership |\n| Requirement membership | BLOCKED | Issued RC membership is empty; six APPROVE rows are only a consideration list |\n| Profiles | READY WITH CONDITIONS | Catalog intentionally empty; no profile references resolve |\n| Declarations | READY WITH CONDITIONS | Published v1 standard-level draft references only; per-requirement review schema is not an approved operational migration |\n| Supersession | READY | Existing published empty graphs only; no replacement event created |\n| Conformance claims | BLOCKED | No assessment, certification or automatic PASS/FAIL authority |\n\nNo field becomes READY FOR RC-LEVEL TESTING ONLY because there is no RC. The historical public-review.1 pin and provenance remain READY for bounded draft metadata use. No Registry integration beyond READY fields is authorized by this review.\n`);
  out.set('docs/OAS_1_0_RC1_CHANGELOG.md', `# RC1 review changelog — RC NOT ISSUED\n\n${warning}\nReviewed checkpoint ${baselineCommit}, following public baseline OAS-1@0.0.0-public-review.1. This is a no-issuance review changelog, not an artifact identifying an existing RC or 1.0.0.\n\n- Content APPROVE: ${idsFor('APPROVE')}.\n- APPROVE WITH REVISION, applied editorial changes but reapproval required: ${idsFor('APPROVE WITH REVISION')}.\n- HOLD: ${idsFor('HOLD')}.\n- REJECT: ${idsFor('REJECT')}. No ID recycling.\n- Taxonomy: all seven unresolved reporting labels held; no new equivalence/deprecation approved; known D06 alias preserved.\n- Questions: no fully resolved questions; Q02/Q03/Q04/Q06/Q07/Q09 deferred with excluded candidates; Q01/Q05/Q08/Q10/Q11/Q12 blocking.\n- Declaration compatibility: current v1 retained; per-requirement proposal remains review-only and not adopted.\n- Profiles remain empty; R0–R4 remains informative; all system evaluations remain NOT_EVALUATED.\n- Known limits: incomplete proposed scope, absent institutional approval, unapproved RC/schema workflow and publication contract.\n- Historical public-review bytes and supersession are unchanged. No RC membership, effective date, certification or 1.0.0 publication.\n`);
  out.set('docs/OAS_GOVERNANCE_DECISION_RECORD_RC1.md', `# Governance review decision record — RC1 NOT ISSUED\n\n${warning}\nReview actor: ${decisions.review_actor}. Review date: ${decisions.review_date}. Reviewed baseline revision: ${baselineCommit}. All canonical candidate fields and eight generated domain sheets were inspected. No human identity, board, vote, signature, quorum or authorized OAS adopter is asserted. Institutional authorization record: absent.\n\nCriteria: precision, actor, applicability, inspectability, duplication, excessive breadth/narrowness, OAS authority, accidental certification and first-baseline suitability. Every candidate has an explicit disposition and full criterion findings in the canonical review ledger.\n\nResult: ${Object.entries(counts).map(([d,n])=>`${d} ${n}`).join('; ')}. Three editorial revisions are applied under reserved IDs, subject to re-review. Six content-approved rows are eligible only for further consideration, not RC inclusion while gates fail. No RC is issued; issued requirement membership is empty.\n\nRC status, if separately authorized later, would mean a pinned reviewable candidate standard with explicitly approved membership. It would not mean adopted 1.0.0, implementation conformance, certification, Registry registration/authorization, unrestricted execution or a Trust Bureau opinion. The published release contract presently does not define that status; version spelling alone cannot create it.\n\nBefore any RC: settle Q01/Q05/Q08/Q10/Q11/Q12; finalize and re-review revised wording; resolve held dependencies or approve explicit exclusions; establish a coherent scope and authorized content/issuance decisions; adopt compatible RC/declaration schema contracts; rerun generation/validation and create a real revision/digest-bound RC artifact. Before 1.0.0: a separate final adoption action, candidate validation/review dispositions, release/effective dates, immutable content/checksums, changelog/migration guidance and authorized publication are required. This commit/push is review delivery only.\n\nCanonical decision source: ${decisionPath}. Reviewed authoring digest: ${decisions.authoring_checksum_after}. REVIEW_SOURCE_MANIFEST.json records exact current input digests; its reviewed_baseline_revision is not misrepresented as the source commit of later edits. The containing Git commit pins this review's source. No RC source revision or checksum exists.\n`);
  out.set('evidence/oas-governance-review/REVIEW_SOURCE_MANIFEST.json',serialize(sourceManifest(decisions)));
  return out;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const command=process.argv[2]||'validate';
  validateDecisions(loadDecisions());
  if (command==='generate'||command==='check') for (const [file,contents] of governanceViews()) {
    if(command==='generate'){mkdirSync(path.dirname(path.join(root,file)),{recursive:true});writeFileSync(path.join(root,file),contents);}
    else ensure(readFileSync(path.join(root,file),'utf8')===contents,`Governance view drift: ${file}`);
  } else ensure(command==='validate','Unknown governance command');
  console.log(`OAS governance ${command}: 17 dispositions valid; ${JSON.stringify(dispositionCounts())}; RC NOT ISSUED`);
}
