import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {checkpoint,preparedRevision,expectedPath,requestPath,expectedMembership,verifyBindings,validateAcceptanceCandidate,acceptanceState,requireRealAcceptance,acceptanceRequest,acceptanceStatement,generatedPackage,supportingPaths} from '../scripts/oas-rc1-acceptance.mjs';
import {loadScope,loadAcceptance,inputPaths as preparedInputs} from '../scripts/oas-scope-closure.mjs';
import {root,serialize,digest,readSource,artifactPath} from '../scripts/oas-catalog.mjs';
import {historicalPending,gitRead,preparationCheckpoint,releasePath,checkRelease} from '../scripts/oas-rc1-release.mjs';
const bindings=verifyBindings();
const expected=JSON.parse(readFileSync(path.join(root,expectedPath),'utf8'));
const syntheticRecord=()=>({...loadAcceptance(),state:'ACCEPTED',maintainer_reference:'TEST ONLY synthetic reviewer, no actual consent',authority_evidence_reference:'test-fixture:designation',accepted_source_revision:preparedRevision,accepted_scope_checksum:bindings.scope_checksum,accepted_contract_checksums:structuredClone(bindings.contract_checksums),accepted_at:'2026-10-27T00:00:00Z',decision_record_reference:'test-fixture:decision',authorize_rc1:true,authorize_final_release:false});

