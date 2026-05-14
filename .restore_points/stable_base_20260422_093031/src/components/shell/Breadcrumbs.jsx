import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Breadcrumbs(){
  const { hash } = useLocation(); // hash-router
  const path = (hash || "#/").replace(/^#\//,'').split('?')[0];
  const parts = path.split('/').filter(Boolean);

  const items = [];
  let acc = '';
  parts.forEach((seg, i) => {
    acc += (i===0 ? '#/' : '') + (i?parts[i-1]+'/':'') + seg;
    items.push({ label: seg.replace(/-/g,' ').replace(/\b\w/g, c=>c.toUpperCase()), to: acc });
  });

  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <Link to="#/">Home</Link>
      {items.map((it,i)=>(
        <React.Fragment key={it.to}>
          <span className="sep">/</span>
          {i < items.length-1 ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}
