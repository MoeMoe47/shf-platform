import React from "react";

export default function CivicSurePageHeader({ eyebrow = "Government Program Assurance", title, description, status, actions }) {
  return <header className="civicsure-page-header">
    <div>
      {eyebrow ? <p className="civicsure-eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {description ? <p className="civicsure-page-header__description">{description}</p> : null}
    </div>
    <div className="civicsure-page-header__aside">{status ? <span className="civicsure-status">{status}</span> : null}{actions}</div>
  </header>;
}
