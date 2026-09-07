# Post-Lock Legal Runtime Authority

Migration 111 establishes one scoped Legal metadata authority with artifacts, decisions, obligations, technical bindings, and holds. Records are organization/tenant scoped, hash protected where source artifacts are referenced, auditable, and classification aware.

Legal owns legal records and decisions. Reporting consumes authorized metadata projections only. Legal does not own identity, Truth, Evidence, Reporting, or Public Disclosure. The implementation does not store legal body text, claim attorney-client privilege, infer legal compliance from technical state, clear holds, or alter retention through reporting.

Confidentiality supports PUBLIC, INTERNAL, and CONFIDENTIAL metadata. Privilege remains `NOT_ASSESSED` or `COUNSEL_REVIEW_REQUIRED` until a qualified authority supplies a real privilege model. Holds are source-owned and cannot be released by Reporting.

Supported report families are metadata-only and fail closed for missing or restricted artifacts: `legal-artifact-summary`, `legal-authority-obligation`, `legal-readiness`, and `legal-evidence-decision-trace`. Future privilege, retention, secure body storage, and counsel workflow work requires separate canonical authority.
