import React, { useMemo, useState } from "react";
import HubAdminShell from "../../components/hub/HubAdminShell.jsx";
import useOrganizations from "../../lib/hub/useOrganizations";
import useTaxonomy from "../../lib/hub/useTaxonomy";

function pillClass(active) {
  return active ? "ar-pill ar-pillOn" : "ar-pill";
}

export default function IntakeNavigatorConsole() {
  const organizations = useOrganizations();
  const taxonomy = useTaxonomy();

  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [notes, setNotes] = useState("");

  const ready = !organizations.loading && !taxonomy.loading && !organizations.error && !taxonomy.error;

  const orgOptions = organizations.items || [];
  const taxonomyOptions = taxonomy.items || [];

  const selectedOrgLabel = useMemo(() => {
    const found = orgOptions.find((org) => org.organization_id === selectedOrg);
    return (
      found?.organization_name ||
      found?.display_name ||
      found?.legal_name ||
      "Not selected"
    );
  }, [orgOptions, selectedOrg]);

  const selectedCategoryLabel = useMemo(() => {
    const found = taxonomyOptions.find((item) => item.category_id === selectedCategory);
    return found?.category_name || "Not selected";
  }, [taxonomyOptions, selectedCategory]);

  const actions = (
    <>
      <button
        type="button"
        className={pillClass(urgency === "low")}
        onClick={() => setUrgency("low")}
      >
        Low
      </button>
      <button
        type="button"
        className={pillClass(urgency === "medium")}
        onClick={() => setUrgency("medium")}
      >
        Medium
      </button>
      <button
        type="button"
        className={pillClass(urgency === "high")}
        onClick={() => setUrgency("high")}
      >
        High
      </button>
    </>
  );

  return (
    <HubAdminShell
      title="Intake Navigator Console"
      subtitle="Operator-facing intake, routing, and handoff workspace for organization selection, need classification, and referral preparation."
      actions={actions}
    >
      {!ready ? (
        <div className="rg-error" style={{ maxWidth: 1200 }}>
          {organizations.loading || taxonomy.loading
            ? "Loading intake dependencies…"
            : organizations.error || taxonomy.error}
        </div>
      ) : (
        <>
          <div
            className="rg-tableWrap"
            style={{ maxWidth: 1200, marginTop: 0, marginBottom: 18 }}
          >
            <div className="rg-metaBar" style={{ marginTop: 0 }}>
              <div className="rg-selectRow">
                <select
                  className="rg-select"
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                >
                  <option value="">Select organization…</option>
                  {orgOptions.map((org) => (
                    <option key={org.organization_id} value={org.organization_id}>
                      {org.organization_name || org.display_name || org.legal_name || org.organization_id}
                    </option>
                  ))}
                </select>

                <select
                  className="rg-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Select need category…</option>
                  {taxonomyOptions.map((item) => (
                    <option key={item.category_id} value={item.category_id}>
                      {item.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rg-topBtns">
                <span className="rg-pill">{String(urgency).toUpperCase()} PRIORITY</span>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Capture intake notes, barriers, or routing guidance…"
                style={{
                  width: "100%",
                  minHeight: 120,
                  borderRadius: 12,
                  border: "1px solid rgba(20,20,20,0.12)",
                  background: "rgba(255,255,255,0.45)",
                  padding: 12,
                  fontSize: 14,
                  color: "rgba(20,20,20,0.88)",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div className="ar-grid">
            <div className="ar-card">
              <div className="ar-top">
                <div className="ar-nameRow">
                  <div className="ar-name">Organization Context</div>
                </div>
              </div>
              <div className="ar-body">
                <div className="ar-row">
                  <div className="ar-label">Selected</div>
                  <div className="ar-value">{selectedOrgLabel}</div>
                </div>
                <div className="ar-row">
                  <div className="ar-label">Available</div>
                  <div className="ar-value">{orgOptions.length} organizations</div>
                </div>
              </div>
            </div>

            <div className="ar-card">
              <div className="ar-top">
                <div className="ar-nameRow">
                  <div className="ar-name">Need Classification</div>
                </div>
              </div>
              <div className="ar-body">
                <div className="ar-row">
                  <div className="ar-label">Category</div>
                  <div className="ar-value">{selectedCategoryLabel}</div>
                </div>
                <div className="ar-row">
                  <div className="ar-label">Available</div>
                  <div className="ar-value">{taxonomyOptions.length} categories</div>
                </div>
              </div>
            </div>

            <div className="ar-card">
              <div className="ar-top">
                <div className="ar-nameRow">
                  <div className="ar-name">Referral Draft Readiness</div>
                </div>
                <div className="ar-badges">
                  <span className="shf-badge">
                    {selectedOrg && selectedCategory ? "Ready to Wire" : "Needs Input"}
                  </span>
                </div>
              </div>
              <div className="ar-body">
                <div className="ar-row">
                  <div className="ar-label">Urgency</div>
                  <div className="ar-value">{String(urgency).toUpperCase()}</div>
                </div>
                <div className="ar-row">
                  <div className="ar-label">Notes</div>
                  <div className="ar-value">
                    {notes.trim() ? notes.trim() : "No intake notes entered yet."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </HubAdminShell>
  );
}
