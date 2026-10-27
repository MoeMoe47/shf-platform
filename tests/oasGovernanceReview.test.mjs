import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { baselineCommit, loadDecisions, validateDecisions, dispositionCounts, proposedMembership, validateMembership, rcGates, assertRcIssuable, governanceViews, sourceManifest, governanceInputPaths } from '../scripts/oas-governance-review.mjs';
import { loadReview, loadMappings, validateReview, validateMappings, resolveDomainLabel } from '../scripts/oas-first-release.mjs';
import { root, readSource, digest, serialize, artifactPath, generateFromGit, inputPaths } from '../scripts/oas-catalog.mjs';
const decisions = loadDecisions(), authoring = loadReview();
const fresh = () => structuredClone(decisions);
const original = JSON.parse(execFileSync('git',['show',`${baselineCommit}:standards/oas/authoring/first-release.json`],{cwd:root,encoding:'utf8'}));

test('all 17 candidates have exactly one explicit disposition and ten criterion findings',()=>{
  validateDecisions(decisions);
  assert.equal(decisions.requirements.length,17);
  assert.deepEqual(decisions.requirements.map(r=>r.requirement_id),original.requirements.map(r=>r.requirement_id));
  assert.deepEqual(dispositionCounts(),{APPROVE:6,'APPROVE WITH REVISION':3,HOLD:8,REJECT:0});
  for(const r of decisions.requirements) assert.equal(Object.keys(r.criteria).length,10);
  const matrix=readFileSync(path.join(root,'evidence/oas-governance-review/REQUIREMENT_DECISION_MATRIX.md'),'utf8');
  assert.equal(matrix.split('\n').filter(line=>line.startsWith('| OAS-1-REQ-')).length,17);
});
test('missing, duplicate and unknown dispositions reject',()=>{
  for(const mutate of [d=>d.requirements.pop(),d=>d.requirements.push({...d.requirements[0],reason:'Another reason'}),d=>d.requirements[0].requirement_id='OAS-1-REQ-9999',d=>d.requirements[0].decision='AUTO_APPROVE']){const d=fresh();mutate(d);assert.throws(()=>validateDecisions(d));}
});
test('content-approved rows have complete canonical normative metadata',()=>{
  validateReview(authoring);
  for(const id of proposedMembership()){
    const r=authoring.requirements.find(r=>r.requirement_id===id);
    for(const field of ['title','normative_text','domain_id','applicability','rationale','verification_notes'])assert.ok(r[field].trim());
    assert.ok(r.evidence_expectations.length>0&&r.sources.length>0);
    assert.equal(r.status,'candidate');assert.equal(r.review_decision,null);
  }
});
test('proposed membership is deterministic, unique and excludes held/rejected/revision-pending requirements',()=>{
  const ids=proposedMembership();assert.deepEqual(ids,['OAS-1-REQ-0003','OAS-1-REQ-0004','OAS-1-REQ-0006','OAS-1-REQ-0008','OAS-1-REQ-0009','OAS-1-REQ-0014']);assert.deepEqual(proposedMembership(),ids);validateMembership(ids);
  for(const row of decisions.requirements.filter(r=>r.decision!=='APPROVE'))assert.throws(()=>validateMembership([row.requirement_id]),/cannot enter RC/);
  const d=fresh();d.requirements.find(r=>r.requirement_id===ids[0]).decision='REJECT';assert.throws(()=>validateMembership([ids[0]],d),/cannot enter RC/);
  assert.throws(()=>validateMembership([ids[0],ids[0]]),/Duplicate/);assert.throws(()=>validateMembership(['OAS-1-REQ-9999']));
});
test('no ID changes or reuse and exact editorial deltas are recorded',()=>{
  assert.deepEqual(authoring.requirements.map(r=>r.requirement_id),original.requirements.map(r=>r.requirement_id));
  assert.deepEqual(decisions.revisions.map(r=>r.requirement_id),['OAS-1-REQ-0001','OAS-1-REQ-0005','OAS-1-REQ-0017']);
  for(const revision of decisions.revisions){assert.equal(revision.material_normative_change,false);assert.equal(revision.reapproval_required,true);assert.ok(revision.changes.length);}
  for(const mutate of [a=>a.requirements[0].domain_id='OAS-1-D02',a=>a.requirements[0].requirement_id='OAS-1-REQ-9999',a=>a.requirements[0].normative_text+=' A materially new duty.',a=>a.requirements[1].title='Reused for a different purpose']){const a=structuredClone(authoring);mutate(a);assert.throws(()=>validateDecisions(decisions,a));}
});
test('stale wording/metadata and incomplete revision evidence reject',()=>{
  for(const mutate of [d=>d.requirements[0].reviewed_record_checksum='sha256:'+'0'.repeat(64),d=>d.revisions[0].changes.pop(),d=>d.revisions[0].material_normative_change=true,d=>d.requirements[0].decision='APPROVE']){const d=fresh();mutate(d);assert.throws(()=>validateDecisions(d));}
});
test('all twelve questions have one disposition; deferred is not silently resolved',()=>{
  assert.deepEqual(decisions.questions.filter(q=>q.classification==='RESOLVED').map(q=>q.question_id),[]);
  assert.deepEqual(decisions.questions.filter(q=>q.classification==='DEFERRED').map(q=>q.question_id),['Q02','Q03','Q04','Q06','Q07','Q09']);
  assert.deepEqual(decisions.questions.filter(q=>q.classification==='BLOCKING').map(q=>q.question_id),['Q01','Q05','Q08','Q10','Q11','Q12']);
  for(const q of decisions.questions)assert.equal(authoring.open_questions.find(a=>a.question_id===q.question_id).status,q.classification==='RESOLVED'?'resolved':'open');
  const d=fresh();d.questions[0].classification='RESOLVED';assert.throws(()=>validateDecisions(d));
  const missing=fresh();missing.questions.pop();assert.throws(()=>validateDecisions(missing));
  const altered=fresh();altered.questions.find(q=>q.question_id==='Q03').source_changes=[{field:'status',before:'open',after:'resolved'}];assert.throws(()=>validateDecisions(altered));
});
test('seven mapping holds preserve deterministic canonical labels and never become aliases',()=>{
  const mapping=loadMappings();validateMappings(mapping);assert.equal(decisions.domain_mapping_decisions.length,7);
  assert.equal(decisions.domain_mapping_decisions.filter(m=>m.decision==='AMBIGUOUS — HOLD').length,5);
  assert.equal(decisions.domain_mapping_decisions.filter(m=>m.decision==='UNMAPPED — HOLD').length,2);
  for(const m of decisions.domain_mapping_decisions){assert.deepEqual(m.canonical_domain_ids,[]);assert.throws(()=>resolveDomainLabel(m.namespace,m.label));}
  assert.equal(resolveDomainLabel('shs-oas-reporting-v1','Human Oversight'),'OAS-1-D06');
  const d=fresh();d.domain_mapping_decisions[0].canonical_domain_ids=['OAS-1-D01'];assert.throws(()=>validateDecisions(d));
  const falseApproval=fresh();falseApproval.domain_mapping_decisions[0].decision='ALIAS APPROVED';assert.throws(()=>validateDecisions(falseApproval));
});
test('no institutional approval is fabricated or inferred from a content disposition',()=>{
  assert.equal(decisions.institutional_authorization,null);assert.ok(authoring.requirements.every(r=>r.review_decision===null&&r.status==='candidate'));
  const d=fresh();d.institutional_authorization={approved_by:'invented'};assert.throws(()=>validateDecisions(d));
  const eligible=fresh();eligible.requirements[2].release_eligible=true;assert.throws(()=>validateDecisions(eligible));
});
test('RC gates fail and no RC artifact, source revision, checksum or membership exists',()=>{
  assert.throws(()=>assertRcIssuable(),/RC not ready/);
  assert.equal(rcGates().filter(g=>g.status==='PASS').length,5);assert.equal(rcGates().filter(g=>g.status==='FAIL').length,5);
  assert.equal(decisions.rc_issued,false);assert.equal(decisions.rc_release_id,null);assert.equal(decisions.rc_source_revision,null);assert.equal(decisions.rc_checksum,null);assert.deepEqual(decisions.rc_requirement_ids,[]);
  for(const mutate of [d=>d.rc_issued=true,d=>d.rc_release_id='OAS-1@1.0.0-rc.1',d=>d.rc_requirement_ids=proposedMembership(),d=>d.adopted_release_id='OAS-1@1.0.0']){const d=fresh();mutate(d);assert.throws(()=>validateDecisions(d));}
});
test('no released status or 1.0.0 publication and historical public-review pin preserved',()=>{
  const catalog=readSource();assert.equal(catalog.releases.length,1);assert.equal(catalog.releases[0].release_id,'OAS-1@0.0.0-public-review.1');assert.equal(catalog.releases[0].release_status,'public_review');assert.deepEqual(catalog.requirements,[]);
  assert.deepEqual(readdirSync(path.join(root,'public/oas/catalogs')),['OAS-1@0.0.0-public-review.1.json']);
  for(const file of [...inputPaths,artifactPath,'standards/oas/authoring/domain-mapping.json','docs/OAS_DOMAIN_MAPPING.md','apps/shs-api/src/domain/reporting/studio-oas-report-adapters.ts'])assert.equal(readFileSync(path.join(root,file),'utf8'),execFileSync('git',['show',`${baselineCommit}:${file}`],{cwd:root,encoding:'utf8'}),file);
  assert.equal(readFileSync(path.join(root,artifactPath),'utf8'),serialize(generateFromGit()));
  execFileSync('git',['merge-base','--is-ancestor',baselineCommit,'HEAD'],{cwd:root});
});
test('review manifest and generated decision records reproduce; no invented RC checksum',()=>{
  const a=sourceManifest(),b=sourceManifest();assert.deepEqual(a,b);assert.equal(a.rc_checksum,null);assert.equal(a.rc_source_revision,null);assert.equal(a.source_revision,null);assert.equal(a.reviewed_baseline_revision,baselineCommit);
  assert.deepEqual(a.source_files.map(f=>f.path),governanceInputPaths);assert.equal(a.source_checksum,digest(serialize(a.source_files)));
  const {review_checksum,...payload}=a;assert.equal(review_checksum,digest(serialize(payload)));
  for(const file of a.source_files)assert.equal(file.checksum,digest(readFileSync(path.join(root,file.path))));
  const views=governanceViews();assert.deepEqual([...views],[...governanceViews()]);for(const [file,content]of views){assert.ok(existsSync(path.join(root,file)));assert.equal(readFileSync(path.join(root,file),'utf8'),content,file);}
});
