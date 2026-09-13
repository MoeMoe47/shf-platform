import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/auth/auth-context.jsx";
import TourProvider from "@/system/tour/TourProvider.jsx";

const FIXTURE_PREFIX = "/ogl-acceptance";

function scopeFromAuth(auth) {
  const membership = auth.memberships.find((item) => item?.organization_id || item?.org_id) || null;
  const organizationId = membership?.organization_id || membership?.org_id || auth.user?.organization_id || "phase8_org_a";
  return {
    userId: auth.user?.id || "instructor_A_authorized",
    organizationId,
    tenantId: `tenant:${organizationId}`,
    role: auth.role || "instructor",
  };
}
const crossRouteSteps = [
  {
    id: "ogl-acceptance-step-a",
    order: 0,
    title: "Start on Route A",
    body: { primary: "This controlled acceptance surface proves route-aware tour continuation.", why: "The canonical runtime must retain the exact experience scope while the route changes." },
    target: { mode: "SEMANTIC_ANCHOR", anchorId: "ogl-acceptance-anchor-a" },
    missingAnchorPolicy: "REQUIRE_TARGET",
  },
  {
    id: "ogl-acceptance-step-b",
    order: 1,
    title: "Continue on Route B",
    body: { primary: "The tour resumed on the new route at the next step.", action: "Finish this acceptance tour when the Route B target is ready." },
    target: { mode: "SEMANTIC_ANCHOR", anchorId: "ogl-acceptance-anchor-b" },
    missingAnchorPolicy: "REQUIRE_TARGET",
  },
];

const delayedTargetSteps = [
  {
    id: "ogl-acceptance-delayed-step",
    order: 0,
    title: "Wait for the delayed target",
    body: { primary: "This target mounts after a deterministic fixture delay.", why: "The runtime should wait briefly and attach when the semantic anchor becomes usable." },
    target: { mode: "SEMANTIC_ANCHOR", anchorId: "ogl-acceptance-anchor-c" },
    missingAnchorPolicy: "SHOW_UNANCHORED",
  },
];

function FixtureFrame({ mode, children }) {
  return <main data-ogl-acceptance-fixture={mode} style={{ minHeight: "100vh", padding: "32px", background: "#f5f7fa", color: "#1f2937" }}>
    <p style={{ margin: 0, fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#536273" }}>Development acceptance fixture</p>
    <h1 style={{ margin: "8px 0 12px", fontSize: "28px" }}>OGL {mode === "cross-route" ? "Route Continuation" : "Delayed Target"}</h1>
    {children}
  </main>;
}

function CrossRouteSurface({ route }) {
  const navigate = useNavigate();
  return <FixtureFrame mode="cross-route">
    <p data-ogl-fixture-status="route">Active route: {route}</p>
    {route === "route-a" ? <section data-ogl-anchor="ogl-acceptance-anchor-a" style={{ maxWidth: "520px", padding: "24px", background: "white", border: "1px solid #d7dee8" }}>
      <h2>Route A workspace</h2><p>This is the first route in the bounded acceptance flow.</p>
      <button type="button" onClick={() => navigate(`${FIXTURE_PREFIX}/route-b`)}>Open Route B</button>
    </section> : <section data-ogl-anchor="ogl-acceptance-anchor-b" style={{ maxWidth: "520px", padding: "24px", background: "white", border: "1px solid #d7dee8" }}>
      <h2>Route B workspace</h2><p>The second semantic target is now available.</p>
      <button type="button">Route B action</button>
    </section>}
  </FixtureFrame>;
}

function DelayedTargetSurface() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 900);
    return () => window.clearTimeout(timer);
  }, []);
  return <FixtureFrame mode="delayed-target">
    <p data-ogl-fixture-status="target">Target status: {ready ? "ready" : "waiting"}</p>
    {ready ? <section data-ogl-anchor="ogl-acceptance-anchor-c" style={{ maxWidth: "520px", padding: "24px", background: "white", border: "1px solid #d7dee8" }}>
      <h2>Delayed target</h2><p>This semantic target mounted after the controlled delay.</p>
    </section> : <section aria-live="polite" style={{ maxWidth: "520px", padding: "24px", background: "white", border: "1px solid #d7dee8" }}><h2>Loading target</h2><p>The target is intentionally not mounted yet.</p></section>}
  </FixtureFrame>;
}

export default function OglAcceptanceRoutes() {
  const auth = useAuthContext();
  const location = useLocation();
  const path = location.pathname.replace(`${FIXTURE_PREFIX}/`, "");
  const mode = path === "delayed-target" ? "delayed" : "cross-route";
  const route = path === "route-b" ? "route-b" : "route-a";
  const scope = useMemo(() => scopeFromAuth(auth), [auth]);
  const steps = mode === "delayed" ? delayedTargetSteps : crossRouteSteps;
  const context = useMemo(() => ({
    ...scope,
    service: "ogl-acceptance",
    tourId: `ogl-acceptance:${mode}`,
    tourVersion: 1,
    orientationId: `orientation:ogl-acceptance:${mode}`,
    orientationVersion: 1,
  }), [mode, scope]);
  const navigate = useNavigate();

  if (!import.meta.env.DEV || auth.loading) return null;
  if (!auth.isAuthenticated) return <FixtureFrame mode="blocked"><h1>Authentication required</h1></FixtureFrame>;

  return <TourProvider
    steps={steps}
    buttonLabel={mode === "delayed" ? "Start delayed target tour" : "Start cross-route tour"}
    context={context}
    onNext={({ currentIndex }) => {
      if (mode === "cross-route" && currentIndex === 0 && route === "route-a") navigate(`${FIXTURE_PREFIX}/route-b`);
    }}
  >
    {mode === "delayed" ? <DelayedTargetSurface /> : <CrossRouteSurface route={route} />}
  </TourProvider>;
}
