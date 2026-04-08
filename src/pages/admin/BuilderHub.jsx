import React from "react";
import { NavLink } from "react-router-dom";

const shell = {
  minHeight: "100vh",
  background: "#071226",
  color: "#edf2ff",
  padding: "32px",
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "18px",
  marginTop: "28px",
};

const card = {
  display: "block",
  textDecoration: "none",
  color: "inherit",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "18px",
  padding: "20px",
  background: "linear-gradient(180deg, rgba(17,28,58,0.96) 0%, rgba(10,18,38,0.96) 100%)",
  boxShadow: "0 12px 34px rgba(0,0,0,0.24)",
};

const tag = {
  display: "inline-block",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#8fb7ff",
  marginBottom: "12px",
};

const topLinks = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const pill = {
  textDecoration: "none",
  color: "#dbe7ff",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "999px",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.04)",
};

export default function BuilderHub() {
  return (
    <div style={shell}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ fontSize: 13, opacity: 0.72, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Internal Builder System
        </div>
        <h1 style={{ margin: "10px 0 8px", fontSize: 42, lineHeight: 1.04 }}>
          Project Builder Hub
        </h1>
        <p style={{ maxWidth: 860, fontSize: 17, lineHeight: 1.6, color: "rgba(237,242,255,0.82)" }}>
          This is your internal operating layer for building projects, structuring narratives,
          aligning systems, and packaging grant-ready materials.
        </p>

        <div style={topLinks}>
          <NavLink to="/builder/tools" style={pill}>Tool Dashboard</NavLink>
          <NavLink to="/builder/narrative" style={pill}>Master Narrative</NavLink>
          <NavLink to="/builder/grant-binder" style={pill}>Grant Binder</NavLink>
          <NavLink to="/builder/alignment" style={pill}>Alignment Switchboard</NavLink>
          <NavLink to="/app-registry" style={pill}>App Registry</NavLink>
          <NavLink to="/registry" style={pill}>Registry</NavLink>
        </div>

        <div style={grid}>
          <NavLink to="/builder/tools" style={card}>
            <div style={tag}>Build Layer</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Tool Dashboard</div>
            <div style={{ color: "rgba(237,242,255,0.76)", lineHeight: 1.55 }}>
              Launch your internal project-building utilities and working tools.
            </div>
          </NavLink>

          <NavLink to="/builder/narrative" style={card}>
            <div style={tag}>Narrative Layer</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Master Narrative Viewer</div>
            <div style={{ color: "rgba(237,242,255,0.76)", lineHeight: 1.55 }}>
              Organize positioning, story structure, strategic language, and system framing.
            </div>
          </NavLink>

          <NavLink to="/builder/grant-binder" style={card}>
            <div style={tag}>Funding Layer</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Grant Binder</div>
            <div style={{ color: "rgba(237,242,255,0.76)", lineHeight: 1.55 }}>
              Package documents, outcomes, and supporting materials into funder-ready form.
            </div>
          </NavLink>

          <NavLink to="/builder/alignment" style={card}>
            <div style={tag}>Control Layer</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Alignment Switchboard</div>
            <div style={{ color: "rgba(237,242,255,0.76)", lineHeight: 1.55 }}>
              Keep programs, messaging, and system structure aligned across the platform.
            </div>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
