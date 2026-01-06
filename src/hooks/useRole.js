import { useContext } from "react";
import { UserContext } from "@/context/UserContext.jsx";

/**
 * useRole()
 * Reads role/curriculum from context (or a global shim) with safe defaults.
 */
export function useRole() {
  const ctx = useContext(UserContext) || {};
  const role = String(ctx.role || (window.__user && window.__user.role) || "student").toLowerCase();
  const curriculum = String(ctx.curriculum || (window.__user && window.__user.curriculum) || "asl").toLowerCase();
  return { role, curriculum };
}
