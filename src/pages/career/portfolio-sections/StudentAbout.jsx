// src/pages/career/portfolio-sections/StudentAbout.jsx
//
// Student-authored Portfolio introduction. This is intentionally separate
// from verified evidence, mastery, credentials, and institutional truth.
import React from "react";

export default function StudentAbout({ aboutText = "", onSave }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(aboutText || "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setDraft(aboutText || "");
  }, [aboutText]);

  async function save(event) {
    event.preventDefault();
    const next = draft.trim();
    setSaving(true);
    setError("");
    try {
      await onSave?.({ aboutText: next });
      setEditing(false);
    } catch {
      setError("We could not save your introduction. Verified records were not changed.");
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    setSaving(true);
    setError("");
    try {
      await onSave?.({ aboutText: "" });
      setDraft("");
      setEditing(false);
    } catch {
      setError("We could not remove your introduction. Verified records were not changed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="sp-card sp-section" aria-labelledby="sp-about-h">
      <div className="sp-cardHeadRow">
        <div>
          <p className="sp-eyebrow">Student-authored</p>
          <h2 id="sp-about-h" className="sp-cardTitle">About Me</h2>
        </div>
        <button type="button" className="sp-viewLink" onClick={() => setEditing((value) => !value)}>
          {editing ? "Close" : aboutText ? "Edit" : "Add intro"}
        </button>
      </div>

      <p className="sp-note">
        This introduction is written by the student and is not a verified institutional record.
      </p>

      {editing ? (
        <form className="sp-profileForm" onSubmit={save}>
          <label htmlFor="sp-student-intro">Student introduction</label>
          <textarea
            id="sp-student-intro"
            className="sp-notesInput"
            maxLength={1200}
            rows={5}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a short introduction about your interests, goals, and the work you want reviewers to understand."
          />
          <div className="portfolio-v1-actions">
            <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save introduction"}</button>
            <button type="button" className="portfolio-v1-secondary" onClick={() => { setDraft(aboutText || ""); setEditing(false); }}>Cancel</button>
            {aboutText && <button type="button" className="portfolio-v1-linkButton" onClick={clear} disabled={saving}>Remove intro</button>}
          </div>
          {error && <p className="portfolio-v1-error" role="alert">{error}</p>}
        </form>
      ) : aboutText ? (
        <p className="sp-aboutText">{aboutText}</p>
      ) : (
        <p className="sp-cardEmpty">No student introduction has been added yet.</p>
      )}
    </section>
  );
}
