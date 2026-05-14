import React from "react";
import useAuth from "./useAuth";

export default function AuthGuard({ children, fallback = null }) {
  const auth = useAuth();

  if (auth.loading) {
    return <div style={{ padding: 24, color: "#cbd5e1" }}>Loading session…</div>;
  }

  if (!auth.isAuthenticated) {
    return fallback || <div style={{ padding: 24, color: "#fca5a5" }}>Access denied. Please log in.</div>;
  }

  return children;
}
