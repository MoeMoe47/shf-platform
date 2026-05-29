import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { mergeRolePermissions } from "@/system/security/security-permissions";

const AuthContext = createContext(null);

const API_BASE =
  window.__SHS_API_BASE__ ||
  (import.meta.env.VITE_SHS_API_BASE || "/api");

async function safeJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}


function isLocalDevHost() {
  try {
    const host = String(window.location.hostname || "");
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

function createLocalDevAuthSession() {
  return {
    user: {
      id: "demo-user-1",
      email: "admin@shs.local",
      first_name: "SHS",
      last_name: "Admin",
      name: "SHS Admin",
      role: "shs_admin",
      clearanceLevel: "system_admin",
    },
    memberships: [
      {
        organization_id: "shs-core",
        organization_type: "infrastructure",
        role: "shs_admin",
        role_name: "shs_admin",
      },
      {
        organization_id: "shf-core",
        organization_type: "foundation",
        role: "shf_admin",
        role_name: "shf_admin",
      },
    ],
    permissions: mergeRolePermissions(["super_admin"]),
  };
}

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState("");

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (import.meta.env.DEV && isLocalDevHost()) {
          const demo = createLocalDevAuthSession();
          setUser(demo.user);
          setMemberships(demo.memberships);
          setPermissions(demo.permissions);
          setLoading(false);
          return;
        }

        setUser(null);
        setMemberships([]);
        setPermissions([]);
        setLoading(false);
        return;
      }

      const data = await safeJson(res);
      setUser(data.user || null);
      setMemberships(data.memberships || []);
      setPermissions(data.permissions || []);
    } catch (err) {
      if (import.meta.env.DEV && isLocalDevHost()) {
        const demo = createLocalDevAuthSession();
        setError("");
        setUser(demo.user);
        setMemberships(demo.memberships);
        setPermissions(demo.permissions);
      } else {
        setError(err?.message || "Failed to load session.");
        setUser(null);
        setMemberships([]);
        setPermissions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(async ({ email, password }) => {
    setError("");
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data?.error || "Login failed.");
    }
    await refreshAuth();
    return data;
  }, [refreshAuth]);

  const logout = useCallback(async () => {
    setError("");
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
    });
    await refreshAuth();
  }, [refreshAuth]);

  const hasRole = useCallback((roleName) => {
    return memberships.some((m) => m?.role === roleName || m?.role_name === roleName);
  }, [memberships]);

  const hasPermission = useCallback((permissionKey) => {
    return permissions.includes(permissionKey);
  }, [permissions]);

  const belongsToOrg = useCallback((orgIdOrType) => {
    return memberships.some(
      (m) =>
        m?.organization_id === orgIdOrType ||
        m?.org_id === orgIdOrType ||
        m?.organization_type === orgIdOrType ||
        m?.org_type === orgIdOrType
    );
  }, [memberships]);

  const value = useMemo(() => ({
    loading,
    error,
    user,
    memberships,
    permissions,
    isAuthenticated: !!user,
    refreshAuth,
    login,
    logout,
    hasRole,
    hasPermission,
    belongsToOrg,
  }), [
    loading,
    error,
    user,
    memberships,
    permissions,
    refreshAuth,
    login,
    logout,
    hasRole,
    hasPermission,
    belongsToOrg,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }
  return ctx;
}
