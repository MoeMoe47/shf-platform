-- 088_impact_attribution_permissions.sql
-- SHF Hybrid Roadmap Phase 7: explicit authority for impact attribution and
-- network aggregation. This migration does not create a second Truth,
-- Evidence, metric, funding, or service-agreement store.

INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT permission_id, role_id, permission_name
FROM (
  VALUES
    ('rp_phase7_impact_aggregate_view_super', 'role_super_admin', 'impact.aggregate.view'),
    ('rp_phase7_impact_aggregate_view_shf', 'role_shf_admin', 'impact.aggregate.view'),
    ('rp_phase7_impact_aggregate_view_shs', 'role_shs_admin', 'impact.aggregate.view'),
    ('rp_phase7_impact_aggregate_view_org_admin', 'role_org_admin', 'impact.aggregate.view'),
    ('rp_phase7_impact_aggregate_view_partner_admin', 'role_partner_org_admin', 'impact.aggregate.view')
) AS requested(permission_id, role_id, permission_name)
WHERE EXISTS (SELECT 1 FROM roles WHERE roles.role_id = requested.role_id)
ON CONFLICT (role_permission_id) DO NOTHING;
