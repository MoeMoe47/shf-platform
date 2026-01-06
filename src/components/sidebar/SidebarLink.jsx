// src/components/sidebar/SidebarLink.jsx
import React from "react";
import AppLink from "@/components/nav/AppLink.jsx";

export default function SidebarLink({
  to,
  href,
  icon,
  children,
  "aria-label": ariaLabel,
}) {
  const label =
    typeof children === "string" ? children : ariaLabel || undefined;

  return (
    <li>
      <AppLink
        to={to}
        href={href}
        className="crb-link"
        aria-label={label}
        title={label}
      >
        {icon && (
          <span className="crb-linkIcon" aria-hidden>
            {icon}
          </span>
        )}
        <span className="crb-linkLabel">{children}</span>
      </AppLink>
    </li>
  );
}
