# SHF Phase 6 Truth Architecture

Learner curriculum facts have one production path:

`authoritative SHS result -> integration_outbox -> verified-evidence consumer -> prepare_prove_evidence and curriculum_truth_facts`

`curriculum_truth_facts` is the durable SHS production projection store for learner-domain Truth. It preserves organization, learner, assignment, release, source, rule, competency, and occurrence lineage and is written only by the server-side projection service.

The existing `services/shf-agent-fabric` Truth Spine remains the canonical governance and public-Truth system for its existing reporting and federation workflows. Its JSONL evidence/projection stores are explicitly development-only and are not a production learner Truth ledger. No SHS learner result is written there as a second institutional ledger. A future approved bridge may consume SHS projection records, but Phase 6 does not duplicate those records into the development JSONL path or alter public-impact approval semantics.

Operational events are triggers, not Truth. The shared SHS integration outbox acknowledges a Phase 6 event only after the projection succeeds; retries and duplicate delivery are safe because source/rule uniqueness is deterministic.
