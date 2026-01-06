import React from "react";

const KEY = "cur:lessons";

export default function ImportLessonsButton({ onImported }) {
  const inputRef = React.useRef(null);

  function openPicker() {
    inputRef.current?.click();
  }

  async function handleFiles(files) {
    const list = Array.from(files);
    const stored = JSON.parse(localStorage.getItem(KEY) || "[]");
    const added = [];

    for (const f of list) {
      try {
        const text = await f.text();
        const json = JSON.parse(text);
        const id = json.id || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        const title = json.title || json.name || f.name.replace(/\.json$/i,"");
        added.push({ id, title, raw: json });
      } catch (e) {
        console.warn("[ImportLessons] failed to parse", f.name, e);
      }
    }

    if (added.length) {
      const merged = dedupeById([...stored, ...added]);
      localStorage.setItem(KEY, JSON.stringify(merged));
      onImported?.(merged);
    }
  }

  function onChange(e) { handleFiles(e.target.files); e.target.value = ""; }

  function onDrop(e) {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  }

  function onDragOver(e) { e.preventDefault(); }

  return (
    <div onDrop={onDrop} onDragOver={onDragOver} style={{display:"inline-block"}}>
      <button className="btn" onClick={openPicker} title="Import lesson JSON">📥 Import Lessons</button>
      <input ref={inputRef} type="file" accept="application/json" multiple onChange={onChange} hidden />
    </div>
  );
}

function dedupeById(arr) {
  const map = new Map();
  for (const it of arr) map.set(it.id, it);
  return Array.from(map.values());
}
