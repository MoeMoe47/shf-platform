import React from "react";
import { Link } from "react-router-dom";

export default function StudioTemplates() {
  const origin = import.meta.env?.VITE_SHF_NEXT_ORIGIN;
  return <div className="studio-page studio-page--narrow"><Link className="studio-backLink" to="/studio">← Back to Studio</Link><header className="studio-pageHeader"><p className="studio-eyebrow">Starting points</p><h1 className="ld-h1">Templates</h1><p className="studio-lede">Templates can help you choose a direction. Choosing one does not create or complete a project.</p></header><section className="studio-panel"><h2>Website templates</h2><p>Template browsing is provided by the existing Website template experience. Studio project records remain owned by SHRV1.</p>{origin ? <a className="studio-primaryButton" href={`${origin.replace(/\/$/, "")}/studio/templates`}>Browse Website templates</a> : <p className="studio-muted">The template browser is not connected in this environment yet.</p>}</section></div>;
}
