from pathlib import Path
import subprocess

def get_repo_root() -> Path:
    try:
        root = subprocess.check_output(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=Path(__file__).resolve().parent,
            text=True
        ).strip()
        return Path(root)
    except Exception:
        # Fallback: walk up until .git found
        p = Path(__file__).resolve()
        for parent in p.parents:
            if (parent / ".git").exists():
                return parent
        raise RuntimeError("[COMPLIANCE_BOOT_FAIL] Unable to locate repo root")
