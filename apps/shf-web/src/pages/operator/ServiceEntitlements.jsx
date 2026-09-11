import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import ErrorBanner from "../../components/ErrorBanner";
import {
  grantOrganizationService,
  listOrganizationEntitlements,
  listServiceCatalog,
  transitionOrganizationService,
} from "../../services/service-entitlements-client";

const DEFAULT_ORGANIZATION_ID = "org_partner_001";

export default function ServiceEntitlements() {
  const [organizationId, setOrganizationId] = useState(DEFAULT_ORGANIZATION_ID);
  const [services, setServices] = useState([]);
  const [entitlements, setEntitlements] = useState([]);
  const [reason, setReason] = useState("Phase 3 administrative update");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load(target = organizationId) {
    setError("");
    try {
      const [catalog, orgEntitlements] = await Promise.all([
        listServiceCatalog(),
        listOrganizationEntitlements(target),
      ]);
      setServices(catalog.data.items);
      setEntitlements(orgEntitlements.data.items);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load(DEFAULT_ORGANIZATION_ID);
  }, []);

  const entitlementByService = useMemo(() => {
    return new Map(entitlements.map((item) => [item.serviceKey, item]));
  }, [entitlements]);

  async function run(action) {
    setError("");
    setNotice("");
    try {
      await action();
      await load();
      setNotice("Service status updated.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader title="Organization Services" subtitle="Available Services and Active Services" />
      <ErrorBanner message={error} />
      {notice ? <p role="status" aria-live="polite">{notice}</p> : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          load(organizationId);
        }}
        style={{ display: "grid", gap: 12, maxWidth: 520, marginBottom: 20 }}
      >
        <label>
          Organization ID
          <input
            aria-label="Organization ID"
            value={organizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
            style={{ display: "block", width: "100%", minHeight: 36, marginTop: 4 }}
          />
        </label>
        <label>
          Reason
          <input
            aria-label="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            style={{ display: "block", width: "100%", minHeight: 36, marginTop: 4 }}
          />
        </label>
        <button type="submit">Load Services</button>
      </form>

      <section aria-label="Available Services" style={{ display: "grid", gap: 12 }}>
        {services.map((service) => {
          const entitlement = entitlementByService.get(service.serviceKey);
          const status = entitlement?.status || "Not Enabled";
          return (
            <article
              key={service.serviceKey}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 16,
                display: "grid",
                gap: 10,
                minWidth: 0,
              }}
            >
              <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "start", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{service.name}</h3>
                  <p style={{ margin: "6px 0 0" }}>{service.description}</p>
                  <p style={{ margin: "6px 0 0", fontSize: 13 }}>Provider: {service.providerOrganizationId}</p>
                </div>
                <StatusChip value={status} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  aria-label={`Grant ${service.name}`}
                  onClick={() => run(() => grantOrganizationService(organizationId, service.serviceKey, reason))}
                >
                  Grant
                </button>
                <button
                  type="button"
                  aria-label={`Suspend ${service.name}`}
                  disabled={!entitlement || entitlement.status !== "ACTIVE"}
                  onClick={() => run(() => transitionOrganizationService(organizationId, entitlement.entitlementId, "SUSPENDED", reason))}
                >
                  Suspend
                </button>
                <button
                  type="button"
                  aria-label={`Revoke ${service.name}`}
                  disabled={!entitlement || entitlement.status === "REVOKED"}
                  onClick={() => run(() => transitionOrganizationService(organizationId, entitlement.entitlementId, "REVOKED", reason))}
                >
                  Revoke
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
