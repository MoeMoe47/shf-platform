import React from "react";
import "../styles/foundation.css";

export default function FoundationHeader() {
  const navItems = [
    { label: "About", href: "/foundation/about" },
    { label: "Programs", href: "/foundation/programs" },
    { label: "Impact", href: "/foundation/impact" },
    { label: "Careers", href: "/foundation/careers" },
    { label: "Get Involved", href: "/foundation/get-involved" },
    { label: "Donate", href: "/foundation/donate" },
  ];

  return (
    <header className="shf-header">
      <div className="shf-shell shf-header__inner">
        <a className="shf-brand" href="/foundation">
          <span className="shf-brand__mark" aria-hidden="true">
            <img
              src="/assets/branding/shf-header-logo.png"
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="shf-brand__fallback">SHF</span>
          </span>

          <span className="shf-brand__text">
            <span className="shf-brand__title">Silicon Heartland</span>
            <span className="shf-brand__subtitle">Foundation</span>
          </span>
        </a>

        <nav className="shf-nav" aria-label="Primary">
          {navItems.map((item) => (
            <a key={item.label} className="shf-nav__link" href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="shf-header__actions">
          <a className="shf-btn shf-btn--ghost" href="/foundation/careers">
            Careers
          </a>
          <a className="shf-btn shf-btn--primary" href="/foundation/donate">
            Donate
          </a>
        </div>
      </div>
    </header>
  );
}
