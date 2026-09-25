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
// Background art: this page uses its own dedicated production background
// (public/assets/shu/SHU_DIRECTORY_BACKGROUND_MASTER_V2.png, copied from
// the user-supplied ~/Downloads master for this page specifically) rather than the
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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { destinations } from '../destinations.js';
import Icon from './GatewayIcon.jsx';
import DiscoverySearch from '../discovery/DiscoverySearch.jsx';
import { OBJECT_TYPES, discoverRouteFor, typeByKey } from '../discovery/discoveryModel.js';
import { objectsOfType, typeRelationships } from '../discovery/discoveryAdapter.js';
import useDiscovery from '../discovery/useDiscovery.js';
import { useDestinationEntry } from '../discovery/destinationEntry.js';
import {
  CANONICAL_UNIVERSE_ROUTE,
  isDestinationAvailable,
} from '../universeDestinationRegistry.js';

const GATEWAY_BACKGROUND_SOURCE = '/assets/shu/SHU_DIRECTORY_BACKGROUND_MASTER_V2.png';

const GATEWAY_SEED = 61803;

function seededUnit(seed) {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

// Decorative directory stars: deterministic positions/timing, kept mostly
// above the Earth horizon and biased away from the hero title/search area.
function makeDirectoryStars(count) {
  const zones = [
    { x: [6, 20], y: [8, 38] },
    { x: [30, 48], y: [5, 26] },
    { x: [58, 94], y: [7, 34] },
    { x: [42, 86], y: [36, 55] },
    { x: [8, 36], y: [46, 58] },
  ];
  return Array.from({ length: count }, (_, index) => {
    const zone = zones[index % zones.length];
    const base = GATEWAY_SEED + index * 53;
    const tier = index % 10;
    const accent = tier === 4 || tier === 9;
    const warm = tier === 6;
    const peakOpacity = accent ? 0.58 + seededUnit(base + 7) * 0.25 : 0.46 + seededUnit(base + 7) * 0.24;
    return {
      id: `shu-directory-star-${index}`,
      x: zone.x[0] + seededUnit(base + 1) * (zone.x[1] - zone.x[0]),
      y: zone.y[0] + seededUnit(base + 2) * (zone.y[1] - zone.y[0]),
      size: accent ? 1.8 + seededUnit(base + 3) * 1.1 : 1 + seededUnit(base + 3) * 1.45,
      opacity: accent ? 0.38 + seededUnit(base + 4) * 0.26 : 0.25 + seededUnit(base + 4) * 0.34,
      peakOpacity,
      sparkOpacity: Math.min(0.84, peakOpacity + 0.08),
      duration: 2.6 + seededUnit(base + 5) * 4.35,
      delay: -(seededUnit(base + 6) * 7.4),
      accent,
      warm,
    };
  });
}

const DIRECTORY_STARS = makeDirectoryStars(56);

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
        fetchPriority="high"
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
    <div className="shu-directory-stars" aria-hidden="true" role="presentation">
      {DIRECTORY_STARS.map((item) => (
        <i
          key={item.id}
          className={`shu-directory-star${item.accent ? ' is-accent' : ''}${item.warm ? ' is-warm' : ''}`}
          style={{
            '--x': `${item.x}%`,
            '--y': `${item.y}%`,
            '--size': `${item.size}px`,
            '--base-opacity': item.opacity,
            '--peak-opacity': item.peakOpacity,
            '--spark-opacity': item.sparkOpacity,
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

function UniverseIntro({ navigate, onEnterDestination }) {
  return (
    <section className="ugw-intro" aria-labelledby="ugw-intro-title">
      <p className="ugw-introEyebrow">Silicon Heartland Universe</p>
      <h1 id="ugw-intro-title" className="ugw-introTitle">Your universe of opportunity.</h1>
      <p className="ugw-introBody">
        Explore programs, careers, organizations, projects, places and opportunities across the
        Silicon Heartland ecosystem.
      </p>
      <DiscoverySearch navigate={navigate} onEnterDestination={onEnterDestination} />
    </section>
  );
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

const HERO_DESTINATION_IDS = [
  'silicon-heartland-foundation',
  'bos',
  'shs-bos-executive-command',
  'career',
  'curriculum',
  'autonomous-registry',
  'autonomous-trust-bureau',
  'open-autonomous-standard',
  'civic',
  'shf-impact',
];

const HERO_DESTINATION_LABELS = {
  'silicon-heartland-foundation': { title: 'SHF', subtitle: 'Silicon Heartland Foundation' },
  bos: { title: 'SHS', subtitle: 'Systems' },
  'shs-bos-executive-command': { title: 'BOS', subtitle: 'Business Operating System' },
  career: { title: 'Career', subtitle: 'Workforce' },
  curriculum: { title: 'Curriculum', subtitle: 'Education' },
  'autonomous-registry': { title: 'Registry', subtitle: 'Identity' },
  'autonomous-trust-bureau': { title: 'Bureau', subtitle: 'Trust & Verification' },
  'open-autonomous-standard': { title: 'OAS', subtitle: 'Open Autonomous Standard' },
  civic: { title: 'Civic', subtitle: 'Community' },
  'shf-impact': { title: 'Impact', subtitle: 'Public Reporting' },
};

const AUDIENCE_CARDS = [
  { icon: 'cap', title: "I'm a Student", text: 'Explore programs, training and career pathways.' },
  { icon: 'book', title: "I'm an Educator", text: 'Access curriculum and teaching resources.' },
  { icon: 'briefcase', title: "I'm Looking for Work", text: 'Explore careers, training and opportunities.' },
  { icon: 'people', title: 'I Represent an Organization', text: 'Partner, collaborate and create impact.' },
  { icon: 'building', title: "I'm an Employer", text: 'Find talent and workforce solutions.' },
  { icon: 'rocket', title: 'I Want to Build', text: 'Create, innovate and launch projects.' },
  { icon: 'pin', title: "I'm Exploring the Region", text: 'Discover places, initiatives and opportunities.' },
];

const FEATURED_ITEMS = [
  {
    type: 'Program',
    title: 'Data Center Community & Workforce Initiative',
    text: 'Education, workforce and community growth.',
    image: '/assets/shu/content/shu-program-robotics-learning-1200.webp',
    tags: ['Education', 'Workforce', 'Community'],
    cta: 'View Program',
  },
  {
    type: 'Career',
    title: 'Data Center Technician',
    text: 'High-demand career supporting digital infrastructure.',
    image: '/assets/shu/content/shu-career-data-center-technician-1200.webp',
    tags: ['Training', 'In Demand', 'Good Job'],
    cta: 'View Career',
  },
  {
    type: 'Organization',
    title: 'Silicon Heartland Foundation',
    text: 'Building equitable growth through education, workforce and community.',
    image: '/assets/shu/content/shu-organization-collaboration-1200.webp',
    tags: ['Nonprofit', 'Education', 'Community'],
    cta: 'View Organization',
  },
  {
    type: 'Project',
    title: 'Central Ohio Data Center Corridor',
    text: 'Expanding digital infrastructure and opportunity in the region.',
    image: '/assets/shu/content/shu-project-infrastructure-planning-1200.webp',
    tags: ['Infrastructure', 'Economic Growth'],
    cta: 'View Project',
  },
  {
    type: 'Opportunity',
    title: 'Data Center Training Program',
    text: 'Now enrolling for upcoming cohorts.',
    image: '/assets/shu/content/shu-opportunity-enrollment-advising-1200.webp',
    tags: ['Training', 'Apply Now', 'Columbus'],
    cta: 'View Opportunity',
  },
];

const BROWSE_TILES = [
  { icon: 'cap', title: 'Programs', text: 'Education and training initiatives.' },
  { icon: 'hand', title: 'Careers', text: 'Pathways and opportunities.' },
  { icon: 'people', title: 'Organizations', text: 'Institutions and partners.' },
  { icon: 'rocket', title: 'Projects', text: 'Initiatives and innovation.' },
  { icon: 'pin', title: 'Places', text: 'From real world to Metaverse.' },
  { icon: 'ticket', title: 'Opportunities', text: 'Grants, jobs and more.' },
];

// Center hub art: the warm, text-free "center planet" from the OAS control
// domains set — deliberately not one of the eight PLANET_IMAGES above, so
// the ecosystem hub never reads as any single destination (SHF/SHS/BOS...).
const NETWORK_CENTER_PLANET = '/assets/oas/control-domains-center-planet.png';

const NETWORK_ITEMS = [
  { title: 'Programs', text: 'Create learning opportunities', image: '/assets/shu/content/shu-program-robotics-learning-node-400.webp' },
  { title: 'Careers', text: 'Lead to pathways and good jobs', image: '/assets/shu/content/shu-career-data-center-technician-node-400.webp' },
  { title: 'Places', text: 'Connect real world and Metaverse', image: '/assets/shu/content/shu-place-connected-region-node-400.webp' },
  { title: 'Organizations', text: 'Operate and partner on initiatives', image: '/assets/shu/content/shu-organization-collaboration-node-400.webp' },
  { title: 'Projects', text: 'Deliver solutions and infrastructure', image: '/assets/shu/content/shu-project-engineering-design-node-400.webp' },
  { title: 'Opportunities', text: 'Create access and growth', image: '/assets/shu/content/shu-opportunity-career-networking-node-400.webp' },
];

const ACTIVITY_ITEMS = [
  { type: 'Program', meta: 'New cohort announced', title: 'Data Center Training Program - Fall 2025', time: '2 hours ago', image: '/assets/shu/content/shu-workforce-skilled-trades-400.webp' },
  { type: 'Organization', meta: 'Partnership', title: 'SHF and regional employers expand workforce initiative', time: '5 hours ago', image: '/assets/shu/content/shu-organization-collaboration-400.webp' },
  { type: 'Opportunity', meta: 'Now open', title: 'Applications open for Data Center Scholarships', time: '1 day ago', image: '/assets/shu/content/shu-opportunity-enrollment-advising-400.webp' },
  { type: 'Project', meta: 'Milestone', title: 'Central Ohio Data Center Corridor reaches new milestone', time: '2 days ago', image: '/assets/shu/content/shu-project-infrastructure-planning-400.webp' },
  { type: 'Career', meta: 'In demand', title: 'Data Center Technician ranked among top growth careers', time: '3 days ago', image: '/assets/shu/content/shu-career-data-center-technician-400.webp' },
];

const STORY_ITEMS = [
  {
    type: 'Workforce',
    title: 'From Training to a Career',
    text: "A local student's journey into the data center industry.",
    image: '/assets/shu/content/shu-workforce-skilled-trades-1600.webp',
    position: '50% 30%',
    photo: true,
  },
  {
    type: 'Community',
    title: 'Building Opportunity',
    text: 'How Silicon Heartland is powering regional growth.',
    image: '/assets/shu/content/shu-community-development-1600.webp',
    position: '50% 32%',
    photo: true,
  },
  {
    type: 'Innovation',
    title: 'A More Connected Region',
    text: 'Education, infrastructure and community working together.',
    image: '/assets/shu/content/shu-project-engineering-design-1600.webp',
    position: '50% 30%',
    photo: true,
  },
];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// In-app link: a real href (open-in-new-tab and copy link keep working),
// client-side navigation on a plain click.
export function RouteLink({ to, navigate, children, ...rest }) {
  const onClick = (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={onClick} {...rest}>{children}</a>;
}

// Editorial sections (Featured, Latest Activity, Featured Stories) carry
// illustrative presentation copy that is NOT canonical ecosystem data; the
// note makes that explicit to readers (see SHU_ECOSYSTEM_EXPERIENCE_V1.md).
export function SectionHeader({ eyebrow, title, action, headingId, navigate, editorialNote, children }) {
  return (
    <div className="ugw-sectionHeader">
      <div>
        <h2 className="ugw-sectionEyebrow" id={headingId}>{eyebrow}</h2>
        {title && <p className="ugw-sectionCopy">{title}</p>}
        {editorialNote && <p className="ugw-editorialNote">{editorialNote}</p>}
      </div>
      {children}
      {action && (
        <RouteLink className="ugw-sectionAction" to={action.to} navigate={navigate}>
          {action.label} <span aria-hidden="true">&rarr;</span>
        </RouteLink>
      )}
    </div>
  );
}

function DestinationPlanet({ destination, onEnterDestination, index, entering }) {
  const available = isDestinationAvailable(destination);
  const text = HERO_DESTINATION_LABELS[destination.id] || { title: destination.label, subtitle: destination.title };
  const image = planetImageForDestination(destination, index);
  return (
    <button
      type="button"
      className={`ugw-destinationPlanet${available ? '' : ' is-unavailable'}${entering ? ' is-entering' : ''}`}
      data-destination-id={destination.id}
      onClick={() => onEnterDestination(destination, text.title)}
      disabled={!available}
      aria-label={`${text.title}: ${text.subtitle}${available ? '' : ' (not yet available)'}`}
    >
      <span className={`ugw-planet ugw-planet--${image.ratio}${available ? '' : ' is-dormant'}`} aria-hidden="true">
        <span className="ugw-planetHalo" />
        <span className="ugw-planetOrbitRing" />
        <span className="ugw-planetRingStatic" />
        <img className="ugw-planetImage" src={image.src} alt="" draggable="false" loading={index < 4 ? 'eager' : 'lazy'} decoding="async" />
      </span>
      <span className="ugw-destinationName">{text.title}</span>
      <span className="ugw-destinationMeta">{text.subtitle}</span>
    </button>
  );
}

function AudienceCard({ item }) {
  return (
    <a className="ugw-audienceCard" href={`#${slugify(item.title)}`}>
      <span className="ugw-cardIcon"><Icon name={item.icon} /></span>
      <strong>{item.title}</strong>
      <span>{item.text}</span>
      <i aria-hidden="true">&rarr;</i>
    </a>
  );
}

// Responsive sources for SHU production images: every -1200/-1600 webp in
// /assets/shu/content/ has an -800 sibling, so small screens never fetch
// the large derivative.
function contentSrcSet(src) {
  const match = /^(\/assets\/shu\/content\/.+)-(1200|1600)\.webp$/.exec(src || '');
  return match ? `${match[1]}-800.webp 800w, ${src} ${match[2]}w` : undefined;
}

function FeaturedCard({ item, navigate }) {
  return (
    <article className="ugw-featureCard">
      <img
        src={item.image}
        srcSet={contentSrcSet(item.image)}
        sizes="(max-width: 560px) 92vw, (max-width: 1024px) 31vw, 270px"
        alt=""
        loading="lazy"
        decoding="async"
      />
      <div>
        <p>{item.type}</p>
        <h3>{item.title}</h3>
        <span>{item.text}</span>
        <ul aria-label={`${item.title} metadata`}>
          {item.tags.map((tag) => <li key={tag}>{tag}</li>)}
        </ul>
        <RouteLink to={discoverRouteFor({ type: typeKeyForLabel(item.type) })} navigate={navigate}>
          {item.cta} <span aria-hidden="true">&rarr;</span>
        </RouteLink>
      </div>
    </article>
  );
}

function BrowseTile({ item, navigate }) {
  return (
    <RouteLink className="ugw-browseTile" to={discoverRouteFor({ type: typeKeyForPlural(item.title) })} navigate={navigate} id={slugify(item.title)}>
      <span className="ugw-cardIcon"><Icon name={item.icon} /></span>
      <strong>{item.title}</strong>
      <span>{item.text}</span>
      <i aria-hidden="true">&rarr;</i>
    </RouteLink>
  );
}

function typeKeyForLabel(label) {
  return OBJECT_TYPES.find((type) => type.label === label)?.key || '';
}

function typeKeyForPlural(plural) {
  return OBJECT_TYPES.find((type) => type.plural === plural)?.key || '';
}

// Featured Across the Ecosystem: editorial presentation cards (NOT the
// canonical discovery index — see discovery/discoveryAdapter.js). The
// filter narrows the editorial set by its own `type` label; categories with
// no editorial card show an honest empty state that points to Discover.
function FeaturedSection({ navigate }) {
  const [filter, setFilter] = useState('');
  const visible = filter ? FEATURED_ITEMS.filter((item) => typeKeyForLabel(item.type) === filter) : FEATURED_ITEMS;
  const filterType = OBJECT_TYPES.find((type) => type.key === filter);
  return (
    <section className="ugw-section" id="featured-across-the-ecosystem" aria-labelledby="ugw-featured-heading" data-content-class="editorial">
      <SectionHeader
        eyebrow="Featured Across the Ecosystem"
        headingId="ugw-featured-heading"
        editorialNote="Illustrative highlights — not published ecosystem records."
        navigate={navigate}
        action={{ to: discoverRouteFor({ type: filter }), label: 'View All' }}
      >
        <div className="ugw-filterRow" role="group" aria-label="Filter featured items">
          <button type="button" className={filter ? '' : 'is-active'} aria-pressed={!filter} onClick={() => setFilter('')}>All</button>
          {OBJECT_TYPES.map((type) => (
            <button
              key={type.key}
              type="button"
              className={filter === type.key ? 'is-active' : ''}
              aria-pressed={filter === type.key}
              onClick={() => setFilter((current) => (current === type.key ? '' : type.key))}
            >
              {type.plural}
            </button>
          ))}
        </div>
      </SectionHeader>
      <div className="ugw-featureGrid" aria-live="polite">
        {visible.map((item) => <FeaturedCard key={item.title} item={item} navigate={navigate} />)}
        {!visible.length && filterType && (
          <div className="ugw-emptyState is-compact ugw-featureEmpty" role="status">
            <strong>No featured {filterType.plural.toLowerCase()} right now.</strong>
            <p>Browse every published {filterType.label.toLowerCase()} in Discover.</p>
            <div className="ugw-emptyStateActions">
              <RouteLink className="ugw-pillButton" to={discoverRouteFor({ type: filterType.key })} navigate={navigate}>
                Browse {filterType.plural} <span aria-hidden="true">&rarr;</span>
              </RouteLink>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Network animation timing. A travelling signal takes SIGNAL_TRAVEL_MS to
// go from the hub edge to a node; the node "receives" it for
// NODE_RECEIVE_MS. Launches are spaced SIGNAL_GAP_MS apart (randomized), so
// at most two signals are ever in flight.
const SIGNAL_TRAVEL_MS = 2800;
const NODE_RECEIVE_MS = 1500;
const SIGNAL_GAP_MS = [1700, 4300];
const MAX_SIGNALS = 2;
// Loose preferred route (Programs -> Careers -> Organizations ->
// Opportunities -> Places -> Projects); the scheduler follows it only some
// of the time so the sequence never reads as a rigid loop.
const SIGNAL_ROUTE = [0, 1, 3, 5, 2, 4];
const HUB_GAP = 6;
const NODE_GAP = 9;

// Center -> node spokes in px, measured from layout offsets (not
// getBoundingClientRect) for the nodes, so their CSS drift never shifts a
// line endpoint. Returns null on the stacked mobile layout, where the
// spokes/travelling signals are dropped and only node glows remain.
function measureNetworkSpokes(map) {
  if (!map || window.matchMedia('(max-width: 768px)').matches) return null;
  const center = map.querySelector('.ugw-networkCenter');
  if (!center) return null;
  const mapRect = map.getBoundingClientRect();
  const centerRect = center.getBoundingClientRect();
  const cx = centerRect.left - mapRect.left + centerRect.width / 2;
  const cy = centerRect.top - mapRect.top + centerRect.height / 2;
  const hubRadius = centerRect.width / 2 + HUB_GAP;
  return [...map.querySelectorAll('.ugw-networkNode')].map((node) => {
    const img = node.querySelector('img');
    const imgX = node.offsetLeft + img.offsetLeft + img.offsetWidth / 2;
    const ny = node.offsetTop + img.offsetTop + img.offsetHeight / 2;
    // Left-column nodes have their text between the image and the hub, so
    // their spoke stops at the node's inner edge instead of crossing text.
    const textFacesHub = imgX < cx;
    const nx = textFacesHub ? node.offsetLeft + node.offsetWidth + NODE_GAP : imgX;
    const length = Math.hypot(nx - cx, ny - cy) || 1;
    const ux = (nx - cx) / length;
    const uy = (ny - cy) / length;
    const nodeRadius = textFacesHub ? 0 : img.offsetWidth / 2 + NODE_GAP;
    return {
      x1: cx + ux * hubRadius,
      y1: cy + uy * hubRadius,
      x2: nx - ux * nodeRadius,
      y2: ny - uy * nodeRadius,
    };
  });
}

function randomBetween([min, max]) {
  return min + Math.random() * (max - min);
}

// Category key for each network node, from the node's own title (the six
// nodes are exactly the six discovery object types).
const NETWORK_TYPE_KEYS = NETWORK_ITEMS.map((item) => typeKeyForPlural(item.title));

function NetworkModule({ animate, navigate }) {
  const mapRef = useRef(null);
  const [spokes, setSpokes] = useState(null);
  const [signals, setSignals] = useState([]);
  const [receiving, setReceiving] = useState([]);
  const [inView, setInView] = useState(false);
  const [selected, setSelected] = useState('');
  const discovery = useDiscovery();

  // Relationship explorer (Phase 3): category-level edges derived from the
  // canonical index only. With no selection the network behaves exactly as
  // before; selecting a node emphasizes the categories it really connects to.
  const relations = useMemo(() => (discovery.phase === 'ready' ? typeRelationships(discovery.index) : null), [discovery.phase, discovery.index]);
  const related = useMemo(() => (selected && relations ? relations.get(selected) || new Map() : new Map()), [selected, relations]);
  const nodeState = (typeKey) => {
    if (!selected) return '';
    if (typeKey === selected) return ' is-selected';
    return related.has(typeKey) ? ' is-related' : ' is-dimmed';
  };
  // Signals keep flowing, but only toward the selection and its relations.
  const signalTargets = useRef(null);
  signalTargets.current = selected
    ? NETWORK_TYPE_KEYS.map((key, index) => (key === selected || related.has(key) ? index : -1)).filter((index) => index >= 0)
    : null;
  const toggle = (typeKey) => setSelected((current) => (current === typeKey ? '' : typeKey));

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    const update = () => setSpokes(measureNetworkSpokes(map));
    update();
    const resize = new ResizeObserver(update);
    resize.observe(map);
    const visibility = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    visibility.observe(map);
    return () => {
      resize.disconnect();
      visibility.disconnect();
    };
  }, []);

  // Signal scheduler: plain timeouts (no rAF loop), only while the section
  // is on screen, the tab is visible, and reduced motion is off.
  useEffect(() => {
    if (!animate || !inView) {
      setSignals([]);
      setReceiving([]);
      return undefined;
    }
    const timers = new Set();
    const later = (fn, ms) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };
    let active = 0;
    let serial = 0;
    let routeStep = Math.floor(Math.random() * SIGNAL_ROUTE.length);
    let lastIndex = -1;

    const pickNode = () => {
      const targets = signalTargets.current;
      if (targets?.length) {
        const pool = targets.length > 1 ? targets.filter((index) => index !== lastIndex) : targets;
        return pool[Math.floor(Math.random() * pool.length)];
      }
      if (Math.random() < 0.55) {
        routeStep = (routeStep + 1) % SIGNAL_ROUTE.length;
        if (SIGNAL_ROUTE[routeStep] !== lastIndex) return SIGNAL_ROUTE[routeStep];
      }
      let index = lastIndex;
      while (index === lastIndex) index = Math.floor(Math.random() * NETWORK_ITEMS.length);
      return index;
    };

    const launch = () => {
      if (active < MAX_SIGNALS) {
        const index = pickNode();
        const id = serial += 1;
        lastIndex = index;
        active += 1;
        setSignals((current) => [...current, { id, index }]);
        later(() => {
          setReceiving((current) => [...current, id + ':' + index]);
          later(() => setReceiving((current) => current.filter((key) => key !== id + ':' + index)), NODE_RECEIVE_MS);
        }, SIGNAL_TRAVEL_MS * 0.86);
        later(() => {
          active -= 1;
          setSignals((current) => current.filter((signal) => signal.id !== id));
        }, SIGNAL_TRAVEL_MS);
      }
      later(launch, randomBetween(SIGNAL_GAP_MS));
    };
    later(launch, randomBetween([600, 1800]));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [animate, inView]);

  const isReceiving = (index) => receiving.some((key) => key.endsWith(':' + index));

  return (
    <section className="ugw-network" aria-labelledby="ugw-network-heading">
      <SectionHeader eyebrow="See How It's Connected" title="Explore relationships across the ecosystem." headingId="ugw-network-heading" />
      <div
        className={`ugw-networkMap${selected ? ' has-selection' : ''}`}
        ref={mapRef}
        onKeyDown={(event) => { if (event.key === 'Escape' && selected) { event.stopPropagation(); setSelected(''); } }}
      >
        {spokes && (
          <svg className="ugw-networkSpokes" aria-hidden="true" focusable="false">
            {spokes.map((spoke, index) => (
              <line key={NETWORK_ITEMS[index].title} className={`ugw-networkSpoke ugw-networkSpoke--${index + 1}${nodeState(NETWORK_TYPE_KEYS[index])}`} {...spoke} />
            ))}
            {signals.map(({ id, index }) => {
              const spoke = spokes[index];
              return spoke ? (
                <g
                  key={id}
                  className="ugw-networkSignal"
                  style={{
                    '--x1': `${spoke.x1}px`,
                    '--y1': `${spoke.y1}px`,
                    '--x2': `${spoke.x2}px`,
                    '--y2': `${spoke.y2}px`,
                    '--travel': `${SIGNAL_TRAVEL_MS}ms`,
                  }}
                >
                  <circle className="ugw-networkSignalGlow" r="6" />
                  <circle className="ugw-networkSignalCore" r="2.2" />
                </g>
              ) : null;
            })}
          </svg>
        )}
        <span className="ugw-networkCenterHalo" aria-hidden="true" />
        <div className="ugw-networkCenter">
          <img className="ugw-networkCenterPlanet" src={NETWORK_CENTER_PLANET} alt="" aria-hidden="true" draggable="false" loading="lazy" decoding="async" />
          <span className="ugw-networkCenterLabel" id="ugw-network-title">Silicon Heartland<br />Ecosystem</span>
        </div>
        {NETWORK_ITEMS.map((item, index) => (
          <article
            key={item.title}
            className={`ugw-networkNode ugw-networkNode--${index + 1}${isReceiving(index) ? ' is-receiving' : ''}${nodeState(NETWORK_TYPE_KEYS[index])}`}
            tabIndex={0}
            role="button"
            aria-pressed={selected === NETWORK_TYPE_KEYS[index]}
            aria-controls="ugw-network-panel"
            onClick={() => toggle(NETWORK_TYPE_KEYS[index])}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggle(NETWORK_TYPE_KEYS[index]);
              }
            }}
          >
            <img src={item.image} alt="" loading="lazy" decoding="async" />
            <div>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          </article>
        ))}
      </div>
      <NetworkPanel
        selected={selected}
        related={related}
        discovery={discovery}
        navigate={navigate}
        onClose={() => setSelected('')}
      />
      <RouteLink className="ugw-outlineButton" to={discoverRouteFor()} navigate={navigate}>Explore the Full Network <span aria-hidden="true">&rarr;</span></RouteLink>
    </section>
  );
}

const NETWORK_PANEL_LIMIT = 4;

// Compact details for the selected category: live canonical count, the
// categories it is really connected to (with edge counts), a few records,
// and an explicit CTA. Nothing navigates until the user chooses to.
function NetworkPanel({ selected, related, discovery, navigate, onClose }) {
  const type = typeByKey(selected);
  const ready = discovery.phase === 'ready';
  const objects = ready && type ? objectsOfType(discovery.index, selected) : [];
  const status = discovery.status?.[selected];
  return (
    <div id="ugw-network-panel" className={`ugw-networkPanel${type ? ' is-open' : ''}`} aria-live="polite">
      {!type && <p className="ugw-networkHint">Select a category to see how it connects across the ecosystem.</p>}
      {type && (
        <>
          <div className="ugw-networkPanelHeader">
            <div>
              <p className="ugw-networkPanelEyebrow">{type.plural}</p>
              <strong>
                {!ready ? 'Loading…' : objects.length
                  ? `${objects.length} published ${objects.length === 1 ? type.label.toLowerCase() : type.plural.toLowerCase()}`
                  : status === 'error' ? `${type.plural} are unavailable right now` : `No ${type.plural.toLowerCase()} published yet`}
              </strong>
            </div>
            <button type="button" className="ugw-textButton" onClick={onClose}>Clear</button>
          </div>
          {ready && (
            <p className="ugw-networkPanelRelations">
              {related.size
                ? <>Connected to {[...related].map(([key, count], index) => (
                  <React.Fragment key={key}>{index ? ', ' : ''}<b>{typeByKey(key).plural}</b> ({count} relationship{count === 1 ? '' : 's'})</React.Fragment>
                ))}.</>
                : 'No cross-category relationships are published for this category yet.'}
            </p>
          )}
          {objects.length > 0 && (
            <ul className="ugw-networkPanelList">
              {[...objects].sort((a, b) => (a.kind === 'Pathway' ? -1 : b.kind === 'Pathway' ? 1 : 0)).slice(0, NETWORK_PANEL_LIMIT).map((object) => (
                <li key={object.key}>
                  <RouteLink to={object.detailRoute} navigate={navigate}>{object.title}</RouteLink>
                  <span>{object.kind}</span>
                </li>
              ))}
            </ul>
          )}
          <RouteLink className="ugw-pillButton" to={discoverRouteFor({ type: selected })} navigate={navigate}>
            View Details <span aria-hidden="true">&rarr;</span>
          </RouteLink>
        </>
      )}
    </div>
  );
}

function ActivityList({ navigate }) {
  return (
    <section className="ugw-activity" aria-labelledby="ugw-activity-heading" data-content-class="editorial">
      <SectionHeader
        eyebrow="Latest Activity"
        title="What's happening across the Silicon Heartland Universe."
        editorialNote="Illustrative sample activity — not a live feed; items and times are examples."
        headingId="ugw-activity-heading"
        navigate={navigate}
        action={{ to: discoverRouteFor(), label: 'View All' }}
      />
      <ul>
        {ACTIVITY_ITEMS.map((item) => (
          <li key={`${item.type}-${item.title}`}>
            <img src={item.image} alt="" loading="lazy" decoding="async" />
            <div>
              <p><strong>{item.type}</strong> <span>{item.meta}</span></p>
              <h3>{item.title}</h3>
            </div>
            <time>{item.time}</time>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StoryCard({ item }) {
  return (
    <article className={`ugw-storyCard${item.photo ? ' ugw-storyCard--photo' : ''}`}>
      <img
        src={item.image}
        srcSet={contentSrcSet(item.image)}
        sizes="(max-width: 768px) 92vw, 33vw"
        alt=""
        loading="lazy"
        decoding="async"
        style={item.position ? { objectPosition: item.position } : undefined}
      />
      <div>
        <p>{item.type}</p>
        <h3>{item.title}</h3>
        <span>{item.text}</span>
      </div>
    </article>
  );
}

// Shared SHU page chrome: background art, stars, dust, galaxy swirl, top
// bar, layout column and footer. The directory, Discover and object detail
// pages all render inside it, so the locked visual system is identical
// everywhere. `searchHref` points the top-bar search icon at the page's own
// search input (gateway) or at Discover (other pages).
export function GatewayShell({ navigate, className = '', ariaLabel, searchHref = '#ugw-search-input', children }) {
  const paused = useMotionPause();
  const reducedMotion = useReducedMotion();
  return (
    <main
      className={`ugw-page${paused ? ' motion-paused' : ''}${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
    >
      <UniverseBackground />
      <StarField />
      <SolarDustCanvas reducedMotion={reducedMotion} />
      <GalaxySwirl />

      <header className="ugw-topbar">
        <button type="button" className="ugw-brand" onClick={() => navigate(CANONICAL_UNIVERSE_ROUTE)} aria-label="Return to Silicon Heartland Universe cover">
          <span className="ugw-brandMark" aria-hidden="true"><span /></span>
          <span>Silicon Heartland <b>Universe</b></span>
        </button>
        <nav className="ugw-nav" aria-label="Universe sections">
          {['Explore', 'Learn', 'Work', 'Build', 'Community', 'About'].map((item) => (
            <a key={item} href={`#${slugify(item)}`}>{item}</a>
          ))}
        </nav>
        <div className="ugw-topActions">
          {searchHref.startsWith('/')
            ? <RouteLink className="ugw-iconLink" to={searchHref} navigate={navigate} aria-label="Search"><Icon name="search" /></RouteLink>
            : <a className="ugw-iconLink" href={searchHref} aria-label="Search"><Icon name="search" /></a>}
          <a href="#sign-in">Sign In</a>
          <a className="ugw-joinButton" href="#join">Join the Universe <span aria-hidden="true">&rarr;</span></a>
        </div>
      </header>

      <div className="ugw-layout">
        {children}

        <footer className="ugw-footer">
          <div className="ugw-brand">
            <span className="ugw-brandMark" aria-hidden="true"><span /></span>
            <span>Silicon Heartland <b>Universe</b></span>
          </div>
          <p>A Stronger Region. A Brighter Tomorrow.</p>
          <nav aria-label="Universe footer">
            <a href="#about">About</a>
            <a href="#news">News</a>
            <a href="#contact">Contact</a>
          </nav>
        </footer>
      </div>
    </main>
  );
}

export default function UniverseGateway({ navigate }) {
  const paused = useMotionPause();
  const reducedMotion = useReducedMotion();

  // Identical decision to every other entry point (UniverseV1Lab's own
  // enterDestination, the retired UniverseDirectory) — same registry
  // functions, same same-origin-app/independent-local-app hard-navigation
  // rule, no re-derivation of navigation logic here.
  // The entry hook only adds the short Phase 4 transition (skipped for
  // reduced motion) and never runs for unavailable destinations.
  const { entering, enter: enterDestination } = useDestinationEntry(navigate);

  const visibleDestinations = destinations.filter((item) => item.universeVisible !== false);
  const heroDestinations = HERO_DESTINATION_IDS
    .map((id) => visibleDestinations.find((item) => item.id === id))
    .filter(Boolean);

  return (
    <GatewayShell navigate={navigate} ariaLabel="Silicon Heartland Universe destination gateway" className={entering ? 'is-entering' : ''}>
      <section className="ugw-hero" aria-labelledby="ugw-intro-title">
        <UniverseIntro navigate={navigate} onEnterDestination={enterDestination} />
        <div className="ugw-destinationCluster" aria-label="Featured Universe destinations">
          {heroDestinations.map((destination, index) => (
            <DestinationPlanet
              key={destination.id}
              destination={destination}
              onEnterDestination={enterDestination}
              index={index}
              entering={entering?.id === destination.id}
            />
          ))}
          <RouteLink className="ugw-viewDestinations" to={discoverRouteFor({ type: 'destinations' })} navigate={navigate}>View All Destinations <span aria-hidden="true">&rarr;</span></RouteLink>
        </div>
      </section>

      <section className="ugw-section" aria-labelledby="ugw-start-heading">
        <SectionHeader eyebrow="Start Here" title="Find your path in the Silicon Heartland ecosystem." headingId="ugw-start-heading" />
        <div className="ugw-audienceGrid">
          {AUDIENCE_CARDS.map((item) => <AudienceCard key={item.title} item={item} />)}
        </div>
      </section>

      <FeaturedSection navigate={navigate} />

      <section className="ugw-section" id="explore-the-ecosystem" aria-labelledby="ugw-explore-heading">
        <SectionHeader eyebrow="Explore the Ecosystem" title="Discover and browse what exists across the Silicon Heartland Universe." headingId="ugw-explore-heading" />
        <div className="ugw-browseGrid">
          {BROWSE_TILES.map((item) => <BrowseTile key={item.title} item={item} navigate={navigate} />)}
        </div>
      </section>

      <div className="ugw-connectionGrid">
        <NetworkModule animate={!paused && !reducedMotion} navigate={navigate} />
        <ActivityList navigate={navigate} />
      </div>

      <section className="ugw-section" aria-labelledby="ugw-stories-heading" data-content-class="editorial">
        <SectionHeader
          eyebrow="Featured Stories"
          title="Real people. Real progress. A stronger region."
          editorialNote="Illustrative stories — images and people are representative, not published records."
          headingId="ugw-stories-heading"
          navigate={navigate}
          action={{ to: discoverRouteFor(), label: 'View All' }}
        />
        <div className="ugw-storyGrid">
          {STORY_ITEMS.map((item) => <StoryCard key={item.title} item={item} />)}
        </div>
      </section>
      {entering && <p className="ugw-entryLabel" role="status">Entering {entering.label}</p>}
    </GatewayShell>
  );
}
