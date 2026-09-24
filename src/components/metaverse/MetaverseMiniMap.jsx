import React, { useState } from "react";
import { createPortal } from "react-dom";
import { publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";
import {
  MINIMAP_ASSET,
  MINIMAP_CALIBRATION_TARGET_IDS,
  getCalibratedMiniMapLocations,
  getMiniMapLocationById,
  getMiniMapLocationIcon,
  formatMiniMapCalibrationMapping,
  resolveMiniMapCalibrationModeEnabled,
  resolveMiniMapFaceFixtureEnabled,
} from "@/system/metaverse/metaverseMiniMapRegistry.js";
import { resolveMetaverseDevModeEnabled } from "@/system/metaverse/metaverseTimeOfDay.js";

// MINIMAP V3 — CANONICAL BLUE-FROST INTERACTIVE CITY MAP.
//
// STATE (PART 3): three persisted states — collapsed (pill only),
// compact (map + major districts + current student + basic presence),
// expanded (full tabs: District Map / Students Nearby / Layers).
// Persisted the same safe try/catch localStorage pattern
// MetaverseSidebar.jsx already uses for its own expand/collapse
// preference (a genuine per-student UI preference, unlike the DEV
// time-mode override, which is intentionally sessionStorage-scoped).
//
// LAYER ORDER (unchanged from V2, still all DOM siblings, nothing ever
// baked into MINIMAP_ASSET): base map image -> district/location
// markers -> current student (the "is-you" marker within that same
// loop) -> other-student presence (aggregate count badge only, PART 7/
// 15 — no exact per-student coordinates exist anywhere in this system)
// -> event/opportunity indicators (within the district marker) ->
// infrastructure landmarks -> legend/UI.
//
// ADAPTIVE DENSITY (PART 5): the compact canvas has no real
// cartographic pan/zoom, so "zoom" here is a lightweight CSS
// scale+transform-origin the Recenter/Fit World actions drive (PART
// 12) — at the default 1x fit, only district markers render; zooming
// in (Recenter) additionally reveals infrastructure landmarks and
// event/opportunity indicators, which is the documented, honest scope
// of "adaptive density" for this phase (see the phase report).
const MAP_STATE_STORAGE_KEY = "met-citymap-state";
const MAP_STATES = ["collapsed", "compact", "expanded"];
const MAP_TABS = ["DISTRICT_MAP", "STUDENTS_NEARBY", "LAYERS"];

function isDevReviewModeEnabled() {
  if (typeof window === "undefined") return false;
  return resolveMetaverseDevModeEnabled({ isDev: import.meta.env.DEV, search: window.location.search });
}

// HARD VISUAL MATCH — PART 8: under ?metaverseDev=1 the panel always
// opens EXPANDED for owner/developer review, regardless of any
// previously-stored collapsed/compact preference (the owner's own
// earlier testing, or a prior student session sharing the same
// browser profile, could otherwise leave it stuck collapsed with no
// visible way to know that's why the map looks "missing"). A normal
// student session (no dev flag) still remembers their real preference
// exactly as before.
function readStoredMapState() {
  if (isDevReviewModeEnabled()) return "expanded";
  try {
    const raw = window.localStorage.getItem(MAP_STATE_STORAGE_KEY);
    return MAP_STATES.includes(raw) ? raw : "expanded";
  } catch {
    return "expanded";
  }
}

function writeStoredMapState(value) {
  try {
    window.localStorage.setItem(MAP_STATE_STORAGE_KEY, value);
  } catch {
    // Private-browsing / storage-disabled — the map-state preference
    // just won't persist across sessions.
  }
}

function shortDistrictLabel(districtId) {
  return districtId.replace(/-district$/, "").replace(/-/g, " ");
}

// The canvas is small and several district dots sit close together, so
// a full multi-word label ("Career & Education") would overrun its
// neighbors — the first word plus CSS ellipsis keeps tags readable
// without truncating the ACCESSIBLE name anywhere (aria-label/callout
// still carry the full label).
function mapTagLabel(label) {
  return label.split(/\s+/)[0];
}

// PART 8 — a real `display_name` (a two-word full name) is shortened
// to "First L." for the compact rail, matching the approved mock's
// display convention. This is a display-only transform of a REAL name
// field, never an invented one.
function displayStudentName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Student";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
}

