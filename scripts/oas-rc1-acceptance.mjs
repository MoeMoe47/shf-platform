import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {root,serialize,digest,readSource,artifactPath,generateFromGit} from './oas-catalog.mjs';
import {loadScope,loadAcceptance,validateScope,effectiveRequirements,scopeChecksum,contractChecksums,currentSourceRevision,acceptanceIssues,validateShape,readinessGates,inputPaths as preparedInputs} from './oas-scope-closure.mjs';

export const checkpoint='3e3a6585da2117a37f959f8630dc7cf8300b648c';
export const preparedRevision='517cc23426e7485c352a1672c8fe4614291d552a';
export const expectedPath='evidence/oas-governance-resolution/EXPECTED_ACCEPTANCE_BINDINGS.json';
export const requestPath='standards/oas/governance/rc1-acceptance-request.json';
export const expectedMembership=[1,2,3,4,5,6,7,8,9,10,12,14,16,17].map(n=>`OAS-1-REQ-${String(n).padStart(4,'0')}`);
const expectedScopeChecksum='sha256:14be68339c76888fa1cac497564b6abd427352688ff68c531e8f46b61972d3c4';
const json=file=>JSON.parse(readFileSync(path.join(root,file),'utf8'));
const gitContentCache=new Map();
const fromGit=(revision,file)=>{const key=`${revision}:${file}`;if(!gitContentCache.has(key))gitContentCache.set(key,execFileSync('git',['show',key],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}));return gitContentCache.get(key);};
let historicalGenerationCache;
const ensure=(condition,message)=>{if(!condition)throw new Error(message);};
const same=(a,b)=>serialize(a)===serialize(b);
const sortedEntries=value=>Object.entries(value||{}).sort(([a],[b])=>a.localeCompare(b));
export const supportingPaths=[
 'docs/OAS_1_0_SCOPE.md','docs/OAS_1_0_REQUIREMENTS.md','docs/OAS_GOVERNANCE_AUTHORITY.md','docs/OAS_DECLARATION_CONTRACT.md','docs/OAS_RELEASE_CANDIDATE_CONTRACT.md','docs/OAS_DOMAIN_MAPPING.md',
 'standards/oas/closure/domain-mapping.json','standards/oas/closure/scope.json','standards/oas/closure/founding-policy.json',
 'schemas/oas/closure/declaration.schema.json','schemas/oas/closure/rc.schema.json',
].sort();
export function verifyBindings(expected=json(expectedPath),scope=loadScope()){
 ensure(readFileSync(path.join(root,expectedPath),'utf8')===fromGit(checkpoint,expectedPath),'Prepared EXPECTED_ACCEPTANCE_BINDINGS.json drifted; do not regenerate different bindings');
 ensure(same(expected,JSON.parse(fromGit(checkpoint,expectedPath))),'Expected binding data differs from checkpoint');
 ensure(expected.required_source_revision===preparedRevision&&currentSourceRevision()===preparedRevision,'Prepared source revision mismatch');
 for(const file of preparedInputs)ensure(readFileSync(path.join(root,file),'utf8')===fromGit(preparedRevision,file),`Prepared content input drift: ${file}`);
 validateScope(scope);
 ensure(scopeChecksum(scope)===expectedScopeChecksum&&expected.scope_checksum===expectedScopeChecksum,'Scope checksum mismatch');
 ensure(same(scope.included_requirement_ids,expectedMembership),'Exact 14-member scope changed');
 const requirements=effectiveRequirements(scope);
 ensure(requirements.length===14&&requirements.every(r=>scope.requirements.find(d=>d.requirement_id===r.requirement_id).decision==='APPROVE'),'Unapproved or deferred requirement in prepared scope');
 ensure(same(sortedEntries(expected.contract_checksums),sortedEntries(contractChecksums())),'Accepted artifact digest mismatch');
 const supporting_artifacts=supportingPaths.map(file=>{
   const bytes=readFileSync(path.join(root,file),'utf8');ensure(bytes===fromGit(preparedRevision,file),`Prepared supporting artifact drift: ${file}`);return {path:file,source_revision:preparedRevision,checksum:digest(bytes)};
 });
 const domains=[...new Set(requirements.map(r=>r.domain_id))].sort();ensure(same(domains,readSource().domains.map(d=>d.domain_id)),'Eight-domain coverage changed');
 const historical=readFileSync(path.join(root,artifactPath),'utf8');
 if(historicalGenerationCache===undefined)historicalGenerationCache=serialize(generateFromGit());
 ensure(historical===fromGit(checkpoint,artifactPath)&&historical===historicalGenerationCache,'Historical public-review changed');
 for(const file of JSON.parse(historical).source_files)ensure(digest(readFileSync(path.join(root,file.path)))===file.checksum,'Historical catalog input drift');
 return {prepared_source_revision:preparedRevision,expected_bindings_path:expectedPath,expected_bindings_checksum:digest(readFileSync(path.join(root,expectedPath))),scope_checksum:expectedScopeChecksum,requirement_ids:[...expectedMembership],requirements_checksum:digest(serialize(requirements)),domain_ids:domains,contract_checksums:expected.contract_checksums,supporting_artifacts,historical_public_review:{release_id:'OAS-1@0.0.0-public-review.1',path:artifactPath,artifact_file_checksum:digest(historical)},profiles:[],declaration_contract_version:'1.1.0',governance_mode:'FOUNDING GOVERNANCE'};
}
// Structural binding validation is not authentication or a claim that consent occurred.
export function validateAcceptanceCandidate(record,bindings=verifyBindings()){
 validateShape('founding-acceptance',record);
 ensure(bindings.prepared_source_revision===preparedRevision&&bindings.scope_checksum===expectedScopeChecksum,'Supplied verification bindings are not the prepared snapshot');
 ensure(same(sortedEntries(bindings.contract_checksums),sortedEntries(json(expectedPath).contract_checksums)),'Supplied contract verification bindings drifted');
 ensure(record.state==='ACCEPTED','Real maintainer acceptance has not been recorded');
 for(const field of ['maintainer_reference','authority_evidence_reference','decision_record_reference','accepted_at'])ensure(typeof record[field]==='string'&&record[field].trim().length>0,`Missing real ${field}`);
 ensure(record.accepted_source_revision===bindings.prepared_source_revision,'Acceptance must bind exact prepared source revision');
 ensure(record.accepted_scope_checksum===bindings.scope_checksum,'Accepted scope checksum mismatch');
 ensure(same(sortedEntries(record.accepted_contract_checksums),sortedEntries(bindings.contract_checksums)),'Accepted contract checksums mismatch');
 ensure(record.authorize_rc1===true&&record.authorize_final_release===false,'RC authorization required; final adoption prohibited');
 ensure(same(bindings.requirement_ids,expectedMembership)&&bindings.requirement_ids.length===14,'Accepted membership mismatch');
 return {structural_bindings_valid:true,authority_and_consent_verified_by_software:false,final_adoption_status:'NOT ADOPTED'};
}
export function acceptanceState(record=loadAcceptance()){
 return {state:record.state,acceptance_recorded:record.state==='ACCEPTED',maintainer_reference:record.maintainer_reference,authority_evidence_reference:record.authority_evidence_reference,accepted_at:record.accepted_at,decision_record_reference:record.decision_record_reference,authorize_rc1:record.authorize_rc1,authorize_final_release:record.authorize_final_release};
}
export function requireRealAcceptance(){
 const bindings=verifyBindings(),record=loadAcceptance();validateAcceptanceCandidate(record,bindings);
 ensure(acceptanceIssues(record).length===0,'Founding acceptance failed repository checks');
 ensure(!readinessGates().some(g=>g.result==='FAIL'),'Mandatory RC gate failed');
 // The documented operator must still independently verify designation evidence.
 return bindings;
}
export function acceptanceRequest(){
 const payload={request_version:'1.0.0',decision_type:'FOUNDING_MAINTAINER_ACCEPTANCE_REQUEST',status:'ACTION_REQUIRED_NOT_ACCEPTED',standard_id:'OAS-1',target_release_candidate:'OAS-1@1.0.0-rc.1',governance_mode:'FOUNDING GOVERNANCE',verified_bindings:verifyBindings(),canonical_acceptance_path:'standards/oas/closure/founding-acceptance.json',maintainer_reference:null,authority_evidence_reference:null,decision_timestamp:null,decision_record_reference:null,acceptance_recorded:false,rc_issued:false,final_adoption_status:'NOT ADOPTED',authorize_final_release:false};
 return {...payload,request_checksum:digest(serialize(payload))};
}
export function acceptanceStatement(request=acceptanceRequest()){
 return `I, <REAL MAINTAINER REFERENCE>, am the repository-designated OAS founding maintainer. My independently checkable designation/control evidence is <AUTHORITY EVIDENCE REFERENCE>. Under FOUNDING GOVERNANCE, I accept source revision ${preparedRevision}, the exact 14 requirement IDs and wording, scope checksum ${request.verified_bindings.scope_checksum}, governance authority model, OAS 1.0 scope, terminal domain mapping closure, declaration contract 1.1.0, release-candidate contract, and every prepared artifact digest bound by acceptance request ${request.request_checksum}. The unchanged expected bindings are at ${checkpoint}:${expectedPath}. I authorize issuance of OAS-1@1.0.0-rc.1 for validation only. I do not adopt or authorize publication of final OAS-1@1.0.0. My actual decision timestamp is <ACTUAL UTC TIMESTAMP>, and the immutable acceptance decision record is <DECISION RECORD REFERENCE>.`;
}
export function generatedPackage(record=loadAcceptance()){
 const request=acceptanceRequest(),binding=request.verified_bindings,out=new Map();
 ensure(record.state==='AWAITING_REAL_MAINTAINER_ACCEPTANCE'&&!record.authorize_rc1&&!record.authorize_final_release,'This fallback package must not overwrite or imply an actual acceptance; handle a real decision explicitly');
 const blocked='FOUNDING ACCEPTANCE NOT RECORDED. No RC exists. This package is a request/verification result, not a governance acceptance, signature, vote, release artifact or adopted standard.\n';
 out.set(requestPath,serialize(request));
 out.set('docs/OAS_FOUNDING_ACCEPTANCE_RC1.md',`# Founding acceptance for RC1 — MAINTAINER ACTION REQUIRED\n\n${blocked}\nThe current task conditionally authorizes recording a real decision, but supplies no real maintainer identity/designation evidence. Repository governance prohibits deriving it from user.name, a remote owner, a technical review or a test fixture. Canonical record ${request.canonical_acceptance_path} remains unchanged and pending.\n\n## Exact acceptance statement to provide\n\nAfter reviewing all linked material, the actual maintainer must replace every angle-bracket field with real information and provide this statement through an attributable immutable decision record (or an explicit user reply accompanied by the required designation/control evidence and record reference). Do not copy this template as if it were already consent.\n\n\`\`\`text\n${acceptanceStatement(request)}\n\`\`\`\n\n## Exact membership\n\n${binding.requirement_ids.map(id=>`- ${id}`).join('\n')}\n\nThe request at ${requestPath} contains exact source/scope/contract/supporting-file digests. Request checksum: ${request.request_checksum}. This is not an acceptance checksum. Original EXPECTED_ACCEPTANCE_BINDINGS.json was not changed or silently regenerated.\n\nOnce the real identity/evidence/statement/time/reference are supplied and independently checked, populate the existing canonical record under its existing schema; do not add unsupported fields to that bound schema. The immutable statement/request binds full membership and wording through the exact scope/source digests. Then validate the decision and every gate before any issuance. Final adoption remains NOT ADOPTED and authorize_final_release stays false.\n`);
 out.set('evidence/oas-rc1-issuance/ACCEPTANCE_BINDING_VERIFICATION.md',`# Acceptance binding verification\n\nVerified from exact checkpoint ${checkpoint}; branch release/oas-1.0.0-rc.1 was created there and ancestry checked before changes. Working tree /private/tmp/oas-rc1-issuance belongs to /Users/mikeslate/Projects/shrv1; unrelated source-checkout changes and Registry are untouched.\n\nPrepared source: ${binding.prepared_source_revision}. Scope digest: ${binding.scope_checksum}. Membership: exactly ${binding.requirement_ids.length}; all member records exist, retain their IDs/wording and exclude deferred 0011/0013/0015. Eight domains represented. Original expected-binding file checksum: ${binding.expected_bindings_checksum}.\n\n| Prepared artifact | Verified source | SHA-256 file checksum |\n| --- | --- | --- |\n${binding.supporting_artifacts.map(f=>`| ${f.path} | ${f.source_revision} | ${f.checksum} |`).join('\n')}\n\nEvery accepted content input is verified by git show against 517cc23426e7485c352a1672c8fe4614291d552a. Additional scope/human requirement/mapping documents are explicitly pinned above. Historical ${binding.historical_public_review.release_id} reproduces and its file checksum is ${binding.historical_public_review.artifact_file_checksum}. Neither expected bindings nor prepared scope/contracts are regenerated or modified by this package.\n`);
 out.set('evidence/oas-rc1-issuance/FOUNDING_ACCEPTANCE_RECORD.md',`# Founding acceptance record status\n\n${blocked}\nCanonical path: ${request.canonical_acceptance_path}. State: ${record.state}. Maintainer reference, designation/control evidence, accepted revision/digests/time and immutable decision reference are null; authorize_rc1=false; authorize_final_release=false. No accepted decision timestamp or human acceptance digest exists.\n\nThe task contains no real maintainer reference or authority evidence; the repository's founding-policy identified_maintainer_reference is also null. The policy says: “Tools must not populate acceptance based on their own content decisions, repository user.name, a remote owner string, an unauthenticated declarant name or a synthetic test fixture.” This is why conditional instructions to record a real decision are not silently converted into a fabricated one.\n\nThe exact statement, binding digest and required real fields are in docs/OAS_FOUNDING_ACCEPTANCE_RC1.md. Request digest ${request.request_checksum} identifies a proposal only. No handwritten or cryptographic signature is fabricated.\n`);
 out.set('evidence/oas-rc1-issuance/RC1_MEMBERSHIP.md',`# Prepared membership — RC1 NOT ISSUED\n\nProposed/verified count: 14. Accepted count: 0. Issued RC count: 0.\n\n${binding.requirement_ids.map(id=>`- ${id}`).join('\n')}\n\nThese IDs are pinned by source ${preparedRevision}, scope digest ${binding.scope_checksum}, and request ${request.request_checksum}. Deferred IDs OAS-1-REQ-0011, OAS-1-REQ-0013, OAS-1-REQ-0015 remain excluded; no profile or extra requirement is added. Membership is frozen for this acceptance request; issued RC membership cannot be called frozen because no RC exists. Any drift invalidates verification and requires a new explicit governance review/request, never silent regeneration of these bindings.\n`);
 out.set('evidence/oas-rc1-issuance/RC1_PROVENANCE.md',`# Prepared provenance — no RC provenance exists\n\nPrepared source revision: ${preparedRevision}. Verified requirement-content checksum: ${binding.requirements_checksum}. Request checksum: ${request.request_checksum}. Scope: ${binding.scope_checksum}. All are preparation/verification facts, not an RC source revision, acceptance digest or issued artifact checksum.\n\nRC source revision: absent. RC artifact: absent. RC candidate date: absent. RC checksum: absent. No final effective date or final 1.0.0 release exists. The actual canonical acceptance record remains pending. Public-review.1 and its source manifest reproduce from Git.\n`);
 out.set('evidence/oas-rc1-issuance/RC1_VALIDATION.md',`# RC1 validation status\n\nPrepared binding/membership/source verification passes; actual acceptance is missing. Schema/binding guards reject pending, incomplete, stale, wrong-source or final-adoption records. Fields and hashes alone do not authenticate a person or establish consent; operator designation/control checks remain mandatory.\n\nNo issued artifact exists to validate, and no placeholder is created. RC production generation/publication, immutable issued-member freeze and RC-level declaration validation are not claimed. Existing RC-schema tests remain clearly synthetic fixtures only. All original source/catalog/scope/review tests are retained and run; TEST_RESULTS.md records fresh evidence.\n`);
 out.set('evidence/oas-rc1-issuance/REGISTRY_RC1_READINESS.md',`# Registry RC1 readiness\n\n| Field | Classification | Boundary |\n| --- | --- | --- |\n| Standard ID | READY | Existing OAS-1 only |\n| Domain IDs | READY | Existing D01–D08 |\n| RC release ID | BLOCKED | No RC exists |\n| Requirement IDs | BLOCKED | Prepared reserved IDs are not published RC membership |\n| Immutable RC membership | BLOCKED | No issued artifact; prepared request membership only |\n| Declaration contract | READY WITH CONDITIONS | Version 1.1.0 is prepared; cannot resolve nonexistent RC1; legacy historical v1 remains available |\n| Supersession/currentness | READY WITH CONDITIONS | Historical draft metadata only; no RC currentness or replacement event |\n| Profiles | READY WITH CONDITIONS | Intentionally empty; no profile reference resolves |\n| Conformance claims | BLOCKED | NOT_EVALUATED; no scoring, certification or Trust Bureau assessment |\n\nNo field is READY FOR RC TESTING ONLY until a real RC is issued after valid acceptance. No Registry file or OAS consumption code was changed.\n`);
 out.set('evidence/oas-rc1-issuance/FINAL_ADOPTION_GATES.md',`# Remaining final-adoption gates\n\n1. Actual founding maintainer supplies identity/designation evidence and exact acceptance statement/time/decision reference; operator verifies it and records the canonical decision.\n2. Acceptance binds prepared source ${preparedRevision}, exact 14-member scope ${binding.scope_checksum}, full contract digests and issuance of RC1 only.\n3. Every RC gate passes before deterministic source-bound RC issuance; no placeholder and no deferred members.\n4. Validate the real RC, preserve immutable bytes/membership, and issue RC2+ for corrections under a new decision/revision/checksum/changelog.\n5. Complete candidate validation/review dispositions and a separate explicit final-adoption action, release/effective dates and authorized publication of exact final bytes.\n\nFinal adoption status: NOT ADOPTED. This task does not authorize final OAS-1@1.0.0.\n`);
 return out;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const command=process.argv[2]||'verify';
 if(command==='require-acceptance'){requireRealAcceptance();console.log('Acceptance structurally valid; independent authority verification still required.');}
 else if(command==='check'&&loadAcceptance().state==='ACCEPTED'){execFileSync(process.execPath,[path.join(root,'scripts/oas-rc1-release.mjs'),'check'],{cwd:root,stdio:'inherit'});console.log('Recorded acceptance and issued RC1 verified; final adoption NOT ADOPTED.');}
 else if(command==='generate'||command==='check'){for(const [file,content]of generatedPackage()){if(command==='generate'){mkdirSync(path.dirname(path.join(root,file)),{recursive:true});writeFileSync(path.join(root,file),content);}else ensure(readFileSync(path.join(root,file),'utf8')===content,`Acceptance package drift: ${file}`);}console.log('Acceptance package verified; real maintainer action required; RC1 NOT ISSUED.');}
 else{ensure(command==='verify','Unknown acceptance command');const bindings=verifyBindings();console.log(JSON.stringify({verified:bindings,acceptance:acceptanceState(),rc_issued:existsSync(path.join(root,'public/oas/catalogs/OAS-1@1.0.0-rc.1.json'))},null,2));}
}
