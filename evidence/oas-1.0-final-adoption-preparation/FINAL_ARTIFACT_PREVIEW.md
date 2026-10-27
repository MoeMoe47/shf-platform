# Final artifact preview — review staging only

PROPOSED — NOT ADOPTED — NOT PUBLISHED

Target: `OAS-1@1.0.0`. Preparation source: `6f145192af25c929c95181fd6cd38f32d7b5ace9`. Normative source: `517cc23426e7485c352a1672c8fe4614291d552a`. Binding checksum: `sha256:cbc26edbca5214fdca1cfa7dc2f7fbf17d917eb44bef4dbc2d337c98a7dbeeb1`.

Primary staged preview: standards/oas/governance/final-1.0.0/artifact-preview.json. It is explicitly marked “PROPOSED — NOT ADOPTED — NOT PUBLISHED”, status=proposed, with null human decisions. It cannot resolve as an adopted release in the existing declaration validator.

Its full-file checksum is sha256:5a0575822f3db28bdada424041aa9532df19d72e9678294522676600769e5be4; payload checksum sha256:08c34b37d060faa2bf6ff2fe3bd2e98e32ab9c76a303da733e2fa166c0045e8c. These identify the exact proposed preview, not a published final standard.

The date-completed prospective final payload is nested in artifact-target.json#/target_payload under a clearly marked staging wrapper. Its date-specific digest is bound by FINAL_TARGET_BINDINGS.json. Serialize that target_payload as two-space JSON plus LF to obtain its prospective publication bytes; the wrapper itself must never be published.

The new preparation schemas are proposed contracts under schemas/oas/preparation/. final-proposal.schema.json constrains the unadopted envelope; final-artifact.schema.json reuses the existing release/requirement primitives for date-completed target bytes and preserves declaration contract 1.1.0. Their exact bytes are source-pinned and checksummed for human review; they do not retroactively alter RC1 or the legacy public-review catalog.

No writer/publication command exists. The preparation command writes only the governance staging directory and its evidence projections. Reserved future public target: public/oas/catalogs/OAS-1@1.0.0.json. That path must remain absent throughout this task. No deployment, live Registry change or adopted-final currentness claim occurs.
