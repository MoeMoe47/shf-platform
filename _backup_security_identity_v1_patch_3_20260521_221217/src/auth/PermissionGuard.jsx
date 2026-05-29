import React from "react";
import useAuth from "./useAuth";

export default function PermissionGuard({ permissions = [], children, fallback = null }) {
  const auth = useAuth();

  if (auth.loading) return <div style={{ padding: 24, color: "#cbd5e1" }}>Checking permissions…</div>;

  const allowed = permissions.every((perm) => auth.hasPermission(perm));
  if (!allowed) {
    return fallback || <div style={{ padding: 24, color: "#fca5a5" }}>Missing required permission.</div>;
  }

  return children;
}
