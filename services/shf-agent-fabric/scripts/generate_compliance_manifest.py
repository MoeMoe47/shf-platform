#!/usr/bin/env python3
import json
import hashlib
from pathlib import Path
from datetime import date

ROOT = Path(__file__).resolve().parents[1]
PROFILES_DIR = ROOT / "complianceProfiles"
OUTPUT = PROFILES_DIR / "index.json"

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)

def main():
    profiles = []
    seen_policy_ids = set()
    seen_files = set()
    global_entry = None

    for path in sorted(PROFILES_DIR.glob("*.json")):
        if path.name == "index.json":
            continue

        data = load_json(path)
        policy_id = data.get("policyId")
        version = data.get("version")

        if not policy_id or not version:
            raise RuntimeError(f"{path.name} missing policyId or version")

        if policy_id in seen_policy_ids:
            raise RuntimeError(f"Duplicate policyId detected: {policy_id}")

        if path.name in seen_files:
            raise RuntimeError(f"Duplicate file detected: {path.name}")

        seen_policy_ids.add(policy_id)
        seen_files.add(path.name)

        entry = {
            "policyId": policy_id,
            "version": version,
            "file": f"complianceProfiles/{path.name}",
            "sha256": sha256_file(path)
        }

        if policy_id == "global-compliance-policy":
            global_entry = {**entry, "required": True}
        else:
            entry["type"] = (
                "business" if policy_id.startswith("business-")
                else "app" if policy_id.startswith("app-")
                else "other"
            )
            entry["required"] = True
            profiles.append(entry)

    if global_entry is None:
        raise RuntimeError("Global compliance policy not found (policyId=global-compliance-policy)")

    manifest = {
        "manifestId": "compliance-profiles-index",
        "version": "1.0.0",
        "generatedAt": date.today().isoformat(),
        "description": "AUTO-GENERATED. Do not edit by hand. Generated from complianceProfiles/*.json.",
        "global": global_entry,
        "profiles": profiles,
        "ciGuards": {
            "enforceUniquePolicyIds": True,
            "enforceUniqueFiles": True,
            "requireGlobalPolicy": True,
            "requireReferencedPoliciesExist": True,
            "requireVersionsMatchManifest": True,
            "requireSha256Match": True,
            "failOnUnknownPolicyRefs": True,
            "gateGEnabled": True
        }
    }

    OUTPUT.write_text(json.dumps(manifest, indent=2))
    print(f"✅ Generated {OUTPUT}")

if __name__ == "__main__":
    main()
