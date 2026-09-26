import React from "react";
import { searchEntries } from "../operationalModel.js";

// V1 command palette (⌘K / Ctrl+K). Searches only what this page has loaded and
// the canonical topology: systems, agents, runs, and current alerts. It does
// not query any backend.
export default function CommandSearch({ open, entries, onClose, onChoose }) {
  const inputRef = React.useRef(null);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const results = React.useMemo(() => searchEntries(entries, query), [entries, query]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  React.useEffect(() => { setActive(0); }, [query]);

  if (!open) return null;

  const choose = (entry) => entry && onChoose(entry);

  const onKeyDown = (event) => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); return; }
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); return; }
    if (event.key === "ArrowUp") { event.preventDefault(); setActive((i) => Math.max(i - 1, 0)); return; }
    if (event.key === "Enter") { event.preventDefault(); choose(results[active]); return; }
    if (event.key === "Tab") event.preventDefault(); // focus stays in the palette
  };

  const activeId = results[active] ? `afcc-find-${active}` : undefined;
  return (
    <div className="afcc-drawer-host afcc-find-host">
      <div className="afcc-scrim" onClick={onClose} aria-hidden="true" />
      <div className="afcc-find" role="dialog" aria-modal="true" aria-labelledby="afcc-find-title" onKeyDown={onKeyDown}>
        <h2 id="afcc-find-title" className="afcc-sr-only">Search the Command Center</h2>
        <input
          ref={inputRef}
          className="afcc-find-input"
          type="search"
          role="combobox"
          aria-expanded="true"
          aria-controls="afcc-find-results"
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          placeholder="Search systems, agents, runs, alerts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="afcc-quiet afcc-find-scope">Searches what this page has loaded and the canonical topology. It does not search the backend.</p>
        <ul id="afcc-find-results" className="afcc-find-results" role="listbox" aria-label="Results">
          {results.map((entry, i) => (
            <li
              key={entry.id}
              id={`afcc-find-${i}`}
              role="option"
              aria-selected={i === active}
              className={`afcc-find-option${i === active ? " is-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(entry)}
            >
              <span className="afcc-find-group">{entry.group}</span>
              <span className="afcc-find-label">{entry.label}</span>
              {entry.hint ? <span className="afcc-find-hint">{entry.hint}</span> : null}
            </li>
          ))}
          {!results.length ? <li className="afcc-find-empty" role="option" aria-selected="false" aria-disabled="true">No loaded system, agent, run or alert matches.</li> : null}
        </ul>
        <p className="afcc-sr-only" aria-live="polite">{results.length} result{results.length === 1 ? "" : "s"}</p>
      </div>
    </div>
  );
}
