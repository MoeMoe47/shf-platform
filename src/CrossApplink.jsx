// src/CrossAppLink.jsx
import React from "react";
import { APP } from "@/router/paths.js";

/**
 * CrossAppLink — builds cross-app hrefs using APP map (hash routers).
 * Usage: <CrossAppLink app="fuel" to="/top">Fuel Tank</CrossAppLink>
 */
export default function CrossAppLink({ app, to = "/", children, ...props }) {
  const base = APP?.[app] || "/";
  const href = `${base}${String(to).replace(/^#?\/?/, "")}`;
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