function initialsFor(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
}

function isCalibrationModeEnabled() {
  if (typeof window === "undefined") return false;
  return resolveMiniMapCalibrationModeEnabled({ isDev: import.meta.env.DEV, search: window.location.search });
}

function readCalibrationTargetId() {
  if (typeof window === "undefined") return "";
  const targetId = new URLSearchParams(window.location.search).get("minimapTarget") || "";
  return MINIMAP_CALIBRATION_TARGET_IDS.includes(targetId) ? targetId : "";
}

function isFaceFixtureModeEnabled() {
  if (typeof window === "undefined") return false;
  return resolveMiniMapFaceFixtureEnabled({ isDev: import.meta.env.DEV, search: window.location.search });
}

// FINAL RECONCILIATION V3.1 — PART 6: obviously-labeled fixture
// identities (never a real name shape) so a stray screenshot or a
// developer forgetting the flag was on can never mistake this for a
// real student — visual QA only for the Students Nearby layout when no
// real room roster exists yet. Gated by isFaceFixtureModeEnabled()
// (dev build + explicit ?minimapFaceFixture=1) and only ever
// substituted when there is no real activeRoomParticipants data.
const DEV_FIXTURE_PARTICIPANTS = [
  { presence_session_id: "dev-fixture-1", display_name: "Fixture Alex", status: "available" },
  { presence_session_id: "dev-fixture-2", display_name: "Fixture Riley", status: "in_activity" },
  { presence_session_id: "dev-fixture-3", display_name: "Fixture Sam", status: "available" },
  { presence_session_id: "dev-fixture-4", display_name: "Fixture Jordan", status: "away" },
];
const DEV_FIXTURE_ROOM = { participant_count: DEV_FIXTURE_PARTICIPANTS.length, participants: DEV_FIXTURE_PARTICIPANTS };

