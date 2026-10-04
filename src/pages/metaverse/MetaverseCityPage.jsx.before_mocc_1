import React, { useEffect, useMemo, useRef, useState } from "react";
import MetaverseSidebar from "@/components/metaverse/MetaverseSidebar.jsx";
import MetaverseBreadcrumbs from "@/components/metaverse/MetaverseBreadcrumbs.jsx";
import MetaverseActivityMount from "@/components/metaverse/MetaverseActivityMount.jsx";
import MetaverseCamera from "@/components/metaverse/MetaverseCamera.jsx";
import MetaverseCameraControls from "@/components/metaverse/MetaverseCameraControls.jsx";
import MetaverseContextPanel from "@/components/metaverse/MetaverseContextPanel.jsx";
import MetaverseLocationNavigator from "@/components/metaverse/MetaverseLocationNavigator.jsx";
import MetaverseParticipantList from "@/components/metaverse/MetaverseParticipantList.jsx";
import MetaverseChatTray from "@/components/metaverse/MetaverseChatTray.jsx";
import MetaverseMissionList from "@/components/metaverse/MetaverseMissionList.jsx";
import MetaverseOpportunityExchange from "@/components/metaverse/MetaverseOpportunityExchange.jsx";
import MetaverseMarket from "@/components/metaverse/MetaverseMarket.jsx";
import MetaverseWorkPassport from "@/components/metaverse/MetaverseWorkPassport.jsx";
import MetaverseNextAction from "@/components/metaverse/MetaverseNextAction.jsx";
import MetaverseDailyBriefing from "@/components/metaverse/MetaverseDailyBriefing.jsx";
import MetaverseDistrictPulse from "@/components/metaverse/MetaverseDistrictPulse.jsx";
import MetaverseCityEvents from "@/components/metaverse/MetaverseCityEvents.jsx";
import MetaverseFastTravel from "@/components/metaverse/MetaverseFastTravel.jsx";
import MetaverseMiniMap from "@/components/metaverse/MetaverseMiniMap.jsx";
import MetaverseBuildingPreview from "@/components/metaverse/MetaverseBuildingPreview.jsx";
import MetaverseCivicHall from "@/components/metaverse/MetaverseCivicHall.jsx";
import MetaverseEnterpriseHub from "@/components/metaverse/enterprise/MetaverseEnterpriseHub.jsx";
import MetaverseLivingCityLayer from "@/components/metaverse/living-city/MetaverseLivingCityLayer.jsx";
import MetaverseRiverTraceAuthoringOverlay from "@/components/metaverse/MetaverseRiverTraceAuthoringOverlay.jsx";
import MetaverseRiverTraceAuthoringPanel from "@/components/metaverse/MetaverseRiverTraceAuthoringPanel.jsx";
import MetaverseRegionalScenePage from "@/pages/metaverse/MetaverseRegionalScenePage.jsx";
import OceanEngineDevPage from "@/pages/metaverse/OceanEngineDevPage.jsx";
import MetaverseDevConsole, { MetaverseWeatherDevSection } from "@/components/metaverse/MetaverseDevConsole.jsx";
import MetaverseWeatherEnvironmentLayer from "@/components/metaverse/MetaverseWeatherEnvironmentLayer.jsx";
import useMetaverseEnvironmentRuntime from "@/hooks/metaverse/useMetaverseEnvironmentRuntime.js";
import { getMetaverseDevCapabilities } from "@/system/metaverse/metaverseDevCapabilities.js";
import {
  METAVERSE_ACTIVITY_PLACEHOLDERS,
  METAVERSE_DISTRICTS,
  METAVERSE_NAVIGATION_MODEL_META,
  findProductionEnvironmentAsset,
  getActivitiesForFacility,
  getBreadcrumbs,
  getDistrictById,
  getFacilityById,
  publicAssetUrl,
} from "@/system/metaverse/metaverseNavigationModel.js";
import {
  METAVERSE_TIME_OF_DAY_MODES,
  resolveMetaverseAssetVariant,
  resolveMetaverseDevModeEnabled,
  resolveMetaverseTimeOfDay,
} from "@/system/metaverse/metaverseTimeOfDay.js";
import { resolveDayBirdsReviewEnabled } from "@/system/metaverse/dayBirdRegistry.js";
import { resolveDayWaterReviewEnabled } from "@/system/metaverse/dayWaterRegistry.js";
import { resolveDayRapidsMotionReviewEnabled } from "@/system/metaverse/dayRapidsMotionRegistry.js";
import {
  canEnterMetaverseResource,
  resolveMetaverseUiUnlock,
} from "@/system/metaverse/metaverseUnlockProjection.js";
import {
  canUseMetaverseDevFixture,
  requestMetaverseEntry,
} from "@/system/metaverse/metaverseRuntimeClient.js";
import {
  getCityPresence,
  getOrCreateRoom,
  getRoomParticipants,
  getRoomsPolicy,
  heartbeatPresence,
  revokePresence,
  startPresence,
} from "@/system/metaverse/metaverseCommunicationClient.js";
import { listMissions, enterMission as enterMissionApi } from "@/system/metaverse/metaverseMissionClient.js";
import { listOpportunities } from "@/system/metaverse/metaverseOpportunityClient.js";
import { getMarketBalance, listMarketListings, listMarketOrders } from "@/system/metaverse/metaverseMarketClient.js";
import { listMyEnterprises, listMyStudioTeams } from "@/system/metaverse/metaverseEnterpriseClient.js";
import { getMyWorkPassport } from "@/system/metaverse/metaversePassportClient.js";
import { fastTravel as fastTravelApi, getCityOrchestration } from "@/system/metaverse/metaverseOrchestrationClient.js";
import { resolveDevUserId } from "@/lib/liveLearning/api.js";
import { resolveTrafficAuthoringEnabled } from "@/system/metaverse/traffic/metaverseTrafficAuthoringModel.js";
import {
  METAVERSE_CAMERA_PAN_BOUNDS,
  resolveSafePanBoundPercentAtZoom,
  resolveSafeZoomForPan,
} from "@/system/metaverse/metaverseCameraProjection.js";
import { getRegionalSceneBySlug } from "@/system/metaverse/regionalSceneRegistry.js";
import useMetaverseTrafficAuthoring from "@/hooks/metaverse/useMetaverseTrafficAuthoring.js";
import useMetaverseTrafficLivePreview from "@/hooks/metaverse/useMetaverseTrafficLivePreview.js";
import useMetaverseRiverTrace, { resolveRiverTraceEnabled } from "@/hooks/metaverse/useMetaverseRiverTrace.js";
import useMetaverseRiverFlowPreview from "@/hooks/metaverse/useMetaverseRiverFlowPreview.js";
import MetaverseTrafficAuthoringPanel from "@/components/metaverse/traffic-authoring/MetaverseTrafficAuthoringPanel.jsx";
import MetaverseTrafficAuthoringOverlay from "@/components/metaverse/traffic-authoring/MetaverseTrafficAuthoringOverlay.jsx";
import MetaverseTrafficAuthoringErrorBoundary from "@/components/metaverse/traffic-authoring/MetaverseTrafficAuthoringErrorBoundary.jsx";
import "./metaverse-city.css";

const PRESENCE_HEARTBEAT_INTERVAL_MS = 25000;
const CITY_PRESENCE_POLL_MS = 15000;
const ROOM_PARTICIPANTS_POLL_MS = 10000;
const MISSIONS_POLL_MS = 30000;
const OPPORTUNITIES_POLL_MS = 30000;
const MARKET_POLL_MS = 30000;
const ENTERPRISE_POLL_MS = 30000;
const PASSPORT_POLL_MS = 45000;
const ORCHESTRATION_POLL_MS = 30000;

const CAMERA_HOME = { x: 0, y: 0, zoom: 1 };
const CIVIC_HALL_LABEL = "Civic Hall";
const METAVERSE_CITY_ROUTE = "/metaverse/city";

const MET_HOME_ASSETS = {
  logo: "/assets/metaverse/branding/silicon-heartland-metaverse-logo-white.png",
  hero: "/assets/metaverse/city/silicon-heartland-city-day.png",
  dusk: "/assets/metaverse/city/silicon-heartland-city-dusk.png",
  overview: "/assets/metaverse/city/silicon-heartland-city-master-overview.png",
  map: "/assets/metaverse/minimap/silicon-heartland-metaverse-top-map.png",
  foundation: "/assets/foundation/hero-main.jpg",
  dataCenter: "/assets/metaverse/facilities/data-center-training-facility.png",
  innovation: "/assets/metaverse/districts/technology-innovation-district-overview.png",
  community: "/assets/metaverse/districts/community-district-public-realm.png",
  career: "/assets/metaverse/districts/career-education-district-university-overview.png",
};

const MET_HOME_PATHWAYS = [
  { icon: "book", title: "Learn", text: "Education for what's next" },
  { icon: "work", title: "Work", text: "Careers and opportunity" },
  { icon: "gear", title: "Build", text: "Create and innovate" },
  { icon: "people", title: "Serve", text: "Stronger communities" },
  { icon: "spark", title: "Create", text: "Bring ideas to life" },
  { icon: "compass", title: "Explore", text: "Discover the Heartland" },
];

