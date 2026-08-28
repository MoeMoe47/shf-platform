import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  MASTER_UNIVERSE_SCENE_ID,
  UNIVERSE_ASSET_LEDGER,
  UNIVERSE_DESTINATIONS,
  UNIVERSE_STATES,
  getDestinationSceneIdsForState,
  getUniverseDestination,
  getUniverseScene,
} from "@/data/universe/universeWorldCatalog.js";
import "./universe.css";

const MASTER_SCENE = getUniverseScene(MASTER_UNIVERSE_SCENE_ID);
const SELECT_HOLD_MS = 900;
const PHASE_MS = 2100;
const RETURN_MS = 1700;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

function routeFromLocation() {
  const pathname = typeof window === "undefined" ? "/universe" : window.location.pathname;
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  if (parts[0] !== "universe") return { mode: "root" };
  if (parts[1] === "directory") return { mode: "directory" };
  if (parts[1]) return { mode: parts[2] === "enter" ? "interface" : "selected", slug: parts[1] };
  return { mode: "root" };
}

function initialState() {
  const route = routeFromLocation();
  const reducedMotion = prefersReducedMotion();
  const destination = getUniverseDestination(route.slug);

  if (route.mode === "directory") {
    return { mode: UNIVERSE_STATES.CARD_DIRECTORY, selectedSlug: null, hoverSlug: null, phaseSceneIndex: 0, paused: false, reducedMotion, notice: "" };
  }
  if (route.mode === "interface" && destination) {
    return { mode: UNIVERSE_STATES.DESTINATION_INTERFACE, selectedSlug: destination.slug, hoverSlug: null, phaseSceneIndex: 0, paused: false, reducedMotion, notice: "" };
  }
  if (route.mode === "selected" && destination) {
    return { mode: UNIVERSE_STATES.UNIVERSE_PLANET_SELECTED, selectedSlug: destination.slug, hoverSlug: null, phaseSceneIndex: 0, paused: false, reducedMotion, notice: "" };
  }
  if (route.mode !== "root") {
    return { mode: UNIVERSE_STATES.ERROR_FALLBACK, selectedSlug: null, hoverSlug: null, phaseSceneIndex: 0, paused: false, reducedMotion, notice: "Unknown Universe destination." };
  }
  return { mode: reducedMotion ? UNIVERSE_STATES.REDUCED_MOTION : UNIVERSE_STATES.UNIVERSE_IDLE, selectedSlug: null, hoverSlug: null, phaseSceneIndex: 0, paused: false, reducedMotion, notice: "" };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_REDUCED":
      if ([UNIVERSE_STATES.UNIVERSE_IDLE, UNIVERSE_STATES.REDUCED_MOTION].includes(state.mode)) {
        return { ...state, reducedMotion: action.value, mode: action.value ? UNIVERSE_STATES.REDUCED_MOTION : UNIVERSE_STATES.UNIVERSE_IDLE };
      }
      return { ...state, reducedMotion: action.value };
    case "HOVER":
      if (state.selectedSlug || ![UNIVERSE_STATES.UNIVERSE_IDLE, UNIVERSE_STATES.REDUCED_MOTION].includes(state.mode)) return state;
      return { ...state, mode: UNIVERSE_STATES.UNIVERSE_PLANET_HOVER, hoverSlug: action.slug };
    case "CLEAR_HOVER":
      if (state.mode !== UNIVERSE_STATES.UNIVERSE_PLANET_HOVER) return state;
      return { ...state, mode: state.reducedMotion ? UNIVERSE_STATES.REDUCED_MOTION : UNIVERSE_STATES.UNIVERSE_IDLE, hoverSlug: null };
    case "SELECT":
      return { ...state, mode: UNIVERSE_STATES.UNIVERSE_PLANET_SELECTED, selectedSlug: action.slug, hoverSlug: null, phaseSceneIndex: 0, paused: false, notice: "" };
    case "START_BRANCH":
      return { ...state, mode: state.reducedMotion ? UNIVERSE_STATES.DESTINATION_INTERFACE : UNIVERSE_STATES.DESTINATION_APPROACH, phaseSceneIndex: 0, paused: false };
    case "ADVANCE_PHASE": {
      if (state.paused) return state;
      if (state.mode === UNIVERSE_STATES.DESTINATION_APPROACH) {
        const destination = getUniverseDestination(state.selectedSlug);
        const approachCount = destination?.journey.approach.length || 1;
        if (state.phaseSceneIndex + 1 < approachCount) return { ...state, phaseSceneIndex: state.phaseSceneIndex + 1 };
        return { ...state, mode: UNIVERSE_STATES.DESTINATION_GATEWAY, phaseSceneIndex: 0 };
      }
      if (state.mode === UNIVERSE_STATES.DESTINATION_GATEWAY) return { ...state, mode: UNIVERSE_STATES.DESTINATION_ARRIVAL, phaseSceneIndex: 0 };
      if (state.mode === UNIVERSE_STATES.DESTINATION_ARRIVAL) return { ...state, mode: UNIVERSE_STATES.DESTINATION_INTERFACE, phaseSceneIndex: 0 };
      return state;
    }
    case "SKIP_TO_INTERFACE":
      return { ...state, mode: UNIVERSE_STATES.DESTINATION_INTERFACE, phaseSceneIndex: 0, paused: false };
    case "RETURN":
      return { ...state, mode: state.reducedMotion ? UNIVERSE_STATES.UNIVERSE_IDLE : UNIVERSE_STATES.RETURNING_TO_UNIVERSE, phaseSceneIndex: 0, paused: false };
    case "RETURN_COMPLETE":
      return { ...state, mode: state.reducedMotion ? UNIVERSE_STATES.REDUCED_MOTION : UNIVERSE_STATES.UNIVERSE_IDLE, selectedSlug: null, hoverSlug: null, phaseSceneIndex: 0, paused: false, notice: "" };
    case "DIRECTORY":
      return { ...state, mode: UNIVERSE_STATES.CARD_DIRECTORY, hoverSlug: null, paused: false };
    case "UNIVERSE":
      return { ...state, mode: state.reducedMotion ? UNIVERSE_STATES.REDUCED_MOTION : UNIVERSE_STATES.UNIVERSE_IDLE, selectedSlug: null, hoverSlug: null, phaseSceneIndex: 0, paused: false, notice: "" };
    case "PAUSE":
      return { ...state, paused: !state.paused };
    case "ERROR":
      return { ...state, mode: UNIVERSE_STATES.ERROR_FALLBACK, notice: action.notice || "The cinematic media fallback is active." };
    default:
      return state;
  }
}

