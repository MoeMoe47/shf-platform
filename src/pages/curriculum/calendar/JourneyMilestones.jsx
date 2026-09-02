// src/pages/curriculum/calendar/JourneyMilestones.jsx
//
// SHF Ecosystem Phase 6 — renders the backend Journey Milestones
// projection. This component does not compute completion, infer progress
// from dates, or create milestones; it only displays canonical projected
// facts returned by /journey/milestones/me.
import React from "react";
import { listJourneyMilestones } from "@/lib/journey/api.js";
import { useCelebration } from "@/experience/celebrations/CelebrationProvider.jsx";
import { achievementFromJourneyMilestone } from "@/experience/celebrations/celebrationPolicy.js";

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function JourneyMilestones({ role }) {
  const [state, setState] = React.useState({ loading: true, error: null, items: [] });
  const { celebrateAchievement } = useCelebration();

  React.useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    listJourneyMilestones(role)
      .then((data) => {
        if (!active) return;
        setState({ loading: false, error: null, items: data?.items || [] });
      })
      .catch((error) => {
        if (!active) return;
        setState({ loading: false, error, items: [] });
      });
    return () => {
      active = false;
    };
  }, [role]);

  React.useEffect(() => {
    if (state.loading || state.error) return;
    for (const item of state.items) {
      const achievement = achievementFromJourneyMilestone(item);
      if (achievement) celebrateAchievement(achievement);
    }
  }, [celebrateAchievement, state.error, state.items, state.loading]);

  return (
    <section className="lc-milestones" aria-labelledby="lc-milestones-title">
      <h2 id="lc-milestones-title" className="lc-milestonesTitle">Journey Milestones</h2>
      {state.loading ? (
        <div className="lc-milestonesEmpty" role="status">
          <p className="lc-railEmpty">Loading milestones…</p>
        </div>
      ) : state.error ? (
        <div className="lc-milestonesEmpty" role="status">
          <p className="lc-railEmpty">Journey milestones are unavailable. Calendar events remain visible.</p>
        </div>
      ) : state.items.length === 0 ? (
        <div className="lc-milestonesEmpty">
          <p className="lc-railEmpty">
            Pathway milestones aren't tracked yet for your account. This view will populate automatically
            once canonical completion, Evidence, Enrollment, Project, Capstone, or Career Event milestones are available.
          </p>
        </div>
      ) : (
        <ol className="lc-milestoneList" aria-label="Projected journey milestones">
          {state.items.map((item) => (
            <li key={item.id} className="lc-milestoneItem">
              <span className="lc-milestoneType">{item.type.replace("_", " ")}</span>
              <p className="lc-milestoneName">{item.title}</p>
              <p className="lc-milestoneMeta">{formatDate(item.occursAt)} · {item.status}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
