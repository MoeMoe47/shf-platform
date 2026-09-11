# Secure Legal-Record Storage Boundary

This document defines a proposed technical boundary only. It does not select a vendor or connect an external system.

## May be stored in Git

- Non-sensitive legal-record identifier.
- Agreement family and non-sensitive type metadata.
- Approved version and lifecycle metadata after owner/counsel decision.
- Effective and expiration dates after external verification.
- Organization references that do not expose sensitive participant data.
- Cryptographic hash where approved.
- Secure external reference, without credentials.
- Approval, board-resolution and counsel-reference identifiers where non-sensitive and approved.
- Non-sensitive policy and technical-authority mappings.

Every such field remains `EXTERNAL_RECORD_REQUIRED` or the appropriate decision status until independently supplied.

## Must not be stored in Git

Executed agreements containing confidential terms, signatures, personal addresses, government or tax identifiers, bank information, insurance credentials, participant/minor/accommodation data, legal advice, privileged communications, executive-session records, private pricing, secret keys/tokens, unredacted incident evidence and confidential employment records.

## Boundary controls

- External legal-record custody must be selected and approved by the owner/board/counsel; Phase 0 does not select or connect a vendor.
- Use least privilege, organization separation, role separation and need-to-know access.
- Separate document custody from repository metadata.
- Record access and export events without copying protected content into application logs.
- Keep immutable historical references for supersession and correction; do not rewrite execution history.
- Apply retention schedules and legal holds before deletion.
- Revoke access when role, organization, agreement or service scope ends.
- Define backup, recovery, incident response and offboarding responsibility before external use.
- A hash proves that a retrieved document matches the hashed bytes; it does not prove execution, legal validity, authority, consent, approval or enforceability.
- Git metadata must never be presented as proof of signature, board approval, counsel review or active legal authority.

## Correction, supersession and revocation

Corrections must preserve the prior metadata and identify the correcting authority. Superseding records must point to the prior record without deleting history. Revocation, suspension, termination and expiration must be represented by independently verified legal records and must be mapped to the affected technical capability before runtime enforcement is designed.

## Access and audit

Legal-record access should be separately authorized from ordinary application administration. Audit access should expose only the minimum metadata needed to verify custody, version and integrity. Privileged legal communications and confidential executed documents remain outside repository and ordinary operational access.

