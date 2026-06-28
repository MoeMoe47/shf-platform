import React from "react";
import { DIRECT_SOURCE_PROOF_SAFETY_COPY } from "@/data/directConnect/directSourceProofSafety";

const FLAGS = [
  ["public_approved", "public_approved"],
  ["Truth Spine Claim Created", "truth_spine_claim_created"],
  ["SHF Impact Mutated", "shf_impact_data_mutated"],
  ["Live Connection", "live_connection_enabled"],
  ["Credential Required", "credential_required"],
  ["External API Called", "external_api_called"],
];

export default function DirectSourceSafetyPanel({ proof, metrics }) {
  return (
    <section className="dc-proof-card" aria-label="Direct-source safety">
      <div className="dc-section-head">
        <span>Safety Boundary</span>
        <strong>Direct-source proof only</strong>
      </div>
      <p className="dc-boundary-copy">{DIRECT_SOURCE_PROOF_SAFETY_COPY}</p>
      <div className="dc-status-grid">
        <div><span>Public Ready</span><strong>{metrics.public_surface_ready}</strong></div>
        <div><span>Live Connections</span><strong>{metrics.live_connection_enabled_count}</strong></div>
        <div><span>Credentials</span><strong>{metrics.credential_required_count}</strong></div>
        <div><span>External APIs</span><strong>{metrics.external_api_called_count}</strong></div>
      </div>
      <div className="dc-flag-grid">
        {FLAGS.map(([label, key]) => (
          <div key={key}>
            <span>{label}</span>
            <strong>{String(proof?.[key] ?? false)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
