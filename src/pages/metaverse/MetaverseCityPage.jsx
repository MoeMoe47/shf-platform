import React, { useEffect, useMemo, useState } from "react";
import MetaverseBreadcrumbs from "@/components/metaverse/MetaverseBreadcrumbs.jsx";
import MetaverseCamera from "@/components/metaverse/MetaverseCamera.jsx";
import MetaverseCameraControls from "@/components/metaverse/MetaverseCameraControls.jsx";
import MetaverseContextPanel from "@/components/metaverse/MetaverseContextPanel.jsx";
import MetaverseLocationNavigator from "@/components/metaverse/MetaverseLocationNavigator.jsx";
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
import "./metaverse-city.css";

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

  const selectedDistrict = districtId ? getDistrictById(districtId) : null;
  const selectedFacility = facilityId ? getFacilityById(facilityId) : null;
  const selectedActivity = activityId ? METAVERSE_ACTIVITY_PLACEHOLDERS.find((item) => item.id === activityId) : null;

  const background = useMemo(() => {
    if (level === "FACILITY_VIEW" || level === "ACTIVITY_SIMULATION_VIEW") {
      return findProductionEnvironmentAsset({ cameraLevel: "FACILITY_VIEW", districtId, facilityId });
    }
    if (level === "DISTRICT_VIEW") {
      return findProductionEnvironmentAsset({ cameraLevel: "DISTRICT_VIEW", districtId, facilityId: null });
    }
    return findProductionEnvironmentAsset({ cameraLevel: "CITY_OVERVIEW", districtId: null, facilityId: null });
  }, [level, districtId, facilityId]);

  const markers = useMemo(() => {
    if (level === "CITY_OVERVIEW") return METAVERSE_DISTRICTS.map((district) => ({ ...district, markerType: "DISTRICT" }));
    if (level === "DISTRICT_VIEW" && selectedDistrict) return selectedDistrict.facilities.map((facility) => ({ ...facility, markerType: "FACILITY" }));
    if (level === "FACILITY_VIEW" && selectedFacility) return getActivitiesForFacility(selectedFacility.id).map((activity, index) => ({
      ...activity,
      markerType: "ACTIVITY",
      x: 42 + index * 16,
      y: 54 + (index % 2) * 10,
      description: "Future activity mount point. Server unlock is required before entry.",
    }));
    return [];
  }, [level, selectedDistrict, selectedFacility]);

  const getUnlock = (resource) => resolveMetaverseUiUnlock(resource, {
    clientGranted: false,
    cameraGranted: false,
    queryGranted: new URLSearchParams(window.location.search).has("unlock"),
  });

  const focusCamera = (item) => {
    const next = {
      x: Math.max(-18, Math.min(18, 50 - item.x)),
      y: Math.max(-14, Math.min(14, 48 - item.y)),
      zoom: level === "CITY_OVERVIEW" ? 1.22 : 1.18,
    };
    setCamera(reducedMotion ? next : next);
  };

  const selectDistrict = (district) => {
    const unlock = getUnlock({ id: district.id, type: "DISTRICT" });
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

  const selectFacility = (facility) => {
    const unlock = getUnlock({ id: facility.id, type: "FACILITY" });
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

  const selectActivity = (activity) => {
    const unlock = getUnlock({ id: activity.id, type: "ACTIVITY" });
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

  const breadcrumbs = getBreadcrumbs({ level, districtId, facilityId, activityId });
  const currentTitle = selectedActivity?.label || selectedFacility?.label || selectedDistrict?.label || "Silicon Heartland";
  const contextSelection = selection || (level === "ACTIVITY_SIMULATION_VIEW" && selectedActivity ? { ...selectedActivity, type: "ACTIVITY", unlock: getUnlock({ id: selectedActivity.id, type: "ACTIVITY" }) } : null);
  const contextUnlock = contextSelection?.unlock || (contextSelection ? getUnlock({ id: contextSelection.id, type: contextSelection.type }) : null);

  return (
    <main
      className="met-shell"
      data-camera-level={level}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-route="/metaverse"
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
      </header>

      <MetaverseCameraControls
        onZoomIn={() => setCamera((value) => ({ ...value, zoom: Math.min(1.8, value.zoom + 0.12) }))}
        onZoomOut={() => setCamera((value) => ({ ...value, zoom: Math.max(1, value.zoom - 0.12) }))}
        onReset={() => setCamera(CAMERA_HOME)}
        onBack={goBack}
        canGoBack={level !== "CITY_OVERVIEW" || Boolean(selection)}
        navigatorOpen={navigatorOpen}
        onToggleNavigator={() => setNavigatorOpen((value) => !value)}
      />

      <div className="met-presence-slots" aria-hidden="true" data-empty="true" />

      {level === "ACTIVITY_SIMULATION_VIEW" && selectedActivity ? (
        <section className="met-activity" aria-label="Activity placeholder">
          <p className="met-kicker">Future activity mount</p>
          <h2>{selectedActivity.label}</h2>
          <p>{selectedFacility?.label} · {selectedDistrict?.label}</p>
          <p>{contextUnlock?.reason_text}</p>
          <button type="button" onClick={goBack}>Exit activity placeholder</button>
        </section>
      ) : null}

      {entryNotice ? <div className="met-notice" role="status">{entryNotice}</div> : null}

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

      <footer className="met-footer">
        <span>{METAVERSE_NAVIGATION_MODEL_META.projectionPhase}</span>
        <span>No live presence rendered</span>
      </footer>
    </main>
  );
}
