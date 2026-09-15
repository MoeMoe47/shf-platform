import React, { useRef, useState } from "react";
import MetaverseHotspot from "./MetaverseHotspot.jsx";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function MetaverseCamera({
  background,
  camera,
  markers,
  selectedId,
  getUnlock,
  onSelectMarker,
  onCameraChange,
  reducedMotion,
}) {
  const drag = useRef(null);
  const [dragging, setDragging] = useState(false);

  const updateCamera = (patch) => {
    onCameraChange({
      ...camera,
      ...patch,
      x: clamp(patch.x ?? camera.x, -22, 22),
      y: clamp(patch.y ?? camera.y, -18, 18),
      zoom: clamp(patch.zoom ?? camera.zoom, 1, 1.8),
    });
  };

  return (
    <div
      className={`met-camera ${dragging ? "is-dragging" : ""}`}
      onPointerDown={(event) => {
        if (event.target.closest("button, a, .met-hotspot")) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, y: event.clientY, cameraX: camera.x, cameraY: camera.y };
        setDragging(true);
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        const dx = ((event.clientX - drag.current.x) / window.innerWidth) * 60;
        const dy = ((event.clientY - drag.current.y) / window.innerHeight) * 60;
        updateCamera({ x: drag.current.cameraX + dx, y: drag.current.cameraY + dy });
      }}
      onPointerUp={() => {
        drag.current = null;
        setDragging(false);
      }}
      onWheel={(event) => {
        event.preventDefault();
        updateCamera({ zoom: camera.zoom + (event.deltaY < 0 ? 0.08 : -0.08) });
      }}
    >
      <div
        className="met-camera__world"
        data-reduced-motion={reducedMotion ? "true" : "false"}
        style={{
          backgroundImage: `url(${background?.url || ""})`,
          backgroundPosition: background?.focalPoint || "center",
          transform: `translate3d(${camera.x}%, ${camera.y}%, 0) scale(${camera.zoom})`,
        }}
        aria-hidden="true"
      />
      <div
        className="met-camera__markers"
        style={{ transform: `translate3d(${camera.x}%, ${camera.y}%, 0) scale(${camera.zoom})` }}
      >
        {markers.map((marker) => (
          <MetaverseHotspot
            key={marker.id}
            item={marker}
            selected={selectedId === marker.id}
            unlock={getUnlock({ id: marker.id, type: marker.markerType })}
            onSelect={onSelectMarker}
          />
        ))}
      </div>
    </div>
  );
}
