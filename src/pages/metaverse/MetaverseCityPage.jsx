import React, { useEffect, useMemo, useRef, useState } from "react";
import MetaverseBreadcrumbs from "@/components/metaverse/MetaverseBreadcrumbs.jsx";
import MetaverseActivityMount from "@/components/metaverse/MetaverseActivityMount.jsx";
import MetaverseCamera from "@/components/metaverse/MetaverseCamera.jsx";
import MetaverseCameraControls from "@/components/metaverse/MetaverseCameraControls.jsx";
import MetaverseContextPanel from "@/components/metaverse/MetaverseContextPanel.jsx";
import MetaverseLocationNavigator from "@/components/metaverse/MetaverseLocationNavigator.jsx";
import MetaversePresenceHud from "@/components/metaverse/MetaversePresenceHud.jsx";
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
import {
  METAVERSE_ACTIVITY_PLACEHOLDERS,
  METAVERSE_DISTRICTS,
  METAVERSE_NAVIGATION_MODEL_META,
  findProductionEnvironmentAsset,
  getActivitiesForFacility,
  getBreadcrumbs,
  getDistrictById,
  getFacilityById,
} from "@/system/metaverse/metaverseNavigationModel.js";
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
import { getMyWorkPassport } from "@/system/metaverse/metaversePassportClient.js";
import { fastTravel as fastTravelApi, getCityOrchestration } from "@/system/metaverse/metaverseOrchestrationClient.js";
import { resolveDevUserId } from "@/lib/liveLearning/api.js";
import "./metaverse-city.css";

const PRESENCE_HEARTBEAT_INTERVAL_MS = 25000;
const CITY_PRESENCE_POLL_MS = 15000;
const ROOM_PARTICIPANTS_POLL_MS = 10000;
const MISSIONS_POLL_MS = 30000;
const OPPORTUNITIES_POLL_MS = 30000;
const MARKET_POLL_MS = 30000;
const PASSPORT_POLL_MS = 45000;
const ORCHESTRATION_POLL_MS = 30000;

const CAMERA_HOME = { x: 0, y: 0, zoom: 1 };

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

