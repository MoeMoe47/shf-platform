import React from "react";

const labels = { CONNECTED: "Connected", RECONNECTING: "Reconnecting", OFFLINE: "Real-time updates unavailable" };

export default function StudioCollaborationPanel({ ownerType, state }) {
  if (ownerType !== "TEAM") return null;
  const collaborators = state.collaborators || [];
  return <section className="studio-collaboration" aria-labelledby="studio-collaboration-heading">
    <div><p className="studio-eyebrow">Collaboration</p><h2 id="studio-collaboration-heading">Collaborators</h2></div>
    <p className="studio-collaborationState" role="status">{labels[state.status] || labels.OFFLINE}</p>
    {collaborators.length ? <ul aria-label="Active collaborators">{collaborators.map((person) => <li key={person.userId}>{person.name}</li>)}</ul> : <p className="studio-muted">No other collaborators are here.</p>}
    {state.lastRemoteUpdate && <p className="studio-collaborationUpdate" role="status">Updated by {state.lastRemoteUpdate}</p>}
  </section>;
}
