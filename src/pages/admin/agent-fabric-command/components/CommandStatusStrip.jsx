import React from "react";
import { POSTURE_COPY } from "../commandPresentation.js";
import { PRIORITY_COPY } from "../operationalModel.js";

// Priority filters + global health. Priority counts come from the operational
// model and always state their coverage; a category that cannot be computed
// shows why instead of a number. Health values are real source values or that
// source's state. Only the overall posture is announced, and only on change.
// One line from the probes themselves. Operational means live + ready + not
// degraded; it does not mean verified or approved.
function fabricDetail(posture) {
  if (posture.posture === "OPERATIONAL") return "Live · ready · not degraded";
  if (posture.posture === "CHECKING") return "Checking probes";
  if (!posture.reasons.length) return null;
  return posture.reasons.length > 1 ? `${posture.reasons[0]} (+${posture.reasons.length - 1})` : posture.reasons[0];
}

export default function CommandStatusStrip({ strip, counts, priorityFilter, onFilter, onOpen }) {
  const postureCopy = POSTURE_COPY[strip.posture.posture];
  const [announcement, setAnnouncement] = React.useState("");
  const previous = React.useRef(null);

  React.useEffect(() => {
    const current = strip.posture.posture;
    if (previous.current !== null && previous.current !== current) {
      setAnnouncement(`Agent Fabric posture changed: ${postureCopy.headline}.`);
    }
    previous.current = current;
  }, [strip.posture.posture, postureCopy.headline]);

  return (
    <div className="afcc-strip">
      <section id="afcc-priority" className="afcc-strip-group afcc-strip-group--priority" aria-labelledby="afcc-priority-title" tabIndex={-1}>
        <h2 id="afcc-priority-title" className="afcc-strip-title">Priority</h2>
        <ul className="afcc-priority-list">
          {counts.map((c) => {
            const copy = PRIORITY_COPY[c.category];
            const active = priorityFilter === c.category;
            const unavailable = c.count === null;
            return (
              <li key={c.category}>
                <button
                  type="button"
                  className={`afcc-priority afcc-tone-${copy.tone}${active ? " is-active" : ""}${unavailable ? " is-unavailable" : ""}`}
                  data-priority={c.category}
                  aria-pressed={active}
                  aria-describedby={`afcc-priority-rule-${c.category}`}
                  onClick={() => onFilter(active ? null : c.category)}
                >
                  <span className="afcc-priority-count" data-count={unavailable ? "" : c.count}>
                    {unavailable ? "—" : c.count}
                  </span>
                  <span className="afcc-priority-text">
                    <span className="afcc-priority-name">{copy.label}</span>
                    <span className="afcc-priority-sub">
                      {unavailable ? c.unavailable : `${c.coverage.classified}/${c.coverage.total} sources`}
                    </span>
                  </span>
                </button>
                <span id={`afcc-priority-rule-${c.category}`} className="afcc-sr-only">
                  {copy.rule} {c.detail}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="afcc-strip-group afcc-strip-group--health" aria-labelledby="afcc-health-title">
        <h2 id="afcc-health-title" className="afcc-strip-title">Global health</h2>
        <ul className="afcc-strip-list">
          {strip.items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`afcc-strip-item afcc-tone-${item.tone}`}
                data-strip={item.id}
                onClick={(event) => onOpen(item.drawer, event.currentTarget)}
              >
                <span className="afcc-strip-label">{item.label}</span>
                {item.id === "fabric" ? (
                  <>
                    <span className="afcc-strip-value" data-posture={strip.posture.posture}>
                      <span className="afcc-dot" aria-hidden="true" />
                      Fabric {item.value[0] + item.value.slice(1).toLowerCase()}
                    </span>
                    <span className="afcc-strip-detail" title={fabricDetail(strip.posture) || undefined}>{fabricDetail(strip.posture)}</span>
                  </>
                ) : (
                  <>
                    <span className="afcc-strip-value">{item.value}</span>
                    {item.detail ? <span className="afcc-strip-detail" title={item.detail}>{item.detail}</span> : null}
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <p className="afcc-sr-only" role="status" aria-live="polite">{announcement}</p>
    </div>
  );
}
