import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {baselineRevision,baseAuthoring,loadScope,loadMapping,loadAcceptance,validateScope,effectiveRequirements,validateMapping,resolveLabel,validateShape,scopeChecksum,contractChecksums,acceptanceIssues,readinessGates,assertRcReady,validateDeclaration,validateRcContract,manifest,inputPaths,generatedViews,verifyCommittedContent,currentSourceRevision} from '../scripts/oas-scope-closure.mjs';
import {root,serialize,digest,readSource,artifactPath,generateFromGit} from '../scripts/oas-catalog.mjs';
const scope=loadScope(),fresh=()=>structuredClone(scope);
const fixtureCatalog=()=>({standard_id:'OAS-1',release_id:'OAS-1@1.0.0-rc.1',status:'release_candidate',requirement_ids:[...scope.included_requirement_ids]});
const fixtureDeclaration=()=>({schema_version:'1.1.0',standard_id:'OAS-1',release_id:'OAS-1@1.0.0-rc.1',profile_reference:null,declaration_scope:'TEST ONLY scoped system version',declarant:{identity_reference:'test-fixture:provider',reference_kind:'provider_supplied'},declared_at:'2026-10-27T00:00:00Z',declaration_status:'declared',requirements:scope.included_requirement_ids.map(id=>({requirement_id:id,applicability:'applicable',applicability_reason:'',declaration_status:'declared_satisfied',evidence_references:['test-fixture:documentation'],notes:'TEST ONLY provider assertion, no conformance'})),evidence_references:[{reference:'test-fixture:documentation',kind:'plan'}],notes:'TEST ONLY synthetic pin; no RC is issued',evaluation_status:'NOT_EVALUATED'});
function fixtureRc(){const payload={standard_id:'OAS-1',release_id:'OAS-1@1.0.0-rc.1',standard_version:'1.0.0-rc.1',status:'release_candidate',candidate_date:'2026-10-27',effective_date:null,requirement_ids:[...scope.included_requirement_ids],domain_ids:[...new Set(effectiveRequirements().map(r=>r.domain_id))].sort(),source_revision:baselineRevision,source_checksum:manifest().source_checksum,requirements_checksum:digest(serialize(effectiveRequirements())),governance_decision_reference:'TEST ONLY synthetic decision; not authority',scope_checksum:scopeChecksum(),changelog_reference:'TEST ONLY fixture; not a publication',predecessor_reference:'OAS-1@0.0.0-public-review.1',predecessor_relationship:'derived_from_historical_public_review',declaration_schema_id:'urn:oas:schema:closure:declaration:1'};return {...payload,artifact_checksum:digest(serialize(payload))};}

