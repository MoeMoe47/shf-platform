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
import React, { useEffect, useRef, useState } from 'react';
import { destinations } from '../destinations.js';
import {
  CANONICAL_UNIVERSE_ROUTE,
  isDestinationAvailable,
  needsHardNavigation,
  resolveDestinationHref,
} from '../universeDestinationRegistry.js';

const GATEWAY_BACKGROUND_SOURCE = '/assets/shu/SHU_DIRECTORY_BACKGROUND_MASTER_V2.png';

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
        Explore programs, careers, organizations, projects, places and opportunities across the
        Silicon Heartland ecosystem.
      </p>
      <form className="ugw-search" role="search" aria-label="Search the Silicon Heartland Universe">
        <Icon name="search" />
        <label className="ugw-srOnly" htmlFor="ugw-search-input">Search the universe</label>
        <input id="ugw-search-input" type="search" placeholder="Search the universe..." />
        <button type="submit" aria-label="Search">&rarr;</button>
      </form>
      <div className="ugw-searchChips" aria-label="Universe search categories">
        {SEARCH_CHIPS.map((chip) => (
          <a key={chip} href={`#${slugify(chip)}`}>{chip}</a>
        ))}
      </div>
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

const SEARCH_CHIPS = ['Programs', 'Careers', 'Organizations', 'Projects', 'Places', 'Opportunities'];

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
    image: '/assets/metaverse/facilities/data-center-training-facility.png',
    tags: ['Education', 'Workforce', 'Community'],
    cta: 'View Program',
  },
  {
    type: 'Career',
    title: 'Data Center Technician',
    text: 'High-demand career supporting digital infrastructure.',
    image: '/assets/career/pathways/grid-data-analytics.jpg',
    tags: ['Training', 'In Demand', 'Good Job'],
    cta: 'View Career',
  },
  {
    type: 'Organization',
    title: 'Silicon Heartland Foundation',
    text: 'Building equitable growth through education, workforce and community.',
    image: '/assets/foundation/hero-main.jpg',
    tags: ['Nonprofit', 'Education', 'Community'],
    cta: 'View Organization',
  },
  {
    type: 'Project',
    title: 'Central Ohio Data Center Corridor',
    text: 'Expanding digital infrastructure and opportunity in the region.',
    image: '/assets/metaverse/districts/data-center-district-overview.png',
    tags: ['Infrastructure', 'Economic Growth'],
    cta: 'View Project',
  },
  {
    type: 'Opportunity',
    title: 'Data Center Training Program',
    text: 'Now enrolling for upcoming cohorts.',
    image: '/assets/metaverse/facilities/northstar-data-center-facility.png',
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

const NETWORK_ITEMS = [
  { title: 'Programs', text: 'Create learning opportunities', image: '/assets/metaverse/facilities/data-center-training-facility.png' },
  { title: 'Careers', text: 'Lead to pathways and good jobs', image: '/assets/career/pathways/cta-people.jpg' },
  { title: 'Places', text: 'Connect real world and Metaverse', image: '/assets/metaverse/city/silicon-heartland-city-day.png' },
  { title: 'Organizations', text: 'Operate and partner on initiatives', image: '/assets/foundation/hero-main.jpg' },
  { title: 'Projects', text: 'Deliver solutions and infrastructure', image: '/assets/metaverse/facilities/infrastructure-project-work-zone.png' },
  { title: 'Opportunities', text: 'Create access and growth', image: '/assets/metaverse/districts/community-district-public-realm.png' },
];

const ACTIVITY_ITEMS = [
  { type: 'Program', meta: 'New cohort announced', title: 'Data Center Training Program - Fall 2025', time: '2 hours ago', image: '/assets/metaverse/facilities/data-center-training-facility.png' },
  { type: 'Organization', meta: 'Partnership', title: 'SHF and regional employers expand workforce initiative', time: '5 hours ago', image: '/assets/foundation/hero-main.jpg' },
  { type: 'Opportunity', meta: 'Now open', title: 'Applications open for Data Center Scholarships', time: '1 day ago', image: '/assets/metaverse/districts/community-district-public-realm.png' },
  { type: 'Project', meta: 'Milestone', title: 'Central Ohio Data Center Corridor reaches new milestone', time: '2 days ago', image: '/assets/metaverse/districts/data-center-district-overview.png' },
  { type: 'Career', meta: 'In demand', title: 'Data Center Technician ranked among top growth careers', time: '3 days ago', image: '/assets/career/pathways/grid-skilled-trades.jpg' },
];

const STORY_ITEMS = [
  {
    type: 'Workforce',
    title: 'From Training to a Career',
    text: "A local student's journey into the data center industry.",
    image: '/assets/career/pathways/cta-people.jpg',
  },
  {
    type: 'Community',
    title: 'Building Opportunity',
    text: 'How Silicon Heartland is powering regional growth.',
    image: '/assets/metaverse/districts/community-district-public-realm.png',
  },
  {
    type: 'Innovation',
    title: 'A More Connected Region',
    text: 'Education, infrastructure and community working together.',
    image: '/assets/metaverse/districts/technology-innovation-district-overview.png',
  },
];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function Icon({ name }) {
  const common = { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' };
  if (name === 'search') return (
    <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M16 16l5 5" /></svg>
  );
  if (name === 'cap') return (
    <svg {...common}><path d="M3 8l9-4 9 4-9 4-9-4z" /><path d="M7 10v5c2 2 8 2 10 0v-5" /></svg>
  );
  if (name === 'book') return (
    <svg {...common}><path d="M5 5h7v14H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" /><path d="M12 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7V5z" /></svg>
  );
  if (name === 'briefcase') return (
    <svg {...common}><path d="M9 7V5h6v2" /><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M3 12h18M10 12v2h4v-2" /></svg>
  );
  if (name === 'people') return (
    <svg {...common}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 19c.7-3.4 2.7-5 6-5s5.3 1.6 6 5" /><path d="M14 15c2.8.1 4.6 1.5 5.4 4" /></svg>
  );
  if (name === 'building') return (
    <svg {...common}><path d="M5 21V4h9v17" /><path d="M14 9h5v12" /><path d="M8 8h3M8 12h3M8 16h3M16 13h1M16 17h1" /></svg>
  );
  if (name === 'rocket') return (
    <svg {...common}><path d="M14 4c3 1 5 3 6 6l-7 7-6-6 7-7z" /><path d="M7 11l-3 1 2 2-1 3 3-2M14 4l-1 5 5-1" /></svg>
  );
  if (name === 'pin') return (
    <svg {...common}><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
  );
  if (name === 'hand') return (
    <svg {...common}><path d="M7 12V6a1.5 1.5 0 0 1 3 0v5" /><path d="M10 11V5a1.5 1.5 0 0 1 3 0v6" /><path d="M13 11V7a1.5 1.5 0 0 1 3 0v7" /><path d="M7 12l-2-2a1.6 1.6 0 0 0-2.2 2.3l5.5 6.2A5 5 0 0 0 12 20h2a5 5 0 0 0 5-5v-3" /></svg>
  );
  if (name === 'ticket') return (
    <svg {...common}><path d="M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 1 0-4V4H4v4z" /><path d="M9 7h6M9 13h6" /></svg>
  );
  return (
    <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="ugw-sectionHeader">
      <div>
        <p className="ugw-sectionEyebrow">{eyebrow}</p>
        {title && <p className="ugw-sectionCopy">{title}</p>}
      </div>
      {action && <a className="ugw-sectionAction" href={action.href}>{action.label} <span aria-hidden="true">&rarr;</span></a>}
    </div>
  );
}

function DestinationPlanet({ destination, onEnterDestination, index }) {
  const available = isDestinationAvailable(destination);
  const text = HERO_DESTINATION_LABELS[destination.id] || { title: destination.label, subtitle: destination.title };
  const image = planetImageForDestination(destination, index);
  return (
    <button
      type="button"
      className={`ugw-destinationPlanet${available ? '' : ' is-unavailable'}`}
      data-destination-id={destination.id}
      onClick={() => onEnterDestination(destination)}
      disabled={!available}
      aria-label={`${text.title}: ${text.subtitle}`}
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

function FeaturedCard({ item }) {
  return (
    <article className="ugw-featureCard">
      <img src={item.image} alt="" loading="lazy" decoding="async" />
      <div>
        <p>{item.type}</p>
        <h3>{item.title}</h3>
        <span>{item.text}</span>
        <ul aria-label={`${item.title} metadata`}>
          {item.tags.map((tag) => <li key={tag}>{tag}</li>)}
        </ul>
        <a href={`#${slugify(item.type)}`}>{item.cta} <span aria-hidden="true">&rarr;</span></a>
      </div>
    </article>
  );
}

function BrowseTile({ item }) {
  return (
    <a className="ugw-browseTile" href={`#${slugify(item.title)}`} id={slugify(item.title)}>
      <span className="ugw-cardIcon"><Icon name={item.icon} /></span>
      <strong>{item.title}</strong>
      <span>{item.text}</span>
      <i aria-hidden="true">&rarr;</i>
    </a>
  );
}

function NetworkModule() {
  return (
    <section className="ugw-network" aria-labelledby="ugw-network-title">
      <SectionHeader eyebrow="See How It's Connected" title="Explore relationships across the ecosystem." />
      <div className="ugw-networkMap">
        <div className="ugw-networkCenter" id="ugw-network-title">Silicon Heartland<br />Ecosystem</div>
        {NETWORK_ITEMS.map((item, index) => (
          <article key={item.title} className={`ugw-networkNode ugw-networkNode--${index + 1}`}>
            <img src={item.image} alt="" loading="lazy" decoding="async" />
            <div>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          </article>
        ))}
      </div>
      <a className="ugw-outlineButton" href="#explore-the-ecosystem">Explore the Full Network <span aria-hidden="true">&rarr;</span></a>
    </section>
  );
}

function ActivityList() {
  return (
    <section className="ugw-activity" aria-labelledby="ugw-activity-title">
      <SectionHeader
        eyebrow="Latest Activity"
        title="What's happening across the Silicon Heartland Universe."
        action={{ href: '#featured-across-the-ecosystem', label: 'View All' }}
      />
      <div id="ugw-activity-title" className="ugw-srOnly">Latest Activity</div>
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
    <article className="ugw-storyCard">
      <img src={item.image} alt="" loading="lazy" decoding="async" />
      <div>
        <p>{item.type}</p>
        <h3>{item.title}</h3>
        <span>{item.text}</span>
      </div>
    </article>
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

  const visibleDestinations = destinations.filter((item) => item.universeVisible !== false);
  const heroDestinations = HERO_DESTINATION_IDS
    .map((id) => visibleDestinations.find((item) => item.id === id))
    .filter(Boolean);

  return (
    <main
      className={`ugw-page${paused ? ' motion-paused' : ''}`}
      aria-label="Silicon Heartland Universe destination gateway"
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
          <a className="ugw-iconLink" href="#ugw-search-input" aria-label="Search"><Icon name="search" /></a>
          <a href="#sign-in">Sign In</a>
          <a className="ugw-joinButton" href="#join">Join the Universe <span aria-hidden="true">&rarr;</span></a>
        </div>
      </header>

      <div className="ugw-layout">
        <section className="ugw-hero" aria-labelledby="ugw-intro-title">
          <UniverseIntro />
          <div className="ugw-destinationCluster" aria-label="Featured Universe destinations">
            {heroDestinations.map((destination, index) => (
              <DestinationPlanet
                key={destination.id}
                destination={destination}
                onEnterDestination={enterDestination}
                index={index}
              />
            ))}
            <a className="ugw-viewDestinations" href="#explore-the-ecosystem">View All Destinations <span aria-hidden="true">&rarr;</span></a>
          </div>
        </section>

        <section className="ugw-section" aria-labelledby="ugw-start-title">
          <SectionHeader eyebrow="Start Here" title="Find your path in the Silicon Heartland ecosystem." />
          <div id="ugw-start-title" className="ugw-srOnly">Start Here</div>
          <div className="ugw-audienceGrid">
            {AUDIENCE_CARDS.map((item) => <AudienceCard key={item.title} item={item} />)}
          </div>
        </section>

        <section className="ugw-section" id="featured-across-the-ecosystem" aria-labelledby="ugw-featured-title">
          <SectionHeader
            eyebrow="Featured Across the Ecosystem"
            action={{ href: '#explore-the-ecosystem', label: 'View All' }}
          />
          <div id="ugw-featured-title" className="ugw-filterRow" aria-label="Featured filters">
            <button type="button" className="is-active">All</button>
            {SEARCH_CHIPS.map((chip) => <a key={chip} href={`#${slugify(chip)}`}>{chip}</a>)}
          </div>
          <div className="ugw-featureGrid">
            {FEATURED_ITEMS.map((item) => <FeaturedCard key={item.title} item={item} />)}
          </div>
        </section>

        <section className="ugw-section" id="explore-the-ecosystem" aria-labelledby="ugw-explore-title">
          <SectionHeader eyebrow="Explore the Ecosystem" title="Discover and browse what exists across the Silicon Heartland Universe." />
          <div id="ugw-explore-title" className="ugw-browseGrid">
            {BROWSE_TILES.map((item) => <BrowseTile key={item.title} item={item} />)}
          </div>
        </section>

        <div className="ugw-connectionGrid">
          <NetworkModule />
          <ActivityList />
        </div>

        <section className="ugw-section" aria-labelledby="ugw-stories-title">
          <SectionHeader
            eyebrow="Featured Stories"
            title="Real people. Real progress. A stronger region."
            action={{ href: '#stories', label: 'View All' }}
          />
          <div id="ugw-stories-title" className="ugw-storyGrid">
            {STORY_ITEMS.map((item) => <StoryCard key={item.title} item={item} />)}
          </div>
        </section>

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
