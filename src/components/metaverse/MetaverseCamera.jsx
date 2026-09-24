import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import MetaverseHotspot from "./MetaverseHotspot.jsx";
import {
  METAVERSE_CAMERA_PAN_BOUNDS,
  METAVERSE_SCENE_IMAGE_ASPECT_RATIO,
  computeMetaverseCameraWorldRect,
} from "@/system/metaverse/metaverseCameraProjection.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function useMetaverseCameraContainerSize(containerRef) {
  const [size, setSize] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 720,
  }));

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;
    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [containerRef]);

  return size;
}

export default function MetaverseCamera({
  background,
  camera,
  markers,
  livingCityLayer = null,
  // MET-16A — rendered as the LAST child of .met-camera__markers, i.e. a
  // true sibling of the hotspot markers below (not nested inside
  // livingCityLayer/.met-living-city). .met-hotspot has z-index: 7, and
  // .met-living-city only z-index: 3 — since neither .met-camera__markers
  // nor anything between them establishes its own stacking context, a
  // layer nested inside .met-living-city can never out-stack a hotspot
  // marker no matter its own internal z-index. Only a true sibling here,
  // given its own higher z-index, can sit above markers so Draw/Edit/
  // Occlusion/Perspective clicks reach it even where a marker overlaps the
  // lane being traced. Shares the exact same worldBoxStyle/cameraTransform
  // box as everything else here, so it needs no separate coordinate math.
  authoringOverlay = null,
  selectedId,
  getUnlock,
  onSelectMarker,
  onCameraChange,
  reducedMotion,
}) {
  const containerRef = useRef(null);
  const drag = useRef(null);
  const [dragging, setDragging] = useState(false);
  const containerSize = useMetaverseCameraContainerSize(containerRef);

  const worldRect = useMemo(
    () => computeMetaverseCameraWorldRect({
      containerWidth: containerSize.width,
      containerHeight: containerSize.height,
      aspectRatio: background?.aspectRatio || METAVERSE_SCENE_IMAGE_ASPECT_RATIO,
    }),
    [containerSize.width, containerSize.height, background?.aspectRatio],
  );

  const worldBoxStyle = {
    left: `${worldRect.left}px`,
    top: `${worldRect.top}px`,
    width: `${worldRect.width}px`,
    height: `${worldRect.height}px`,
  };
  const cameraTransform = `translate3d(${camera.x}%, ${camera.y}%, 0) scale(${camera.zoom})`;

  // MET-16C.3 — these bounds must stay the ones
  // metaverseCameraProjection.js's METAVERSE_CAMERA_WORLD_OVERSCAN was
  // derived from (resolveSafeCameraOverscan), or the world box can again
  // fall short of covering the container at the pan clamp limit and
  // expose the shell background as a seam. Import from there rather than
  // hardcoding here so the two can't silently drift apart a second time.
  const updateCamera = (patch) => {
    onCameraChange({
      ...camera,
      ...patch,
      x: clamp(patch.x ?? camera.x, -METAVERSE_CAMERA_PAN_BOUNDS.x, METAVERSE_CAMERA_PAN_BOUNDS.x),
      y: clamp(patch.y ?? camera.y, -METAVERSE_CAMERA_PAN_BOUNDS.y, METAVERSE_CAMERA_PAN_BOUNDS.y),
      zoom: clamp(patch.zoom ?? camera.zoom, 1, 1.8),
    });
  };

  return (
    <div
      ref={containerRef}
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
          ...worldBoxStyle,
          backgroundImage: `url(${background?.url || ""})`,
          backgroundPosition: background?.focalPoint || "center",
          transform: cameraTransform,
        }}
        aria-hidden="true"
      />
      <div
        className="met-camera__markers"
        style={{ ...worldBoxStyle, transform: cameraTransform }}
      >
        {livingCityLayer}
        {markers.map((marker) => (
          <MetaverseHotspot
            key={marker.id}
            item={marker}
            selected={selectedId === marker.id}
            unlock={getUnlock({ id: marker.id, type: marker.markerType })}
            onSelect={onSelectMarker}
          />
        ))}
        {authoringOverlay}
      </div>
    </div>
  );
}
