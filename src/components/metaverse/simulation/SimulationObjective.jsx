import React from "react";

export default function SimulationObjective({ simulation }) {
  if (!simulation) return null;
  const prerequisites = simulation.prerequisites || [];
  return (
    <section className="met-simulation__objective" aria-label="Simulation objective and prerequisites">
      <p className="met-kicker">{simulation.simulationType?.replace(/_/g, " ")}</p>
      <h2>{simulation.title}</h2>
      <p className="met-activity__summary">{simulation.summary}</p>
      <p className="met-simulation__objective-text"><strong>Objective:</strong> {simulation.objective}</p>
      <h3>Prerequisites</h3>
      {prerequisites.length ? (
        <ul>
          {prerequisites.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p>No prerequisites — open to any active organization member.</p>
      )}
    </section>
  );
}
