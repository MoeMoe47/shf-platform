import React from "react";
import { SHS_SYSTEM_REGISTRY_SAFETY_COPY } from "@/system/system-registry/shsSystemRegistryTypes";

export default function SystemRegistrySafetyPanel({ safetyResult }) {
  return (
    <section className="system-registry-panel safety">
      <div className="panel-heading"><p>Safety</p><h2>Read-only Boundary</h2></div>
      <p className="safety-copy">{SHS_SYSTEM_REGISTRY_SAFETY_COPY}</p>
      <strong>Safety issues: {safetyResult.issue_count}</strong>
      <div className="flag-grid">
        <span>production_mutation: false</span>
        <span>public_approval_mutation: false</span>
        <span>shf_impact_mutation: false</span>
        <span>external_delivery: false</span>
        <span>webhook_send: false</span>
        <span>notification_send: false</span>
        <span>warehouse_write: false</span>
        <span>auth_mutation: false</span>
        <span>credential_storage: false</span>
      </div>
    </section>
  );
}

