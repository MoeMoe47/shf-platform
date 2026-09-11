import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/civicsure.css";

const DEFAULT_ORGANIZATION = "org_shf_001";

const navigation = [
  { label: "Overview", href: "#/operator/government-assurance", group: "Home", view: null },
  { label: "Programs", href: "#/operator/government-assurance?view=Programs", group: "Programs", view: "Programs" },
  { label: "Providers", href: "#/operator/government-assurance?view=Providers", group: "Programs", view: "Providers" },
  { label: "Funding", href: "#/operator/government-assurance?view=Funding", group: "Programs", view: "Funding" },
  { label: "Claims", href: "#/operator/government-assurance?view=Claims", group: "Assurance", view: "Claims" },
  { label: "Verification", href: "#/operator/government-assurance?view=Verification", group: "Assurance", view: "Verification" },
  { label: "Monitoring", href: "#/operator/government-assurance?view=Monitoring", group: "Assurance", view: "Monitoring" },
  { label: "Findings", href: "#/operator/government-assurance?view=Monitoring", group: "Assurance", view: "Monitoring" },
  { label: "Corrective Actions", href: "#/operator/government-assurance?view=Monitoring", group: "Assurance", view: "Monitoring" },
  { label: "Reconciliation", href: "#/operator/government-assurance?view=Reconciliation", group: "Data Integrity", view: "Reconciliation" },
  { label: "Data Quality", href: "#/operator/government-assurance?view=Reconciliation", group: "Data Integrity", view: "Reconciliation" },
  { label: "Data Sources", href: "#/operator/government-assurance?view=Data%20Sources", group: "Data Integrity", view: "Data Sources" },
  { label: "Audits", href: "#/operator/government-assurance?view=Audit", group: "Audit", view: "Audit" },
  { label: "CivicSure AI", href: "#/operator/government-assurance/assistant", group: "Intelligence", view: "Assistant" },
  { label: "Lineage", href: null, group: "Intelligence", view: null, disabled: true },
  { label: "Reports", href: "#/operator/government-assurance/reports", group: "Intelligence", view: "Reports" },
  { label: "Pilot Administration", href: "#/operator/government-assurance?view=Pilot%20Administration", group: "Administration", view: "Pilot Administration" },
  { label: "Transparency", href: "#/operator/government-assurance?view=Public", group: "Public", view: "Public" },
];

const groupOrder = ["Home", "Programs", "Assurance", "Data Integrity", "Audit", "Intelligence", "Administration", "Public"];

function routeState() {
  if (typeof window === "undefined") return { path: "/operator/government-assurance", view: null };
  const raw = window.location.hash.startsWith("#/") ? window.location.hash.slice(1) : window.location.pathname;
  const [path, query] = raw.split("?");
  const view = new URLSearchParams(query || "").get("view");
  return { path, view };
}

function displayOrganization() {
  if (typeof window === "undefined") return DEFAULT_ORGANIZATION;
  return window.localStorage.getItem("shfOperatorOrganizationId") || DEFAULT_ORGANIZATION;
}

function displayUser() {
  if (typeof window === "undefined") return "Operator";
  const token = window.localStorage.getItem("shfOperatorToken") || "";
  const userId = token.startsWith("dev-token:") ? token.slice("dev-token:".length) : "";
  return userId ? userId.replaceAll("_", " ") : "Operator";
}

function breadcrumbItems({ path, view }) {
  if (path === "/operator/government-assurance") {
    if (view === "Reports") return ["Intelligence", "Reports"];
    if (view === "Assistant") return ["Intelligence", "CivicSure AI"];
    if (view === "Public") return ["Public", "Transparency"];
    if (view === "Pilot Administration") return ["Administration", "Pilot Administration"];
    if (view) return [view === "Reconciliation" || view === "Data Sources" ? "Data Integrity" : view, view];
    return ["Home", "Overview"];
  }
  const parts = path.split("/").filter(Boolean);
  const area = parts[2] === "government-assurance" ? parts[3] : null;
  const labels = { claims: "Claims", verification: "Verification", reconciliation: "Reconciliation", "data-sources": "Data Sources", programs: "Programs", providers: "Providers", funding: "Funding", audits: "Audits", monitoring: "Monitoring", findings: "Findings", "corrective-actions": "Corrective Actions", lineage: "Lineage" };
  if (!area) return ["Home", "Overview"];
  return [labels[area] || "Government Assurance", parts[4] || "Detail"];
}

