import React from "react";

export default function DymPage({ title, subtitle, right, children }) {
  return (
    <div className="loo-page">
      <div className="loo-pageHeader">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 className="loo-h1">{title}</h1>
            {subtitle ? <p className="loo-sub">{subtitle}</p> : null}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
      </div>

      {children}
    </div>
  );
}
