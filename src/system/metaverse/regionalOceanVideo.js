export const OIL_RIG_DAY_OCEAN_VIDEO_PRESET = {
  id: "oil-rig-day-cinematic-ocean",
  sceneId: "oil-rig",
  timeOfDay: "DAY",
  oceanVideoBounds: {
    x: 0,
    y: 21.1,
    width: 100,
    height: 78.9,
  },
  video: {
    webm: "public/assets/metaverse/regional/oil-rig/ocean/oil-rig-day-ocean-loop.webm",
    mp4: "public/assets/metaverse/regional/oil-rig/ocean/oil-rig-day-ocean-loop.mp4",
  },
  foamExtension: {
    webm: "public/assets/metaverse/regional/oil-rig/ocean/oil-rig-day-foam-loop.webm",
    mp4: "public/assets/metaverse/regional/oil-rig/ocean/oil-rig-day-foam-loop.mp4",
    enabled: false,
  },
  fallback: "approved-static-master-water",
};

export function validateRegionalOceanVideoPreset(preset = OIL_RIG_DAY_OCEAN_VIDEO_PRESET) {
  const errors = [];
  const bounds = preset?.oceanVideoBounds;
  if (preset?.sceneId !== "oil-rig") errors.push("cinematic ocean video must target oil-rig");
  if (preset?.timeOfDay !== "DAY") errors.push("cinematic ocean video must target DAY");
  if (!bounds || bounds.x < 0 || bounds.y < 0 || bounds.width <= 0 || bounds.height <= 0 || bounds.x + bounds.width > 100 || bounds.y + bounds.height > 100) {
    errors.push("cinematic ocean video bounds must be normalized inside the scene");
  }
  if (!preset?.video?.webm || !preset?.video?.mp4) errors.push("cinematic ocean video needs WebM and MP4 paths");
  if (!preset?.foamExtension?.webm || !preset?.foamExtension?.mp4) errors.push("foam extension needs WebM and MP4 paths");
  return { valid: errors.length === 0, errors };
}
