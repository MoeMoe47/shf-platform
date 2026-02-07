#!/usr/bin/env bash
set -euo pipefail

echo "== Live registry/admin/gate router files =="
ls -1 routers/*.py | egrep '(registry|admin|gate)' | sed 's#^#- #'

echo
echo "== main.py import lines (registry/admin/gate only) =="
grep -E '^from routers\.(admin|registry|runs_registry|admin_gate)' main.py || true

echo
echo "== main.py include_router lines (registry/admin/gate only) =="
grep -nE 'include_router\((registry_router|admin_registry_router|runs_registry_router|admin_gate_router)' main.py || true

echo
echo "== Canonical schema path =="
test -f contracts/registry_entity.schema.json && echo "OK: contracts/registry_entity.schema.json" || (echo "MISSING: contracts/registry_entity.schema.json" && exit 1)

echo
echo "== Done =="
