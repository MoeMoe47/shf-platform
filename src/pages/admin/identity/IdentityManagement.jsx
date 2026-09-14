import React, { useEffect, useMemo, useState } from "react";
import "@/styles/admin.appRegistry.css";
import useAuth from "../../../auth/useAuth";
import { SHS_AUTH_API_BASE } from "@/system/identity/authConfig";
import { getPreferredOrganizationId } from "@/system/identity/organizationContextPreference";

const API_BASE = window.__SHS_API_BASE__ || SHS_AUTH_API_BASE || "/api";

function developmentIdentityHeaders() {
  try {
    const userId = window.__user?.id || import.meta.env.VITE_DEV_USER_ID;
    const localHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    if (import.meta.env.DEV && localHost && userId) return { Authorization: `Bearer dev-token:${userId}` };
  } catch {
    // Production relies on the authenticated session cookie.
  }
  return {};
}

async function readJson(res) {
  const text = await res.text();
  let parsed = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }
  if (!res.ok) {
    const error = new Error(parsed?.error?.message || parsed?.detail || parsed?.error || "Request failed.");
    error.status = res.status;
    error.data = parsed;
    throw error;
  }
  return parsed?.data || parsed;
}

function requestHeaders(extra = {}) {
  const preferredOrganizationId = getPreferredOrganizationId();
  return {
    "Content-Type": "application/json",
    ...developmentIdentityHeaders(),
    ...(preferredOrganizationId ? { "x-shs-preferred-organization-id": preferredOrganizationId } : {}),
    ...extra,
  };
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: requestHeaders(options.headers || {}),
  });
  return readJson(response);
}

