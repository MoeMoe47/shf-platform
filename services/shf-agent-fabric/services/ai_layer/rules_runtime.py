from .adaptive_rules import get_default_rules, get_default_rules_meta
from .rules_promotion import load_promotion_state
from .rules_store import load_rules_version_by_version


def get_rules_bundle(evaluation_mode="stable"):
    state = load_promotion_state()

    stable_meta = state.get("stable_version")
    candidate_meta = state.get("candidate_version")

    def _bundle_from_meta(meta, fallback_label):
        if not meta or not meta.get("version"):
            return None

        record = load_rules_version_by_version(meta["version"])
        if not record:
            return None

        return {
            "rules": record.get("rules"),
            "meta": {
                "version": record.get("version"),
                "label": record.get("label", fallback_label),
                "saved_at": record.get("saved_at"),
            },
        }

    if evaluation_mode == "candidate":
        bundle = _bundle_from_meta(candidate_meta, "candidate_rules")
        if bundle:
            return bundle

    elif evaluation_mode == "candidate_if_available":
        bundle = _bundle_from_meta(candidate_meta, "candidate_rules")
        if bundle:
            return bundle

        bundle = _bundle_from_meta(stable_meta, "stable_rules")
        if bundle:
            return bundle

    # default = stable
    bundle = _bundle_from_meta(stable_meta, "stable_rules")
    if bundle:
        return bundle

    return {
        "rules": get_default_rules(),
        "meta": get_default_rules_meta(),
    }
