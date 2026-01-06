import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEntitlements } from "@/context/EntitlementsContext.jsx";

// Placeholder: wire to your real auth (OAuth, Clerk, Supabase, etc.)
export default function SalesLogin() {
  const nav = useNavigate();
  const loc = useLocation();
  const { refresh } = useEntitlements();

  async function handleSignIn(e) {
    e.preventDefault();
    // TODO: call your real sign-in; on success, refresh() to pull roles
    await refresh?.();
    nav(loc.state?.from?.pathname || "/", { replace: true });
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Sales — Staff Sign In</h1>
      <p>Restricted area for Sales/Marketing staff.</p>
      <form onSubmit={handleSignIn}>
        <button type="submit">Sign in with your staff account</button>
      </form>
    </div>
  );
}
