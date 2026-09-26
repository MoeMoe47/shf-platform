import React from "react";
import { Link } from "react-router-dom";
import { COMMAND_SECTIONS } from "../commandContracts.js";
import { AUTHORITY_NAV, authorityEntry } from "../ecosystemTopology.js";

// Command navigation. Every entry goes somewhere real: this page, a region on
// this page, an existing admin route, or another app's existing route. Anything
// else is listed disabled with the reason, so no placeholder pages exist.

function goToRegion(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  const focusTarget = el.matches("[tabindex]") ? el : el.querySelector("h2") || el;
  if (!focusTarget.hasAttribute("tabindex")) focusTarget.setAttribute("tabindex", "-1");
  focusTarget.focus({ preventScroll: true });
}

function Unavailable({ label, why }) {
  return (
    <li className="afcc-nav-pending" aria-disabled="true">
      <span>{label}</span>
      <span className="afcc-nav-note">Not yet available<span className="afcc-sr-only"> — {why}</span></span>
    </li>
  );
}

function SectionItem({ section, onNavigate }) {
  if (section.status === "CURRENT") {
    return (
      <li>
        <Link className="afcc-nav-link is-current" to={section.route} aria-current="page">{section.label}</Link>
      </li>
    );
  }
  if (section.status === "IN_PAGE") {
    return (
      <li>
        <button type="button" className="afcc-nav-link" data-target={section.target} onClick={() => { goToRegion(section.target); onNavigate?.(); }}>
          {section.label}
        </button>
      </li>
    );
  }
  if (section.status === "ROUTE") {
    return (
      <li>
        <Link className="afcc-nav-link" to={section.route}>
          {section.label}
          <span className="afcc-nav-note">{section.note}</span>
        </Link>
      </li>
    );
  }
  return <Unavailable label={section.label} why={section.reason || `planned for ${section.phase}`} />;
}

function AuthorityItem({ id }) {
  const entry = authorityEntry(id);
  if (!entry) return null;
  const dest = entry.destination;
  const label = id === "shs" ? "SHS" : id === "shf" ? "SHF" : entry.name;
  if (dest.kind === "admin") {
    return <li><Link className="afcc-nav-link" to={dest.route}>{label}</Link></li>;
  }
  if (dest.kind === "app") {
    return (
      <li>
        <a className="afcc-nav-link" href={dest.href}>
          {label}
          <span className="afcc-nav-note">{dest.label}<span className="afcc-sr-only"> (opens another app)</span></span>
        </a>
      </li>
    );
  }
  return <Unavailable label={label} why={dest.reason} />;
}

export default function CommandSidebar({ collapsible, open, onToggle }) {
  const listId = "afcc-section-list";
  return (
    <nav className={`afcc-sections${collapsible ? " is-collapsible" : ""}${open ? " is-open" : ""}`} aria-label="Command Center sections">
      {collapsible ? (
        <button type="button" className="afcc-sections-toggle" aria-expanded={open} aria-controls={listId} onClick={onToggle}>
          Sections
        </button>
      ) : null}
      <div id={listId} className="afcc-sections-body" hidden={collapsible && !open}>
        {/* The Command Center renders full-bleed (AdminLayout); this is the way back to the admin shell. */}
        <Link className="afcc-nav-link afcc-nav-exit" to="/hub">
          ← Admin home
          <span className="afcc-nav-note">Leave the Command Center</span>
        </Link>
        <p className="afcc-sections-title" id="afcc-nav-primary">Command</p>
        <ul className="afcc-sections-list" aria-labelledby="afcc-nav-primary">
          {COMMAND_SECTIONS.map((section) => (
            <SectionItem key={section.id} section={section} onNavigate={collapsible ? onToggle : undefined} />
          ))}
        </ul>
        <p className="afcc-sections-title" id="afcc-nav-authorities">Ecosystem authorities</p>
        <ul className="afcc-sections-list" aria-labelledby="afcc-nav-authorities">
          {AUTHORITY_NAV.map((id) => <AuthorityItem key={id} id={id} />)}
        </ul>
      </div>
    </nav>
  );
}
