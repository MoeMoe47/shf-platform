import React from "react";
import { addNote, listNotes, removeNote } from "@/shared/notes/notesStore.js";

/**
 * NotesHighlighter
 * - Wrap your paragraph list with this component to enable:
 *   1) Highlight selection → prompt note → save
 *   2) Display saved notes + remove
 *
 * Props:
 *  lessonId: string
 *  paragraphs: string[] (rendered as <p>)
 */
export default function NotesHighlighter({ lessonId, paragraphs = [] }) {
  const [notes, setNotes] = React.useState(() => listNotes(lessonId));
  React.useEffect(() => {
    const onU = (e) => { if (e?.detail?.lessonId === lessonId) setNotes(listNotes(lessonId)); };
    window.addEventListener("notes:update", onU);
    return () => window.removeEventListener("notes:update", onU);
  }, [lessonId]);

  function handleMouseUp(e) {
    const sel = window.getSelection();
    if (!sel || String(sel).trim().length < 3) return;

    // Find paragraph index under selection
    let p = e.target.closest("p[data-idx]");
    if (!p) return;
    const idx = Number(p.dataset.idx);

    const selectionText = String(sel).trim();
    const note = prompt("Add a quick note for your highlight:", "");
    if (note == null) return;
    addNote(lessonId, idx, selectionText, note);
  }

  return (
    <div onMouseUp={handleMouseUp}>
      {paragraphs.map((p, i) => (
        <p key={i} data-idx={i} style={{ marginTop: 0 }}>
          {p}
        </p>
      ))}

      {notes.length > 0 && (
        <div className="sh-callout sh-callout--example" style={{ marginTop: 12 }}>
          <div className="sh-calloutHead"><span className="sh-calloutIcon">📝</span><strong>Your highlights & notes</strong></div>
          <div className="sh-calloutBody">
            <ul className="sh-list">
              {notes.map(n => (
                <li key={n.id} className="sh-listItem">
                  <div className="sh-listMain">
                    <strong>Para {n.anchorIdx + 1}:</strong> “{n.selectionText}”
                    <div className="sh-listMeta">Note: {n.note}</div>
                  </div>
                  <button className="sh-btn is-ghost" onClick={() => removeNote(lessonId, n.id)}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
