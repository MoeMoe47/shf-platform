# SHS BOS Batch 02 Failure and Recovery Report V1

Failure codes align to the Package E failure registry. Retry is bounded by `max_attempts`; exhausted retryable failures and selected nonretryable failures receive a dead-letter disposition.

| Failure | Transition | Retryable | Dead Letter |
| --- | --- | --- | --- |
| missing_required_field | source_intake | False | False |
| idempotency_conflict | source_intake | False | True |
| audit_write_failed | truth_persistence | True | False |
| source_not_ready | verification | True | False |
| stale_input | reconciliation | True | False |
| oracle_dependency_blocked | oracle | True | False |
| permission_denied | reporting | False | False |
| downstream_unavailable | recompute | True | True |
