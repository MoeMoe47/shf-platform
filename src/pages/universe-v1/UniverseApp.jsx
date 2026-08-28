// src/pages/universe-v1/UniverseApp.jsx
// ------------------------------------------------------------
// Ported from the approved reference implementation, behavior and
// visuals preserved verbatim:
//   /Users/mikeslate/Desktop/silicon-heartland-universe-3d/browser-preview/
//   shu-cinematic-browser-preview-v1/src/main.jsx
//
// Mounted from two entry points (src/entries/index.main.jsx for the site
// root, src/entries/universe.main.jsx for /universe.html) — same
// component, same source, so there is exactly one canonical
// implementation regardless of which URL reaches it. See
// docs/architecture/universe/SILICON_HEARTLAND_UNIVERSE_CANONICAL_LANDING_V1.md.
//
// Edits made during the port, each strictly required for routing/
// integration, none visual or interaction-affecting:
//   1. Import paths updated for this repository's file layout.
//   2. The three `destination.destinationType === 'independent-local-app'`
//      checks (deciding "use a real browser navigation, not the SPA's
//      own client-side pushState") now call the registry's
//      `needsHardNavigation()` helper, so the newly-introduced
//      'same-origin-app' destinations (BOS, SHF — now served by this
//      same app instead of a separate origin) also get a real
//      navigation. See universeDestinationRegistry.js's header comment
//      for why.
//   3. `createRoot(...).render(...)` removed from this module — it now
//      exports the App component; each entry file owns its own mount.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { destinations } from './destinations.js';
import { deepStarMap2020Config, selectDeepStarMapDerivative } from './environment/deepStarMap2020Config.js';
import {
  CANONICAL_UNIVERSE_ROUTE,
  RETURN_TO_UNIVERSE_LABEL,
  V1_LAB_ROUTE,
  V2_LAB_ROUTE,
  UNIVERSE_DIRECTORY_ROUTE,
  isDestinationAvailable,
  needsHardNavigation,
  resolveDestinationHref,
  universeV1BlackIvoryMaster,
} from './universeDestinationRegistry.js';
import UniverseGateway from './gateway/UniverseGateway.jsx';
import './universe-v1.css';

const INTRO_KEY = 'shu-preview-v1-intro-complete';
const MODE_KEY = 'shu-preview-v1-mode';
const ATMOSPHERE_SEED = 41027;

const starZones = [
  { x: [18, 31], y: [8, 20] },
  { x: [39, 52], y: [8, 34] },
  { x: [54, 83], y: [33, 53] },
  { x: [9, 40], y: [50, 78] },
];

const dustZones = [
  { x: [78, 98], y: [7, 34] },
  { x: [65, 91], y: [22, 49] },
  { x: [46, 72], y: [35, 58] },
];

