import React, { useEffect, useMemo, useState } from "react";
import "@/styles/admin.appRegistry.css";
import useAuth from "../../../auth/useAuth";

const API_BASE =
  window.__SHS_API_BASE__ ||
  (import.meta.env.VITE_SHS_API_BASE || "/api");

async function readJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function IdentityManagement() {
  const auth = useAuth();

  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loadedInvites, setLoadedInvites] = useState([]);
  const [membershipDrafts, setMembershipDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [inviteForm, setInviteForm] = useState({
    email: "",
    organization_id: "",
    role_id: "",
  });

  const canManage = useMemo(() => {
    return auth.hasRole("super_admin") || auth.hasRole("shs_admin");
  }, [auth]);

  const authDebug = {
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    memberships: auth.memberships,
    permissions: auth.permissions,
    hasSuperAdmin: auth.hasRole("super_admin"),
    hasShsAdmin: auth.hasRole("shs_admin"),
  };

  async function loadData() {
    setLoading(true);
    setStatus("");
    try {
      const [usersRes, orgsRes, rolesRes, invitesRes] = await Promise.all([
        fetch(`${API_BASE}/users`),
        fetch(`${API_BASE}/organizations`),
        fetch(`${API_BASE}/roles`),
        fetch(`${API_BASE}/invites`),
      ]);

      const [usersData, orgsData, rolesData, invitesData] = await Promise.all([
        readJson(usersRes),
        readJson(orgsRes),
        readJson(rolesRes),
        readJson(invitesRes),
      ]);

      const nextUsers = usersData.items || [];
      setUsers(nextUsers);
      setOrgs(orgsData.items || []);
      setRoles(rolesData.items || []);
      setLoadedInvites(invitesData.items || []);
      setMembershipDrafts(
        Object.fromEntries(
          nextUsers.map((u) => [
            u.id,
            {
              organization_id: u.organization_id || "",
              role_id: u.role_id || "",
            },
          ])
        )
      );
    } catch (err) {
      setStatus(err?.message || "Failed to load identity data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function sendInvite(e) {
    e.preventDefault();
    setStatus("");

    if (!inviteForm.email || !inviteForm.organization_id || !inviteForm.role_id) {
      setStatus("Please complete all invite fields.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });

      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || "Invite failed.");

      setStatus(`Invite created for ${data?.invite?.email || inviteForm.email}.`);
      setInvites((prev) => [data.invite, ...prev]);
      setInviteForm({ email: "", organization_id: "", role_id: "" });
    } catch (err) {
      setStatus(err?.message || "Invite failed.");
    }
  }

  async function updateUserStatus(userId, nextStatus) {
    setStatus("");
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || "Status update failed.");

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: data.user.status } : u))
      );
      setStatus(`User status updated to ${data.user.status}.`);
    } catch (err) {
      setStatus(err?.message || "Status update failed.");
    }
  }

  async function updateUserMembership(userId) {
    const draft = membershipDrafts[userId] || {};
    setStatus("");
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/membership`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: draft.organization_id,
          role_id: draft.role_id,
        }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || "Membership update failed.");

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                organization_id: data.user.organization_id,
                role_id: data.user.role_id,
              }
            : u
        )
      );
      setStatus(`Membership updated for ${data.user.email}.`);
    } catch (err) {
      setStatus(err?.message || "Membership update failed.");
    }
  }

  if (loading) {
    return <div className="ar-wrap"><div className="ar-sub">Loading identity management…</div></div>;
  }

  if (!canManage) {
    return (
      <div className="ar-wrap">
        <header className="ar-head">
          <div>
            <div className="ar-kicker">System</div>
            <h1 className="ar-title">Identity Management</h1>
            <div className="ar-sub">Access denied for current user.</div>
          </div>
        </header>
        <div className="ar-card">
          <pre className="ar-code">{JSON.stringify(authDebug, null, 2)}</pre>
        </div>
      </div>
    );
  }

  const allInvites = [...invites, ...loadedInvites];

  return (
    <div className="ar-wrap">
      <header className="ar-head">
        <div>
          <div className="ar-kicker">System</div>
          <h1 className="ar-title">Identity Management</h1>
          <div className="ar-sub">
            Manage users, organizations, roles, and invitations for SHS / SHF V1.
          </div>
        </div>
      </header>

      <section className="ar-card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0, marginBottom: 14 }}>Invite User</h3>
        <form
          onSubmit={sendInvite}
          style={{ display: "grid", gap: 12, maxWidth: 840 }}
        >
          <input
            value={inviteForm.email}
            onChange={(e) => setInviteForm((v) => ({ ...v, email: e.target.value }))}
            placeholder="Email"
            style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(10,14,24,0.45)", color: "#e8eefc" }}
          />

          <select
            value={inviteForm.organization_id}
            onChange={(e) => setInviteForm((v) => ({ ...v, organization_id: e.target.value }))}
            style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(10,14,24,0.45)", color: "#e8eefc" }}
          >
            <option value="">Select organization</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name || org.id}
              </option>
            ))}
          </select>

          <select
            value={inviteForm.role_id}
            onChange={(e) => setInviteForm((v) => ({ ...v, role_id: e.target.value }))}
            style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(10,14,24,0.45)", color: "#e8eefc" }}
          >
            <option value="">Select role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name || role.id}
              </option>
            ))}
          </select>

          <div>
            <button
              className="ar-btn"
              type="submit"
              disabled={!inviteForm.email || !inviteForm.organization_id || !inviteForm.role_id}
            >
              Send Invite
            </button>
          </div>

          {status ? (
            <div className="ar-sub" style={{ color: status.toLowerCase().includes("failed") ? "#fca5a5" : "#86efac" }}>
              {status}
            </div>
          ) : null}
        </form>
      </section>

      <section className="ar-card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0, marginBottom: 14 }}>Recent Invites</h3>
        {allInvites.length === 0 ? (
          <div className="ar-sub">No invites created yet.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {allInvites.map((invite, idx) => (
              <li key={invite?.id || idx} style={{ marginBottom: 8 }}>
                {invite?.email || "unknown"} — {invite?.organization_id || "no org"} — {invite?.role_id || "no role"} — {invite?.status || "created"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="ar-grid">
        <section className="ar-card">
          <h3 style={{ marginTop: 0, marginBottom: 14 }}>Users</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {users.map((user) => {
            const draft = membershipDrafts[user.id] || {
              organization_id: user.organization_id || "",
              role_id: user.role_id || "",
            };

            return (
              <div key={user.id} className="ar-card" style={{ marginBottom: 0, padding: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{user.email || user.id}</div>
                <div className="ar-sub" style={{ marginBottom: 8 }}>
                  Status: {user.status || "unknown"}
                </div>
                <div className="ar-sub" style={{ marginBottom: 12 }}>
                  Org: {user.organization_id || "—"} • Role: {user.role_id || "—"}
                </div>

                <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
                  <select
                    value={draft.organization_id}
                    onChange={(e) =>
                      setMembershipDrafts((prev) => ({
                        ...prev,
                        [user.id]: {
                          ...(prev[user.id] || {}),
                          organization_id: e.target.value,
                          role_id: (prev[user.id] || {}).role_id || user.role_id || "",
                        },
                      }))
                    }
                    style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(10,14,24,0.45)", color: "#e8eefc" }}
                  >
                    <option value="">Select organization</option>
                    {orgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name || org.id}
                      </option>
                    ))}
                  </select>

                  <select
                    value={draft.role_id}
                    onChange={(e) =>
                      setMembershipDrafts((prev) => ({
                        ...prev,
                        [user.id]: {
                          ...(prev[user.id] || {}),
                          role_id: e.target.value,
                          organization_id: (prev[user.id] || {}).organization_id || user.organization_id || "",
                        },
                      }))
                    }
                    style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(10,14,24,0.45)", color: "#e8eefc" }}
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name || role.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="ar-btn ar-btnGhost" onClick={() => updateUserStatus(user.id, "active")}>
                    Set Active
                  </button>
                  <button type="button" className="ar-btn ar-btnGhost" onClick={() => updateUserStatus(user.id, "disabled")}>
                    Set Disabled
                  </button>
                  <button type="button" className="ar-btn" onClick={() => updateUserMembership(user.id)}>
                    Save Membership
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </section>

        <section className="ar-card">
          <h3 style={{ marginTop: 0, marginBottom: 14 }}>Organizations</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {orgs.map((org) => (
              <li key={org.id} style={{ marginBottom: 8 }}>
                {org.name || org.id} {org.org_type ? `(${org.org_type})` : ""}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