const MET_HOME_FEATURED = [
  {
    type: "Program",
    title: "AI Workforce Readiness",
    text: "Skills for tomorrow, today.",
    image: MET_HOME_ASSETS.dataCenter,
  },
  {
    type: "Opportunity",
    title: "Clean Energy Careers",
    text: "Powering a sustainable future.",
    image: "/assets/career/pathways/cta-skyline.jpg",
  },
  {
    type: "Organization",
    title: "Silicon Heartland Foundation",
    text: "Education. Opportunity. Community.",
    image: MET_HOME_ASSETS.foundation,
  },
  {
    type: "Project",
    title: "Riverfront Innovation District",
    text: "A hub for people and progress.",
    image: MET_HOME_ASSETS.innovation,
  },
  {
    type: "Story",
    title: "From Learner to Leader",
    text: "Real stories. Real impact.",
    image: MET_HOME_ASSETS.career,
  },
];

function MetHomeIcon({ name }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" };
  if (name === "search") return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M16 16l5 5" /></svg>;
  if (name === "book") return <svg {...common}><path d="M5 5h7v14H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" /><path d="M12 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7V5z" /></svg>;
  if (name === "work") return <svg {...common}><path d="M9 7V5h6v2" /><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M3 12h18M10 12v2h4v-2" /></svg>;
  if (name === "gear") return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></svg>;
  if (name === "people") return <svg {...common}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 19c.7-3.4 2.7-5 6-5s5.3 1.6 6 5" /><path d="M14 15c2.8.1 4.6 1.5 5.4 4" /></svg>;
  if (name === "spark") return <svg {...common}><path d="M12 3l1.5 5.2L19 10l-5.5 1.8L12 17l-1.5-5.2L5 10l5.5-1.8L12 3z" /><path d="M18 15l.7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7L18 15z" /></svg>;
  if (name === "compass") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" /></svg>;
  if (name === "play") return <svg {...common}><path d="M9 7l8 5-8 5V7z" /></svg>;
  if (name === "tree") return <svg {...common}><path d="M12 21v-7" /><path d="M7 14c-3-1-4-5-1-8 2-3 5-2 6 1 1-3 5-4 7-1 3 4 1 8-2 9-2 1-4 0-5-2-1 2-3 2-5 1z" /></svg>;
  if (name === "systems") return <svg {...common}><path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" /><path d="M12 7v10M8 9.5l4 2.5 4-2.5M8 14.5l4-2.5 4 2.5" /></svg>;
  return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

function MetaverseHomePage() {
  return (
    <main className="met-home" aria-label="Silicon Heartland Metaverse home">
      <section className="met-home__hero" style={{ "--met-hero-image": `url(${MET_HOME_ASSETS.hero})` }}>
        <header className="met-home__nav">
          <a className="met-home__brand" href="/metaverse" aria-label="Silicon Heartland Metaverse home">
            <img src={MET_HOME_ASSETS.logo} alt="Silicon Heartland Metaverse" />
          </a>
          <nav className="met-home__links" aria-label="Metaverse sections">
            {["Explore", "Learn", "Work", "Build", "Serve", "Create"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}>{item}</a>
            ))}
          </nav>
          <div className="met-home__actions">
            <a className="met-home__searchLink" href="#met-home-search" aria-label="Search"><MetHomeIcon name="search" /></a>
            <a className="met-home__signIn" href="/login">Sign In</a>
            <a className="met-home__primary" href={METAVERSE_CITY_ROUTE}>Enter the Metaverse</a>
          </div>
        </header>

        <div className="met-home__heroGrid">
          <div className="met-home__intro">
            <p className="met-home__overline">People &bull; Places &bull; Opportunities &bull; A Stronger Tomorrow</p>
            <h1><span>Silicon Heartland</span><span>Metaverse</span></h1>
            <p>A connected ecosystem for learning, work, building and community.</p>
            <form className="met-home__search" role="search" aria-label="Search the Metaverse">
              <MetHomeIcon name="search" />
              <label htmlFor="met-home-search" className="met-home__sr">Search programs, careers, organizations and opportunities</label>
              <input id="met-home-search" type="search" placeholder="Search programs, careers, organizations, opportunities..." />
              <button type="submit" aria-label="Search">-&gt;</button>
            </form>
            <div className="met-home__chips" aria-label="Search categories">
              {["Programs", "Careers", "Organizations", "Projects", "Places", "People"].map((chip) => <a key={chip} href={`#${chip.toLowerCase()}`}>{chip}</a>)}
            </div>
          </div>

          <a className="met-home__video" href={METAVERSE_CITY_ROUTE} aria-label="Watch the Silicon Heartland Metaverse vision">
            <img src={MET_HOME_ASSETS.hero} alt="" />
            <span className="met-home__videoOverline">Discover &bull; Explore &bull; Belong</span>
            <span className="met-home__play"><MetHomeIcon name="play" /></span>
            <span className="met-home__videoTitle">The Heartland Awaits</span>
            <span className="met-home__videoSub">Watch the Vision</span>
            <span className="met-home__duration">2:28</span>
          </a>
        </div>
      </section>

      <section className="met-home__pathways" aria-label="Metaverse pathways">
        {MET_HOME_PATHWAYS.map((item) => (
          <a className="met-home__pathway" href={`#${item.title.toLowerCase()}`} key={item.title}>
            <MetHomeIcon name={item.icon} />
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </a>
        ))}
      </section>

      <section className="met-home__ecosystem" id="explore">
        <div className="met-home__ecosystemCopy">
          <p className="met-home__sectionKicker">The Silicon Heartland Ecosystem</p>
          <h2>Real People. Real Progress.</h2>
          <p>Education, workforce, technology and community, working together to build a stronger, more inclusive tomorrow.</p>
          <a className="met-home__goldButton" href="#featured">Explore the Ecosystem <span aria-hidden="true">-&gt;</span></a>
          <dl className="met-home__metrics">
            <div><dt>1M+</dt><dd>People</dd></div>
            <div><dt>500+</dt><dd>Programs</dd></div>
            <div><dt>10K+</dt><dd>Opportunities</dd></div>
            <div><dt>100+</dt><dd>Partners</dd></div>
          </dl>
        </div>
        <div className="met-home__regionCard">
          <img src={MET_HOME_ASSETS.hero} alt="Silicon Heartland city and regional overview" />
          <p>A Connected Region</p>
          {["Farms", "Industry", "Communities", "People", "Innovation", "Education", "Opportunity"].map((label, index) => (
            <span key={label} className={`met-home__regionTag met-home__regionTag--${index + 1}`}>{label}</span>
          ))}
          <a href={METAVERSE_CITY_ROUTE}>Explore the Region <span aria-hidden="true">-&gt;</span></a>
        </div>
      </section>

      <section className="met-home__featured" id="featured">
        <div className="met-home__sectionHead">
          <div>
            <p className="met-home__sectionKicker">Featured</p>
            <h2>Programs, Opportunities and Stories</h2>
          </div>
          <a href="#featured">View All <span aria-hidden="true">-&gt;</span></a>
        </div>
        <div className="met-home__featureGrid">
          {MET_HOME_FEATURED.map((item) => (
            <article className="met-home__featureCard" key={item.title}>
              <img src={item.image} alt="" loading="lazy" decoding="async" />
              <div>
                <span>{item.type}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="met-home__enter" id="create">
        <div className="met-home__enterCopy">
          <p className="met-home__sectionKicker">Enter the Metaverse</p>
          <h2>Step Into the City</h2>
          <p>Explore Silicon Heartland City in an immersive 3D experience. Visit neighborhoods, meet people, explore careers, attend events and see what's possible.</p>
          <div className="met-home__enterActions">
            <a className="met-home__goldButton" href={METAVERSE_CITY_ROUTE}>Enter the Metaverse <span aria-hidden="true">-&gt;</span></a>
            <a href="#vision">Watch the Introduction <span aria-hidden="true">-&gt;</span></a>
          </div>
        </div>
        <a className="met-home__cityBanner" href={METAVERSE_CITY_ROUTE}>
          <img src={MET_HOME_ASSETS.hero} alt="Silicon Heartland City skyline" />
          <span>Explore &bull; Learn &bull; Work &bull; Build &bull; Connect</span>
          <strong>Silicon Heartland City</strong>
          <em>A virtual city with real opportunity</em>
        </a>
      </section>

      <section className="met-home__foundations" id="serve">
        <div className="met-home__foundationIntro">
          <p className="met-home__sectionKicker">Our Foundations</p>
          <h2>Built for People and Place</h2>
          <p>Learn more about the organizations powering Silicon Heartland.</p>
        </div>
        <div className="met-home__foundationCards">
          <a className="met-home__foundationCard" href="/foundation">
            <MetHomeIcon name="tree" />
            <strong>Silicon Heartland Foundation (SHF)</strong>
            <span>Education, workforce and community development.</span>
            <em>Visit SHF -&gt;</em>
          </a>
          <a className="met-home__foundationCard" href="/solutions">
            <MetHomeIcon name="systems" />
            <strong>Silicon Heartland Systems (SHS)</strong>
            <span>Technology, infrastructure and operational solutions.</span>
            <em>Visit SHS -&gt;</em>
          </a>
        </div>
      </section>

      <footer className="met-home__footer">
        <img src={MET_HOME_ASSETS.logo} alt="Silicon Heartland Metaverse" />
        <p>A stronger region. A brighter tomorrow.</p>
        <nav aria-label="Footer">
          {["About", "Partners", "News", "Contact"].map((item) => <a key={item} href={`#${item.toLowerCase()}`}>{item}</a>)}
        </nav>
      </footer>
    </main>
  );
}

// DEV MODE TIME-OF-DAY REVIEW CONTROLS — session-scoped (not
// localStorage: a dev's manual time choice should not linger
// indefinitely in a real browser profile the way a genuine UI
// preference would) client storage for the DEV toolbar's selected
// mode, mirroring MetaverseSidebar.jsx's existing try/catch-wrapped
// safe-storage pattern. Callers must only invoke these when
// devModeEnabled is true — reading/writing is otherwise skipped
// entirely, so this can never influence a normal student's AUTO
// experience.
const DEV_TIME_MODE_STORAGE_KEY = "met-dev-time-mode";

function readStoredDevTimeMode() {
  try {
    const raw = window.sessionStorage.getItem(DEV_TIME_MODE_STORAGE_KEY);
    return METAVERSE_TIME_OF_DAY_MODES.includes(raw) ? raw : "AUTO";
  } catch {
    return "AUTO";
  }
}

function writeStoredDevTimeMode(mode) {
  try {
    window.sessionStorage.setItem(DEV_TIME_MODE_STORAGE_KEY, mode);
  } catch {
    // Private-browsing / storage-disabled — the DEV selection just
    // won't survive a reload. Not worth surfacing to a developer mid-QA.
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

function useCompactViewport() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return compact;
}

function MetaverseCityExperience() {
  const reducedMotion = useReducedMotion();
  const compactViewport = useCompactViewport();
  const [level, setLevel] = useState("CITY_OVERVIEW");
  const [districtId, setDistrictId] = useState(null);
  // FINAL RECONCILIATION V3.1 — PART 4: real, derived "last known
  // coarse location" — never an invented one. districtId itself goes
  // back to null at city overview, so the minimap's "you are here"
  // marker would otherwise have nothing to anchor to; this tracks the
  // most recent real district the student actually visited THIS
  // session so the marker can stay anchored there instead of
  // disappearing or guessing a location.
  const [lastKnownDistrictId, setLastKnownDistrictId] = useState(null);
  useEffect(() => {
    if (districtId) setLastKnownDistrictId(districtId);
  }, [districtId]);
  const [facilityId, setFacilityId] = useState(null);
  const [activityId, setActivityId] = useState(null);
  const [camera, setCamera] = useState(CAMERA_HOME);
  const [riverTraceEnabled] = useState(() => resolveRiverTraceEnabled({ isDev: import.meta.env.DEV, search: window.location.search }));
  const riverTrace = useMetaverseRiverTrace({ enabled: riverTraceEnabled });
  const riverFlowPreview = useMetaverseRiverFlowPreview({ enabled: riverTraceEnabled, state: riverTrace.state, reducedMotion });
  const [selection, setSelection] = useState(null);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [entryNotice, setEntryNotice] = useState("");
  const [runtimeDecisions, setRuntimeDecisions] = useState({});
  const [authorizationState, setAuthorizationState] = useState("idle");
  const [presenceStatus, setPresenceStatus] = useState("AVAILABLE");
  const [presenceSessionId, setPresenceSessionId] = useState(null);
  const [cityCounts, setCityCounts] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [roomParticipants, setRoomParticipants] = useState({ participant_count: 0, participants: [] });
  const [directMessagingNote, setDirectMessagingNote] = useState("");
  const [missions, setMissions] = useState([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [missionsError, setMissionsError] = useState("");
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(true);
  const [opportunitiesError, setOpportunitiesError] = useState("");
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(false);
  const [marketListings, setMarketListings] = useState([]);
  const [marketOrders, setMarketOrders] = useState([]);
  const [marketBalance, setMarketBalance] = useState(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState("");
  const [marketOpen, setMarketOpen] = useState(false);
  const [myEnterprises, setMyEnterprises] = useState([]);
  const [myStudioTeams, setMyStudioTeams] = useState([]);
  const [enterprisesLoading, setEnterprisesLoading] = useState(true);
  const [enterprisesError, setEnterprisesError] = useState("");
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);
  const [passport, setPassport] = useState(null);
  const [passportLoading, setPassportLoading] = useState(true);
  const [passportError, setPassportError] = useState("");
  const [passportOpen, setPassportOpen] = useState(false);
  const [civicOpen, setCivicOpen] = useState(false);
  // MET-15J — single right-drawer mode. LOCATION isn't listed here
  // because it's driven by `selection` (district/facility/activity),
  // which already has its own protected-entry lifecycle.
  const [drawerMode, setDrawerMode] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [miniMapVisible, setMiniMapVisible] = useState(true);
  const [orchestration, setOrchestration] = useState(null);
  const [orchestrationError, setOrchestrationError] = useState("");
  // UI UPGRADE V1 — PART 7/8: students no longer have any manual DAY/
  // DUSK/NIGHT control (those buttons are removed below, see the old
  // "Display" more-section) — the scene always runs on AUTO, i.e. the
  // existing canonical resolver (resolveMetaverseTimeOfDay in
  // metaverseTimeOfDay.js) deriving DAY/DUSK/NIGHT from the real clock
  // hour via its fixed, deterministic windows (7-17 DAY, 17-20 DUSK,
  // 20-7 NIGHT) — never random, never a second timing schedule.
  //
  // DEV MODE TIME-OF-DAY REVIEW CONTROLS — the resolved mode is now a
  // 3-tier priority chain, highest first:
  //   1. a feature-specific DAY review flag (dayBirdsReview,
  //      dayWaterReview, dayRapidsMotionReview, ...) — unchanged from
  //      before, still forces DAY unconditionally.
  //   2. `?metaverseDev=1` (dev build only) — an owner/developer-only
  //      manual AUTO/DAY/DUSK/NIGHT override (devTimeMode below,
  //      changed only via the DEV toolbar's own buttons — see the
  //      met-dev-toolbar JSX further down). Session-persisted via
  //      sessionStorage (readStoredDevTimeMode/writeStoredDevTimeMode),
  //      the same safe try/catch client-preference pattern
  //      MetaverseSidebar.jsx already uses for its own expand/collapse
  //      preference — but sessionStorage, not localStorage, and NEVER
  //      read/written at all unless devModeEnabled is true, so a dev's
  //      chosen mode can never leak into or become a normal student's
  //      AUTO experience, and removing ?metaverseDev=1 immediately
  //      falls back to tier 3 regardless of what's stored.
  //   3. AUTO (production default for every real student).
  // `timePreviewMode` is therefore a DERIVED value, not its own piece
  // of mutable state — the real-time `now` tick below can never
  // overwrite a manual DEV selection, because resolveMetaverseTimeOfDay
  // only ever consults the clock when the resolved mode is "AUTO".
  const [reviewForcesDay] = useState(() => {
    const search = window.location.search;
    const isDev = import.meta.env.DEV;
    return (
      resolveDayBirdsReviewEnabled({ isDev, search }) ||
      resolveDayWaterReviewEnabled({ isDev, search }) ||
      resolveDayRapidsMotionReviewEnabled({ isDev, search })
    );
  });
  const [devModeEnabled] = useState(() => resolveMetaverseDevModeEnabled({ isDev: import.meta.env.DEV, search: window.location.search }));
  const [devTimeMode, setDevTimeMode] = useState(() => (devModeEnabled ? readStoredDevTimeMode() : "AUTO"));
  const environmentController = useMetaverseEnvironmentRuntime();
  const timePreviewMode = riverTraceEnabled ? "DAY" : (reviewForcesDay ? "DAY" : (devModeEnabled ? devTimeMode : "AUTO"));
  const handleDevTimeModeSelect = (mode) => {
    setDevTimeMode(mode);
    writeStoredDevTimeMode(mode);
  };
  // UI UPGRADE V1 — PART 8/9: one shared "now" clock, ticked every 30s,
  // drives BOTH the automatic time-of-day resolution below and the
  // persistent date/time status strip (PART 9) — a single time source,
  // not duplicate timing logic. 30s is frequent enough to keep the
  // displayed minute accurate and to cross DAY/DUSK/NIGHT hour
  // boundaries promptly, without being an aggressive/flashing tick.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);
  const presenceStatusRef = useRef(presenceStatus);
  const currentUserId = resolveDevUserId("learner");

  useEffect(() => {
    if (!riverTraceEnabled) return;
    setLevel("CITY_OVERVIEW");
    setDistrictId(null);
    setFacilityId(null);
    setActivityId(null);
    setSelection(null);
    setCamera(CAMERA_HOME);
  }, [riverTraceEnabled]);

  // MET-16A — developer-only manual traffic route authoring tool. Dev-build
  // + explicit `?trafficAuthor=1` gated (see resolveTrafficAuthoringEnabled);
  // normal users and production builds never see this. Computed once per
  // mount — the query string doesn't change without a reload — and the
  // controller is instantiated unconditionally (hooks can't be conditional)
  // but does essentially nothing when disabled (routes stay empty, the
  // ghost-preview animation frame never starts). This grants no application
  // authority and never wires into production traffic.
  const trafficAuthoringEnabled = useMemo(
    () => resolveTrafficAuthoringEnabled({ isDev: import.meta.env.DEV, search: window.location.search }),
    [],
  );
  const trafficAuthoring = useMetaverseTrafficAuthoring({ enabled: trafficAuthoringEnabled });
  // MET-16B — reads (never mutates) the routes/active route the owner has
  // authored above; entirely inert (empty activeRoutes, no rAF loop ever
  // started) when trafficAuthoringEnabled is false.
  const trafficPreview = useMetaverseTrafficLivePreview({
    enabled: trafficAuthoringEnabled,
    routes: trafficAuthoring.routes,
    activeRouteId: trafficAuthoring.activeRouteId,
  });

  useEffect(() => {
    presenceStatusRef.current = presenceStatus;
  }, [presenceStatus]);

  useEffect(() => {
    let cancelled = false;
    const poll = () => getCityOrchestration()
      .then((result) => {
        if (cancelled) return;
        setOrchestration(result);
        setOrchestrationError("");
      })
      .catch((error) => {
        if (!cancelled) setOrchestrationError(error?.message || "City orchestration is temporarily unavailable.");
      });
    poll();
    const interval = setInterval(poll, ORCHESTRATION_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getRoomsPolicy()
      .then((result) => {
        if (!cancelled) setDirectMessagingNote(result?.direct_messaging?.rationale || "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const poll = () => getMyWorkPassport()
      .then((result) => {
        if (cancelled) return;
        setPassport(result);
        setPassportError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setPassportError(error?.message || "Work Passport is temporarily unavailable.");
      })
      .finally(() => {
        if (!cancelled) setPassportLoading(false);
      });
    poll();
    const interval = setInterval(poll, PASSPORT_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const refreshMarket = async () => {
    const [balance, listings, orders] = await Promise.all([
      getMarketBalance(),
      listMarketListings(),
      listMarketOrders(),
    ]);
    setMarketBalance(balance);
    setMarketListings(listings || []);
    setMarketOrders(orders || []);
  };

  useEffect(() => {
    let cancelled = false;
    const poll = () => refreshMarket()
      .then(() => {
        if (!cancelled) setMarketError("");
      })
      .catch((error) => {
        if (!cancelled) setMarketError(error?.message || "Student Market is temporarily unavailable.");
      })
      .finally(() => {
        if (!cancelled) setMarketLoading(false);
      });
    poll();
    const interval = setInterval(poll, MARKET_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const refreshEnterprises = async () => {
    const [enterprises, teams] = await Promise.all([listMyEnterprises(), listMyStudioTeams()]);
    setMyEnterprises(enterprises || []);
    setMyStudioTeams(teams || []);
  };

  useEffect(() => {
    let cancelled = false;
    const poll = () => refreshEnterprises()
      .then(() => {
        if (!cancelled) setEnterprisesError("");
      })
      .catch((error) => {
        if (!cancelled) setEnterprisesError(error?.message || "Student Enterprise is temporarily unavailable.");
      })
      .finally(() => {
        if (!cancelled) setEnterprisesLoading(false);
      });
    poll();
    const interval = setInterval(poll, ENTERPRISE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const poll = () => getCityPresence().then((result) => {
      if (!cancelled) setCityCounts(result?.counts || []);
    }).catch(() => {});
    poll();
    const interval = setInterval(poll, CITY_PRESENCE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const poll = () => listMissions()
      .then((result) => {
        if (cancelled) return;
        setMissions(result?.items || []);
        setMissionsError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setMissionsError(error?.message || "Missions are temporarily unavailable.");
      })
      .finally(() => {
        if (!cancelled) setMissionsLoading(false);
      });
    poll();
    const interval = setInterval(poll, MISSIONS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const poll = () => listOpportunities()
      .then((items) => {
        if (cancelled) return;
        setOpportunities(items || []);
        setOpportunitiesError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setOpportunitiesError(error?.message || "Opportunities are temporarily unavailable.");
      })
      .finally(() => {
        if (!cancelled) setOpportunitiesLoading(false);
      });
    poll();
    const interval = setInterval(poll, OPPORTUNITIES_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let sessionId = null;
    startPresence({ district_id: districtId, facility_id: facilityId, activity_id: activityId, status: presenceStatusRef.current })
      .then((result) => {
        if (cancelled) return;
        sessionId = result?.presence?.presence_session_id || null;
        setPresenceSessionId(sessionId);
      })
      .catch(() => {
        if (!cancelled) setPresenceSessionId(null);
      });
    return () => {
      cancelled = true;
      if (sessionId) revokePresence(sessionId).catch(() => {});
    };
  }, [districtId, facilityId, activityId]);

  useEffect(() => {
    if (!presenceSessionId) return undefined;
    const interval = setInterval(() => {
      heartbeatPresence(presenceSessionId, { status: presenceStatusRef.current }).catch(() => {});
    }, PRESENCE_HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [presenceSessionId]);

  const handleStatusChange = (value) => {
    setPresenceStatus(value);
    if (presenceSessionId) heartbeatPresence(presenceSessionId, { status: value }).catch(() => {});
  };

  const selectedDistrict = districtId ? getDistrictById(districtId) : null;
  const selectedFacility = facilityId ? getFacilityById(facilityId) : null;
  const selectedActivity = activityId ? METAVERSE_ACTIVITY_PLACEHOLDERS.find((item) => item.id === activityId) : null;

  const inRoomEligibleView = (level === "FACILITY_VIEW" || level === "ACTIVITY_SIMULATION_VIEW") && Boolean(selectedFacility);

  useEffect(() => {
    if (!inRoomEligibleView) {
      setActiveRoom(null);
      setDrawerMode((mode) => (mode === "CHAT" ? null : mode));
      return undefined;
    }
    let cancelled = false;
    getOrCreateRoom({ room_type: "FACILITY_ROOM", district_id: selectedFacility.districtId, facility_id: selectedFacility.id })
      .then((result) => {
        if (!cancelled) setActiveRoom(result?.room || null);
      })
      .catch(() => {
        if (!cancelled) setActiveRoom(null);
      });
    return () => {
      cancelled = true;
    };
  }, [inRoomEligibleView, selectedFacility?.id]);

  useEffect(() => {
    if (!activeRoom?.room_id) {
      setRoomParticipants({ participant_count: 0, participants: [] });
      return undefined;
    }
    let cancelled = false;
    const poll = () => getRoomParticipants(activeRoom.room_id).then((result) => {
      if (!cancelled) setRoomParticipants(result || { participant_count: 0, participants: [] });
    }).catch(() => {});
    poll();
    const interval = setInterval(poll, ROOM_PARTICIPANTS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeRoom?.room_id]);

  const background = useMemo(() => {
    if (riverTraceEnabled) return findProductionEnvironmentAsset({ cameraLevel: "CITY_OVERVIEW", districtId: null, facilityId: null });
    if (level === "FACILITY_VIEW" || level === "ACTIVITY_SIMULATION_VIEW") {
      return findProductionEnvironmentAsset({ cameraLevel: "FACILITY_VIEW", districtId, facilityId });
    }
    if (level === "DISTRICT_VIEW") {
      return findProductionEnvironmentAsset({ cameraLevel: "DISTRICT_VIEW", districtId, facilityId: null });
    }
    return findProductionEnvironmentAsset({ cameraLevel: "CITY_OVERVIEW", districtId: null, facilityId: null });
  }, [riverTraceEnabled, level, districtId, facilityId]);

  const resolvedTimeOfDay = useMemo(() => resolveMetaverseTimeOfDay({ mode: timePreviewMode, date: now }), [timePreviewMode, now]);
  // MINIMAP V3 ADDENDUM — always the REAL clock's AUTO resolution,
  // independent of any DEV/review override, so the status strip's icon
  // can never visually misrepresent the actual time of day.
  const realAutoTimeOfDay = useMemo(() => resolveMetaverseTimeOfDay({ mode: "AUTO", date: now }), [now]);
  const resolvedBackground = useMemo(() => {
    const variant = resolveMetaverseAssetVariant(background, resolvedTimeOfDay);
    return {
      ...background,
      requestedTimeOfDay: variant.requestedVariant,
      resolvedTimeOfDay: variant.resolvedVariant,
      timeOfDayFallbackUsed: variant.fallbackUsed,
      url: variant.assetPath ? publicAssetUrl(variant.assetPath) : background?.url,
    };
  }, [background, resolvedTimeOfDay]);

  // Real mission counts only — derived from the server's own
  // GET /metaverse/missions response, never fabricated (build brief §8).
  const missionCountsByDistrict = useMemo(() => {
    const counts = {};
    for (const mission of missions) {
      const key = mission.location?.districtId;
      if (key) counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [missions]);

  const missionCountsByFacility = useMemo(() => {
    const counts = {};
    for (const mission of missions) {
      const key = mission.location?.facilityId;
      if (key) counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [missions]);

  // Real Opportunity Exchange counts only — derived from the server's own
  // GET /metaverse/opportunity-exchange/opportunities response, never
  // fabricated (build brief §21, mirrors missionCountsByDistrict above).
  const opportunityCountsByDistrict = useMemo(() => {
    const counts = {};
    for (const opportunity of opportunities) {
      const key = opportunity.districtId;
      if (key) counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [opportunities]);

  const opportunityCountsByFacility = useMemo(() => {
    const counts = {};
    for (const opportunity of opportunities) {
      const key = opportunity.facilityId;
      if (key) counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [opportunities]);

  const marketCountsByDistrict = useMemo(() => {
    const counts = {};
    for (const listing of marketListings) {
      const key = listing.districtId || "treasury-commerce-district";
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [marketListings]);

  const marketCountsByFacility = useMemo(() => {
    const counts = {};
    for (const listing of marketListings) {
      const key = listing.facilityId;
      if (key) counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [marketListings]);

  const markers = useMemo(() => {
    if (level === "CITY_OVERVIEW") return METAVERSE_DISTRICTS.map((district) => ({ ...district, markerType: "DISTRICT", missionCount: missionCountsByDistrict[district.id] || 0, opportunityCount: opportunityCountsByDistrict[district.id] || 0, marketCount: marketCountsByDistrict[district.id] || 0 }));
    if (level === "DISTRICT_VIEW" && selectedDistrict) return selectedDistrict.facilities.map((facility) => ({ ...facility, markerType: "FACILITY", missionCount: missionCountsByFacility[facility.id] || 0, opportunityCount: opportunityCountsByFacility[facility.id] || 0, marketCount: marketCountsByFacility[facility.id] || 0 }));
    if (level === "FACILITY_VIEW" && selectedFacility) return getActivitiesForFacility(selectedFacility.id).map((activity, index) => ({
      ...activity,
      markerType: "ACTIVITY",
      x: 42 + index * 16,
      y: 54 + (index % 2) * 10,
      description: "Future activity mount point. Server unlock is required before entry.",
    }));
    return [];
  }, [level, selectedDistrict, selectedFacility, missionCountsByDistrict, missionCountsByFacility, opportunityCountsByDistrict, opportunityCountsByFacility, marketCountsByDistrict, marketCountsByFacility]);

  const getUnlock = (resource) => resolveMetaverseUiUnlock(resource, {
    runtimeDecision: runtimeDecisions[resource?.id],
    fixtureEnabled: canUseMetaverseDevFixture(),
    clientGranted: false,
    cameraGranted: false,
    queryGranted: new URLSearchParams(window.location.search).has("unlock"),
  });

  const requestProtectedDecision = async (resource, event = "view") => {
    const queryGranted = new URLSearchParams(window.location.search).has("unlock");
    if (queryGranted) {
      return resolveMetaverseUiUnlock(resource, { queryGranted: true, fixtureEnabled: false });
    }
    setAuthorizationState("checking");
    try {
      const result = await requestMetaverseEntry(resource, { event });
      setRuntimeDecisions((current) => ({ ...current, [resource.id]: result.decision }));
      setAuthorizationState("ready");
      return result.decision;
    } catch (error) {
      const decision = {
        resource_id: resource.id,
        resource_type: resource.type,
        decision: error.status === 401 ? "RESTRICTED" : "TEMPORARILY_UNAVAILABLE",
        reason_code: error.code || "AUTHORIZATION_UNAVAILABLE",
        reason_text: error.status === 401 ? "Your session expired. Sign in again before entering the metaverse." : "Metaverse authorization is temporarily unavailable.",
        next_action: null,
        projection_version: "MET-5_RUNTIME_ADAPTER",
        authority: "server-required",
      };
      setRuntimeDecisions((current) => ({ ...current, [resource.id]: decision }));
      setAuthorizationState("error");
      return decision;
    }
  };

  // MET-16C.4 — was its own hardcoded (-18..18, -14..14) pair, and free-
  // roam METAVERSE_CAMERA_PAN_BOUNDS (~3.6%, derived from the restored
  // 1.08 overscan) is far too small to actually center most district/
  // facility markers (measured up to ~28% off-center). Rather than
  // clamp this to the free-roam bound (which would make "jump to
  // district" silently fail to reach almost anywhere) or give it its own
  // unproven pan range (the exact mistake that caused the seam twice
  // already), this zooms in exactly as much as THIS specific jump needs
  // to stay seam-safe, via resolveSafeZoomForPan, then clamps the pan to
  // whatever that chosen zoom safely supports (a no-op clamp for every
  // real marker/facility today — all measure under the ~1.53 zoom this
  // implies, comfortably below the 1.8 max — and a safety net rather than
  // a silent overshoot if a much farther-off-center location is ever
  // added).
  const focusCamera = (item) => {
    const rawX = 50 - item.x;
    const rawY = 48 - item.y;
    const baseZoom = level === "CITY_OVERVIEW" ? 1.22 : 1.18;
    const requiredZoom = Math.max(resolveSafeZoomForPan(rawX), resolveSafeZoomForPan(rawY));
    const zoom = Math.min(1.8, Math.max(baseZoom, requiredZoom));
    const maxPan = resolveSafePanBoundPercentAtZoom(zoom);
    const next = {
      x: Math.max(-maxPan, Math.min(maxPan, rawX)),
      y: Math.max(-maxPan, Math.min(maxPan, rawY)),
      zoom,
    };
    setCamera(reducedMotion ? next : next);
  };

  // MET-15J — only one right-side drawer surface at a time. Closes every
  // other drawer/panel; callers that are opening a new one set their own
  // flag immediately afterward. Chat's messages/draft are NOT lost by
  // this — MetaverseChatTray stays mounted regardless of `open`, so its
  // internal state survives being hidden.
  const closeAllDrawers = () => {
    setSelection(null);
    setDrawerMode(null);
    setNavigatorOpen(false);
    setMissionsOpen(false);
    setOpportunitiesOpen(false);
    setMarketOpen(false);
    setPassportOpen(false);
    setCivicOpen(false);
    setEnterpriseOpen(false);
    setMoreOpen(false);
    setEntryNotice("");
  };

  const resetRiverTraceFraming = () => {
    if (!riverTraceEnabled) return;
    closeAllDrawers();
    setLevel("CITY_OVERVIEW");
    setDistrictId(null);
    setFacilityId(null);
    setActivityId(null);
    setSelection(null);
    setCamera(CAMERA_HOME);
  };

  const selectDistrict = async (district) => {
    const resource = { ...district, id: district.id, type: "DISTRICT" };
    const unlock = await requestProtectedDecision(resource, "enter");
    closeAllDrawers();
    setSelection({ ...district, type: "DISTRICT", unlock });
    focusCamera(district);
    if (!canEnterMetaverseResource(unlock)) {
      setEntryNotice(unlock.reason_text);
      return;
    }
    setDistrictId(district.id);
    setFacilityId(null);
    setActivityId(null);
    setLevel("DISTRICT_VIEW");
    setCamera(CAMERA_HOME);
  };

  const selectFacility = async (facility) => {
    const resource = { ...facility, id: facility.id, type: "FACILITY", districtId: facility.districtId };
    const unlock = await requestProtectedDecision(resource, "enter");
    closeAllDrawers();
    setSelection({ ...facility, type: "FACILITY", unlock });
    focusCamera(facility);
    if (!canEnterMetaverseResource(unlock)) {
      setEntryNotice(unlock.reason_text);
      return;
    }
    setFacilityId(facility.id);
    setActivityId(null);
    setLevel("FACILITY_VIEW");
    setCamera(CAMERA_HOME);
  };

  const selectActivity = async (activity) => {
    const resource = { ...activity, id: activity.id, type: "ACTIVITY", districtId: activity.districtId, facilityId: activity.facilityId };
    const unlock = await requestProtectedDecision(resource, "activity_start");
    setSelection({ ...activity, type: "ACTIVITY", unlock });
    if (!canEnterMetaverseResource(unlock)) {
      setEntryNotice(unlock.reason_text);
      return;
    }
    setActivityId(activity.id);
    setLevel("ACTIVITY_SIMULATION_VIEW");
  };

  const handleMarkerSelect = (item) => {
    setEntryNotice("");
    if (item.markerType === "DISTRICT") selectDistrict(item);
    else if (item.markerType === "FACILITY") selectFacility(item);
    else selectActivity(item);
  };

  // MET-7 — launching a mission always goes through the mission-aware
  // protected entry endpoint first (which itself re-derives both real
  // assignment eligibility and the MET-3 unlock decision server-side);
  // only on can_enter does this then reuse the exact same district/
  // facility/activity navigation + MET-5 entry path a direct city click
  // would use. A denial is always surfaced, never silently dropped.
  const handleSelectMission = async (mission) => {
    setMissionsOpen(false);
    setEntryNotice("");
    let result;
    try {
      result = await enterMissionApi(mission.missionProjectionId);
    } catch (error) {
      setEntryNotice(error?.message || "Mission entry is temporarily unavailable.");
      return;
    }
    if (!result?.can_enter) {
      setEntryNotice(result?.entry?.decision?.reason_text || result?.mission?.nextAction?.reason || "This mission cannot be entered right now.");
      return;
    }
    const district = getDistrictById(mission.location.districtId);
    if (!district) return;
    await selectDistrict(district);
    const facility = getFacilityById(mission.location.facilityId);
    if (!facility) return;
    await selectFacility(facility);
    if (mission.location.metaverseActivityId) {
      const activity = METAVERSE_ACTIVITY_PLACEHOLDERS.find((item) => item.id === mission.location.metaverseActivityId);
      if (activity) await selectActivity(activity);
    }
  };

  const navigateFastTravelDestination = async (destination) => {
    if (!destination) return;
    setEntryNotice("");
    let result;
    try {
      result = await fastTravelApi(destination.destination_id);
    } catch (error) {
      setEntryNotice(error?.message || "Fast travel is temporarily unavailable.");
      return;
    }
    if (!result?.can_enter) {
      setEntryNotice(result?.entry?.decision?.reason_text || "Fast travel destination is locked.");
      return;
    }
    if (destination.district_id) {
      const district = getDistrictById(destination.district_id);
      if (district) await selectDistrict(district);
    } else {
      setLevel("CITY_OVERVIEW");
      setDistrictId(null);
      setFacilityId(null);
      setActivityId(null);
      setCamera(CAMERA_HOME);
    }
    if (destination.facility_id) {
      const facility = getFacilityById(destination.facility_id);
      if (facility) await selectFacility(facility);
    }
    if (destination.activity_id) {
      const activity = METAVERSE_ACTIVITY_PLACEHOLDERS.find((item) => item.id === destination.activity_id);
      if (activity) await selectActivity(activity);
    }
  };

  const handleOrchestrationAction = async (action) => {
    if (!action) return;
    const mission = missions.find((item) => item.missionProjectionId === action.source_ref);
    if (mission) {
      await handleSelectMission(mission);
      return;
    }
    const destination = orchestration?.fast_travel_destinations?.find((item) => (
      item.destination_id === "NEXT_ACTION" ||
      (action.facility_id && item.facility_id === action.facility_id) ||
      (action.district_id && item.district_id === action.district_id)
    ));
    if (destination) await navigateFastTravelDestination(destination);
    if (action.action_type === "VISIT_MARKET") setMarketOpen(true);
    if (action.action_type === "VIEW_WORK_PASSPORT" || action.source_type === "MET-10_WORK_PASSPORT") setPassportOpen(true);
    if (action.action_type === "REVIEW_AVAILABLE_OPPORTUNITY") setOpportunitiesOpen(true);
  };

  const goToCrumb = (crumb) => {
    if (crumb.level === "CITY_OVERVIEW") {
      setLevel("CITY_OVERVIEW");
      setDistrictId(null);
      setFacilityId(null);
      setActivityId(null);
      setCamera(CAMERA_HOME);
      closeAllDrawers();
    } else if (crumb.level === "DISTRICT_VIEW") {
      const district = getDistrictById(crumb.id);
      if (district) selectDistrict(district);
    } else if (crumb.level === "FACILITY_VIEW") {
      const facility = getFacilityById(crumb.id);
      if (facility) selectFacility(facility);
    }
  };

  // MET-15J — opens one drawer mode at a time (sidebar Next Action/Me
  // items, More → Daily Briefing/District Pulse). Clicking the same
  // sidebar item again closes it, matching the existing toggle-button
  // convention used by every other panel in this shell.
  const openDrawerMode = (mode) => {
    setDrawerMode((current) => {
      if (current === mode) return null;
      return mode;
    });
    setSelection(null);
    setNavigatorOpen(false);
    setMissionsOpen(false);
    setOpportunitiesOpen(false);
    setMarketOpen(false);
    setPassportOpen(false);
    setCivicOpen(false);
    setEnterpriseOpen(false);
    setMoreOpen(false);
    setEntryNotice("");
  };

  const openPanel = (setter) => {
    closeAllDrawers();
    setter(true);
  };

  const goBack = () => {
    if (selection && entryNotice) {
      setSelection(null);
      setEntryNotice("");
      return;
    }
    if (level === "ACTIVITY_SIMULATION_VIEW") {
      setLevel("FACILITY_VIEW");
      setActivityId(null);
    } else if (level === "FACILITY_VIEW") {
      setLevel("DISTRICT_VIEW");
      setFacilityId(null);
    } else if (level === "DISTRICT_VIEW") {
      setLevel("CITY_OVERVIEW");
      setDistrictId(null);
    }
    setCamera(CAMERA_HOME);
  };

  const anyDrawerOpen = Boolean(
    selection || drawerMode || navigatorOpen || missionsOpen || opportunitiesOpen
    || marketOpen || passportOpen || civicOpen || enterpriseOpen || moreOpen,
  );

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (anyDrawerOpen) {
          closeAllDrawers();
        } else goBack();
      }
      if (event.key === "+" || event.key === "=") setCamera((value) => ({ ...value, zoom: Math.min(1.8, value.zoom + 0.1) }));
      if (event.key === "-") setCamera((value) => ({ ...value, zoom: Math.max(1, value.zoom - 0.1) }));
      // MET-16C.3 — must match the drag-pan clamp in MetaverseCamera.jsx's
      // updateCamera (both import METAVERSE_CAMERA_PAN_BOUNDS from the
      // same place), which METAVERSE_CAMERA_WORLD_OVERSCAN is derived
      // from. A hardcoded value here that drifted from that one is what
      // let keyboard-panned camera positions expose the shell background
      // at the container edge.
      if (event.key === "ArrowLeft") setCamera((value) => ({ ...value, x: Math.max(-METAVERSE_CAMERA_PAN_BOUNDS.x, value.x - 2) }));
      if (event.key === "ArrowRight") setCamera((value) => ({ ...value, x: Math.min(METAVERSE_CAMERA_PAN_BOUNDS.x, value.x + 2) }));
      if (event.key === "ArrowUp") setCamera((value) => ({ ...value, y: Math.max(-METAVERSE_CAMERA_PAN_BOUNDS.y, value.y - 2) }));
      if (event.key === "ArrowDown") setCamera((value) => ({ ...value, y: Math.min(METAVERSE_CAMERA_PAN_BOUNDS.y, value.y + 2) }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anyDrawerOpen, level]);

  useEffect(() => {
    if (window.location.pathname === "/metaverse") return;
    if (window.location.pathname.startsWith("/metaverse/")) {
      setEntryNotice("Direct metaverse links require protected server authorization before any district, facility, or activity can render.");
      setLevel("CITY_OVERVIEW");
      setDistrictId(null);
      setFacilityId(null);
      setActivityId(null);
    }
  }, []);

  const breadcrumbs = getBreadcrumbs({ level, districtId, facilityId, activityId });
  const contextSelection = selection || (level === "ACTIVITY_SIMULATION_VIEW" && selectedActivity ? { ...selectedActivity, type: "ACTIVITY", unlock: getUnlock({ id: selectedActivity.id, type: "ACTIVITY" }) } : null);
  const contextUnlock = contextSelection?.unlock || (contextSelection ? getUnlock({ id: contextSelection.id, type: contextSelection.type }) : null);
  const selectedBuildingPreview = selectedFacility
    ? orchestration?.building_previews?.find((preview) => preview.facility_id === selectedFacility.id)
    : null;

  const enterpriseCountsByFacility = useMemo(() => {
    const counts = {};
    const enterprises = Array.isArray(myEnterprises) ? myEnterprises : [];
    for (const enterprise of enterprises) {
      const key = enterprise.facilityId || enterprise.facility_id || "builder-studio";
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [myEnterprises]);

  const livingCityActivity = useMemo(() => ({
    missionCountsByFacility,
    opportunityCountsByFacility,
    marketCountsByFacility,
    enterpriseCountsByFacility,
    civicActive: Boolean(orchestration?.civic_state?.active_session || orchestration?.civic_state?.current_session),
  }), [missionCountsByFacility, opportunityCountsByFacility, marketCountsByFacility, enterpriseCountsByFacility, orchestration?.civic_state]);

  return (
    <main
      className="met-shell"
      data-camera-level={level}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-route="/metaverse"
      data-authorization-state={authorizationState}
    >
      <MetaverseCamera
        background={resolvedBackground}
        camera={camera}
        markers={markers}
        livingCityLayer={(
          <MetaverseLivingCityLayer
            level={level}
            districtId={districtId}
            facilityId={facilityId}
            reducedMotion={reducedMotion}
            performanceMode={reducedMotion || compactViewport ? "LOW" : "STANDARD"}
            timeOfDay={resolvedTimeOfDay}
            weather="CLEAR"
            environment={environmentController}
            cityCounts={cityCounts}
            events={orchestration?.city_events || []}
            activity={livingCityActivity}
          />
        )}
        authoringOverlay={
          <>
            {trafficAuthoring.enabled ? (
              <MetaverseTrafficAuthoringErrorBoundary>
                <MetaverseTrafficAuthoringOverlay controller={trafficAuthoring} previewController={trafficPreview} />
              </MetaverseTrafficAuthoringErrorBoundary>
            ) : null}
            <MetaverseRiverTraceAuthoringOverlay
              enabled={riverTraceEnabled}
              mode={riverTrace.mode}
              state={riverTrace.state}
              geometryType={riverTrace.geometryType}
              selectedPointIndex={riverTrace.selectedPointIndex}
              onAddPoint={riverTrace.actions.addPoint}
              onSelectPoint={riverTrace.actions.setSelectedPointIndex}
              onMovePoint={riverTrace.actions.movePoint}
              onDeletePoint={riverTrace.actions.deleteSelectedPoint}
              onPickProgress={riverTrace.actions.pickZoneProgress}
              previewController={riverFlowPreview}
            />
          </>
        }
        selectedId={selection?.id}
        getUnlock={getUnlock}
        onSelectMarker={handleMarkerSelect}
        onCameraChange={setCamera}
        reducedMotion={reducedMotion}
      />

      {/* UI UPGRADE V1 — PART 9: persistent top-right date/time status.
          MINIMAP V3 ADDENDUM — the icon now uses `realAutoTimeOfDay`
          (always the REAL clock's AUTO resolution, computed below),
          never `resolvedTimeOfDay` (which can be overridden by a DEV
          selection or a feature-review flag) — "changing DEV scene mode
          must NOT falsify the clock." The date/time text was already
          real (`now`). When DEV mode is active, an explicit "DEV Scene:
          X" annotation is added so the override is visible but never
          confused with the factual clock/icon. No manual DAY/DUSK/
          NIGHT control here or anywhere else in the student UI. */}
      <div className="met-status-strip" role="status" aria-label="Current date, time, and scene lighting">
        <span className="met-status-strip__icon" aria-hidden="true">
          {realAutoTimeOfDay === "DAY" ? "☀️" : realAutoTimeOfDay === "DUSK" ? "🌆" : "🌙"}
        </span>
        <span className="met-status-strip__date">{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
        <span className="met-status-strip__time">{now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
        <span className="met-status-strip__auto">Auto Time</span>
        {devModeEnabled ? <span className="met-status-strip__dev-scene">DEV Scene: {resolvedTimeOfDay}</span> : null}
      </div>

      <MetaverseTrafficAuthoringErrorBoundary>
        <MetaverseTrafficAuthoringPanel controller={trafficAuthoring} previewController={trafficPreview} />
      </MetaverseTrafficAuthoringErrorBoundary>

      <MetaverseRiverTraceAuthoringPanel
        enabled={riverTraceEnabled}
        controller={riverTrace}
        previewController={riverFlowPreview}
        onResetFraming={resetRiverTraceFraming}
      />

      <MetaverseSidebar
        activeDrawerMode={drawerMode}
        navigatorOpen={navigatorOpen}
        missionsOpen={missionsOpen}
        missionCount={missions.length}
        opportunitiesOpen={opportunitiesOpen}
        opportunityCount={opportunities.length}
        nextActionAvailable={Boolean(orchestration?.next_action)}
        totalOnline={(cityCounts || []).reduce((sum, item) => sum + (item.online_count || 0), 0)}
        status={presenceStatus}
        chatUnreadCount={chatUnreadCount}
        chatAvailable={Boolean(activeRoom)}
        onHome={() => goToCrumb({ level: "CITY_OVERVIEW" })}
        onNextAction={() => openDrawerMode("NEXT_ACTION")}
        onExplore={() => openPanel(setNavigatorOpen)}
        onMissions={() => openPanel(setMissionsOpen)}
        onOpportunities={() => openPanel(setOpportunitiesOpen)}
        onMe={() => openDrawerMode("PROFILE_DETAIL")}
        onChat={() => openDrawerMode("CHAT")}
        onSettings={() => setMoreOpen((value) => !value)}
        moreOpen={moreOpen}
        onToggleMore={() => setMoreOpen((value) => !value)}
        moreContent={(
          <>
            <div className="met-sidebar__more-section">
              <h3>City Systems</h3>
              <ul>
                <li><button type="button" className="met-sidebar__item" onClick={() => openPanel(setMarketOpen)} aria-current={marketOpen ? "true" : undefined}><span className="met-sidebar__item-icon" aria-hidden="true">🛒</span><span className="met-sidebar__item-label">Market</span></button></li>
                <li><button type="button" className="met-sidebar__item" onClick={() => openPanel(setCivicOpen)} aria-current={civicOpen ? "true" : undefined}><span className="met-sidebar__item-icon" aria-hidden="true">🏛️</span><span className="met-sidebar__item-label">{CIVIC_HALL_LABEL}</span></button></li>
                <li><button type="button" className="met-sidebar__item" onClick={() => openPanel(setEnterpriseOpen)} aria-current={enterpriseOpen ? "true" : undefined}><span className="met-sidebar__item-icon" aria-hidden="true">🚀</span><span className="met-sidebar__item-label">Enterprise{myEnterprises.length ? ` (${myEnterprises.length})` : ""}</span></button></li>
              </ul>
            </div>
            <div className="met-sidebar__more-section">
              <h3>City Information</h3>
              <ul>
                <li><button type="button" className="met-sidebar__item" onClick={() => openDrawerMode("DAILY_BRIEFING")} aria-current={drawerMode === "DAILY_BRIEFING" ? "true" : undefined}><span className="met-sidebar__item-icon" aria-hidden="true">📰</span><span className="met-sidebar__item-label">Daily Briefing</span></button></li>
                <li><button type="button" className="met-sidebar__item" onClick={() => openDrawerMode("DISTRICT_PULSE")} aria-current={drawerMode === "DISTRICT_PULSE" ? "true" : undefined}><span className="met-sidebar__item-icon" aria-hidden="true">📊</span><span className="met-sidebar__item-label">District Pulse</span></button></li>
              </ul>
            </div>
            {/* UI UPGRADE V1 — PART 7: the AUTO/DAY/DUSK/NIGHT manual
                preview buttons that used to live in this section are
                removed — students no longer control environmental time
                (see the `timePreviewMode` state above: always AUTO
                unless a dev-only review flag forces DAY).
                MINIMAP V3 — PART 1: "Reset View" and "Map View" moved
                here from the floating canvas control cluster (see
                MetaverseCameraControls.jsx, which no longer renders its
                own Reset button) so the city canvas carries one fewer
                permanent floating widget. */}
            <div className="met-sidebar__more-section">
              <h3>Map</h3>
              <ul>
                <li>
                  <button type="button" className="met-sidebar__item" onClick={() => setMiniMapVisible((value) => !value)} aria-pressed={miniMapVisible}>
                    <span className="met-sidebar__item-icon" aria-hidden="true">🗺️</span>
                    <span className="met-sidebar__item-label">Map View {miniMapVisible ? "on" : "off"}</span>
                  </button>
                </li>
                <li>
                  <button type="button" className="met-sidebar__item" onClick={() => setCamera(CAMERA_HOME)}>
                    <span className="met-sidebar__item-icon" aria-hidden="true">🎯</span>
                    <span className="met-sidebar__item-label">Reset View</span>
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
        devContent={devModeEnabled ? <MetaverseDevConsole
          sceneId="city"
          capabilities={getMetaverseDevCapabilities("city")}
          defaultOpen={["weather"]}
          masterPlayback={{ play: () => environmentController.actions.setPlayback((current) => ({ ...current, playing: true })), pause: () => environmentController.actions.setPlayback((current) => ({ ...current, playing: false })), restart: environmentController.actions.restart }}
          onResetScene={environmentController.actions.reset}
          sections={{
            scene: <div><div className="met-sidebar__dev-modes" role="group" aria-label="Developer scene time override">{METAVERSE_TIME_OF_DAY_MODES.map((mode) => <button key={mode} type="button" onClick={() => handleDevTimeModeSelect(mode)} data-active={devTimeMode === mode ? "true" : "false"}>{mode}</button>)}</div><p className="met-sidebar__dev-resolved">Resolved: {resolvedTimeOfDay}</p></div>,
            weather: <MetaverseWeatherDevSection controller={environmentController} capabilities={getMetaverseDevCapabilities("city")} />,
            performance: <div><label className="met-sidebar__dev-field"><span>Environment Quality</span><select value={environmentController.playback.quality} onChange={(event) => environmentController.actions.setPlayback((current) => ({ ...current, quality: event.target.value }))}><option>Low</option><option>Medium</option><option>High</option><option>Ultra</option></select></label><p className="met-sidebar__dev-resolved">FPS: {environmentController.playback.fps || "--"}</p><label className="met-sidebar__dev-toggle"><input type="checkbox" checked={environmentController.playback.freeze} onChange={(event) => environmentController.actions.setPlayback((current) => ({ ...current, freeze: event.target.checked }))} /><span>Freeze Environment</span></label><p className="met-sidebar__dev-resolved">Reduced Motion: {reducedMotion ? "ON" : "OFF"}</p></div>,
            debug: <div><p className="met-sidebar__dev-resolved">Traffic and river geometry remain dedicated authoring tools.</p><a className="met-sidebar__dev-reset" href="/metaverse?metaverseDev=1&amp;trafficAuthor=1">Open Traffic Editor</a><a className="met-sidebar__dev-reset" href="/metaverse?metaverseDev=1&amp;riverTrace=1">Open River Flow Editor</a></div>,
          }}
        /> : null}
      />

      <div className="met-bottom-right-cluster">
        <MetaverseCameraControls
          onZoomIn={() => setCamera((value) => ({ ...value, zoom: Math.min(1.8, value.zoom + 0.12) }))}
          onZoomOut={() => setCamera((value) => ({ ...value, zoom: Math.max(1, value.zoom - 0.12) }))}
          onBack={goBack}
          canGoBack={level !== "CITY_OVERVIEW" || Boolean(selection)}
        />
        {miniMapVisible ? (
          <MetaverseMiniMap
            currentDistrictId={districtId}
            youAreHereDistrictId={districtId || lastKnownDistrictId}
            pulses={orchestration?.district_pulses || []}
            destinations={orchestration?.fast_travel_destinations || []}
            onTravel={navigateFastTravelDestination}
            districts={METAVERSE_DISTRICTS}
            presenceCounts={cityCounts}
            events={orchestration?.city_events || []}
            opportunityCountsByDistrict={opportunityCountsByDistrict}
            civicActive={livingCityActivity.civicActive}
            activeRoomParticipants={activeRoom ? roomParticipants : null}
            reducedMotion={reducedMotion}
            onSelectDistrict={selectDistrict}
          />
        ) : null}
      </div>

      {level === "ACTIVITY_SIMULATION_VIEW" && selectedActivity && contextUnlock && canEnterMetaverseResource(contextUnlock) ? (
        <MetaverseActivityMount
          activity={{ ...selectedActivity, type: "ACTIVITY" }}
          facility={selectedFacility}
          district={selectedDistrict}
          decision={contextUnlock}
          onExit={goBack}
        />
      ) : null}

      {entryNotice ? <div className="met-notice" role="status" aria-live="polite">{entryNotice}</div> : null}
      {orchestrationError ? <div className="met-notice met-notice--orch" role="status" aria-live="polite">{orchestrationError}</div> : null}

      {activeRoom ? (
        <MetaverseParticipantList
          participantCount={roomParticipants.participant_count}
          participants={roomParticipants.participants}
        />
      ) : null}

      {activeRoom ? (
        <MetaverseChatTray
          room={activeRoom}
          open={drawerMode === "CHAT"}
          onToggle={(value) => setDrawerMode(value ? "CHAT" : null)}
          currentUserId={currentUserId}
          roomLabel={selectedFacility?.label}
          directMessagingNote={directMessagingNote}
          onUnreadCountChange={setChatUnreadCount}
        />
      ) : null}

      {/* MET-15J — ONE right-side drawer host, one mode visible at a
          time: LOCATION (selection-driven) takes priority, then whatever
          drawerMode is set. Chat renders through its own full-height
          .met-chat-tray in the same slot (see CSS) rather than here, so
          it keeps its existing open/close + message/draft state intact
          across mode switches. */}
      <div className="met-drawer-host">
        {selection || (level === "ACTIVITY_SIMULATION_VIEW" && selectedActivity) ? (
          <>
            {breadcrumbs.length > 1 ? (
              <div className="met-drawer met-drawer--breadcrumbs">
                <MetaverseBreadcrumbs breadcrumbs={breadcrumbs} onNavigate={goToCrumb} />
              </div>
            ) : null}
            <MetaverseContextPanel
              selection={contextSelection}
              unlock={contextUnlock}
              onEnter={() => {
                if (!contextSelection || !contextUnlock || !canEnterMetaverseResource(contextUnlock)) {
                  setEntryNotice(contextUnlock?.reason_text || "Entry requires server authorization.");
                  return;
                }
                if (contextSelection.type === "DISTRICT") selectDistrict(contextSelection);
                if (contextSelection.type === "FACILITY") selectFacility(contextSelection);
                if (contextSelection.type === "ACTIVITY") selectActivity(contextSelection);
              }}
              onClose={() => {
                setSelection(null);
                setEntryNotice("");
              }}
            />
            <MetaverseBuildingPreview
              preview={selectedBuildingPreview}
              onEnter={(preview) => {
                const facility = getFacilityById(preview.facility_id);
                if (facility) selectFacility(facility);
              }}
            />
          </>
        ) : drawerMode === "NEXT_ACTION" ? (
          <div className="met-drawer">
            <div className="met-drawer__head">
              <div>
                <p className="met-drawer__eyebrow">Next Action</p>
                <h2 className="met-drawer__title">Continue where you left off</h2>
              </div>
              <button type="button" className="met-drawer__close" onClick={closeAllDrawers} aria-label="Close">×</button>
            </div>
            <MetaverseNextAction action={orchestration?.next_action} onSelect={handleOrchestrationAction} />
          </div>
        ) : drawerMode === "DAILY_BRIEFING" ? (
          <div className="met-drawer">
            <div className="met-drawer__head met-drawer__head--eyebrow-only">
              <p className="met-drawer__eyebrow">City Information</p>
              <button type="button" className="met-drawer__close" onClick={closeAllDrawers} aria-label="Close">×</button>
            </div>
            <MetaverseDailyBriefing briefing={orchestration?.briefing} open />
            <MetaverseCityEvents events={orchestration?.city_events || []} open />
          </div>
        ) : drawerMode === "DISTRICT_PULSE" ? (
          <div className="met-drawer">
            <div className="met-drawer__head met-drawer__head--eyebrow-only">
              <p className="met-drawer__eyebrow">City Information{selectedDistrict ? ` · ${selectedDistrict.label}` : ""}</p>
              <button type="button" className="met-drawer__close" onClick={closeAllDrawers} aria-label="Close">×</button>
            </div>
            <MetaverseDistrictPulse
              pulses={districtId ? (orchestration?.district_pulses || []).filter((pulse) => pulse.district_id === districtId) : (orchestration?.district_pulses || [])}
              open
            />
          </div>
        ) : drawerMode === "CHAT" && !activeRoom ? (
          <div className="met-drawer">
            <div className="met-drawer__head">
              <div>
                <p className="met-drawer__eyebrow">Community</p>
                <h2 className="met-drawer__title">Chat</h2>
              </div>
              <button type="button" className="met-drawer__close" onClick={closeAllDrawers} aria-label="Close">×</button>
            </div>
            <p>Chat is available inside a facility. Enter a facility to start a conversation with people there.</p>
          </div>
        ) : drawerMode === "PROFILE_DETAIL" ? (
          <div className="met-drawer">
            <div className="met-drawer__head">
              <div>
                <p className="met-drawer__eyebrow">Me</p>
                <h2 className="met-drawer__title">Profile &amp; presence</h2>
              </div>
              <button type="button" className="met-drawer__close" onClick={closeAllDrawers} aria-label="Close">×</button>
            </div>
            <label className="met-drawer__field">
              Your status
              <select value={presenceStatus} onChange={(event) => handleStatusChange(event.target.value)} aria-label="Set your presence status">
                <option value="AVAILABLE">Available</option>
                <option value="AWAY">Away</option>
                <option value="DO_NOT_DISTURB">Do not disturb</option>
                <option value="OFFLINE">Appear offline</option>
              </select>
            </label>
            <p className="met-drawer__meta">{(cityCounts || []).reduce((sum, item) => sum + (item.online_count || 0), 0)} online in Silicon Heartland</p>
            <button type="button" className="met-drawer__cta" onClick={() => openPanel(setPassportOpen)}>Open Work Passport</button>
          </div>
        ) : null}
      </div>

      {navigatorOpen ? (
        <div className="met-explore-fast-travel">
          <MetaverseFastTravel destinations={orchestration?.fast_travel_destinations || []} onTravel={navigateFastTravelDestination} />
        </div>
      ) : null}

      <MetaverseLocationNavigator
        open={navigatorOpen}
        districts={METAVERSE_DISTRICTS}
        selectedDistrictId={districtId}
        selectedFacilityId={facilityId}
        getUnlock={getUnlock}
        onSelectDistrict={selectDistrict}
        onSelectFacility={selectFacility}
        onClose={() => setNavigatorOpen(false)}
      />

      <MetaverseMissionList
        open={missionsOpen}
        missions={missions}
        loading={missionsLoading}
        error={missionsError}
        onSelectMission={handleSelectMission}
        onClose={() => setMissionsOpen(false)}
      />

      <MetaverseOpportunityExchange
        open={opportunitiesOpen}
        opportunities={opportunities}
        loading={opportunitiesLoading}
        error={opportunitiesError}
        onClose={() => setOpportunitiesOpen(false)}
      />

      <MetaverseMarket
        open={marketOpen}
        listings={marketListings}
        orders={marketOrders}
        balance={marketBalance}
        loading={marketLoading}
        error={marketError}
        onRefresh={refreshMarket}
        onClose={() => setMarketOpen(false)}
      />

      <MetaverseWorkPassport
        open={passportOpen}
        passport={passport}
        loading={passportLoading}
        error={passportError}
        onClose={() => setPassportOpen(false)}
      />

      <MetaverseCivicHall
        open={civicOpen}
        civicState={orchestration?.civic_state}
        onClose={() => setCivicOpen(false)}
      />

      <MetaverseEnterpriseHub
        open={enterpriseOpen}
        enterprises={myEnterprises}
        myTeams={myStudioTeams}
        opportunities={opportunities}
        loading={enterprisesLoading}
        error={enterprisesError}
        canReview={false}
        onRefresh={refreshEnterprises}
        onClose={() => setEnterpriseOpen(false)}
      />

      <footer className="met-footer">
        <span>{METAVERSE_NAVIGATION_MODEL_META.projectionPhase}</span>
        <span>Presence and chat are server-authoritative; no client-declared counts are rendered</span>
      </footer>
    </main>
  );
}

export default function MetaverseCityPage() {
  const routePath = typeof window === "undefined"
    ? ""
    : (window.location.hash.startsWith("#/") ? window.location.hash.slice(1).split("?")[0] : window.location.pathname);
  if (routePath === "/metaverse") return <MetaverseHomePage />;
  if (routePath === "/metaverse/dev/ocean") return <OceanEngineDevPage />;
  const routeSlug = routePath.match(/^\/metaverse\/([^/]+)$/)?.[1] || null;
  const regionalScene = routeSlug ? getRegionalSceneBySlug(routeSlug) : null;
  if (regionalScene) return <MetaverseRegionalScenePage scene={regionalScene} />;
  return <MetaverseCityExperience />;
}
