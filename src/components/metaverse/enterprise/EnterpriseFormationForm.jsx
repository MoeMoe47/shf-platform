import React, { useState } from "react";
import { formEnterprise, METAVERSE_ENTERPRISE_CLIENT_META } from "@/system/metaverse/metaverseEnterpriseClient.js";

const CATEGORIES = ["PRODUCT_DESIGN", "DIGITAL_SERVICE", "CREATIVE_STUDIO", "COMMUNITY_SERVICE", "TECH_PROTOTYPE", "EVENT_SHOWCASE", "OTHER_EDUCATIONAL"];

export default function EnterpriseFormationForm({ myTeams, onFormed }) {
  const [studioTeamId, setStudioTeamId] = useState(myTeams?.[0]?.teamId || "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enterpriseCategory, setEnterpriseCategory] = useState(CATEGORIES[0]);
  const [legalBoundaryAcknowledged, setLegalBoundaryAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!legalBoundaryAcknowledged) { setError("You must acknowledge the educational/simulated boundary."); return; }
    setBusy(true);
    try {
      const enterprise = await formEnterprise({ studioTeamId, name, description, enterpriseCategory, legalBoundaryAcknowledged });
      onFormed?.(enterprise);
      setName("");
      setDescription("");
    } catch (err) {
      setError(err?.message || "Enterprise could not be proposed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="met-enterprise__form" onSubmit={submit} aria-label="Propose a Student Enterprise">
      <p className="met-enterprise__boundary" role="note">{METAVERSE_ENTERPRISE_CLIENT_META.legalBoundary}</p>
      <label>
        Canonical team
        <select value={studioTeamId} onChange={(event) => setStudioTeamId(event.target.value)} required>
          <option value="" disabled>Select your team</option>
          {(myTeams || []).map((team) => <option key={team.teamId} value={team.teamId}>{team.name}</option>)}
        </select>
      </label>
      <label>
        Enterprise name
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={160} required />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} required />
      </label>
      <label>
        Category
        <select value={enterpriseCategory} onChange={(event) => setEnterpriseCategory(event.target.value)}>
          {CATEGORIES.map((category) => <option key={category} value={category}>{category.replace(/_/g, " ").toLowerCase()}</option>)}
        </select>
      </label>
      <label className="met-enterprise__ack">
        <input type="checkbox" checked={legalBoundaryAcknowledged} onChange={(event) => setLegalBoundaryAcknowledged(event.target.checked)} />
        I understand this Student Enterprise is educational/simulated and not a real business, employer, or legal entity.
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <button type="submit" disabled={busy || !studioTeamId}>{busy ? "Proposing…" : "Propose enterprise"}</button>
    </form>
  );
}
