// src/pages/resume-builder/ResumePreview.jsx
// Live A4 preview + template / typography / spacing / accent / icon
// controls. Shared between the desktop preview column, the tablet/mobile
// "Preview" workspace, and the printable HTML export (renderPrintableHTML).
import React, { useEffect, useId, useRef, useState } from "react";
import { TEMPLATES, escapeHtml, safeNumber } from "./store.js";

const ICONS = { email: "✉", phone: "☎", location: "📍", link: "🔗" };
const ACCENTS = ["#111827", "#ff4f00", "#0f766e", "#7c3aed", "#b91c1c", "#1d4ed8"];

/* ---------- highlight helper (Career Intelligence matched terms) ---------- */
function renderWithHighlights(text, terms = []) {
  if (!terms || !terms.length || !text) return text;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "ig");
  const html = String(text).replace(re, '<mark class="kw">$1</mark>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ===========================================================
   Resume document (used for live preview)
   =========================================================== */
export function ResumeDocument({ data, highlightTerms }) {
  const c = data.contact || {};
  const settings = data.settings || {};
  const template = settings.template || "clean";
  const icons = !!settings.showIcons;

  const style = {
    "--accent": settings.accent || "#111827",
    "--rb-fs": `${safeNumber(settings.fontSize, 14)}px`,
    "--rb-lh": settings.lineHeight || 1.4,
  };

  return (
    <article className="resume-a4" data-template={template} data-compact={settings.compact ? "true" : "false"} style={style}>
      <header className="r-header">
        <h1 className="r-name">{data.name || "Your Name"}</h1>
        {!!data.title && <div className="r-title">{renderWithHighlights(data.title, highlightTerms)}</div>}
        <div className="r-contact">
          {c.email && <span>{icons ? `${ICONS.email} ` : ""}{c.email}</span>}
          {c.phone && <span>{icons ? `${ICONS.phone} ` : ""}{c.phone}</span>}
          {c.location && <span>{icons ? `${ICONS.location} ` : ""}{c.location}</span>}
          {(c.links || []).map((l, i) => (
            <span key={i}>{icons ? `${ICONS.link} ` : ""}{l.label}{l.url ? ` · ${l.url}` : ""}</span>
          ))}
        </div>
      </header>

      {data.summary && (
        <section className="r-sec">
          <h2 className="r-h2">Summary</h2>
          <p className="r-p">{renderWithHighlights(data.summary, highlightTerms)}</p>
        </section>
      )}

      {(data.skills || []).length > 0 && (
        <section className="r-sec">
          <h2 className="r-h2">Skills</h2>
          <ul className="r-tags">
            {data.skills.map((s, i) => <li key={i}>{renderWithHighlights(s, highlightTerms)}</li>)}
          </ul>
        </section>
      )}

      {(data.sections || []).map((s, si) => (
        <section className="r-sec" key={si}>
          <h2 className="r-h2">{s.title || (s.type?.[0]?.toUpperCase() + s.type?.slice(1)) || "Section"}</h2>

          {s.type === "experience" && (s.items || []).map((it, i) => (
            <div className="r-block" key={i}>
              <div className="r-block-top">
                <div className="r-strong">{renderWithHighlights(it.role || "", highlightTerms)}</div>
                <div className="r-meta">{renderWithHighlights([it.company, it.location].filter(Boolean).join(" · "), highlightTerms)}</div>
                <div className="r-dates">{it.dates}</div>
              </div>
              {(it.bullets || []).length > 0 && (
                <ul className="r-ul">{(it.bullets || []).map((b, bi) => <li key={bi}>{renderWithHighlights(b, highlightTerms)}</li>)}</ul>
              )}
            </div>
          ))}

          {s.type === "projects" && (s.items || []).map((it, i) => (
            <div className="r-block" key={i}>
              <div className="r-strong">{renderWithHighlights(it.name || "", highlightTerms)}</div>
              <div className="r-meta">{renderWithHighlights(it.link || "", highlightTerms)}</div>
              {(it.bullets || []).length > 0 && (
                <ul className="r-ul">{(it.bullets || []).map((b, bi) => <li key={bi}>{renderWithHighlights(b, highlightTerms)}</li>)}</ul>
              )}
            </div>
          ))}

          {s.type === "education" && (s.items || []).map((it, i) => (
            <div className="r-block" key={i}>
              <div className="r-strong">{renderWithHighlights(it.school || "", highlightTerms)}</div>
              <div className="r-meta">{renderWithHighlights(it.degree || "", highlightTerms)}</div>
              {it.details && <p className="r-p">{renderWithHighlights(it.details, highlightTerms)}</p>}
            </div>
          ))}

          {s.type === "certs" && (
            <ul className="r-ul flat">
              {(s.items || []).map((it, i) => (
                <li key={i}>{renderWithHighlights([it.name, it.issuer, it.year].filter(Boolean).join(" — "), highlightTerms)}</li>
              ))}
            </ul>
          )}

          {s.type === "custom" && (s.items || []).map((it, i) => (
            <div className="r-block" key={i}>
              {it.title && <div className="r-strong">{renderWithHighlights(it.title, highlightTerms)}</div>}
              {(it.bullets || []).length > 0 && (
                <ul className="r-ul">{(it.bullets || []).map((b, bi) => <li key={bi}>{renderWithHighlights(b, highlightTerms)}</li>)}</ul>
              )}
            </div>
          ))}
        </section>
      ))}
    </article>
  );
}

/* ===========================================================
   Printable HTML export (mirrors ResumeDocument; skips hidden sections)
   =========================================================== */
export function renderPrintableHTML(data, printStyles) {
  const visible = (data.sections || []).filter((s) => !s.hidden);
  const c = data.contact || {};
  const settings = data.settings || {};
  const template = settings.template || "clean";
  const icons = !!settings.showIcons;
  const style = `--accent:${escapeHtml(settings.accent || "#111827")};--rb-fs:${safeNumber(settings.fontSize, 14)}px;--rb-lh:${settings.lineHeight || 1.4}`;

  const lines = [];
  const push = (s) => lines.push(s);
  const ic = (k) => (icons ? `${ICONS[k]} ` : "");

  push(`<article class="resume-a4" data-template="${escapeHtml(template)}" data-compact="${settings.compact ? "true" : "false"}" style="${style}">`);
  push(`<header class="r-header">`);
  push(`<h1 class="r-name">${escapeHtml(data.name || "Your Name")}</h1>`);
  if (data.title) push(`<div class="r-title">${escapeHtml(data.title)}</div>`);
  const contactBits = [
    c.email && `${ic("email")}${escapeHtml(c.email)}`,
    c.phone && `${ic("phone")}${escapeHtml(c.phone)}`,
    c.location && `${ic("location")}${escapeHtml(c.location)}`,
    ...(c.links || []).map((l) => `${ic("link")}${escapeHtml(l.label + (l.url ? ` · ${l.url}` : ""))}`),
  ].filter(Boolean);
  push(`<div class="r-contact">${contactBits.map((x) => `<span>${x}</span>`).join("")}</div>`);
  push(`</header>`);

  if (data.summary) push(`<section class="r-sec"><h2 class="r-h2">Summary</h2><p class="r-p">${escapeHtml(data.summary)}</p></section>`);

  if ((data.skills || []).length) {
    push(`<section class="r-sec"><h2 class="r-h2">Skills</h2><ul class="r-tags">${data.skills.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul></section>`);
  }

  visible.forEach((s) => {
    const title = s.title || (s.type?.[0]?.toUpperCase() + s.type?.slice(1)) || "Section";
    push(`<section class="r-sec"><h2 class="r-h2">${escapeHtml(title)}</h2>`);
    if (s.type === "experience") {
      (s.items || []).forEach((it) => {
        push(`<div class="r-block"><div class="r-block-top">` +
          `<div class="r-strong">${escapeHtml(it.role || "")}</div>` +
          `<div class="r-meta">${escapeHtml([it.company, it.location].filter(Boolean).join(" · "))}</div>` +
          `<div class="r-dates">${escapeHtml(it.dates || "")}</div></div>`);
        if ((it.bullets || []).length) push(`<ul class="r-ul">${it.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`);
        push(`</div>`);
      });
    } else if (s.type === "projects") {
      (s.items || []).forEach((it) => {
        push(`<div class="r-block"><div class="r-strong">${escapeHtml(it.name || "")}</div><div class="r-meta">${escapeHtml(it.link || "")}</div>`);
        if ((it.bullets || []).length) push(`<ul class="r-ul">${it.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`);
        push(`</div>`);
      });
    } else if (s.type === "education") {
      (s.items || []).forEach((it) => {
        push(`<div class="r-block"><div class="r-strong">${escapeHtml(it.school || "")}</div><div class="r-meta">${escapeHtml(it.degree || "")}</div></div>`);
        if (it.details) push(`<p class="r-p">${escapeHtml(it.details)}</p>`);
      });
    } else if (s.type === "certs") {
      push(`<ul class="r-ul flat">${(s.items || []).map((it) => `<li>${escapeHtml([it.name, it.issuer, it.year].filter(Boolean).join(" — "))}</li>`).join("")}</ul>`);
    } else {
      (s.items || []).forEach((it) => {
        push(`<div class="r-block">`);
        if (it.title) push(`<div class="r-strong">${escapeHtml(it.title)}</div>`);
        if ((it.bullets || []).length) push(`<ul class="r-ul">${it.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`);
        push(`</div>`);
      });
    }
    push(`</section>`);
  });

  push(`</article>`);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(data.name || "Resume")} – Resume</title>
<style>${printStyles}</style>
</head>
<body class="export">
  <div class="resume theme-${escapeHtml(template)}">
    ${lines.join("\n")}
  </div>
</body>
</html>`;
}

/* ===========================================================
   Design control disclosure row
   =========================================================== */
function ControlRow({ icon, label, expanded, onToggle, panelId, children }) {
  return (
    <div className="rb2-designRow">
      <button type="button" className="rb2-designHead" aria-expanded={expanded} aria-controls={panelId} onClick={onToggle}>
        <span aria-hidden="true">{icon}</span>
        <span className="rb2-designLabel">{label}</span>
        <span className={`rb2-chevronRight ${expanded ? "is-open" : ""}`} aria-hidden="true">›</span>
      </button>
      {expanded && <div id={panelId} className="rb2-designBody">{children}</div>}
    </div>
  );
}

/* ===========================================================
   Main preview panel (template swatches + zoom + document + controls)
   =========================================================== */
export default function ResumePreview({ data, onChangeSettings, zoom, setZoom, highlightTerms, showDesignControls = true }) {
  const [openControl, setOpenControl] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const wrapRef = useRef(null);
  const settings = data.settings || {};
  const ids = { typo: useId(), spacing: useId(), accent: useId(), icons: useId() };

  const fitToWidth = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const availablePx = wrap.clientWidth - 32;
    const a4Px = 794; // 210mm at 96dpi
    const pct = Math.max(40, Math.min(150, Math.round((availablePx / a4Px) * 100)));
    setZoom(pct);
  };

  useEffect(() => {
    fitToWidth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className={`rb2-preview ${fullscreen ? "rb2-preview--fullscreen" : ""}`} aria-label="Live Preview">
      <div className="rb2-previewHead">
        <h2 className="rb2-h2">Live Preview</h2>
        <div className="rb2-zoomBar">
          <button type="button" className="rb2-iconBtn" onClick={() => setZoom(safeNumber(zoom, 100) - 10)} aria-label="Zoom out">−</button>
          <span className="rb2-zoomPct" aria-live="polite">{zoom}%</span>
          <button type="button" className="rb2-iconBtn" onClick={() => setZoom(safeNumber(zoom, 100) + 10)} aria-label="Zoom in">+</button>
          <button type="button" className="rb2-iconBtn" onClick={fitToWidth} aria-label="Fit preview to width" title="Fit to width">⤢</button>
          <button
            type="button"
            className="rb2-iconBtn"
            aria-pressed={fullscreen}
            aria-label={fullscreen ? "Exit fullscreen preview" : "Expand preview to fullscreen"}
            onClick={() => setFullscreen((v) => !v)}
          >
            ⛶
          </button>
        </div>
      </div>

      {showDesignControls && (
        <div className="rb2-templateRow" role="radiogroup" aria-label="Template">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={settings.template === t.id}
              className={`rb2-tmplSwatch ${settings.template === t.id ? "is-selected" : ""}`}
              onClick={() => onChangeSettings({ template: t.id })}
            >
              <span className={`rb2-tmplThumb theme-${t.id}`} aria-hidden="true" />
              <span className="rb2-tmplName">{t.name}</span>
              {settings.template === t.id && <span className="rb2-tmplCheck" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}

      <div className="rb2-previewFrame" ref={wrapRef}>
        <div className="resume" style={{ transform: `scale(${safeNumber(zoom, 100) / 100})`, transformOrigin: "top left" }}>
          <ResumeDocument data={data} highlightTerms={highlightTerms} />
        </div>
      </div>

      {showDesignControls && (
        <div className="rb2-designControls">
          <ControlRow icon="Aa" label="Typography" expanded={openControl === "typo"} onToggle={() => setOpenControl((c) => (c === "typo" ? null : "typo"))} panelId={ids.typo}>
            <label className="rb2-label" htmlFor={`fs-${ids.typo}`}>Font size ({safeNumber(settings.fontSize, 14)}px)</label>
            <input id={`fs-${ids.typo}`} type="range" min="12" max="18" step="1" value={safeNumber(settings.fontSize, 14)} onChange={(e) => onChangeSettings({ fontSize: +e.target.value })} />
          </ControlRow>

          <ControlRow icon="↕" label="Spacing" expanded={openControl === "spacing"} onToggle={() => setOpenControl((c) => (c === "spacing" ? null : "spacing"))} panelId={ids.spacing}>
            <label className="rb2-label" htmlFor={`lh-${ids.spacing}`}>Line height ({(settings.lineHeight || 1.4).toFixed(2)})</label>
            <input id={`lh-${ids.spacing}`} type="range" min="1.15" max="1.8" step="0.05" value={settings.lineHeight || 1.4} onChange={(e) => onChangeSettings({ lineHeight: +e.target.value })} />
            <label className="rb2-checkboxRow">
              <input type="checkbox" checked={!!settings.compact} onChange={(e) => onChangeSettings({ compact: e.target.checked })} />
              Shrink to fit one page
            </label>
          </ControlRow>

          <ControlRow icon="●" label="Accent" expanded={openControl === "accent"} onToggle={() => setOpenControl((c) => (c === "accent" ? null : "accent"))} panelId={ids.accent}>
            <div className="rb2-swatchRow" role="radiogroup" aria-label="Accent color">
              {ACCENTS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  role="radio"
                  aria-checked={settings.accent === hex}
                  aria-label={`Accent color ${hex}`}
                  className={`rb2-colorSwatch ${settings.accent === hex ? "is-selected" : ""}`}
                  style={{ background: hex }}
                  onClick={() => onChangeSettings({ accent: hex })}
                />
              ))}
              <input
                type="color"
                aria-label="Custom accent color"
                value={settings.accent || "#111827"}
                onChange={(e) => onChangeSettings({ accent: e.target.value })}
              />
            </div>
          </ControlRow>

          <ControlRow icon="☆" label="Icons" expanded={openControl === "icons"} onToggle={() => setOpenControl((c) => (c === "icons" ? null : "icons"))} panelId={ids.icons}>
            <label className="rb2-checkboxRow">
              <input type="checkbox" checked={!!settings.showIcons} onChange={(e) => onChangeSettings({ showIcons: e.target.checked })} />
              Show contact icons
            </label>
          </ControlRow>
        </div>
      )}
    </section>
  );
}
