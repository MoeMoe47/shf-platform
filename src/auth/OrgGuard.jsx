import React from "react";
import useAuth from "./useAuth";

export default function OrgGuard({ orgs = [], children, fallback = null }) {
  const auth = useAuth();

  if (auth.loading) return <div style={{ padding: 24, color: "#cbd5e1" }}>Checking organization access…</div>;

  const allowed = orgs.some((org) => auth.belongsToOrg(org));
  if (!allowed) {
    return fallback || <div style={{ padding: 24, color: "#fca5a5" }}>Missing required organization access.</div>;
  }

  return children;
}
