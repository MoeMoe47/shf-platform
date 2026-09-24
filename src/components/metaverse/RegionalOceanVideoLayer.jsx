import React, { useEffect, useRef, useState } from "react";
import { publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";
import { OIL_RIG_OCEAN_MASK } from "@/system/metaverse/oilRigOceanMask.js";
import { OIL_RIG_DAY_OCEAN_VIDEO_PRESET } from "@/system/metaverse/regionalOceanVideo.js";
import "@/pages/metaverse/metaverse-city.css";

const DEFAULT_STATUS = {
  loaded: false,
  missing: false,
  currentTime: 0,
  duration: 0,
  playbackState: "LOADING",
  droppedFrames: null,
  opacity: 1,
  speed: 1,
  loop: true,
};

function emitVideoStatus(status) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("metaverse-ocean-video-status", { detail: status }));
}

export default function RegionalOceanVideoLayer({
  sceneId = "oil-rig",
  timeOfDay = "DAY",
  reducedMotion = false,
  debug = {},
  controls = null,
  devMode = false,
  enabled = true,
}) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const statusRef = useRef(DEFAULT_STATUS);
  const bounds = OIL_RIG_DAY_OCEAN_VIDEO_PRESET.oceanVideoBounds;
  const shouldRender = enabled && sceneId === "oil-rig" && timeOfDay === "DAY";

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldRender) return undefined;
    let active = true;
    let lastStatusPublish = 0;
    const publish = (patch = {}) => {
      if (!active) return;
      const playbackQuality = typeof video.getVideoPlaybackQuality === "function" ? video.getVideoPlaybackQuality() : null;
      const next = {
        ...statusRef.current,
        ...patch,
        currentTime: video.currentTime || 0,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        droppedFrames: playbackQuality ? playbackQuality.droppedVideoFrames : statusRef.current.droppedFrames,
      };
      statusRef.current = next;
      if (performance.now() - lastStatusPublish < 250 && !patch.missing) return;
      lastStatusPublish = performance.now();
      setStatus(next);
      emitVideoStatus(next);
    };
    const onLoadedMetadata = () => publish({ loaded: true, missing: false, playbackState: reducedMotion ? "PAUSED_REDUCED_MOTION" : "READY" });
    const onCanPlay = () => publish({ loaded: true, missing: false, playbackState: reducedMotion ? "PAUSED_REDUCED_MOTION" : "READY" });
    const onError = () => publish({ loaded: false, missing: true, playbackState: "MISSING" });
    const onPlay = () => publish({ playbackState: "PLAYING" });
    const onPause = () => publish({ playbackState: reducedMotion ? "PAUSED_REDUCED_MOTION" : "PAUSED" });
    const onTimeUpdate = () => publish();
    const onVisibilityChange = () => {
      if (document.hidden) video.pause();
      else if (!reducedMotion && controls?.playing !== false && !statusRef.current.missing) video.play().catch(() => {});
      publish({ playbackState: document.hidden ? "PAUSED_HIDDEN" : statusRef.current.playbackState });
    };
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("error", onError);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (!reducedMotion && controls?.playing !== false) video.play().catch(() => {});
    const probeAssets = async () => {
      const assetUrls = [
        publicAssetUrl(OIL_RIG_DAY_OCEAN_VIDEO_PRESET.video.webm),
        publicAssetUrl(OIL_RIG_DAY_OCEAN_VIDEO_PRESET.video.mp4),
      ];
      const results = await Promise.all(assetUrls.map(async (url) => {
        try {
          const response = await fetch(url, { method: "HEAD", cache: "no-store" });
          const contentType = response.headers.get("content-type") || "";
          return response.ok && !contentType.includes("text/html");
        } catch {
          return false;
        }
      }));
      if (active && !results.some(Boolean)) {
        video.pause();
        video.removeAttribute("src");
        video.load();
        publish({ loaded: false, missing: true, playbackState: "MISSING" });
      }
    };
    void probeAssets();
    return () => {
      active = false;
      video.pause();
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [controls?.playing, reducedMotion, shouldRender]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const onCommand = (event) => {
      const command = event.detail || {};
      if (command.type === "play") video.play().catch(() => {});
      if (command.type === "pause") video.pause();
      if (command.type === "restart") {
        video.currentTime = 0;
        if (!reducedMotion) video.play().catch(() => {});
      }
      if (command.type === "speed") video.playbackRate = command.value;
      if (command.type === "opacity") publishVideoStyle(command.value);
      if (command.type === "loop") video.loop = command.value;
    };
    window.addEventListener("metaverse-ocean-video-command", onCommand);
    return () => window.removeEventListener("metaverse-ocean-video-command", onCommand);
  }, [reducedMotion]);

  const publishVideoStyle = (value) => {
    const nextOpacity = Math.min(1, Math.max(0, Number(value) || 0));
    statusRef.current = { ...statusRef.current, opacity: nextOpacity };
    setStatus(statusRef.current);
    emitVideoStatus(statusRef.current);
  };

  if (!shouldRender) return null;
  const style = {
    left: `${bounds.x}%`,
    top: `${bounds.y}%`,
    width: `${bounds.width}%`,
    height: `${bounds.height}%`,
    opacity: status.opacity,
  };
  return (
    <div className="met-regional-ocean-video" data-ocean-video-layer="true" data-ocean-video-status={status.missing ? "missing" : status.loaded ? "ready" : "loading"} style={style}>
      <video
        ref={videoRef}
        className="met-regional-ocean-video__media"
        muted
        playsInline
        autoPlay={!reducedMotion}
        loop={status.loop}
        preload="metadata"
        aria-hidden="true"
      >
        <source src={publicAssetUrl(OIL_RIG_DAY_OCEAN_VIDEO_PRESET.video.webm)} type="video/webm" />
        <source src={publicAssetUrl(OIL_RIG_DAY_OCEAN_VIDEO_PRESET.video.mp4)} type="video/mp4" />
      </video>
      {status.missing && devMode ? <div className="met-regional-ocean-video__missing" aria-hidden="true">OCEAN VIDEO ASSET MISSING</div> : null}
      {debug.showVideoBounds ? <span className="met-regional-ocean-video__bounds" aria-hidden="true" /> : null}
      {debug.showOceanMask ? <img className="met-regional-ocean-video__mask" src={publicAssetUrl(OIL_RIG_OCEAN_MASK.maskAsset)} alt="" aria-hidden="true" /> : null}
    </div>
  );
}
