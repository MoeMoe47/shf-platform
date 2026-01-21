from fastapi import APIRouter
import os, subprocess, time, hashlib, json

router = APIRouter()

def _git_sha():
    try:
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], stderr=subprocess.DEVNULL).decode().strip()
    except Exception:
        return None

def _code_fingerprint():
    base = os.path.dirname(os.path.dirname(__file__))
    picks = [
        os.path.join(base, "main.py"),
        os.path.join(base, "routers", "plan_routes.py"),
        os.path.join(base, "routers", "runs_routes.py"),
        os.path.join(base, "fabric", "tools.py"),
    ]
    meta = []
    for p in picks:
        try:
            st = os.stat(p)
            meta.append({"path": os.path.relpath(p, base), "mtime": int(st.st_mtime), "size": int(st.st_size)})
        except Exception:
            meta.append({"path": os.path.relpath(p, base), "missing": True})
    raw = json.dumps(meta, sort_keys=True).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:16], meta

@router.get("/health")
def health():
    fp, files = _code_fingerprint()
    return {
        "ok": True,
        "service": "shf-agent-fabric",
        "ts": int(time.time()),
        "git": _git_sha(),
        "codeFingerprint": fp,
        "files": files,
    }
