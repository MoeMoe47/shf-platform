INSERT INTO audit_events (
  audit_event_id, organization_id, actor_user_id, target_object_type, target_object_id,
  action_type, correlation_id, source_channel, reason_text
) VALUES
('audit_seed_001', 'org_shf_001', 'user_admin_001', 'program', 'program_seed_001', 'program.created', 'corr_seed_001', 'system', 'Seed program created'),
('audit_seed_002', 'org_shf_001', 'user_pm_001', 'program', 'program_seed_001', 'program.transitioned', 'corr_seed_002', 'system', 'Seed program activated'),
('audit_seed_003', 'org_shf_001', 'user_operator_001', 'case', 'case_seed_002', 'case.assigned', 'corr_seed_003', 'system', 'Seed case assigned'),
('audit_seed_004', 'org_shf_001', 'user_reviewer_001', 'case', 'case_seed_003', 'case.transitioned', 'corr_seed_004', 'system', 'Seed case in review'),
('audit_seed_005', 'org_shf_001', 'user_operator_001', 'case', 'case_seed_004', 'case.transitioned', 'corr_seed_005', 'system', 'Seed case on hold'),
('audit_seed_006', 'org_shf_001', 'user_reviewer_001', 'case', 'case_seed_005', 'case.transitioned', 'corr_seed_006', 'system', 'Seed case resolved')
ON CONFLICT (audit_event_id) DO NOTHING;