function titleize(value) {
  return String(value || "unknown").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function StatusBadge({ value }) {
  const normalized = String(value || "unknown").toUpperCase();
  return (
    <span className="ar-pill ar-pillOn" aria-label={`Status ${titleize(normalized)}`}>
      {titleize(normalized)}
    </span>
  );
}

function EmptyState({ title, children }) {
  return (
    <div className="ar-card ar-cardDisabled" style={{ marginTop: 12 }}>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>{title}</h3>
      <div className="ar-sub">{children}</div>
    </div>
  );
}

export default function IdentityManagement() {
  const auth = useAuth();
  const [overview, setOverview] = useState(null);
  const [roles, setRoles] = useState([]);
  const [roleDrafts, setRoleDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const context = overview?.context || {};
  const organization = overview?.organization || {};
  const members = overview?.members || [];
  const services = overview?.services || [];
  const relationships = overview?.relationships || [];
  const settings = overview?.settings || [];
  const emptyStates = overview?.empty_states || {};

  const canAssignMembership = auth.hasPermission("identity.membership.assign");
  const canRevokeMembership = auth.hasPermission("identity.membership.revoke");
  const isSuspendedOrg = String(context.organization_status || organization.status || "").toLowerCase() !== "active";

  const servicesByState = useMemo(() => ({
    active: services.filter((service) => service.status === "ACTIVE"),
    pending: services.filter((service) => service.status === "PENDING"),
    inactive: services.filter((service) => ["SUSPENDED", "REVOKED", "EXPIRED"].includes(service.status)),
    discovery: services.filter((service) => service.status === "AVAILABLE_FOR_DISCOVERY"),
  }), [services]);

  async function loadOverview() {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const [overviewData, roleData] = await Promise.all([
        apiFetch("/identity/organization-admin/overview"),
        apiFetch("/identity/roles").catch(() => ({ items: [] })),
      ]);
      setOverview(overviewData);
      setRoles(roleData.items || []);
      setRoleDrafts({});
    } catch (err) {
      setError(err?.message || "Organization administration is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  async function changeRole(member) {
    const roleId = roleDrafts[member.membership_id];
    if (!roleId) {
      setStatus("Choose a permitted organization role first.");
      return;
    }
    setStatus("");
    try {
      await apiFetch(`/identity/memberships/${member.membership_id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role_id: roleId, reason: "IOH-4 bounded organization admin role update" }),
      });
      await Promise.all([loadOverview(), auth.refreshAuth()]);
      setStatus("Role updated. Context refreshed from backend authority.");
    } catch (err) {
      setStatus(err?.message || "Role update was denied.");
    }
  }

  async function revokeMember(member) {
    setStatus("");
    try {
      await apiFetch(`/identity/memberships/${member.membership_id}/revoke`, {
        method: "PATCH",
        body: JSON.stringify({ reason: "IOH-4 bounded organization admin revocation" }),
      });
      await Promise.all([loadOverview(), auth.refreshAuth()]);
      setStatus("Membership revoked. Active organization context will fail closed for that user on next resolution.");
    } catch (err) {
      setStatus(err?.message || "Membership revocation was denied.");
    }
  }

  if (loading || auth.loading) {
    return <div className="ar-wrap"><div className="ar-sub" role="status">Loading organization administration...</div></div>;
  }

  if (error) {
    return (
      <main className="ar-wrap">
        <header className="ar-head">
          <div>
            <div className="ar-kicker">Organization</div>
            <h1 className="ar-title">Administration</h1>
            <div className="ar-sub" role="alert">{error}</div>
          </div>
        </header>
        <section className="ar-card" style={{ maxWidth: 980, margin: "18px auto 0" }}>
          <h2 style={{ marginTop: 0 }}>Access unavailable</h2>
          <p className="ar-sub">
            The active backend session did not return an authorized organization-admin context. Refresh your session or choose another authorized organization.
          </p>
          <button className="ar-btn" type="button" onClick={loadOverview}>Retry</button>
        </section>
      </main>
    );
  }

  return (
    <main className="ar-wrap" data-ioh4-org-admin>
      <header className="ar-head">
        <div>
          <div className="ar-kicker">Organization</div>
          <h1 className="ar-title">Administration</h1>
          <div className="ar-sub">
            {organization.display_name || organization.organization_id} - {titleize(context.actor_roles?.[0] || auth.role || "member")}
          </div>
        </div>
        <div className="ar-actions" aria-label="Organization context">
          <StatusBadge value={organization.status || context.organization_status} />
          <StatusBadge value={context.membership_status} />
          <button className="ar-btn ar-btnGhost" type="button" onClick={loadOverview}>Refresh</button>
        </div>
      </header>

      {status ? (
        <section className="ar-card" style={{ maxWidth: 1200, margin: "0 auto 18px" }} role="status">
          <div className="ar-sub">{status}</div>
        </section>
      ) : null}

      {isSuspendedOrg ? (
        <section className="ar-card ar-cardGated" style={{ maxWidth: 1200, margin: "0 auto 18px" }} role="status">
          <h2 style={{ marginTop: 0 }}>Organization suspended</h2>
          <p className="ar-sub">
            Operational actions are unavailable while the organization is not active. Backend policy remains authoritative for every protected request.
          </p>
        </section>
      ) : null}

      <section className="ar-grid" aria-label="Organization administration overview">
        <article className="ar-card">
          <h2 style={{ marginTop: 0 }}>Organization</h2>
          <dl style={{ display: "grid", gap: 10, margin: 0 }}>
            <div><dt className="ar-sub">Name</dt><dd style={{ margin: 0, fontWeight: 700 }}>{organization.display_name || "Unknown"}</dd></div>
            <div><dt className="ar-sub">Legal name</dt><dd style={{ margin: 0 }}>{organization.legal_name || "Read-only"}</dd></div>
            <div><dt className="ar-sub">Type</dt><dd style={{ margin: 0 }}>{titleize(organization.organization_type)}</dd></div>
            <div><dt className="ar-sub">Mission</dt><dd style={{ margin: 0 }}>{organization.mission || "No mission summary available."}</dd></div>
          </dl>
        </article>

        <article className="ar-card">
          <h2 style={{ marginTop: 0 }}>Security / Access</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Active organization context is required.</li>
            <li>Organization admin is distinct from platform admin.</li>
            <li>MFA, SSO, and SCIM are external or later identity work.</li>
            <li>Entitlements and relationships are displayed, not granted here.</li>
          </ul>
        </article>

        <article className="ar-card">
          <h2 style={{ marginTop: 0 }}>Relationships</h2>
          {relationships.length ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {relationships.map((relationship) => (
                <li key={relationship.relationship_id} style={{ marginBottom: 8 }}>
                  {titleize(relationship.relationship_type)} - {titleize(relationship.status)} - read-only
                </li>
              ))}
            </ul>
          ) : (
            <div className="ar-sub">No relationship summary is available for this organization.</div>
          )}
        </article>
      </section>

      <section className="ar-card" style={{ maxWidth: 1200, margin: "18px auto 0" }}>
        <h2 style={{ marginTop: 0 }}>Members</h2>
        {members.length <= 1 ? (
          <EmptyState title="No members beyond the initial admin">
            This organization has no additional active members in the bounded member projection.
          </EmptyState>
        ) : null}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: "left", padding: 10 }}>Member</th>
                <th scope="col" style={{ textAlign: "left", padding: 10 }}>Status</th>
                <th scope="col" style={{ textAlign: "left", padding: 10 }}>Role</th>
                <th scope="col" style={{ textAlign: "left", padding: 10 }}>Role action</th>
                <th scope="col" style={{ textAlign: "left", padding: 10 }}>Membership action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.membership_id} style={{ borderTop: "1px solid var(--ar-border)" }}>
                  <td style={{ padding: 10 }}>{member.user_id}</td>
                  <td style={{ padding: 10 }}><StatusBadge value={member.status} /></td>
                  <td style={{ padding: 10 }}>{titleize(member.role_name || member.role_id)}</td>
                  <td style={{ padding: 10 }}>
                    <label>
                      <span className="ar-sub" style={{ display: "block" }}>Permitted role</span>
                      <select
                        value={roleDrafts[member.membership_id] || ""}
                        onChange={(event) => setRoleDrafts((prev) => ({ ...prev, [member.membership_id]: event.target.value }))}
                        disabled={!canAssignMembership || isSuspendedOrg || member.status !== "active"}
                        style={{ maxWidth: 220, width: "100%", padding: 8 }}
                      >
                        <option value="">No role change</option>
                        {roles.map((role) => (
                          <option key={role.role_id} value={role.role_id}>{titleize(role.role_name)}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="ar-btn ar-btnGhost"
                      type="button"
                      style={{ marginTop: 8 }}
                      disabled={!canAssignMembership || isSuspendedOrg || member.status !== "active"}
                      onClick={() => changeRole(member)}
                    >
                      Update Role
                    </button>
                  </td>
                  <td style={{ padding: 10 }}>
                    <button
                      className="ar-btn ar-btnGhost"
                      type="button"
                      disabled={!canRevokeMembership || isSuspendedOrg || member.status !== "active"}
                      onClick={() => revokeMember(member)}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ar-sub">
          Last-admin protection and target-role policy are enforced by the backend. Blocked actions return a specific backend reason such as LAST_ADMIN_REQUIRED or TARGET_ROLE_FORBIDDEN.
        </p>
      </section>

      <section className="ar-card" style={{ maxWidth: 1200, margin: "18px auto 0" }}>
        <h2 style={{ marginTop: 0 }}>Services</h2>
        {emptyStates.no_active_services ? (
          <EmptyState title="No active services">
            The organization is valid, but no active service entitlement is currently available. Service discovery is visible where policy permits.
          </EmptyState>
        ) : null}
        <div className="ar-grid" style={{ marginTop: 12 }}>
          {services.map((service) => (
            <article className={`ar-card ${service.actionable ? "" : "ar-cardDisabled"}`} key={service.service_key}>
              <h3 style={{ marginTop: 0 }}>{service.service_name || titleize(service.service_key)}</h3>
              <StatusBadge value={service.status} />
              <p className="ar-sub">{titleize(service.next_action)}</p>
              <button className="ar-btn ar-btnGhost" type="button" disabled={!service.actionable}>
                {service.actionable ? "Open Where Permitted" : "Not Actionable"}
              </button>
            </article>
          ))}
        </div>
        {servicesByState.pending.length === 0 ? <p className="ar-sub">No pending service requests are present in the canonical projection.</p> : null}
        {servicesByState.inactive.length === 0 ? <p className="ar-sub">No suspended, revoked, or expired services are present.</p> : null}
      </section>

      <section className="ar-card" style={{ maxWidth: 1200, margin: "18px auto 0" }}>
        <h2 style={{ marginTop: 0 }}>Settings</h2>
        {settings.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: "left", padding: 10 }}>Setting</th>
                  <th scope="col" style={{ textAlign: "left", padding: 10 }}>Read / Write</th>
                  <th scope="col" style={{ textAlign: "left", padding: 10 }}>Authority</th>
                  <th scope="col" style={{ textAlign: "left", padding: 10 }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((setting) => (
                  <tr key={setting.key} style={{ borderTop: "1px solid var(--ar-border)" }}>
                    <td style={{ padding: 10 }}>{setting.label}</td>
                    <td style={{ padding: 10 }}>{titleize(setting.read_write)}</td>
                    <td style={{ padding: 10 }}>{titleize(setting.authority)}</td>
                    <td style={{ padding: 10 }}>{setting.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No editable settings">No organization settings are editable through IOH-4.</EmptyState>
        )}
      </section>
    </main>
  );
}
