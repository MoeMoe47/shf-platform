import React from "react";
const APP_MAP = {
  solutions:"/solutions.html#", foundation:"/foundation.html#",
  career:"/career.html#", curriculum:"/curriculum.html#", store:"/store.html#", arcade:"/arcade.html#",
  sales:"/sales.html#", launch:"/launch.html#",
  credit:"/credit.html#", fuel:"/fuel.html#", debt:"/debt.html#", treasury:"/treasury.html#",
  employer:"/employer.html#",
};
export default function CrossAppLink({ app, to="/", children, target, rel, ...rest }) {
  const base = APP_MAP[app];
  if (!base) { console.warn(`[CrossAppLink] Unknown app "${app}".`, { app, to }); return <span role="link" aria-disabled="true" {...rest}>{children}</span>; }
  const path = (to || "/").startsWith("/") ? to : `/${to}`;
  const href = `${base}${path}`;
  const safeRel = target === "_blank" ? rel || "noopener noreferrer" : rel;
  return <a href={href} target={target} rel={safeRel} {...rest}>{children}</a>;
}
