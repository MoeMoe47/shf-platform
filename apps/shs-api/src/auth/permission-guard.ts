export function requirePermission(permission: string) {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: { code: "AUTH_REQUIRED", message: "Authentication required." },
        correlation_id: "corr_auth_required",
      });
    }

    if (user.org_context_error) {
      return res.status(403).json({
        ok: false,
        error: { code: user.org_context_error, message: "Valid active organization context is required." },
        correlation_id: "corr_org_context_forbidden",
      });
    }

    if (!user.active_organization_id || !user.tenant_id) {
      return res.status(403).json({
        ok: false,
        error: { code: "ORG_CONTEXT_REQUIRED", message: "Valid active organization context is required." },
        correlation_id: "corr_org_context_required",
      });
    }

    const permissions = user.permissions || [];
    if (!permissions.includes(permission)) {
      return res.status(403).json({
        ok: false,
        error: { code: "FORBIDDEN", message: `Missing permission: ${permission}` },
        correlation_id: "corr_forbidden",
      });
    }

    return next();
  };
}
