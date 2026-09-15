import React, { useMemo, useState } from "react";
import MetaverseOpportunityCard from "./MetaverseOpportunityCard.jsx";
import MetaverseOpportunityDetail from "./MetaverseOpportunityDetail.jsx";

const TYPE_LABEL = {
  PROJECT: "Project",
  CITY_MISSION: "City Mission",
  PROGRAM_MISSION: "Program Mission",
  SIDE_MISSION: "Side Mission",
  EVENT: "Event",
  CAREER_EXPERIENCE: "Career Experience",
  STUDENT_ENTERPRISE_CONTRACT: "Student Enterprise Contract",
  COMMUNITY_PROJECT: "Community Project",
  ARCADE_CHALLENGE_CONTRACT: "Arcade Challenge Contract",
};

// MET-8 §20/§21 — the Student Opportunity Exchange. Every opportunity
// here, and every district/facility count derived from it, comes straight
// from GET /metaverse/opportunity-exchange/opportunities — never a
// fabricated count (mirrors MetaverseMissionList.jsx's own real-data-only
// convention). Fully keyboard- and screen-reader-operable; no map-only
// requirement (build brief §28).
export default function MetaverseOpportunityExchange({ open, opportunities, loading, error, onClose }) {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);

  const types = useMemo(() => Array.from(new Set(opportunities.map((item) => item.opportunityType))), [opportunities]);
  const filtered = useMemo(
    () => (typeFilter === "ALL" ? opportunities : opportunities.filter((item) => item.opportunityType === typeFilter)),
    [opportunities, typeFilter],
  );
  const districtCounts = useMemo(() => {
    const counts = {};
    for (const item of opportunities) {
      if (!item.districtId) continue;
      counts[item.districtId] = (counts[item.districtId] || 0) + 1;
    }
    return counts;
  }, [opportunities]);

  if (selected) {
    return (
      <section className={`met-opportunities ${open ? "is-open" : ""}`} aria-label="Opportunity detail">
        <MetaverseOpportunityDetail opportunity={selected} onClose={() => setSelected(null)} />
      </section>
    );
  }

  return (
    <section className={`met-opportunities ${open ? "is-open" : ""}`} aria-label="Student Opportunity Exchange">
      <div className="met-opportunities__header">
        <h2>Opportunity Exchange</h2>
        <button type="button" onClick={onClose}>Close</button>
      </div>

      {loading ? <p className="met-opportunities__status" role="status">Loading opportunities…</p> : null}
      {error ? <p className="met-opportunities__status" role="alert">{error}</p> : null}

      {Object.keys(districtCounts).length ? (
        <ul className="met-opportunities__district-counts" aria-label="Open opportunities by district">
          {Object.entries(districtCounts).map(([districtId, count]) => (
            <li key={districtId}>{districtId.replace(/-district$/, "").replace(/-/g, " ")}: {count} opportunit{count === 1 ? "y" : "ies"} open</li>
          ))}
        </ul>
      ) : null}

      {types.length > 1 ? (
        <label className="met-opportunities__filter">
          Filter by type
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="ALL">All types</option>
            {types.map((type) => <option key={type} value={type}>{TYPE_LABEL[type] || type}</option>)}
          </select>
        </label>
      ) : null}

      {!loading && !error && filtered.length === 0 ? (
        <p className="met-opportunities__status">No open opportunities match right now.</p>
      ) : null}

      <ul className="met-opportunities__list">
        {filtered.map((opportunity) => (
          <MetaverseOpportunityCard key={opportunity.opportunityId} opportunity={opportunity} onSelect={setSelected} />
        ))}
      </ul>
    </section>
  );
}
