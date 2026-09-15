import React from "react";

// MET-13 §8/§27 — team membership is always a server-derived fact; this
// panel never lets a learner self-declare membership in a team it
// renders. The learner picks which of their own real teams to use; the
// server independently verifies that membership before any session
// starts.
export default function SimulationTeamPanel({ teamMode, teamSessionRef, onTeamIdChange, teamIdInput, error }) {
  if (!teamMode || teamMode === "INDIVIDUAL") {
    return (
      <section className="met-simulation__team" aria-label="Participation mode">
        <p>Participation mode: <strong>Individual</strong>.</p>
      </section>
    );
  }
  return (
    <section className="met-simulation__team" aria-label="Team participation">
      <p>
        Participation mode: <strong>{teamMode === "TEAM" ? "Team required" : "Individual or team"}</strong>.
      </p>
      {teamSessionRef ? (
        <p>Active team session: {teamSessionRef}</p>
      ) : (
        <>
          <label htmlFor="met-simulation-team-id">Your Studio team id</label>
          <input
            id="met-simulation-team-id"
            type="text"
            value={teamIdInput}
            onChange={(event) => onTeamIdChange(event.target.value)}
            aria-describedby="met-simulation-team-hint"
          />
          <p id="met-simulation-team-hint" className="met-simulation__hint">
            The server verifies this against your real, active Studio team membership before starting a team session — you cannot declare membership yourself.
          </p>
        </>
      )}
      {error ? <p role="alert" className="met-simulation__error">{error}</p> : null}
    </section>
  );
}
