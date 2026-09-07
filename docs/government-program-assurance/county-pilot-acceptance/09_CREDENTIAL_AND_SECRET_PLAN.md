# Credential and Secret Plan

| Credential type | Owner | Storage boundary | Reference pattern | Rotation/revocation | Auditability | UAT/production separation | Status |
|---|---|---|---|---|---|---|---|
| TBD — county technical input required | County/source owner | Approved secret manager only | Non-secret reference in GPA | TBD | Required | Required | NOT_STARTED |

GPA stores credential references only where the existing architecture requires. Secret values, API keys, OAuth clients, service accounts, passwords, and tokens must never appear in Git, Markdown, fixtures, browser storage, or committed configuration.
