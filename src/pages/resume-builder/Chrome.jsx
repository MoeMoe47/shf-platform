// src/pages/resume-builder/Chrome.jsx
// Desktop top bar (template select, Preview/Improve, Import/Export/More
// menus) and mobile/tablet chrome (header, Edit/Preview/Improve tabs,
// bottom action bar, accessible Export bottom sheet). All menus/sheets
// here are real interaction states — closed by default, dismissible,
// with focus trapping and focus return to their trigger.
import React, { useEffect, useId, useRef, useState } from "react";
import { TEMPLATES } from "./store.js";

/* ===========================================================
   Generic dismissible dropdown (desktop menus)
   =========================================================== */
function Dropdown({ trigger, label, align = "left", children, open, setOpen }) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div className="rb2-dropdown" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="rb2-topBtn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>
      {open && (
        <div className="rb2-menu" id={menuId} role="menu" aria-label={label}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ===========================================================
   Desktop top bar
   =========================================================== */
export function DesktopTopBar({
  status,
  template,
  onChangeTemplate,
  previewOnly,
  onTogglePreviewOnly,
  onOpenImprove,
  onImportFile,
  onExportPDF,
  onExportHTML,
  onExportJSON,
  onOpenVersionHistory,
  onReset,
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const importInputId = useId();

  return (
    <header className="rb2-topbar">
      <div className="rb2-topbarLeft">
        <span className="rb2-docIcon" aria-hidden="true">📄</span>
        <h1 className="rb2-title">Resume Builder</h1>
        <span className="rb2-savedStatus" aria-live="polite">
          <span aria-hidden="true">✓</span> {status}
        </span>
      </div>

      <div className="rb2-topbarRight">
        <select
          className="rb2-templateSelect"
          aria-label="Template"
          value={template}
          onChange={(e) => onChangeTemplate(e.target.value)}
        >
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <button type="button" className="rb2-topBtn" aria-pressed={previewOnly} onClick={onTogglePreviewOnly}>
          <span aria-hidden="true">👁</span> Preview
        </button>

        <button type="button" className="rb2-topBtn rb2-topBtn--accent" onClick={onOpenImprove}>
          <span aria-hidden="true">✨</span> Improve
        </button>

        <label className="rb2-topBtn rb2-importBtn rb2-onlyWide" htmlFor={importInputId}>
          <span aria-hidden="true">⬆</span> Import
          <input id={importInputId} type="file" accept="application/json" onChange={(e) => onImportFile(e.target.files?.[0])} style={{ display: "none" }} />
        </label>

        <Dropdown trigger={<><span aria-hidden="true">⬇</span> Export ▾</>} label="Export menu" open={exportOpen} setOpen={setExportOpen}>
          <button type="button" role="menuitem" className="rb2-menuItem" onClick={() => { setExportOpen(false); onExportPDF(); }}>
            <span className="rb2-menuIcon" aria-hidden="true">📕</span>
            <span><span className="rb2-menuItemTitle">PDF</span><span className="rb2-menuItemDesc">Best for printing</span></span>
          </button>
          <button type="button" role="menuitem" className="rb2-menuItem" onClick={() => { setExportOpen(false); onExportHTML(); }}>
            <span className="rb2-menuIcon" aria-hidden="true">🌐</span>
            <span><span className="rb2-menuItemTitle">HTML</span><span className="rb2-menuItemDesc">Best for web</span></span>
          </button>
          <button type="button" role="menuitem" className="rb2-menuItem" onClick={() => { setExportOpen(false); onExportJSON(); }}>
            <span className="rb2-menuIcon" aria-hidden="true">{"{ }"}</span>
            <span><span className="rb2-menuItemTitle">JSON</span><span className="rb2-menuItemDesc">Best for data</span></span>
          </button>
        </Dropdown>

        <Dropdown trigger={<span aria-hidden="true">⋮</span>} label="More actions" open={moreOpen} setOpen={setMoreOpen}>
          <label className="rb2-menuItem rb2-onlyNarrow" htmlFor={`${importInputId}-more`}>
            <span className="rb2-menuIcon" aria-hidden="true">⬆</span>
            <span className="rb2-menuItemTitle">Import JSON</span>
            <input id={`${importInputId}-more`} type="file" accept="application/json" onChange={(e) => { setMoreOpen(false); onImportFile(e.target.files?.[0]); }} style={{ display: "none" }} />
          </label>
          <button type="button" role="menuitem" className="rb2-menuItem" onClick={() => { setMoreOpen(false); onOpenVersionHistory(); }}>
            <span className="rb2-menuIcon" aria-hidden="true">🕘</span>
            <span className="rb2-menuItemTitle">Version history</span>
          </button>
          <button type="button" role="menuitem" className="rb2-menuItem rb2-menuItem--danger" onClick={() => { setMoreOpen(false); onReset(); }}>
            <span className="rb2-menuIcon" aria-hidden="true">↺</span>
            <span><span className="rb2-menuItemTitle">Reset resume</span><span className="rb2-menuItemDesc">This cannot be undone</span></span>
          </button>
        </Dropdown>
      </div>
    </header>
  );
}

/* ===========================================================
   Version history dialog (desktop + mobile)
   =========================================================== */
export function VersionHistoryDialog({ backups, onRestore, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const node = dialogRef.current;
    node?.querySelector("button")?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    node?.addEventListener("keydown", onKeyDown);
    return () => node?.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="rb2-modalScrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rb2-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
        <div className="rb2-modalHead">
          <strong id={titleId}>Version history</strong>
          <button type="button" className="rb2-iconBtn" onClick={onClose} aria-label="Close version history">✕</button>
        </div>
        <div className="rb2-modalBody">
          {backups.length === 0 ? (
            <p className="rb2-hint">No recovery points yet — one is saved automatically as you edit.</p>
          ) : (
            <ul className="rb2-versionList">
              {backups.map((b) => (
                <li key={b.key} className="rb2-versionItem">
                  <span>{new Date(b.ts).toLocaleString()}</span>
                  <button type="button" className="rb2-btn rb2-btn--secondary rb2-btn--tiny" onClick={() => onRestore(b.key)}>
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rb2-modalFoot">
          <button type="button" className="rb2-btn rb2-btn--secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   Mobile / tablet header + workspace tabs
   =========================================================== */
export function MobileHeader({ status, tab, setTab, improveBadge, onOpenMenu, overflowOpen, onToggleOverflow, overflowTriggerRef, children }) {
  return (
    <>
      <header className="rb2-mheader">
        <button type="button" className="rb2-iconBtn" onClick={onOpenMenu} aria-label="Open navigation menu">
          <span aria-hidden="true">☰</span>
        </button>
        <h1 className="rb2-mtitle">Resume Builder</h1>
        <span className="rb2-savedStatus rb2-savedStatus--compact" aria-live="polite">
          <span aria-hidden="true">✓</span> {status}
        </span>
        <div className="rb2-mheaderOverflow">
          <button
            type="button"
            ref={overflowTriggerRef}
            className="rb2-iconBtn"
            aria-haspopup="menu"
            aria-expanded={overflowOpen}
            aria-label="More actions"
            onClick={onToggleOverflow}
          >
            <span aria-hidden="true">⋮</span>
          </button>
          {children}
        </div>
      </header>
      <div className="rb2-mtabs" role="tablist" aria-label="Resume Builder workspace">
        {[
          { key: "edit", label: "Edit" },
          { key: "preview", label: "Preview" },
          { key: "improve", label: "Improve", badge: improveBadge },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`rb2-tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`rb2-panel-${t.key}`}
            className={`rb2-mtab ${tab === t.key ? "is-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {!!t.badge && <span className="rb2-mtabBadge">{t.badge}</span>}
          </button>
        ))}
      </div>
    </>
  );
}

/* ===========================================================
   Mobile bottom action bar + Export bottom sheet
   =========================================================== */
export function MobileActionBar({ onPreview, onOpenExport }) {
  return (
    <div className="rb2-mactions">
      <button type="button" className="rb2-btn rb2-btn--secondary rb2-mactionBtn" onClick={onPreview}>
        <span aria-hidden="true">👁</span> Preview
      </button>
      <button type="button" className="rb2-btn rb2-mactionBtn" onClick={onOpenExport}>
        <span aria-hidden="true">⬆</span> Export
      </button>
    </div>
  );
}

export function ExportSheet({ onClose, onImportFile, onExportPDF, onExportHTML, onExportJSON, triggerRef }) {
  const sheetRef = useRef(null);
  const titleId = useId();
  const importInputId = useId();

  useEffect(() => {
    const node = sheetRef.current;
    const focusables = () =>
      Array.from(node.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])'));
    focusables()[0]?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
      triggerRef?.current?.focus();
    };
  }, [onClose, triggerRef]);

  return (
    <div className="rb2-sheetScrim" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rb2-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={sheetRef}>
        <div className="rb2-sheetGrabber" aria-hidden="true" />
        <div className="rb2-sheetHead">
          <strong id={titleId}>Export Resume</strong>
          <button type="button" className="rb2-iconBtn" onClick={onClose} aria-label="Close export sheet">✕</button>
        </div>

        <button type="button" className="rb2-sheetRow" onClick={() => { onExportPDF(); onClose(); }}>
          <span className="rb2-menuIcon" aria-hidden="true">📕</span>
          <span><span className="rb2-menuItemTitle">Export as PDF</span><span className="rb2-menuItemDesc">Best for sharing and printing</span></span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="rb2-sheetRow" onClick={() => { onExportHTML(); onClose(); }}>
          <span className="rb2-menuIcon" aria-hidden="true">🌐</span>
          <span><span className="rb2-menuItemTitle">Export as HTML</span><span className="rb2-menuItemDesc">Web-friendly version</span></span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="rb2-sheetRow" onClick={() => { onExportJSON(); onClose(); }}>
          <span className="rb2-menuIcon" aria-hidden="true">{"{ }"}</span>
          <span><span className="rb2-menuItemTitle">Export as JSON</span><span className="rb2-menuItemDesc">For developers and integrations</span></span>
          <span aria-hidden="true">›</span>
        </button>
        <label className="rb2-sheetRow" htmlFor={importInputId}>
          <span className="rb2-menuIcon" aria-hidden="true">⬇</span>
          <span><span className="rb2-menuItemTitle">Import JSON</span><span className="rb2-menuItemDesc">Load a resume from JSON file</span></span>
          <input
            id={importInputId}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => { onImportFile(e.target.files?.[0]); onClose(); }}
          />
        </label>
      </div>
    </div>
  );
}

/* ===========================================================
   Mobile overflow menu (Version history / Reset)
   =========================================================== */
export function MobileOverflowMenu({ onOpenVersionHistory, onReset, onClose, triggerRef }) {
  const menuRef = useRef(null);
  useEffect(() => {
    const node = menuRef.current;
    node?.querySelector("button")?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const onDocClick = (e) => {
      if (node && !node.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onDocClick);
      triggerRef?.current?.focus();
    };
  }, [onClose, triggerRef]);

  return (
    <div className="rb2-menu rb2-menu--mobileOverflow" role="menu" aria-label="More actions" ref={menuRef}>
      <button type="button" role="menuitem" className="rb2-menuItem" onClick={() => { onOpenVersionHistory(); onClose(); }}>
        <span className="rb2-menuIcon" aria-hidden="true">🕘</span>
        <span className="rb2-menuItemTitle">Version history</span>
      </button>
      <button type="button" role="menuitem" className="rb2-menuItem rb2-menuItem--danger" onClick={() => { onReset(); onClose(); }}>
        <span className="rb2-menuIcon" aria-hidden="true">↺</span>
        <span><span className="rb2-menuItemTitle">Reset resume</span><span className="rb2-menuItemDesc">This cannot be undone</span></span>
      </button>
    </div>
  );
}
