import React from "react";

export default function DymPage({ title, subtitle, children }) {
  return (
    <section className="dym-page">
      <header className="dym-pageHeader">
        <h1 className="dym-title">{title}</h1>
        {subtitle && <p className="dym-subtitle">{subtitle}</p>}
      </header>

      <div className="dym-pageBody">
        {children}
      </div>
    </section>
  );
}
