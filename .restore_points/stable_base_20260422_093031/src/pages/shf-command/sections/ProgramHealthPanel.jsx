import React from "react";

export default function ProgramHealthPanel({ programs = [], onProgramClick }) {
  return (
    <div className="shf-panel">
      <div className="shf-panel__header">
        <div>
          <h2>Program Health</h2>
          <p className="shf-panel__helper">
            Compare program condition, funding posture, and delivery momentum.
          </p>
        </div>
      </div>

      <div className="shf-program-grid">
        {programs.map((program) => (
          <button
            key={program.id}
            type="button"
            className="shf-program-card"
            onClick={() => onProgramClick?.(program)}
          >
            <div className="shf-program-card__top">
              <div>
                <h3>{program.name}</h3>
                <span className={`shf-program-card__status shf-status--${String(program.status).toLowerCase().replace(/\s+/g, "-")}`}>
                  {program.status}
                </span>
              </div>
              <div className="shf-program-card__served">{program.served}</div>
            </div>

            <div className="shf-program-card__metrics">
              <div>
                <span>Locations</span>
                <strong>{program.locations}</strong>
              </div>
              <div>
                <span>Funding</span>
                <strong>{program.funding}</strong>
              </div>
              <div>
                <span>Trend</span>
                <strong>{program.trend}</strong>
              </div>
              <div>
                <span>Risk Level</span>
                <strong>{program.risk}</strong>
              </div>
            </div>

            <p className="shf-program-card__note">{program.note}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
