// src/components/QuickActions.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function QuickActions({
  // You can pass either an href OR an onClick handler for each action.
  resumeHref,
  startHref,
  portfolioHref,
  helpHref,

  onResumeLearning,
  onStartNewLesson,
  onOpenPortfolio,
  onRequestHelp,

  disabled = false,
  className = "",
}) {
  const canonicalize = (href = "") => href.replace(/\/lesson\//, "/lessons/");

  return (
    <section className={`sh-card ${className}`} role="group" aria-labelledby="quick-actions">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <h2 id="quick-actions" className="sh-cardTitle">Quick Actions</h2>

        <div className="sh-actionsRow">
          <Action
            label="Resume learning"
            primary
            href={resumeHref && canonicalize(resumeHref)}
            onClick={onResumeLearning}
            disabled={disabled}
          />
          <Action
            label="Start new lesson"
            href={startHref && canonicalize(startHref)}
            onClick={onStartNewLesson}
            disabled={disabled}
          />
          <Action
            label="Open portfolio"
            href={portfolioHref && canonicalize(portfolioHref)}
            onClick={onOpenPortfolio}
            disabled={disabled}
          />
          <Action
            label="Request help"
            href={helpHref && canonicalize(helpHref)}
            onClick={onRequestHelp}
            disabled={disabled}
          />
        </div>
      </div>

      <style>{`.sh-actionsRow{display:flex;gap:10px;flex-wrap:wrap}`}</style>
    </section>
  );
}

function Action({ label, href, onClick, disabled = false, primary = false }) {
  const cls = `sh-btn ${primary ? "sh-btn--primary" : "sh-btn--secondary"}`;

  if (href) {
    return (
      <Link
        to={href}
        className={cls}
        aria-disabled={disabled ? "true" : undefined}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
        tabIndex={disabled ? -1 : 0}
      >
        {label}
      </Link>
    );
  }

  return (
    <button type="button" className={cls} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
