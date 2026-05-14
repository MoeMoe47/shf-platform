import React from "react";
import { Navigate } from "react-router-dom";
import { useRole } from "@/hooks/useRole.js";

/**
 * RequireAdmin
 * Redirects non-admins back to their curriculum dashboard.
 */
export default function RequireAdmin({ children }) {
  const { role, curriculum } = useRole();
  if (role !== "admin") {
    return <Navigate to={`/${curriculum}/dashboard`} replace />;
  }
  return children;
}
