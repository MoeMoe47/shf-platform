INSERT INTO organizations (
  organization_id, legal_name, display_name, org_type, status, primary_domain
) VALUES (
  'org_shf_001',
  'Silicon Heartland Foundation',
  'Silicon Heartland Foundation',
  'nonprofit',
  'active',
  'siliconheartland.org'
)
ON CONFLICT (organization_id) DO NOTHING;
