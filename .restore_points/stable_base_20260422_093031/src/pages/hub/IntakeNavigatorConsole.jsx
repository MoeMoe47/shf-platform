import React, { useMemo, useState, useEffect } from "react";
import HubAdminShell from "../../components/hub/HubAdminShell.jsx";
import useOrganizations from "../../lib/hub/useOrganizations";
import useTaxonomy from "../../lib/hub/useTaxonomy";
import { createReferral } from "../../lib/hub/api";

function pillClass(active) {
  return active ? "ar-pill ar-pillOn" : "ar-pill";
}

export default function IntakeNavigatorConsole() {
  const organizations = useOrganizations();
  const taxonomy = useTaxonomy();

  const [selectedOrg, setSelectedOrg] = useState("");
  const [receivingOrg, setReceivingOrg] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const ready =
    !organizations.loading &&
    !taxonomy.loading &&
    !organizations.error &&
    !taxonomy.error;

  const orgOptions = organizations.items || [];
  const taxonomyOptions = taxonomy.items || [];

  useEffect(() => {
    if (!selectedOrg && orgOptions.length > 0) {
      setSelectedOrg(orgOptions[0].organization_id);
    }
    if (!receivingOrg && orgOptions.length > 1) {
      setReceivingOrg(orgOptions[1].organization_id);
    } else if (!receivingOrg && orgOptions.length > 0) {
      setReceivingOrg(orgOptions[0].organization_id);
    }
  }, [orgOptions, selectedOrg, receivingOrg]);

  useEffect(() => {
    if (!selectedCategory && taxonomyOptions.length > 0) {
      setSelectedCategory(taxonomyOptions[0].category_id);
    }
  }, [taxonomyOptions, selectedCategory]);

  const selectedOrgLabel = useMemo(() => {
    const found = orgOptions.find((org) => org.organization_id === selectedOrg);
    return (
      found?.organization_name ||
      found?.display_name ||
      found?.legal_name ||
      "Not selected"
    );
  }, [orgOptions, selectedOrg]);

  const receivingOrgLabel = useMemo(() => {
    const found = orgOptions.find((org) => org.organization_id === receivingOrg);
    return (
      found?.organization_name ||
      found?.display_name ||
      found?.legal_name ||
      "Not selected"
    );
  }, [orgOptions, receivingOrg]);

  const selectedCategoryLabel = useMemo(() => {
    const found = taxonomyOptions.find((item) => item.category_id === selectedCategory);
    return found?.category_name || "Not selected";
  }, [taxonomyOptions, selectedCategory]);

  const canSubmit = Boolean(selectedOrg && receivingOrg && selectedCategory) && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const result = await createReferral({
        organization_id: selectedOrg,
        receiving_organization_id: receivingOrg,
        need_category: selectedCategory,
        urgency_level: urgency,
        priority: urgency,
        notes: notes.trim(),
        program_id: null,
      });

      setSubmitSuccess(`Referral created: ${result?.case_id || "success"}`);
      setNotes("");
    } catch (err) {
      setSubmitError(err?.message || "Failed to create referral.");
    } finally {
      setSubmitting(false);
    }
  }

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
            <div className="rg-metaBar" style={{ marginTop: 0, marginBottom: 12 }}>
              <div className="rg-selectRow" style={{ width: "100%" }}>
                <div style={{ minWidth: 270, flex: 1 }}>
                  <div className="ar-label" style={{ marginBottom: 8 }}>Sending Organization</div>
                  <select
                    className="rg-select"
                    style={{ width: "100%" }}
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                  >
                    {orgOptions.map((org) => (
                      <option key={org.organization_id} value={org.organization_id}>
                        {org.organization_name || org.display_name || org.legal_name || org.organization_id}
                      </option>
                    ))}
                  </select>
                  <div className="ar-sub" style={{ marginTop: 6 }}>
                    {orgOptions.length} organizations loaded
                  </div>
                </div>

                <div style={{ minWidth: 270, flex: 1 }}>
                  <div className="ar-label" style={{ marginBottom: 8 }}>Receiving Organization</div>
                  <select
                    className="rg-select"
                    style={{ width: "100%" }}
                    value={receivingOrg}
                    onChange={(e) => setReceivingOrg(e.target.value)}
                  >
                    {orgOptions.map((org) => (
                      <option key={org.organization_id} value={org.organization_id}>
                        {org.organization_name || org.display_name || org.legal_name || org.organization_id}
                      </option>
                    ))}
                  </select>
                  <div className="ar-sub" style={{ marginTop: 6 }}>
                    {orgOptions.length} organizations loaded
                  </div>
                </div>

                <div style={{ minWidth: 270, flex: 1 }}>
                  <div className="ar-label" style={{ marginBottom: 8 }}>Need Category</div>
                  <select
                    className="rg-select"
                    style={{ width: "100%" }}
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {taxonomyOptions.map((item) => (
                      <option key={item.category_id} value={item.category_id}>
                        {item.category_name}
                      </option>
                    ))}
                  </select>
                  <div className="ar-sub" style={{ marginTop: 6 }}>
                    {taxonomyOptions.length} categories loaded
                  </div>
                </div>
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

            <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`ar-btn ${!canSubmit ? "ar-btnLocked" : ""}`}
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting ? "Creating Referral…" : "Create Referral"}
              </button>

              {submitSuccess ? (
                <div className="rg-pill rg-pillGood">{submitSuccess}</div>
              ) : null}

              {submitError ? (
                <div className="rg-error" style={{ margin: 0, padding: "8px 12px" }}>
                  {submitError}
                </div>
              ) : null}
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
                  <div className="ar-label">Sender</div>
                  <div className="ar-value">{selectedOrgLabel}</div>
                </div>
                <div className="ar-row">
                  <div className="ar-label">Receiver</div>
                  <div className="ar-value">{receivingOrgLabel}</div>
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
                    {selectedOrg && receivingOrg && selectedCategory ? "Ready to Submit" : "Needs Input"}
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
