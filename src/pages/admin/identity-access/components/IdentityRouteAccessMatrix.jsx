import React from "react";

export default function IdentityRouteAccessMatrix({ matrix = {} }) {
  return (
    <section className="identityAccess-panel span-6">
      <div className="panel-heading"><p>Routes</p><h2>Protected Route Matrix</h2></div>
      <div className="identityAccess-list">
        {(matrix.routes || []).map((route) => (
          <article key={route.route}>
            <strong>{route.route}</strong>
            <span>{route.required_role} + {route.required_permission}</span>
            <em>client_admin {route.client_admin}; public {route.public}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

