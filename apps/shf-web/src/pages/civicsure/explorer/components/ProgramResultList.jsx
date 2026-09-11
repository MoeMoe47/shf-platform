import React from "react";
import ProgramResultCard from "./ProgramResultCard.jsx";

export default function ProgramResultList({ programs = [] }) {
  if (!programs.length) {
    return <p className="cse-empty-state">No approved public assurance records are currently available.</p>;
  }
  return (
    <div className="cse-results" role="list" aria-label="Published public assurance results">
      {programs.map((program) => (
        <div role="listitem" key={program.id}>
          <ProgramResultCard program={program} />
        </div>
      ))}
    </div>
  );
}
