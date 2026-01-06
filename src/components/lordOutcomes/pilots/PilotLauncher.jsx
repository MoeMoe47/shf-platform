import React from "react";

export default function PilotLauncher() {
  const [pilotName, setPilotName] = React.useState("Outcome Pilot v1");
  const [region, setRegion] = React.useState("Franklin County, OH");
  const [program, setProgram] = React.useState("Workforce Readiness");
  const [metricPack, setMetricPack] = React.useState("Placement + Retention");
  const [notes, setNotes] = React.useState("");

  const packet = React.useMemo(
    () => ({
      type: "pilot_packet",
      name: pilotName,
      region,
      program,
      metricPack,
      notes,
      createdAt: new Date().toISOString(),
      // future: wire this to layers/outcomes engine
      outputs: {
        snapshotCadence: "weekly",
        auditReady: true,
        evidenceArtifacts: ["attendance", "completion", "placement", "retention"],
      },
    }),
    [pilotName, region, program, metricPack, notes]
  );

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(packet, null, 2));
      alert("Pilot Packet JSON copied.");
    } catch {
      alert("Copy failed. You can manually copy from the panel.");
    }
  }

  return (
    <div className="loo-page">
      <div className="loo-pageHeader">
        <h1 className="loo-h1">Pilot Launchpad</h1>
        <p className="loo-sub">
          Configure a pilot packet for launch, reporting, and outcome tracking.
        </p>
      </div>

      <div className="loo-grid2">
        <div className="loo-card">
          <div className="loo-cardTitle">Pilot Setup</div>

          <label className="loo-label">
            Pilot Name
            <input className="loo-input" value={pilotName} onChange={(e) => setPilotName(e.target.value)} />
          </label>

          <label className="loo-label">
            Region / County
            <input className="loo-input" value={region} onChange={(e) => setRegion(e.target.value)} />
          </label>

          <label className="loo-label">
            Program Category
            <input className="loo-input" value={program} onChange={(e) => setProgram(e.target.value)} />
          </label>

          <label className="loo-label">
            Metrics Pack
            <select className="loo-input" value={metricPack} onChange={(e) => setMetricPack(e.target.value)}>
              <option>Placement + Retention</option>
              <option>Completion + Credential Attainment</option>
              <option>Recidivism Reduction + Stability</option>
              <option>SNAP / Benefits Efficiency + Outcomes</option>
              <option>Employer ROI + Wage Growth</option>
            </select>
          </label>

          <label className="loo-label">
            Notes
            <textarea className="loo-textarea" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <div className="loo-row">
            <button className="loo-btn" type="button" onClick={copyJson}>
              Copy Pilot Packet (JSON)
            </button>
            <button
              className="loo-btnSecondary"
              type="button"
              onClick={() => {
                setPilotName("Outcome Pilot v1");
                setRegion("Franklin County, OH");
                setProgram("Workforce Readiness");
                setMetricPack("Placement + Retention");
                setNotes("");
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="loo-card">
          <div className="loo-cardTitle">Pilot Packet Preview</div>
          <pre className="loo-pre">{JSON.stringify(packet, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
