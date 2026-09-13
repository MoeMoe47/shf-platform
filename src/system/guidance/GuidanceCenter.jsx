import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/auth/auth-context.jsx";
import { useCompanion } from "@/hooks/useCompanion.js";
import "./guidanceCenter.css";

const API_BASE = import.meta.env?.VITE_SHS_API_BASE || "/api";

function safeRoute(target) {
  if (!target) return null;
  if (target.route && /^\/(?!\/)/.test(target.route) && !/^(\/\/|https?:|javascript:|data:)/i.test(target.route)) return target.route;
  if (target.routeId === "hub.workspace") return "/hub";
  return null;
}

function statusLabel(item) {
  return String(item?.state || item?.category || "REFERENCE").replaceAll("_", " ");
}

function sectionStatus(status) {
  if (status === "UNAVAILABLE") return <p className="guidance-muted">This source is temporarily unavailable.</p>;
  if (status === "PARTIAL") return <p className="guidance-muted">Some source information is unavailable.</p>;
  return null;
}

function emitTour(tourId, action) {
  window.dispatchEvent(new CustomEvent("dgal:tour-request", { detail: { tourId, action } }));
}

export default function GuidanceCenter({ destinationId = "bos", routeId = "hub.workspace", orientationId = "orientation:hub:workspace", tourId = "hub:workspace", title = "Guidance" }) {
  const auth = useAuthContext();
  const companion = useCompanion();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolution, setResolution] = useState(null);
  const [experience, setExperience] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const loadContext = useCallback(async () => {
    setLoading(true);
    try {
      const [contextResponse, experienceResponse] = await Promise.all([
        fetch(`${API_BASE}/orientation/context?destinationId=${encodeURIComponent(destinationId)}&routeId=${encodeURIComponent(routeId)}`, { credentials: "include" }),
        fetch(`${API_BASE}/orientation/experience?orientationId=${encodeURIComponent(orientationId)}&orientationVersion=1&tourId=${encodeURIComponent(tourId)}&tourVersion=1`, { credentials: "include" }),
      ]);
      const contextPayload = contextResponse.ok ? await contextResponse.json() : null;
      const experiencePayload = experienceResponse.ok ? await experienceResponse.json() : null;
      setResolution(contextPayload?.data || null);
      setExperience(experiencePayload?.data?.state || null);
    } catch {
      setResolution(null);
      setExperience(null);
    } finally {
      setLoading(false);
    }
  }, [destinationId, routeId, orientationId, tourId]);

  useEffect(() => {
    if (open) loadContext();
  }, [open, loadContext]);

  useEffect(() => {
    if (!open) return undefined;
    panelRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) triggerRef.current?.focus?.({ preventScroll: true });
  }, [open]);

  const orientation = resolution?.orientation;
  const checklist = resolution?.checklist || [];
  const docs = resolution?.documentation?.references || [];
  const topics = useMemo(() => [...new Set([...(orientation?.companionTopics || []), ...(resolution?.companion?.suggestedTopics || [])])], [orientation, resolution]);
  const relatedActions = useMemo(() => Object.values(orientation?.safeActions || {}).filter((target) => safeRoute(target)), [orientation]);
  const tourAction = experience?.status === "COMPLETED" ? "RESTART" : experience?.status === "STARTED" || experience?.status === "PAUSED" ? "RESUME" : "START";
  const tourLabel = tourAction === "RESTART" ? "Replay tour" : tourAction === "RESUME" ? "Resume tour" : "Take the tour";

  if (!auth.isAuthenticated) return null;
  return <>
    {typeof document !== "undefined" ? createPortal(<button ref={triggerRef} type="button" className="guidance-launch" onClick={() => setOpen(true)} aria-label="Open Guidance Center" aria-expanded={open}>Guidance</button>, document.body) : null}
    {open && typeof document !== "undefined" ? createPortal(<div className="guidance-backdrop" onClick={() => setOpen(false)}>
      <aside ref={panelRef} className="guidance-panel" role="dialog" aria-modal="true" aria-labelledby="guidance-center-title" tabIndex={-1} onClick={(event) => event.stopPropagation()}>
        <header className="guidance-panel__header"><div><p className="guidance-eyebrow">Contextual help</p><h2 id="guidance-center-title">{title}</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close Guidance Center">Close</button></header>
        {loading ? <p role="status" className="guidance-loading">Loading current guidance...</p> : null}
        {!loading && !resolution ? <p role="alert" className="guidance-muted">Current guidance is unavailable. Your workspace remains available.</p> : null}
        {orientation ? <>
          <section aria-labelledby="guidance-about-title"><h3 id="guidance-about-title">About this area</h3><p className="guidance-title">{orientation.title}</p><p>{orientation.purpose}</p></section>
          <section aria-labelledby="guidance-tour-title"><h3 id="guidance-tour-title">Take a tour</h3><p className="guidance-muted">{experience?.status === "COMPLETED" ? "You have completed this tour. Replay it whenever useful." : experience?.status ? "Continue from your saved place." : "See the key parts of this area."}</p><div className="guidance-actions"><button type="button" className="is-primary" onClick={() => { emitTour(tourId, tourAction); setOpen(false); }}>{tourLabel}</button>{orientation.accessibleAlternativeRef ? <button type="button" onClick={() => emitTour(tourId, "ALTERNATIVE")}>Open accessible guide</button> : null}</div></section>
          <section aria-labelledby="guidance-next-title"><h3 id="guidance-next-title">Your next steps</h3>{checklist.length ? <ul className="guidance-list">{checklist.slice(0, 6).map((item) => <li key={item.id}><div><strong>{item.title}</strong><small>{statusLabel(item)}{item.responsibility ? ` · Next: ${item.responsibility}` : ""}</small></div>{safeRoute(item.actionTarget) ? <button type="button" onClick={() => { navigate(safeRoute(item.actionTarget)); setOpen(false); }}>Open</button> : null}</li>)}</ul> : <p className="guidance-muted">No additional next steps are currently projected.</p>}</section>
          <section aria-labelledby="guidance-docs-title"><h3 id="guidance-docs-title">Documentation</h3>{sectionStatus(resolution.documentation?.status)}{resolution.documentation?.status === "AVAILABLE" && !docs.length ? <p className="guidance-muted">No additional documentation applies here.</p> : null}{docs.length ? <ul className="guidance-list">{docs.map((doc) => <li key={`${doc.kind}:${doc.id}`}><span>{doc.id}</span><small>{doc.kind}</small></li>)}</ul> : null}</section>
          <section aria-labelledby="guidance-questions-title"><h3 id="guidance-questions-title">Common questions</h3>{topics.length ? <ul className="guidance-topics">{topics.slice(0, 5).map((topic) => <li key={topic}>{topic}</li>)}</ul> : <p className="guidance-muted">No contextual questions are available.</p>}</section>
          <section aria-labelledby="guidance-related-title"><h3 id="guidance-related-title">Related workflows</h3>{relatedActions.length ? <ul className="guidance-list">{relatedActions.map((target, index) => <li key={`${target.routeId || target.route}:${index}`}><span>{target.routeId || "Open related workflow"}</span><button type="button" onClick={() => { navigate(safeRoute(target)); setOpen(false); }}>Open</button></li>)}</ul> : <p className="guidance-muted">No related workflows are available in this context.</p>}</section>
          <section aria-labelledby="guidance-companion-title"><h3 id="guidance-companion-title">Ask Companion</h3><p className="guidance-muted">Companion can explain this context using its read-only source projection.</p><button type="button" onClick={() => { companion.emit?.("guidance_context", { destinationId, orientationId, tourId, topics: topics.slice(0, 5), documentationIds: docs.slice(0, 5).map((doc) => doc.id), nextStepIds: checklist.slice(0, 6).map((item) => item.id) }); companion.openCoach(); setOpen(false); }}>Ask Companion</button></section>
          <section aria-labelledby="guidance-changed-title"><h3 id="guidance-changed-title">What's changed</h3>{resolution.reorientation?.changed ? <><p>Version {resolution.reorientation.priorVersion} changed to {resolution.reorientation.currentVersion}.</p><button type="button" onClick={() => { emitTour(tourId, "RESUME"); setOpen(false); }}>Review changes</button></> : <p className="guidance-muted">You are viewing the current orientation.</p>}</section>
        </> : null}
      </aside>
    </div>, document.body) : null}
  </>;
}
