import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {generateRc,publicationLock,validateIssuedRc,assertImmutable,checkRelease,verifyHumanDecision,releasePath,lockPath,historicalPending,gitRead,preparationViews} from '../scripts/oas-rc1-release.mjs';
import {loadAcceptance,effectiveRequirements,readinessGates,validateDeclaration,manifest} from '../scripts/oas-scope-closure.mjs';
import {verifyBindings,acceptanceRequest,requestPath,expectedMembership,validateAcceptanceCandidate} from '../scripts/oas-rc1-acceptance.mjs';
import {serialize,digest} from '../scripts/oas-catalog.mjs';
const independentHash=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const rehash=rc=>{const {artifact_checksum,...payload}=rc;return {...payload,artifact_checksum:independentHash(JSON.stringify(payload,null,2)+'\n')};};

test('human acceptance is independently retrievable from its exact committed decision and designation',()=>{
 const {record,bindings}=verifyHumanDecision();assert.equal(record.maintainer_reference,'Mike Slate');assert.equal(record.accepted_source_revision,'517cc23426e7485c352a1672c8fe4614291d552a');assert.equal(record.authorize_rc1,true);assert.equal(record.authorize_final_release,false);assert.equal(record.authority_evidence_reference,'f1060153361ef635c8d26fae91d8a33f031faf31:docs/OAS_FOUNDING_MAINTAINER_DESIGNATION.md');assert.equal(JSON.parse(readFileSync(requestPath,'utf8')).request_checksum,'sha256:88364ed78cb96c247359c0c55ebd6fe26e0367f78b8c84b93dd137d508296012');assert.equal(readFileSync(requestPath,'utf8'),serialize(acceptanceRequest()));assert.equal(bindings.requirement_ids.length,14);assert.ok(Date.parse(record.accepted_at));assert.equal(readinessGates().filter(g=>g.result==='PASS').length,15);
});
test('pending, fabricated designation, actor, time or decision references cannot enter issuance',()=>{
 assert.throws(()=>verifyHumanDecision(historicalPending()),/not been recorded/);
 for(const mutate of [r=>r.maintainer_reference='Synthetic actor',r=>r.authority_evidence_reference='test-fixture:designation',r=>r.decision_record_reference='test-fixture:decision',r=>r.accepted_at='2020-01-01T00:00:00Z',r=>r.authorize_rc1=false,r=>r.authorize_final_release=true]){const record=structuredClone(loadAcceptance());mutate(record);assert.throws(()=>verifyHumanDecision(record));}
 const before=serialize(loadAcceptance());Object.assign(process.env,{GIT_AUTHOR_NAME:'Synthetic actor',GITHUB_ACTOR:'Synthetic actor',GITHUB_REPOSITORY_OWNER:'Synthetic actor'});verifyHumanDecision();assert.equal(serialize(loadAcceptance()),before);
});
test('RC1 schema, all exact IDs, eight domains and deterministic bytes agree with accepted source',()=>{
 const rc=checkRelease(),bindings=verifyBindings();assert.equal(serialize(generateRc()),serialize(generateRc()));assert.equal(readFileSync(releasePath,'utf8'),serialize(rc));assert.deepEqual(rc.requirement_ids,expectedMembership);assert.deepEqual(rc.domain_ids,bindings.domain_ids);assert.equal(rc.domain_ids.length,8);assert.equal(rc.source_revision,bindings.prepared_source_revision);assert.equal(rc.source_checksum,manifest().source_checksum);assert.equal(rc.scope_checksum,bindings.scope_checksum);assert.equal(rc.requirements_checksum,bindings.requirements_checksum);assert.equal(rc.status,'release_candidate');assert.equal(rc.effective_date,null);assert.equal(rc.candidate_date,loadAcceptance().accepted_at.slice(0,10));assert.equal(rc.declaration_schema_id,'urn:oas:schema:closure:declaration:1');
});
test('even rehashed membership, wording/source, date, decision or adoption changes fail the publication lock',()=>{
 const original=checkRelease(),lock=JSON.parse(readFileSync(lockPath,'utf8'));
 for(const mutate of [r=>r.requirement_ids.pop(),r=>r.requirement_ids.push('OAS-1-REQ-0011'),r=>r.requirement_ids.reverse(),r=>r.domain_ids.pop(),r=>r.source_revision='0'.repeat(40),r=>r.source_checksum='sha256:'+'0'.repeat(64),r=>r.requirements_checksum='sha256:'+'0'.repeat(64),r=>r.candidate_date='2020-01-01',r=>r.governance_decision_reference='test-fixture:decision',r=>r.effective_date='2026-10-27',r=>r.status='released',r=>r.standard_version='1.0.0',r=>r.profiles=['invented']]){const bad=structuredClone(original);mutate(bad);assert.throws(()=>validateIssuedRc(rehash(bad),lock));}
 const bad=structuredClone(lock);bad.requirement_ids.pop();assert.throws(()=>validateIssuedRc(original,bad));
 assertImmutable(undefined,serialize(original));assertImmutable(serialize(original),serialize(original));assert.throws(()=>assertImmutable(serialize(original),serialize(rehash({...original,candidate_date:'2020-01-01'}))),/immutable/);
});
test('independent checksum computation verifies full artifact, payload, source manifest, acceptance and requirements',()=>{
 const bytes=readFileSync(releasePath),rc=JSON.parse(bytes),lock=JSON.parse(readFileSync(lockPath,'utf8')),{artifact_checksum,...payload}=rc;
 assert.equal(artifact_checksum,independentHash(JSON.stringify(payload,null,2)+'\n'));assert.equal(lock.artifact_file_checksum,independentHash(bytes));assert.equal(lock.acceptance_record_checksum,independentHash(readFileSync('standards/oas/closure/founding-acceptance.json')));assert.equal(rc.requirements_checksum,independentHash(readFileSync('evidence/oas-rc1-issuance/RC1_REQUIREMENTS.json')));
 const source=JSON.parse(readFileSync('evidence/oas-rc1-issuance/RC1_SOURCE_MANIFEST.json','utf8'));assert.equal(rc.source_checksum,independentHash(JSON.stringify(source.source_files,null,2)+'\n'));for(const file of source.source_files)assert.equal(file.checksum,independentHash(execFileSync('git',['show',`${rc.source_revision}:${file.path}`])));assert.equal(source.acceptance_record_checksum,lock.acceptance_record_checksum);assert.equal(source.rc_issued,true);assert.equal(source.rc_source_revision,rc.source_revision);assert.equal(source.rc_checksum,rc.artifact_checksum);const {artifact_checksum:sourceArtifactChecksum,...sourcePayload}=source;assert.equal(sourceArtifactChecksum,independentHash(JSON.stringify(sourcePayload,null,2)+'\n'));
});
test('real RC1 declarations resolve only pinned members and cannot create evaluation, profiles or certification',()=>{
 const rc=checkRelease();const declaration={schema_version:'1.1.0',standard_id:'OAS-1',release_id:rc.release_id,profile_reference:null,declaration_scope:'TEST ONLY; no actual provider declaration',declarant:{identity_reference:'test-fixture:provider',reference_kind:'provider_supplied'},declared_at:loadAcceptance().accepted_at,declaration_status:'declared',requirements:rc.requirement_ids.map(requirement_id=>({requirement_id,applicability:'unknown',applicability_reason:'',declaration_status:'unknown',evidence_references:[],notes:'TEST ONLY'})),evidence_references:[],notes:'TEST ONLY schema validation',evaluation_status:'NOT_EVALUATED'};
 validateDeclaration(declaration,rc);for(const mutate of [d=>d.profile_reference='invented',d=>d.evaluation_status='PASS',d=>d.certified=true,d=>d.requirements.pop(),d=>d.requirements[0].requirement_id='OAS-1-REQ-0011',d=>d.requirements[0].declaration_status='declared_satisfied']){const bad=structuredClone(declaration);mutate(bad);assert.throws(()=>validateDeclaration(bad,rc));}
 const lock=publicationLock(rc);assert.deepEqual(lock.profiles,[]);assert.equal(lock.evaluation_status,'NOT_EVALUATED');assert.equal(lock.final_adoption_status,'NOT ADOPTED');assert.equal(lock.authorize_final_release,false);
});
test('historical public review and all accepted source documents remain unchanged; no final exists',()=>{
 assert.deepEqual(readdirSync('public/oas/catalogs').sort(),['OAS-1@0.0.0-public-review.1.json','OAS-1@1.0.0-rc.1.json']);const file='public/oas/catalogs/OAS-1@0.0.0-public-review.1.json';assert.equal(readFileSync(file,'utf8'),gitRead('356f757',file));for(const [file,bytes]of preparationViews())assert.equal(readFileSync(file,'utf8'),bytes);for(const item of effectiveRequirements())assert.ok(!['OAS-1-REQ-0011','OAS-1-REQ-0013','OAS-1-REQ-0015'].includes(item.requirement_id));
});
