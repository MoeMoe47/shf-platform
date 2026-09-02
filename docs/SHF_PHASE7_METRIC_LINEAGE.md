# SHF Phase 7 Metric Lineage

Phase 7 institutional metrics are calculated by `services/metric_registry_service.py`
from governed claims returned by `services/truth_spine_service.py`. Curriculum
claims are supplied by the production SHS Truth provider from
`curriculum_truth_facts`; JSONL remains a development/test provider.

| Producer | Governed Truth fact | Metric | Report surface |
| --- | --- | --- | --- |
| SHS Completion Policy | `LESSON_COMPLETED` | `curriculum.lesson.completion_count.v1` | `curriculum.learning_progress` |
| SHS Assessment | `ASSESSMENT_PASSED` | `curriculum.assessment.pass_count.v1` | `curriculum.learning_progress` |
| SHS Arcade | `ARCADE_MASTERY_ACHIEVED` | `curriculum.arcade.mastery_count.v1` | `curriculum.learning_progress` |
| SHS Live Learning | `ATTENDANCE_CONFIRMED` | `curriculum.attendance.confirmation_count.v1` | `curriculum.learning_progress` |
| SHS Evidence projection | `EVIDENCE_VERIFIED` or `COMPETENCY_DEMONSTRATED` | `curriculum.evidence.verified_count.v1` | `curriculum.learning_progress` |

All rows are organization-scoped, on-demand calculations with metric definition
version, calculation timestamp, period, source claim IDs, assignment IDs,
curriculum release IDs, and a deterministic source watermark in the result.
These initial metrics are counts, not rates; no denominator is implied. Rate
metrics remain unregistered until canonical eligible-population facts make their
denominators authoritative.

The report endpoint is `/shf/reports/curriculum.learning-progress` and accepts
only an authorized organization-scoped period. It does not accept formulas,
values, denominators, or public approval from the browser.
