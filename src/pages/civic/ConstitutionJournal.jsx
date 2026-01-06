// src/pages/civic/ConstitutionJournal.jsx
import React from "react";
import MissionLogButtons from "@/components/civic/MissionLogButtons.jsx";

export default function ConstitutionJournal() {
  return (
    <section className="sh-main">
      {/* Header */}
      <header className="sh-card" style={{ marginBottom: 16 }}>
        <div className="sh-cardStripe" />
        <div className="sh-cardBody sh-cardBody--flat">
          <div className="sh-cardHead">
            <div>
              <h1 className="sh-cardTitle">Constitution Journal</h1>
              <p className="sh-muted">
                This is your running journal for{" "}
                <strong>Silicon Heartland’s Student Constitution</strong>.
                Capture issues, amendments, and reflections — then log the
                mission so it shows up in the grant binder as real civic work.
              </p>
            </div>
          </div>

          <div className="sh-grid sh-grid--2" style={{ gap: 16, marginTop: 8 }}>
            {/* Left: guidance */}
            <div className="sh-metaBox">
              <div className="sh-metaLabel">How to use this journal</div>
              <ol className="sh-list" style={{ paddingLeft: 18, marginTop: 6 }}>
                <li>Pick a topic: rights, responsibilities, or community rules.</li>
                <li>Write your draft article or amendment in the editor.</li>
                <li>
                  Summarize what you did and why it matters for{" "}
                  <strong>youth voice + local policy</strong>.
                </li>
                <li>
                  Hit <strong>“Log Constitution Mission”</strong> so the work is
                  saved to the civic ledger for grants and board reports.
                </li>
              </ol>
              <p className="sh-hint" style={{ marginTop: 8 }}>
                Each log becomes proof that students are{" "}
                <strong>analyzing real issues</strong>,{" "}
                <strong>drafting policy language</strong>, and{" "}
                <strong>voting on proposals</strong> — perfect for Title IV, civics,
                and SEL funding narratives.
              </p>
            </div>

            {/* Right: current entry fields */}
            <div className="sh-metaBox">
              <label className="sh-metaLabel">
                Article / Amendment title
                <input
                  className="sh-inputText"
                  placeholder="Example: Student Right to Safe Transportation"
                />
              </label>

              <label className="sh-metaLabel" style={{ marginTop: 8 }}>
                Journal entry
                <textarea
                  className="sh-inputText"
                  rows={8}
                  placeholder="Describe the issue, what should change, and how your article or amendment would work in real life…"
                />
              </label>

              <p className="sh-hint" style={{ marginTop: 6 }}>
                You can copy this into your debate notes, proposal templates, or
                classroom LMS. The <strong>mission log buttons below</strong> are
                what connect this work into the admin grant narrative.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Mission log + grant ledger buttons */}
      <div className="sh-card">
        <div className="sh-cardStripe" />
        <div className="sh-cardBody sh-cardBody--flat">
          <header className="sh-cardHead">
            <div>
              <h2 className="sh-cardTitle">Log this Constitution mission</h2>
              <p className="sh-muted">
                When you finish a journal session, log it here so it becomes part
                of the <strong>AI Civic Log</strong> and the{" "}
                <strong>Master Grant Narrative</strong>.
              </p>
            </div>
          </header>

          <MissionLogButtons
            missionId="constitution-journal"
            missionTitle="Student Constitution Journal Mission"
            chapter="Student Constitution"
            defaultDuration={45}
            defaultSummary=""
            defaultOutcome=""
          />

          <p className="sh-hint" style={{ marginTop: 10 }}>
            These entries will sync with the{" "}
            <strong>Admin Tool Dashboard</strong> when you click{" "}
            <em>“Sync with Civic &amp; Update Master Narrative”</em>, so the
            Foundation and Solutions apps are always telling{" "}
            <strong>one unified story</strong> to funders and partners.
          </p>
        </div>
      </div>
    </section>
  );
}