export default function MetaverseMiniMap({
  regionalScene = null,
  regionalScenes = [],
  currentDistrictId,
  // FINAL RECONCILIATION V3.1 — PART 4: the "you are here" marker's
  // anchor. Defaults to currentDistrictId (unchanged behavior for any
  // caller that doesn't pass it), but MetaverseCityPage.jsx passes the
  // student's last real district so the marker still has a real,
  // non-fabricated coarse position to anchor to once the student
  // returns to the city overview (currentDistrictId === null there).
  youAreHereDistrictId,
  pulses = [],
  destinations = [],
  onTravel,
  districts = [],
  presenceCounts = [],
  events = [],
  opportunityCountsByDistrict = {},
  civicActive = false,
  activeRoomParticipants = null,
  reducedMotion = false,
  onSelectDistrict,
}) {
  const youAreHereAnchorId = youAreHereDistrictId || currentDistrictId;
  const [mapState, setMapState] = useState(() => readStoredMapState());
  const [activeTab, setActiveTab] = useState("DISTRICT_MAP");
  const [fullMapOpen, setFullMapOpen] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapOrigin, setMapOrigin] = useState("50% 50%");
  const [calibrationPoint, setCalibrationPoint] = useState(null);
  const [calibrationTargetId, setCalibrationTargetId] = useState(readCalibrationTargetId);
  const [calibrationCopied, setCalibrationCopied] = useState(false);
  const [layerToggles, setLayerToggles] = useState({
    districts: true,
    students: true,
    events: true,
    opportunities: true,
    civic: true,
  });
  const calibrationMode = isCalibrationModeEnabled();
  const faceFixtureMode = isFaceFixtureModeEnabled();
  const infrastructureLocations = getCalibratedMiniMapLocations();
  const mapAssetUrl = publicAssetUrl(MINIMAP_ASSET);
  // FINAL RECONCILIATION V3.1 — PART 6: only ever substitutes fixture
  // data when there is NO real roster — a real activeRoomParticipants
  // value (even an empty one from an actually-empty real room) always
  // wins, so the fixture can never mask or override real presence.
  const usingFaceFixture = !activeRoomParticipants && faceFixtureMode;
  const effectiveRoomParticipants = activeRoomParticipants || (faceFixtureMode ? DEV_FIXTURE_ROOM : null);

  const setMapStateAndPersist = (value) => {
    setMapState(value);
    writeStoredMapState(value);
  };

  const countForDistrict = (districtId) => {
    const entry = presenceCounts.find((item) => item.district_id === districtId);
    return Number(entry?.online_count || 0);
  };
  const opportunityCountFor = (districtId) => Number(opportunityCountsByDistrict[districtId] || 0);
  const hasActiveEvent = (districtId) => events.some((event) => event.district_id === districtId && event.status === "ACTIVE");
  const totalOnline = presenceCounts.reduce((sum, item) => sum + Number(item.online_count || 0), 0);
  const denseMarkers = mapZoom > 1.05;
  const toggleLayer = (key) => setLayerToggles((value) => ({ ...value, [key]: !value[key] }));

  // PART 12 — Recenter zooms/pans (via transform-origin) toward the
  // CURRENT district's real position; Fit World returns to the
  // default 1x whole-map view. Neither touches the main scene camera
  // (that Reset lives in the sidebar now, per PART 1) — these are
  // minimap-local view controls only.
  const handleRecenter = () => {
    const mine = districts.find((district) => district.id === currentDistrictId);
    const quickMapMine = getMiniMapLocationById(mine?.id);
    if (quickMapMine && quickMapMine.status !== "UNMAPPED") setMapOrigin(`${quickMapMine.x}% ${quickMapMine.y}%`);
    setMapZoom(1.7);
  };
  const handleFitWorld = () => {
    setMapOrigin("50% 50%");
    setMapZoom(1);
  };

  const handleCalibrationClick = (event) => {
    if (!calibrationMode) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const point = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    setCalibrationPoint(point);
    setCalibrationCopied(false);
    // eslint-disable-next-line no-console
    console.log(`[minimapCalibrate] ${formatMiniMapCalibrationMapping({ targetId: calibrationTargetId || "unassigned", ...point })}`);
  };

  const calibrationTarget = getMiniMapLocationById(calibrationTargetId);
  const calibrationMapping = calibrationPoint && calibrationTargetId
    ? formatMiniMapCalibrationMapping({ targetId: calibrationTargetId, ...calibrationPoint })
    : null;
  const copyCalibrationMapping = async () => {
    if (!calibrationMapping || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(calibrationMapping);
    setCalibrationCopied(true);
  };

  // PIXEL-FAITHFUL MOCK MATCH — PHASE 9: Recenter/Fit World/View Full
  // Map are small icon-only buttons OVERLAID directly on the map
  // canvas corner (outside the scaled/panned .met-citymap__canvas-inner,
  // so they never move or shrink with zoom) instead of a full text
  // button row beneath the map — the approved mock leaves the map
  // canvas uninterrupted by a separate control row, and every map
  // action stays visually "inside the map system" per the brief.
  const renderMapToolbar = () => (
    <div className="met-citymap__map-toolbar">
      <button type="button" className="met-citymap__map-toolbar-btn" onClick={handleRecenter} aria-label="Recenter map on your district" title="Recenter">
        {"⌖"}
      </button>
      <button type="button" className="met-citymap__map-toolbar-btn" onClick={handleFitWorld} aria-label="Fit world" title="Fit World">
        {"⛶"}
      </button>
      <button type="button" className="met-citymap__map-toolbar-btn" onClick={() => setFullMapOpen(true)} aria-label="View full map" title="View Full Map">
        {"⤢"}
      </button>
    </div>
  );

  const renderMapLayers = (variant) => (
    <div
      className={`met-citymap__canvas ${variant === "full" ? "met-citymap__canvas--full" : ""}`}
      onClick={calibrationMode ? handleCalibrationClick : undefined}
    >
      <div
        className="met-citymap__canvas-inner"
        style={{
          backgroundImage: `url(${mapAssetUrl})`,
          transform: `scale(${mapZoom})`,
          transformOrigin: mapOrigin,
        }}
      >
        {/* FINAL RECONCILIATION V3.1 — PART 3: the approved base map
            art still has district names baked into the image (a
            BASE-ASSET limitation — regenerating that art is explicitly
            out of scope for this pass). This scrim dims the raw image
            just enough that it reads as geographic base art rather than
            a competing label layer, so the live marker chips below (a
            real DOM overlay, never baked into the PNG) stay the
            visually dominant source of district names/status. */}
        <span className="met-citymap__canvas-scrim" aria-hidden="true" />
        {/* DISTRICT/LOCATION MARKERS + CURRENT STUDENT + OTHER STUDENT
            (count-only) + EVENT/OPPORTUNITY indicators — one combined
            overlay per district. */}
        {layerToggles.districts
          ? districts.map((district) => {
              const quickMapLocation = getMiniMapLocationById(district.id);
              if (!quickMapLocation || quickMapLocation.status === "UNMAPPED") return null;
              const isYou = district.id === youAreHereAnchorId;
              const count = layerToggles.students ? countForDistrict(district.id) : 0;
              const live = layerToggles.events && hasActiveEvent(district.id);
              const opportunityCount = layerToggles.opportunities ? opportunityCountFor(district.id) : 0;
              const civicHere = layerToggles.civic && civicActive && district.id === "civic-district";
              const statusLabel = (live || civicHere) ? "Live" : "Available";
              return (
                <button
                  key={district.id}
                  type="button"
                  className={`met-citymap__marker ${isYou ? "is-you" : ""} ${live || civicHere ? "has-event" : ""}`}
                  style={{ left: `${quickMapLocation.x}%`, top: `${quickMapLocation.y}%` }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectDistrict?.(district);
                  }}
                  aria-label={`${district.fullLabel || district.label}${isYou ? ", you are here" : ""}${count > 0 ? `, ${count} online` : ""}${live || civicHere ? ", live event" : ""}${opportunityCount > 0 ? `, ${opportunityCount} opportunities` : ""}`}
                >
                  <span className="met-citymap__dot" />
                  {isYou ? <span className="met-citymap__you-pulse" aria-hidden="true" /> : null}
                  {/* FINAL RECONCILIATION V3.1 — PART 3/5: a real chip
                      (icon + name), not bare shadowed text, so it reads
                      above the baked map art — and PART 5 adaptive
                      labels: the broad/default view shows the short
                      name only (avoids overlap across 9 close-together
                      districts); zooming in (Recenter) reveals the full
                      name + a real, derived status word. */}
                  <span className={`met-citymap__tag ${denseMarkers ? "met-citymap__tag--detailed" : ""}`}>
                    <span className="met-citymap__tag-icon" aria-hidden="true">{getMiniMapLocationIcon(district.id) || "📍"}</span>
                    <span className="met-citymap__tag-name">{denseMarkers ? (district.fullLabel || district.label) : mapTagLabel(district.label)}</span>
                    {denseMarkers ? <span className="met-citymap__tag-status">{statusLabel}</span> : null}
                  </span>
                  {count > 0 ? <span className="met-citymap__count-badge">{count}</span> : null}
                  {live || civicHere ? <span className="met-citymap__event-flag">{"✦"}</span> : null}
                  {opportunityCount > 0 ? <span className="met-citymap__opportunity-flag">{"◆"}</span> : null}
                  {/* PART 11 — contextual callout, hover/focus-revealed
                      (same fade mechanism as the main-scene hotspot
                      cards), never permanently visible. "You are here"
                      text itself (PART 4) only ever surfaces here, on
                      focus/hover/selection — never as a permanent label
                      on the marker chip above. */}
                  <span className="met-citymap__callout" aria-hidden="true">
                    <span className="met-citymap__callout-title">{district.fullLabel || district.label}{isYou ? " — You are here" : ""}</span>
                    <span className="met-citymap__callout-meta">
                      {statusLabel === "Live" ? "Live event" : "Available"}
                      {opportunityCount > 0 ? ` · ${opportunityCount} opportunit${opportunityCount === 1 ? "y" : "ies"}` : ""}
                    </span>
                    <span className="met-citymap__callout-action">Explore {"›"}</span>
                  </span>
                </button>
              );
            })
          : null}
        {/* INFRASTRUCTURE MARKERS — only revealed at closer zoom (PART
            5 adaptive density); registry-calibrated (provisional)
            locations only, no destinationRoute yet. */}
        {denseMarkers
          ? infrastructureLocations.map((location) => (
              <span
                key={location.id}
                className="met-citymap__infra-marker"
                style={{ left: `${location.x}%`, top: `${location.y}%` }}
                title={`${location.label} (provisional placement, pending owner confirmation)`}
              >
                <span className="met-citymap__infra-icon" aria-hidden="true">{location.icon}</span>
              </span>
            ))
          : null}
        {calibrationMode && calibrationPoint ? (
          <span className="met-citymap__calibration-point" style={{ left: `${calibrationPoint.x}%`, top: `${calibrationPoint.y}%` }}>
            {calibrationPoint.x}, {calibrationPoint.y}
          </span>
        ) : null}
      </div>
      {variant === "compact" ? renderMapToolbar() : null}
    </div>
  );

  const renderStudentsNearby = () => (
    <div className="met-citymap__students">
      <h3 className="met-citymap__panel-title">
        Students Nearby
        {usingFaceFixture ? <span className="met-citymap__fixture-badge">DEV FIXTURE</span> : null}
      </h3>
      {effectiveRoomParticipants && effectiveRoomParticipants.participants.length > 0 ? (
        <ul className="met-citymap__students-list">
          {effectiveRoomParticipants.participants.map((participant) => (
            <li key={participant.presence_session_id} className="met-citymap__student-row">
              <span className="met-citymap__student-face" aria-hidden="true">
                {/* FINAL RECONCILIATION V3.1 — PART 6: the component is
                    "visually ready for real faces" — a real avatar_url
                    (once the data model ever carries one) renders as an
                    image; until then it always falls back to real
                    initials, never an invented photo. */}
                {participant.avatar_url ? (
                  <img src={participant.avatar_url} alt="" className="met-citymap__student-photo" />
                ) : (
                  initialsFor(participant.display_name)
                )}
              </span>
              <span className="met-citymap__student-info">
                <span className="met-citymap__student-name">
                  {displayStudentName(participant.display_name)}
                  <span className={`met-status-dot met-status-dot--${String(participant.status || "").toLowerCase()}`} aria-label={participant.status || "status unknown"} />
                </span>
                <span className="met-citymap__student-location">{currentDistrictId ? shortDistrictLabel(currentDistrictId) : "City overview"}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        // PART 8/15 — no live named-presence data is available at city
        // scope (only per-district aggregate counts exist — see PART
        // 7). Real aggregate count only; no invented names/faces.
        <p className="met-citymap__students-empty">
          {totalOnline > 0
            ? `${totalOnline} student${totalOnline === 1 ? "" : "s"} online across Silicon Heartland right now. Enter a facility to see who's there.`
            : "No live student presence data available right now."}
        </p>
      )}
    </div>
  );

  const renderLayers = () => (
    <div className="met-citymap__layers">
      <h3 className="met-citymap__panel-title">Layers</h3>
      <ul className="met-citymap__layers-list">
        <li>
          <button type="button" className="met-citymap__layer-toggle" onClick={() => toggleLayer("districts")} aria-pressed={layerToggles.districts}>
            Districts
          </button>
        </li>
        <li>
          <button type="button" className="met-citymap__layer-toggle" onClick={() => toggleLayer("students")} aria-pressed={layerToggles.students}>
            Students
          </button>
        </li>
        <li>
          <button type="button" className="met-citymap__layer-toggle" onClick={() => toggleLayer("events")} aria-pressed={layerToggles.events}>
            Events
          </button>
        </li>
        <li>
          <button type="button" className="met-citymap__layer-toggle" onClick={() => toggleLayer("opportunities")} aria-pressed={layerToggles.opportunities}>
            Opportunities
          </button>
        </li>
        <li>
          <button type="button" className="met-citymap__layer-toggle" onClick={() => toggleLayer("civic")} aria-pressed={layerToggles.civic} disabled={!civicActive}>
            Civic Activity{!civicActive ? " (none active)" : ""}
          </button>
        </li>
      </ul>
      {/* PART 10 — Transit/Sky Loop and Traffic are deliberately absent
          here: no real production data currently feeds either into the
          minimap, and the brief explicitly says not to fabricate a
          layer merely to populate the list. */}
      <p className="met-citymap__layers-note">Transit and Traffic layers appear here once real city-state data is wired in.</p>
      {/* UI AUTHORITY RECONCILIATION — PART 6 (information hierarchy):
          moved out of the primary District Map view, where these
          verbose "No source-backed activity right now" cards were
          dominating the panel below the map. Still the same real,
          required accessible text-equivalent (MET-11/MET-15 — a
          screen-reader-reachable equivalent of the hover-revealed
          marker callouts), just relocated to this secondary tab
          instead of sitting permanently under the map. */}
      <h3 className="met-citymap__panel-title">District Activity</h3>
      <ul aria-label="Text equivalent district activity" className="met-citymap__activity-list">
        {pulses.slice(0, 9).map((pulse) => (
          <li key={pulse.district_id} data-current={pulse.district_id === currentDistrictId ? "true" : "false"}>
            {pulse.district_id.replace(/-district$/, "").replace(/-/g, " ")}: {pulse.status_summary}
          </li>
        ))}
      </ul>
    </div>
  );

  if (regionalScene) {
    const quickMapUrl = regionalScene.quickMapAsset.asset ? publicAssetUrl(regionalScene.quickMapAsset.asset) : "";
    const previousStop = regionalScenes.find((stop) => stop.id === regionalScene.previousScene);
    const nextStop = regionalScenes.find((stop) => stop.id === regionalScene.nextScene);
    return (
      <section className={`met-minimap met-citymap met-citymap--regional met-citymap--${mapState}`} aria-labelledby="met-regional-minimap-title">
        <div
          className="met-minimap__head"
          onClick={mapState === "collapsed" ? () => setMapStateAndPersist("compact") : undefined}
        >
          <span className="met-citymap__head-icon" aria-hidden="true">🗺️</span>
          <h2 id="met-regional-minimap-title">Quick Map</h2>
          {mapState === "collapsed" ? (
            <button type="button" className="met-minimap__toggle" onClick={() => setMapStateAndPersist("compact")} aria-expanded={false} aria-label="Expand Quick Map">
              {"^"}
            </button>
          ) : (
            <button type="button" className="met-minimap__toggle" onClick={() => setMapStateAndPersist("collapsed")} aria-expanded={true} aria-label="Collapse Quick Map">
              {"–"}
            </button>
          )}
        </div>

        {mapState !== "collapsed" ? (
          <>
            {quickMapUrl ? (
              <div className="met-regional-map__canvas" style={{ aspectRatio: regionalScene.quickMapAsset.aspectRatio }}>
                <img src={quickMapUrl} alt={`${regionalScene.title} top-down quick map`} loading="lazy" decoding="async" />
                <span className="met-regional-map__marker" aria-hidden="true">{String(regionalScene.order).padStart(2, "0")}</span>
                <span className="met-regional-map__west" aria-hidden="true">WEST / CITY</span>
                <span className="met-regional-map__east" aria-hidden="true">EAST / OCEAN</span>
              </div>
            ) : (
              <div className="met-regional-map__missing" role="status">
                Approved Quick Map asset pending
              </div>
            )}
            <div className="met-regional-map__meta">
              <span>Current: {String(regionalScene.order).padStart(2, "0")} {regionalScene.title}</span>
              {previousStop ? <span>Previous: {previousStop.title}</span> : null}
              <span>Next: {nextStop?.title || "Route pending"}</span>
              <span>Travel: {regionalScene.travelDirection}</span>
            </div>
            {mapState === "expanded" ? (
              <ol className="met-regional-map__route" aria-label="Regional route overview">
                {regionalScenes.map((stop) => (
                  <li key={stop.id} data-current={stop.id === regionalScene.id ? "true" : "false"}>
                    <span>{String(stop.order).padStart(2, "0")}</span>
                    {stop.title}
                  </li>
                ))}
              </ol>
            ) : (
              <button type="button" className="met-regional-map__expand" onClick={() => setMapStateAndPersist("expanded")}>
                Route overview
              </button>
            )}
          </>
        ) : null}
      </section>
    );
  }

  return (
    <section className={`met-minimap met-citymap met-citymap--${mapState}`} aria-labelledby="met-minimap-title">
      <div
        className="met-minimap__head"
        // FINAL RECONCILIATION V3.1 — PART 7: when collapsed, the
        // ENTIRE pill (not just the small chevron button) is a click
        // target for re-expanding — the dedicated button below still
        // exists for keyboard/screen-reader users, but a pointer click
        // anywhere on the pill now reliably re-expands it even if the
        // exact button geometry is ever partially covered.
        onClick={mapState === "collapsed" ? () => setMapStateAndPersist("expanded") : undefined}
      >
        <span className="met-citymap__head-icon" aria-hidden="true">🗺️</span>
        <h2 id="met-minimap-title">City Map</h2>
        {/* VISUAL RECONCILIATION PHASE B — tabs moved into the SAME
            header row as the title (matching the approved mock's
            header layout), not a separate row below. Only shown once
            expanded; compact/collapsed keep the plain header. */}
        {mapState === "expanded" ? (
          <div className="met-citymap__tabs" role="tablist" aria-label="City Map views">
            {MAP_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                className="met-citymap__tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "DISTRICT_MAP" ? "District Map" : tab === "STUDENTS_NEARBY" ? "Students Nearby" : "Layers"}
              </button>
            ))}
          </div>
        ) : null}
        {mapState === "collapsed" ? (
          <button type="button" className="met-minimap__toggle" onClick={() => setMapStateAndPersist("expanded")} aria-expanded={false} aria-label="Expand City Map">
            {"^"}
          </button>
        ) : (
          <button type="button" className="met-minimap__toggle" onClick={() => setMapStateAndPersist("collapsed")} aria-expanded={true} aria-label="Collapse City Map">
            {"–"}
          </button>
        )}
      </div>

      {mapState !== "collapsed" ? (
        <>
          {/* PIXEL-FAITHFUL MOCK MATCH — PHASE 3: "Current district: X"
              is not present anywhere in the approved reference — removed.
              District context is still fully available via the map's own
              markers/callouts and the sidebar breadcrumb. */}
          {calibrationMode ? (
            <div className="met-citymap__calibration-panel" data-calibration-mode="true">
              <label className="met-citymap__calibration-label">
                Calibration target
                <select value={calibrationTargetId} onChange={(event) => { setCalibrationTargetId(event.target.value); setCalibrationPoint(null); setCalibrationCopied(false); }}>
                  <option value="">Select a district or destination</option>
                  {MINIMAP_CALIBRATION_TARGET_IDS.map((targetId) => <option key={targetId} value={targetId}>{targetId}</option>)}
                </select>
              </label>
              <p className="met-citymap__calibration-note">
                Click the map to preview normalized x/y. Existing: {calibrationTarget?.x ?? "null"}, {calibrationTarget?.y ?? "null"} · status: {calibrationTarget?.status || "UNMAPPED"}
              </p>
              {calibrationMapping ? <div className="met-citymap__calibration-output"><code>{calibrationMapping}</code><button type="button" onClick={copyCalibrationMapping}>{calibrationCopied ? "Copied" : "Copy mapping"}</button></div> : null}
              <button type="button" onClick={() => { setCalibrationPoint(null); setCalibrationCopied(false); }}>Clear preview</button>
            </div>
          ) : null}

          {mapState === "compact" ? (districts.length ? renderMapLayers("compact") : null) : null}

          {/* VISUAL RECONCILIATION PHASE B / PIXEL-FAITHFUL MOCK MATCH —
              expanded District Map is a two-column layout (large map
              left, legend + student face row right), matching the
              approved mock's panel composition. Recenter/Fit World/View
              Full Map now live as a compact icon toolbar overlaid on the
              map canvas itself (see renderMapToolbar) instead of a
              button row beneath it, and the old City Home/Next Action/
              Career Center/Arcade fast-travel row and the "N students
              online" line are gone — that navigation capability already
              lives in the sidebar, and the reference has no equivalent
              block inside the City Map panel. */}
          {mapState === "expanded" && activeTab === "DISTRICT_MAP" ? (
            <div className="met-citymap__district-body">
              <div className="met-citymap__map-col">
                {districts.length ? renderMapLayers("compact") : null}
              </div>
              <div className="met-citymap__side-col">
                <h3 className="met-citymap__panel-title">Map Legend</h3>
                <ul className="met-citymap__legend" aria-hidden="true">
                  <li><span className="met-citymap__legend-swatch met-citymap__legend-swatch--district" /> District</li>
                  <li><span className="met-citymap__legend-swatch met-citymap__legend-swatch--you" /> Student (You)</li>
                  <li><span className="met-citymap__legend-swatch met-citymap__legend-swatch--count">#</span> Classmate/Student</li>
                  <li><span className="met-citymap__legend-swatch met-citymap__legend-swatch--event">{"✦"}</span> Event</li>
                  <li><span className="met-citymap__legend-swatch met-citymap__legend-swatch--opportunity">{"◆"}</span> Opportunity</li>
                  <li><span className="met-citymap__legend-swatch met-citymap__legend-swatch--infra">⚓</span> Point of Interest</li>
                </ul>
                <h3 className="met-citymap__panel-title">
                  {totalOnline > 0 ? `${totalOnline} Student${totalOnline === 1 ? "" : "s"} Nearby` : "Students Nearby"}
                  {usingFaceFixture ? <span className="met-citymap__fixture-badge">DEV FIXTURE</span> : null}
                </h3>
                {effectiveRoomParticipants && effectiveRoomParticipants.participants.length > 0 ? (
                  <>
                    <div className="met-citymap__face-row">
                      {effectiveRoomParticipants.participants.slice(0, 3).map((participant) => (
                        <span key={participant.presence_session_id} className="met-citymap__student-face" aria-label={displayStudentName(participant.display_name)} title={displayStudentName(participant.display_name)}>
                          {participant.avatar_url ? (
                            <img src={participant.avatar_url} alt="" className="met-citymap__student-photo" />
                          ) : (
                            initialsFor(participant.display_name)
                          )}
                        </span>
                      ))}
                      {effectiveRoomParticipants.participants.length > 3 ? (
                        <span className="met-citymap__student-face met-citymap__student-face--more" aria-label={`${effectiveRoomParticipants.participants.length - 3} more students`}>
                          +{effectiveRoomParticipants.participants.length - 3}
                        </span>
                      ) : null}
                    </div>
                    <button type="button" className="met-citymap__view-all-button" onClick={() => setActiveTab("STUDENTS_NEARBY")}>
                      View All Students <span aria-hidden="true">{"›"}</span>
                    </button>
                  </>
                ) : (
                  <p className="met-citymap__students-empty">
                    {totalOnline > 0 ? "Enter a facility to see who's there." : "No live student presence data available right now."}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {mapState === "expanded" && activeTab === "STUDENTS_NEARBY" ? renderStudentsNearby() : null}
          {mapState === "expanded" && activeTab === "LAYERS" ? renderLayers() : null}
        </>
      ) : null}

      {fullMapOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="met-citymap__modal-backdrop" onClick={() => setFullMapOpen(false)}>
              <div
                className="met-citymap__modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="met-citymap-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="met-citymap__modal-head">
                  <h2 id="met-citymap-modal-title">Silicon Heartland — Full Map</h2>
                  <div className="met-citymap__view-actions">
                    <button type="button" className="met-citymap__view-button" onClick={handleRecenter}>Recenter</button>
                    <button type="button" className="met-citymap__view-button" onClick={handleFitWorld}>Fit World</button>
                  </div>
                  <button type="button" className="met-citymap__modal-close" onClick={() => setFullMapOpen(false)} aria-label="Close full map">
                    {"×"}
                  </button>
                </div>
                {/* Reuses the SAME markers, current-student state,
                    presence data, layer toggles, and event/opportunity
                    state as the compact canvas — no second map
                    architecture (PART 13). */}
                {renderMapLayers("full")}
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
