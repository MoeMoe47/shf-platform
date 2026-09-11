import React from "react";
import { APP } from "@/router/paths.js";

export default function CrossAppLink({ app, to="/", children, target, rel, ...rest }) {
  const base = APP[app];
  if (!base) { console.warn(`[CrossAppLink] Unknown app "${app}".`, { app, to }); return <span role="link" aria-disabled="true" {...rest}>{children}</span>; }
  const path = (to || "/").startsWith("/") ? to : `/${to}`;
  const href = `${base}${path}`;
  const safeRel = target === "_blank" ? rel || "noopener noreferrer" : rel;
  return <a href={href} target={target} rel={safeRel} {...rest}>{children}</a>;
}
