import React from "react";
import dataCenterIntroLesson from "@/content/lessons/data-center-foundations-student/data-center-foundations-introduction.json";
import { requestMetaverseEntry } from "@/system/metaverse/metaverseRuntimeClient.js";
import MetaverseSimulationShell from "./simulation/MetaverseSimulationShell.jsx";

const LESSONS = {
  "data-center-foundations-introduction": dataCenterIntroLesson,
};

// MET-13 — every simulation registry id (see apps/shs-api/src/domain/
// metaverse/simulations/registry/simulation-registry.ts) renders through
// the same reusable MetaverseSimulationShell; none of them get a bespoke
// page component.
const SIMULATION_IDS = new Set([
  "data-center-operations-simulation",
  "ai-agent-build-test-simulation",
  "enterprise-service-delivery-simulation",
  "civic-budget-tradeoff-simulation",
  "career-pathway-exploration-scenario",
  "arcade-mission-prep-drill",
  "enterprise-budgeting-simulation",
  "community-accessibility-audit-challenge",
  "team-time-management-challenge",
  "city-scavenger-hunt-side-mission",
]);

export default function MetaverseActivityMount({ activity, facility, district, decision, onExit }) {
  const lesson = LESSONS[activity?.id] || null;
  const isSimulation = SIMULATION_IDS.has(activity?.id);

  React.useEffect(() => {
    if (!activity?.id) return;
    requestMetaverseEntry(activity, { event: "activity_start" }).catch(() => {});
  }, [activity]);

  if (isSimulation) {
    return <MetaverseSimulationShell activity={activity} facility={facility} district={district} decision={decision} onExit={onExit} />;
  }

  if (!lesson) {
    return (
      <section className="met-activity" aria-label="Protected activity">
        <p className="met-kicker">Protected activity</p>
        <h2>{activity?.label || "Activity unavailable"}</h2>
        <p>This activity has no safe reusable curriculum mount yet.</p>
        <button type="button" onClick={onExit}>Exit activity</button>
      </section>
    );
  }

  return (
    <section className="met-activity" aria-label={`Protected activity: ${lesson.title}`}>
      <div className="met-activity__head">
        <div>
          <p className="met-kicker">Curriculum activity</p>
          <h2>{lesson.title}</h2>
          <p>{facility?.label} · {district?.label}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            requestMetaverseEntry(activity, { event: "activity_exit" }).catch(() => {});
            onExit?.();
          }}
        >
          Exit activity
        </button>
      </div>
      <p className="met-activity__summary">{lesson.summary}</p>
      <div className="met-activity__grid">
        <section>
          <h3>Objectives</h3>
          <ul>
            {(lesson.objectives || []).map((objective) => <li key={objective}>{objective}</li>)}
          </ul>
        </section>
        <section>
          <h3>Vocabulary</h3>
          <dl>
            {(lesson.vocab || []).map((item) => (
              <React.Fragment key={item.term}>
                <dt>{item.term}</dt>
                <dd>{item.def}</dd>
              </React.Fragment>
            ))}
          </dl>
        </section>
      </div>
      {(lesson.sections || []).map((section) => (
        <article className="met-activity__section" key={section.heading}>
          <h3>{section.heading}</h3>
          <p>{section.body}</p>
        </article>
      ))}
      <aside className="met-activity__boundary" role="note">
        <strong>Activity boundary:</strong> this metaverse view started a protected learning activity, but it does not mark completion, pass an assessment, verify an outcome, issue a credential, or create employment eligibility.
      </aside>
      <p className="met-activity__decision">{decision?.reason_text}</p>
    </section>
  );
}
