INSERT INTO teams (team_id, organization_id, name, team_type, status) VALUES
('team_ops_001', 'org_shf_001', 'Operations Team', 'operations', 'active'),
('team_prog_001', 'org_shf_001', 'Program Management', 'operations', 'active'),
('team_review_001', 'org_shf_001', 'Review Team', 'review', 'active'),
('team_lead_001', 'org_shf_001', 'Leadership Team', 'leadership', 'active')
ON CONFLICT (team_id) DO NOTHING;
