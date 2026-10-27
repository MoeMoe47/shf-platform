import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {root,serialize,digest} from './oas-catalog.mjs';
import {governanceViews} from './oas-governance-review.mjs';
import {loadAcceptance,validateRcContract,validateScope,effectiveRequirements,manifest,readinessGates,generatedViews,acceptanceIssues} from './oas-scope-closure.mjs';
import {verifyBindings,validateAcceptanceCandidate,requireRealAcceptance,requestPath,acceptanceRequest} from './oas-rc1-acceptance.mjs';

export const releasePath='public/oas/catalogs/OAS-1@1.0.0-rc.1.json';
export const lockPath='standards/oas/governance/rc1-publication-lock.json';
export const decisionPath='docs/OAS_RC1_ACCEPTANCE_DECISION.md';
export const designationReference='f1060153361ef635c8d26fae91d8a33f031faf31:docs/OAS_FOUNDING_MAINTAINER_DESIGNATION.md';
export const preparationCheckpoint='356f757';
const ensure=(condition,message)=>{if(!condition)throw new Error(message);};
const read=file=>readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
export const gitRead=(revision,file)=>execFileSync('git',['show',`${revision}:${file}`],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
export const historicalPending=()=>JSON.parse(gitRead(preparationCheckpoint,'standards/oas/closure/founding-acceptance.json'));

// The scope-closure generator is an accepted, immutable input. Its historical
// source manifest must still reproduce using the acceptance present at that time.
export function preparationViews(){
 const views=generatedViews(),file='evidence/oas-governance-resolution/SOURCE_MANIFEST.json';
 const {artifact_checksum,...payload}=JSON.parse(views.get(file));
 payload.acceptance_record_checksum=digest(serialize(historicalPending()));
 views.set(file,serialize({...payload,artifact_checksum:digest(serialize(payload))}));
 const gatesFile='evidence/oas-governance-resolution/RC_READINESS_GATE_MATRIX.md';
 const gateBytes=views.get(gatesFile);
 const pendingIssues=acceptanceIssues(historicalPending()).join(' ');
 views.set(gatesFile,gateBytes.replace(/^\| founding_maintainer_acceptance \|.*$/m,`| founding_maintainer_acceptance | FAIL | ${pendingIssues} |`).replace('| no_blocking_questions | PASS |','| no_blocking_questions | FAIL |'));
 return views;
}
export function checkHistoricalReview(){
 for(const [file,bytes]of governanceViews())ensure((file==='docs/OAS_1_0_RC1_CHANGELOG.md'?gitRead(preparationCheckpoint,file):read(file))===bytes,`Historical review view drift: ${file}`);
}
export function checkPreparation(){
 verifyBindings();
 for(const [file,bytes]of preparationViews())ensure(read(file)===bytes,`Historical closure view drift: ${file}`);
}
export function verifyHumanDecision(record=loadAcceptance()){
 const bindings=verifyBindings();validateAcceptanceCandidate(record,bindings);
 ensure(read(requestPath)===serialize(acceptanceRequest()),'Acceptance request drift');
 ensure(record.maintainer_reference==='Mike Slate','Unexpected accepting maintainer');
 ensure(record.authority_evidence_reference===designationReference,'Designation reference mismatch');
 const designation=gitRead(designationReference.slice(0,40),designationReference.slice(41));
 ensure(designation===read('docs/OAS_FOUNDING_MAINTAINER_DESIGNATION.md'),'Designation drift');
 ensure(designation.includes('Maintainer reference: Mike Slate'),'Designation does not name accepted actor');
 const match=/^([a-f0-9]{40}):docs\/OAS_RC1_ACCEPTANCE_DECISION\.md$/.exec(record.decision_record_reference);
 ensure(match,'Committed acceptance decision reference required');
 const decision=gitRead(match[1],decisionPath);
 ensure(decision===read(decisionPath),'Immutable decision record drift');
 for(const required of ['Maintainer reference: Mike Slate',designationReference,record.accepted_at,bindings.prepared_source_revision,bindings.scope_checksum,json(requestPath).request_checksum,'I authorize issuance of OAS-1@1.0.0-rc.1 for validation only.','I do not adopt or authorize publication of final OAS-1@1.0.0.'])ensure(decision.includes(required),`Decision missing binding: ${required}`);
 for(const id of bindings.requirement_ids)ensure(decision.includes(id),'Decision missing requirement');
 for(const [file,checksum]of Object.entries(bindings.contract_checksums))ensure(decision.includes(file)&&decision.includes(String(checksum)),'Decision missing contract binding');
 return {bindings,record};
}
export function generateRc(){
 requireRealAcceptance();const {bindings,record}=verifyHumanDecision();checkPreparation();
 const payload={standard_id:'OAS-1',release_id:'OAS-1@1.0.0-rc.1',standard_version:'1.0.0-rc.1',status:'release_candidate',candidate_date:record.accepted_at.slice(0,10),effective_date:null,requirement_ids:[...bindings.requirement_ids],domain_ids:[...bindings.domain_ids],source_revision:bindings.prepared_source_revision,source_checksum:manifest().source_checksum,requirements_checksum:bindings.requirements_checksum,governance_decision_reference:record.decision_record_reference,scope_checksum:bindings.scope_checksum,changelog_reference:'docs/OAS_1_0_RC1_CHANGELOG.md',predecessor_reference:'OAS-1@0.0.0-public-review.1',predecessor_relationship:'derived_from_historical_public_review',declaration_schema_id:'urn:oas:schema:closure:declaration:1'};
 return validateRcContract({...payload,artifact_checksum:digest(serialize(payload))});
}
export function publicationLock(rc){
 return {release_id:rc.release_id,artifact_path:releasePath,artifact_checksum:rc.artifact_checksum,artifact_file_checksum:digest(serialize(rc)),requirement_ids:rc.requirement_ids,domain_ids:rc.domain_ids,requirements_checksum:rc.requirements_checksum,scope_checksum:rc.scope_checksum,source_revision:rc.source_revision,source_checksum:rc.source_checksum,acceptance_record_checksum:digest(serialize(loadAcceptance())),decision_record_reference:rc.governance_decision_reference,profiles:[],declaration_contract_version:'1.1.0',evaluation_status:'NOT_EVALUATED',final_adoption_status:'NOT ADOPTED',authorize_final_release:false};
}
export function assertImmutable(existing,proposed){ensure(existing===undefined||existing===proposed,'Issued RC1 bytes are immutable; a changed candidate requires a new RC and human decision');}
export function validateIssuedRc(rc,lock){
 validateRcContract(rc);
 ensure(serialize(rc)===serialize(generateRc()),'RC1 differs from accepted deterministic generation');
 ensure(serialize(lock)===serialize(publicationLock(rc)),'RC1 publication lock mismatch');
 return rc;
}
export function issuedSourceManifest(rc){
 const {artifact_checksum,...payload}=manifest();
 const issued={...payload,rc_issued:true,rc_source_revision:rc.source_revision,rc_checksum:rc.artifact_checksum};
 return {...issued,artifact_checksum:digest(serialize(issued))};
}
export function evidenceViews(rc){
 const record=loadAcceptance(),bindings=verifyBindings(),lock=publicationLock(rc),out=new Map();
 const intro='OAS-1@1.0.0-rc.1 is issued for validation only. Final adoption: NOT ADOPTED. No implementation conformance, certification, Trust Bureau opinion, Registry authorization or unrestricted execution is asserted.\n';
 out.set('evidence/oas-rc1-issuance/FOUNDING_ACCEPTANCE_RECORD.md',`# Founding acceptance recorded\n\n${intro}\nMaintainer: ${record.maintainer_reference}. Authority: ${record.authority_evidence_reference}. Actual acceptance time: ${record.accepted_at}. Immutable decision: ${record.decision_record_reference}. Canonical record: standards/oas/closure/founding-acceptance.json. Acceptance record checksum: ${lock.acceptance_record_checksum}. authorize_rc1=true; authorize_final_release=false. The explicit human decision was supplied by Mike Slate; structural checks do not authenticate people.\n`);
 out.set('evidence/oas-rc1-issuance/RC1_MEMBERSHIP.md',`# RC1 immutable membership\n\n${intro}\nAccepted and issued count: 14.\n\n${rc.requirement_ids.map(id=>'- '+id).join('\n')}\n\nAll eight domains represented. Deferred IDs OAS-1-REQ-0011, OAS-1-REQ-0013 and OAS-1-REQ-0015 are excluded. Profiles: intentionally empty. Requirement wording/content checksum: ${rc.requirements_checksum}. Lock: ${lockPath}. Changing members, wording, dates or bytes requires a new RC and explicit human decision.\n`);
 out.set('evidence/oas-rc1-issuance/RC1_PROVENANCE.md',`# RC1 provenance\n\n${intro}\nAccepted/RC source revision: ${rc.source_revision}. Source manifest checksum: ${rc.source_checksum}. Scope checksum: ${rc.scope_checksum}. Requirement-content checksum: ${rc.requirements_checksum}. Acceptance record checksum: ${lock.acceptance_record_checksum}. Artifact payload checksum: ${rc.artifact_checksum}. Complete artifact file checksum: ${lock.artifact_file_checksum}. Candidate date: ${rc.candidate_date}; effective date: null. Decision: ${rc.governance_decision_reference}. Public-review.1 predecessor remains byte-for-byte unchanged with no adopted supersession event.\n`);
 out.set('evidence/oas-rc1-issuance/RC1_SOURCE_MANIFEST.json',serialize(issuedSourceManifest(rc)));
 out.set('evidence/oas-rc1-issuance/RC1_READINESS_GATES.json',serialize(readinessGates()));
 out.set('evidence/oas-rc1-issuance/RC1_REQUIREMENTS.json',serialize(effectiveRequirements()));
 out.set('evidence/oas-rc1-issuance/RC1_VALIDATION.md',`# RC1 issuance validation\n\n${intro}\nAll 15 existing readiness gates pass. The committed designation and acceptance statement, exact prepared request, full accepted source inputs and every bound artifact digest are checked before generation. The unchanged closure RC schema validates the artifact; release checks additionally bind source, decision, exact membership and frozen bytes. Deterministic generation refuses unequal existing RC/lock bytes. Independent SHA-256 verification and focused test/build results are in TEST_RESULTS.md and validation-results.json.\n\nDeclaration schema urn:oas:schema:closure:declaration:1 is contract version 1.1.0. Profiles remain null/empty. Declarations stay NOT_EVALUATED; no provider declaration or implementation satisfaction is created by issuance. RC1 still needs candidate validation and issue disposition before a separate final-adoption decision.\n`);
 out.set('evidence/oas-rc1-issuance/REGISTRY_RC1_READINESS.md',`# Registry RC1 readiness\n\n${intro}\n| Surface | Status | Boundary |\n| --- | --- | --- |\n| OAS-1, D01–D08, exact 14 member IDs | READY FOR RC TESTING ONLY | Resolve immutable RC1 membership and source-bound wording |\n| RC release ID and publication lock | READY FOR RC TESTING ONLY | Verify explicit version, schema and digests; no floating upgrade |\n| Declaration contract 1.1.0 | READY FOR RC TESTING ONLY | Strict pinned references, null profile, NOT_EVALUATED |\n| Profiles | INTENTIONALLY EMPTY | No profile reference resolves |\n| Final adoption / conformance / certification | BLOCKED | Separate governance/evaluation needed |\n| Registry integration | NOT PERFORMED | No Autonomous Registry code, data, authorization or lifecycle change |\n\nThis describes OAS artifact readiness for bounded consumer tests, not a verified Registry implementation or production-readiness claim.\n`);
 out.set('evidence/oas-rc1-issuance/FINAL_ADOPTION_GATES.md',`# Remaining final-adoption gates\n\n${intro}\n1. Validate the actual pinned RC1 against its exact scope, source, declaration contract and frozen membership.\n2. Record candidate review outcomes and issue dispositions; corrections require RC2+ with new source, checksums, changelog and explicit decision.\n3. Obtain a separate explicit human final-adoption decision for exact final bytes and release/effective dates.\n4. Obtain final-publication authorization and record publication/recovery details. Preserve RC1 and public-review.1 permanently.\n\nNo final OAS-1@1.0.0 artifact exists or is authorized.\n`);
 out.set('docs/OAS_1_0_RC1_CHANGELOG.md',`# OAS 1.0.0-rc.1 changelog\n\n${intro}\nIssued candidate date: ${rc.candidate_date}. Source: ${rc.source_revision}. Human decision: ${rc.governance_decision_reference}. Scope: ${rc.scope_checksum}. Declaration contract: 1.1.0.\n\nDerived from historical OAS-1@0.0.0-public-review.1, whose bytes and metadata remain unchanged. This is not an adopted supersession event. The earlier technical review and no-issuance changelog remain retrievable at 356f757:docs/OAS_1_0_RC1_CHANGELOG.md.\n\n- Publish exactly the 14 reviewed scope requirements and unchanged wording from the accepted prepared source.\n- Final re-review approves revised 0001/0005/0017; formerly held 0002/0007/0010/0012/0016 enter only after their explicit final APPROVE dispositions.\n- Deferred 0011/0013/0015 remain excluded and reserved. All eight domains remain represented; all seven unsafe legacy mappings remain quarantined.\n- Use the accepted release_candidate and declaration 1.1.0 contracts without changing historical v1 schemas. Profiles remain intentionally empty; R0–R4 stays informative.\n- Freeze member IDs, source, content checksum, dates and exact artifact bytes. Changes require another explicit RC, source/checksum and reviewed decision.\n- No final adoption, final effective date, provider conformance or certification is created.\n`);
 out.set('docs/OAS_FOUNDING_ACCEPTANCE_RC1.md',`# Founding acceptance for RC1 — RECORDED\n\n${intro}\nMike Slate's human acceptance is recorded at ${record.decision_record_reference}; designation authority: ${record.authority_evidence_reference}; actual acceptance timestamp: ${record.accepted_at}. Canonical record: standards/oas/closure/founding-acceptance.json. Its checksum is ${lock.acceptance_record_checksum}.\n\nThe original immutable request remains ${json(requestPath).request_checksum}, source ${rc.source_revision}, scope ${rc.scope_checksum}, exactly 14 IDs and unchanged expected bindings. The historical request/template is retained at 356f757:docs/OAS_FOUNDING_ACCEPTANCE_RC1.md. Neither request nor expected bindings is regenerated.\n\nRC artifact: ${releasePath}. Published payload checksum: ${rc.artifact_checksum}. Complete file checksum: ${lock.artifact_file_checksum}. Membership freeze: ${lockPath}. Profiles remain empty; declaration 1.1.0 remains NOT_EVALUATED. RC issuance is separate from final adoption and publication, which remain unauthorized.\n`);
 return out;
}
export function issueRc(){
 const rc=generateRc(),artifact=serialize(rc),lock=serialize(publicationLock(rc));
 assertImmutable(existsSync(path.join(root,releasePath))?read(releasePath):undefined,artifact);
 assertImmutable(existsSync(path.join(root,lockPath))?read(lockPath):undefined,lock);
 // Check every existing immutable output before writing either artifact.
 for(const [file,bytes]of [[releasePath,artifact],[lockPath,lock]])if(!existsSync(path.join(root,file)))writeFileSync(path.join(root,file),bytes,{flag:'wx'});
 for(const [file,bytes]of evidenceViews(rc)){mkdirSync(path.dirname(path.join(root,file)),{recursive:true});writeFileSync(path.join(root,file),bytes);}
 return checkRelease();
}
export function checkRelease(){
 const rc=json(releasePath);validateIssuedRc(rc,json(lockPath));
 for(const [file,bytes]of evidenceViews(rc))ensure(read(file)===bytes,`RC evidence drift: ${file}`);
 ensure(read('evidence/oas-rc1-issuance/RC1_REQUIREMENTS.json')===serialize(effectiveRequirements()),'Requirement wording drift');
 return rc;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const command=process.argv[2]||'check';
 if(command==='issue')issueRc();
 else if(command==='check')checkRelease();
 else if(command==='check-preparation')checkPreparation();
 else if(command==='check-review')checkHistoricalReview();
 else if(command==='validate-preparation'){validateScope();verifyBindings();}
 else throw new Error('Unknown RC1 command');
 console.log(`${command}: validated; final adoption NOT ADOPTED`);
}
