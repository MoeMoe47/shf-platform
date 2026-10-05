# Initial 32-Candidate Mapping

This mapping validates the proposed registry model against the completed commercial catalog audit. It is not production seed data and does not promote any candidate.

Raw audit buyer labels are preserved in the JSON artifact as `raw_buyer_types`; mapped `buyer_types` use the governed registry vocabulary.

## Preserved Counts

| Metric | Count |
|---|---:|
| Sellability SELL_NOW | 0 |
| Sellability PILOT | 10 |
| Sellability DEVELOP | 12 |
| Sellability NOT_SELLABLE | 4 |
| Sellability NEEDS_REVIEW | 6 |
| Readiness GREEN | 0 |
| Readiness YELLOW | 10 |
| Readiness RED | 4 |
| Readiness BLUE | 0 |
| Readiness UNKNOWN | 18 |

## Mapping Table

| Audit ID | Candidate | Registry ID | Family | Readiness | Sellability | Lifecycle | Pricing | Funding |
|---|---|---|---|---|---|---|---|---|
| cc-001 | Data Center & AI Infrastructure Curriculum Pathway | cp_data_center_and_ai_infrastructure_curriculum_pathway | DATA_CENTER | YELLOW | PILOT | PILOT_READY | NOT_DEFINED | POTENTIAL |
| cc-002 | Data Center Employer Validation Package | cp_data_center_employer_validation_package | DATA_CENTER | YELLOW | PILOT | PILOT_READY | NOT_DEFINED | POTENTIAL |
| cc-003 | Curriculum Catalog / Course Authoring Infrastructure | cp_curriculum_catalog_course_authoring_infrastructure | CORE_EDUCATION | UNKNOWN | DEVELOP | DEFINED | NOT_DEFINED | INSTITUTIONAL_PURCHASING |
| cc-004 | ASL Curriculum Collection | cp_asl_curriculum_collection | CORE_EDUCATION | UNKNOWN | NEEDS_REVIEW | REVIEW | NOT_DEFINED | POTENTIAL |
| cc-005 | Educator Professional Development Bundle | cp_educator_professional_development_bundle | CORE_EDUCATION | UNKNOWN | DEVELOP | DEFINED | NOT_DEFINED | POTENTIAL |
| cc-006 | Summer STEM Camp / After-School Tech Explorer Package | cp_summer_stem_camp_after_school_tech_explorer_package | CORE_EDUCATION | UNKNOWN | DEVELOP | DEFINED | NOT_DEFINED | POTENTIAL |
| cc-007 | Career Center / Career Pathways Platform | cp_career_center_career_pathways_platform | CAREER_WORKFORCE | UNKNOWN | DEVELOP | DEFINED | NOT_DEFINED | POTENTIAL |
| cc-008 | Career Portfolio / Credential Projection Package | cp_career_portfolio_credential_projection_package | CAREER_WORKFORCE | UNKNOWN | DEVELOP | DEFINED | NOT_DEFINED | POTENTIAL |
| cc-009 | Employer Workforce Incentive Intelligence | cp_employer_workforce_incentive_intelligence | APPRENTICESHIP_WBL | YELLOW | PILOT | PILOT_READY | NOT_DEFINED | REVIEW_REQUIRED |
| cc-010 | Apprenticeship / Work-Based Learning Opportunity Matching | cp_apprenticeship_work_based_learning_opportunity_matching | APPRENTICESHIP_WBL | UNKNOWN | DEVELOP | DEFINED | NOT_DEFINED | REVIEW_REQUIRED |
| cc-011 | Healthcare Workforce Pathway Concepts | cp_healthcare_workforce_pathway_concepts | HEALTHCARE_WORKFORCE | UNKNOWN | NEEDS_REVIEW | REVIEW | NOT_DEFINED | POTENTIAL |
| cc-012 | Fire & Public Safety Readiness Concepts | cp_fire_and_public_safety_readiness_concepts | FIRE_PUBLIC_SAFETY | RED | NOT_SELLABLE | DISCOVERED | NOT_DEFINED | NOT_FOUND |
| cc-013 | Infrastructure / Public Works / Utilities Concepts | cp_infrastructure_public_works_utilities_concepts | INFRASTRUCTURE_WORKFORCE | UNKNOWN | DEVELOP | DEFINED | NOT_DEFINED | POTENTIAL |
| cc-014 | Logistics Coordinator / Supply Chain Concepts | cp_logistics_coordinator_supply_chain_concepts | LOGISTICS_SUPPLY_CHAIN | UNKNOWN | NEEDS_REVIEW | REVIEW | NOT_DEFINED | POTENTIAL |
| cc-015 | Aviation / UAS Career Concepts | cp_aviation_uas_career_concepts | AVIATION | RED | NOT_SELLABLE | DISCOVERED | NOT_DEFINED | NOT_FOUND |
| cc-016 | Creator / Media / SHNN Concepts | cp_creator_media_shnn_concepts | CREATOR_MEDIA_SHNN | RED | NOT_SELLABLE | DISCOVERED | NOT_DEFINED | NOT_FOUND |
| cc-017 | Learning Arcade Institutional License | cp_learning_arcade_institutional_license | LEARNING_GAMING | YELLOW | PILOT | PILOT_READY | NOT_DEFINED | POTENTIAL |
| cc-018 | Classic Arcade / Sponsored Tournaments | cp_classic_arcade_sponsored_tournaments | LEARNING_GAMING | UNKNOWN | NEEDS_REVIEW | REVIEW | NOT_DEFINED | SPONSORSHIP |
| cc-019 | Metaverse Access License | cp_metaverse_access_license | METAVERSE | YELLOW | PILOT | PILOT_READY | NOT_DEFINED | INSTITUTIONAL_PURCHASING |
| cc-020 | Metaverse Simulation Content License | cp_metaverse_simulation_content_license | METAVERSE | YELLOW | PILOT | PILOT_READY | NOT_DEFINED | POTENTIAL |
| cc-021 | Metaverse Branded Destination / Sponsorship | cp_metaverse_branded_destination_sponsorship | METAVERSE | UNKNOWN | NEEDS_REVIEW | REVIEW | NOT_DEFINED | SPONSORSHIP |
| cc-022 | SHF Civic / Civic Learning Simulations | cp_shf_civic_civic_learning_simulations | CIVIC_FINANCIAL_CAPABILITY | YELLOW | PILOT | PILOT_READY | NOT_DEFINED | POTENTIAL |
| cc-023 | Financial Capability / Treasury / Debt Simulations | cp_financial_capability_treasury_debt_simulations | CIVIC_FINANCIAL_CAPABILITY | UNKNOWN | DEVELOP | DEFINED | NOT_DEFINED | SPONSORSHIP |
| cc-024 | Service Catalog / Organization Entitlements | cp_service_catalog_organization_entitlements | INSTITUTIONAL_TECH_SHS | YELLOW | PILOT | PILOT_READY | NOT_DEFINED | INSTITUTIONAL_PURCHASING |
| cc-025 | Studio / Student Project Workspace | cp_studio_student_project_workspace | INSTITUTIONAL_TECH_SHS | YELLOW | PILOT | PILOT_READY | NOT_DEFINED | INSTITUTIONAL_PURCHASING |
| cc-026 | Agent Fabric / Governed AI Workforce Package | cp_agent_fabric_governed_ai_workforce_package | INSTITUTIONAL_TECH_SHS | UNKNOWN | DEVELOP | DEFINED | NOT_DEFINED | COMMERCIAL_SHS_REVENUE |
| cc-027 | Operational / AI Readiness Assessment | cp_operational_ai_readiness_assessment | INSTITUTIONAL_TECH_SHS | UNKNOWN | DEVELOP | DEFINED | NOT_DEFINED | COMMERCIAL_SHS_REVENUE |
| cc-028 | Website Studio Templates / Web Builder | cp_website_studio_templates_web_builder | INSTITUTIONAL_TECH_SHS | UNKNOWN | NEEDS_REVIEW | REVIEW | NOT_DEFINED | COMMERCIAL_SHS_REVENUE |
| cc-029 | CivicSure / Government Program Assurance | cp_civicsure_government_program_assurance | ASSURANCE_VERIFICATION_REPORTING | YELLOW | PILOT | PILOT_READY | NOT_DEFINED | INSTITUTIONAL_PURCHASING |
| cc-030 | Trusted Reporting / Impact Reporting Package | cp_trusted_reporting_impact_reporting_package | ASSURANCE_VERIFICATION_REPORTING | UNKNOWN | DEVELOP | DEFINED | NOT_DEFINED | POTENTIAL |
| cc-031 | Evidence Engine / Verification Readiness Package | cp_evidence_engine_verification_readiness_package | ASSURANCE_VERIFICATION_REPORTING | UNKNOWN | DEVELOP | DEFINED | NOT_DEFINED | POTENTIAL |
| cc-032 | SHF V1 Community Programs | cp_shf_v1_community_programs | CORE_EDUCATION | RED | NOT_SELLABLE | DISCOVERED | NOT_DEFINED | POTENTIAL |

## Validation Rules Applied

- `PILOT` candidates remain controlled pilot only.
- `DEVELOP` candidates remain packaging/review/design work, not sellable products.
- `NEEDS_REVIEW` candidates remain blocked by authority, entity, legal, tax, regulatory, or funding review.
- `NOT_SELLABLE` candidates remain guard records or excluded concepts.
- No `SELL_NOW`, `GREEN`, or `BLUE` upgrades were created.
- `UNKNOWN` pricing from the audit is represented as `NOT_DEFINED` pricing status for registry design purposes, with no prices assigned.

## Machine-Readable Artifact

See `initial-32-candidate-design-mapping.json`.
