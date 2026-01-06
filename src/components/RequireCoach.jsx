// src/components/RequireCoach.jsx
import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { useRole } from "@/hooks/useRole.js";

export default function RequireCoach({ children }){
  const { role } = useRole();
  const { curriculum = "asl" } = useParams();
  const allowed = /^(coach|instructor|admin)$/i.test(String(role || ""));
  if (!allowed) {
    // Not authorized → send to parent landing (or lessons)
    return <Navigate to={`/${curriculum}/parent`} replace />;
  }
  return children;
}
