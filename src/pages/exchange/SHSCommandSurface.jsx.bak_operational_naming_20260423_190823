import React, { useEffect, useMemo, useState } from "react";
import "./command-surface/shs-command-surface.css";

function Panel({ title, children, className = "" }) {
  return (
    <section className={`mock-panel ${className}`.trim()}>
      <div className="mock-panel__title">{title}</div>
      <div className="mock-panel__body">{children}</div>
    </section>
  );
}

function BulletList({ items = [] }) {
  return (
    <div className="mock-list">
      {items.map((item, i) => (
        <div key={`${item}-${i}`} className="mock-list__row">
          <span className="mock-list__dot" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function pickVersion(value) {
  if (!value) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    return value.version || value.label || value.reason || JSON.stringify(value);
  }
  return String(value);
}

function pickText(value, fallback = "—") {
  if (value == null) return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    return value.label || value.reason || value.version || JSON.stringify(value);
  }
  return fallback;
}

export default function SHSCommandSurface() {
  const [lifecycle, setLifecycle] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8090/lifecycle/state")
      .then((res) => res.json())
      .then(setLifecycle)
      .catch(() => {
        setLifecycle(null);
      });
  }, []);

  const normalized = useMemo(() => {
    const stableRaw = lifecycle?.stable_version ?? lifecycle?.stable;
    const candidateRaw = lifecycle?.candidate_version ?? lifecycle?.candidate;

    const stableVersion = pickVersion(stableRaw);
    const candidateVersion = pickVersion(candidateRaw);
    const candidateState = pickText(lifecycle?.candidate_state ?? lifecycle?.status, "evaluating");
    const mode = pickText(lifecycle?.mode ?? lifecycle?.evaluation_mode, "loading...");

    return {
      mode,
      stableVersion,
      candidateVersion,
      candidateState,
    };
  }, [lifecycle]);

  return (
    <div className="mock-shell mock-shell--tone-blue">
      <div className="mock-ambient" aria-hidden="true">
        <div className="mock-ambient__drift" />
        <div className="mock-ambient__grid" />
        <div className="mock-ambient__flow" />
        <div className="mock-ambient__pulse" />
      </div>

      <header className="mock-topbar">
        <div className="mock-brand">
          <div className="mock-brand__logo">SHS</div>
          <div className="mock-brand__copy">
            <div className="mock-brand__title">SHS Exchange Command</div>
            <div className="mock-brand__sub">Outcome Monitoring and Response Surface</div>
          </div>
        </div>

        <div className="mock-topbar__center">
          <span className="mock-badge mock-badge--live">
            <span className="mock-badge__dot" />
            <span className="mock-badge__text">System Active</span>
            <span className="mock-badge__age">Live</span>
          </span>
          <span className="mock-topbar__divider" />
          <span>Exchange Network Secure</span>
          <span className="mock-topbar__divider" />
          <span>Mode: Operations</span>
        </div>

        <div className="mock-topbar__right">
          <button className="mock-iconBtn" aria-label="alerts">•</button>
          <button className="mock-iconBtn" aria-label="menu">•</button>
        </div>
      </header>

      <section className="mock-priority">
        <div className="mock-priority__left">
          <div className="mock-priority__eyebrow">Current Priority</div>
          <h1 className="mock-priority__title">Chicago Placement Risk Spike</h1>
          <p className="mock-priority__summary">
            Credential-to-placement conversion dropped below threshold.
            Recommended next move: open investigation.
          </p>

          <div className="mock-priority__actions">
            <button className="mock-btn mock-btn--primary">Investigate</button>
            <button className="mock-btn">Monitor</button>
          </div>
        </div>

        <div className="mock-priority__right">
          <div className="mock-statBlock">
            <span className="mock-statBlock__label">Severity</span>
            <span className="mock-statBlock__value mock-statBlock__value--amber">Elevated</span>
          </div>
          <div className="mock-statBlock">
            <span className="mock-statBlock__label">Confidence</span>
            <span className="mock-statBlock__value">82%</span>
          </div>
          <div className="mock-statBlock">
            <span className="mock-statBlock__label">Urgency</span>
            <span className="mock-statBlock__value mock-statBlock__value--red">High</span>
          </div>
        </div>
      </section>

      <section className="mock-main">
        <aside className="mock-rail mock-rail--left">
          <Panel title="Adaptive Decision System">
            <BulletList
              items={[
                `Mode: ${normalized.mode}`,
                `Stable: ${normalized.stableVersion}`,
                `Candidate: ${normalized.candidateVersion}`,
                `Candidate State: ${normalized.candidateState}`,
                `Comparison: temporarily disabled until endpoint payload is wired`,
              ]}
            />
          </Panel>

          <Panel title="System State">
            <BulletList
              items={[
                "Stable Systems: 18",
                "Monitoring: 07",
                "Elevated: 03",
                "Critical: 01",
              ]}
            />
          </Panel>

          <Panel title="Regional Outcome Signals">
            <BulletList
              items={[
                "Midwest Placement Risk",
                "Southern Capacity Overload",
                "Western Verification Delay",
                "East Coast Demand Spike",
              ]}
            />
          </Panel>
        </aside>

        <main className="mock-center">
          <Panel title="Tactical Map Stage">
            <div>Exchange command surface baseline is live.</div>
          </Panel>
        </main>

        <aside className="mock-rail mock-rail--right">
          <Panel title="Recommended Action">
            <div className="mock-actionCard">
              <div className="mock-actionCard__title">Open Investigation</div>
              <div className="mock-actionCard__text">
                Severity increased while confidence remains above threshold.
              </div>
              <div className="mock-actionCard__meta">
                Comparison panel will be re-enabled after endpoint payload wiring.
              </div>
            </div>
          </Panel>

          <Panel title="Decision Controls">
            <div className="mock-buttonGrid">
              <button className="mock-btn mock-btn--primary">Investigate</button>
              <button className="mock-btn">Assign</button>
              <button className="mock-btn">Escalate</button>
              <button className="mock-btn">Monitor</button>
            </div>
          </Panel>

          <Panel title="Active Workflows">
            <BulletList
              items={[
                "Outcome Verification Queue",
                "Employer Routing Workflow",
                "Capacity Reallocation",
                "Midwest Follow-Up Sequence",
              ]}
            />
          </Panel>
        </aside>
      </section>

      <section className="mock-bottom">
        <Panel title="Outcome Event Log">
          <BulletList
            items={[
              "Chicago placement risk spike detected",
              "Midwest verifier queue exceeded threshold",
              "Route reassigned to regional team",
            ]}
          />
        </Panel>

        <Panel title="Capacity Status">
          <BulletList
            items={[
              "Available Reviewers: 23",
              "Verifier Capacity: 91%",
              "Active Workflows: 12",
            ]}
          />
        </Panel>

        <Panel title="Situation Summary">
          <BulletList
            items={[
              "Active Signals: 11",
              "High Priority: 3",
              "Resolved 24h: 17",
            ]}
          />
        </Panel>
      </section>
    </div>
  );
}
