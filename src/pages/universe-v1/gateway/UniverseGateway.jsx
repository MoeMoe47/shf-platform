// src/pages/universe-v1/gateway/UniverseGateway.jsx
// ------------------------------------------------------------
// Silicon Heartland Universe — Planetary Gateway
//
// Replaces only the presentation of the Universe "Card Mode" destination
// page (/universe/directory). Deliberately isolated from the cinematic
// entrance (UniverseV1Lab, ../UniverseApp.jsx) and its shared .v1-*
// atmosphere/target classes — nothing here is imported by, or mutates,
// that scene, so this file and its CSS section (see the "Planetary
// Gateway" block appended to ../universe-v1.css) evolve independently of
// the main arrival experience.
//
// Destination data rule: every destination rendered here comes straight
// from the canonical registry (../universeDestinationRegistry.js via
// ../destinations.js) — no second destination list, no invented routes.
// This pass changed no registry record and no navigation/availability
// logic — it is a presentation-only upgrade.
//
// Section grouping is keyed purely to each destination's own `entityType`
// field from the registry — never inferred from title/id strings, and
// never a second, locally maintained id->section map.
//
// Background art: this page uses its own dedicated background master
// (public/assets/universe/masters/SHU_UNIVERSE_DIRECTORY_EARTH_HORIZON_MASTER_V1.png,
// supplied by the user for this page specifically) rather than the
// cinematic entrance's `universeV1BlackIvoryMaster` — so upgrading this
// page's art can never change what /universe's own cinematic scene
// renders. The image is art only: no interface text is baked into it,
// and it is not edited here — all cropping/positioning is done with CSS
// (object-fit/object-position + responsive overrides) against the
// original file. Environmental-foundation pass (2026-08-27): swapped to
// the newly approved text-free Earth-horizon master (a full-width
// horizon glow with symmetric Milky Way bands left and right, no baked
// galaxy/solar-system swirl this time) — star/dust placement below was
// retuned to that composition (kept out of the bright horizon band), but
// destination rendering, routing, planet layout/sizes, and the separate
// CSS galaxy-swirl decorative layer are untouched in this pass.
import React, { useEffect, useRef, useState } from 'react';
import { destinations } from '../destinations.js';
import {
  CANONICAL_UNIVERSE_ROUTE,
  RETURN_TO_UNIVERSE_LABEL,
  ENTITY_TYPES,
  isDestinationAvailable,
  needsHardNavigation,
  resolveDestinationHref,
} from '../universeDestinationRegistry.js';
import { DestinationEnterControl } from '../UniverseApp.jsx';

const GATEWAY_BACKGROUND_SOURCE = '/assets/universe/masters/SHU_UNIVERSE_DIRECTORY_EARTH_HORIZON_MASTER_V1.png';

const GATEWAY_SEED = 61803;