function isActive(item, state) {
  if (item.label === "Reports") return state.path.endsWith("/reports");
  if (item.label === "CivicSure AI") return state.path.endsWith("/assistant");
  if (state.path !== "/operator/government-assurance") return state.path.includes(`/${item.label.toLowerCase().replaceAll(" ", "-")}`);
  return item.view === state.view || (!item.view && !state.view && item.label === "Overview");
}

export default function CivicSureShell({ children }) {
  const [state, setState] = useState(routeState);
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const firstLinkRef = useRef(null);
  const organization = displayOrganization();
  const user = displayUser();
  const breadcrumbs = useMemo(() => breadcrumbItems(state), [state]);

  useEffect(() => {
    const update = () => { setState(routeState()); setOpen(false); };
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => { window.removeEventListener("hashchange", update); window.removeEventListener("popstate", update); };
  }, []);

  useEffect(() => {
    if (open) firstLinkRef.current?.focus();
    else menuButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === "Escape" && open) setOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return <div className="civicsure-shell">
    <a className="civicsure-skip-link" href="#civicsure-main">Skip to main content</a>
    <header className="civicsure-topbar">
      <div className="civicsure-topbar__brand">
        <button ref={menuButtonRef} type="button" className="civicsure-menu-button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="civicsure-navigation" onClick={() => setOpen((current) => !current)}><span aria-hidden="true">☰</span></button>
        <a className="civicsure-wordmark" href="#/operator/government-assurance" aria-label="CivicSure home"><strong>CivicSure</strong><span>Government Program Assurance</span></a>
      </div>
      <div className="civicsure-topbar__context">
        <span className="civicsure-context"><span className="civicsure-context__label">Organization</span><strong>{organization}</strong></span>
        <span className="civicsure-context"><span className="civicsure-context__label">Role</span><strong>Operator</strong></span>
        <button type="button" className="civicsure-quiet-button" disabled title="Global search is not configured for this pilot shell">Search</button>
        <span className="civicsure-topbar__user" title={user}>{user}</span>
        <button type="button" className="civicsure-quiet-button" disabled title="Help is not configured for this pilot shell">Help</button>
      </div>
    </header>
    <div className="civicsure-body">
      <button type="button" className={`civicsure-nav-backdrop${open ? " is-open" : ""}`} aria-label="Close navigation" onClick={() => setOpen(false)} />
      <aside id="civicsure-navigation" className={`civicsure-sidebar${open ? " is-open" : ""}`} aria-label="CivicSure primary navigation">
        <nav>
          {groupOrder.map((group, groupIndex) => <div className="civicsure-nav-group" key={group}>
            <h2>{group}</h2>
            {navigation.filter((item) => item.group === group).map((item, index) => item.disabled ? <span key={`${item.group}-${item.label}`} className="civicsure-nav-disabled" title="Open Lineage from a Metric Result or Verified Fact">{item.label}</span> : <a key={`${item.group}-${item.label}`} ref={groupIndex === 0 && index === 0 ? firstLinkRef : null} href={item.href} className={isActive(item, state) ? "is-active" : ""} aria-current={isActive(item, state) ? "page" : undefined}>{item.label}</a>)}
          </div>)}
        </nav>
        <div className="civicsure-sidebar__footer"><span>Silicon Heartland</span><small>Government assurance infrastructure</small></div>
      </aside>
      <main id="civicsure-main" className="civicsure-main" tabIndex="-1">
        <nav className="civicsure-breadcrumbs" aria-label="Breadcrumb"><a href="#/operator/government-assurance">CivicSure</a>{breadcrumbs.map((item, index) => <React.Fragment key={`${item}-${index}`}><span aria-hidden="true">/</span>{index === breadcrumbs.length - 1 ? <span aria-current="page">{item}</span> : <span>{item}</span>}</React.Fragment>)}</nav>
        {children}
      </main>
    </div>
  </div>;
}
