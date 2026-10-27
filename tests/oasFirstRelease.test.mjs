import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { loadReview, loadMappings, validateReview, validateMappings, resolveDomainLabel, validateReviewDeclaration, validateReviewSchema, reviewChecksum, statementChecksum, releaseGates, assertAdoptable, validateReleasedRequirement, generatedViews } from '../scripts/oas-first-release.mjs';
import { readSource, generateFromGit, serialize, digest, root, inputPaths, artifactPath } from '../scripts/oas-catalog.mjs';
const review = loadReview(), mapping = loadMappings(), catalog = readSource();
const baseline = '35d2bdfd3d8014658789430c2288d20418bc7dcb';
const fresh = () => structuredClone(review);
const statement = review.requirements[0];
const declaration = (state = 'applicable') => ({ schema_version: '1.1.0-review.1', review_only: true, authoring_reference: { standard_id: 'OAS-1', proposed_standard_version: '0.0.0-public-review.2', review_source_checksum: reviewChecksum(review) }, profile_reference: null, declaration_scope: 'Test description record for system version X', declared_by: 'TEST ONLY provider', declared_at: '2026-10-26T00:00:00Z', declaration_status: 'declared', requirement_declarations: [{ requirement_id: statement.requirement_id, statement_checksum: statementChecksum(statement), state, reason: state === 'not_applicable' ? 'Test-only scope excludes this obligation' : '', evidence_references: state === 'declared_satisfied' ? ['test-fixture:evidence'] : [] }], notes: 'TEST ONLY — no claim of adoption or conformance', evaluation_status: 'NOT_EVALUATED' });
test('17 traceable candidates cover exactly the existing eight domains without published requirements', () => {
  validateReview(review);
  assert.equal(review.requirements.length,17);
  assert.deepEqual(catalog.domains.map((d) => review.requirements.filter((r) => r.domain_id === d.domain_id).length), [2,3,2,2,2,2,2,2]);
  assert.deepEqual(catalog.requirements, []); assert.deepEqual(review.profiles, []);
  assert.deepEqual(review.requirements.map((r) => r.requirement_id), Array.from({length:17},(_,i) => `OAS-1-REQ-${String(i+1).padStart(4,'0')}`));
  assert.ok(review.requirements.every((r) => r.status === 'candidate' && r.review_decision === null && r.release_id === null && r.version_introduced === null && r.risk_levels.length === 0));
});
test('duplicate IDs and whitespace/case-equivalent normative statements rejected', () => {
  let r=fresh();r.requirements[1].requirement_id=r.requirements[0].requirement_id;assert.throws(()=>validateReview(r),/Duplicate requirement ID/);
  r=fresh();r.requirements[1].normative_text='  '+r.requirements[0].normative_text.toUpperCase().replaceAll(' ','  ')+'  ';assert.throws(()=>validateReview(r),/Duplicate normative statement/);
});
test('all candidates need canonical domains, normative text, applicability and exact source citation', () => {
  for (const mutate of [r=>r.requirements[0].domain_id='OAS-1-D09',r=>r.requirements[0].normative_text='',r=>delete r.requirements[0].applicability,r=>r.requirements[0].sources[0].exact_excerpt='Invented source wording',r=>r.requirements[0].sources[0].source_line=1,r=>r.requirements[0].normative_text_reference.anchor='unrelated',r=>r.requirements[0].open_question_ids=['Q999']]) { const r=fresh();mutate(r);assert.throws(()=>validateReview(r)); }
});
test('candidate risk conditioning cannot silently introduce R0–R4 duties',()=>{const r=fresh();r.requirements[0].risk_levels=['R0'];assert.throws(()=>validateReview(r));assert.deepEqual(catalog.risk_levels.map(r=>r.risk_level_id),['R0','R1','R2','R3','R4']);});
test('approved/released status cannot be asserted without review and governance',()=>{
  for(const status of ['review_approved','released','active']){const r=fresh();r.requirements[0].status=status;assert.throws(()=>validateReview(r));}
  const r=fresh();r.adoption={decision:'adopted'};assert.throws(()=>validateReview(r));
});
test('a review decision is bound to exact wording and is not release adoption',()=>{
  const r=fresh();const row=r.requirements[0];row.status='review_approved';row.review_decision={decision:'approved',decided_by:'TEST ONLY reviewer',decided_at:'2026-10-26T00:00:00Z',statement_checksum:statementChecksum(row),decision_record_reference:'test-fixture:decision',rationale:'Test-only positive review fixture'};validateReview(r);assert.throws(()=>assertAdoptable(r),/Not adoptable/);row.normative_text+=' Additional changed wording.';assert.throws(()=>validateReview(r),/different wording/);
});
for(const state of ['applicable','not_applicable','declared_satisfied','not_declared','unknown'])test(`review declaration ${state} validates and stays NOT_EVALUATED`,()=>{const d=declaration(state);validateReviewDeclaration(d);assert.equal(d.evaluation_status,'NOT_EVALUATED');});
test('declarations reject absent NA reason, absent offered evidence, unknown IDs, stale pins and conformance claims',()=>{
  for(const mutate of [d=>{d.requirement_declarations[0].state='not_applicable';d.requirement_declarations[0].reason=' ';},d=>d.requirement_declarations[0].state='declared_satisfied',d=>d.requirement_declarations[0].requirement_id='OAS-1-REQ-9999',d=>d.requirement_declarations[0].statement_checksum='sha256:'+'0'.repeat(64),d=>d.authoring_reference.review_source_checksum='sha256:'+'0'.repeat(64),d=>d.evaluation_status='PASS',d=>d.review_only=false,d=>d.requirement_declarations.push({...d.requirement_declarations[0],state:'unknown'})]){const d=declaration();mutate(d);assert.throws(()=>validateReviewDeclaration(d));}
});
test('declaration review contract cannot masquerade as the existing published declaration schema',()=>{
  const d=declaration();d.schema_version='1.0.0';assert.throws(()=>validateReviewSchema('declaration',d));
});
test('aliases resolve deterministically by namespace and never by reporting ordinal',()=>{
  for(const domain of catalog.domains) assert.equal(resolveDomainLabel('oas-public',domain.domain_name),domain.domain_id);
  assert.equal(resolveDomainLabel('shs-oas-reporting-v1','Human Oversight'),'OAS-1-D06');
  assert.throws(()=>resolveDomainLabel('shs-oas-reporting-v1','05'),/Unknown/);
  const unresolved=mapping.mappings.filter(r=>['ambiguous','unmapped'].includes(r.classification));assert.equal(unresolved.length,7);
  for(const row of unresolved) assert.throws(()=>resolveDomainLabel(row.namespace,row.label),/ambiguous|unmapped/);
});
test('unreviewed aliases, unknown mapping domains, missing and duplicate dispositions rejected',()=>{
  for(const mutate of [m=>m.mappings.find(r=>r.classification==='ambiguous').canonical_domain_ids=['OAS-1-D01'],m=>m.mappings.find(r=>r.classification==='ambiguous').classification='alias',m=>m.mappings[0].canonical_domain_ids=['OAS-1-D09'],m=>m.mappings.pop(),m=>m.mappings.push({...m.mappings[0],rationale:'different reason'})]){const m=structuredClone(mapping);mutate(m);assert.throws(()=>validateMappings(m));}
});
test('candidate supersession rejects dangling and circular replacement links',()=>{
  const r=fresh();r.requirements[0].superseded_by=['OAS-1-REQ-9999'];assert.throws(()=>validateReview(r),/supersession/);
  const c=fresh();const [a,b]=c.requirements;a.superseded_by=[b.requirement_id];b.supersedes=[a.requirement_id];validateReview(c);b.superseded_by=[a.requirement_id];a.supersedes=[b.requirement_id];assert.throws(()=>validateReview(c),/Circular/);
});
test('adopted requirements require a valid release, nonempty normative text and matching governance state',()=>{
  const c=structuredClone(catalog);const rel=c.releases[0];Object.assign(rel,{standard_version:'1.0.0',release_id:'OAS-1@1.0.0',release_status:'released',release_date:'2026-12-01',effective_date:'2026-12-01',normative_status:'published',publication_label:'TEST ONLY adopted fixture',review_label:null});
  const r={requirement_id:'OAS-1-REQ-9999',standard_id:'OAS-1',standard_version:'1.0.0',release_id:'OAS-1@1.0.0',domain_id:'OAS-1-D01',risk_levels:[],normative_text:'The TEST ONLY provider MUST document a test fixture.',normative_text_reference:{source_path:'tests/oasFirstRelease.test.mjs',anchor:'fixture'},status:'active',supersedes:[],superseded_by:[]};c.requirements=[r];c.requirement_population_status='populated';
  const g={decision:'adopted',release_id:rel.release_id,approved_by:'TEST ONLY adopter',approval_record_reference:'test-fixture:adoption',catalog_source_checksum:digest(serialize(c))};validateReleasedRequirement(r,c,g);
  assert.throws(()=>validateReleasedRequirement({...r,normative_text:''},c,g));assert.throws(()=>validateReleasedRequirement({...r,release_id:'OAS-1@9.0.0'},c,g));assert.throws(()=>validateReleasedRequirement({...r,normative_text:'A different TEST obligation MUST NOT be adopted.'},c,g));assert.throws(()=>validateReleasedRequirement(r,c,null));assert.throws(()=>validateReleasedRequirement(r,c,{...g,catalog_source_checksum:'sha256:'+'0'.repeat(64)}));
  rel.release_status='public_review';assert.throws(()=>validateReleasedRequirement(r,c,g));
});
test('release gates block RC, adoption and publication; generated metadata contains no invented approval',()=>{
  const gates=releaseGates();assert.equal(gates.find(g=>g.gate==='governance_adoption').status,'BLOCKED');assert.equal(gates.find(g=>g.gate==='domain_mapping_review').status,'BLOCKED');assert.throws(()=>assertAdoptable(),/Not adoptable/);
  const outputs=generatedViews();const metadata=JSON.parse(outputs.get('evidence/oas-first-release/review-package/CANDIDATE_METADATA.json'));assert.equal(metadata.release_id,null);assert.equal(metadata.governance_approval,null);assert.equal(metadata.effective_date,null);assert.equal(metadata.status,'review_only');
});
test('human review documents and checksums regenerate deterministically without manual divergence',()=>{
  const a=generatedViews(),b=generatedViews();assert.deepEqual([...a],[...b]);
  for(const [file,content] of a) assert.equal(readFileSync(path.join(root,file),'utf8'),content,file);
  assert.match(reviewChecksum(review),/^sha256:[a-f0-9]{64}$/);assert.equal(reviewChecksum(review),digest(serialize(review)));
  const r=fresh();r.requirements[0].normative_text+=' Changed.';assert.notEqual(reviewChecksum(r),reviewChecksum(review));assert.notEqual(statementChecksum(r.requirements[0]),statementChecksum(statement));
});
test('all historical catalog inputs, reporting production code and public pin remain byte-for-byte unchanged',()=>{
  for(const file of [...inputPaths,artifactPath,'apps/shs-api/src/domain/reporting/studio-oas-report-adapters.ts','schemas/oas/declaration.schema.json'])assert.equal(readFileSync(path.join(root,file),'utf8'),execFileSync('git',['show',`${baseline}:${file}`],{cwd:root,encoding:'utf8'}),file);
  assert.equal(readFileSync(path.join(root,artifactPath),'utf8'),serialize(generateFromGit()));
  execFileSync('git',['merge-base','--is-ancestor',baseline,'HEAD'],{cwd:root});
});
