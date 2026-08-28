// src/pages/ResumeBuilder.jsx
// Responsive Resume Builder: two-region desktop workspace (Editor + Live
// Preview) with Career Intelligence as an overlay drawer, collapsing to a
// single-workspace Edit/Preview/Improve pattern on tablet and mobile.
// Business logic lives in resume-builder/store.js and is shared across
// every breakpoint — only presentation differs.
import React, { useEffect, useMemo, useRef, useState } from "react";

import { track } from "@/utils/analytics.js";
import { markDarkScope } from "@/utils/careerTheme.js";
import { downloadText, downloadJSON } from "../utils/downloads.js";
import { validateResume, migrateResume } from "../utils/resumeSchema.js";

import {
  loadResume, saveResume, getLoadError, withVisibility, analyzeMatch, computeStrength,
  awardResumeExport, listBackups, readBackup, safeNumber,
} from "./resume-builder/store.js";
import ResumeEditor from "./resume-builder/ResumeEditor.jsx";
import ResumePreview, { renderPrintableHTML, ResumeDocument } from "./resume-builder/ResumePreview.jsx";
import CareerIntelligence from "./resume-builder/CareerIntelligence.jsx";
import {
  DesktopTopBar, VersionHistoryDialog, MobileHeader, MobileActionBar, ExportSheet, MobileOverflowMenu,
} from "./resume-builder/Chrome.jsx";
import "./resume-builder/resumeBuilder.css";
import "./resume-builder/resumeBuilderDark.css";

const PRINT_STYLES = `
.rb2-printRoot { display: none; }
@media print {
  @page { size: A4; margin: 16mm; }
  body { background: #fff !important; }
  .rb2-shell > *:not(.rb2-printRoot) { display: none !important; }
  .rb2-printRoot { display: block !important; }
  .rb2-printRoot .resume { transform: none !important; }
}
.resume-a4 {
  width: 210mm; min-height: 297mm; background: #fff; color: #1a1a1a;
  padding: 16mm 14mm; font-size: var(--rb-fs, 14px); line-height: var(--rb-lh, 1.4);
}
[data-compact="true"].resume-a4 { padding: 12mm 11mm; }
.r-header { text-align: left; margin-bottom: 10px; }
.r-name { font-size: 2em; line-height: 1.05; margin: 0; font-weight: 800; letter-spacing: 0.2px; }
.r-title { font-size: .95em; color: #444; margin-top: 4px; }
.r-contact { font-size: .85em; color: #555; display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px; }
.r-sec { margin-top: 1em; }
.r-h2 { font-size: .9em; letter-spacing: .6px; text-transform: uppercase; color: #222; margin: 0 0 6px; border-bottom: 1px solid #eee; padding-bottom: 3px; }
.r-p { font-size: .9em; margin: 0; color: #222; }
.r-tags { list-style: none; padding: 0; margin: 0; display: flex; gap: 6px; flex-wrap: wrap; }
.r-tags li { font-size: .85em; border: 1px solid #e5e7eb; padding: 3px 8px; border-radius: 999px; }
.r-block { margin-top: 8px; }
.r-block-top { display: grid; grid-template-columns: 1fr auto; gap: 6px; align-items: baseline; }
.r-strong { font-weight: 700; font-size: .92em; }
.r-meta { color: #555; font-size: .85em; }
.r-dates { font-size: .85em; color: #333; }
.r-ul { margin: 4px 0 0 16px; }
.r-ul li { font-size: .9em; margin-bottom: 4px; }
.r-ul.flat { margin-left: 16px; }
.resume-a4[data-template="modern"] .r-h2 { border-bottom-color: var(--accent, #ff4f00); }
.resume-a4[data-template="modern"] .r-name { color: var(--accent, #ff4f00); }
.resume-a4[data-template="compact"] { padding: 12mm 11mm; }
.resume-a4[data-template="compact"] .r-sec { margin-top: .7em; }
.kw { background: rgba(255,79,0,.15); padding: 0 .12em; border-radius: 4px; }
`;

function useIsCompact() {
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023.98px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023.98px)");
    const onChange = () => setIsCompact(mq.matches);
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange));
  }, []);
  return isCompact;
}

function buildInitialData() {
  const d = loadResume();
  return {
    settings: { template: "clean", accent: "#111827", fontSize: 14, lineHeight: 1.4, showIcons: false, compact: false, ...(d.settings || {}) },
    contact: { links: [], ...(d.contact || {}) },
    skills: d.skills || [],
    sections: Array.isArray(d.sections) ? d.sections.map((s) => ({ hidden: false, ...s })) : [],
    summary: d.summary || "",
    name: d.contact?.name || d.name || "",
    title: d.title || "",
    jobDesc: d.jobDesc || "",
    ...d,
    template: undefined, // normalize older saves that stored template at the top level
  };
}

