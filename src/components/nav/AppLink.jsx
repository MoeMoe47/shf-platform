// src/components/nav/AppLink.jsx
import React from "react";
import { NavLink, useInRouterContext } from "react-router-dom";

/**
 * Global link helper for ALL apps.
 *
 * - If we're inside a Router  -> render <NavLink> with active state.
 * - If we're NOT in a Router -> render plain <a>, NO router hooks.
 *
 * This prevents: "useLocation() may be used only in the context of a <Router>".
 */
export default function AppLink({
  to,
  href,
  children,
  className = "",
  activeClassName = "is-active",
  ...rest
}) {
  const inRouter = useInRouterContext(); // safe even outside Router

  // Inside a Router -> safe NavLink with active styling
  if (to && inRouter) {
    return (
      <NavLink
        to={to}
        {...rest}
        className={({ isActive }) =>
          [className, isActive && activeClassName].filter(Boolean).join(" ")
        }
      >
        {children}
      </NavLink>
    );
  }

  // Outside a Router -> fall back to plain <a>
  const finalHref =
    href || (typeof to === "string" ? to : undefined) || undefined;

  return (
    <a href={finalHref} className={className} {...rest}>
      {children}
    </a>
  );
}
