#!/usr/bin/env python3
"""Independent byte checks for a proposal; never records adoption or publication."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOLDER = 'standards/oas/governance/final-1.0.0'


def read(file):
    return (ROOT / file).read_bytes()


def load(file):
    return json.loads(read(file))


def serial(value):
    return (json.dumps(value, indent=2, ensure_ascii=False) + '\n').encode()


def digest(value):
    return 'sha256:' + hashlib.sha256(value).hexdigest()


def git(revision, file):
    return subprocess.check_output(['git', 'show', f'{revision}:{file}'], cwd=ROOT)


def verify():
    proposal = load(FOLDER + '/artifact-preview.json')
    bindings = load(FOLDER + '/bindings.json')
    assert proposal['marking'] == bindings['marking'] == 'PROPOSED — NOT ADOPTED — NOT PUBLISHED'
    assert proposal['state'] == 'PROPOSED_NOT_ADOPTED_NOT_PUBLISHED'
    assert proposal['adoption_decision'] is None and proposal['publication_authorization'] is None
    assert bindings['adoption_decision'] is None and bindings['publication_authorization'] is None
    checksum = proposal.pop('artifact_checksum')
    assert checksum == digest(serial(proposal)) == bindings['preview_payload_checksum']
    assert digest(read(FOLDER + '/artifact-preview.json')) == bindings['complete_proposed_preview_file_checksum']
    assert read(FOLDER + '/artifact-preview.json') == serial({**proposal, 'artifact_checksum': checksum})
    binding_checksum = bindings.pop('binding_checksum')
    assert binding_checksum == digest(serial(bindings))
    assert read('evidence/oas-1.0-final-adoption-preparation/FINAL_TARGET_BINDINGS.json') == read(FOLDER + '/bindings.json')
    for file, expected in bindings['schema_checksums'].items():
        assert digest(read(file)) == expected
    assert digest(serial(bindings['source_files'])) == proposal['source_checksum']
    for file in bindings['source_files']:
        assert digest(read(file['path'])) == file['checksum']
        assert read(file['path']) == git(bindings['source_revision'], file['path'])
    rcfile = 'public/oas/catalogs/OAS-1@1.0.0-rc.1.json'
    assert read(rcfile) == git('1e3b4cad34257f207d8adf3d1afb51cc2b1bd2d8', rcfile)
    rc = load(rcfile)
    assert digest(read(rcfile)) == bindings['rc1_artifact_file_checksum']
    assert proposal['requirement_ids'] == rc['requirement_ids'] and len(rc['requirement_ids']) == 14
    assert proposal['domain_ids'] == rc['domain_ids'] and len(rc['domain_ids']) == 8
    accepted = load('evidence/oas-rc1-issuance/RC1_REQUIREMENTS.json')
    project = lambda rows: [{key: row[key] for key in ['requirement_id', 'domain_id', 'normative_text']} for row in rows]
    assert project(proposal['requirements']) == project(accepted)
    assert digest(serial(project(accepted))) == bindings['normative_content_checksum']
    assert digest(serial(accepted)) == proposal['rc1_requirements_checksum']
    assert digest(serial(proposal['requirements'])) == proposal['requirements_checksum']
    assert digest(serial(proposal['release_metadata'])) == bindings['release_metadata_checksum']
    assert proposal['profiles'] == [] and proposal['evaluation_status'] == 'NOT_EVALUATED'
    assert proposal['declaration_contract_version'] == '1.1.0'
    historical = 'public/oas/catalogs/OAS-1@0.0.0-public-review.1.json'
    assert read(historical) == git('1e3b4cad34257f207d8adf3d1afb51cc2b1bd2d8', historical)
    assert digest(read(historical)) == bindings['historical_public_review_file_checksum']
    assert not (ROOT / bindings['publication_target']).exists()
    target_file = ROOT / FOLDER / 'artifact-target.json'
    if bindings['date_specific_final_artifact_file_checksum'] is None:
        assert not target_file.exists()
        assert None in (proposal['release_metadata']['release_date'], proposal['release_metadata']['effective_date'])
    else:
        wrapped = json.loads(target_file.read_bytes())
        assert wrapped['marking'] == 'PROPOSED — NOT ADOPTED — NOT PUBLISHED'
        target = wrapped['target_payload']
        assert digest(serial(target)) == bindings['date_specific_final_artifact_file_checksum']
        assert project(target['requirements']) == project(accepted)
        target_checksum = target.pop('artifact_checksum')
        assert digest(serial(target)) == target_checksum == bindings['date_specific_final_artifact_payload_checksum']
    print('PASS: proposed preview and bindings bytes/checksums, exact normative membership/content, source/schema pins, empty profiles, NOT_EVALUATED, RC/history preservation and no published final. No adoption/publication is performed.')


if __name__ == '__main__':
    verify()
