import React from "react";
import { SHS_TRACKING_DANGEROUS_FLAGS, SHS_TRACKING_SAFETY_COPY } from "@/system/tracking/shsTrackingTypes";

const blocked = [
  "private secrets",
  "external auth payloads",
  "financial account payloads",
  "live connector payloads",
  "cookie tracking",
  "pixel tracking",
  "third-party analytics",
  "webhook sending",
  "notification sending",
  "warehouse write",
  "report publishing",
  "public approval mutation",
  "SHF Impact Data mutation",
];

export default function TrackingSafetyPanel({ safetyResult, onSafetyScan }) {
  return (
    <section className="tracking-panel tracking-safety">
      <div className="panel-heading"><p>Safety</p><h2>Internal-only Boundary</h2></div>
      <p className="safety-copy">{SHS_TRACKING_SAFETY_COPY}</p>
      <button type="button" onClick={onSafetyScan}>Run Safety Scan</button>
      <div className="tracking-flags">
        {Object.entries(SHS_TRACKING_DANGEROUS_FLAGS).map(([key, value]) => <span key={key}>{key}: {String(value)}</span>)}
      </div>
      <div className="blocked-grid">
        {blocked.map((item) => <span key={item}>{item}</span>)}
      </div>
      <strong>Safety scan: {safetyResult.safety_status}</strong>
    </section>
  );
}
