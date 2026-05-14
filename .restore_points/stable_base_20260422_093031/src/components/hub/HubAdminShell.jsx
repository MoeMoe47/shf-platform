import React from "react";
import "@/styles/admin.appRegistry.css";

export default function HubAdminShell({
  kicker = "SHS Hub Collaboration Layer",
  title,
  subtitle,
  actions = null,
  children,
}) {
  return (
    <div className="ar-wrap">
      <header className="ar-head">
        <div>
          <div className="ar-kicker">{kicker}</div>
          <h1 className="ar-title">{title}</h1>
          {subtitle ? <div className="ar-sub">{subtitle}</div> : null}
        </div>
        {actions ? <div className="ar-actions">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
