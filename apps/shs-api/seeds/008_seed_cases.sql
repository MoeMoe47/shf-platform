INSERT INTO cases (
  case_id, organization_id, program_id, case_type, status, priority, assigned_team_id, assigned_user_id
) VALUES
('case_seed_001', 'org_shf_001', 'program_seed_001', 'participant_support', 'open', 'medium', NULL, NULL),
('case_seed_002', 'org_shf_001', 'program_seed_001', 'participant_support', 'assigned', 'high', 'team_ops_001', 'user_operator_001'),
('case_seed_003', 'org_shf_001', 'program_seed_002', 'enrollment_review', 'in_review', 'medium', 'team_review_001', 'user_reviewer_001'),
('case_seed_004', 'org_shf_001', 'program_seed_003', 'follow_up', 'on_hold', 'low', 'team_ops_001', 'user_operator_001'),
('case_seed_005', 'org_shf_001', 'program_seed_001', 'completion_review', 'resolved', 'medium', 'team_review_001', 'user_reviewer_001')
ON CONFLICT (case_id) DO NOTHING;
