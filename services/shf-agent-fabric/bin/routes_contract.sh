#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${BASE_DIR}"

python3 - <<'PY'
from collections import defaultdict
from main import app

bucket=defaultdict(list)

for r in app.routes:
    path=getattr(r,"path","")
    methods=sorted(list(getattr(r,"methods",[]) or []))
    name=getattr(r,"name","")
    if not path or not methods:
        continue
    for m in methods:
        bucket[(m,path)].append(name)

required=[
  ("POST","/runs/reports/{run_id}/publish"),
  ("GET","/runs/published/{run_id}"),
  ("GET","/runs/published/{run_id}/pdf"),
  ("GET","/runs/published/{run_id}/proof"),
  ("GET","/admin/force/status"),
]

present=set(bucket.keys())
missing=[f"{m} {p}" for (m,p) in required if (m,p) not in present]

routes=[]
for (m,p),names in bucket.items():
    for n in names:
        routes.append((m,p,n))
routes=sorted(routes)

print("ROUTES_TOTAL", len(routes))
for m,p,n in routes:
    print(m, p, n)

dups=[(m,p,names) for (m,p),names in bucket.items() if len(names)>1]
if dups:
    print("DUPLICATES", len(dups))
    for m,p,names in sorted(dups):
        print(m, p, "=>", ", ".join(names))
    raise SystemExit(2)

if missing:
    print("MISSING", len(missing))
    for x in missing:
        print(x)
    raise SystemExit(3)

print("OK")
PY
