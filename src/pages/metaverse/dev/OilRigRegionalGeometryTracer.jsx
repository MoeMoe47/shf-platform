import React, { useRef, useState } from "react";
import { publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";
import { pointerToRegionalScene } from "@/system/metaverse/regionalGeometry/regionalSceneCoordinate.js";
import { createOilRigAssetFamily } from "@/system/metaverse/regionalGeometry/regionalSceneGeometryDraft.js";

function variantAsset(scene, variant) {
  return publicAssetUrl(scene.backgroundAsset?.[`${variant.toLowerCase()}Asset`] || scene.backgroundAsset?.baseAsset);
}

function RegionalGeometryTracerOverlay({ model, onPointer }) {
  const svgRef = useRef(null);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const coordinates = model.draft.geometry.coordinates[0] || [];
  const openCoordinates = coordinates.length > 1 && coordinates[0][0] === coordinates.at(-1)?.[0] && coordinates[0][1] === coordinates.at(-1)?.[1]
    ? coordinates.slice(0, -1)
    : coordinates;

  const readPoint = (event) => pointerToRegionalScene(event, svgRef.current);
  const move = (event) => {
    const point = readPoint(event);
    if (!point) return;
    onPointer(point);
    if (draggingIndex !== null) model.actions.moveVertex(draggingIndex, point);
  };

  return (
    <svg
      ref={svgRef}
      className="met-regional-geometry-tracer"
      data-metaverse-geometry-tracer="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="img"
      aria-label="Oil Rig regional scene Polygon authoring overlay"
      onPointerMove={move}
      onPointerUp={() => setDraggingIndex(null)}
      onPointerLeave={() => setDraggingIndex(null)}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        if (event.target.closest?.("circle")) return;
        const point = readPoint(event);
        if (point) {
          model.actions.addVertex(point);
          onPointer(point);
        }
      }}
    >
      {[0, 25, 50, 75, 100].map((value) => <React.Fragment key={`grid-${value}`}><line x1={value} y1="0" x2={value} y2="100" className="met-regional-geometry-tracer__grid" /><line x1="0" y1={value} x2="100" y2={value} className="met-regional-geometry-tracer__grid" /></React.Fragment>)}
      {openCoordinates.length > 1 ? <polyline points={openCoordinates.map(([x, y]) => `${x},${y}`).join(" ")} className="met-regional-geometry-tracer__line" /> : null}
      {coordinates.length > 3 && coordinates[0][0] === coordinates.at(-1)?.[0] && coordinates[0][1] === coordinates.at(-1)?.[1] ? <polygon points={openCoordinates.map(([x, y]) => `${x},${y}`).join(" ")} className={`met-regional-geometry-tracer__fill ${model.validation.valid ? "is-valid" : "is-invalid"}`} /> : null}
      {openCoordinates.map(([x, y], index) => (
        <circle
          key={`${x}-${y}-${index}`}
          cx={x}
          cy={y}
          r="1.1"
          className={`met-regional-geometry-tracer__vertex ${model.selectedVertexIndex === index ? "is-selected" : ""}`}
          tabIndex="0"
          role="button"
          aria-label={`Vertex ${index + 1}, x ${x.toFixed(2)}, y ${y.toFixed(2)}`}
          onPointerDown={(event) => {
            event.stopPropagation();
            svgRef.current?.setPointerCapture?.(event.pointerId);
            model.setSelectedVertexIndex(index);
            setDraggingIndex(index);
          }}
          onKeyDown={(event) => {
            if (event.key === "Delete" || event.key === "Backspace") model.actions.deleteVertex(index);
          }}
        />
      ))}
    </svg>
  );
}

export default function OilRigRegionalGeometryTracer({ scene, model, renderOverlay = true, renderPanel = true, pointer = null, onPointerChange = () => {} }) {
  const [fileKey, setFileKey] = useState(0);
  const assetFamily = createOilRigAssetFamily();
  const vertices = model.draft.geometry.coordinates[0] || [];
  const closed = vertices.length > 3 && vertices[0][0] === vertices.at(-1)?.[0] && vertices[0][1] === vertices.at(-1)?.[1];
  const importFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => model.actions.importDraft(String(reader.result || ""));
    reader.readAsText(file);
    setFileKey((value) => value + 1);
  };

  return (
    <>
      {renderOverlay ? <RegionalGeometryTracerOverlay model={model} onPointer={onPointerChange} /> : null}
      {renderPanel ? <section className="met-regional-geometry-tracer-panel" data-regional-geometry-tracer-panel="true" aria-labelledby="regional-geometry-tracer-title">
        <div className="met-sidebar__dev-unified-header">
          <h3 id="regional-geometry-tracer-title">Oil Rig Geometry Tracer <span className="met-sidebar__dev-badge">DEV ONLY</span></h3>
          <p>Draft authoring only. No approval or registry write is available.</p>
        </div>
        <label className="met-sidebar__dev-field"><span>Reference variant</span><select value={model.variant} onChange={(event) => model.setVariant(event.target.value)}>{["DAY", "DUSK", "NIGHT"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <p className="met-sidebar__dev-resolved">Asset: {variantAsset(scene, model.variant)}</p>
        <p className="met-sidebar__dev-resolved">Composition: {assetFamily.compositionFamilyId}</p>
        <p className="met-sidebar__dev-resolved">Asset family hash: {assetFamily.assetFamilyHash}</p>
        <p className="met-sidebar__dev-resolved">Alignment: approved within measured tolerance; not pixel identity.</p>
        <p className="met-sidebar__dev-resolved">Pointer: {pointer ? `x ${pointer[0].toFixed(2)} · y ${pointer[1].toFixed(2)} scene units` : "move over the scene"}</p>
        <p className="met-sidebar__dev-resolved">Vertices: {vertices.length}{closed ? " · closed" : " · open"} · {model.validation.valid ? "VALID" : "INVALID"}</p>
        {model.validation.errors.length ? <ul className="met-regional-geometry-tracer__errors">{model.validation.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}
        <div className="met-sidebar__dev-modes" role="group" aria-label="Geometry edit actions">
          <button type="button" onClick={model.actions.closePolygon}>Close Polygon</button>
          <button type="button" onClick={model.actions.undo} disabled={!model.canUndo}>Undo</button>
          <button type="button" onClick={model.actions.redo} disabled={!model.canRedo}>Redo</button>
          <button type="button" onClick={() => { if (!model.unsaved || window.confirm("Discard unsaved draft changes?")) model.actions.reset(); }}>Reset</button>
        </div>
        <div className="met-sidebar__dev-modes" role="group" aria-label="Geometry draft transfer">
          <button type="button" onClick={model.actions.exportDraft}>Export DRAFT</button>
          <label className="met-regional-geometry-tracer__file-button">Import DRAFT/REVIEW<input key={fileKey} type="file" accept="application/json,.json" onChange={importFile} /></label>
        </div>
        {model.approvedPreview ? <div className="met-regional-geometry-tracer__approved"><strong>APPROVED preview is read-only.</strong><button type="button" onClick={model.actions.createDraftFromApproved}>Create new DRAFT</button></div> : null}
        <p className="met-sidebar__dev-resolved">Status: {model.draft.status}{model.unsaved ? " · UNSAVED CHANGES" : ""}</p>
        <p className="met-sidebar__dev-resolved" role="status">{model.statusMessage}</p>
      </section> : null}
    </>
  );
}
