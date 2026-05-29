import React from "react";
import useAuth from "./useAuth";

export function MissingPermissionNotice({ permissions = [] }) {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: 16,
        border: "1px solid rgba(248, 113, 113, 0.28)",
        background: "rgba(127, 29, 29, 0.18)",
        color: "#fecaca",
        lineHeight: 1.6,
      }}
    >
      <strong>Access restricted.</strong>
      <br />
      Missing required permission{permissions.length === 1 ? "" : "s"}:{" "}
      {permissions.join(", ")}
    </div>
  );
}

export default function PermissionGuard({
  permissions = [],
  mode = "every",
  children,
  fallback = null,
}) {
  const auth = useAuth();

  if (auth.loading) {
    return <div style={{ padding: 24, color: "#cbd5e1" }}>Checking permissions…</div>;
  }

  const required = Array.isArray(permissions) ? permissions : [permissions];

  const allowed =
    required.length === 0
      ? true
      : mode === "some"
      ? required.some((perm) => auth.hasPermission(perm))
      : required.every((perm) => auth.hasPermission(perm));

  if (!allowed) {
    return fallback || <MissingPermissionNotice permissions={required} />;
  }

  return children;
}
