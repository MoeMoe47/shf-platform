import React from "react";
import useAuth from "./useAuth";

export default function RoleGuard({ roles = [], children, fallback = null }) {
  const auth = useAuth();

  if (auth.loading) return <div style={{ padding: 24, color: "#cbd5e1" }}>Checking role…</div>;

  const allowed = roles.some((role) => auth.hasRole(role));
  if (!allowed) {
    return fallback || <div style={{ padding: 24, color: "#fca5a5" }}>Missing required role.</div>;
  }

  return children;
}