function pushPath(path) {
  if (typeof window !== "undefined" && window.location.pathname !== path) window.history.pushState({}, "", path);
}

function ease(name, t) {
  if (name === "easeOutCubic") return 1 - Math.pow(1 - t, 3);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(range, t) {
  const [start, end] = range || [0, 0];
  return start + (end - start) * t;
}

function timelineForMode(destination, mode) {
  if (!destination) return null;
  if (mode === UNIVERSE_STATES.UNIVERSE_PLANET_SELECTED) return destination.cameraTimeline.lock;
  if (mode === UNIVERSE_STATES.DESTINATION_APPROACH) return destination.cameraTimeline.approach;
  if (mode === UNIVERSE_STATES.DESTINATION_GATEWAY) return destination.cameraTimeline.gateway;
  if (mode === UNIVERSE_STATES.DESTINATION_ARRIVAL) return destination.cameraTimeline.arrival;
  if (mode === UNIVERSE_STATES.DESTINATION_INTERFACE) return destination.cameraTimeline.interface;
  if (mode === UNIVERSE_STATES.RETURNING_TO_UNIVERSE) return destination.cameraTimeline.return;
  return null;
}

function useScenePreload(sceneIds) {
  useEffect(() => {
    const images = sceneIds.map(getUniverseScene).filter(Boolean).map((scene) => {
      const image = new Image();
      image.decoding = "async";
      image.src = scene.src;
      image.decode?.().catch(() => {});
      return image;
    });
    return () => images.forEach((image) => { image.onload = null; image.onerror = null; });
  }, [sceneIds]);
}

function useImageGeometry(ref, scene = MASTER_SCENE) {
  const [geometry, setGeometry] = useState(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !scene) return undefined;
    const [rawWidth, rawHeight] = scene.pixels.split("x").map(Number);
    const update = () => {
      const rect = element.getBoundingClientRect();
      const scale = Math.min(rect.width / rawWidth, rect.height / rawHeight);
      const renderedWidth = rawWidth * scale;
      const renderedHeight = rawHeight * scale;
      setGeometry({
        left: (rect.width - renderedWidth) / 2,
        top: (rect.height - renderedHeight) / 2,
        width: renderedWidth,
        height: renderedHeight,
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [ref, scene]);

  return geometry;
}

function getBreakpoint() {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (width <= 640 && height >= width) return "portrait";
  if (height <= 480 && width > height) return "landscape";
  if (width <= 1100) return "tablet";
  return "desktop";
}

function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(getBreakpoint);
  useEffect(() => {
    const update = () => setBreakpoint(getBreakpoint());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return breakpoint;
}

function useCameraTimeline(stageRef, { mode, destination, paused, reducedMotion }) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const timeline = timelineForMode(destination, mode);
    let raf = 0;
    let start = performance.now();
    let hiddenAt = 0;
    let starDrift = 0;

    const duration = Math.max(1, reducedMotion ? (timeline?.transitionDuration || 900) * 0.38 : timeline?.transitionDuration || 1000);

    const writeIdle = () => {
      stage.style.setProperty("--camera-x", "0px");
      stage.style.setProperty("--camera-y", "0px");
      stage.style.setProperty("--camera-scale", "1");
      stage.style.setProperty("--camera-rotation", "0deg");
      stage.style.setProperty("--scene-in", "1");
      stage.style.setProperty("--scene-out", "0");
      stage.style.setProperty("--atmosphere-opacity", "0.12");
      stage.dataset.cameraProgress = "0.000";
    };

    if (!timeline) {
      writeIdle();
      return undefined;
    }

    const tick = (now) => {
      if (paused) {
        raf = window.requestAnimationFrame(tick);
        return;
      }

      const raw = Math.min(1, (now - start) / duration);
      const t = ease(timeline.easing, raw);
      const blendStart = timeline.sceneBlendStart ?? 0.1;
      const blendEnd = timeline.sceneBlendEnd ?? 0.8;
      const blend = Math.max(0, Math.min(1, (raw - blendStart) / Math.max(0.01, blendEnd - blendStart)));
      const cameraX = lerp(timeline.cameraX, t);
      const cameraY = lerp(timeline.cameraY, t);
      const cameraScale = lerp(timeline.cameraScale, t);
      const cameraRotation = lerp(timeline.cameraRotation, t);
      const foreground = lerp(timeline.foregroundParallax, t);
      const middle = lerp(timeline.middleParallax, t);
      const background = lerp(timeline.backgroundParallax, t);
      const velocity = lerp(timeline.starVelocity, t);

      starDrift += reducedMotion ? velocity * 0.12 : velocity;
      stage.style.setProperty("--camera-x", `${cameraX}px`);
      stage.style.setProperty("--camera-y", `${cameraY}px`);
      stage.style.setProperty("--camera-scale", String(cameraScale));
      stage.style.setProperty("--camera-rotation", `${cameraRotation}deg`);
      stage.style.setProperty("--scene-in", String(blend));
      stage.style.setProperty("--scene-out", String(1 - blend));
      stage.style.setProperty("--fg-x", `${foreground}px`);
      stage.style.setProperty("--fg-y", `${foreground * 0.35}px`);
      stage.style.setProperty("--mid-x", `${middle}px`);
      stage.style.setProperty("--mid-y", `${middle * 0.22}px`);
      stage.style.setProperty("--bg-x", `${background}px`);
      stage.style.setProperty("--bg-y", `${background * 0.12}px`);
      stage.style.setProperty("--star-drift", `${starDrift}px`);
      stage.style.setProperty("--atmosphere-opacity", String(lerp(timeline.atmosphericOpacity, t)));
      stage.dataset.cameraProgress = raw.toFixed(3);
      stage.dataset.motionPhase = timeline.motionPhase;

      if (raw < 1) raf = window.requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = performance.now();
        window.cancelAnimationFrame(raf);
      } else {
        start += performance.now() - hiddenAt;
        raf = window.requestAnimationFrame(tick);
      }
    };

    raf = window.requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [stageRef, mode, destination, paused, reducedMotion]);
}

function PlanetHitRegion({ destination, geometry, breakpoint, active, onHover, onClear, onSelect }) {
  const point = destination.hitRegions[breakpoint] || destination.hitRegions.desktop;
  const diameter = geometry ? Math.max(44, geometry.width * (point.r / 100) * 2) : 44;
  const left = geometry ? geometry.left + geometry.width * (point.x / 100) - diameter / 2 : 0;
  const top = geometry ? geometry.top + geometry.height * (point.y / 100) - diameter / 2 : 0;

  return (
    <button
      type="button"
      className={`universe-planet-hit ${active ? "is-active" : ""}`}
      style={{ left, top, width: diameter, height: diameter }}
      aria-label={`${destination.fullName}. ${destination.role}`}
      data-destination={destination.slug}
      onFocus={() => onHover(destination.slug)}
      onBlur={onClear}
      onMouseEnter={() => onHover(destination.slug)}
      onMouseLeave={onClear}
      onClick={() => onSelect(destination.slug)}
    >
      <span>{destination.name}</span>
    </button>
  );
}

function PersistentStarField() {
  return (
    <div className="universe-starfield" data-testid="persistent-star-field" aria-hidden="true">
      <span />
    </div>
  );
}

function SceneEnvironment({ scene, destination, layer, mode, onError }) {
  if (!scene) return null;
  const alt = destination
    ? `${destination.fullName}. ${destination.role} ${destination.independence}`
    : "Persistent Silicon Heartland Universe master view with five selectable destination planets.";

  return (
    <img
      className={`universe-environment universe-environment-${layer}`}
      src={scene.src}
      width={scene.pixels.split("x")[0]}
      height={scene.pixels.split("x")[1]}
      alt={alt}
      data-scene={scene.id}
      data-environment-layer={layer}
      data-state={mode}
      style={{ objectPosition: destination?.focus || "50% 50%" }}
      decoding="async"
      fetchPriority={scene.id === MASTER_UNIVERSE_SCENE_ID ? "high" : "auto"}
      onError={onError}
    />
  );
}

function UniverseCameraStage(props) {
  const {
    mode,
    destination,
    hoveredDestination,
    activeDestination,
    activeScene,
    paused,
    reducedMotion,
    children,
    onError,
  } = props;
  const stageRef = useRef(null);
  const [previousScene, setPreviousScene] = useState(null);
  const lastSceneRef = useRef(activeScene);

  useEffect(() => {
    if (!activeScene || lastSceneRef.current?.id === activeScene.id) return undefined;
    setPreviousScene(lastSceneRef.current);
    lastSceneRef.current = activeScene;
    const timeout = window.setTimeout(() => setPreviousScene(null), reducedMotion ? 700 : 2300);
    return () => window.clearTimeout(timeout);
  }, [activeScene, reducedMotion]);

  useCameraTimeline(stageRef, { mode, destination, paused, reducedMotion });

  return (
    <section
      className="universe-stage"
      aria-labelledby="universe-title"
      ref={stageRef}
      data-testid="universe-camera-stage"
      data-camera-stage-id="silicon-heartland-universe-camera-v1"
      data-selected-destination={destination?.slug || ""}
      data-hover-destination={hoveredDestination?.slug || ""}
    >
      <h1 id="universe-title" className="universe-sr-only">Silicon Heartland Universe</h1>
      <PersistentStarField />
      <div className="universe-camera-track" aria-hidden="false">
        {previousScene ? <SceneEnvironment scene={previousScene} destination={destination} layer="previous" mode={mode} onError={onError} /> : null}
        <SceneEnvironment scene={activeScene} destination={destination} layer="current" mode={mode} onError={onError} />
        <div className="universe-atmosphere-layer" aria-hidden="true" />
      </div>
      <div className="universe-foreground-depth" aria-hidden="true" />
      <div className="universe-shade" aria-hidden="true" />
      {children}
      {activeDestination ? <div className="universe-radial-lock" aria-hidden="true" /> : null}
    </section>
  );
}

function Directory({ onStart, onUniverse }) {
  return (
    <section className="universe-directory" aria-label="Universe directory">
      <div className="universe-directory-head">
        <p className="universe-eyebrow">Directory</p>
        <h2>Five independent destinations</h2>
        <button type="button" className="universe-secondary" onClick={onUniverse}>Resume universe</button>
      </div>
      <div className="universe-directory-grid">
        {UNIVERSE_DESTINATIONS.map((destination) => (
          <article key={destination.slug} className="universe-directory-card">
            <p>{destination.name}</p>
            <h3>{destination.fullName}</h3>
            <span>{destination.role}</span>
            <em>{destination.statusLine}</em>
            <button type="button" onClick={() => onStart(destination.slug)}>Open Journey</button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function SiliconHeartlandUniversePage() {
  const [state, dispatch] = useReducer(reducer, null, initialState);
  const liveRef = useRef(null);
  const geometryStageRef = useRef(null);
  const geometry = useImageGeometry(geometryStageRef);
  const breakpoint = useBreakpoint();
  const selectedDestination = getUniverseDestination(state.selectedSlug);
  const hoveredDestination = getUniverseDestination(state.hoverSlug);
  const activeDestination = selectedDestination || hoveredDestination;
  const isUniverseMode = [
    UNIVERSE_STATES.UNIVERSE_IDLE,
    UNIVERSE_STATES.UNIVERSE_PLANET_HOVER,
    UNIVERSE_STATES.UNIVERSE_PLANET_SELECTED,
    UNIVERSE_STATES.REDUCED_MOTION,
    UNIVERSE_STATES.ERROR_FALLBACK,
  ].includes(state.mode);
  const phaseSceneIds = getDestinationSceneIdsForState(selectedDestination, state.mode);
  const activeScene = isUniverseMode || state.mode === UNIVERSE_STATES.CARD_DIRECTORY
    ? MASTER_SCENE
    : getUniverseScene(phaseSceneIds[state.phaseSceneIndex] || phaseSceneIds[0]) || MASTER_SCENE;

  const intentSceneIds = useMemo(() => activeDestination?.sequence.slice(0, 3) || [], [activeDestination]);
  useScenePreload([MASTER_UNIVERSE_SCENE_ID]);
  useScenePreload(intentSceneIds);

  useEffect(() => {
    document.documentElement.setAttribute("data-app", "index");
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => dispatch({ type: "SET_REDUCED", value: !!media?.matches });
    media?.addEventListener?.("change", update);
    return () => media?.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (state.mode !== UNIVERSE_STATES.UNIVERSE_PLANET_SELECTED) return undefined;
    const timer = window.setTimeout(() => dispatch({ type: "START_BRANCH" }), state.reducedMotion ? 180 : SELECT_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [state.mode, state.selectedSlug, state.reducedMotion]);

  useEffect(() => {
    if (![UNIVERSE_STATES.DESTINATION_APPROACH, UNIVERSE_STATES.DESTINATION_GATEWAY, UNIVERSE_STATES.DESTINATION_ARRIVAL].includes(state.mode)) return undefined;
    const timer = window.setTimeout(() => dispatch({ type: "ADVANCE_PHASE" }), state.reducedMotion ? 520 : PHASE_MS);
    return () => window.clearTimeout(timer);
  }, [state.mode, state.phaseSceneIndex, state.paused, state.reducedMotion]);

  useEffect(() => {
    if (state.mode !== UNIVERSE_STATES.RETURNING_TO_UNIVERSE) return undefined;
    const timer = window.setTimeout(() => dispatch({ type: "RETURN_COMPLETE" }), state.reducedMotion ? 320 : RETURN_MS);
    return () => window.clearTimeout(timer);
  }, [state.mode, state.reducedMotion]);

  useEffect(() => {
    const onPop = () => {
      const route = routeFromLocation();
      const destination = getUniverseDestination(route.slug);
      if (route.mode === "directory") dispatch({ type: "DIRECTORY" });
      else if (route.mode === "interface" && destination) dispatch({ type: "SELECT", slug: destination.slug }), dispatch({ type: "SKIP_TO_INTERFACE" });
      else if (route.mode === "selected" && destination) dispatch({ type: "SELECT", slug: destination.slug });
      else dispatch({ type: "UNIVERSE" });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!liveRef.current) return;
    const destinationName = activeDestination?.fullName ? ` ${activeDestination.fullName}` : "";
    liveRef.current.textContent = state.notice || `${state.mode.replaceAll("_", " ").toLowerCase()}${destinationName}`;
  }, [state.mode, state.notice, activeDestination]);

  const hoverDestination = (slug) => dispatch({ type: "HOVER", slug });
  const clearHover = () => dispatch({ type: "CLEAR_HOVER" });
  const selectDestination = (slug) => {
    pushPath(`/universe/${slug}`);
    dispatch({ type: "SELECT", slug });
  };
  const startFromDirectory = (slug) => {
    pushPath(`/universe/${slug}`);
    dispatch({ type: "SELECT", slug });
  };
  const skipToInterface = () => {
    if (selectedDestination) pushPath(`/universe/${selectedDestination.slug}/enter`);
    dispatch({ type: "SKIP_TO_INTERFACE" });
  };
  const returnToUniverse = () => {
    pushPath("/universe");
    dispatch({ type: "RETURN" });
  };
  const openDirectory = () => {
    pushPath("/universe/directory");
    dispatch({ type: "DIRECTORY" });
  };
  const openUniverse = () => {
    pushPath("/universe");
    dispatch({ type: "UNIVERSE" });
  };

  const journeyActive = [
    UNIVERSE_STATES.DESTINATION_APPROACH,
    UNIVERSE_STATES.DESTINATION_GATEWAY,
    UNIVERSE_STATES.DESTINATION_ARRIVAL,
  ].includes(state.mode);
  const interfaceActive = state.mode === UNIVERSE_STATES.DESTINATION_INTERFACE;

  return (
    <main className="universe-root" data-universe-state={state.mode} data-paused={state.paused ? "true" : "false"}>
      <a className="universe-skip-link" href="#universe-directory-button">Skip to Universe controls</a>
      <div className="universe-live" aria-live="polite" ref={liveRef} />

      <div className="universe-geometry-probe" ref={geometryStageRef} aria-hidden="true" />
      <UniverseCameraStage
        mode={state.mode}
        destination={selectedDestination}
        hoveredDestination={hoveredDestination}
        activeDestination={activeDestination}
        activeScene={activeScene}
        paused={state.paused}
        reducedMotion={state.reducedMotion}
        onError={() => dispatch({ type: "ERROR" })}
      >
        <header className="universe-topbar">
          <p>Silicon Heartland Universe</p>
          <button id="universe-directory-button" type="button" onClick={state.mode === UNIVERSE_STATES.CARD_DIRECTORY ? openUniverse : openDirectory}>
            {state.mode === UNIVERSE_STATES.CARD_DIRECTORY ? "Universe" : "Directory"}
          </button>
        </header>

        {isUniverseMode ? (
          <nav className="universe-planet-map" aria-label="Universe destinations">
            {UNIVERSE_DESTINATIONS.map((destination) => (
              <PlanetHitRegion
                key={destination.slug}
                destination={destination}
                geometry={geometry}
                breakpoint={breakpoint}
                active={activeDestination?.slug === destination.slug}
                onHover={hoverDestination}
                onClear={clearHover}
                onSelect={selectDestination}
              />
            ))}
          </nav>
        ) : null}

        {activeDestination && isUniverseMode ? (
          <aside className="universe-planet-card" data-destination={activeDestination.slug}>
            <p>{activeDestination.name}</p>
            <strong>{activeDestination.fullName}</strong>
            <span>{activeDestination.role}</span>
            {state.mode === UNIVERSE_STATES.UNIVERSE_PLANET_SELECTED ? <em>Camera lock established</em> : null}
          </aside>
        ) : null}

        {journeyActive || interfaceActive || state.mode === UNIVERSE_STATES.RETURNING_TO_UNIVERSE ? (
          <section className="universe-journey-controls" aria-label="Journey controls">
            {selectedDestination ? (
              <>
                <p>{selectedDestination.fullName}</p>
                <span>{selectedDestination.statusLine}</span>
              </>
            ) : null}
            {journeyActive ? <button type="button" onClick={skipToInterface}>Skip Journey</button> : null}
            {journeyActive ? <button type="button" onClick={() => dispatch({ type: "PAUSE" })}>{state.paused ? "Resume Motion" : "Pause Motion"}</button> : null}
            {interfaceActive ? (
              selectedDestination?.appHref
                ? <a href={selectedDestination.appHref}>{selectedDestination.primaryAction}</a>
                : <button type="button" disabled>{selectedDestination?.primaryAction} Coming Soon</button>
            ) : null}
            {selectedDestination ? <button type="button" onClick={returnToUniverse}>Return to Universe</button> : null}
          </section>
        ) : null}

        {state.mode === UNIVERSE_STATES.ERROR_FALLBACK ? (
          <section className="universe-fallback">
            <p>{state.notice}</p>
            <button type="button" onClick={openDirectory}>Open directory</button>
          </section>
        ) : null}

        {state.mode === UNIVERSE_STATES.CARD_DIRECTORY ? <Directory onStart={startFromDirectory} onUniverse={openUniverse} /> : null}
      </UniverseCameraStage>

      <div className="universe-asset-count" aria-hidden="true" data-scenes={UNIVERSE_ASSET_LEDGER.length} />
    </main>
  );
}
