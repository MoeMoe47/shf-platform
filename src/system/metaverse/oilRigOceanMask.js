export const OIL_RIG_OCEAN_MASK = {
  id: "oil-rig-day-ocean-mask",
  sceneId: "oil-rig",
  timeOfDay: "DAY",
  dimensions: { width: 1536, height: 1024 },
  maskAsset: "public/assets/metaverse/regional/oil-rig/oil-rig-day-ocean-mask.png",
  horizonY: 21.1,
  horizonFeather: 1.8,
  foregroundY: 100,
  sourceForegroundAsset: "public/assets/metaverse/regional/oil-rig/oil-rig-day-foreground-cutout.png",
  mode: "water-below-horizon-minus-rig-cutout",
};

export function validateOilRigOceanMask(mask = OIL_RIG_OCEAN_MASK) {
  const errors = [];
  if (mask.sceneId !== "oil-rig") errors.push("oil rig ocean mask must target oil-rig");
  if (mask.timeOfDay !== "DAY") errors.push("oil rig ocean mask must target DAY");
  if (mask.dimensions?.width !== 1536 || mask.dimensions?.height !== 1024) errors.push("oil rig ocean mask dimensions must match the locked master");
  if (!(mask.horizonY > 0 && mask.horizonY < 100)) errors.push("oil rig ocean mask horizon must be normalized");
  if (!(mask.horizonFeather >= 0 && mask.horizonFeather <= 5)) errors.push("oil rig ocean mask horizon feather is out of range");
  if (!mask.maskAsset) errors.push("oil rig ocean mask needs a scene-aligned mask asset");
  if (!mask.sourceForegroundAsset) errors.push("oil rig ocean mask needs its protected foreground source");
  return { valid: errors.length === 0, errors };
}
