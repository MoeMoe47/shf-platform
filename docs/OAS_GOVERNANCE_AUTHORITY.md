# OAS governance authority — FOUNDING GOVERNANCE

This repository uses a minimal founding mechanism while a neutral multi-party body is not established. This is FOUNDING GOVERNANCE, not external standards consensus. The current user task explicitly authorizes establishing this mechanism and resolving repository scope/contracts; it does not supply a named maintainer, a signature, or acceptance of content whose exact bytes did not yet exist. No board, electorate or external institution is invented.

## Authority and actual present state

OAS owns its normative standard and interoperability contracts independently of Registry, Trust Bureau and SHS BOS. Co-location in shf-platform does not transfer OAS authority to SHS, nor does access to the whole repository automatically appoint an OAS adopter. The founding maintainer is the real person or organization explicitly designated to maintain the OAS standards portion of the repository, with an independently checkable designation/control reference. That role is defined here; its present occupant is not identified or fabricated by code.

Repository contributors may author proposed requirements under scoped work instructions. Recorded reviewers may decide content suitability against the ten review criteria and exact content digests. The current task delegates that repository review to Codex. A content APPROVE is not final-standard adoption, an authenticity proof or blanket publication permission.

The founding maintainer may accept a precise scope/contract snapshot and explicitly authorize issuance of an RC. After RC validation, the same role may make a separate final-adoption decision. A publisher is the maintainer or a release operator explicitly delegated for named adopted bytes. Final release publication requires its own authorization; this task expressly forbids 1.0.0 publication. RC issuance does not require or imply an effective production date.

## Required decision record and procedure

The canonical pending record is standards/oas/closure/founding-acceptance.json. It intentionally has state AWAITING_REAL_MAINTAINER_ACCEPTANCE, null actor/evidence/commit/digests/time/decision reference, authorize_rc1=false and authorize_final_release=false. These missing values are a real blocker, not a simulated approval.

To activate this first scope, the actual founding maintainer must review the complete scope, requirements, declaration and RC contracts, then record a real maintainer reference, independently checkable authority/designation evidence, full accepted Git commit, exact scope checksum, all contract checksums, actual acceptance time and an immutable decision-record reference. Record authorize_rc1=true only if RC1 issuance is actually approved. EXPECTED_ACCEPTANCE_BINDINGS.json supplies content digests, not an actor or approval. A single recorded acceptance by the real founding maintainer is the founding decision rule; no unrecorded vote or quorum is assumed.

Acceptance is recorded after the source snapshot: the accepted content-input manifest excludes the acceptance record itself to avoid a circular commit/hash dependency. Its digest is recorded separately in the closure proof. The original scope resolution can retain its historical pending-acceptance status; a valid matching acceptance record resolves the Q10 activation gate without rewriting the accepted content.

The release operator must independently check the authority/designation evidence and verify that the accepted Git commit contains those exact bytes. A syntactically valid JSON record or a passing checksum does not prove identity, authority or consent. Tools must not populate acceptance based on their own content decisions, repository user.name, a remote owner string, an unauthenticated declarant name or a synthetic test fixture. No automatic signing or role assignment is implemented.

The RC operator must rerun all mandatory gates and verify source revision/manifests before emitting immutable membership. Approval is stale if any accepted source, scope or contract changes. A decision must identify which previous decision it changes; silence is not approval. An RC operator cannot promote an RC to final 1.0.0.

## Conflict, change and future governance

Conflicting authority evidence, disputed scope, conflicting approvals or mismatched digests halt issuance. Record the conflict and seek a new explicit maintainer disposition; never silently select the convenient interpretation. Rejected/deferred IDs stay reserved. Published requirement meaning and historical release artifacts are immutable; material normative changes allocate new IDs/versions with explicit supersession and migration guidance.

A future neutral multi-party body can replace this model through a versioned governance policy and explicit transfer decision defining participation, decision rules, conflict handling and release roles. That change acts prospectively. It must preserve historical founder-era attribution, requirement text/meaning, artifacts, references and decisions; it cannot retroactively claim independent consensus or rewrite an old declaration.

The mechanism is now explicit and auditable. Q10 remains blocking only for the actual role designation and exact-snapshot acceptance/RC authorization. This is separate from the content and contract resolutions completed in this branch.