test('all six blocking questions have exact issues, alternatives and bounded decisions',()=>{
 validateScope();assert.deepEqual(scope.blocking_question_resolutions.map(q=>q.question_id),['Q01','Q05','Q08','Q10','Q11','Q12']);assert.equal(scope.blocking_question_resolutions.filter(q=>q.disposition==='RESOLVED').length,5);assert.deepEqual(scope.blocking_question_resolutions.filter(q=>q.disposition==='REMAINS BLOCKING').map(q=>q.question_id),['Q10']);for(const q of scope.blocking_question_resolutions){assert.equal(q.exact_issue,baseAuthoring.open_questions.find(a=>a.question_id===q.question_id).detail);assert.ok(q.alternatives_considered&&q.responsible_contract&&q.resolution);}
 const bad=fresh();bad.blocking_question_resolutions.pop();assert.throws(()=>validateScope(bad));
});
test('all three revised requirements receive final APPROVE with ten-criterion review',()=>{
 const rows=scope.requirements.filter(r=>r.revised_requirement_rereview!==null);assert.deepEqual(rows.map(r=>r.requirement_id),['OAS-1-REQ-0001','OAS-1-REQ-0005','OAS-1-REQ-0017']);for(const r of rows){assert.equal(r.revised_requirement_rereview,'APPROVE');assert.equal(r.decision,'APPROVE');assert.equal(Object.keys(r.criteria).length,10);}
 const bad=fresh();bad.requirements[0].revised_requirement_rereview=null;assert.throws(()=>validateScope(bad));
});
test('all eight HOLDs close with five promotions and three explicit post-1.0 deferrals',()=>{
 const rows=scope.requirements.filter(r=>r.hold_disposition!==null);assert.equal(rows.length,8);assert.deepEqual(rows.filter(r=>r.hold_disposition==='MOVE TO APPROVE').map(r=>r.requirement_id),['OAS-1-REQ-0002','OAS-1-REQ-0007','OAS-1-REQ-0010','OAS-1-REQ-0012','OAS-1-REQ-0016']);assert.deepEqual(rows.filter(r=>r.hold_disposition==='REMAIN DEFERRED FOR POST-1.0').map(r=>r.requirement_id),['OAS-1-REQ-0011','OAS-1-REQ-0013','OAS-1-REQ-0015']);assert.ok(rows.filter(r=>r.decision!=='APPROVE').every(r=>r.future_issue_category));
 const bad=fresh();bad.requirements[1].hold_disposition=null;assert.throws(()=>validateScope(bad));
});
test('14 approved requirements cover all eight concepts with no normative text/ID reuse',()=>{
 const records=effectiveRequirements();assert.equal(records.length,14);assert.deepEqual(readSource().domains.map(d=>records.filter(r=>r.domain_id===d.domain_id).length),[2,3,2,2,1,1,1,2]);for(const r of records){const original=baseAuthoring.requirements.find(a=>a.requirement_id===r.requirement_id);assert.equal(r.normative_text,original.normative_text);assert.equal(r.domain_id,original.domain_id);assert.equal(r.status,'scope_review_approved_not_published');assert.equal(r.release_id,null);}
 assert.deepEqual(scope.profiles,[]);assert.equal(scope.risk_level_use,'informative_only');
});
test('deferred, rejected, duplicate or unknown requirements cannot enter scope',()=>{
 for(const mutate of [s=>s.included_requirement_ids.push('OAS-1-REQ-0011'),s=>s.included_requirement_ids.push(s.included_requirement_ids[0]),s=>s.included_requirement_ids[0]='OAS-1-REQ-9999',s=>s.requirements[0].decision='REJECT',s=>s.requirements[0].baseline_record_checksum='sha256:'+'0'.repeat(64)]){const bad=fresh();mutate(bad);assert.throws(()=>validateScope(bad));}
});
test('former deferred questions are resolved within scope or explicitly excluded',()=>{
 assert.deepEqual(scope.prior_deferred_question_dispositions.map(q=>q.question_id),['Q02','Q03','Q04','Q06','Q07','Q09']);assert.equal(scope.prior_deferred_question_dispositions.find(q=>q.question_id==='Q02').disposition,'DEFERRED WITHOUT BLOCKING RC');assert.ok(effectiveRequirements().every(r=>r.risk_levels.length===0));
});
test('mapping states terminate; all seven quarantines reject canonical projection',()=>{
 const mapping=validateMapping();assert.equal(mapping.mappings.filter(r=>r.state==='QUARANTINED LEGACY').length,7);for(const row of mapping.mappings){assert.ok(['CANONICAL','ALIAS','DEPRECATED','QUARANTINED LEGACY'].includes(row.state));if(['CANONICAL','ALIAS'].includes(row.state))assert.equal(resolveLabel(row.namespace,row.label),row.canonical_domain_ids[0]);else assert.throws(()=>resolveLabel(row.namespace,row.label));}
 assert.equal(resolveLabel('shs-oas-reporting-v1','Human Oversight'),'OAS-1-D06');assert.throws(()=>resolveLabel('shs-oas-reporting-v1','05'));
 for(const mutate of [m=>m.mappings.find(r=>r.state==='QUARANTINED LEGACY').canonical_domain_ids=['OAS-1-D01'],m=>m.mappings.find(r=>r.state==='QUARANTINED LEGACY').state='ALIAS',m=>m.mappings.pop()]){const m=structuredClone(mapping);mutate(m);assert.throws(()=>validateMapping(m));}
});
test('historical mapping preimage remains exact and current documentation is generated',()=>{
 const before=execFileSync('git',['show',`${baselineRevision}:docs/OAS_DOMAIN_MAPPING.md`],{cwd:root,encoding:'utf8'});assert.equal(readFileSync(path.join(root,'docs/history/OAS_DOMAIN_MAPPING.e1b6135.md'),'utf8'),before);const expected=generatedViews().get('docs/OAS_DOMAIN_MAPPING.md');assert.equal(readFileSync(path.join(root,'docs/OAS_DOMAIN_MAPPING.md'),'utf8'),expected);assert.match(expected,/QUARANTINED LEGACY/);
});
test('valid fully pinned declarations validate without producing conformance',()=>{
 const declaration=fixtureDeclaration();validateDeclaration(declaration,fixtureCatalog());assert.equal(declaration.evaluation_status,'NOT_EVALUATED');declaration.declaration_status='withdrawn';validateDeclaration(declaration,fixtureCatalog());
});
test('not-applicable requires reason; unknown or unavailable applicability cannot assert satisfaction',()=>{
 const d=fixtureDeclaration(),row=d.requirements[0];row.applicability='not_applicable';row.declaration_status='not_declared';row.applicability_reason='TEST ONLY excluded context';row.evidence_references=[];validateDeclaration(d,fixtureCatalog());row.applicability_reason=' ';assert.throws(()=>validateDeclaration(d,fixtureCatalog()));row.applicability='unknown';row.declaration_status='declared_satisfied';assert.throws(()=>validateDeclaration(d,fixtureCatalog()));
});
test('declarations reject missing/duplicate/deferred references and invented release pins or scores',()=>{
 for(const mutate of [d=>d.requirements.pop(),d=>d.requirements.push({...d.requirements[0],notes:'duplicate'}),d=>d.requirements[0].requirement_id='OAS-1-REQ-0011',d=>d.requirements[0].evidence_references=['test-fixture:missing'],d=>d.release_id='OAS-1@latest',d=>d.evaluation_status='PASS',d=>d.score=100]){const d=fixtureDeclaration();mutate(d);assert.throws(()=>validateDeclaration(d,fixtureCatalog()));}
 assert.throws(()=>validateDeclaration(fixtureDeclaration(),{standard_id:'OAS-1',release_id:'OAS-1@0.0.0-public-review.1',status:'public_review',requirement_ids:[]}));
});
test('RC format validates only exact scope membership, provenance fields and checksums',()=>{
 const rc=fixtureRc();validateRcContract(rc);for(const mutate of [r=>r.requirement_ids.push('OAS-1-REQ-0011'),r=>r.requirement_ids.pop(),r=>r.requirement_ids.push(r.requirement_ids[0]),r=>r.domain_ids.pop(),r=>r.source_revision='floating',r=>r.status='released',r=>r.standard_version='1.0.0',r=>r.effective_date='2026-10-27',r=>r.requirements_checksum='sha256:'+'0'.repeat(64),r=>r.artifact_checksum='sha256:'+'0'.repeat(64)]){const r=structuredClone(rc);mutate(r);assert.throws(()=>validateRcContract(r));}
});
test('founding procedure is explicit and actual acceptance cannot be invented by a green suite',()=>{
 const pending=loadAcceptance();assert.equal(pending.state,'AWAITING_REAL_MAINTAINER_ACCEPTANCE');assert.equal(pending.maintainer_reference,null);assert.equal(pending.authorize_rc1,false);assert.ok(acceptanceIssues().length>0);assert.throws(()=>assertRcReady(),/RC1 blocked/);
 const incomplete={...pending,state:'ACCEPTED'};assert.throws(()=>validateShape('founding-acceptance',incomplete));
 const fake={...pending,state:'ACCEPTED',maintainer_reference:'TEST ONLY synthetic actor',authority_evidence_reference:'test-fixture:authority',accepted_source_revision:baselineRevision,accepted_scope_checksum:scopeChecksum(),accepted_contract_checksums:contractChecksums(),accepted_at:'2026-10-27T00:00:00Z',decision_record_reference:'test-fixture:decision',authorize_rc1:true};assert.ok(acceptanceIssues(fake).some(r=>r.includes('does not pin')));assert.throws(()=>verifyCommittedContent(baselineRevision));
});
test('all technical gates pass; two failures share one real-acceptance blocker',()=>{
 const gates=readinessGates();assert.equal(gates.length,15);assert.equal(gates.filter(g=>g.result==='PASS').length,currentSourceRevision()?13:12);assert.deepEqual(gates.filter(g=>g.result==='FAIL').map(g=>g.gate),currentSourceRevision()?['founding_maintainer_acceptance','no_blocking_questions']:['founding_maintainer_acceptance','no_blocking_questions','source_revision_and_checksum']);
});
test('no RC or final release exists; historical public-review snapshot is immutable',()=>{
 const catalog=readSource();assert.equal(catalog.releases.length,1);assert.equal(catalog.releases[0].release_id,'OAS-1@0.0.0-public-review.1');assert.equal(catalog.releases[0].release_status,'public_review');assert.deepEqual(readdirSync(path.join(root,'public/oas/catalogs')),['OAS-1@0.0.0-public-review.1.json']);assert.equal(readFileSync(path.join(root,artifactPath),'utf8'),execFileSync('git',['show',`${baselineRevision}:${artifactPath}`],{cwd:root,encoding:'utf8'}));assert.equal(readFileSync(path.join(root,artifactPath),'utf8'),serialize(generateFromGit()));assert.equal(scope.rc_issued,false);assert.deepEqual(scope.rc_requirement_ids,[]);assert.equal(scope.final_release_id,null);
});
test('source and acceptance digests are separate, deterministic and independently computable',()=>{
 const a=manifest(),b=manifest();assert.deepEqual(a,b);assert.equal(a.source_checksum,digest(serialize(a.source_files)));assert.equal(a.acceptance_record_checksum,digest(serialize(loadAcceptance())));assert.equal(a.scope_checksum,scopeChecksum());assert.ok(!inputPaths.includes('standards/oas/closure/founding-acceptance.json'));const {artifact_checksum,...payload}=a;assert.equal(artifact_checksum,digest(serialize(payload)));for(const file of a.source_files)assert.equal(file.checksum,digest(readFileSync(path.join(root,file.path))));assert.equal(a.rc_checksum,null);assert.equal(a.rc_source_revision,null);
});
test('all human views and effective catalog reproduce from the single pinned source/resolution',()=>{
 const a=generatedViews(),b=generatedViews();assert.deepEqual([...a],[...b]);for(const [file,content]of a)assert.equal(readFileSync(path.join(root,file),'utf8'),content,file);const projected=JSON.parse(a.get('evidence/oas-governance-resolution/SCOPE_CATALOG.json'));assert.equal(projected.release_id,null);assert.deepEqual(projected.requirement_ids,scope.included_requirement_ids);assert.equal(projected.requirements.length,14);
});