export default function ResumeBuilder() {
  const [data, setData] = useState(buildInitialData);
  const [loadError] = useState(getLoadError());
  const [status, setStatus] = useState("Saved");
  const [zoom, setZoom] = useState(100);

  const isCompact = useIsCompact();
  const [compactTab, setCompactTab] = useState("edit");
  const [previewOnly, setPreviewOnly] = useState(false);
  const [improveOpen, setImproveOpen] = useState(false);
  const [exportSheetOpen, setExportSheetOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [tipDismissed, setTipDismissed] = useState(() => {
    try { return localStorage.getItem("sh_resume_tip_dismissed") === "1"; } catch { return false; }
  });

  const overflowTriggerRef = useRef(null);
  const drawerRef = useRef(null);
  const preDrawerFocusRef = useRef(null);
  const preSheetFocusRef = useRef(null);

  useEffect(() => {
    try { track("resume_builder_viewed", {}, { silent: true }); } catch {}
  }, []);

  // Dark mode is applied globally (data-theme on <html>) but only actually
  // *painted* on pages that have real dark styling, so the shared header
  // doesn't go dark while an unfinished page is showing behind it. Resume
  // Builder is the only page with dark support today.
  useEffect(() => {
    markDarkScope("resume-builder", true);
    return () => markDarkScope("resume-builder", false);
  }, []);

  // Brainiact (the SHF Learning Companion, mounted globally via
  // RootProviders.jsx — see src/components/companion/Brainiact.jsx) is
  // viewport-fixed and will always sit over whatever tall content is at
  // the bottom-right of the screen — confirmed overlapping the A4
  // preview/Preview workspace via direct hit-testing when this was still
  // the plain `.coach-fab` button. The approved mock also shows no
  // floating chat affordance anywhere over the workspace (Edit or
  // Preview). Rather than padding around it (which can't work against an
  // arbitrarily long resume) or removing Coach, the floating presentation
  // is suppressed for the whole time Resume Builder is mounted; a
  // non-floating "Coach" entry stays in the shared header at all times
  // (see CareerLayout.jsx headerRight) as the equivalent, always-reachable
  // access point. Shared, systematic, and reversible — see
  // `body[data-coach-suppress~="resume-workspace"] .brainiact-root` in
  // src/styles/companion.css.
  useEffect(() => {
    const el = document.body;
    const existing = new Set((el.getAttribute("data-coach-suppress") || "").split(/\s+/).filter(Boolean));
    existing.add("resume-workspace");
    el.setAttribute("data-coach-suppress", Array.from(existing).join(" "));
    return () => {
      const cur = new Set((el.getAttribute("data-coach-suppress") || "").split(/\s+/).filter(Boolean));
      cur.delete("resume-workspace");
      if (cur.size) el.setAttribute("data-coach-suppress", Array.from(cur).join(" "));
      else el.removeAttribute("data-coach-suppress");
    };
  }, []);

  // Autosave (debounced) — writes localStorage + a bounded rolling backup.
  useEffect(() => {
    setStatus("Saving…");
    const id = setTimeout(() => {
      saveResume(data);
      setStatus("Saved");
    }, 800);
    return () => clearTimeout(id);
  }, [data]);

  const v = validateResume(data);
  const match = useMemo(() => analyzeMatch(data, data.jobDesc || ""), [data]);
  const strength = useMemo(() => computeStrength(data), [data]);
  const improveBadge = useMemo(() => {
    const missing = [
      !(data.summary || "").trim(),
      (data.skills || []).length < 3,
      !(data.sections || []).some((s) => (s.items || []).some((it) => (it.bullets || []).some((b) => /\d/.test(b)))),
    ].filter(Boolean).length;
    return missing;
  }, [data]);

  const updateSettings = (patch) => setData((d) => ({ ...d, settings: { ...(d.settings || {}), ...patch } }));
  const onChangeJobDesc = (jobDesc) => setData((d) => ({ ...d, jobDesc }));
  const addSkill = (kw) => setData((d) => ({ ...d, skills: Array.from(new Set([...(d.skills || []), kw])) }));

  const reset = () => {
    if (!window.confirm("Reset resume to a fresh template? This cannot be undone.")) return;
    const fresh = withVisibility({ ...buildInitialData(), name: "", title: "", summary: "", skills: [], sections: [], jobDesc: "" });
    setData(fresh);
    saveResume(fresh);
    track("resume_reset");
  };

  const exportJSON = () => {
    downloadJSON("resume.json", data);
    awardResumeExport("json");
    track("resume_export_json");
  };
  const exportHTML = () => {
    const html = renderPrintableHTML(data, PRINT_STYLES);
    downloadText("resume.html", html, "text/html;charset=utf-8");
    awardResumeExport("html");
    track("resume_export_html");
  };
  const exportPDF = () => {
    window.print();
    awardResumeExport("pdf");
    track("resume_print_pdf");
  };

  const importJSON = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      const migrated = withVisibility(migrateResume(obj));
      const check = validateResume(migrated);
      if (!check.ok) throw new Error(check.errors.join(", "));
      setData({ jobDesc: "", ...migrated });
      setCompactTab("preview");
      track("resume_import_json", { ok: true });
      window.shToast?.("Resume imported.");
    } catch (e) {
      window.alert("Invalid JSON file.\n" + (e?.message || ""));
      track("resume_import_json", { ok: false });
    }
  };

  const restoreBackup = (key) => {
    const doc = readBackup(key);
    if (!doc) return;
    if (!window.confirm("Restore this version? Your current changes will be replaced.")) return;
    setData(withVisibility(migrateResume(doc)));
    setVersionHistoryOpen(false);
    track("resume_restore_backup");
  };

  // Improve drawer: focus trap + Escape + return focus to trigger.
  useEffect(() => {
    if (!improveOpen || isCompact) return;
    const node = drawerRef.current;
    const focusables = () => Array.from(node.querySelectorAll('button, input, textarea, select, [tabindex]:not([tabindex="-1"])'));
    focusables()[0]?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setImproveOpen(false);
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
      preDrawerFocusRef.current?.focus?.();
    };
  }, [improveOpen, isCompact]);

  // Delegates to the shared shell's own hamburger control (AppShellLayout.jsx)
  // so there is one real drawer implementation, not a second parallel one.
  const openMobileNav = () => {
    document.querySelector(".sh-mobileMenuBtn")?.click();
  };

  const template = data.settings?.template || "clean";
  const backups = versionHistoryOpen ? listBackups() : [];

  return (
    <div className="rb2-shell" data-app-density={isCompact ? "compact" : "wide"}>
      {!v.ok && (
        <div className="rb2-banner rb2-banner--error">
          <strong>Schema error:</strong> {v.errors.join(", ")}
        </div>
      )}
      {loadError && (
        <div className="rb2-banner rb2-banner--warn">
          <strong>Loaded with warnings:</strong> {loadError}
        </div>
      )}

      {!isCompact && (
        <DesktopTopBar
          status={status}
          template={template}
          onChangeTemplate={(t) => updateSettings({ template: t })}
          previewOnly={previewOnly}
          onTogglePreviewOnly={() => setPreviewOnly((v2) => !v2)}
          onOpenImprove={() => {
            preDrawerFocusRef.current = document.activeElement;
            setImproveOpen(true);
          }}
          onImportFile={importJSON}
          onExportPDF={exportPDF}
          onExportHTML={exportHTML}
          onExportJSON={exportJSON}
          onOpenVersionHistory={() => setVersionHistoryOpen(true)}
          onReset={reset}
        />
      )}

      {isCompact && (
        <MobileHeader
          status={status}
          tab={compactTab}
          setTab={setCompactTab}
          improveBadge={improveBadge}
          onOpenMenu={openMobileNav}
          overflowOpen={overflowOpen}
          onToggleOverflow={() => setOverflowOpen((v2) => !v2)}
          overflowTriggerRef={overflowTriggerRef}
        >
          {overflowOpen && (
            <MobileOverflowMenu
              onOpenVersionHistory={() => setVersionHistoryOpen(true)}
              onReset={reset}
              onClose={() => setOverflowOpen(false)}
              triggerRef={overflowTriggerRef}
            />
          )}
        </MobileHeader>
      )}

      {!isCompact ? (
        <div className={`rb2-workspace ${previewOnly ? "rb2-workspace--previewOnly" : ""}`}>
          {!previewOnly && (
            <div className="rb2-col rb2-col--editor">
              <ResumeEditor data={data} onChange={setData} strength={strength} />
            </div>
          )}
          <div className="rb2-col rb2-col--preview">
            <ResumePreview
              data={data}
              onChangeSettings={updateSettings}
              zoom={zoom}
              setZoom={(z) => setZoom(Math.max(40, Math.min(150, safeNumber(z, 100))))}
              highlightTerms={match.highlightTerms}
            />
          </div>
        </div>
      ) : (
        <div className="rb2-compactBody">
          <div id="rb2-panel-edit" role="tabpanel" aria-labelledby="rb2-tab-edit" hidden={compactTab !== "edit"}>
            {compactTab === "edit" && <ResumeEditor data={data} onChange={setData} strength={strength} />}
          </div>
          <div id="rb2-panel-preview" role="tabpanel" aria-labelledby="rb2-tab-preview" hidden={compactTab !== "preview"}>
            {compactTab === "preview" && (
              <ResumePreview
                data={data}
                onChangeSettings={updateSettings}
                zoom={zoom}
                setZoom={(z) => setZoom(Math.max(40, Math.min(150, safeNumber(z, 100))))}
                highlightTerms={match.highlightTerms}
              />
            )}
          </div>
          <div id="rb2-panel-improve" role="tabpanel" aria-labelledby="rb2-tab-improve" hidden={compactTab !== "improve"}>
            {compactTab === "improve" && (
              <CareerIntelligence data={data} onChangeJobDesc={onChangeJobDesc} match={match} addSkill={addSkill} />
            )}
          </div>
        </div>
      )}

      {/* Bottom info bar — matches the approved desktop mock's persistent
          footer strip. Desktop-only: on mobile this space is already owned
          by the sticky MobileActionBar, and stacking a second full-width
          bar under it there risks the same kind of bottom-of-screen
          collision the Ask Coach fix above exists to prevent. Autosave and
          Portfolio-evidence reuse the exact data the old editor-panel
          status chips showed (see ResumeEditor.jsx) — relocated, not
          reinvented. */}
      {!isCompact && (
        <div className="rb2-bottomBar">
          <div className="rb2-bottomBarItem">
            <span aria-hidden="true">☁️</span>
            <div>
              <span className="rb2-bottomBarTitle">Autosave &amp; recovery</span>
              <span className="rb2-bottomBarSub">{status === "Saved" ? "All changes are being saved" : "Saving…"}</span>
            </div>
          </div>
          <div className="rb2-bottomBarItem">
            <span aria-hidden="true">💼</span>
            <div>
              <span className="rb2-bottomBarTitle">Portfolio evidence</span>
              <span className="rb2-bottomBarSub">Not linked yet</span>
            </div>
            <a className="rb2-bottomBarLink" href="/career.html#/portfolio">Manage</a>
          </div>
          {!tipDismissed && (
            <div className="rb2-bottomBarItem">
              <span aria-hidden="true">💡</span>
              <div>
                <span className="rb2-bottomBarTitle">Tip: Add metrics to your bullets</span>
                <span className="rb2-bottomBarSub">Quantify impact to boost your strength</span>
              </div>
              <button
                type="button"
                className="rb2-bottomBarDismiss"
                aria-label="Dismiss tip"
                onClick={() => {
                  setTipDismissed(true);
                  try { localStorage.setItem("sh_resume_tip_dismissed", "1"); } catch {}
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {isCompact && (
        <MobileActionBar
          onPreview={() => setCompactTab("preview")}
          onOpenExport={() => {
            preSheetFocusRef.current = document.activeElement;
            setExportSheetOpen(true);
          }}
        />
      )}

      {!isCompact && improveOpen && (
        <div className="rb2-drawerScrim" onMouseDown={(e) => e.target === e.currentTarget && setImproveOpen(false)}>
          <div className="rb2-drawer" role="dialog" aria-modal="true" aria-label="Career Intelligence" ref={drawerRef}>
            <button type="button" className="rb2-iconBtn rb2-drawerClose" onClick={() => setImproveOpen(false)} aria-label="Close Career Intelligence">✕</button>
            <CareerIntelligence data={data} onChangeJobDesc={onChangeJobDesc} match={match} addSkill={addSkill} />
          </div>
        </div>
      )}

      {isCompact && exportSheetOpen && (
        <ExportSheet
          triggerRef={preSheetFocusRef}
          onClose={() => setExportSheetOpen(false)}
          onImportFile={importJSON}
          onExportPDF={exportPDF}
          onExportHTML={exportHTML}
          onExportJSON={exportJSON}
        />
      )}

      {versionHistoryOpen && (
        <VersionHistoryDialog backups={backups} onRestore={restoreBackup} onClose={() => setVersionHistoryOpen(false)} />
      )}

      <div className="rb2-printRoot">
        <div className={`resume theme-${template}`}>
          <ResumeDocument data={{ ...data, sections: (data.sections || []).filter((s) => !s.hidden) }} highlightTerms={[]} />
        </div>
      </div>
      <style>{PRINT_STYLES}</style>
    </div>
  );
}
