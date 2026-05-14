INSERT INTO roles (role_id, organization_id, role_name, role_scope_type, is_system_role) VALUES
('role_org_admin', NULL, 'org_admin', 'organization', TRUE),
('role_operator', NULL, 'operator', 'organization', TRUE),
('role_program_manager', NULL, 'program_manager', 'organization', TRUE),
('role_reviewer', NULL, 'reviewer', 'organization', TRUE)
ON CONFLICT (role_id) DO NOTHING;
