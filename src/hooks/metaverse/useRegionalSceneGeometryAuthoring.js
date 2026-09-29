import { useCallback, useMemo, useRef, useState } from "react";
import {
  createOilRigDraft,
  createDraftFromOilRigReview,
  parseOilRigApprovedArtifact,
  parseOilRigDraft,
  parseOilRigReviewArtifact,
  prepareOilRigApprovedExport,
  prepareOilRigDraftExport,
  validateOilRigDraft,
} from "../../system/metaverse/regionalGeometry/regionalSceneGeometryDraft.js";
import { hashRegionalSceneGeometry } from "../../system/metaverse/regionalGeometry/regionalSceneGeometryHash.js";

const LOCAL_STORAGE_KEY = "metaverse-oil-rig-regional-geometry-draft";
const MAX_UNDO_DEPTH = 50;

function readStoredDraft() {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = parseOilRigDraft(raw);
    return parsed.draft?.status === "DRAFT" ? parsed.draft : null;
  } catch {
    return null;
  }
}

function createInitialState(enabled) {
  if (!enabled) return createOilRigDraft();
  return readStoredDraft() || createOilRigDraft();
}

function triggerJsonDownload(payload, filename) {
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

function cloneGeometry(geometry) {
  return { type: "Polygon", coordinates: (geometry?.coordinates || []).map((ring) => ring.map((point) => [point[0], point[1]])) };
}

export function resolveRegionalGeometryAuthoringEnabled({ isDev, search } = {}) {
  if (!isDev) return false;
  const params = new URLSearchParams(search || "");
  const devMode = params.get("metaverseDev");
  const authoring = params.get("regionalGeometryAuthoring");
  return devMode !== null && devMode !== "0" && devMode !== "false"
    && authoring !== null && authoring !== "0" && authoring !== "false";
}

export default function useRegionalSceneGeometryAuthoring({ enabled = false } = {}) {
  const [draft, setDraft] = useState(() => createInitialState(enabled));
  const [variant, setVariant] = useState("DAY");
  const [selectedVertexIndex, setSelectedVertexIndex] = useState(null);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [approvedPreview, setApprovedPreview] = useState(null);
  const [reviewPreview, setReviewPreview] = useState(null);
  const lastSavedRef = useRef(JSON.stringify(draft));

  const commit = useCallback((nextDraft) => {
    setPast((current) => [...current.slice(-(MAX_UNDO_DEPTH - 1)), draft]);
    setFuture([]);
    setDraft(nextDraft);
  }, [draft]);

  const updateVertices = useCallback((updater) => {
    const currentRing = draft.geometry.coordinates[0] || [];
    const nextRing = updater(currentRing.map((point) => [point[0], point[1]]));
    commit({ ...draft, geometry: { type: "Polygon", coordinates: [nextRing] }, geometryHash: hashRegionalSceneGeometry({ type: "Polygon", coordinates: [nextRing] }) });
  }, [commit, draft]);

  const addVertex = useCallback((point) => {
    if (draft.geometry.coordinates[0]?.length && draft.geometry.coordinates[0].at(-1)?.every((value, index) => value === point[index])) return;
    updateVertices((ring) => (ring.length && ring[0][0] === ring.at(-1)?.[0] && ring[0][1] === ring.at(-1)?.[1] ? [...ring.slice(0, -1), point, ring[0]] : [...ring, point]));
    setStatusMessage("Vertex added to draft.");
  }, [draft.geometry.coordinates, updateVertices]);

  const closePolygon = useCallback(() => {
    updateVertices((ring) => {
      if (ring.length < 3) return ring;
      if (ring[0][0] === ring.at(-1)?.[0] && ring[0][1] === ring.at(-1)?.[1]) return ring;
      return [...ring, ring[0]];
    });
    setStatusMessage("Polygon closure added to draft; validation still controls export.");
  }, [updateVertices]);

  const moveVertex = useCallback((index, point) => {
    updateVertices((ring) => ring.map((current, currentIndex) => {
      if (currentIndex !== index && currentIndex !== ring.length - 1) return current;
      return [point[0], point[1]];
    }));
    setStatusMessage("Vertex moved.");
  }, [updateVertices]);

  const deleteVertex = useCallback((index) => {
    updateVertices((ring) => ring.filter((_, currentIndex) => currentIndex !== index && !(index === 0 && currentIndex === ring.length - 1)));
    setSelectedVertexIndex(null);
    setStatusMessage("Vertex deleted.");
  }, [updateVertices]);

  const insertVertexAfter = useCallback((index, point) => {
    updateVertices((ring) => {
      const openRing = ring.length > 1 && ring[0][0] === ring.at(-1)?.[0] && ring[0][1] === ring.at(-1)?.[1] ? ring.slice(0, -1) : ring;
      const next = [...openRing];
      next.splice(Math.min(index + 1, next.length), 0, point);
      return ring.length > openRing.length ? [...next, next[0]] : next;
    });
    setStatusMessage("Vertex inserted.");
  }, [updateVertices]);

  const undo = useCallback(() => {
    setPast((current) => {
      const previous = current.at(-1);
      if (!previous) return current;
      setFuture((next) => [draft, ...next]);
      setDraft(previous);
      return current.slice(0, -1);
    });
  }, [draft]);

  const redo = useCallback(() => {
    setFuture((current) => {
      const nextDraft = current[0];
      if (!nextDraft) return current;
      setPast((next) => [...next, draft]);
      setDraft(nextDraft);
      return current.slice(1);
    });
  }, [draft]);

  const reset = useCallback(() => {
    setPast([]);
    setFuture([]);
    setSelectedVertexIndex(null);
    setDraft(createOilRigDraft());
    setStatusMessage("Draft reset.");
  }, []);

  const exportDraft = useCallback(() => {
    const prepared = prepareOilRigDraftExport(draft);
    if (!prepared.payload) {
      setStatusMessage(`Export blocked: ${prepared.errors.join("; ")}`);
      return false;
    }
    const { payload } = prepared;
    const ok = triggerJsonDownload(payload, "oil-rig-regional-scene-geometry-draft.json");
    if (ok) {
      lastSavedRef.current = JSON.stringify(payload);
      try { window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload)); } catch { /* optional local draft */ }
      setStatusMessage("DRAFT exported. No registry or approval write occurred.");
    }
    return ok;
  }, [draft]);

  const importDraft = useCallback((input) => {
    const result = parseOilRigDraft(input);
    if (!result.draft) {
      setStatusMessage(`Import rejected: ${result.errors.join("; ")}`);
      return false;
    }
    setPast([]);
    setFuture([]);
    if (result.draft.status === "APPROVED") {
      const approved = parseOilRigApprovedArtifact(result.draft);
      if (!approved.approved) {
        setStatusMessage(`Import rejected: ${approved.errors.join("; ")}`);
        return false;
      }
      setReviewPreview(null);
      setApprovedPreview(approved.approved);
      setStatusMessage("APPROVED geometry loaded read-only. Create a new DRAFT to edit it.");
      return true;
    }
    if (result.draft.status === "REVIEW") {
      const review = parseOilRigReviewArtifact(result.draft);
      if (!review.review) {
        setStatusMessage(`Import rejected: ${review.errors.join("; ")}`);
        return false;
      }
      setReviewPreview(review.review);
      setStatusMessage("REVIEW geometry loaded read-only. Return it to DRAFT to edit it.");
      return true;
    }
    setReviewPreview(null);
    setApprovedPreview(null);
    setDraft(result.draft);
    lastSavedRef.current = JSON.stringify(result.draft);
    setStatusMessage(`${result.draft.status} geometry loaded for authoring review.`);
    return true;
  }, []);

  const exportApproved = useCallback(() => {
    const prepared = prepareOilRigApprovedExport(approvedPreview);
    if (!prepared.payload) {
      setStatusMessage(`APPROVED export blocked: ${prepared.errors.join("; ")}`);
      return false;
    }
    const ok = triggerJsonDownload(prepared.payload, "oil-rig-regional-scene-geometry-approved.json");
    if (ok) setStatusMessage("APPROVED artifact exported. Registry write NONE. Spatial eligibility NONE. Adapter NOT IMPLEMENTED.");
    return ok;
  }, [approvedPreview]);

  const createDraftFromApproved = useCallback(() => {
    if (!approvedPreview) return false;
    setDraft(createOilRigDraft({ geometry: cloneGeometry(approvedPreview.geometry), authoringMetadata: { derivedFromStatus: "APPROVED" } }));
    setApprovedPreview(null);
    setStatusMessage("New DRAFT created from APPROVED geometry. The approved record was not modified.");
    return true;
  }, [approvedPreview]);

  const createDraftFromReview = useCallback(() => {
    const result = createDraftFromOilRigReview(reviewPreview);
    if (!result.draft) return false;
    setDraft(result.draft);
    setReviewPreview(null);
    setPast([]);
    setFuture([]);
    setStatusMessage("New DRAFT created from REVIEW. The REVIEW artifact was not modified.");
    return true;
  }, [reviewPreview]);

  const validation = useMemo(() => validateOilRigDraft(draft), [draft]);
  const unsaved = JSON.stringify(draft) !== lastSavedRef.current;

  return {
    draft,
    variant,
    setVariant,
    selectedVertexIndex,
    setSelectedVertexIndex,
    validation,
    unsaved,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    statusMessage,
    approvedPreview,
    reviewPreview,
    setApprovedPreview,
    actions: {
      addVertex,
      closePolygon,
      moveVertex,
      deleteVertex,
      insertVertexAfter,
      undo,
      redo,
      reset,
      exportDraft,
      exportApproved,
      importDraft,
      createDraftFromApproved,
      createDraftFromReview,
    },
  };
}
