// src/components/RequireStaff.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useEntitlements } from "@/context/EntitlementsContext.jsx";

export default function RequireStaff({ children }) {
  const { roles = [], entitlements = [], user, loading } = useEntitlements();
  const loc = useLocation();

  if (loading) return null; // or a spinner

  const isLoggedIn = !!user;
  const isStaff =
    roles.includes("admin") ||
    roles.includes("staff") ||
    entitlements.includes("sales");

  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: loc }} />;
  if (!isStaff)     return <Navigate to="/forbidden" replace />;

  return children;
}
