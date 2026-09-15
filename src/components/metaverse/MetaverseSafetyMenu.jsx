import React, { useId, useState } from "react";

const REPORT_CATEGORIES = [
  { value: "SAFETY_REVIEW", label: "Safety concern" },
  { value: "HARASSMENT", label: "Harassment or bullying" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate content" },
  { value: "SPAM", label: "Spam or flooding" },
];

export default function MetaverseSafetyMenu({ targetUserId, targetLabel, onMute, onBlock, onReport, disabled }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("menu");
  const [category, setCategory] = useState(REPORT_CATEGORIES[0].value);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const menuId = useId();

  if (disabled) return null;

  const reset = () => {
    setOpen(false);
    setMode("menu");
    setComment("");
    setStatus("");
  };

  const runAction = async (action, label) => {
    try {
      await action();
      setStatus(`${label} applied.`);
      setMode("done");
    } catch (error) {
      setStatus(error?.message || `${label} failed.`);
      setMode("done");
    }
  };

  return (
    <div className="met-safety-menu">
      <button
        type="button"
        className="met-safety-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => (open ? reset() : setOpen(true))}
      >
        Safety options for {targetLabel || "participant"}
      </button>
      {open ? (
        <div id={menuId} role="menu" className="met-safety-menu__panel" aria-label={`Safety options for ${targetLabel || "participant"}`}>
          {mode === "menu" ? (
            <>
              <button type="button" role="menuitem" onClick={() => runAction(() => onMute(targetUserId), "Mute")}>
                Mute
              </button>
              <button type="button" role="menuitem" onClick={() => runAction(() => onBlock(targetUserId), "Block")}>
                Block
              </button>
              <button type="button" role="menuitem" onClick={() => setMode("report")}>
                Report
              </button>
              <button type="button" role="menuitem" onClick={reset}>
                Cancel
              </button>
            </>
          ) : null}
          {mode === "report" ? (
            <form
              className="met-safety-menu__report"
              onSubmit={(event) => {
                event.preventDefault();
                runAction(() => onReport({ reported_user_id: targetUserId, category, comment }), "Report");
              }}
            >
              <label htmlFor={`${menuId}-category`}>Reason</label>
              <select id={`${menuId}-category`} value={category} onChange={(event) => setCategory(event.target.value)}>
                {REPORT_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <label htmlFor={`${menuId}-comment`}>Details (optional)</label>
              <textarea
                id={`${menuId}-comment`}
                value={comment}
                maxLength={500}
                onChange={(event) => setComment(event.target.value)}
              />
              <div className="met-safety-menu__report-actions">
                <button type="submit">Submit report</button>
                <button type="button" onClick={() => setMode("menu")}>Back</button>
              </div>
            </form>
          ) : null}
          {mode === "done" ? (
            <p role="status" aria-live="polite" className="met-safety-menu__status">
              {status}
              <button type="button" onClick={reset}>Close</button>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
