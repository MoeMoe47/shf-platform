#!/usr/bin/env python3
"""Independent, standard-library checksum verification of the issued OAS RC1."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(file):
    return json.loads((ROOT / file).read_text())


def serialized(value):
    return (json.dumps(value, indent=2, ensure_ascii=False) + '\n').encode()


def digest(value):
    return 'sha256:' + hashlib.sha256(value).hexdigest()


def committed(revision, file):
    return subprocess.check_output(['git', 'show', f'{revision}:{file}'], cwd=ROOT)


def verify():
    request = load('standards/oas/governance/rc1-acceptance-request.json')
    checksum = request.pop('request_checksum')
    assert checksum == digest(serialized(request)), 'Acceptance request payload mismatch'
    assert checksum == 'sha256:88364ed78cb96c247359c0c55ebd6fe26e0367f78b8c84b93dd137d508296012'
    bindings = request['verified_bindings']
    revision = bindings['prepared_source_revision']
    for file, expected in bindings['contract_checksums'].items():
        assert digest((ROOT / file).read_bytes()) == expected, file
        assert digest(committed(revision, file)) == expected, file
    for artifact in bindings['supporting_artifacts']:
        file = artifact['path']
        assert digest((ROOT / file).read_bytes()) == artifact['checksum'], file
        assert digest(committed(artifact['source_revision'], file)) == artifact['checksum'], file
    expected_file = bindings['expected_bindings_path']
    assert digest((ROOT / expected_file).read_bytes()) == bindings['expected_bindings_checksum']
    assert (ROOT / expected_file).read_bytes() == committed('3e3a6585da2117a37f959f8630dc7cf8300b648c', expected_file)
    acceptance = load('standards/oas/closure/founding-acceptance.json')
    lock = load('standards/oas/governance/rc1-publication-lock.json')
    rc = load(lock['artifact_path'])
    checksum = rc.pop('artifact_checksum')
    assert checksum == digest(serialized(rc)) == lock['artifact_checksum']
    assert digest((ROOT / lock['artifact_path']).read_bytes()) == lock['artifact_file_checksum']
    assert digest(serialized(acceptance)) == lock['acceptance_record_checksum']
    assert rc['source_revision'] == acceptance['accepted_source_revision'] == revision
    assert rc['requirement_ids'] == bindings['requirement_ids'] == lock['requirement_ids']
    assert len(rc['requirement_ids']) == 14 and len(set(rc['domain_ids'])) == 8
    assert rc['scope_checksum'] == bindings['scope_checksum']
    assert digest((ROOT / 'standards/oas/closure/scope.json').read_bytes()) == rc['scope_checksum']
    source = load('evidence/oas-rc1-issuance/RC1_SOURCE_MANIFEST.json')
    assert digest(serialized(source['source_files'])) == rc['source_checksum']
    assert source['rc_issued'] and source['rc_checksum'] == checksum
    assert source['rc_source_revision'] == revision
    source_artifact_checksum = source.pop('artifact_checksum')
    assert digest(serialized(source)) == source_artifact_checksum
    for artifact in source['source_files']:
        assert digest(committed(revision, artifact['path'])) == artifact['checksum']
    assert digest((ROOT / 'evidence/oas-rc1-issuance/RC1_REQUIREMENTS.json').read_bytes()) == rc['requirements_checksum'] == bindings['requirements_checksum']
    historical = bindings['historical_public_review']
    assert digest((ROOT / historical['path']).read_bytes()) == historical['artifact_file_checksum']
    assert (ROOT / historical['path']).read_bytes() == committed('356f757', historical['path'])
    decision_sha, decision_path = acceptance['decision_record_reference'].split(':', 1)
    assert committed(decision_sha, decision_path) == (ROOT / decision_path).read_bytes()
    assert not acceptance['authorize_final_release'] and lock['final_adoption_status'] == 'NOT ADOPTED'
    print('PASS: independently verified request, accepted source/contracts/supporting files, scope, requirements, acceptance, immutable decision, RC payload/file/source checksums and historical public review.')


if __name__ == '__main__':
    verify()
