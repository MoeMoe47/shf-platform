INSERT INTO memberships (
  membership_id, user_id, organization_id, team_id, role_id, status, effective_from
) VALUES
('mem_admin_001', 'user_admin_001', 'org_shf_001', 'team_lead_001', 'role_org_admin', 'active', NOW()),
('mem_operator_001', 'user_operator_001', 'org_shf_001', 'team_ops_001', 'role_operator', 'active', NOW()),
('mem_pm_001', 'user_pm_001', 'org_shf_001', 'team_prog_001', 'role_program_manager', 'active', NOW()),
('mem_reviewer_001', 'user_reviewer_001', 'org_shf_001', 'team_review_001', 'role_reviewer', 'active', NOW())
ON CONFLICT (membership_id) DO NOTHING;