export default function MetaverseCityPage() {
  const reducedMotion = useReducedMotion();
  const [level, setLevel] = useState("CITY_OVERVIEW");
  const [districtId, setDistrictId] = useState(null);
  const [facilityId, setFacilityId] = useState(null);
  const [activityId, setActivityId] = useState(null);
  const [camera, setCamera] = useState(CAMERA_HOME);
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
  const [chatOpen, setChatOpen] = useState(false);
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
  const [passport, setPassport] = useState(null);
  const [passportLoading, setPassportLoading] = useState(true);
  const [passportError, setPassportError] = useState("");
  const [passportOpen, setPassportOpen] = useState(false);
  const [orchestration, setOrchestration] = useState(null);
  const [orchestrationError, setOrchestrationError] = useState("");
  const presenceStatusRef = useRef(presenceStatus);
  const currentUserId = resolveDevUserId("learner");

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
      setChatOpen(false);
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
    if (level === "FACILITY_VIEW" || level === "ACTIVITY_SIMULATION_VIEW") {
      return findProductionEnvironmentAsset({ cameraLevel: "FACILITY_VIEW", districtId, facilityId });
    }
    if (level === "DISTRICT_VIEW") {
      return findProductionEnvironmentAsset({ cameraLevel: "DISTRICT_VIEW", districtId, facilityId: null });
    }
    return findProductionEnvironmentAsset({ cameraLevel: "CITY_OVERVIEW", districtId: null, facilityId: null });
  }, [level, districtId, facilityId]);

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

  const focusCamera = (item) => {
    const next = {
      x: Math.max(-18, Math.min(18, 50 - item.x)),
      y: Math.max(-14, Math.min(14, 48 - item.y)),
      zoom: level === "CITY_OVERVIEW" ? 1.22 : 1.18,
    };
    setCamera(reducedMotion ? next : next);
  };

  const selectDistrict = async (district) => {
    const resource = { ...district, id: district.id, type: "DISTRICT" };
    const unlock = await requestProtectedDecision(resource, "enter");
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
      setSelection(null);
    } else if (crumb.level === "DISTRICT_VIEW") {
      const district = getDistrictById(crumb.id);
      if (district) selectDistrict(district);
    } else if (crumb.level === "FACILITY_VIEW") {
      const facility = getFacilityById(crumb.id);
      if (facility) selectFacility(facility);
    }
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

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (navigatorOpen) {
          setNavigatorOpen(false);
        } else if (selection) {
          setSelection(null);
          setEntryNotice("");
        } else goBack();
      }
      if (event.key === "+" || event.key === "=") setCamera((value) => ({ ...value, zoom: Math.min(1.8, value.zoom + 0.1) }));
      if (event.key === "-") setCamera((value) => ({ ...value, zoom: Math.max(1, value.zoom - 0.1) }));
      if (event.key === "ArrowLeft") setCamera((value) => ({ ...value, x: Math.max(-22, value.x - 2) }));
      if (event.key === "ArrowRight") setCamera((value) => ({ ...value, x: Math.min(22, value.x + 2) }));
      if (event.key === "ArrowUp") setCamera((value) => ({ ...value, y: Math.max(-18, value.y - 2) }));
      if (event.key === "ArrowDown") setCamera((value) => ({ ...value, y: Math.min(18, value.y + 2) }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigatorOpen, selection, level]);

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
  const currentTitle = selectedActivity?.label || selectedFacility?.label || selectedDistrict?.label || "Silicon Heartland";
  const contextSelection = selection || (level === "ACTIVITY_SIMULATION_VIEW" && selectedActivity ? { ...selectedActivity, type: "ACTIVITY", unlock: getUnlock({ id: selectedActivity.id, type: "ACTIVITY" }) } : null);
  const contextUnlock = contextSelection?.unlock || (contextSelection ? getUnlock({ id: contextSelection.id, type: contextSelection.type }) : null);
  const selectedBuildingPreview = selectedFacility
    ? orchestration?.building_previews?.find((preview) => preview.facility_id === selectedFacility.id)
    : null;

  return (
    <main
      className="met-shell"
      data-camera-level={level}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-route="/metaverse"
      data-authorization-state={authorizationState}
    >
      <MetaverseCamera
        background={background}
        camera={camera}
        markers={markers}
        selectedId={selection?.id}
        getUnlock={getUnlock}
        onSelectMarker={handleMarkerSelect}
        onCameraChange={setCamera}
        reducedMotion={reducedMotion}
      />

      <header className="met-hud met-hud--top">
        <div>
          <p className="met-kicker">Silicon Heartland Metaverse</p>
          <h1>{currentTitle}</h1>
        </div>
        <MetaverseBreadcrumbs breadcrumbs={breadcrumbs} onNavigate={goToCrumb} />
        <MetaversePresenceHud
          counts={cityCounts}
          districtId={level === "CITY_OVERVIEW" ? null : districtId}
          status={presenceStatus}
          onStatusChange={handleStatusChange}
        />
      </header>

      <MetaverseCameraControls
        onZoomIn={() => setCamera((value) => ({ ...value, zoom: Math.min(1.8, value.zoom + 0.12) }))}
        onZoomOut={() => setCamera((value) => ({ ...value, zoom: Math.max(1, value.zoom - 0.12) }))}
        onReset={() => setCamera(CAMERA_HOME)}
        onBack={goBack}
        canGoBack={level !== "CITY_OVERVIEW" || Boolean(selection)}
        navigatorOpen={navigatorOpen}
        onToggleNavigator={() => setNavigatorOpen((value) => !value)}
        missionsOpen={missionsOpen}
        onToggleMissions={() => setMissionsOpen((value) => !value)}
        missionCount={missions.length}
        opportunitiesOpen={opportunitiesOpen}
        onToggleOpportunities={() => setOpportunitiesOpen((value) => !value)}
        opportunityCount={opportunities.length}
        marketOpen={marketOpen}
        onToggleMarket={() => setMarketOpen((value) => !value)}
        marketCount={marketListings.length}
        passportOpen={passportOpen}
        onTogglePassport={() => setPassportOpen((value) => !value)}
        passportClaimCount={passport?.claims?.length || 0}
      />

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

      <section className="met-orchestration" aria-label="City economy orchestration">
        <MetaverseNextAction action={orchestration?.next_action} onSelect={handleOrchestrationAction} />
        <MetaverseDailyBriefing briefing={orchestration?.briefing} />
        <MetaverseFastTravel destinations={orchestration?.fast_travel_destinations || []} onTravel={navigateFastTravelDestination} />
        <MetaverseMiniMap
          currentDistrictId={districtId}
          pulses={orchestration?.district_pulses || []}
          destinations={orchestration?.fast_travel_destinations || []}
          onTravel={navigateFastTravelDestination}
        />
        <MetaverseDistrictPulse pulses={orchestration?.district_pulses || []} />
        <MetaverseCityEvents events={orchestration?.city_events || []} />
      </section>

      <MetaverseBuildingPreview
        preview={selectedBuildingPreview}
        onEnter={(preview) => {
          const facility = getFacilityById(preview.facility_id);
          if (facility) selectFacility(facility);
        }}
      />

      {activeRoom ? (
        <MetaverseParticipantList
          participantCount={roomParticipants.participant_count}
          participants={roomParticipants.participants}
        />
      ) : null}

      {activeRoom ? (
        <MetaverseChatTray
          room={activeRoom}
          open={chatOpen}
          onToggle={setChatOpen}
          currentUserId={currentUserId}
          roomLabel={selectedFacility?.label}
          directMessagingNote={directMessagingNote}
        />
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

      <footer className="met-footer">
        <span>{METAVERSE_NAVIGATION_MODEL_META.projectionPhase}</span>
        <span>Presence and chat are server-authoritative; no client-declared counts are rendered</span>
      </footer>
    </main>
  );
}
