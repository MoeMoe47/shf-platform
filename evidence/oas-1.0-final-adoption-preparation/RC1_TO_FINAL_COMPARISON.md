# RC1 to proposed final comparison

PROPOSED — NOT ADOPTED — NOT PUBLISHED

Target: `OAS-1@1.0.0`. Preparation source: `6f145192af25c929c95181fd6cd38f32d7b5ace9`. Normative source: `517cc23426e7485c352a1672c8fe4614291d552a`. Binding checksum: `sha256:cbc26edbca5214fdca1cfa7dc2f7fbf17d917eb44bef4dbc2d337c98a7dbeeb1`.

The same 14 IDs, order, domain assignments and normative wording are retained. No HOLD/deferred requirement is added; 0011/0013/0015 remain excluded. The exact normative projection (ID, domain, normative_text) is sha256:43429dd2555e8ec5c033002612f4d3f47b1c02c8209fd17e8cacbd6643a7907a for both source and proposed mapped rows. The full original effective-record content checksum sha256:ac3e5aa8086552547b8b36c38c2826733585b9458f53584aa2ba0550643a1929 remains separately bound; all applicability/clarification context remains at the exact source and scope checksum sha256:14be68339c76888fa1cac497564b6abd427352688ff68c531e8f46b61972d3c4.

| Item | RC1 | Proposed final review target |
| --- | --- | --- |
| Release/version | OAS-1@1.0.0-rc.1 / 1.0.0-rc.1 | OAS-1@1.0.0 / 1.0.0; proposal only |
| Actual status | release_candidate | proposed, NOT ADOPTED, NOT PUBLISHED |
| Target status | RC validation only | released only following new human adoption and separate publication |
| IDs/domains/wording | Exact validated set | Identical |
| Source metadata | Existing accepted source 517cc... plus immutable RC issuance/review | Explicit preparation source 6f145192af25c929c95181fd6cd38f32d7b5ace9; original normative source separately preserved |
| Record layout | Original effective authoring records contain historical preparation/editorial metadata | Deterministic projection into the existing requirement schema; status=draft in proposal, prospective active only in a pure date-completed target |
| Applicability and scope interpretation | Accepted scope and clarifications | Same source/scope checksum, no meaning change |
| Dates | RC candidate date; effective_date=null | Human release/effective dates required; never copied from RC |
| Declaration/profiles/evaluation | 1.1.0 / empty / NOT_EVALUATED | Unchanged |
| Predecessor | Derived from public-review.1 | Proposed finalization of RC1; no adopted supersession/currentness event yet |

Differences in mapped-record checksums are release metadata/representation differences, not normative wording drift. The full RC1 content checksum, normative projection hash and scope hash deliberately remain distinct rather than claiming all differently shaped JSON has the same digest. Existing root release/requirement primitives are reused by the proposed final artifact contract; historical catalog/RC/declaration schemas are not edited.

A change to any ID, member, domain assignment or wording fails semantic validation even if an attacker recomputes a payload checksum. A true blocking normative defect requires RC2 and stopping final adoption preparation; none has been found. No RC1 byte is regenerated or rewritten by this package.
