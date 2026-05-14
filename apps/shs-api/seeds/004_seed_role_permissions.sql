INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
('rp_001','role_org_admin','user.read'),
('rp_002','role_org_admin','role.read'),
('rp_003','role_org_admin','membership.assign'),
('rp_004','role_org_admin','membership.revoke'),
('rp_005','role_org_admin','program.create'),
('rp_006','role_org_admin','program.read'),
('rp_007','role_org_admin','program.update'),
('rp_008','role_org_admin','program.transition'),
('rp_009','role_org_admin','case.create'),
('rp_010','role_org_admin','case.read'),
('rp_011','role_org_admin','case.update'),
('rp_012','role_org_admin','case.assign'),
('rp_013','role_org_admin','case.transition'),
('rp_014','role_org_admin','audit.read'),

('rp_015','role_operator','program.read'),
('rp_016','role_operator','case.create'),
('rp_017','role_operator','case.read'),
('rp_018','role_operator','case.update'),
('rp_019','role_operator','case.assign'),
('rp_020','role_operator','case.transition'),

('rp_021','role_program_manager','program.create'),
('rp_022','role_program_manager','program.read'),
('rp_023','role_program_manager','program.update'),
('rp_024','role_program_manager','program.transition'),
('rp_025','role_program_manager','case.read'),

('rp_026','role_reviewer','case.read'),
('rp_027','role_reviewer','audit.read')
ON CONFLICT (role_permission_id) DO NOTHING;
