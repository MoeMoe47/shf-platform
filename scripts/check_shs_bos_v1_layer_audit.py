#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; AUDIT=ROOT/'docs'/'v1-layer-audit'
REQUIRED=['SHS_BOS_V1_MASTER_LAYER_INVENTORY.md','SHS_BOS_V1_MASTER_LAYER_INVENTORY.json','SHS_BOS_V1_LAYER_EVIDENCE_MATRIX.md','SHS_BOS_V1_LAYER_EVIDENCE_MATRIX.json','SHS_BOS_V1_DEPENDENCY_MAP.md','SHS_BOS_V1_GAP_AND_DUPLICATION_AUDIT.md','SHS_BOS_V1_CRITICAL_PATH_INPUTS.md','SHS_BOS_V1_UNRESOLVED_QUESTIONS.md','SHS_BOS_V1_AUDIT_SUMMARY.md','SHS_BOS_V1_REPO_SNAPSHOT.txt','SHS_BOS_V1_LAYER_CONNECTION_MATRIX.md','SHS_BOS_V1_LAYER_CONNECTION_MATRIX.json','SHS_BOS_V1_ORPHAN_AND_DEAD_END_REGISTRY.md','SHS_BOS_V1_ORPHAN_AND_DEAD_END_REGISTRY.json','SHS_BOS_V1_OPERATIONAL_CHAIN_AUDIT.md','SHS_BOS_V1_OPERATIONAL_CHAIN_AUDIT.json','SHS_BOS_V1_PERSISTENCE_AND_STATE_AUDIT.md','SHS_BOS_V1_SECURITY_AND_GOVERNANCE_AUDIT.md','SHS_BOS_V1_REPORTING_AND_AI_GROUNDING_AUDIT.md','SHS_BOS_V1_RECOMMENDED_OFFICIAL_LAYER_REGISTRY.md','SHS_BOS_V1_RECOMMENDED_OFFICIAL_LAYER_REGISTRY.json']
STATUS={'not_found','proposed_only','architecture_defined','scaffolded','partially_implemented','implemented_not_integrated','integrated_not_validated','validated_not_hardened','v1_ready','v1_certified','deprecated','archived','duplicate_candidate','ownership_unclear'}; CONN_STATUS={'fully_connected','connected_with_limitations','partially_connected','one_way_only','mock_only','documentation_only','not_connected','broken','duplicate_path','ownership_unclear','external_dependency','unknown'}; GATE={'pass','partial','fail','not_applicable','unknown'}; ALLOW={'historical','archived','external','generated','unavailable'}
failures=[]
def fail(m): failures.append(m)
def load(p):
    try: return json.loads(p.read_text(encoding='utf-8'))
    except Exception as e: fail(f'JSON parse failed for {p.name}: {e}'); return {}
def unique(records,key,label):
    seen=set()
    for r in records:
        v=r.get(key)
        if not v: fail(f'{label} missing {key}: {r}')
        elif v in seen: fail(f'duplicate {key}: {v}')
        seen.add(v)
def md_count(path,label):
    m=re.search(rf'{re.escape(label)}:\s*(\d+)',path.read_text(encoding='utf-8'))
    return int(m.group(1)) if m else None
for n in REQUIRED:
    if not (AUDIT/n).exists(): fail(f'missing required audit file: {n}')
inv=load(AUDIT/'SHS_BOS_V1_MASTER_LAYER_INVENTORY.json'); connd=load(AUDIT/'SHS_BOS_V1_LAYER_CONNECTION_MATRIX.json'); orphd=load(AUDIT/'SHS_BOS_V1_ORPHAN_AND_DEAD_END_REGISTRY.json'); chaind=load(AUDIT/'SHS_BOS_V1_OPERATIONAL_CHAIN_AUDIT.json'); regd=load(AUDIT/'SHS_BOS_V1_RECOMMENDED_OFFICIAL_LAYER_REGISTRY.json'); load(AUDIT/'SHS_BOS_V1_LAYER_EVIDENCE_MATRIX.json')
layers=inv.get('layers',[]); conns=connd.get('connections',[]); orphans=orphd.get('orphans',[]); chains=chaind.get('chains',[]); official=regd.get('official_registry',[])
unique(layers,'layer_id','layer'); unique(conns,'connection_id','connection'); unique(orphans,'orphan_id','orphan/dead-end'); unique(chains,'chain_id','operational chain'); unique(official,'layer_id','recommended registry')
layer_ids={l.get('layer_id') for l in layers}; conn_ids={c.get('connection_id') for c in conns}; names=set()
for r in official:
    if r.get('official_name') in names: fail(f'duplicate official name in recommended registry: {r.get("official_name")}')
    names.add(r.get('official_name'))
