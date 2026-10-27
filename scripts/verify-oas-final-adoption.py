#!/usr/bin/env python3
"""Independent byte/provenance checks for human adoption with publication withheld."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOLDER = 'standards/oas/governance/final-1.0.0'
PREPARED = 'c1048afb47cbb09decd23b4916149d51ae23d3e8'


def raw(file):
    return (ROOT / file).read_bytes()


def load(file):
    return json.loads(raw(file))


def serial(value):
    return (json.dumps(value, indent=2, ensure_ascii=False) + '\n').encode()


def digest(value):
    return 'sha256:' + hashlib.sha256(value).hexdigest()


def committed(ref):
    return subprocess.check_output(['git', 'show', ref], cwd=ROOT)


def verify():
    file = FOLDER + '/adoption-decision.json'
    record = load(file)
    assert record['state'] == 'ADOPTED' and record['human_actor_reference'] == 'Mike Slate'
    assert record['authorized'] is True and record['publication_authorized'] is False
    assert record['publication_status'] == 'NOT PUBLISHED' and record['published'] is False
    assert raw(file) == serial(record), 'Canonical adoption JSON byte encoding changed'
    checksum = record.pop('record_checksum')
    assert digest(serial(record)) == checksum
    decision_ref = record['immutable_decision_reference']
    assert re.fullmatch(r'[a-f0-9]{40}:docs/OAS_FINAL_ADOPTION_DECISION\.md', decision_ref)
    decision = committed(decision_ref)
    assert decision == raw('docs/OAS_FINAL_ADOPTION_DECISION.md')
    body = re.search(r'```text\n([\s\S]*?)\n```', decision.decode())[1]
    assert body == record['human_statement']
    assert 'explicitly adopt' in body and 'Do NOT publish' in body
    assert ('Decision timestamp (execution UTC): ' + record['decision_timestamp']) in decision.decode()
    assert record['decision_timestamp'] == '2026-10-27T17:28:48.081Z'
    designation = record['authority_evidence_reference']
    assert designation == 'f1060153361ef635c8d26fae91d8a33f031faf31:docs/OAS_FOUNDING_MAINTAINER_DESIGNATION.md'
    assert committed(designation) == raw(designation.split(':', 1)[1])
    for name in ['bindings.json', 'artifact-preview.json', 'artifact-target.json', 'inputs.json', 'final-adoption.template.json', 'publication-authorization.template.json']:
        assert raw(FOLDER + '/' + name) == committed(PREPARED + ':' + FOLDER + '/' + name)
    target = load(FOLDER + '/artifact-target.json')['target_payload']
    bindings = load(FOLDER + '/bindings.json')
    assert digest(serial(target)) == record['final_artifact_checksum'] == 'sha256:9ca2b2b9cc17acd419e9961387e65d0ca3de33fde557d5440f96856dc186892e'
    target_checksum = target.pop('artifact_checksum')
    assert digest(serial(target)) == target_checksum == record['final_artifact_payload_checksum']
    assert digest(serial(target['requirements'])) == record['requirements_checksum'] == 'sha256:37c09a8f92666b10d157d267e480296d9aa614c3299e10060aaa7b414ea50e5d'
    assert record['preparation_binding_checksum'] == bindings['binding_checksum']
    assert record['source_revision'] == target['source_revision'] == '6f145192af25c929c95181fd6cd38f32d7b5ace9'
    assert record['scope_checksum'] == target['scope_checksum'] == 'sha256:14be68339c76888fa1cac497564b6abd427352688ff68c531e8f46b61972d3c4'
    assert record['schema_checksums'] == bindings['schema_checksums']
    for schema, expected in record['schema_checksums'].items():
        assert digest(raw(schema)) == expected
    ids = [f'OAS-1-REQ-{n:04}' for n in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 17]]
    assert record['requirement_ids'] == target['requirement_ids'] == ids
    assert record['domain_ids'] == target['domain_ids'] == [f'OAS-1-D0{n}' for n in range(1, 9)]
    assert record['release_date'] == record['effective_date'] == target['release']['release_date'] == target['release']['effective_date'] == '2026-10-27'
    assert record['declaration_contract_version'] == target['declaration_contract_version'] == '1.1.0'
    assert record['profiles'] == [] and record['evaluation_status'] == 'NOT_EVALUATED'
    assert not (ROOT / record['publication_target']).exists()
    assert not (ROOT / FOLDER / 'publication-authorization.json').exists()
    for public in ['public/oas/catalogs/OAS-1@1.0.0-rc.1.json', 'public/oas/catalogs/OAS-1@0.0.0-public-review.1.json']:
        assert raw(public) == committed(PREPARED + ':' + public)
    print('PASS: actual human adoption, immutable decision/timestamp/authority, exact prepared hashes/membership/dates, schema pins, preserved history, and withheld publication independently verified.')


if __name__ == '__main__':
    verify()
