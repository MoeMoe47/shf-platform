import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  resolveRiverParticleCount,
  resolveRiverParticlePositions,
  resolveRiverSpeedMultiplier,
  resolveRiverZoneAtProgress,
} from "@/system/metaverse/metaverseRiverTraceModel.js";

const BASE_PROGRESS_PER_SECOND = 0.075;

export default function useMetaverseRiverFlowPreview({ enabled, state, reducedMotion = false }) {
  const [status, setStatus] = useState("STOPPED");
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [reversePreview, setReversePreview] = useState(false);
  const [showIndicators, setShowIndicators] = useState(true);
  const [showBanks, setShowBanks] = useState(true);
  const [showDirection, setShowDirection] = useState(true);
  const [particles, setParticles] = useState([]);
  const progressRef = useRef([]);
  const tickRef = useRef(null);

  const particleCount = resolveRiverParticleCount(state?.flow);
  const hasPath = (state?.centerline?.length || 0) > 1;
  const seedProgresses = useCallback(() => {
    progressRef.current = Array.from({ length: particleCount }, (_, index) => index / particleCount);
  }, [particleCount]);

  const renderParticles = useCallback(() => {
    const next = resolveRiverParticlePositions(state, progressRef.current, { reverse: reversePreview });
    setParticles(next);
  }, [state, reversePreview]);

  const play = useCallback(() => {
    if (!hasPath) return;
    if (!progressRef.current.length) seedProgresses();
    setStatus("PLAYING");
  }, [hasPath, seedProgresses]);

  const pause = useCallback(() => setStatus((current) => (current === "PLAYING" ? "PAUSED" : current)), []);

  const stop = useCallback(() => {
    setStatus("STOPPED");
    progressRef.current = [];
    setParticles([]);
  }, []);

  const restart = useCallback(() => {
    seedProgresses();
    renderParticles();
    setStatus(hasPath ? "PLAYING" : "STOPPED");
  }, [hasPath, renderParticles, seedProgresses]);

  const tick = useCallback((dtSeconds) => {
    if (!hasPath) return;
    const nextProgresses = progressRef.current.map((progress) => {
      const zone = resolveRiverZoneAtProgress(state.zones, reversePreview ? 1 - progress : progress);
      const zoneRate = resolveRiverSpeedMultiplier(zone);
      const next = progress + dtSeconds * BASE_PROGRESS_PER_SECOND * speedMultiplier * (Number(state.flow?.baseSpeed) || 1) * zoneRate;
      return next >= 1 ? next % 1 : next;
    });
    progressRef.current = nextProgresses;
    setParticles(resolveRiverParticlePositions(state, nextProgresses, { reverse: reversePreview }));
  }, [hasPath, reversePreview, speedMultiplier, state]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    if (status !== "PLAYING" || reducedMotion) return undefined;
    let frame;
    let last = null;
    const run = (timestamp) => {
      if (last === null) last = timestamp;
      tickRef.current((timestamp - last) / 1000);
      last = timestamp;
      frame = requestAnimationFrame(run);
    };
    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, status]);

  useEffect(() => {
    if (!enabled) stop();
  }, [enabled, stop]);

  useEffect(() => {
    if (!enabled || !hasPath) {
      setParticles([]);
      return;
    }
    if (!progressRef.current.length) seedProgresses();
    renderParticles();
    if (status === "PLAYING") setStatus(reducedMotion ? "PAUSED" : "PLAYING");
  }, [enabled, hasPath, reducedMotion, renderParticles, seedProgresses, state.centerline, status]);

  const visibleParticles = useMemo(() => (
    showIndicators ? particles : []
  ), [particles, showIndicators]);

  return {
    enabled,
    status,
    speedMultiplier,
    reversePreview,
    showIndicators,
    showBanks,
    showDirection,
    particles: visibleParticles,
    actions: {
      play,
      pause,
      stop,
      restart,
      setSpeedMultiplier,
      setReversePreview,
      setShowIndicators,
      setShowBanks,
      setShowDirection,
    },
  };
}
