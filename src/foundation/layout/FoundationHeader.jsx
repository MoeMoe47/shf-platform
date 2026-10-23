import React, { useEffect, useRef, useState } from "react";
import SHFLogo from "@/components/shared/SHFLogo.jsx";
import "../styles/foundation-header.css";

const universeOrigin = String(
  import.meta.env.VITE_UNIVERSE_ORIGIN || "",
).replace(/\/+$/, "");
const returnToUniverseHref = universeOrigin ? `${universeOrigin}/universe` : "";

// Existing public destinations. Our Work and Programs intentionally share a page.
const NAVIGATION = [
  { label: "About", href: "#/about", active: ["about", "mission"] },
  { label: "Our Work", href: "#/programs", active: [] },
  { label: "Programs", href: "#/programs", active: ["programs"] },
  { label: "Our Impact", href: "#impact", active: ["impact"] },
  { label: "Partners", href: "#/partners", active: ["partners"] },
  { label: "Resources", href: "#/reports", active: ["reports"] },
];

function SearchLink({ showLabel = false, onNavigate = undefined }) {
  return (
    <a
      className="shf-institutional-header__search"
      href="#/reports"
      aria-label="Search SHF resources"
      onClick={onNavigate}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </svg>
      {showLabel && <span>Search resources</span>}
    </a>
  );
}

function UniverseLink({ onNavigate = undefined }) {
  return returnToUniverseHref ? (
    <a
      className="shf-institutional-header__universe"
      href={returnToUniverseHref}
      aria-label="Return to Universe"
      onClick={onNavigate}
    >
      Return to Universe <span aria-hidden="true">↗</span>
    </a>
  ) : null;
}

export default function FoundationHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hash, setHash] = useState(() =>
    typeof window === "undefined" ? "" : window.location.hash,
  );
  const headerRef = useRef(null);
  const menuButtonRef = useRef(null);
  const closeMenu = () => setMenuOpen(false);
  const currentPage = hash
    .replace(/^#\/?/, "")
    .split("?")[0]
    .replace(/\/$/, "");

  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash);
      setMenuOpen(false);
    };
    const media = window.matchMedia("(max-width: 1024px)");
    const onBreakpointChange = () => setMenuOpen(false);
    window.addEventListener("hashchange", onHashChange);
    media.addEventListener("change", onBreakpointChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      media.removeEventListener("change", onBreakpointChange);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const onOutsidePointer = (event) => {
      if (!headerRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onOutsidePointer);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onOutsidePointer);
    };
  }, [menuOpen]);

  return (
    <header className="shf-institutional-header" ref={headerRef}>
      <div className="shf-institutional-header__top">
        <a
          className="shf-institutional-header__brand"
          href="/foundation.html"
          aria-label="Silicon Heartland Foundation home"
          onClick={closeMenu}
        >
          <SHFLogo mobileCompact width={260} />
        </a>
        <div className="shf-institutional-header__actions">
          <div className="shf-institutional-header__desktop-utilities">
            <SearchLink />
            <a
              className="shf-institutional-header__contact"
              href="#/get-involved"
            >
              Contact
            </a>
          </div>
          <a
            className="shf-institutional-header__support"
            aria-current={currentPage === "get-involved" ? "page" : undefined}
            href="#/get-involved"
            onClick={closeMenu}
          >
            Support SHF
          </a>
          <div className="shf-institutional-header__desktop-utilities">
            <UniverseLink />
          </div>
          <button
            className="shf-institutional-header__menu-button"
            type="button"
            ref={menuButtonRef}
            aria-label={
              menuOpen ? "Close Foundation menu" : "Open Foundation menu"
            }
            aria-expanded={menuOpen}
            aria-controls="shf-header-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path d="m6 6 12 12M6 18 18 6" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      <div
        id="shf-header-navigation"
        className="shf-institutional-header__panel"
        data-open={menuOpen}
      >
        <nav
          className="shf-institutional-header__nav"
          aria-label="Foundation navigation"
        >
          {NAVIGATION.map(({ label, href, active }) => (
            <a
              key={label}
              href={href}
              aria-current={active.includes(currentPage) ? "page" : undefined}
              onClick={closeMenu}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="shf-institutional-header__mobile-utilities">
          <SearchLink showLabel onNavigate={closeMenu} />
          <a
            className="shf-institutional-header__contact"
            href="#/get-involved"
            onClick={closeMenu}
          >
            Contact
          </a>
          <UniverseLink onNavigate={closeMenu} />
        </div>
      </div>
    </header>
  );
}