function seededUnit(seed) {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function makeAtmosphereItems(count, zones, kind) {
  return Array.from({ length: count }, (_, index) => {
    const zone = zones[index % zones.length];
    const base = ATMOSPHERE_SEED + index * 43 + (kind === 'dust' ? 701 : 0);
    const depth = index % 3;
    const hero = kind === 'star' && index % 7 === 2;
    const near = kind === 'dust' && index % 8 === 3;
    const x = zone.x[0] + seededUnit(base + 1) * (zone.x[1] - zone.x[0]);
    const y = zone.y[0] + seededUnit(base + 2) * (zone.y[1] - zone.y[0]);
    if (kind === 'dust') {
      return {
        id: `dust-${index}`,
        depth: near ? 'near' : depth === 1 ? 'mid' : 'far',
        x,
        y,
        size: near ? 4.4 + seededUnit(base + 3) * 2.4 : 1.6 + depth * 1.1 + seededUnit(base + 3) * 1.6,
        opacity: near ? 0.28 + seededUnit(base + 4) * 0.24 : 0.18 + depth * 0.06 + seededUnit(base + 4) * 0.24,
        blur: near ? 2.4 + seededUnit(base + 9) * 2.2 : 0.2 + depth * 0.8,
        driftX: -(9 + seededUnit(base + 5) * (near ? 9 : depth === 1 ? 7 : 5)),
        driftY: 4 + seededUnit(base + 6) * (near ? 6 : depth === 1 ? 5 : 4),
        duration: near
          ? 28 + seededUnit(base + 7) * 17
          : depth === 1
            ? 38 + seededUnit(base + 7) * 27
            : 55 + seededUnit(base + 7) * 35,
        delay: near
          ? -(seededUnit(base + 8) * 45)
          : depth === 1
            ? -(seededUnit(base + 8) * 65)
            : -(seededUnit(base + 8) * 90),
      };
    }
    return {
      id: `star-${index}`,
      depth: hero ? 'hero' : depth === 1 ? 'mid' : 'background',
      x,
      y,
      size: hero ? 2.5 + seededUnit(base + 3) * 1 : 1.2 + depth * 0.62 + seededUnit(base + 3) * 0.75,
      opacity: hero ? 0.46 + seededUnit(base + 4) * 0.22 : 0.28 + depth * 0.06 + seededUnit(base + 4) * 0.24,
      duration: 2.8 + seededUnit(base + 5) * 4.7,
      delay: -(seededUnit(base + 6) * 7.5),
      blur: hero ? 0.35 : depth === 2 ? 0.18 : 0,
    };
  });
}

const atmosphereStars = makeAtmosphereItems(36, starZones, 'star');
const atmosphereDust = makeAtmosphereItems(30, dustZones, 'dust');

function useRoute() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = (next, options = {}) => {
    if (options.replace) window.history.replaceState({}, '', next);
    else window.history.pushState({}, '', next);
    setPath(next);
  };
  return [path, navigate];
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function useRouteImagePreload(path) {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = universeV1BlackIvoryMaster.source;
    link.dataset.shuRoutePreload = 'true';
    document.head.appendChild(link);
    return () => link.remove();
  }, [path]);
}

function Intro({ reducedMotion, onDone }) {
  const [skip, setSkip] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => {
      sessionStorage.setItem(INTRO_KEY, '1');
      onDone();
    }, reducedMotion || skip ? 250 : 4800);
    return () => window.clearTimeout(t);
  }, [onDone, reducedMotion, skip]);

  return (
    <div className="intro" aria-live="polite">
      <div className="intro-inner">
        <p>Preparing Silicon Heartland Universe</p>
        <div className="progress" aria-hidden="true"><span /></div>
        <button type="button" onClick={() => setSkip(true)}>Skip intro</button>
      </div>
    </div>
  );
}

function StarField({ reducedMotion, paused }) {
  const [star, setStar] = useState(null);
  useEffect(() => {
    if (reducedMotion || paused) return undefined;
    let timeout;
    const schedule = () => {
      timeout = window.setTimeout(() => {
        setStar({
          top: 12 + Math.random() * 32,
          left: 12 + Math.random() * 52,
          angle: -18 - Math.random() * 14,
        });
        window.setTimeout(() => setStar(null), 950);
        schedule();
      }, 45000 + Math.random() * 30000);
    };
    schedule();
    return () => window.clearTimeout(timeout);
  }, [paused, reducedMotion]);
  return (
    <div className="star-layer" aria-hidden="true">
      <i className="star s1" /><i className="star s2" /><i className="star s3" /><i className="star s4" />
      {star && <i className="shooting-star" style={{ top: `${star.top}%`, left: `${star.left}%`, rotate: `${star.angle}deg` }} />}
    </div>
  );
}

