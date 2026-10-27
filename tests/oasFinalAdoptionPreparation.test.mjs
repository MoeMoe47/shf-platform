import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {deriveProposal,materializeFinalTarget,normativeProjection,bindings,sourceSnapshot,validateDates,validateProposal,gates,check,previewPath,finalPublicPath,marking} from '../scripts/oas-final-adoption-preparation.mjs';
import {effectiveRequirements,validateDeclaration} from '../scripts/oas-scope-closure.mjs';
import {serialize,digest} from '../scripts/oas-catalog.mjs';
const hash=value=>'sha256:'+createHash('sha256').update(value).digest('hex');
const snapshot=sourceSnapshot();
const fixtureConfig=()=>({...JSON.parse(readFileSync('standards/oas/governance/final-1.0.0/inputs.json','utf8')),release_date:'2030-01-02',effective_date:'2030-01-03'});
const rehash=p=>{const {artifact_checksum,...body}=p;return {...body,artifact_checksum:hash(JSON.stringify(body,null,2)+'\n')};};

test('staged proposal is deterministic, clearly marked and unadopted, without a public final artifact',()=>{
 const a=deriveProposal(snapshot),b=deriveProposal(snapshot);assert.deepEqual(a,b);assert.equal(a.marking,marking);assert.equal(a.status,'proposed');assert.equal(a.adoption_decision,null);assert.equal(a.publication_authorization,null);assert.equal(existsSync(finalPublicPath),false);assert.deepEqual(a.profiles,[]);assert.equal(a.evaluation_status,'NOT_EVALUATED');assert.equal(a.declaration_contract_version,'1.1.0');
});
test('exact 14 IDs, all eight domains and original normative text are retained',()=>{
 const p=deriveProposal(snapshot);const ids=[1,2,3,4,5,6,7,8,9,10,12,14,16,17].map(n=>'OAS-1-REQ-'+String(n).padStart(4,'0'));assert.deepEqual(p.requirement_ids,ids);assert.deepEqual(p.domain_ids,[1,2,3,4,5,6,7,8].map(n=>'OAS-1-D0'+n));assert.deepEqual(normativeProjection(p.requirements),normativeProjection(effectiveRequirements()));assert.equal(p.rc1_requirements_checksum,'sha256:ac3e5aa8086552547b8b36c38c2826733585b9458f53584aa2ba0550643a1929');
});
test('human dates cannot be guessed, invalid or precede release; fixture dates are only synthetic',()=>{
 assert.throws(()=>validateDates(null,null,true),/Human/);assert.throws(()=>validateDates('2030-02-30','2030-03-01'),/Invalid/);assert.throws(()=>validateDates('2030-01-03','2030-01-02'),/precede/);validateDates('2030-01-02','2030-01-02',true);
 const p=deriveProposal(snapshot),config=JSON.parse(readFileSync('standards/oas/governance/final-1.0.0/inputs.json','utf8'));
 if(config.release_date===null||config.effective_date===null){assert.throws(()=>materializeFinalTarget(p),/Human/);assert.equal(bindings(p,snapshot).date_specific_final_artifact_file_checksum,null);}
});
test('date-completed synthetic target validates existing final release/requirement primitives',()=>{
 const p=deriveProposal(snapshot,fixtureConfig()),a=materializeFinalTarget(p),b=materializeFinalTarget(p);assert.deepEqual(a,b);assert.equal(a.release.release_date,'2030-01-02');assert.equal(a.release.effective_date,'2030-01-03');assert.equal(a.status,'released');assert.ok(a.requirements.every(r=>r.status==='active'));assert.deepEqual(normativeProjection(a.requirements),normativeProjection(effectiveRequirements()));assert.equal(a.evaluation_status,'NOT_EVALUATED');assert.deepEqual(a.profiles,[]);assert.equal(existsSync(finalPublicPath),false);
});
test('even rehashed membership, wording, profiles, authority or scope changes cannot materialize',()=>{
 const p=deriveProposal(snapshot,fixtureConfig());for(const mutate of [v=>v.requirement_ids[0]='OAS-1-REQ-0011',v=>v.requirements[0].normative_text+=' changed',v=>v.domain_ids.reverse(),v=>v.profiles.push('invented'),v=>v.evaluation_status='PASS',v=>v.adoption_decision={actor:'guessed'},v=>v.publication_authorization=true,v=>v.scope_checksum='sha256:'+'0'.repeat(64)]){const v=structuredClone(p);mutate(v);assert.throws(()=>materializeFinalTarget(rehash(v)));}
});
test('date or metadata selection changes hashes and cannot silently reuse earlier bindings',()=>{
 const a=deriveProposal(snapshot,fixtureConfig()),config=fixtureConfig();config.effective_date='2030-01-04';const b=deriveProposal(snapshot,config);assert.notEqual(a.artifact_checksum,b.artifact_checksum);assert.notEqual(a.release_metadata_checksum,b.release_metadata_checksum);assert.notEqual(materializeFinalTarget(a).artifact_checksum,materializeFinalTarget(b).artifact_checksum);assert.throws(()=>validateProposal(b,snapshot),/drift/);
});
test('independent hashes cover proposal payload/file, metadata, final target and source files',()=>{
 const p=deriveProposal(snapshot),{artifact_checksum,...payload}=p,b=bindings(p,snapshot);assert.equal(artifact_checksum,hash(JSON.stringify(payload,null,2)+'\n'));assert.equal(b.complete_proposed_preview_file_checksum,hash(serialize(p)));assert.equal(p.release_metadata_checksum,hash(serialize(p.release_metadata)));for(const file of snapshot.source_files)assert.equal(file.checksum,hash(execFileSync('git',['show',`${snapshot.source_revision}:${file.path}`])));
});
test('provider declarations reject staged proposal, and final-compatible synthetic data remains NOT_EVALUATED',()=>{
 const p=deriveProposal(snapshot,fixtureConfig());const d={schema_version:'1.1.0',standard_id:'OAS-1',release_id:'OAS-1@1.0.0',profile_reference:null,declaration_scope:'TEST ONLY synthetic version and scope',declarant:{identity_reference:'test-fixture:provider',reference_kind:'provider_supplied'},declared_at:'2030-01-02T00:00:00Z',declaration_status:'declared',requirements:p.requirement_ids.map(requirement_id=>({requirement_id,applicability:'unknown',applicability_reason:'',declaration_status:'unknown',evidence_references:[],notes:'TEST ONLY'})),evidence_references:[],notes:'TEST ONLY; no actual adoption or declaration',evaluation_status:'NOT_EVALUATED'};assert.throws(()=>validateDeclaration(d,p),/Pinned/);validateDeclaration(d,materializeFinalTarget(p));for(const mutate of [r=>r.evaluation_status='PASS',r=>r.certified=true,r=>r.profile_reference='invented']){const v=structuredClone(d);mutate(v);assert.throws(()=>validateDeclaration(v,materializeFinalTarget(p)));}
});
test('live package checks are exact while final human adoption/publication gates remain fail',()=>{
 const b=check();assert.equal(b.adoption_decision,null);assert.equal(b.publication_authorization,null);const matrix=gates();assert.equal(matrix.find(g=>g.gate==='final_human_adoption_recorded').result,'FAIL');assert.equal(matrix.find(g=>g.gate==='final_publication_authorized').result,'FAIL');assert.equal(readFileSync(previewPath,'utf8'),serialize(deriveProposal(snapshot)));
});
