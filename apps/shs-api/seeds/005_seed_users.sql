INSERT INTO users (
  user_id, organization_id, email, full_name, status, identity_source
) VALUES
('user_admin_001', 'org_shf_001', 'admin@siliconheartland.org', 'SHF Org Admin', 'active', 'local'),
('user_operator_001', 'org_shf_001', 'operator@siliconheartland.org', 'SHF Operator', 'active', 'local'),
('user_pm_001', 'org_shf_001', 'pm@siliconheartland.org', 'SHF Program Manager', 'active', 'local'),
('user_reviewer_001', 'org_shf_001', 'reviewer@siliconheartland.org', 'SHF Reviewer', 'active', 'local')
ON CONFLICT (user_id) DO NOTHING;
