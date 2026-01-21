import argparse
import hashlib
import json
import re
import sys
import urllib.request
from urllib.parse import urljoin

DROP_KEYS = {
    "generated_ts","generated_at","computed_ts","computed_at","verified_ts","verified_at",
    "rendered_ts","rendered_at","created_ts","created_at","updated_ts","updated_at",
    "timestamp","ts","now","server_ts","server_time"
}

def _prune(x):
    if isinstance(x, dict):
        return {k: _prune(v) for k, v in x.items() if k not in DROP_KEYS}
    if isinstance(x, list):
        return [_prune(i) for i in x]
    return x

def _canonical_json_bytes(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def _normalize_pdf_bytes(b: bytes) -> bytes:
    ix = b.rfind(b"\nxref")
    if ix != -1:
        b = b[:ix]
    b = re.sub(br"/CreationDate\s*\(D:[^)]+\)", b"", b)
    b = re.sub(br"/ModDate\s*\(D:[^)]+\)", b"", b)
    b = re.sub(br"/ID\s*\[[^\]]+\]", b"", b)
    b = re.sub(br"\s+", b" ", b)
    return b

def _sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def _http_get_bytes(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "shf-loo-verify/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

def _http_get_json(url: str, timeout: int = 30):
    b = _http_get_bytes(url, timeout=timeout)
    return json.loads(b.decode("utf-8"))

def _pick(p: dict, *paths):
    for path in paths:
        cur = p
        ok = True
        for k in path:
            if isinstance(cur, dict) and k in cur:
                cur = cur[k]
            else:
                ok = False
                break
        if ok and cur is not None:
            return cur
    return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run_id")
    ap.add_argument("--base-url", default="http://127.0.0.1:8090")
    ap.add_argument("--timeout", type=int, default=30)
    ap.add_argument("--fail-fast", action="store_true")
    args = ap.parse_args()

    run_id = args.run_id.strip()
    base = args.base_url.rstrip("/") + "/"

    proof_url = urljoin(base, f"runs/report/{run_id}/proof")
    proof = _http_get_json(proof_url, timeout=args.timeout)

    expected_report = _pick(proof, ("report_sha256",), ("hashes","report"), ("artifacts","report","sha256"), ("report","sha256"))
    expected_pdf = _pick(proof, ("pdf_sha256",), ("hashes","pdf"), ("artifacts","pdf","sha256"), ("pdf","sha256"))

    report_url = _pick(proof, ("report_url",), ("urls","report"), ("artifacts","report","url"), ("report","url")) or f"/runs/report/{run_id}"
    pdf_url = _pick(proof, ("pdf_url",), ("urls","pdf"), ("artifacts","pdf","url"), ("pdf","url")) or f"/runs/report/{run_id}/pdf"

    if report_url.startswith("/"):
        report_url = urljoin(base, report_url.lstrip("/"))
    if pdf_url.startswith("/"):
        pdf_url = urljoin(base, pdf_url.lstrip("/"))

    report_obj = _http_get_json(report_url, timeout=args.timeout)
    report_obj = _prune(report_obj)
    computed_report = _sha256_hex(_canonical_json_bytes(report_obj))

    pdf_bytes = _http_get_bytes(pdf_url, timeout=args.timeout)
    computed_pdf = _sha256_hex(_normalize_pdf_bytes(pdf_bytes))

    ok_report = (expected_report is None) or (computed_report.lower() == str(expected_report).strip().lower())
    ok_pdf = (expected_pdf is None) or (computed_pdf.lower() == str(expected_pdf).strip().lower())
    ok_all = ok_report and ok_pdf

    out = {
        "ok": bool(ok_all),
        "run_id": run_id,
        "urls": {"proof": proof_url, "report": report_url, "pdf": pdf_url},
        "expected": {"report_sha256": expected_report, "pdf_sha256": expected_pdf},
        "computed": {"report_sha256": computed_report, "pdf_sha256": computed_pdf},
        "match": {"report": bool(ok_report), "pdf": bool(ok_pdf), "all": bool(ok_all)},
    }

    sys.stdout.write(json.dumps(out, indent=2, sort_keys=True) + "\n")

    if not ok_all:
        if args.fail_fast:
            sys.exit(1)
        if not ok_report and not ok_pdf:
            sys.exit(4)
        if not ok_report:
            sys.exit(2)
        if not ok_pdf:
            sys.exit(3)

    sys.exit(0)

if __name__ == "__main__":
    main()
