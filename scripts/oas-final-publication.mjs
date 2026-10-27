import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {root,serialize,digest} from './oas-catalog.mjs';
export const adoptionRevision='164798c8a684e4c3605fc89492918ca00552e70b';
export const folder='standards/oas/governance/final-1.0.0';
export const authorizationPath=`${folder}/publication-authorization.json`;
export const publicationPath=`${folder}/publication-record.json`;
export const lockPath=`${folder}/publication-lock.json`;
export const releasePath='public/oas/catalogs/OAS-1@1.0.0.json';
export const currentnessPath='public/oas/currentness.json';
export const humanPath='docs/OAS_FINAL_PUBLICATION_AUTHORIZATION.md';
export const standardPath='public/oas/OAS-1@1.0.0.md';
const read=file=>readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const ensure=(condition,message)=>{if(!condition)throw new Error(message);};
const equal=(a,b)=>serialize(a)===serialize(b);
export const gitRead=(reference)=>execFileSync('git',['show',reference],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
let baseline;
// Preserve all pre-existing OAS source, schema, evidence and checks, including pending snapshots.
export function verifyImmutableBaseline(){
 if(!baseline){
  const files=execFileSync('git',['ls-tree','-r','--name-only',adoptionRevision],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/^(standards\/oas\/|schemas\/oas\/|public\/oas\/|docs\/OAS|evidence\/oas|scripts\/(oas-|verify-oas)|tests\/oas)/.test(f));
  const bytes=execFileSync('git',['cat-file','--batch'],{cwd:root,input:files.map(f=>`${adoptionRevision}:${f}`).join('\n')+'\n',maxBuffer:64*1024*1024});let offset=0;baseline=new Map();
  for(const file of files){const end=bytes.indexOf('\n',offset),header=bytes.subarray(offset,end).toString().split(' ');ensure(header[1]==='blob','Immutable baseline blob missing');const length=Number(header[2]);offset=end+1;baseline.set(file,bytes.subarray(offset,offset+length).toString());offset+=length+1;}
 }
 for(const [file,bytes]of baseline)ensure(read(file)===bytes,`Adoption checkpoint changed: ${file}`);
 return baseline.size;
}
const ajv=new Ajv2020({allErrors:true,strict:true});addFormats(ajv);
for(const file of ['schemas/oas/release.schema.json','schemas/oas/requirement.schema.json','schemas/oas/preparation/final-artifact.schema.json','schemas/oas/closure/declaration.schema.json','schemas/oas/governance/final-publication-authorization.schema.json'])ajv.addSchema(json(file));
export function verifyAdoptedTarget(){
 verifyImmutableBaseline();
 const adoption=json(`${folder}/adoption-decision.json`),bound=json(`${folder}/bindings.json`),target=json(`${folder}/artifact-target.json`).target_payload;
 ensure(adoption.state==='ADOPTED'&&adoption.human_actor_reference==='Mike Slate','Actual human adoption required');
 ensure(adoption.immutable_decision_reference==='4e75ef05f802f512a05c04fce842eb8ad77b7b19:docs/OAS_FINAL_ADOPTION_DECISION.md','Adoption decision reference mismatch');
 ensure(gitRead(adoption.immutable_decision_reference)===read('docs/OAS_FINAL_ADOPTION_DECISION.md'),'Immutable adoption decision mismatch');
 ensure(gitRead(adoption.authority_evidence_reference)===read('docs/OAS_FOUNDING_MAINTAINER_DESIGNATION.md'),'Designation mismatch');
 const {record_checksum,...record}=adoption;ensure(digest(serialize(record))===record_checksum,'Adoption checksum mismatch');
 const {binding_checksum,...bindings}=bound;ensure(digest(serialize(bindings))===binding_checksum&&binding_checksum===adoption.preparation_binding_checksum,'Prepared binding mismatch');
 const fileHash=digest(serialize(target));ensure(fileHash==='sha256:9ca2b2b9cc17acd419e9961387e65d0ca3de33fde557d5440f96856dc186892e'&&fileHash===adoption.final_artifact_checksum,'Adopted final bytes mismatch');
 const {artifact_checksum,...payload}=target;ensure(digest(serialize(payload))===artifact_checksum&&artifact_checksum===adoption.final_artifact_payload_checksum,'Payload checksum mismatch');
 ensure(digest(serialize(target.requirements))===adoption.requirements_checksum&&target.requirements_checksum===adoption.requirements_checksum,'Requirement checksum mismatch');
 const shape=ajv.getSchema('urn:oas:schema:preparation:final-artifact:1');ensure(shape(target),ajv.errorsText(shape.errors));
 const expected=[1,2,3,4,5,6,7,8,9,10,12,14,16,17].map(n=>`OAS-1-REQ-${String(n).padStart(4,'0')}`),domains=[1,2,3,4,5,6,7,8].map(n=>`OAS-1-D0${n}`);
 ensure(equal(target.requirement_ids,expected)&&equal(target.requirements.map(r=>r.requirement_id),expected),'Exact fourteen requirements required');
 ensure(equal(target.domain_ids,domains)&&equal([...new Set(target.requirements.map(r=>r.domain_id))].sort(),domains),'Eight domains required');
 const original=JSON.parse(gitRead('517cc23426e7485c352a1672c8fe4614291d552a:standards/oas/authoring/first-release.json')).requirements;
 for(const row of target.requirements){const old=original.find(r=>r.requirement_id===row.requirement_id);ensure(old&&row.normative_text===old.normative_text&&row.domain_id===old.domain_id,'Normative content changed');}
 for(const [field,value]of Object.entries({source_revision:adoption.source_revision,scope_checksum:adoption.scope_checksum,declaration_contract_version:'1.1.0',evaluation_status:'NOT_EVALUATED',profiles:[]}))ensure(equal(target[field],value),`Adopted target mismatch: ${field}`);
 ensure(target.release.release_date==='2026-10-27'&&target.release.effective_date==='2026-10-27','Approved dates changed');
 for(const file of bound.source_files)ensure(digest(read(file.path))===file.checksum,`Source checksum mismatch: ${file.path}`);
 for(const [file,hash]of Object.entries(bound.schema_checksums))ensure(digest(read(file))===hash,`Bound schema changed: ${file}`);
 return {adoption,bound,target};
}
export function validateAuthorization(record=json(authorizationPath)){
 const {adoption,bound,target}=verifyAdoptedTarget();const shape=ajv.getSchema('urn:oas:schema:governance:final-publication-authorization:1');ensure(shape(record),`Publication authorization schema: ${ajv.errorsText(shape.errors)}`);
 const {record_checksum,...payload}=record;ensure(record_checksum===digest(serialize(payload)),'Authorization checksum mismatch');
 const expected={authority_evidence_reference:adoption.authority_evidence_reference,adoption_decision_reference:adoption.immutable_decision_reference,adoption_record_checksum:adoption.record_checksum,preparation_binding_checksum:bound.binding_checksum,source_revision:target.source_revision,final_artifact_checksum:adoption.final_artifact_checksum,final_artifact_payload_checksum:target.artifact_checksum,requirements_checksum:target.requirements_checksum,scope_checksum:target.scope_checksum,requirement_ids:target.requirement_ids,domain_ids:target.domain_ids,release_date:target.release.release_date,effective_date:target.release.effective_date};
 for(const [field,value]of Object.entries(expected))ensure(equal(record[field],value),`Publication authorization binding mismatch: ${field}`);
 const decision=gitRead(record.immutable_decision_reference);ensure(decision===read(humanPath),'Immutable publication decision mismatch');
 execFileSync('git',['merge-base','--is-ancestor',record.immutable_decision_reference.slice(0,40),'HEAD'],{cwd:root});
 const statement=/```text\n([\s\S]*?)\n```/.exec(decision);ensure(statement&&statement[1]===record.human_statement,'Actual human publication statement required');
 ensure(decision.includes(`Authorization timestamp (execution UTC): ${record.decision_timestamp}`),'Authorization time mismatch');
 ensure(record.human_statement.includes('separately authorize publication')&&record.human_statement.includes('does not certify'),'Explicit separate, bounded human publication authorization required');
 for(const value of [record.source_revision,record.final_artifact_checksum,record.requirements_checksum,record.scope_checksum,record.authority_evidence_reference,record.adoption_decision_reference,releasePath])ensure(decision.includes(value),'Human publication decision missing exact binding');
 return {record,adoption,bound,target};
}
export function currentness(target){return {metadata_version:'1.0.0',standard_id:'OAS-1',current_adopted_release_id:target.release_id,publication_status:'PUBLISHED',artifact_path:releasePath,artifact_file_checksum:digest(serialize(target)),source_revision:target.source_revision,predecessor_reference:target.predecessor_reference,relationship:'finalization_of_validated_rc1',releases:[{release_id:target.release_id,role:'CURRENT_ADOPTED',artifact_path:releasePath},{release_id:'OAS-1@1.0.0-rc.1',role:'HISTORICAL_RELEASE_CANDIDATE',artifact_path:'public/oas/catalogs/OAS-1@1.0.0-rc.1.json'},{release_id:'OAS-1@0.0.0-public-review.1',role:'HISTORICAL_PUBLIC_REVIEW',artifact_path:'public/oas/catalogs/OAS-1@0.0.0-public-review.1.json'}],normative_supersedes:[],note:'Currentness is a release observation; immutable historical metadata and normative supersession edges are not rewritten.'};}
export function humanStandard(target){return `# Open Autonomous Standard 1.0\n\nPublished adopted release: ${target.release_id}. Release/effective dates: 2026-10-27. Source: ${target.source_revision}.\n\nThis human view is generated from the exact adopted machine-readable catalog. Profiles are intentionally empty. Declarations under contract 1.1.0 are attributable, scoped, version-pinned provider assertions; evaluation remains NOT_EVALUATED. Publication does not certify, determine conformance, assess, endorse or behaviorally verify any provider/system.\n\nOAS owns standards/interoperability. Autonomous Registry owns identity/provenance/lifecycle/records. Autonomous Trust Bureau owns independent trust/assessment. SHS BOS is the operational/business system.\n\n${target.requirements.map(r=>`## ${r.requirement_id} — ${r.domain_id}\n\n${r.normative_text}\n`).join('\n')}\nCanonical catalog: catalogs/OAS-1@1.0.0.json. Currentness: currentness.json. Predecessor: OAS-1@1.0.0-rc.1. Historical releases are retained unchanged. Later material changes require another governed version; never mutate this release in place.\n`;}
export function assertFrozen(existing,expected){ensure(existing===undefined||existing===expected,'Published final release is immutable; a later governed version is required');}
const sealed=payload=>({...payload,record_checksum:digest(serialize(payload))});
export function checkPublication(artifact=read(releasePath),lock=json(lockPath),observation=json(currentnessPath)){
 const {record,adoption,target}=validateAuthorization();ensure(artifact===serialize(target),'Published artifact byte mismatch');
 ensure(equal(observation,currentness(target)),'Currentness/supersession mismatch');
 const pub=json(publicationPath);ensure(pub.record_kind==='FINAL_PUBLICATION_RECORD'&&pub.publication_status==='PUBLISHED'&&pub.final_adoption_status==='ADOPTED'&&pub.publication_authorized===true,'Actual publication record required');
 ensure(typeof pub.published_at==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(pub.published_at)&&!Number.isNaN(Date.parse(pub.published_at))&&Date.parse(pub.published_at)>=Date.parse(record.decision_timestamp),'Actual publication time invalid');
 const expected=publicationRecord(record,target,pub.published_at);ensure(equal(pub,expected),'Publication provenance mismatch');
 ensure(equal(lock,publicationLock(record,adoption,target,pub)),'Final publication lock mismatch');
 ensure(read(standardPath)===humanStandard(target),'Generated human standard drift');
 // Once committed, the first publication lock is an additional immutable Git anchor.
 const first=execFileSync('git',['log','--diff-filter=A','--format=%H','--',lockPath],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean).at(-1);
 if(first)for(const file of [authorizationPath,publicationPath,lockPath,currentnessPath,releasePath,standardPath])ensure(read(file)===gitRead(`${first}:${file}`),`Published Git freeze changed: ${file}`);
 return {release_id:target.release_id,final_adoption_status:'ADOPTED',publication_status:'PUBLISHED',publication_authorized:true,artifact_file_checksum:digest(artifact),requirement_count:14,domain_count:8,profiles:[],evaluation_status:'NOT_EVALUATED',registry_readiness:'READY FOR FINAL OAS INTEGRATION',actual_registry_integration:false};
}
export function publicationRecord(record,target,publishedAt){return sealed({record_version:'1.0.0',record_kind:'FINAL_PUBLICATION_RECORD',release_id:target.release_id,final_adoption_status:'ADOPTED',publication_status:'PUBLISHED',publication_authorized:true,publication_target:releasePath,published_at:publishedAt,operator_reference:record.operator_reference,authorization_decision_reference:record.immutable_decision_reference,authorization_record_checksum:record.record_checksum,adoption_decision_reference:record.adoption_decision_reference,source_revision:target.source_revision,release_date:target.release.release_date,effective_date:target.release.effective_date,artifact_file_checksum:digest(serialize(target)),artifact_payload_checksum:target.artifact_checksum,requirements_checksum:target.requirements_checksum,scope_checksum:target.scope_checksum,external_deployment_performed:false});}
export function publicationLock(record,adoption,target,pub){return sealed({record_version:'1.0.0',release_id:target.release_id,artifact_path:releasePath,artifact_file_checksum:digest(serialize(target)),artifact_payload_checksum:target.artifact_checksum,requirements_checksum:target.requirements_checksum,normative_content_checksum:target.normative_content_checksum,domain_mapping_checksum:target.domain_mapping_checksum,scope_checksum:target.scope_checksum,requirement_ids:target.requirement_ids,domain_ids:target.domain_ids,source_revision:target.source_revision,declaration_contract_version:'1.1.0',profiles:[],evaluation_status:'NOT_EVALUATED',adoption_record_checksum:adoption.record_checksum,authorization_record_checksum:record.record_checksum,publication_record_checksum:pub.record_checksum,currentness_file_checksum:digest(serialize(currentness(target))),human_standard_file_checksum:digest(humanStandard(target)),rc1_file_checksum:digest(read('public/oas/catalogs/OAS-1@1.0.0-rc.1.json')),public_review_file_checksum:digest(read('public/oas/catalogs/OAS-1@0.0.0-public-review.1.json'))});}
export function publish(){
 const {record,adoption,target}=validateAuthorization();
 const expected=new Map([[releasePath,serialize(target)],[currentnessPath,serialize(currentness(target))],[standardPath,humanStandard(target)]]);
 for(const [file,bytes]of expected)assertFrozen(existsSync(path.join(root,file))?read(file):undefined,bytes);
 if(existsSync(path.join(root,publicationPath))||existsSync(path.join(root,lockPath)))return checkPublication();
 // Fail before any write if an incomplete/previous publication exists.
 for(const file of expected.keys())ensure(!existsSync(path.join(root,file)),`Incomplete existing publication requires explicit recovery: ${file}`);
 const pub=publicationRecord(record,target,new Date().toISOString());expected.set(publicationPath,serialize(pub));expected.set(lockPath,serialize(publicationLock(record,adoption,target,pub)));
 for(const [file,bytes]of expected)writeFileSync(path.join(root,file),bytes,{flag:'wx'});
 return checkPublication();
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const command=process.argv[2]||'check';if(command==='check')console.log(JSON.stringify(checkPublication(),null,2));else if(command==='verify-authorization')console.log(JSON.stringify(validateAuthorization().record,null,2));else if(command==='publish')console.log(JSON.stringify(publish(),null,2));else throw new Error('Unknown final publication command');
}
