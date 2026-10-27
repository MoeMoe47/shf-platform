#!/usr/bin/env python3
"""Independent SHA-256/raw-byte/provenance verification of the published final pin."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='164798c8a684e4c3605fc89492918ca00552e70b'
FOLDER='standards/oas/governance/final-1.0.0/'
def raw(f):return (ROOT/f).read_bytes()
def load(f):return json.loads(raw(f))
def encode(v):return (json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode()
def digest(v):return 'sha256:'+hashlib.sha256(v).hexdigest()
def git(*args,input=None):return subprocess.check_output(['git',*args],cwd=ROOT,input=input)
def seal(record):
 payload=dict(record);checksum=payload.pop('record_checksum');assert checksum==digest(encode(payload));return checksum

def main():
 files=git('ls-tree','-r','--name-only',BASE).decode().splitlines()
 files=[f for f in files if re.match(r'^(standards/oas/|schemas/oas/|public/oas/|docs/OAS|evidence/oas|scripts/(oas-|verify-oas)|tests/oas)',f)]
 response=git('cat-file','--batch',input=('\n'.join(BASE+':'+f for f in files)+'\n').encode());offset=0
 for f in files:
  end=response.index(b'\n',offset);header=response[offset:end].split();assert header[1]==b'blob';size=int(header[2]);offset=end+1
  assert raw(f)==response[offset:offset+size],f'Immutable adoption checkpoint mismatch: {f}';offset+=size+1
 a=load(FOLDER+'adoption-decision.json');auth=load(FOLDER+'publication-authorization.json');pub=load(FOLDER+'publication-record.json');lock=load(FOLDER+'publication-lock.json');bound=load(FOLDER+'bindings.json');target=load(FOLDER+'artifact-target.json')['target_payload'];artifact=raw('public/oas/catalogs/OAS-1@1.0.0.json');current=load('public/oas/currentness.json')
 for r in [a,auth,pub,lock]:seal(r)
 assert a['state']=='ADOPTED' and a['human_actor_reference']==auth['human_actor_reference']=='Mike Slate'
 assert auth['record_kind']=='FINAL_PUBLICATION_AUTHORIZATION' and auth['state']=='AUTHORIZED' and auth['publication_authorized'] is True and auth['external_deployment_authorized'] is False
 assert auth['adoption_decision_reference']==a['immutable_decision_reference'] and auth['adoption_record_checksum']==a['record_checksum']
 assert git('show',a['immutable_decision_reference'])==raw('docs/OAS_FINAL_ADOPTION_DECISION.md')
 decision=git('show',auth['immutable_decision_reference']);assert decision==raw('docs/OAS_FINAL_PUBLICATION_AUTHORIZATION.md')
 assert re.search(rb'```text\n([\s\S]*?)\n```',decision).group(1).decode()==auth['human_statement']
 assert ('Authorization timestamp (execution UTC): '+auth['decision_timestamp']).encode() in decision
 assert auth['decision_timestamp']=='2026-10-27T17:56:47.580Z'
 assert auth['authority_evidence_reference']==a['authority_evidence_reference']
 assert git('show',a['authority_evidence_reference'])==raw('docs/OAS_FOUNDING_MAINTAINER_DESIGNATION.md')
 assert artifact==encode(target) and digest(artifact)=='sha256:9ca2b2b9cc17acd419e9961387e65d0ca3de33fde557d5440f96856dc186892e'
 payload=dict(target);checksum=payload.pop('artifact_checksum');assert checksum==digest(encode(payload))==a['final_artifact_payload_checksum']==lock['artifact_payload_checksum']
 assert digest(encode(target['requirements']))==a['requirements_checksum']==auth['requirements_checksum']==lock['requirements_checksum']=='sha256:37c09a8f92666b10d157d267e480296d9aa614c3299e10060aaa7b414ea50e5d'
 assert target['scope_checksum']==a['scope_checksum']==auth['scope_checksum']==lock['scope_checksum']=='sha256:14be68339c76888fa1cac497564b6abd427352688ff68c531e8f46b61972d3c4'
 ids=['OAS-1-REQ-'+str(n).zfill(4) for n in [1,2,3,4,5,6,7,8,9,10,12,14,16,17]];domains=['OAS-1-D0'+str(n) for n in range(1,9)]
 assert target['requirement_ids']==auth['requirement_ids']==lock['requirement_ids']==ids
 assert [r['requirement_id'] for r in target['requirements']]==ids and target['domain_ids']==auth['domain_ids']==lock['domain_ids']==domains
 assert sorted(set(r['domain_id'] for r in target['requirements']))==domains
 original=json.loads(git('show','517cc23426e7485c352a1672c8fe4614291d552a:standards/oas/authoring/first-release.json'))['requirements']
 for row in target['requirements']:
  old=next(r for r in original if r['requirement_id']==row['requirement_id']);assert (row['normative_text'],row['domain_id'])==(old['normative_text'],old['domain_id'])
 assert target['source_revision']==auth['source_revision']==a['source_revision']=='6f145192af25c929c95181fd6cd38f32d7b5ace9'
 assert target['release']['release_date']==target['release']['effective_date']==auth['release_date']==auth['effective_date']=='2026-10-27'
 for r in [target,auth,lock]:assert r['profiles']==[] and r['declaration_contract_version']=='1.1.0' and r['evaluation_status']=='NOT_EVALUATED'
 for f,h in bound['schema_checksums'].items():assert digest(raw(f))==h
 for f in bound['source_files']:assert digest(raw(f['path']))==f['checksum']
 assert pub['authorization_record_checksum']==auth['record_checksum'] and pub['authorization_decision_reference']==auth['immutable_decision_reference']
 assert pub['publication_status']=='PUBLISHED' and pub['final_adoption_status']=='ADOPTED' and pub['external_deployment_performed'] is False
 assert lock['publication_record_checksum']==pub['record_checksum'] and lock['artifact_file_checksum']==pub['artifact_file_checksum']==digest(artifact)
 assert lock['currentness_file_checksum']==digest(raw('public/oas/currentness.json')) and lock['human_standard_file_checksum']==digest(raw('public/oas/OAS-1@1.0.0.md'))
 assert current['current_adopted_release_id']=='OAS-1@1.0.0' and current['predecessor_reference']=='OAS-1@1.0.0-rc.1' and current['normative_supersedes']==[]
 assert [r['role'] for r in current['releases']]==['CURRENT_ADOPTED','HISTORICAL_RELEASE_CANDIDATE','HISTORICAL_PUBLIC_REVIEW']
 assert lock['rc1_file_checksum']==digest(raw('public/oas/catalogs/OAS-1@1.0.0-rc.1.json'))==bound['rc1_artifact_file_checksum']
 assert lock['public_review_file_checksum']==digest(raw('public/oas/catalogs/OAS-1@0.0.0-public-review.1.json'))==bound['historical_public_review_file_checksum']
 changed=git('diff',BASE,'--name-only','--','apps','services','src','contracts').strip();assert not changed,'Protected system changed'
 print('PASS: independent final/adoption/authorization provenance, exact raw/payload/content hashes, 14 requirements, 8 domains, dates, schema/source pins, empty profiles, NOT_EVALUATED, currentness, immutable history and authority boundaries.')
if __name__=='__main__':main()
