#!/usr/bin/env bash
set -euo pipefail

SVC="services/shf-agent-fabric"

echo "== PG quickstart (dev) =="
bash "$SVC/ops/postgres/init_watchtower_pg.sh"

echo
echo "✅ Next:"
echo "  export SHF_PG_URL='postgresql://shf:shf_dev_password_change_me@localhost:5432/shf'"
echo "  python3 $SVC/ops/audit/export_watchtower_jsonl.py"
echo "  python3 $SVC/ops/monitor/watchtower_integrity_monitor.py"
