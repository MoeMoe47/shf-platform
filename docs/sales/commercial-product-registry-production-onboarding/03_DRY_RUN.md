# Dry Run

Dry-run is non-mutating. It reports candidate identity, candidate name, source-authority state, required review gates, current persisted decisions, blocking gates, stale gates, unknown mandatory gates, missing evidence, regulated requirements, eligibility result, proposed product id, lifecycle, readiness, sellability, source provenance, entitlement references, and expected audit effects.

Dry-run also returns expected candidate, source, and decision versions. Execution may pass those values back to detect stale candidate, source, or review state.

Dry-run is evidence only. It does not create products, review decisions, source resolutions, audit rows, or lineage rows.
