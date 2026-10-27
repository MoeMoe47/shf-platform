import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {root,serialize,digest} from './oas-catalog.mjs';

export const preparationRevision='c1048afb47cbb09decd23b4916149d51ae23d3e8';
export const folder='standards/oas/governance/final-1.0.0';
export const recordPath=`${folder}/adoption-decision.json`;
export const humanDecisionPath='docs/OAS_FINAL_ADOPTION_DECISION.md';
export const schemaPath='schemas/oas/governance/final-adoption.schema.json';
const read=file=>readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const ensure=(condition,message)=>{if(!condition)throw new Error(message);};
const same=(a,b)=>serialize(a)===serialize(b);
const ajv=new Ajv2020({allErrors:true,strict:true});addFormats(ajv);
const shape=ajv.compile(json(schemaPath));
const blobCache=new Map();
// Batch immutable Git blob reads; compare actual raw bytes, not parsed JSON only.
function loadGitBlobs(specifications){
 const missing=[...new Set(specifications)].filter(spec=>!blobCache.has(spec));
 if(!missing.length)return;
 const bytes=execFileSync('git',['cat-file','--batch'],{cwd:root,input:missing.join('\n')+'\n'});
 let offset=0;
 for(const spec of missing){const end=bytes.indexOf('\n',offset);ensure(end>=offset,'Invalid Git object response');const header=bytes.subarray(offset,end).toString().split(' ');ensure(header[1]==='blob'&&/^\d+$/.test(header[2]),`Missing immutable blob: ${spec}`);const length=Number(header[2]);offset=end+1;blobCache.set(spec,bytes.subarray(offset,offset+length).toString('utf8'));offset+=length+1;}
}
function committed(revision,file){const spec=`${revision}:${file}`;loadGitBlobs([spec]);return blobCache.get(spec);}
export function verifyPreparedBindings(){
 const files=execFileSync('git',['ls-tree','-r','--name-only',preparationRevision,'--',folder,'evidence/oas-1.0-final-adoption-preparation'],{cwd:root,encoding:'utf8'}).trim().split('\n');
 loadGitBlobs(files.map(file=>`${preparationRevision}:${file}`));
 for(const file of files)ensure(read(file)===committed(preparationRevision,file),`Prepared package mismatch: ${file}`);
 const bound=json(`${folder}/bindings.json`),preview=json(`${folder}/artifact-preview.json`),wrapper=json(`${folder}/artifact-target.json`),target=wrapper.target_payload;
 ensure(wrapper.marking==='PROPOSED — NOT ADOPTED — NOT PUBLISHED','Prepared wrapper marking mismatch');
 const {binding_checksum,...boundPayload}=bound;ensure(binding_checksum===digest(serialize(boundPayload)),'Binding checksum mismatch');
 ensure(bound.source_revision==='6f145192af25c929c95181fd6cd38f32d7b5ace9'&&target.source_revision===bound.source_revision,'Final source mismatch');
 ensure(digest(serialize(target))==='sha256:9ca2b2b9cc17acd419e9961387e65d0ca3de33fde557d5440f96856dc186892e','Final artifact checksum mismatch');
 const {artifact_checksum,...payload}=target;ensure(artifact_checksum===digest(serialize(payload))&&artifact_checksum===bound.date_specific_final_artifact_payload_checksum,'Final payload checksum mismatch');
 ensure(target.requirements_checksum==='sha256:37c09a8f92666b10d157d267e480296d9aa614c3299e10060aaa7b414ea50e5d'&&digest(serialize(target.requirements))===target.requirements_checksum,'Requirement checksum mismatch');
 ensure(target.scope_checksum==='sha256:14be68339c76888fa1cac497564b6abd427352688ff68c531e8f46b61972d3c4','Scope mismatch');
 ensure(digest(read(`${folder}/artifact-preview.json`))===bound.complete_proposed_preview_file_checksum,'Preview raw checksum mismatch');
 const {artifact_checksum:previewHash,...previewPayload}=preview;ensure(previewHash===digest(serialize(previewPayload)),'Preview payload checksum mismatch');
 ensure(digest(serialize(bound.source_files))===bound.source_checksum,'Source manifest checksum mismatch');
 const designation=bound.designation_reference.split(':'),acceptance=bound.rc1_acceptance_reference.split(':');
 const original='standards/oas/authoring/first-release.json';
 const rcFile='public/oas/catalogs/OAS-1@1.0.0-rc.1.json',history='public/oas/catalogs/OAS-1@0.0.0-public-review.1.json';
 const extra=[`${bound.normative_source_revision}:${original}`,`${preparationRevision}:${rcFile}`,`${preparationRevision}:${history}`,`${designation[0]}:${designation[1]}`,`${acceptance[0]}:${acceptance[1]}`,`${preparationRevision}:evidence/oas-rc1-final-validation/RC1_INDEPENDENT_VALIDATION.md`];
 loadGitBlobs([...bound.source_files.map(f=>`${bound.source_revision}:${f.path}`),...extra]);
 for(const file of bound.source_files)ensure(read(file.path)===committed(bound.source_revision,file.path)&&digest(read(file.path))===file.checksum,`Source binding mismatch: ${file.path}`);
 for(const [file,hash]of Object.entries(bound.schema_checksums))ensure(digest(read(file))===hash,`Schema binding mismatch: ${file}`);
 ensure(read(designation[1])===committed(designation[0],designation[1])&&read(designation[1]).includes('Maintainer reference: Mike Slate'),'Designation mismatch');
 ensure(read(acceptance[1])===committed(acceptance[0],acceptance[1]),'RC1 acceptance decision mismatch');
 const originalRows=JSON.parse(committed(bound.normative_source_revision,original)).requirements;
 const expectedIds=[1,2,3,4,5,6,7,8,9,10,12,14,16,17].map(n=>`OAS-1-REQ-${String(n).padStart(4,'0')}`);
 const expectedDomains=[1,2,3,4,5,6,7,8].map(n=>`OAS-1-D0${n}`);
 ensure(same(target.requirement_ids,expectedIds)&&same(target.requirements.map(r=>r.requirement_id),expectedIds),'Exact fourteen membership mismatch');
 ensure(same(target.domain_ids,expectedDomains)&&same([...new Set(target.requirements.map(r=>r.domain_id))].sort(),expectedDomains),'Eight-domain mismatch');
 for(const row of target.requirements){const originalRow=originalRows.find(r=>r.requirement_id===row.requirement_id);ensure(originalRow&&row.domain_id===originalRow.domain_id&&row.normative_text===originalRow.normative_text,`Normative wording/domain mismatch: ${row.requirement_id}`);}
 ensure(target.release.release_date==='2026-10-27'&&target.release.effective_date==='2026-10-27'&&bound.release_metadata.release_date===target.release.release_date&&bound.release_metadata.effective_date===target.release.effective_date,'Approved date mismatch');
 ensure(target.declaration_contract_version==='1.1.0'&&target.evaluation_status==='NOT_EVALUATED'&&target.profiles.length===0,'Declaration/profile/evaluation mismatch');
 ensure(read(rcFile)===committed(preparationRevision,rcFile)&&digest(read(rcFile))===bound.rc1_artifact_file_checksum,'RC1 byte mismatch');
 ensure(read(history)===committed(preparationRevision,history)&&digest(read(history))===bound.historical_public_review_file_checksum,'Historical public-review mismatch');
 ensure(!existsSync(path.join(root,bound.publication_target)),'Unauthorized canonical final publication');
 ensure(!existsSync(path.join(root,`${folder}/publication-authorization.json`)),'Separate publication authorization must remain absent');
 return {bound,target};
}
export function loadAdoption(){return json(recordPath);}
export function validateAdoption(record=loadAdoption()){
 ensure(shape(record),`Final adoption schema: ${ajv.errorsText(shape.errors)}`);
 const {record_checksum,...payload}=record;ensure(record_checksum===digest(serialize(payload)),'Adoption record checksum mismatch');
 const {bound,target}=verifyPreparedBindings();
 const expected={preparation_binding_checksum:bound.binding_checksum,source_revision:target.source_revision,normative_source_revision:bound.normative_source_revision,final_artifact_checksum:bound.date_specific_final_artifact_file_checksum,final_artifact_payload_checksum:target.artifact_checksum,requirements_checksum:target.requirements_checksum,normative_content_checksum:target.normative_content_checksum,scope_checksum:target.scope_checksum,domain_mapping_checksum:target.domain_mapping_checksum,release_metadata_checksum:bound.release_metadata_checksum,schema_checksums:bound.schema_checksums,requirement_ids:target.requirement_ids,domain_ids:target.domain_ids};
 for(const [field,value]of Object.entries(expected))ensure(same(record[field],value),`Adoption binding mismatch: ${field}`);
 ensure(record.authority_evidence_reference===bound.designation_reference,'Adoption designation mismatch');
 const revision=record.immutable_decision_reference.slice(0,40),decision=committed(revision,humanDecisionPath);
 ensure(decision===read(humanDecisionPath),'Immutable human decision mismatch');
 const match=/```text\n([\s\S]*?)\n```/.exec(decision);ensure(match&&match[1]===record.human_statement,'Human adoption statement mismatch');
 ensure(decision.includes(`Decision timestamp (execution UTC): ${record.decision_timestamp}`),'Human decision timestamp mismatch');
 for(const text of [record.prepared_package_revision,record.final_artifact_checksum,record.requirements_checksum,record.scope_checksum,record.source_revision,record.authority_evidence_reference,'Mike Slate','2026-10-27'])ensure(decision.includes(text),`Decision missing explicit binding: ${text}`);
 ensure(record.human_statement.includes('explicitly adopt')&&record.human_statement.includes('Do NOT publish'),'Human decision must explicitly adopt and withhold publication');
 return {final_adoption_status:'ADOPTED',publication_authorized:false,publication_status:'NOT PUBLISHED',adopting_maintainer:record.human_actor_reference,decision_timestamp:record.decision_timestamp,immutable_decision_reference:record.immutable_decision_reference,record_checksum,software_authenticates_human_identity_or_consent:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const command=process.argv[2]||'verify';if(command==='verify')console.log(JSON.stringify(validateAdoption(),null,2));else if(command==='verify-prepared'){verifyPreparedBindings();console.log('Exact prepared package and every human-supplied binding verified; no adoption is inferred.');}else throw new Error('Unknown adoption verification command');
}
