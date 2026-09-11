BEGIN;

INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
VALUES
  ('sys3a5-org-a', 'SYS-3A5 Organization A', 'SYS-3A5 A', 'NONPROFIT', 'active'),
  ('sys3a5-org-b', 'SYS-3A5 Organization B', 'SYS-3A5 B', 'FOR_PROFIT', 'active'),
  ('sys3a5-org-c', 'SYS-3A5 Organization C', 'SYS-3A5 C', 'NONPROFIT', 'active')
ON CONFLICT (organization_id) DO NOTHING;

INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
VALUES
  ('sys3a5-user-a', 'sys3a5-org-a', 'sys3a5-a@example.test', 'SYS-3A5 User A', 'active', 'acceptance'),
  ('sys3a5-user-b', 'sys3a5-org-b', 'sys3a5-b@example.test', 'SYS-3A5 User B', 'active', 'acceptance'),
  ('sys3a5-user-c', 'sys3a5-org-c', 'sys3a5-c@example.test', 'SYS-3A5 User C', 'active', 'acceptance'),
  ('sys3a5-user-revoked', 'sys3a5-org-a', 'sys3a5-revoked@example.test', 'SYS-3A5 Revoked', 'active', 'acceptance')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO roles (role_id, organization_id, role_name, role_scope_type, description, is_system_role)
VALUES
  ('sys3a5-role-a', 'sys3a5-org-a', 'SYS-3A5 Operator', 'ORGANIZATION', 'Scoped SYS-3A5 acceptance operator', FALSE),
  ('sys3a5-role-b', 'sys3a5-org-b', 'SYS-3A5 Operator', 'ORGANIZATION', 'Scoped SYS-3A5 acceptance operator', FALSE),
  ('sys3a5-role-c', 'sys3a5-org-c', 'SYS-3A5 Operator', 'ORGANIZATION', 'Scoped SYS-3A5 acceptance operator', FALSE),
  ('sys3a5-role-revoked', 'sys3a5-org-a', 'SYS-3A5 Revoked', 'ORGANIZATION', 'Revoked acceptance membership', FALSE)
ON CONFLICT (role_id) DO NOTHING;

INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT 'sys3a5-rp-a-' || replace(permission_name, '.', '-'), 'sys3a5-role-a', permission_name
FROM unnest(ARRAY[
  'funding.grant.view', 'funding.grant.manage', 'reports.view', 'reports.preview',
  'reports.publication.authorize', 'reports.publication.execute',
  'reports.public_snapshot.generate', 'reports.public_snapshot.view',
  'reports.public_eligibility.manage', 'reports.public_disclosure.manage',
  'reports.public_disclosure_policy.manage'
]) AS permission_name
ON CONFLICT (role_permission_id) DO NOTHING;

INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT 'sys3a5-rp-b-' || replace(permission_name, '.', '-'), 'sys3a5-role-b', permission_name
FROM unnest(ARRAY[
  'funding.grant.view', 'funding.grant.manage', 'reports.view', 'reports.preview',
  'reports.publication.authorize', 'reports.publication.execute',
  'reports.public_snapshot.generate', 'reports.public_snapshot.view',
  'reports.public_eligibility.manage', 'reports.public_disclosure.manage',
  'reports.public_disclosure_policy.manage'
]) AS permission_name
ON CONFLICT (role_permission_id) DO NOTHING;

INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
SELECT 'sys3a5-rp-c-' || replace(permission_name, '.', '-'), 'sys3a5-role-c', permission_name
FROM unnest(ARRAY['funding.grant.view', 'reports.view']) AS permission_name
ON CONFLICT (role_permission_id) DO NOTHING;

INSERT INTO memberships (membership_id, user_id, organization_id, role_id, status, effective_from)
VALUES
  ('sys3a5-membership-a', 'sys3a5-user-a', 'sys3a5-org-a', 'sys3a5-role-a', 'active', NOW() - INTERVAL '1 day'),
  ('sys3a5-membership-b', 'sys3a5-user-b', 'sys3a5-org-b', 'sys3a5-role-b', 'active', NOW() - INTERVAL '1 day'),
  ('sys3a5-membership-c', 'sys3a5-user-c', 'sys3a5-org-c', 'sys3a5-role-c', 'active', NOW() - INTERVAL '1 day'),
  ('sys3a5-membership-revoked', 'sys3a5-user-revoked', 'sys3a5-org-a', 'sys3a5-role-revoked', 'revoked', NOW() - INTERVAL '1 day')
ON CONFLICT (membership_id) DO NOTHING;

INSERT INTO programs (program_id, organization_id, name, program_type, status, start_date, end_date, created_by_user_id)
VALUES
  ('sys3a5-program-a', 'sys3a5-org-a', 'SYS-3A5 Program A', 'ASSURANCE', 'active', CURRENT_DATE - 1, CURRENT_DATE + 365, 'sys3a5-user-a'),
  ('sys3a5-program-b', 'sys3a5-org-a', 'SYS-3A5 Program B', 'ASSURANCE', 'active', CURRENT_DATE - 1, CURRENT_DATE + 365, 'sys3a5-user-a')
ON CONFLICT (program_id) DO NOTHING;

INSERT INTO service_catalog (service_id, service_key, name, description, category, status, provider_organization_id, audience, requires_relationship_type)
VALUES ('sys3a5-svc-reporting', 'reporting', 'SYS-3A5 Reporting', 'Disposable acceptance reporting entitlement', 'REPORTING', 'ACTIVE', 'sys3a5-org-a', 'NETWORK_ORGANIZATION', NULL)
ON CONFLICT (service_id) DO NOTHING;

INSERT INTO organization_service_entitlements (entitlement_id, organization_id, service_id, status, granted_by_user_id, reason)
VALUES ('sys3a5-entitlement-a', 'sys3a5-org-a', 'sys3a5-svc-reporting', 'ACTIVE', 'sys3a5-user-a', 'SYS-3A5 acceptance fixture')
ON CONFLICT (entitlement_id) DO NOTHING;

COMMIT;
