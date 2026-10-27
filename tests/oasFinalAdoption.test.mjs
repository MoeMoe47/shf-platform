import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {verifyPreparedBindings,loadAdoption,validateAdoption,recordPath,humanDecisionPath,preparationRevision} from '../scripts/oas-final-adoption.mjs';
const serialize=v=>JSON.stringify(v,null,2)+'\n';
const hash=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const rehash=r=>{const {record_checksum,...payload}=r;return {...payload,record_checksum:hash(serialize(payload))};};

test('real human adoption is recorded separately from withheld publication',()=>{
 const r=loadAdoption(),state=validateAdoption();assert.equal(state.final_adoption_status,'ADOPTED');assert.equal(state.publication_status,'NOT PUBLISHED');assert.equal(state.publication_authorized,false);assert.equal(state.adopting_maintainer,'Mike Slate');assert.equal(r.authorized,true);assert.equal(r.publication_authorized,false);assert.equal(r.published,false);assert.equal(r.decision_timestamp,'2026-10-27T17:28:48.081Z');assert.equal(state.software_authenticates_human_identity_or_consent,false);
});
test('every explicit final binding and complete prepared package remains exact',()=>{
 const {bound,target}=verifyPreparedBindings(),r=loadAdoption();assert.equal(r.prepared_package_revision,preparationRevision);assert.equal(r.source_revision,'6f145192af25c929c95181fd6cd38f32d7b5ace9');assert.equal(r.final_artifact_checksum,'sha256:9ca2b2b9cc17acd419e9961387e65d0ca3de33fde557d5440f96856dc186892e');assert.equal(r.requirements_checksum,'sha256:37c09a8f92666b10d157d267e480296d9aa614c3299e10060aaa7b414ea50e5d');assert.equal(r.scope_checksum,'sha256:14be68339c76888fa1cac497564b6abd427352688ff68c531e8f46b61972d3c4');assert.deepEqual(r.requirement_ids,target.requirement_ids);assert.equal(r.requirement_ids.length,14);assert.equal(r.domain_ids.length,8);assert.deepEqual(r.profiles,[]);assert.equal(r.release_date,'2026-10-27');assert.equal(r.effective_date,'2026-10-27');assert.equal(r.declaration_contract_version,'1.1.0');assert.equal(r.evaluation_status,'NOT_EVALUATED');assert.deepEqual(r.schema_checksums,bound.schema_checksums);
});
test('even rehashed actor, time, authority, source/content, approval and publication mutations reject',()=>{
 for(const mutate of [r=>r.human_actor_reference='Synthetic actor',r=>r.decision_timestamp='2020-01-01T00:00:00Z',r=>r.authority_evidence_reference='test-fixture:designation',r=>r.immutable_decision_reference=preparationRevision+':docs/OAS_FINAL_ADOPTION_DECISION.md',r=>r.human_statement+=' invented',r=>r.source_revision='0'.repeat(40),r=>r.final_artifact_checksum='sha256:'+'0'.repeat(64),r=>r.requirements_checksum='sha256:'+'0'.repeat(64),r=>r.scope_checksum='sha256:'+'0'.repeat(64),r=>r.schema_checksums={},r=>r.requirement_ids[0]='OAS-1-REQ-0011',r=>r.domain_ids.reverse(),r=>r.release_date='2026-10-28',r=>r.profiles.push('invented'),r=>r.evaluation_status='PASS',r=>r.authorized=false,r=>r.publication_authorized=true,r=>r.published=true,r=>r.certified=true]){const r=structuredClone(loadAdoption());mutate(r);assert.throws(()=>validateAdoption(rehash(r)));}
});
test('unsigned templates and Git actor metadata cannot fabricate a final adoption',()=>{
 const template=JSON.parse(readFileSync('standards/oas/governance/final-1.0.0/final-adoption.template.json','utf8'));assert.equal(template.authorized,false);assert.equal(template.human_actor_reference,null);assert.throws(()=>validateAdoption(template));Object.assign(process.env,{GIT_AUTHOR_NAME:'Untrusted actor',GIT_COMMITTER_NAME:'Untrusted actor',GITHUB_ACTOR:'Untrusted actor'});assert.equal(validateAdoption().adopting_maintainer,'Mike Slate');
});
test('decision is immutable and attributable; canonical JSON checksum is independently reproducible',()=>{
 const r=loadAdoption(),[revision,...file]=r.immutable_decision_reference.split(':');assert.equal(file.join(':'),humanDecisionPath);const bytes=execFileSync('git',['show',r.immutable_decision_reference]);assert.deepEqual(bytes,readFileSync(humanDecisionPath));assert.match(bytes.toString(),/explicitly adopt/);assert.match(bytes.toString(),/Do NOT publish/);const {record_checksum,...payload}=r;assert.equal(record_checksum,hash(serialize(payload)));assert.equal(readFileSync(recordPath,'utf8'),serialize(r));execFileSync('git',['merge-base','--is-ancestor',revision,'HEAD']);
});
test('adoption leaves original pending preparation snapshots and issued/historical bytes unchanged',()=>{
 for(const file of ['standards/oas/governance/final-1.0.0/inputs.json','standards/oas/governance/final-1.0.0/bindings.json','standards/oas/governance/final-1.0.0/artifact-target.json','public/oas/catalogs/OAS-1@1.0.0-rc.1.json','public/oas/catalogs/OAS-1@0.0.0-public-review.1.json'])assert.deepEqual(readFileSync(file),execFileSync('git',['show',preparationRevision+':'+file]));assert.equal(existsSync('public/oas/catalogs/OAS-1@1.0.0.json'),false);assert.equal(existsSync('standards/oas/governance/final-1.0.0/publication-authorization.json'),false);
});
