set -euo pipefail
export PYTHONPATH="${PYTHONPATH:-services/shf-agent-fabric}"
python3 services/shf-agent-fabric/fabric/watchtower/audit/export_attestations_jsonl.py
