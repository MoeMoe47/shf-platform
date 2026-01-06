// src/components/CommandPalette.jsx
import React from "react";
import PropTypes from "prop-types";

export default function CommandPalette({
  open,
  onClose,
  items = [],
  onSelect,
  placeholder = "Search commands…",
}) {
  const inputRef = React.useRef(null);
  const listRef = React.useRef(null);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);

  // Focus input when opened
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      setQuery("");
      setActive(0);
    };
  }, [open, onClose]);

  // Filter items by label or keywords
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const label = (it.label || "").toLowerCase();
      const kws = Array.isArray(it.keywords) ? it.keywords.join(" ").toLowerCase() : "";
      return label.includes(q) || kws.includes(q);
    });
  }, [items, query]);

  // Keep active index valid if filter size changes
  React.useEffect(() => {
    if (active >= filtered.length) setActive(Math.max(0, filtered.length - 1));
  }, [filtered.length, active]);

  // Scroll active item into view
  React.useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const listId = "kp-listbox";
  const activeId = `kp-opt-${active}`;

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[active];
      if (it) {
        onSelect?.(it);
        onClose?.();
      }
    }
  }

  function clickScrim(e) {
    // Close only if the user clicks outside the panel
    if (e.target === e.currentTarget) onClose?.();
  }

  return (
    <div
      className="kp-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kp-title"
      onMouseDown={clickScrim}
    >
      <div className="kp-wrap" role="document">
        <div className="kp-search">
          <span className="kp-ico" aria-hidden>⌘K</span>
          <input
            ref={inputRef}
            className="kp-input"
            type="text"
            placeholder={placeholder}
            aria-label="Search commands"
            role="combobox"
            aria-controls={listId}
            aria-expanded="true"
            aria-activedescendant={filtered.length ? activeId : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="kp-close" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <ul
          id={listId}
          ref={listRef}
          className="kp-list"
          role="listbox"
          aria-label="Command results"
        >
          {filtered.length === 0 && (
            <li className="kp-empty" aria-live="polite">No commands found.</li>
          )}
          {filtered.map((it, i) => {
            const isActive = i === active;
            return (
              <li
                key={it.key || it.label || i}
                id={isActive ? activeId : undefined}
                data-idx={i}
                className={`kp-item${isActive ? " is-active" : ""}`}
                role="option"
                aria-selected={isActive}
                tabIndex={-1}
                onMouseEnter={() => setActive(i)}
                onClick={() => { onSelect?.(it); onClose?.(); }}
                onKeyDown={(e) => (e.key === "Enter" ? (onSelect?.(it), onClose?.()) : null)}
              >
                <span className="kp-label">{it.label}</span>
                {it.kbd && <kbd className="kp-kbd">{it.kbd}</kbd>}
              </li>
            );
          })}
        </ul>

        <div className="kp-help" aria-live="polite">
          <span>Navigate with ↑ ↓, press Enter to run.</span>
          <kbd>Esc</kbd><span> to close</span>
        </div>
      </div>
    </div>
  );
}

CommandPalette.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      kbd: PropTypes.string,
      keywords: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  onSelect: PropTypes.func,
  placeholder: PropTypes.string,
};
