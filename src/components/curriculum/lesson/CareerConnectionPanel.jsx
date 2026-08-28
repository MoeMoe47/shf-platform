// src/components/curriculum/lesson/CareerConnectionPanel.jsx
//
// Approved mock's compact "Career Connection" surface. No real lesson JSON
// carries per-lesson career/skill mappings (checked every field across
// src/content/lessons/asl-student/*.json), so this deliberately stays
// generic and informational rather than fabricating a specific "this
// skill helps in healthcare, web development..." claim the mock shows for
// its own (non-real) example lesson. It links to the real, existing
// Career Pathways cross-app route (src/router/paths.js's href.career()).
import React from "react";
import { href } from "@/router/paths.js";
import { BriefcaseIcon } from "@/components/curriculum/icons.jsx";

export default function CareerConnectionPanel() {
  return (
    <section className="ld-card ld-panelCard" aria-label="Career connection">
      <div className="ld-panelTitleRow">
        <h2 className="ld-panelTitle">Career Connection</h2>
      </div>
      <div className="ld-careerCard">
        <span className="ld-careerIcon" aria-hidden="true">
          <BriefcaseIcon size={19} />
        </span>
        <div>
          <p className="ld-careerText">
            See how the skills you're building in Curriculum connect to real career pathways.
          </p>
          <a className="ld-careerLink" href={href.career("/planner")}>
            Explore Career Pathways →
          </a>
        </div>
      </div>
    </section>
  );
}
