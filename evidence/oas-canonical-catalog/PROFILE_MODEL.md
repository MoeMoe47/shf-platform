# Profile model

No source-backed OAS profiles exist. R-levels, domain categories, SHS packages and Registry display profiles are not OAS profiles. Catalog profiles is empty, profile_population_status is not_defined. This is an explicit absence, not a claim of full applicability or exemption.

profile.schema.json requires profile_id/name/version, exact standard/release relationship, description, applicable_domains, requirement_ids, status and supersession links. Draft/active/deprecated/superseded are distinct from evaluations. Reference validation rejects missing releases/domains/requirements, incompatible membership or active profiles against draft releases. Populate only after OAS authors the real membership and standard relationship. Supersession is reciprocal and acyclic; historical snapshots remain intact. No production/example profile is published; synthetic test fixtures stay in tests.