test('original bindings remain exact and prepared source commits every intended artifact',()=>{
 assert.equal(readFileSync(path.join(root,expectedPath),'utf8'),execFileSync('git',['show',`${checkpoint}:${expectedPath}`],{cwd:root,encoding:'utf8'}));assert.equal(bindings.prepared_source_revision,preparedRevision);assert.equal(bindings.scope_checksum,'sha256:14be68339c76888fa1cac497564b6abd427352688ff68c531e8f46b61972d3c4');assert.deepEqual(bindings.supporting_artifacts.map(r=>r.path),supportingPaths);for(const file of bindings.supporting_artifacts){const bytes=execFileSync('git',['show',`${preparedRevision}:${file.path}`],{cwd:root});assert.equal(file.checksum,digest(bytes));assert.equal(file.checksum,digest(readFileSync(path.join(root,file.path))));}
});
test('exact fourteen IDs and all eight domains are independently fixed',()=>{
 assert.deepEqual(bindings.requirement_ids,expectedMembership);assert.equal(new Set(bindings.requirement_ids).size,14);assert.deepEqual(bindings.domain_ids,['OAS-1-D01','OAS-1-D02','OAS-1-D03','OAS-1-D04','OAS-1-D05','OAS-1-D06','OAS-1-D07','OAS-1-D08']);for(const id of ['OAS-1-REQ-0011','OAS-1-REQ-0013','OAS-1-REQ-0015'])assert.ok(!bindings.requirement_ids.includes(id));assert.deepEqual(bindings.profiles,[]);
});
test('wrong revision, changed digest or altered membership cannot silently regenerate bindings',()=>{
 for(const mutate of [b=>b.required_source_revision=checkpoint,b=>b.scope_checksum='sha256:'+'0'.repeat(64),b=>b.contract_checksums['docs/OAS_GOVERNANCE_AUTHORITY.md']='sha256:'+'0'.repeat(64)]){const b=structuredClone(expected);mutate(b);assert.throws(()=>verifyBindings(b));}
 for(const mutate of [s=>s.included_requirement_ids.pop(),s=>s.included_requirement_ids.push('OAS-1-REQ-0011'),s=>s.included_requirement_ids[0]='OAS-1-REQ-0018']){const s=structuredClone(loadScope());mutate(s);assert.throws(()=>verifyBindings(expected,s));}
});
test('historical pending record grants no authority; current human acceptance is separate',()=>{
 const pending=historicalPending(),state=acceptanceState(pending);assert.equal(state.state,'AWAITING_REAL_MAINTAINER_ACCEPTANCE');assert.equal(state.acceptance_recorded,false);assert.equal(state.maintainer_reference,null);assert.equal(state.authority_evidence_reference,null);assert.equal(state.accepted_at,null);assert.equal(state.decision_record_reference,null);assert.equal(state.authorize_rc1,false);assert.equal(state.authorize_final_release,false);assert.throws(()=>validateAcceptanceCandidate(pending),/not been recorded/);assert.equal(serialize(pending),execFileSync('git',['show',`${checkpoint}:standards/oas/closure/founding-acceptance.json`],{cwd:root,encoding:'utf8'}));assert.equal(acceptanceState().maintainer_reference,'Mike Slate');requireRealAcceptance();
});
test('synthetic positive acceptance validates structure without claiming real authority or consent',()=>{
 const result=validateAcceptanceCandidate(syntheticRecord(),bindings);assert.equal(result.structural_bindings_valid,true);assert.equal(result.authority_and_consent_verified_by_software,false);assert.equal(result.final_adoption_status,'NOT ADOPTED');assert.equal(acceptanceState(historicalPending()).acceptance_recorded,false);assert.notEqual(loadAcceptance().maintainer_reference,syntheticRecord().maintainer_reference);
});
test('acceptance validation rejects stale source, wrong scope/digests, blanks and final-adoption claims',()=>{
 for(const mutate of [r=>r.accepted_source_revision=checkpoint,r=>r.accepted_scope_checksum='sha256:'+'0'.repeat(64),r=>r.accepted_contract_checksums={},r=>r.maintainer_reference=' ',r=>r.authority_evidence_reference=null,r=>r.accepted_at='not-a-date',r=>r.authorize_rc1=false,r=>r.authorize_final_release=true,r=>r.final_adoption_status='ADOPTED']){const record=syntheticRecord();mutate(record);assert.throws(()=>validateAcceptanceCandidate(record,bindings));}
 const b=structuredClone(bindings);b.requirement_ids.push('OAS-1-REQ-0011');assert.throws(()=>validateAcceptanceCandidate(syntheticRecord(),b));
});
test('the exact maintainer statement binds full membership, original request and validation-only issuance',()=>{
 const request=acceptanceRequest(),statement=acceptanceStatement(request);assert.match(statement,/<REAL MAINTAINER REFERENCE>/);assert.match(statement,/<AUTHORITY EVIDENCE REFERENCE>/);assert.match(statement,/<ACTUAL UTC TIMESTAMP>/);assert.match(statement,/<DECISION RECORD REFERENCE>/);assert.ok(statement.includes(preparedRevision)&&statement.includes(request.request_checksum)&&statement.includes(bindings.scope_checksum));assert.match(statement,/do not adopt or authorize publication of final OAS-1@1\.0\.0/);assert.equal(request.acceptance_recorded,false);assert.equal(request.rc_issued,false);assert.equal(request.final_adoption_status,'NOT ADOPTED');
});
test('request/checksums and all package views reproduce deterministically',()=>{
 const a=acceptanceRequest(),b=acceptanceRequest();assert.deepEqual(a,b);const {request_checksum,...payload}=a;assert.equal(request_checksum,digest(serialize(payload)));const views=generatedPackage(historicalPending());assert.deepEqual([...views],[...generatedPackage(historicalPending())]);for(const [file,content]of views)assert.equal(gitRead(preparationCheckpoint,file),content,file);assert.throws(()=>generatedPackage(),/must not overwrite/);checkRelease();assert.equal(readFileSync(path.join(root,requestPath),'utf8'),serialize(a));
});
test('RC1 is separate from unchanged preparation/history; no final artifact exists',()=>{
 assert.deepEqual(readdirSync(path.join(root,'public/oas/catalogs')).sort(),['OAS-1@0.0.0-public-review.1.json','OAS-1@1.0.0-rc.1.json']);assert.equal(checkRelease().release_id,'OAS-1@1.0.0-rc.1');const catalog=readSource();assert.equal(catalog.releases.length,1);assert.equal(catalog.releases[0].release_status,'public_review');assert.equal(readFileSync(path.join(root,artifactPath),'utf8'),execFileSync('git',['show',`${checkpoint}:${artifactPath}`],{cwd:root,encoding:'utf8'}));for(const file of preparedInputs)assert.equal(readFileSync(path.join(root,file),'utf8'),execFileSync('git',['show',`${preparedRevision}:${file}`],{cwd:root,encoding:'utf8'}));assert.equal(bindings.declaration_contract_version,'1.1.0');execFileSync('git',['merge-base','--is-ancestor',checkpoint,'HEAD'],{cwd:root});
});
