import React from "react";
import { resolveJourneyExperience } from "@/system/exr/exrJourneyExperience.js";

export default function ExrJourneyContext({ journeyId, actor, organizationId, roleLabel, state, currentWork, nextAction, nextActionSource = "DOMAIN_PROJECTION" }) {
  const experience = resolveJourneyExperience({ journeyId, actor, organizationId, roleLabel, workflowState: state, currentWork, nextAction, nextActionSource });
  if (!experience.journeyId) return null;
  return <section aria-labelledby={`${journeyId}-context-heading`} className="exr-journey-context"><h2 id={`${journeyId}-context-heading`}>Your current context</h2><dl><dt>Organization</dt><dd>{experience.context.organizationId || "No organization selected"}</dd><dt>Role</dt><dd>{experience.context.role || "Current role"}</dd><dt>State</dt><dd role="status">{experience.state}</dd><dt>Current work</dt><dd>{experience.currentWork}</dd><dt>Next action</dt><dd>{experience.nextAction}</dd></dl><p><a href={experience.help}>Get contextual help</a></p></section>;
}
