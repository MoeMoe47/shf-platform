import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchCurrentIdentity,
  loginWithPassword,
  logoutSession,
  refreshSession,
} from "@/system/identity/authClient";
import { normalizeAuthRole } from "@/system/identity/authRoles";
import { BOS_AUTH_ROLES } from "@/system/identity/authRoles";
import { emptyAuthState, normalizeIdentityResponse } from "@/system/identity/authState";
import { publishAuthClientEvent } from "@/system/identity/authEvents";
import {
  assertNoSessionTokenStorage,
  clearLegacyAuthoritativeIdentityState,
} from "@/system/identity/authStorageSafety";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(() => emptyAuthState("loading"));
  const [error, setError] = useState("");
  const [httpStatus, setHttpStatus] = useState(0);

  const applyIdentity = useCallback((data) => {
    const next = normalizeIdentityResponse(data);
    clearLegacyAuthoritativeIdentityState();
    assertNoSessionTokenStorage();
    setState(next);
    setHttpStatus(0);
    return next;
  }, []);

  const clearAuth = useCallback((status = "invalid", statusCode = 0) => {
    clearLegacyAuthoritativeIdentityState();
    setState(emptyAuthState(status));
    setHttpStatus(statusCode);
  }, []);

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCurrentIdentity();
      applyIdentity(data);
    } catch (err) {
      const status = err?.status || 0;
      const sessionStatus = status === 401 ? "invalid" : status === 403 ? "forbidden" : "network_error";
      clearAuth(sessionStatus, status);
      setError(status === 401 ? "" : err?.message || "Failed to load session.");
      publishAuthClientEvent({
        event_type: "auth_session_load_failed",
        result: "failed",
        reason: sessionStatus,
      });
    } finally {
      setLoading(false);
    }
  }, [applyIdentity, clearAuth]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(async ({ email, password }) => {
    setError("");
    const data = await loginWithPassword({ email, password });
    const next = applyIdentity(data);
    publishAuthClientEvent({ event_type: "auth_login_success", result: "allowed" });
    return next;
  }, [applyIdentity]);

  const logout = useCallback(async () => {
    setError("");
    try {
      await logoutSession(state.csrfToken);
    } finally {
      clearAuth("revoked", 401);
      publishAuthClientEvent({ event_type: "auth_logout", result: "allowed" });
    }
  }, [clearAuth, state.csrfToken]);

  const rotateSession = useCallback(async () => {
    const data = await refreshSession(state.csrfToken);
    return applyIdentity(data);
  }, [applyIdentity, state.csrfToken]);

  const hasRole = useCallback((roleName) => {
    return normalizeAuthRole(state.role) === normalizeAuthRole(roleName) ||
      state.memberships.some((m) => normalizeAuthRole(m?.role || m?.role_name) === normalizeAuthRole(roleName));
  }, [state.memberships, state.role]);

  const hasPermission = useCallback((permissionKey) => {
    if (state.role === BOS_AUTH_ROLES.SHS_ADMIN && !String(permissionKey || "").startsWith("bos.")) {
      return true;
    }
    if (state.role === BOS_AUTH_ROLES.CLIENT_ADMIN && ["reports.view", "reports.preview"].includes(permissionKey)) {
      return true;
    }
    return state.permissions.includes(permissionKey);
  }, [state.permissions, state.role]);

  const belongsToOrg = useCallback((orgIdOrType) => {
    return state.memberships.some(
      (m) =>
        m?.organization_id === orgIdOrType ||
        m?.org_id === orgIdOrType ||
        m?.organization_type === orgIdOrType ||
        m?.org_type === orgIdOrType
    );
  }, [state.memberships]);

  const value = useMemo(() => ({
    loading,
    error,
    httpStatus,
    user: state.user,
    role: state.role,
    memberships: state.memberships,
    permissions: state.permissions,
    sessionStatus: state.sessionStatus,
    csrfToken: state.csrfToken,
    expiresAt: state.expiresAt,
    reauthRequired: state.reauthRequired,
    environment: state.environment,
    isAuthenticated: state.authenticated,
    isForbidden: httpStatus === 403 || state.sessionStatus === "forbidden",
    isExpired: state.sessionStatus === "expired",
    isRevoked: state.sessionStatus === "revoked",
    refreshAuth,
    login,
    logout,
    rotateSession,
    hasRole,
    hasPermission,
    belongsToOrg,
  }), [
    loading,
    error,
    httpStatus,
    state,
    refreshAuth,
    login,
    logout,
    rotateSession,
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
