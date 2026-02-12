from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def _normalize_rel_file(rel_file: str) -> str:
    # Manifest stores paths like "complianceProfiles/x.json".
    # We resolve relative to the manifest directory (.../complianceProfiles),
    # so strip the folder prefix to avoid ".../complianceProfiles/complianceProfiles/...".
    rel_file = (rel_file or "").replace("\\", "/").lstrip("./")
    if rel_file.startswith("complianceProfiles/"):
        rel_file = rel_file[len("complianceProfiles/"):]
    return rel_file


@dataclass(frozen=True)
class ComplianceManifest:
    manifest: Dict[str, Any]
    policy_by_id: Dict[str, Dict[str, Any]]
    global_policy: Dict[str, Any]


def load_compliance_manifest(repo_root: Path) -> ComplianceManifest:
    # Support calling with repo root OR service root.
    manifest_path = repo_root / "services/shf-agent-fabric/complianceProfiles/index.json"
    if not manifest_path.exists():
        manifest_path = repo_root / "complianceProfiles/index.json"

    if not manifest_path.exists():
        raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] Missing compliance manifest: {manifest_path}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    global_entry = manifest.get("global")
    if not global_entry:
        raise RuntimeError("[COMPLIANCE_BOOT_FAIL] Manifest missing global entry.")

    entries = [global_entry] + (manifest.get("profiles") or [])
    ci = manifest.get("ciGuards") or {}

    require_sha = bool(ci.get("requireSha256Match", True))
    require_ver = bool(ci.get("requireVersionsMatchManifest", True))

    policy_by_id: Dict[str, Dict[str, Any]] = {}

    for e in entries:
        policy_id = e.get("policyId")
        version = e.get("version")
        rel_file = e.get("file")
        declared_sha = e.get("sha256")

        if not policy_id or not version or not rel_file:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] Manifest entry missing fields: {e}")

        # Resolve policy file relative to the manifest directory.
        fpath = manifest_path.parent / Path(_normalize_rel_file(rel_file))

        if not fpath.exists():
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] Missing policy file for {policy_id}: {fpath}")

        if require_sha:
            if not declared_sha:
                raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] Missing sha256 in manifest for {policy_id}")
            actual = _sha256_file(fpath)
            if actual != declared_sha:
                raise RuntimeError(
                    f"[COMPLIANCE_BOOT_FAIL] sha256 mismatch for {policy_id} manifest={declared_sha} actual={actual}"
                )

        data = json.loads(fpath.read_text(encoding="utf-8"))
        if data.get("policyId") != policy_id:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] policyId mismatch for {policy_id} in {fpath}")

        if require_ver and data.get("version") != version:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] version mismatch for {policy_id}: manifest={version} file={data.get('version')}")

        policy_by_id[policy_id] = data

    global_policy_id = global_entry["policyId"]
    if global_policy_id not in policy_by_id:
        raise RuntimeError("[COMPLIANCE_BOOT_FAIL] Global policy not loaded.")

    return ComplianceManifest(manifest=manifest, policy_by_id=policy_by_id, global_policy=policy_by_id[global_policy_id])
