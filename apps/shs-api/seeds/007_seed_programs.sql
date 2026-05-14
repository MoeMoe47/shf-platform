INSERT INTO programs (
  program_id, organization_id, name, program_type, status, owner_team_id
) VALUES
('program_seed_001', 'org_shf_001', 'Summer STEM Camp', 'education', 'active', 'team_prog_001'),
('program_seed_002', 'org_shf_001', 'Career Launchpad Pilot', 'workforce', 'draft', 'team_prog_001'),
('program_seed_003', 'org_shf_001', 'Reentry Pathways', 'reentry', 'paused', 'team_prog_001')
ON CONFLICT (program_id) DO NOTHING;
