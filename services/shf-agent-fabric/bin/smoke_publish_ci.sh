#!/usr/bin/env bash
set -euo pipefail

RUN_ID="${1:-}"
if [ -z "${RUN_ID}" ]; then
  echo "usage: $0 <run_id>"
  exit 2
fi

BASE_URL="${BASE_URL:-http://127.0.0.1:8090}"
ADMIN_API_KEY="${ADMIN_API_KEY:-}"

if [ -z "${ADMIN_API_KEY}" ]; then
  echo "ADMIN_API_KEY is not set"
  exit 2
fi

PUB_PROOF_URL="${BASE_URL}/runs/published/${RUN_ID}/proof"
PUB_PDF_URL="${BASE_URL}/runs/published/${RUN_ID}/pdf"
PUB_DIR="registry/published/${RUN_ID}"

TMP_PROOF="/tmp/${RUN_ID}.proof.json"
TMP_PDF="/tmp/${RUN_ID}.pdf"

set +e
PUBLISH_BODY="$(curl -sS -X POST "${BASE_URL}/runs/reports/${RUN_ID}/publish" -H "x-admin-key: ${ADMIN_API_KEY}")"
PUBLISH_RC="$?"
set -e

if [ "${PUBLISH_RC}" -ne 0 ]; then
  echo "FAIL smoke_publish ${RUN_ID} publish_http_error"
  exit 1
fi

echo "${PUBLISH_BODY}" | python3 -m json.tool >/tmp/${RUN_ID}.publish.json || true

curl -sS "${PUB_PROOF_URL}" > "${TMP_PROOF}"
python3 -m json.tool < "${TMP_PROOF}" >/dev/null 2>&1 || { echo "FAIL smoke_publish ${RUN_ID} proof_not_json"; exit 1; }

OK_VAL="$(python3 - <<PY
import json
d=json.load(open("${TMP_PROOF}","r",encoding="utf-8"))
print(str(d.get("ok", False)).lower())
PY
)"
if [ "${OK_VAL}" != "true" ]; then
  echo "FAIL smoke_publish ${RUN_ID} proof_ok_false"
  exit 1
fi

curl -sS -o "${TMP_PDF}" "${PUB_PDF_URL}"
FILE_SIG="$(file -b "${TMP_PDF}" || true)"
echo "${FILE_SIG}" | grep -qi "PDF document" || { echo "FAIL smoke_publish ${RUN_ID} pdf_not_pdf"; exit 1; }

test -d "${PUB_DIR}" || { echo "FAIL smoke_publish ${RUN_ID} published_dir_missing"; exit 1; }
test -f "${PUB_DIR}/proof.json" || { echo "FAIL smoke_publish ${RUN_ID} proof_file_missing"; exit 1; }
test -f "${PUB_DIR}/report.pdf" || { echo "FAIL smoke_publish ${RUN_ID} pdf_file_missing"; exit 1; }
test -f "${PUB_DIR}/report.json" || { echo "FAIL smoke_publish ${RUN_ID} report_file_missing"; exit 1; }

echo "PASS smoke_publish ${RUN_ID}"