function seededUnit(seed) {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

// A denser, more varied starfield than the previous pass — several
// depth/speed tiers so twinkling reads as organic rather than uniform.
// `y` is constrained to 0-58% (the new Earth-horizon master's horizon
// line sits around 58-60% down the frame) so animated stars stay in the
// dark sky and never appear to float over the photographic Earth surface
// or get lost in the bright horizon glow.
function makeStars(count) {
  return Array.from({ length: count }, (_, index) => {
    const base = GATEWAY_SEED + index * 47;
    const tier = index % 9;
    const hero = tier === 4 || tier === 8;
    const fast = tier % 3 === 0;
    return {
      id: `ugw-star-${index}`,
      x: seededUnit(base + 1) * 100,
      y: seededUnit(base + 2) * 58,
      size: hero ? 2.3 + seededUnit(base + 3) * 1.3 : 1 + seededUnit(base + 3) * 1.3,
      opacity: hero ? 0.5 + seededUnit(base + 4) * 0.26 : 0.2 + seededUnit(base + 4) * 0.3,
      duration: fast ? 2.4 + seededUnit(base + 5) * 2.6 : 4.5 + seededUnit(base + 5) * 6.5,
      delay: -(seededUnit(base + 6) * 9),
      hero,
      fast,
    };
  });
}

const GATEWAY_STARS = makeStars(34);

// Same document.hidden/visibilitychange pattern as useV1MotionPause in
// ../UniverseApp.jsx, duplicated locally (8 lines) rather than exported,
// so this file has no dependency on that module beyond the one control it
// explicitly reuses.
function useMotionPause() {
  const [paused, setPaused] = useState(() => typeof document !== 'undefined' && document.hidden);
  useEffect(() => {
    const update = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return paused;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

function UniverseBackground() {
  return (
    <div className="ugw-background" aria-hidden="true" role="presentation">
      <img
        className="ugw-backgroundImage"
        src={GATEWAY_BACKGROUND_SOURCE}
        alt=""
        draggable="false"
      />
      {/* Subtle haze/depth: a soft glow rising from the horizon, echoing
          the photographic atmosphere glow already in the master image, so
          the animated layers above feel like they belong to the same
          space rather than sitting on top of it. Static — no animation,
          no reduced-motion concern. */}
      <div className="ugw-backgroundHaze" />
      <div className="ugw-backgroundVignette" />
      <div className="ugw-backgroundScrim" />
    </div>
  );
}

function StarField() {
  return (
    <div className="ugw-starLayer" aria-hidden="true" role="presentation">
      {GATEWAY_STARS.map((item) => (
        <i
          key={item.id}
          className={`ugw-star${item.hero ? ' is-hero' : ''}${item.fast ? ' is-fast' : ''}`}
          style={{
            '--x': `${item.x}%`,
            '--y': `${item.y}%`,
            '--size': `${item.size}px`,
            '--base-opacity': item.opacity,
            '--duration': `${item.duration}s`,
            '--delay': `${item.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// Aggressive solar dust, rendered on <canvas> rather than DOM nodes so a
// dense, directional, turbulent particle stream (the approved visual
// direction explicitly asks for "one of the strongest motion effects")
// stays cheap: one composited layer instead of 60-100+ animated DOM
// elements. Self-contained: reads prefers-reduced-motion and
// document.hidden itself and never schedules requestAnimationFrame when
// either applies (drawing one static settled frame instead), and always
// cancels its own frame + listeners on unmount.
function SolarDustCanvas({ reducedMotion }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let width = 0;
    let height = 0;
    let particles = [];
    let rafId = null;
    let stopped = false;
    let t = 0;

    function particleCount() {
      if (width < 600) return 34;
      if (width < 1024) return 60;
      return 92;
    }

    // Kept to the upper ~80% of the frame (`* 0.8`) so the dust stream
    // reads as material sweeping through space above the horizon, rather
    // than crossing directly over the brightest band of the new Earth-
    // horizon master where it would just wash out.
    function makeParticle(index) {
      const seed = index * 12.9898 + 401;
      const depth = seededUnit(seed + 1);
      const streak = seededUnit(seed + 7) > 0.88;
      const upward = seededUnit(seed + 5) > 0.5;
      return {
        x: seededUnit(seed + 2) * width,
        y: seededUnit(seed + 3) * height * 0.8,
        vx: -(0.45 + depth * 1.4) * (0.6 + seededUnit(seed + 4) * 0.95),
        vy: (0.06 + depth * 0.18) * (upward ? -1 : 1),
        size: streak ? 0.9 + depth * 1.3 : 0.55 + depth * 1.7,
        streak,
        len: streak ? 10 + depth * 22 : 0,
        alpha: 0.07 + depth * 0.32,
        phase: seededUnit(seed + 6) * Math.PI * 2,
        curl: 0.14 + seededUnit(seed + 8) * 0.34,
        depth,
      };
    }

    function respawn(p) {
      p.x = width + 10 + seededUnit((p.phase + t) * 3.1) * 40;
      p.y = seededUnit(p.phase * 7.7 + t) * height * 0.8;
    }

    function resize() {
      const parent = canvas.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: particleCount() }, (_, i) => makeParticle(i));
    }

    function paint(moving) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#f5f1e8';
      ctx.strokeStyle = '#f5f1e8';
      for (const p of particles) {
        ctx.globalAlpha = p.alpha;
        if (p.streak) {
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.len, p.y - p.len * 0.16);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (moving) void 0;
    }

    function step() {
      t += 1;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy + Math.sin(t * 0.012 * p.curl + p.phase) * 0.15;
        if (p.x < -40 || p.y < -40 || p.y > height + 40) respawn(p);
      }
      paint(true);
      if (!stopped) rafId = requestAnimationFrame(step);
    }

    function schedule() {
      if (stopped || reducedMotion || (typeof document !== 'undefined' && document.hidden)) return;
      rafId = requestAnimationFrame(step);
    }

    resize();
    if (reducedMotion) paint(false);
    else schedule();

    const onResize = () => {
      resize();
      if (reducedMotion) paint(false);
    };
    const onVisibility = () => {
      if (typeof document === 'undefined') return;
      if (document.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!reducedMotion && !rafId) {
        schedule();
      }
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="ugw-dustCanvas" aria-hidden="true" role="presentation" />;
}

function GalaxySwirl() {
  // Glow cleanup (2026-08-27): the bright pulsing core blob
  // (.ugw-galaxyCore) that used to sit here was reading as a fake
  // upper-right spotlight — removed. The faint conic-gradient swirl
  // rings and orbiting dots stay, at reduced opacity (see
  // universe-v1.css), as a subtle texture rather than a light source.
  return (
    <div className="ugw-galaxyFrame" aria-hidden="true" role="presentation">
      <div className="ugw-galaxyOuterRing" />
      <div className="ugw-galaxyInnerRing" />
      <div className="ugw-galaxyOrbit ugw-galaxyOrbit--a"><span /></div>
      <div className="ugw-galaxyOrbit ugw-galaxyOrbit--b"><span /></div>
    </div>
  );
}

function UniverseIntro() {
  return (
    <section className="ugw-intro" aria-labelledby="ugw-intro-title">
      <p className="ugw-introEyebrow">Silicon Heartland Universe</p>
      <h1 id="ugw-intro-title" className="ugw-introTitle">Your universe of opportunity.</h1>
      <p className="ugw-introBody">
        Explore the institutions, platforms, and applications that make up the Silicon Heartland
        ecosystem.
      </p>
    </section>
  );
}

// Planet size is keyed to entityType only (never a title/id string) —
// institutions read as the largest, most important bodies; platforms
// medium; public surfaces a step below that; applications the smallest,
// densest tier. Matches the approved "the planet is the visual anchor"
// hierarchy — see the size table in universe-v1.css.
function planetSizeVariant(entityType) {
  if (entityType === ENTITY_TYPES.INSTITUTION) return null; // base size
  if (entityType === ENTITY_TYPES.PLATFORM) return 'medium';
  if (entityType === ENTITY_TYPES.PUBLIC_SURFACE) return 'compact';
  return 'small';
}

// Independent planet image layer (2026-08-27): the approved photographic
// planet assets replace the previous CSS-gradient sphere entirely — real
// <img> elements, not a recreation. This is a presentation-only lookup
// (id -> asset path + native aspect ratio), not registry data — it lives
// here, not in universeDestinationRegistry.js, and changing it can never
// alter a destination's route/availability/copy. Assets keep their
// original files (2 real aspect ratios among the 8: 3:2 for most, 1:1 for
// the two square ones) so nothing is cropped/stretched out of proportion.
const PLANET_ASSET_DIR = '/assets/universe/planets';
// Named for the visual family each file actually is (per the approved
// asset library), not the arbitrary filename it happened to arrive with.
const PLANET_IMAGES = {
  uranusRingedIceGiant: { src: `${PLANET_ASSET_DIR}/shu-planet-ringed-giant-01.png`, ratio: 'wide' },
  majorRingedGasGiant: { src: `${PLANET_ASSET_DIR}/shu-planet-ringed-giant-02.png`, ratio: 'wide' },
  jupiterLikeGasGiant: { src: `${PLANET_ASSET_DIR}/shu-planet-banded-giant-01.png`, ratio: 'wide' },
  earthLikeWorld: { src: `${PLANET_ASSET_DIR}/shu-planet-earth-01.png`, ratio: 'wide' },
  cyberneticTechnicalPlanet: { src: `${PLANET_ASSET_DIR}/shu-planet-cyber-sphere-01.png`, ratio: 'square' },
  crateredMoon: { src: `${PLANET_ASSET_DIR}/shu-planet-cratered-transparent-01.png`, ratio: 'square' },
  icyWorld: { src: `${PLANET_ASSET_DIR}/shu-planet-cratered-01.png`, ratio: 'wide' },
  darkRockyCrateredWorld: { src: `${PLANET_ASSET_DIR}/shu-planet-cratered-02.png`, ratio: 'wide' },
};

// Institutions, platforms, the standard, and public surfaces each get one
// distinct, deliberately chosen image (silicon-heartland-foundation ->
// earth-like world, matching that destination's own pre-existing
// `celestialBody: 'Earth'` registry field). Composition-correction pass
// (2026-08-27): `aos` and `shs-bos-executive-command` previously both
// pointed at the same cybernetic-sphere image — a duplicate/generic
// assignment where one asset stood in for two distinct destinations.
// `aos` (Autonomous Operating System) keeps the cybernetic/technical
// planet, the strongest fit; `shs-bos-executive-command` now gets its own
// dedicated asset (icy world) instead of sharing aos's. With 8 non-
// application destinations and exactly 8 approved images, every one of
// them now has a unique asset — no duplication left in this tier. The 13
// applications still rotate through three of the simpler images by
// design (the dense, small tier is meant to repeat) — that is unchanged.
const PLANET_IMAGE_BY_ID = {
  'silicon-heartland-foundation': PLANET_IMAGES.earthLikeWorld,
  bos: PLANET_IMAGES.uranusRingedIceGiant,
  'autonomous-registry': PLANET_IMAGES.majorRingedGasGiant,
  'autonomous-trust-bureau': PLANET_IMAGES.jupiterLikeGasGiant,
  aos: PLANET_IMAGES.cyberneticTechnicalPlanet,
  'shs-bos-executive-command': PLANET_IMAGES.icyWorld,
  'open-autonomous-standard': PLANET_IMAGES.crateredMoon,
  'shf-impact': PLANET_IMAGES.darkRockyCrateredWorld,
};
const APPLICATION_ROTATION = [PLANET_IMAGES.crateredMoon, PLANET_IMAGES.icyWorld, PLANET_IMAGES.darkRockyCrateredWorld];

function planetImageForDestination(destination, indexInSection) {
  return (
    PLANET_IMAGE_BY_ID[destination.id]
    || APPLICATION_ROTATION[indexInSection % APPLICATION_ROTATION.length]
  );
}

// Presentation filter (composition pass, 2026-08-27): a destination's
// `statusNote` (e.g. "missing Router provider in lordOutcomes.main.jsx")
// is real, valuable audit evidence for engineers reading the registry —
// it stays in universeDestinationRegistry.js untouched — but it is
// implementation detail, not a public-facing destination description, so
// it is deliberately never rendered here. Only `label`/`title`/
// `description` (already clean, user-facing registry fields) and the
// pinned availability/access copy below reach the visible page.
function PlanetDestination({ destination, onEnterDestination, indexInSection }) {
  const available = isDestinationAvailable(destination);
  const sizeVariant = planetSizeVariant(destination.entityType);
  const adminGated = available && destination.access === 'admin-only';
  const image = planetImageForDestination(destination, indexInSection);
  return (
    <article
      className={`ugw-planetCard${available ? '' : ' is-unavailable'}`}
      data-destination-id={destination.id}
    >
      <div
        className={`ugw-planet${sizeVariant ? ` ugw-planet--${sizeVariant}` : ''} ugw-planet--${image.ratio}${available ? '' : ' is-dormant'}`}
        aria-hidden="true"
      >
        <span className="ugw-planetHalo" />
        <span className="ugw-planetOrbitRing" />
        <span className="ugw-planetRingStatic" />
        <img
          className="ugw-planetImage"
          src={image.src}
          alt=""
          draggable="false"
          loading="lazy"
          decoding="async"
        />
      </div>
      <p className="ugw-planetEyebrow">{destination.label}</p>
      <h3 className="ugw-planetTitle">{destination.title}</h3>
      <p className="ugw-planetDescription">{destination.description}</p>
      {!available && (
        <small className="ugw-planetStatus">Planned destination unavailable in this preview.</small>
      )}
      {adminGated && (
        <small className="ugw-planetStatus">Admin sign-in required.</small>
      )}
      <div className="ugw-planetActions">
        <DestinationEnterControl destination={destination} onEnterDestination={onEnterDestination} />
      </div>
    </article>
  );
}

const SECTION_ORDER = [
  ENTITY_TYPES.INSTITUTION,
  ENTITY_TYPES.PLATFORM,
  ENTITY_TYPES.STANDARD,
  ENTITY_TYPES.APPLICATION,
  ENTITY_TYPES.PUBLIC_SURFACE,
];

const SECTION_LABELS = {
  [ENTITY_TYPES.INSTITUTION]: 'Businesses & Institutions',
  [ENTITY_TYPES.PLATFORM]: 'Platforms & Operating Systems',
  [ENTITY_TYPES.STANDARD]: 'Standards & Governance',
  [ENTITY_TYPES.APPLICATION]: 'Applications',
  [ENTITY_TYPES.PUBLIC_SURFACE]: 'Public Surfaces',
};

function DestinationSection({ entityType, items, onEnterDestination }) {
  if (!items.length) return null;
  const headingId = `ugw-section-${entityType}`;
  return (
    <section className="ugw-section" data-entity-type={entityType} aria-labelledby={headingId}>
      <h2 id={headingId} className="ugw-sectionTitle">{SECTION_LABELS[entityType]}</h2>
      <div className="ugw-planetGrid">
        {items.map((item, index) => (
          <PlanetDestination
            key={item.id}
            destination={item}
            onEnterDestination={onEnterDestination}
            indexInSection={index}
          />
        ))}
      </div>
    </section>
  );
}

export default function UniverseGateway({ navigate }) {
  const paused = useMotionPause();
  const reducedMotion = useReducedMotion();

  // Identical decision to every other entry point (UniverseV1Lab's own
  // enterDestination, the retired UniverseDirectory) — same registry
  // functions, same same-origin-app/independent-local-app hard-navigation
  // rule, no re-derivation of navigation logic here.
  const enterDestination = (item) => {
    if (!isDestinationAvailable(item)) return;
    const href = resolveDestinationHref(item);
    if (needsHardNavigation(item)) window.location.assign(href);
    else navigate(href);
  };

  const grouped = {};
  for (const entityType of SECTION_ORDER) grouped[entityType] = [];
  for (const item of destinations) {
    if (item.universeVisible === false) continue;
    if (grouped[item.entityType]) grouped[item.entityType].push(item);
  }

  return (
    <main
      className={`ugw-page${paused ? ' motion-paused' : ''}`}
      aria-label="Silicon Heartland Universe destination gateway"
    >
      <UniverseBackground />
      <StarField />
      <SolarDustCanvas reducedMotion={reducedMotion} />
      <GalaxySwirl />

      <div className="ugw-layout">
        <UniverseIntro />
        <div className="ugw-content">
          {SECTION_ORDER.map((entityType) => (
            <DestinationSection
              key={entityType}
              entityType={entityType}
              items={grouped[entityType]}
              onEnterDestination={enterDestination}
            />
          ))}

          <div className="ugw-footerRow">
            <button type="button" className="ugw-returnButton" onClick={() => navigate(CANONICAL_UNIVERSE_ROUTE)}>
              {RETURN_TO_UNIVERSE_LABEL}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
