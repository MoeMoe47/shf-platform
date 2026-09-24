import React from "react";

// MET-16B blank-screen regression hardening (Section 7/8).
//
// The Metaverse shell must never depend on the developer-only traffic
// authoring/preview subsystem succeeding. Without this boundary, a render
// exception anywhere in MetaverseTrafficAuthoringOverlay/Panel (for example
// from a future malformed route shape this codebase hasn't been audited
// against yet) would unmount every ancestor up to the nearest error
// boundary — and `/metaverse`'s entry point has none — which is exactly how
// "the owner's routes broke the whole page" can happen even though the
// subsystem itself is already dev+query-flag gated.
//
// This is intentionally small (per the "do not create a large new
// framework" instruction): it contains a failure to the traffic-authoring
// area only, logs full detail in dev, and renders NOTHING to the page —
// never a big scary error banner — because a normal learner should never
// see this component at all (the parent already gates its existence on
// `?trafficAuthor=1` + a dev build), and an owner mid-calibration just
// needs the rest of the city to keep working while they fix the route.
export default class MetaverseTrafficAuthoringErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("[MET-16B] Traffic authoring subsystem crashed — contained locally, Metaverse city still renders.", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (!import.meta.env.DEV) return null;
      return (
        <div
          role="alert"
          style={{
            position: "fixed",
            bottom: 12,
            left: 12,
            zIndex: 999,
            maxWidth: 360,
            padding: "8px 12px",
            background: "rgba(127, 29, 29, 0.92)",
            color: "#fecaca",
            fontFamily: "ui-monospace, monospace",
            fontSize: "0.7rem",
            borderRadius: 8,
            border: "1px solid rgba(248, 113, 113, 0.6)",
          }}
        >
          Traffic authoring/preview crashed and was disabled for this session
          (dev-only notice — the Metaverse city itself is unaffected). See
          console for details.
        </div>
      );
    }
    return this.props.children;
  }
}