function SceneTarget({ destination, focused, geometry, onSelect }) {
  if (!geometry) return null;
  const size = Math.max(44, Math.round(destination.radius * Math.min(geometry.width, geometry.height)));
  const left = geometry.left + destination.x * geometry.width;
  const top = geometry.top + destination.y * geometry.height;
  return (
    <button
      className={`scene-target ${focused ? 'is-focused' : ''}`}
      type="button"
      data-target-id={destination.id}
      data-target-x={destination.x}
      data-target-y={destination.y}
      style={{ left: `${left}px`, top: `${top}px`, width: `${size}px`, height: `${size}px` }}
      aria-label={`${destination.label} - ${destination.title}`}
      aria-pressed={focused}
      onClick={() => onSelect(destination)}
    >
      <span>{destination.label}</span>
    </button>
  );
}

function useSceneGeometry(ref) {
  const [geometry, setGeometry] = useState(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const update = () => {
      const rect = element.getBoundingClientRect();
      const scale = Math.max(rect.width / universeV1BlackIvoryMaster.sourceDimensions.width, rect.height / universeV1BlackIvoryMaster.sourceDimensions.height);
      const width = universeV1BlackIvoryMaster.sourceDimensions.width * scale;
      const height = universeV1BlackIvoryMaster.sourceDimensions.height * scale;
      setGeometry({
        left: (rect.width - width) / 2,
        top: (rect.height - height) / 2,
        width,
        height,
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [ref]);

  return geometry;
}

function useContainedImageGeometry(ref, sourceDimensions = universeV1BlackIvoryMaster.sourceDimensions) {
  const [geometry, setGeometry] = useState(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const update = () => {
      const rect = element.getBoundingClientRect();
      const scale = Math.min(rect.width / sourceDimensions.width, rect.height / sourceDimensions.height);
      const width = sourceDimensions.width * scale;
      const height = sourceDimensions.height * scale;
      setGeometry({
        left: (rect.width - width) / 2,
        top: (rect.height - height) / 2,
        width,
        height,
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [ref, sourceDimensions.height, sourceDimensions.width]);

  return geometry;
}

// Exported (additive only — behavior/markup unchanged) so the new
// Planetary Gateway (gateway/UniverseGateway.jsx) can reuse the exact same
// available/hard-navigation/unavailable control instead of re-implementing
// it a second time.
export function DestinationEnterControl({ destination, onEnterDestination }) {
  if (!isDestinationAvailable(destination)) {
    return <button type="button" disabled>Unavailable</button>;
  }

  const href = resolveDestinationHref(destination);
  const label = destination.entryActionLabel ?? 'Enter';
  if (needsHardNavigation(destination)) {
    return <a className="button-link" href={href} aria-label={destination.accessibilityLabel}>{label}</a>;
  }

  return <button type="button" onClick={() => onEnterDestination(destination)}>{label}</button>;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getPreviewPosition(destination, geometry) {
  if (!geometry || typeof window === 'undefined') return {};
  if (window.innerWidth < 720) {
    return {
      left: '14px',
      right: '14px',
      bottom: '78px',
      top: 'auto',
    };
  }

  const panelWidth = 340;
  const panelHeight = 210;
  const pointX = geometry.left + destination.x * geometry.width;
  const pointY = geometry.top + destination.y * geometry.height;
  const offsetX = destination.x > 0.58 ? -(panelWidth + 34) : 34;
  const offsetY = destination.y > 0.58 ? -(panelHeight - 12) : 42;
  return {
    left: `${clamp(pointX + offsetX, 16, window.innerWidth - panelWidth - 16)}px`,
    top: `${clamp(pointY + offsetY, 76, window.innerHeight - panelHeight - 24)}px`,
    right: 'auto',
    bottom: 'auto',
  };
}

function getTargetPlacement(destination) {
  const horizontal = destination.x > 0.62 ? 'label-left' : destination.x < 0.22 ? 'label-right' : 'label-center';
  const vertical = destination.y > 0.56 ? 'label-above' : 'label-below';
  return `${horizontal} ${vertical}`;
}

function CardMode({ open, onClose, onFocusDestination, onEnterDestination }) {
  if (!open) return null;
  return (
    <div className="card-mode" role="dialog" aria-modal="true" aria-label="Card Mode destinations">
      <div className="card-mode-head">
        <p>Card Mode</p>
        <button type="button" onClick={onClose}>Close</button>
      </div>
      <div className="destination-grid">
        {destinations.map((item) => (
          <article className="destination-card" key={item.id}>
            <p>{item.label}</p>
            <h2>{item.title}</h2>
            <span>{item.description}</span>
            {!isDestinationAvailable(item) && <small>Planned destination unavailable in this preview.</small>}
            <div className="card-actions">
              <button type="button" onClick={() => onFocusDestination(item)} disabled={!item.sceneAvailable}>
                Focus
              </button>
              <DestinationEnterControl destination={item} onEnterDestination={onEnterDestination} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function InfoPanel({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="info-panel" role="dialog" aria-modal="false" aria-label="Prototype information">
      <button type="button" onClick={onClose}>Close</button>
      <p>Cinematic Browser Prototype V1 - Static Render Foundation - Real-Time 3D Not Yet Integrated</p>
      <span>Source: {universeV1BlackIvoryMaster.status}. Not final Sun certification evidence.</span>
    </div>
  );
}

function V1LabTarget({ destination, geometry, debug, previewed, onPreview }) {
  if (!geometry) return null;
  const size = Math.max(44, Math.round(destination.radius * Math.min(geometry.width, geometry.height)));
  const left = geometry.left + destination.x * geometry.width;
  const top = geometry.top + destination.y * geometry.height;
  const placement = getTargetPlacement(destination);
  const openPreview = (event) => {
    event.preventDefault();
    onPreview(destination, event.currentTarget);
  };
  return (
    <button
      className={`v1-lab-target ${placement} ${previewed ? 'is-previewed' : ''}`}
      type="button"
      data-target-id={destination.id}
      data-target-x={destination.x}
      data-target-y={destination.y}
      data-debug-visible={debug ? 'true' : 'false'}
      style={{ left: `${left}px`, top: `${top}px`, width: `${size}px`, height: `${size}px` }}
      aria-label={`${destination.label} - ${destination.title}`}
      aria-expanded={previewed}
      onClick={openPreview}
    >
      <span className="planet-halo" aria-hidden="true" />
      <span className="planet-label" aria-hidden="true">{destination.label}</span>
    </button>
  );
}

function V1DestinationPreview({ destination, style, onEnter, onBack }) {
  const available = isDestinationAvailable(destination);
  return (
    <aside className="v1-selection-panel" aria-live="polite" data-destination-id={destination.id} style={style}>
      <p>{destination.label}</p>
      <h2>{destination.title}</h2>
      <span>{destination.description}</span>
      <strong>{available ? 'AVAILABLE DESTINATION' : 'DESTINATION IN DEVELOPMENT'}</strong>
      <div>
        {available ? (
          <button type="button" onClick={() => onEnter(destination)}>ENTER</button>
        ) : (
          <span className="inactive-enter" aria-disabled="true">DESTINATION IN DEVELOPMENT</span>
        )}
        <button type="button" onClick={onBack}>BACK</button>
      </div>
    </aside>
  );
}

function useV1MotionPause() {
  const [paused, setPaused] = useState(() => document.hidden);

  useEffect(() => {
    const update = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return paused;
}

function V1AtmosphereLayer() {
  return (
    <div className="v1-atmosphere-frame" aria-hidden="true" role="presentation">
      <div className="v1-atmosphere-layer v1-star-twinkle-layer" aria-hidden="true" role="presentation">
        {atmosphereStars.map((item, index) => (
          <i
            className={`v1-atmosphere-item v1-star-twinkle is-${item.depth}`}
            key={item.id}
            data-atmosphere-kind="star"
            data-atmosphere-index={index}
            style={{
              '--x': `${item.x}%`,
              '--y': `${item.y}%`,
              '--size': `${item.size}px`,
              '--base-opacity': item.opacity,
              '--duration': `${item.duration}s`,
              '--delay': `${item.delay}s`,
              '--blur': `${item.blur}px`,
            }}
          />
        ))}
      </div>
      <div className="v1-atmosphere-layer v1-solar-dust-layer" aria-hidden="true" role="presentation">
        {atmosphereDust.map((item, index) => (
          <i
            className={`v1-atmosphere-item v1-solar-dust is-${item.depth}`}
            key={item.id}
            data-atmosphere-kind="dust"
            data-atmosphere-index={index}
            style={{
              '--x': `${item.x}%`,
              '--y': `${item.y}%`,
              '--size': `${item.size}px`,
              '--base-opacity': item.opacity,
              '--drift-x': `${item.driftX}vw`,
              '--drift-y': `${item.driftY}vh`,
              '--duration': `${item.duration}s`,
              '--delay': `${item.delay}s`,
              '--blur': `${item.blur}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function UniverseV1Lab({ navigate }) {
  const [previewed, setPreviewed] = useState(null);
  const stageRef = useRef(null);
  const previewOriginRef = useRef(null);
  const imageGeometry = useContainedImageGeometry(stageRef, universeV1BlackIvoryMaster.sourceDimensions);
  const visibleTargets = destinations.filter((d) => d.sceneAvailable);
  const selected = useMemo(() => destinations.find((d) => d.id === previewed), [previewed]);
  const debug = getParam('debugHitRegions') === '1';
  const atmosphericPaused = useV1MotionPause();

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setPreviewed(null);
        if (previewOriginRef.current) {
          previewOriginRef.current.focus({ preventScroll: true });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const previewDestination = (item, origin) => {
    previewOriginRef.current = origin;
    setPreviewed(item.id);
  };

  const closePreview = ({ restoreFocus = true } = {}) => {
    setPreviewed(null);
    if (restoreFocus && previewOriginRef.current) {
      previewOriginRef.current.focus({ preventScroll: true });
    }
  };

  const enterDestination = (item) => {
    if (!isDestinationAvailable(item)) return;
    const href = resolveDestinationHref(item);
    if (needsHardNavigation(item)) window.location.assign(href);
    else navigate(href);
  };

  const closePreviewFromStage = (event) => {
    if (!selected) return;
    if (event.target.closest('.v1-lab-target')) return;
    closePreview({ restoreFocus: false });
  };

  return (
    <main className={`v1-lab ${debug ? 'debug-hit-regions' : ''} ${atmosphericPaused ? 'motion-paused' : ''}`} aria-label="Silicon Heartland Universe V1 opening lab">
      <section className="v1-lab-stage" ref={stageRef} aria-label="Static approved Scene 01 Universe arrival master" onPointerDown={closePreviewFromStage}>
        <img
          className="v1-lab-image"
          src={universeV1BlackIvoryMaster.source}
          alt="Approved Scene 01 Universe arrival master for Silicon Heartland Universe V1."
          draggable="false"
        />
        <V1AtmosphereLayer />
        {visibleTargets.map((item) => (
          <V1LabTarget
            key={item.id}
            destination={item}
            geometry={imageGeometry}
            debug={debug}
            previewed={previewed === item.id}
            onPreview={previewDestination}
          />
        ))}
      </section>

      <section className="v1-branding" aria-labelledby="v1-universe-title">
        <h1 id="v1-universe-title" aria-label="THE SILICON HEARTLAND UNIVERSE">
          <span aria-hidden="true">THE SILICON HEARTLAND</span>
          <span aria-hidden="true">UNIVERSE</span>
        </h1>
        <p>Explore the institutions, systems, and worlds shaping a shared future.</p>
      </section>

      <button className="v1-card-toggle" type="button" onClick={() => navigate(UNIVERSE_DIRECTORY_ROUTE)}>
        Card Mode
      </button>

      {selected && (
        <V1DestinationPreview
          destination={selected}
          style={getPreviewPosition(selected, imageGeometry)}
          onEnter={enterDestination}
          onBack={closePreview}
        />
      )}

    </main>
  );
}

function Universe({ navigate }) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [introDone, setIntroDone] = useState(getParam('skipIntro') === '1' || sessionStorage.getItem(INTRO_KEY) === '1');
  const [focused, setFocused] = useState(null);
  const [cardsOpen, setCardsOpen] = useState(localStorage.getItem(MODE_KEY) === 'card');
  const [infoOpen, setInfoOpen] = useState(false);
  const [paused, setPaused] = useState(reducedMotion);
  const calibrate = getParam('calibrate') === '1';
  const visibleTargets = destinations.filter((d) => d.sceneAvailable);
  const selected = useMemo(() => destinations.find((d) => d.id === focused), [focused]);
  const stageRef = useRef(null);
  const sceneRef = useRef(null);
  const sceneGeometry = useSceneGeometry(sceneRef);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        if (cardsOpen) setCardsOpen(false);
        else setFocused(null);
      }
      if (event.key === 'Enter' && selected) navigate(selected.route);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cardsOpen, navigate, selected]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden || reducedMotion);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [reducedMotion]);

  const focusDestination = (item) => {
    if (!item.sceneAvailable) return;
    setFocused((current) => (current === item.id ? null : item.id));
    setCardsOpen(false);
    localStorage.setItem(MODE_KEY, 'scene');
  };

  const enterDestination = (item) => navigate(item.route);

  const toggleCards = () => {
    setCardsOpen((open) => {
      const next = !open;
      localStorage.setItem(MODE_KEY, next ? 'card' : 'scene');
      return next;
    });
  };

  return (
    <main className={`universe ${focused ? selected.bodyClass : ''} ${paused ? 'motion-paused' : ''}`} ref={stageRef}>
      {!introDone && <Intro reducedMotion={reducedMotion} onDone={() => setIntroDone(true)} />}
      <section className="scene" ref={sceneRef} aria-label="Silicon Heartland Universe opening scene">
        <img className="scene-image" src={universeV1BlackIvoryMaster.source} alt="Approved Scene 01 Universe arrival master for Silicon Heartland Universe V1." />
        <StarField reducedMotion={reducedMotion} paused={paused || cardsOpen} />
        <div className="scene-vignette" aria-hidden="true" />
        {visibleTargets.map((item) => (
          <SceneTarget key={item.id} destination={item} focused={focused === item.id} geometry={sceneGeometry} onSelect={focusDestination} />
        ))}
        {calibrate && (
          <div className="calibration" aria-hidden="true">
            {sceneGeometry && visibleTargets.map((item) => (
              <span
                key={item.id}
                style={{
                  left: `${sceneGeometry.left + item.x * sceneGeometry.width}px`,
                  top: `${sceneGeometry.top + item.y * sceneGeometry.height}px`,
                }}
              >
                {item.label}
              </span>
            ))}
            <p>{window.innerWidth} x {window.innerHeight}</p>
          </div>
        )}
      </section>

      <header className="title-block">
        <p>THE SILICON HEARTLAND UNIVERSE</p>
        <h1>Explore the institutions, systems, and worlds shaping a shared future.</h1>
      </header>

      {selected && (
        <aside className="identity-panel" aria-live="polite">
          <p>{selected.label}</p>
          <h2>{selected.title}</h2>
          <span>Simulated camera travel preview. Second selection enters the prototype route.</span>
          <div>
            <button type="button" onClick={() => enterDestination(selected)}>Enter</button>
            <button type="button" onClick={() => setFocused(null)}>Back</button>
          </div>
        </aside>
      )}

      <nav className="utility" aria-label="Preview controls">
        <button type="button" onClick={toggleCards}>Card Mode</button>
        <button type="button" onClick={() => setPaused((value) => !value)}>{paused ? 'Resume Motion' : 'Pause Motion'}</button>
        <button type="button" onClick={() => { sessionStorage.removeItem(INTRO_KEY); setIntroDone(false); }}>Replay</button>
        <button type="button" onClick={() => setInfoOpen(true)}>Info</button>
      </nav>

      <CardMode open={cardsOpen} onClose={() => setCardsOpen(false)} onFocusDestination={focusDestination} onEnterDestination={enterDestination} />
      <InfoPanel open={infoOpen} onClose={() => setInfoOpen(false)} />
    </main>
  );
}

function DestinationRoute({ destination, navigate }) {
  const available = isDestinationAvailable(destination);
  const href = resolveDestinationHref(destination);

  return (
    <main className="destination-route">
      <section>
        <p>{available ? 'Connected destination' : 'Destination unavailable'}</p>
        <h1>{destination.title}</h1>
        <span>
          {available
            ? 'This destination is served by an independent application.'
            : 'This destination is planned but is not available in this preview.'}
        </span>
        {available && <a className="button-link" href={href} aria-label={destination.accessibilityLabel}>{destination.entryActionLabel ?? 'Open destination'}</a>}
        <button type="button" onClick={() => navigate(CANONICAL_UNIVERSE_ROUTE)}>{RETURN_TO_UNIVERSE_LABEL}</button>
      </section>
    </main>
  );
}

function NotFound({ navigate }) {
  return (
    <main className="destination-route">
      <section>
        <p>Universe route</p>
        <h1>Page not found</h1>
        <span>The requested Universe page is not available.</span>
        <button type="button" onClick={() => navigate(CANONICAL_UNIVERSE_ROUTE)}>{RETURN_TO_UNIVERSE_LABEL}</button>
      </section>
    </main>
  );
}

function V2LabBoundary({ navigate }) {
  return (
    <main className="destination-route v2-lab-boundary" aria-labelledby="v2-lab-title">
      <section>
        <p>Development boundary</p>
        <h1 id="v2-lab-title">SILICON HEARTLAND UNIVERSE V2 LAB</h1>
        <span>Isolated V2 development boundary. This route is available for future V2 work and does not render the production Universe, the promoted V1 composition, the archived historical experience, or the environment lab.</span>
        <button type="button" onClick={() => navigate(CANONICAL_UNIVERSE_ROUTE)}>{RETURN_TO_UNIVERSE_LABEL}</button>
      </section>
    </main>
  );
}

function V1LabRedirect({ navigate }) {
  useEffect(() => {
    navigate(CANONICAL_UNIVERSE_ROUTE, { replace: true });
  }, [navigate]);

  return <UniverseV1Lab navigate={navigate} />;
}

function EnvironmentLab({ navigate }) {
  const selectedDerivative = useMemo(() => selectDeepStarMapDerivative(), []);
  const [view, setView] = useState({ yaw: 0, pitch: 0 });
  const dragRef = useRef(null);
  const { appearance, orientation } = deepStarMap2020Config;

  const beginDrag = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      yaw: view.yaw,
      pitch: view.pitch,
    };
  };

  const updateDrag = (event) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    const yaw = Math.max(-1, Math.min(1, dragRef.current.yaw + dx / window.innerWidth));
    const pitch = Math.max(-1, Math.min(1, dragRef.current.pitch + dy / window.innerHeight));
    setView({ yaw, pitch });
  };

  const endDrag = (event) => {
    if (dragRef.current) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
  };

  const xOffset = 50 + (orientation.horizontalDegrees / 360) * 100 + view.yaw * orientation.yawRangeDegrees * 0.28;
  const yOffset = 50 + (orientation.verticalDegrees / 180) * 100 + view.pitch * orientation.pitchRangeDegrees * 0.42;

  return (
    <main className="environment-lab">
      <section
        className="panorama-stage"
        aria-label="NASA Deep Star Maps 2020 Milky Way environment lab"
        onPointerDown={beginDrag}
        onPointerMove={updateDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          className="deep-space-panorama"
          src={selectedDerivative.src}
          alt="NASA Deep Star Maps 2020 Milky Way background without the separate Hipparcos and Tycho bright-star foreground."
          draggable="false"
          style={{
            '--panorama-x': `${xOffset}%`,
            '--panorama-y': `${yOffset}%`,
            '--panorama-brightness': appearance.brightness,
            '--panorama-contrast': appearance.contrast,
            '--panorama-saturation': appearance.saturation,
            '--panorama-monochrome': appearance.monochromeMix,
          }}
        />
        <div className="panorama-vignette" aria-hidden="true" />
      </section>

      <header className="environment-lab-header">
        <p>Environment Lab</p>
        <h1>Distant Deep-Space Panorama</h1>
      </header>

      <aside className="environment-lab-status" aria-label="Selected panorama source">
        <p>NASA Deep Star Maps 2020</p>
        <span>{selectedDerivative.label} / {selectedDerivative.width}x{selectedDerivative.height}</span>
        <span>Max texture {selectedDerivative.maxTextureSize || 'unavailable'} / memory {selectedDerivative.deviceMemory} GB</span>
        <button type="button" onClick={() => navigate(CANONICAL_UNIVERSE_ROUTE)}>{RETURN_TO_UNIVERSE_LABEL}</button>
      </aside>
    </main>
  );
}

// Brainiact (the shared SHF companion, mounted globally by
// RootProviders.jsx — see src/entries/index.main.jsx, which wraps this
// whole app when reached via site root `/`) is not a public Universe
// destination and must never appear on any Universe page. Reuses the
// exact existing suppression mechanism ResumeBuilder.jsx already
// established for this same need (see the `data-coach-suppress` rule in
// src/styles/companion.css) — an additive body-attribute token, not a
// hard-coded title/component check inside Brainiact itself. Mounted once
// here, at the top of the whole Universe app's route dispatcher, so it
// covers every Universe sub-page (the cinematic scene, the Planetary
// Gateway, destination stubs, etc.) with one effect rather than
// duplicating it per sub-component. universe.main.jsx (the canonical
// /universe.html entry) never mounts RootProviders/Brainiact at all — this
// only matters for the site-root (`/`) mount path, but is safe and
// inert either way.
function useSuppressCompanion() {
  useEffect(() => {
    const el = document.body;
    const existing = new Set((el.getAttribute('data-coach-suppress') || '').split(/\s+/).filter(Boolean));
    existing.add('universe-public');
    el.setAttribute('data-coach-suppress', Array.from(existing).join(' '));
    return () => {
      const cur = new Set((el.getAttribute('data-coach-suppress') || '').split(/\s+/).filter(Boolean));
      cur.delete('universe-public');
      if (cur.size) el.setAttribute('data-coach-suppress', Array.from(cur).join(' '));
      else el.removeAttribute('data-coach-suppress');
    };
  }, []);
}

export default function UniverseApp() {
  useSuppressCompanion();
  const [path, navigate] = useRoute();
  useRouteImagePreload(path);
  const destination = destinations.find((item) => item.route === path);
  if (path === V1_LAB_ROUTE) return <V1LabRedirect navigate={navigate} />;
  // '/universe.html' is the real Vite multi-page build file backing the
  // canonical '/universe' route (see universe.html + entries/
  // universe.main.jsx) — recognized here so a direct hit on that literal
  // URL renders the same experience instead of falling through to
  // NotFound. Required strictly for this repository's multi-page-app
  // integration; the reference implementation had no such file.
  if (path === CANONICAL_UNIVERSE_ROUTE || path === '/universe.html' || path === '/') return <UniverseV1Lab navigate={navigate} />;
  // Planetary Gateway (2026-08-27): presentation-only replacement of the
  // former flat card grid at this route — see gateway/UniverseGateway.jsx.
  // Route, dispatcher, and the canonical registry it renders from are all
  // unchanged.
  if (path === UNIVERSE_DIRECTORY_ROUTE) return <UniverseGateway navigate={navigate} />;
  if (path === V2_LAB_ROUTE) return <V2LabBoundary navigate={navigate} />;
  if (path === deepStarMap2020Config.route) return <EnvironmentLab navigate={navigate} />;
  if (destination) return <DestinationRoute destination={destination} navigate={navigate} />;
  return <NotFound navigate={navigate} />;
}
