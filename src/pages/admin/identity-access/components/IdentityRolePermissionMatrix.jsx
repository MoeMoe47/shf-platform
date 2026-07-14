import React from "react";

export default function IdentityRolePermissionMatrix({ matrix = {} }) {
  const roles = matrix.roles || {};
  return (
    <section className="identityAccess-panel span-6">
      <div className="panel-heading"><p>Permissions</p><h2>Role Permission Matrix</h2></div>
      <div className="identityAccess-list">
        {Object.entries(roles).map(([role, permissions]) => (
          <article key={role}>
            <strong>{role}</strong>
            <span>{permissions.length} permissions</span>
            <em>{permissions.slice(0, 5).join(", ")}{permissions.length > 5 ? "..." : ""}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

