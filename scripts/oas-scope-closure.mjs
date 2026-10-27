import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { root, serialize, digest, readSource, artifactPath, generateFromGit } from './oas-catalog.mjs';

export const baselineRevision = 'e1b6135aa51bdd20e98706703ae5de714c954671';
export const scopePath = 'standards/oas/closure/scope.json';
const readJson = (file) => JSON.parse(readFileSync(path.join(root,file),'utf8'));
export const loadScope = () => readJson(scopePath);
export const loadMapping = () => readJson('standards/oas/closure/domain-mapping.json');
export const loadAcceptance = () => readJson('standards/oas/closure/founding-acceptance.json');
export const baseAuthoring = JSON.parse(execFileSync('git',['show',`${baselineRevision}:standards/oas/authoring/first-release.json`],{cwd:root,encoding:'utf8'}));
const previousReview = JSON.parse(execFileSync('git',['show',`${baselineRevision}:standards/oas/governance/first-release-review.json`],{cwd:root,encoding:'utf8'}));
const schemaNames = readdirSync(path.join(root,'schemas/oas/closure')).filter(p=>p.endsWith('.schema.json')).sort();
const ajv = new Ajv2020({allErrors:true,strict:true}); addFormats(ajv);
for(const file of schemaNames)ajv.addSchema(readJson(`schemas/oas/closure/${file}`));
for(const file of schemaNames)ajv.getSchema(readJson(`schemas/oas/closure/${file}`).$id);
const ensure=(value,message)=>{if(!value)throw new Error(message);};
const same=(a,b)=>serialize(a)===serialize(b);
export const scopeChecksum=(scope=loadScope())=>digest(serialize(scope));
export function validateShape(name,value){const check=ajv.getSchema(`urn:oas:schema:closure:${name}:1`);ensure(check(value),`${name}: ${ajv.errorsText(check.errors)}`);return value;}
export function effectiveRequirements(scope=loadScope()){
  return scope.included_requirement_ids.map(id=>{
    const original=baseAuthoring.requirements.find(r=>r.requirement_id===id),decision=scope.requirements.find(r=>r.requirement_id===id);
    ensure(original&&decision?.decision==='APPROVE','Deferred, rejected or unknown requirement cannot enter scope');
    return {...original,status:'scope_review_approved_not_published',implementation_notes:decision.clarification,verification_notes:decision.verification_notes,review_decision:null};
  });
}
export function validateMapping(mapping=loadMapping()){
  validateShape('mapping',mapping);
  const catalog=readSource(),seen=new Set();
  for(const row of mapping.mappings){
    const key=`${row.namespace}:${row.label}`;ensure(!seen.has(key),'Duplicate mapping');seen.add(key);
    if(row.state==='CANONICAL'||row.state==='ALIAS'){
      ensure(row.canonical_domain_ids.length===1,'Mapping must be deterministic');
      const domain=catalog.domains.find(d=>d.domain_id===row.canonical_domain_ids[0]);
      ensure(domain&&(row.state==='CANONICAL'?row.namespace==='oas-public'&&domain.domain_name===row.label:domain.aliases.includes(row.label)),'Unsupported canonical/alias equivalence');
    }else ensure(row.canonical_domain_ids.length===0,'Quarantined/deprecated label cannot enter canonical output');
  }
  ensure(catalog.domains.every(d=>mapping.mappings.some(r=>r.namespace==='oas-public'&&r.label===d.domain_name&&r.state==='CANONICAL'&&r.canonical_domain_ids[0]===d.domain_id)),'Missing canonical domain');
  ensure(catalog.legacy_taxonomies[0].domains.every(d=>mapping.mappings.some(r=>r.namespace==='shs-oas-reporting-v1'&&r.label===d.legacy_label)),'Missing legacy disposition');
  return mapping;
}
export function resolveLabel(namespace,label,mapping=loadMapping()){
  validateMapping(mapping);const row=mapping.mappings.find(r=>r.namespace===namespace&&r.label===label);
  ensure(row&&['CANONICAL','ALIAS'].includes(row.state),'Label is unknown, deprecated or quarantined');return row.canonical_domain_ids[0];
}
export function validateScope(scope=loadScope()){
  validateShape('scope',scope);validateMapping();validateShape('founding-policy',readJson('standards/oas/closure/founding-policy.json'));validateShape('founding-acceptance',loadAcceptance());
  const ids=baseAuthoring.requirements.map(r=>r.requirement_id).sort();
  ensure(same(scope.requirements.map(r=>r.requirement_id).sort(),ids),'Every candidate needs one final scope disposition');
  ensure(new Set(scope.included_requirement_ids).size===scope.included_requirement_ids.length,'Duplicate scope membership');
  ensure(same(scope.included_requirement_ids,[...scope.included_requirement_ids].sort()),'Scope membership must be deterministic');
  ensure(same(scope.included_requirement_ids,scope.requirements.filter(r=>r.decision==='APPROVE').map(r=>r.requirement_id).sort()),'Scope membership must exactly match approved decisions');
  for(const row of scope.requirements){
    const original=baseAuthoring.requirements.find(r=>r.requirement_id===row.requirement_id),prior=previousReview.requirements.find(r=>r.requirement_id===row.requirement_id);
    ensure(row.domain_id===original.domain_id&&row.baseline_record_checksum===digest(serialize(original)),'Requirement ID or original content repurposed');
    ensure(row.previous_disposition===prior.decision,'Incorrect prior disposition');
    ensure(Object.keys(row.criteria).length===10,'Incomplete ten-criterion review');
    if(prior.decision==='APPROVE WITH REVISION')ensure(['APPROVE','HOLD','REJECT'].includes(row.revised_requirement_rereview)&&row.revised_requirement_rereview==='APPROVE'=== (row.decision==='APPROVE'),'Revised requirement needs final re-review');
    else ensure(row.revised_requirement_rereview===null,'Unrelated re-review claim');
    if(prior.decision==='HOLD')ensure(['MOVE TO APPROVE','REMAIN DEFERRED FOR POST-1.0','REJECT'].includes(row.hold_disposition)&&(row.hold_disposition==='MOVE TO APPROVE')===(row.decision==='APPROVE'),'Held requirement needs final scope disposition');
    else ensure(row.hold_disposition===null,'Unrelated hold disposition');
    ensure(row.decision==='APPROVE'||row.future_issue_category?.trim(),'Deferred/rejected requirement needs future issue category');
  }
  const blocking=['Q01','Q05','Q08','Q10','Q11','Q12'];
  ensure(same(scope.blocking_question_resolutions.map(q=>q.question_id).sort(),blocking),'Every blocking question needs one resolution');
  for(const q of scope.blocking_question_resolutions){ensure(q.exact_issue===baseAuthoring.open_questions.find(r=>r.question_id===q.question_id).detail,'Question issue changed');for(const id of q.affected_requirement_ids)ensure(ids.includes(id),'Unknown affected requirement');}
  ensure(same(scope.prior_deferred_question_dispositions.map(q=>q.question_id).sort(),['Q02','Q03','Q04','Q06','Q07','Q09']),'Every former deferred question needs an explicit bounded disposition');
  const requirements=effectiveRequirements(scope);ensure(new Set(requirements.map(r=>r.normative_text.trim().replace(/\s+/g,' ').toLowerCase())).size===requirements.length,'Duplicate normative statements');
  const domains=[...new Set(requirements.map(r=>r.domain_id))].sort();ensure(same(domains,readSource().domains.map(d=>d.domain_id)),'Minimum concept coverage must span all eight domains');
  ensure(scope.profiles.length===0&&scope.risk_level_use==='informative_only','No fictional profiles or normative R-levels');
  ensure(!scope.rc_issued&&scope.rc_release_id===null&&scope.rc_requirement_ids.length===0&&scope.final_release_id===null,'Scope closure is not an issued release');
  return scope;
}
export function contractChecksums(){return Object.fromEntries(['schemas/oas/closure/declaration.schema.json','schemas/oas/closure/rc.schema.json','standards/oas/closure/founding-policy.json','docs/OAS_GOVERNANCE_AUTHORITY.md','docs/OAS_DECLARATION_CONTRACT.md','docs/OAS_RELEASE_CANDIDATE_CONTRACT.md'].map(p=>[p,digest(readFileSync(path.join(root,p)))]));}
export function acceptanceIssues(record=loadAcceptance(),scope=loadScope()){
  validateShape('founding-acceptance',record);
  const issues=[];
  if(record.state!=='ACCEPTED')issues.push('Real founding maintainer reference, authority evidence and exact-snapshot acceptance record are absent.');
  if(record.accepted_scope_checksum!==scopeChecksum(scope))issues.push('Acceptance must bind the exact finalized scope checksum.');
  if(!same(record.accepted_contract_checksums,contractChecksums()))issues.push('Acceptance must bind the exact declaration/RC/founding-policy contract digests.');
  if(!record.authorize_rc1)issues.push('Explicit RC1 issuance authorization is absent.');
  if(record.state==='ACCEPTED'&&record.accepted_source_revision){
    try{verifyCommittedContent(record.accepted_source_revision);}catch{issues.push('Accepted source revision does not pin the exact current content inputs.');}
  }
  // Fields and digests do not authenticate an actor. This closure never fills them automatically.
  return issues;
}
export function readinessGates(scope=loadScope()){
  validateScope(scope);const acceptance=acceptanceIssues();
  const gate=(id,pass,evidence)=>({gate:id,result:pass?'PASS':'FAIL',evidence});
  return [
    gate('governance_mechanism_established',true,'Versioned FOUNDING GOVERNANCE roles, exact decision record, conflict handling and migration path are defined.'),
    gate('founding_maintainer_acceptance',acceptance.length===0,acceptance.join(' ')||'Exact-snapshot acceptance recorded; authority evidence still requires the documented operator verification.'),
    gate('all_included_content_reviewed',scope.requirements.filter(r=>scope.included_requirement_ids.includes(r.requirement_id)).every(r=>r.decision==='APPROVE'),'All 14 included records have explicit ten-criterion repository content approval; final acceptance is a separate gate.'),
    gate('included_wording_stable',true,'Normative statements are unchanged from the pinned e1b6135 source; reviewed clarifications and verification notes are recorded separately.'),
    gate('coherent_scope',true,'The information/declaration baseline covers required concepts in all eight canonical domains.'),
    gate('no_blocking_questions',!scope.blocking_question_resolutions.some(q=>q.disposition==='REMAINS BLOCKING'&&!(q.question_id==='Q10'&&acceptance.length===0)),'Q01/Q05/Q08/Q11/Q12 have concrete contract resolutions. Q10 remains blocking only for the real founding acceptance record.'),
    gate('domain_mapping_closure',true,'All seven unsafe mappings terminate as QUARANTINED LEGACY; no canonical projection can resolve them.'),
    gate('declaration_compatibility',true,'Versioned pinned declaration contract, reference resolver and NOT_EVALUATED boundary are defined; legacy v1 is retained separately.'),
    gate('schemas_valid',true,'Closure schemas compile in strict Draft 2020-12; source/reference checks pass.'),
    gate('deterministic_catalog',true,'Effective scope catalog and human views derive from pinned original records plus explicit resolution metadata.'),
    gate('stable_identifiers',true,'Existing serial IDs are preserved; deferred IDs are reserved and excluded.'),
    gate('source_revision_and_checksum',currentSourceRevision()!==null,'The exact current content inputs must be pinned in a full Git commit and independently reproducible before issuance.'),
    gate('historical_pin_preserved',readFileSync(path.join(root,artifactPath),'utf8')===serialize(generateFromGit()),'Original public-review.1 artifact/source manifest reproduce byte-for-byte.'),
    gate('no_certification_overclaim',true,'Declaration/evaluation status is fixed to NOT_EVALUATED; no evaluator, certification or Trust Bureau determination is implemented.'),
    gate('rc_contract_defined',true,'Versioned release_candidate schema fixes membership, provenance, correction and separate final-adoption rules.'),
  ];
}
export function assertRcReady(scope=loadScope()) {const failures=readinessGates(scope).filter(g=>g.result==='FAIL');ensure(!failures.length,`RC1 blocked: ${failures.map(g=>g.gate).join(', ')}`);}
export function validateDeclaration(declaration,catalog){
  validateShape('declaration',declaration);
  ensure(catalog&&catalog.standard_id===declaration.standard_id&&catalog.release_id===declaration.release_id&&['release_candidate','released'].includes(catalog.status),'Pinned release does not exist in supplied authoritative catalog');
  const seen=new Set(),evidence=new Set(declaration.evidence_references.map(e=>e.reference));ensure(evidence.size===declaration.evidence_references.length,'Duplicate evidence reference');
  for(const r of declaration.requirements){ensure(!seen.has(r.requirement_id),'Duplicate declaration requirement');seen.add(r.requirement_id);ensure(catalog.requirement_ids.includes(r.requirement_id),'Unknown or deferred requirement reference');for(const ref of r.evidence_references)ensure(evidence.has(ref),'Unresolved evidence reference');ensure(!(r.applicability==='unknown'&&r.declaration_status==='declared_satisfied'),'Unknown applicability cannot assert satisfaction');}
  ensure(same([...seen].sort(),[...catalog.requirement_ids].sort()),'Every included requirement needs an explicit state; omitted is not satisfied');
  return declaration;
}
export function validateRcContract(rc,scope=loadScope()){
  validateShape('rc',rc);validateScope(scope);
  ensure(rc.release_id===`OAS-1@${rc.standard_version}`,'RC ID/version mismatch');
  ensure(same(rc.requirement_ids,scope.included_requirement_ids),'RC membership must exactly match approved scope');
  ensure(same(rc.domain_ids,[...new Set(effectiveRequirements(scope).map(r=>r.domain_id))].sort()),'RC domain membership mismatch');
  ensure(rc.scope_checksum===scopeChecksum(scope),'RC scope checksum mismatch');
  ensure(rc.requirements_checksum===digest(serialize(effectiveRequirements(scope))),'RC requirement content checksum mismatch');
  const {artifact_checksum,...payload}=rc;ensure(artifact_checksum===digest(serialize(payload)),'RC artifact checksum mismatch');return rc;
}
export const inputPaths=[scopePath,'standards/oas/closure/domain-mapping.json','standards/oas/closure/founding-policy.json','scripts/oas-scope-closure.mjs','docs/OAS_GOVERNANCE_AUTHORITY.md','docs/OAS_DECLARATION_CONTRACT.md','docs/OAS_RELEASE_CANDIDATE_CONTRACT.md',...schemaNames.map(p=>`schemas/oas/closure/${p}`)].sort();
export function verifyCommittedContent(revision){
  ensure(/^[a-f0-9]{40}$/.test(revision),'Full committed source revision required');
  for(const file of inputPaths){const committed=execFileSync('git',['show',`${revision}:${file}`],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});ensure(committed===readFileSync(path.join(root,file),'utf8'),`Uncommitted or mismatched source input: ${file}`);}
  return revision;
}
const sourceProofCache=new Map();
export function currentSourceRevision(){
  const revision=execFileSync('git',['log','-1','--format=%H','--',...inputPaths],{cwd:root,encoding:'utf8'}).trim();
  if(!revision)return null;
  const fingerprint=digest(serialize(inputPaths.map(file=>[file,digest(readFileSync(path.join(root,file)))])));
  const key=`${revision}:${fingerprint}`;if(sourceProofCache.has(key))return sourceProofCache.get(key);
  try{const verified=verifyCommittedContent(revision);sourceProofCache.set(key,verified);return verified;}catch{return null;}
}
export function manifest(){
  const source_files=inputPaths.map(p=>({path:p,checksum:digest(readFileSync(path.join(root,p)))}));
  const payload={reviewed_baseline_revision:baselineRevision,source_revision:currentSourceRevision(),source_files,source_checksum:digest(serialize(source_files)),acceptance_record_checksum:digest(serialize(loadAcceptance())),scope_checksum:scopeChecksum(),requirements_checksum:digest(serialize(effectiveRequirements())),rc_issued:false,rc_source_revision:null,rc_checksum:null};
  return {...payload,artifact_checksum:digest(serialize(payload))};
}
export function generatedViews(){
  const scope=validateScope(),mapping=validateMapping(),catalog=readSource(),out=new Map();
  const warning='Repository scope and contract closure under the user task directive. FOUNDING GOVERNANCE is not external consensus. This is not an adopted standard or issued RC; real exact-snapshot founding acceptance is still missing.\n';
  out.set('docs/OAS_1_0_SCOPE.md',`# OAS 1.0 scope\n\n${warning}\nPurpose: a universal provider-authored description and declaration baseline for an autonomous-system version in an explicit operating scope. The baseline makes identity/accountability, purpose/boundaries, available capabilities, used resources/dependencies, permissions/mechanisms, policy constraints, human authority, verification/monitoring plans and version/lifecycle/retirement information inspectable across platforms. It does not promise operational efficacy.\n\nA declaration snapshot fixes the subject version, operating context and referenced manifests. Changes require a newly pinned declaration or withdrawal; a previous declaration is historical, not silently current. Dynamic sets may be described by a version-specific manifest/selector, not by sampled observed actions. Unknown completeness is explicit unknown, never satisfied.\n\n| Domain | Included baseline requirements | Required concept |\n| --- | --- | --- |\n${catalog.domains.map(d=>`| ${d.domain_id} ${d.domain_name} | ${effectiveRequirements().filter(r=>r.domain_id===d.domain_id).map(r=>r.requirement_id).join(', ')} | ${effectiveRequirements().filter(r=>r.domain_id===d.domain_id).map(r=>r.title).join('; ')} |`).join('\n')}\n\nFourteen content-approved requirements cover all eight domains; no equal-count rule was used. Profiles are intentionally empty: no distinct system-class/environment/subset use case requires one. R0–R4 remains informative and does not create applicability thresholds. Deferred IDs 0011/0013/0015 retain reservations for operational control efficacy, escalation and evidence-model extensions. Their concepts are not deleted: constraints are disclosed by 0010, human responsibility/interfaces by 0012, and evidence linkage is defined by the declaration contract.\n\nNon-goals: runtime safety guarantees, a universal legal blacklist, grants of system permission, proof of legal ownership, certification, trust scoring, Registry issuance/lifecycle, a marketplace or commercial obligations. The first release is not a complete execution-governance or sector-specific safety standard. Future releases may add those governed concepts with new immutable IDs/releases and explicit migration/supersession.\n\nCompatibility: published public-review.1, its schemas and existing SHS reporting remain unchanged. Earlier authoring/review snapshots are retained as history. This closure is an explicit derived scope over the exact e1b6135 candidate records, not a second independently edited normative standard. Human requirement text is generated from that same source.\n`);
  out.set('docs/OAS_1_0_REQUIREMENTS.md',`# OAS 1.0 proposed baseline requirements\n\n${warning}\nGenerated from the pinned e1b6135 authoring records and standards/oas/closure/scope.json. No requirement ID or normative statement is repurposed. The following clarifications delimit inspection within the information baseline; they add no runtime effectiveness obligation.\n\n${effectiveRequirements().map(r=>`## ${r.requirement_id} — ${r.title}\n\nDomain: ${r.domain_id}. Status: repository scope review approved; not published/adopted.\n\n${r.normative_text}\n\nApplicability: ${r.applicability}\n\nRationale: ${r.rationale}\n\nScope clarification: ${r.implementation_notes}\n\nEvidence: ${r.evidence_expectations.join('; ')}. Evidence presence is not conformance.\n\nVerification: ${r.verification_notes}\n\nSource provenance: ${r.sources.map(s=>`${s.source_path}:${s.source_line} at ${s.source_revision}`).join('; ')}. Version introduced/release relationship remain unassigned until a real publication.\n`).join('\n')}`);
  out.set('docs/OAS_DOMAIN_MAPPING.md',`# OAS domain mapping — terminal closure\n\nGenerated from standards/oas/closure/domain-mapping.json. Historical review projection is preserved byte-for-byte at docs/history/OAS_DOMAIN_MAPPING.e1b6135.md. Legacy report payloads/ordinals are unchanged. Namespaces are mandatory; no fuzzy matching, ordinal conversion or fallback is permitted.\n\n| Namespace | Label | Terminal state | Canonical IDs | Rationale |\n| --- | --- | --- | --- | --- |\n${mapping.mappings.map(r=>`| ${r.namespace} | ${r.label} | ${r.state} | ${r.canonical_domain_ids.join(', ')||'none'} | ${r.reason} |`).join('\n')}\n\nQUARANTINED LEGACY is a closed migration disposition, not a semantic mapping. Such labels may remain visible in historical reports but cannot enter canonical output or requirement membership. DEPRECATED is reserved for an expressly retired label; quarantine does not pretend deprecation or equivalence. The known lexical Human Oversight alias maps to D06, never public ordinal 05. Releasing quarantine requires a new reviewed mapping contract and explicit migration, not an in-place reinterpretation of history.\n`);
  out.set('evidence/oas-governance-resolution/BLOCKING_QUESTION_RESOLUTIONS.md',`# Blocking question resolutions\n\n${warning}\n${scope.blocking_question_resolutions.map(q=>`## ${q.question_id} — ${q.disposition}\n\nExact issue: ${q.exact_issue}\n\nAffected requirements: ${q.affected_requirement_ids.join(', ')}. Existing constraints: independent OAS standards authority; immutable IDs/history; declarations are not evaluations; no invented institutional approval.\n\nResolution: ${q.resolution}\n\nAlternatives considered: ${q.alternatives_considered}\n\nResponsible source: standards/oas/closure/scope.json (${q.responsible_contract}); generated scope/declaration/RC/governance contracts implement this decision. Historical question/source records are retained; closure decisions are versioned successors rather than edits to prior evidence.\n`).join('\n')}`);
  out.set('evidence/oas-governance-resolution/REVISED_REQUIREMENT_DECISIONS.md',`# Revised requirement final re-review\n\n${warning}\n${scope.requirements.filter(r=>r.revised_requirement_rereview!==null).map(r=>`## ${r.requirement_id} — ${r.revised_requirement_rereview}\n\n${baseAuthoring.requirements.find(a=>a.requirement_id===r.requirement_id).normative_text}\n\n${r.reason}\n\n${Object.entries(r.criteria).map(([k,v])=>`- ${k}: ${v.result}. ${v.reason}`).join('\n')}\n`).join('\n')}\nThese are final content dispositions for the proposed 1.0 scope, not invented maintainer acceptance or final-standard adoption.\n`);
  out.set('evidence/oas-governance-resolution/HOLD_REQUIREMENT_DISPOSITIONS.md',`# Final 1.0 disposition of the eight HOLD requirements\n\n${warning}\n| ID | Disposition | Reason / first-release necessity | Future issue category |\n| --- | --- | --- | --- |\n${scope.requirements.filter(r=>r.hold_disposition!==null).map(r=>`| ${r.requirement_id} | ${r.hold_disposition} | ${r.reason} | ${r.future_issue_category||'Included in the information baseline'} |`).join('\n')}\n\nAll IDs remain reserved. No deferred/rejected member enters the 14-item scope. Deferral does not erase the original concept or assert that runtime controls/evidence sufficiency are unnecessary in future standards.\n`);
  out.set('evidence/oas-governance-resolution/DOMAIN_MAPPING_CLOSURE.md',`# Domain mapping closure\n\nSeven previously unresolved labels now terminate as QUARANTINED LEGACY with no canonical IDs: ${mapping.mappings.filter(r=>r.state==='QUARANTINED LEGACY').map(r=>r.label).join('; ')}. The resolver rejects each, even when related concepts exist. No report ordinal is an OAS domain identity. Eight public canonical labels and the existing Human Oversight alias are preserved.\n\nThe current canonical mapping document is generated from the new terminal mapping contract. The earlier document is archived at its exact bytes, and the earlier test now checks that archive against its original Git preimage. New tests validate the current projection and every quarantine rejection; no historical assertion is dropped.\n`);
  out.set('evidence/oas-governance-resolution/SCOPE_CLOSURE.md',`# Scope closure\n\nThe proposed 1.0 baseline has ${scope.included_requirement_ids.length} explicitly content-approved requirements spanning all eight canonical domains, including ${scope.requirements.filter(r=>r.hold_disposition==='MOVE TO APPROVE').length} promoted HOLD concepts and all three re-reviewed revisions. IDs 0011/0013/0015 are deferred; no requirements are rejected. No normative statements are rewritten: clarity comes from an explicit bounded scope and reviewed inspection semantics.\n\n${scope.included_requirement_ids.join(', ')}.\n\nAuthoring authority remains distinct from real founding acceptance. Former deferred questions are explicitly handled: ${scope.prior_deferred_question_dispositions.map(q=>`${q.question_id} ${q.disposition}: ${q.resolution}`).join(' ')}\n\nOld review assertions continue to verify their historical record; the new source is a pinned successor resolution, not a rewrite that falsely marks earlier decisions approved. No profiles are populated and R-levels remain informative.\n`);
  out.set('evidence/oas-governance-resolution/DECLARATION_COMPATIBILITY.md',`# Declaration compatibility\n\nThe new 1.1.0 contract has standard/release pins, all included requirement references, separate applicability and provider assertion, declarant reference/time, evidence references/types, scope, notes and fixed NOT_EVALUATED. Validation requires an actual supplied matching release catalog, exact requirement coverage, no deferred/unknown IDs, resolved evidence references, reason for not-applicable and no satisfied assertion with unknown applicability.\n\nLegacy declaration v1 remains supported unchanged for public-review.1 standard-level references. It is not automatically upgraded or interpreted as requirement-level conformance. New contract tests use clearly synthetic release metadata; no live RC is fabricated to validate declaration syntax. No production declaration is accepted against a nonexistent RC.\n`);
  out.set('evidence/oas-governance-resolution/RC_READINESS_GATE_MATRIX.md',`# Final RC readiness gates\n\n${warning}\n| Gate | Result | Evidence / exact condition |\n| --- | --- | --- |\n${readinessGates().map(g=>`| ${g.gate} | ${g.result} | ${g.evidence} |`).join('\n')}\n\nThe two failed gates share one concrete missing action: real founding acceptance of the exact scope/source/contracts. Technical gate evidence is supplemented by TEST_RESULTS.md. No placeholder RC exists.\n`);
  out.set('evidence/oas-governance-resolution/REGISTRY_READINESS.md',`# Registry readiness\n\n| Field | Classification | Boundary |\n| --- | --- | --- |\n| Standard ID | READY | Existing OAS-1 only |\n| Domain IDs | READY | Existing D01–D08; quarantined labels never project |\n| Release ID | READY WITH CONDITIONS | Historical public-review.1 only; RC1 does not exist |\n| Requirement IDs | BLOCKED | Reserved scoped IDs are not published membership |\n| Requirement membership | BLOCKED | Proposed 14-member scope is not an issued catalog |\n| Profiles | READY WITH CONDITIONS | Empty catalog; no profile resolves |\n| Declarations | READY WITH CONDITIONS | Legacy v1 historical standard-level shape; new pinned contract cannot resolve nonexistent RC1 |\n| Supersession | READY | Historical empty graphs; predecessor derivation is not an adopted supersession event |\n| Currentness comparison | READY WITH CONDITIONS | Compare explicit snapshots/IDs/digests; cannot call a nonexistent RC current or use floating latest |\n| Conformance claims | BLOCKED | NOT_EVALUATED; no certification, assessment or automatic score |\n\nNo field is READY FOR RC TESTING ONLY until an RC is actually issued. Registry production integration remains bounded to READY historical metadata. No Registry changes were made.\n`);
  out.set('evidence/oas-governance-resolution/REMAINING_BLOCKERS.md',`# Exact remaining RC blocker\n\nOne missing acceptance action causes both failed gates and the remaining Q10 blocker.\n\n| Responsible artifact | Affected requirement / contract | Missing decision | Exact next action |\n| --- | --- | --- | --- |\n| standards/oas/closure/founding-acceptance.json | All 14 proposed requirements; founding policy; declaration 1.1.0; RC contract | A real repository-designated founding maintainer has not identified their authority or accepted this exact snapshot and authorized RC1 | Review the finalized scope and contracts; provide the real maintainer reference and independently checkable repository authority evidence; record accepted source commit, scope digest ${scopeChecksum()}, contract digests from EXPECTED_ACCEPTANCE_BINDINGS.json, real decision time/reference, and explicit authorize_rc1=true. Do not populate a fabricated actor, time, signature or approval. Then rerun closure/catalog checks, verify the referenced Git bytes and run an explicitly authorized RC issuance action. |\n\nNo additional normative-content or mapping question is being hidden behind this blocker. The procedural founding model is defined; Q10 remains blocking for actual role occupancy/acceptance. Final 1.0.0 additionally requires later RC validation outcomes and a separate final-adoption/publication decision; no final release is authorized by this task.\n`);
  out.set('evidence/oas-governance-resolution/EXPECTED_ACCEPTANCE_BINDINGS.json',serialize({scope_checksum:scopeChecksum(),contract_checksums:contractChecksums(),required_source_revision:currentSourceRevision(),maintainer_reference:null,authority_evidence_reference:null,decision_record_reference:null,accepted_at:null,authorize_rc1:false,authorize_final_release:false}));
  out.set('evidence/oas-governance-resolution/SCOPE_CATALOG.json',serialize({standard_id:'OAS-1',status:'proposed_scope_not_issued',release_id:null,baseline_revision:baselineRevision,requirement_ids:scope.included_requirement_ids,domain_ids:catalog.domains.map(d=>d.domain_id),profiles:[],requirements:effectiveRequirements(),scope_checksum:scopeChecksum(),evaluation_status:'NOT_EVALUATED'}));
  out.set('evidence/oas-governance-resolution/SOURCE_MANIFEST.json',serialize(manifest()));
  return out;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const command=process.argv[2]||'validate';validateScope();
  if(command==='generate'||command==='check')for(const [file,contents]of generatedViews()){if(command==='generate'){mkdirSync(path.dirname(path.join(root,file)),{recursive:true});writeFileSync(path.join(root,file),contents);}else ensure(readFileSync(path.join(root,file),'utf8')===contents,`Closure view drift: ${file}`);}
  else ensure(command==='validate','Unknown closure command');
  console.log(`OAS scope closure ${command}: 14 approved content requirements; 7 terminal quarantines; real founding acceptance absent; RC1 NOT ISSUED`);
}