for l in layers:
    lid=l.get('layer_id')
    if l.get('overall_status') not in STATUS: fail(f'{lid} invalid overall_status {l.get("overall_status")}')
    pct=l.get('estimated_completion_percent')
    if not isinstance(pct,(int,float)) or pct<0 or pct>100: fail(f'{lid} completion out of range: {pct}')
    if not l.get('proposed_only') and not l.get('evidence'): fail(f'{lid} has no evidence and is not proposed_only')
    if l.get('overall_status')=='v1_certified':
        bad=[k for k,v in l.get('completion_gates',{}).items() if v.get('status') not in {'pass','not_applicable'}]
        if bad or l.get('closure_status') not in {'closed_end_to_end','closed_with_v1_limitations'}: fail(f'{lid} is v1_certified without all gates passing')
    if l.get('overall_status')=='v1_ready' and any(o.get('layer_id')==lid and o.get('blocks_v1') for o in orphans): fail(f'{lid} is v1_ready but has unresolved P0 dead end')
    for key in ['upstream_dependencies','blocking_layers']:
        for ref in l.get(key,[]):
            if ref not in layer_ids: fail(f'{lid} invalid {key} reference: {ref}')
    for ref in l.get('blocking_connections',[]):
        if ref not in conn_ids: fail(f'{lid} invalid blocking connection reference: {ref}')
    for dup in l.get('duplication_or_overlap',[]):
        if isinstance(dup,str) and dup.startswith('SHS-LAYER-') and dup not in layer_ids: fail(f'{lid} invalid duplicate/overlap layer reference: {dup}')
    for g,v in l.get('completion_gates',{}).items():
        if v.get('status') not in GATE: fail(f'{lid} gate {g} invalid status {v.get("status")}')
    for e in l.get('evidence',[]):
        fp=e.get('file_path'); cur=e.get('currency')
        if fp and fp!='NOT_FOUND' and e.get('repository')=='shrv1' and not (ROOT/fp).exists() and cur not in ALLOW: fail(f'{lid} evidence path missing without allowed currency: {fp}')
        if fp=='NOT_FOUND' and cur not in ALLOW: fail(f'{lid} NOT_FOUND evidence must be marked unavailable/historical/archived/external/generated')
for c in conns:
    if c.get('upstream_layer_id') not in layer_ids or c.get('downstream_layer_id') not in layer_ids: fail(f'{c.get("connection_id")} points to invalid layer IDs')
    if c.get('connection_status') not in CONN_STATUS: fail(f'{c.get("connection_id")} invalid connection_status {c.get("connection_status")}')
    if c.get('blocks_v1') is False and c.get('connection_status') in {'broken','not_connected'}: fail(f'{c.get("connection_id")} broken/not_connected cannot be non-blocking')
for o in orphans:
    if o.get('layer_id') not in layer_ids: fail(f'{o.get("orphan_id")} invalid layer_id')
for ch in chains:
    for s in ch.get('steps',[]):
        if s.get('layer_id') not in layer_ids and not s.get('external_capability'): fail(f'{ch.get("chain_id")} step invalid layer')
    if ch.get('closure_status') in {'closed_end_to_end','closed_with_v1_limitations'} and ch.get('missing_connections'): fail(f'{ch.get("chain_id")} is marked closed with missing transitions')
owners={}
for l in layers:
    n=l.get('official_name'); o=l.get('system_owner')
    if n in owners and owners[n]!=o: fail(f'conflicting canonical ownership for {n}')
    owners[n]=o
if md_count(AUDIT/'SHS_BOS_V1_MASTER_LAYER_INVENTORY.md','Layer count') != len(layers): fail('JSON and Markdown layer counts disagree')
if md_count(AUDIT/'SHS_BOS_V1_GAP_AND_DUPLICATION_AUDIT.md','Blocker count') != sum(1 for o in orphans if o.get('blocks_v1')): fail('JSON and Markdown blocker counts disagree')
if failures:
    print('SHS BOS V1 layer audit validation FAILED')
    for f in failures: print(f'- {f}')
    sys.exit(1)
print(f'SHS BOS V1 layer audit validation PASS: {len(layers)} layers, {len(conns)} connections, {len(orphans)} dead ends, {len(chains)} chains.')
