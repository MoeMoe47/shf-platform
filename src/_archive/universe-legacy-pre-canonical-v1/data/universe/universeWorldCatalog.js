export const UNIVERSE_STATES = Object.freeze({
  UNIVERSE_IDLE: "UNIVERSE_IDLE",
  UNIVERSE_PLANET_HOVER: "UNIVERSE_PLANET_HOVER",
  UNIVERSE_PLANET_SELECTED: "UNIVERSE_PLANET_SELECTED",
  DESTINATION_APPROACH: "DESTINATION_APPROACH",
  DESTINATION_GATEWAY: "DESTINATION_GATEWAY",
  DESTINATION_ARRIVAL: "DESTINATION_ARRIVAL",
  DESTINATION_INTERFACE: "DESTINATION_INTERFACE",
  RETURNING_TO_UNIVERSE: "RETURNING_TO_UNIVERSE",
  CARD_DIRECTORY: "CARD_DIRECTORY",
  REDUCED_MOTION: "REDUCED_MOTION",
  ERROR_FALLBACK: "ERROR_FALLBACK",
});

export const UNIVERSE_ASSET_BASE = "/assets/universe/masters";
export const MASTER_UNIVERSE_SCENE_ID = "01";
export const MASTER_UNIVERSE_INTERFACE_SCENE_ID = "02";

export const UNIVERSE_CAMERA_PHASES = Object.freeze({
  PLANET_LOCK: "PLANET_LOCK",
  CAMERA_PUSH: "CAMERA_PUSH",
  DEEP_SPACE_ACCELERATION: "DEEP_SPACE_ACCELERATION",
  ENVIRONMENT_BLEND: "ENVIRONMENT_BLEND",
  PLANETARY_APPROACH: "PLANETARY_APPROACH",
  GATEWAY_PASSAGE: "GATEWAY_PASSAGE",
  DESTINATION_REVEAL: "DESTINATION_REVEAL",
  INTERFACE_SETTLE: "INTERFACE_SETTLE",
  INTERFACE_DEPARTURE: "INTERFACE_DEPARTURE",
  REVERSE_GATEWAY: "REVERSE_GATEWAY",
  SPACE_PULLBACK: "SPACE_PULLBACK",
  UNIVERSE_RECONSTRUCTION: "UNIVERSE_RECONSTRUCTION",
});

export const UNIVERSE_ASSET_LEDGER = [
  ["01", "shu-s01-universe-arrival-v01.png", "57f19c0397970d03b237219c46316e1549c68b960d3211e828d9f02a3b63652f", "1672x941"],
  ["02", "shu-s02-universe-interface-v01.png", "87b473dcd30993f3f5f4e4b948872478d6a684b80d5f56039a4bfafdc147b69f", "1672x941"],
  ["03", "shu-s03-bos-journey-v01.png", "d74a7836ccf32a51c26b961f8ebad2d4cc678d2f17126c9699d6f7b02ba541c1", "1672x941"],
  ["04", "shu-s04-bos-arrival-v01.png", "15723b53c692fd4ea0aff4a41a918d6358e9511076266860458113bcd125e5e1", "1672x941"],
  ["05", "shu-s05-bos-gateway-v01.png", "0705797adb1c72b96fa83b5186055acdc3885b7e140ccfe53ad265ed4b538207", "1672x941"],
  ["06", "shu-s06-bos-interior-v01.png", "900287bed3e050b3f68e74cbbd190be75fc9b69bed2de40ae17986b4e0e7264e", "1672x941"],
  ["07", "shu-s07-bos-interface-v01.png", "519073d38e6758a51a5068a4ecd6666ece30822354d14face75eac71ef7b281a", "1672x941"],
  ["08", "shu-s08-bos-return-v01.png", "b641dfe07b8f90c369e4f0c733909ac6987fd46b3e65fbad03d16c88f2619e9a", "1536x1024"],
  ["09", "shu-s09-aos-journey-v01.png", "5a7cd9ec40832c7650de179f1cdba2cf2a69b55e696519cd1dbb23f4973890c1", "1672x941"],
  ["10", "shu-s10-aos-arrival-v01.png", "d9187e0b7e9e6f058c8ceaaa5d081a45aa4c56aae2c6c99c3fe1d4ea7a57cfee", "1672x941"],
  ["11", "shu-s11-aos-gateway-v01.png", "4b9e467e55ea806451f51a9382f071f24f4a7953e37687e39720a9f25af98623", "1672x941"],
  ["12", "shu-s12-aos-interior-v01.png", "16aa85e198d4040682be092d6da5634d8ba53e2b29d754ecb48cad0abaa7d259", "1672x941"],
  ["13", "shu-s13-aos-interface-v01.png", "13af8fbeb4e7c33bba0083f1762b6c7a76867d8aa3464a14081afaa145bf913c", "1672x941"],
  ["14", "shu-s14-aos-return-v01.png", "7a6affec677beaa66433da7065e65d11d1dc264336d9653f0618d9f9729927f6", "1672x941"],
  ["15", "shu-s15-oas-journey-v01.png", "99561012387b2330c59a77cec599ec48a52825869784a172ba24ca21b4526539", "1672x941"],
  ["16", "shu-s16-oas-arrival-v01.png", "8758774d831b9781ced2056596813663035ee4b63311bd79e76bd579fd892f06", "1672x941"],
  ["17", "shu-s17-oas-gateway-v01.png", "26a30ca76554e1c1111dee177dbbe12c9dc90c4e672fd077b8bb15b37fcd077f", "1536x1024"],
  ["18", "shu-s18-oas-interior-v01.png", "64b148220563cd56fb2e448c9bb157b7fff9d0d6565c7b7509c786d228654107", "1672x941"],
  ["19", "shu-s19-oas-interface-v01.png", "bf89f06876fd90485be28318d51b3a92b0452dec6f4e1d239830949ca7eea085", "1672x941"],
  ["20", "shu-s20-oas-return-v01.png", "ea887c580f2d4c10b6d5d5c4a6aaf3bb41aa5302e79be313b41181515a87f78b", "1672x941"],
  ["21", "shu-s21-registry-journey-v01.png", "7e90060bb0610b9c3dedbcc5c4f73924489c64cba19a25e0f69a923b74809d18", "1672x941"],
  ["22", "shu-s22-registry-arrival-v01.png", "d40a9f04928aedbeabfb6712ad8a587abdc279afa49b4797647e710e3e7eee0d", "1672x941"],
  ["23", "shu-s23-registry-gateway-v01.png", "0a3fd9eff3846b7c93a81cf9fe0de8328ec3fe8e0c096006971545f01ea29ea9", "1672x941"],
  ["24", "shu-s24-registry-interior-v01.png", "d2685cc858a9627497fe27f40e1d4286490beecbab02d5be972cc23217abc34a", "1672x941"],
  ["25", "shu-s25-registry-interface-v01.png", "2580170c65cc2a0287d1cfff3a7185ecb9dd6cbfd2dca81fedd7d789c5d2d155", "1672x941"],
  ["26", "shu-s26-registry-return-v01.png", "eafa6679d44d73dd184fd4eb7bf285b376f4d9f847fb54f23b33c288ff4959c6", "1672x941"],
  ["27", "shu-s27-bureau-journey-v01.png", "95959613b07a2d24e7e1201df3217a9c6da9aa7cf2cc3e32e6741e8ebe54cfc5", "1672x941"],
  ["28", "shu-s28-bureau-arrival-v01.png", "af2dbd4a8252fca1707e44bb7586e556cec868880634407b01c83bdde819a147", "1536x1024"],
  ["29", "shu-s29-bureau-gateway-v01.png", "c82a2ac20436de7f237608f77bd97190ddbb1c29337872bfc8a7aa6f0f9e14c0", "1672x941"],
  ["30", "shu-s30-bureau-interior-v01.png", "eadb1de1bd9994f346430807ff11947bb150dc931b00a14eaa29fe8461c76c12", "1672x941"],
  ["31", "shu-s31-bureau-interface-v01.png", "9ac1f5fcc58270b9d27954e98022705440308fed10f4390add72deeb644123d6", "1672x941"],
  ["32", "shu-s32-universe-return-v01.png", "ff8aa9e72fda6680263d9659aa9d695cc09251e2e58f4987af3d367988c1f742", "1672x941"],
].map(([id, filename, sha256, pixels]) => ({
  id,
  filename,
  sha256,
  pixels,
  src: `${UNIVERSE_ASSET_BASE}/${filename}`,
}));

export function getUniverseScene(sceneId) {
  return UNIVERSE_ASSET_LEDGER.find((scene) => scene.id === String(sceneId).padStart(2, "0"));
}

const routeStates = Object.freeze({
  COMING_SOON: "comingSoon",
  AVAILABLE: "available",
});

const hitRegionProfiles = {
  bos: {
    desktop: { x: 9.4, y: 28.1, r: 7.2 },
    tablet: { x: 9.4, y: 28.1, r: 8.8 },
    portrait: { x: 9.4, y: 28.1, r: 11.5 },
    landscape: { x: 9.4, y: 28.1, r: 9.2 },
  },
  aos: {
    desktop: { x: 37.0, y: 18.8, r: 4.7 },
    tablet: { x: 37.0, y: 18.8, r: 6.2 },
    portrait: { x: 37.0, y: 18.8, r: 9.5 },
    landscape: { x: 37.0, y: 18.8, r: 7.2 },
  },
  "open-autonomous-standard": {
    desktop: { x: 63.4, y: 22.6, r: 1.8 },
    tablet: { x: 63.4, y: 22.6, r: 3.2 },
    portrait: { x: 63.4, y: 22.6, r: 7.4 },
    landscape: { x: 63.4, y: 22.6, r: 5.2 },
  },
  "autonomous-registry": {
    desktop: { x: 71.6, y: 21.1, r: 1.55 },
    tablet: { x: 71.6, y: 21.1, r: 3.0 },
    portrait: { x: 71.6, y: 21.1, r: 7.4 },
    landscape: { x: 71.6, y: 21.1, r: 5.0 },
  },
  "autonomous-trust-bureau": {
    desktop: { x: 83.0, y: 37.2, r: 2.75 },
    tablet: { x: 83.0, y: 37.2, r: 4.1 },
    portrait: { x: 83.0, y: 37.2, r: 7.8 },
    landscape: { x: 83.0, y: 37.2, r: 5.7 },
  },
};

function createDestination(config) {
  const hitRegions = hitRegionProfiles[config.slug];
  return {
    ...config,
    hitRegions,
    journey: {
      approach: config.sequence.slice(0, 2),
      gateway: config.sequence.slice(2, 3),
      arrival: config.sequence.slice(3, 4),
      interface: config.sequence.slice(4, 5),
      return: config.sequence.slice(5, 6),
    },
    cameraTimeline: {
      lock: {
        motionPhase: UNIVERSE_CAMERA_PHASES.PLANET_LOCK,
        cameraX: [0, config.lockCamera?.x || 0],
        cameraY: [0, config.lockCamera?.y || 0],
        cameraScale: [1, config.lockCamera?.scale || 1.16],
        cameraRotation: [0, config.lockCamera?.rotation || 0],
        focalPointX: hitRegions.desktop.x,
        focalPointY: hitRegions.desktop.y,
        foregroundParallax: [0, config.lockCamera?.foregroundParallax || 18],
        middleParallax: [0, config.lockCamera?.middleParallax || 8],
        backgroundParallax: [0, config.lockCamera?.backgroundParallax || 3],
        starVelocity: [0.08, 0.18],
        atmosphericOpacity: [0.12, 0.24],
        sceneBlendStart: 0,
        sceneBlendEnd: 0.18,
        transitionDuration: 850,
        easing: "easeOutCubic",
      },
      approach: {
        motionPhase: UNIVERSE_CAMERA_PHASES.CAMERA_PUSH,
        cameraX: [config.lockCamera?.x || 0, config.approachCamera?.x || 0],
        cameraY: [config.lockCamera?.y || 0, config.approachCamera?.y || 0],
        cameraScale: [config.lockCamera?.scale || 1.16, config.approachCamera?.scale || 1.42],
        cameraRotation: [config.lockCamera?.rotation || 0, config.approachCamera?.rotation || 0],
        focalPointX: 50,
        focalPointY: 50,
        foregroundParallax: [18, 44],
        middleParallax: [8, 24],
        backgroundParallax: [3, 10],
        starVelocity: [0.18, 0.36],
        atmosphericOpacity: [0.24, 0.38],
        sceneBlendStart: 0.18,
        sceneBlendEnd: 0.82,
        transitionDuration: 1900,
        easing: config.motionEasing || "easeInOutCubic",
      },
      gateway: {
        motionPhase: UNIVERSE_CAMERA_PHASES.GATEWAY_PASSAGE,
        cameraX: [config.approachCamera?.x || 0, config.gatewayCamera?.x || 0],
        cameraY: [config.approachCamera?.y || 0, config.gatewayCamera?.y || 0],
        cameraScale: [config.approachCamera?.scale || 1.42, config.gatewayCamera?.scale || 1.62],
        cameraRotation: [config.approachCamera?.rotation || 0, config.gatewayCamera?.rotation || 0],
        focalPointX: 50,
        focalPointY: 50,
        foregroundParallax: [44, 72],
        middleParallax: [24, 40],
        backgroundParallax: [10, 16],
        starVelocity: [0.36, 0.48],
        atmosphericOpacity: [0.38, 0.48],
        sceneBlendStart: 0.12,
        sceneBlendEnd: 0.76,
        transitionDuration: 1900,
        easing: config.motionEasing || "easeInOutCubic",
      },
      arrival: {
        motionPhase: UNIVERSE_CAMERA_PHASES.DESTINATION_REVEAL,
        cameraX: [config.gatewayCamera?.x || 0, config.revealCamera?.x || 0],
        cameraY: [config.gatewayCamera?.y || 0, config.revealCamera?.y || 0],
        cameraScale: [config.gatewayCamera?.scale || 1.62, config.revealCamera?.scale || 1.22],
        cameraRotation: [config.gatewayCamera?.rotation || 0, config.revealCamera?.rotation || 0],
        focalPointX: 50,
        focalPointY: 50,
        foregroundParallax: [72, 38],
        middleParallax: [40, 20],
        backgroundParallax: [16, 8],
        starVelocity: [0.48, 0.12],
        atmosphericOpacity: [0.48, 0.22],
        sceneBlendStart: 0.1,
        sceneBlendEnd: 0.72,
        transitionDuration: 1900,
        easing: "easeOutCubic",
      },
      interface: {
        motionPhase: UNIVERSE_CAMERA_PHASES.INTERFACE_SETTLE,
        cameraX: [config.revealCamera?.x || 0, 0],
        cameraY: [config.revealCamera?.y || 0, 0],
        cameraScale: [config.revealCamera?.scale || 1.22, 1.04],
        cameraRotation: [config.revealCamera?.rotation || 0, 0],
        focalPointX: 50,
        focalPointY: 50,
        foregroundParallax: [38, 8],
        middleParallax: [20, 4],
        backgroundParallax: [8, 2],
        starVelocity: [0.12, 0.04],
        atmosphericOpacity: [0.22, 0.14],
        sceneBlendStart: 0.08,
        sceneBlendEnd: 0.7,
        transitionDuration: 900,
        easing: "easeOutCubic",
      },
      return: {
        motionPhase: UNIVERSE_CAMERA_PHASES.SPACE_PULLBACK,
        cameraX: [0, config.lockCamera?.x || 0],
        cameraY: [0, config.lockCamera?.y || 0],
        cameraScale: [1.08, 1],
        cameraRotation: [0, config.lockCamera?.rotation || 0],
        focalPointX: hitRegions.desktop.x,
        focalPointY: hitRegions.desktop.y,
        foregroundParallax: [42, 0],
        middleParallax: [22, 0],
        backgroundParallax: [8, 0],
        starVelocity: [-0.22, -0.04],
        atmosphericOpacity: [0.32, 0.12],
        sceneBlendStart: 0.12,
        sceneBlendEnd: 0.82,
        transitionDuration: 1450,
        easing: "easeInOutCubic",
      },
    },
  };
}

export const UNIVERSE_DESTINATIONS = [
  createDestination({
    slug: "bos",
    name: "SHS BOS",
    fullName: "SHS Business Operating System",
    role: "Business operating destination for coordinated workflows and institutional execution.",
    independence: "SHS BOS is a destination, not the owner of the independent standards, registry, or trust authorities.",
    sequence: ["03", "04", "05", "06", "07", "08"],
    primaryAction: "Enter BOS",
    statusLine: "Business operating destination",
    routeState: routeStates.COMING_SOON,
    appHref: "",
    focus: "45% 52%",
    tone: "Purposeful pathways and controlled forward arc.",
    lockCamera: { x: 13, y: -9, scale: 1.2, rotation: -0.25 },
    approachCamera: { x: 5, y: -2, scale: 1.48, rotation: -0.12 },
    gatewayCamera: { x: -2, y: 0, scale: 1.72, rotation: 0 },
    revealCamera: { x: 0, y: 1, scale: 1.24, rotation: 0 },
  }),
  createDestination({
    slug: "aos",
    name: "AOS",
    fullName: "Autonomous Operating System",
    role: "Agent-side operating destination for autonomous coordination and execution.",
    independence: "AOS is distinct from the Open Autonomous Standard and does not own the independent authorities.",
    sequence: ["09", "10", "11", "12", "13", "14"],
    primaryAction: "Enter AOS",
    statusLine: "Agent-side operating destination",
    routeState: routeStates.COMING_SOON,
    appHref: "",
    focus: "50% 50%",
    tone: "Ringed agent-side motion language.",
    lockCamera: { x: -2, y: -7, scale: 1.18, rotation: 0.15 },
    approachCamera: { x: 0, y: -1, scale: 1.44, rotation: 0.24 },
    gatewayCamera: { x: 0, y: 0, scale: 1.68, rotation: 0.12 },
    revealCamera: { x: 0, y: 0, scale: 1.2, rotation: 0 },
  }),
  createDestination({
    slug: "open-autonomous-standard",
    name: "Open Autonomous Standard",
    fullName: "Open Autonomous Standard",
    role: "Neutral constitutional standards foundation for autonomous systems.",
    independence: "Open Autonomous Standard is independent and neutral, not owned by BOS or AOS.",
    sequence: ["15", "16", "17", "18", "19", "20"],
    primaryAction: "Enter Standard",
    statusLine: "Verification active - standard aligned",
    routeState: routeStates.COMING_SOON,
    appHref: "",
    focus: "50% 50%",
    tone: "Measured verification corridors and precise geometry.",
    lockCamera: { x: -11, y: -5, scale: 1.13, rotation: 0 },
    approachCamera: { x: -4, y: -1, scale: 1.38, rotation: 0 },
    gatewayCamera: { x: 0, y: 0, scale: 1.6, rotation: 0 },
    revealCamera: { x: 0, y: 0, scale: 1.17, rotation: 0 },
  }),
  createDestination({
    slug: "autonomous-registry",
    name: "Autonomous Registry",
    fullName: "Autonomous Registry",
    role: "Independent registration, identity, provenance, and traceability authority.",
    independence: "Autonomous Registry is not a BOS or AOS database, marketplace, or subordinate feature.",
    sequence: ["21", "22", "23", "24", "25", "26"],
    primaryAction: "Enter Registry",
    statusLine: "Registration active - provenance verified",
    routeState: routeStates.COMING_SOON,
    appHref: "",
    focus: "50% 50%",
    tone: "Index bands, archive lanes, and provenance paths.",
    lockCamera: { x: -14, y: -5, scale: 1.13, rotation: 0.08 },
    approachCamera: { x: -6, y: -1, scale: 1.4, rotation: 0.12 },
    gatewayCamera: { x: 0, y: 0, scale: 1.64, rotation: 0 },
    revealCamera: { x: 0, y: 0, scale: 1.18, rotation: 0 },
  }),
  createDestination({
    slug: "autonomous-trust-bureau",
    name: "Autonomous Trust Bureau",
    fullName: "Autonomous Trust Bureau",
    role: "Independent assessment, evidence, trust, and reporting authority.",
    independence: "Autonomous Trust Bureau is not a Registry feature or BOS scoring widget.",
    sequence: ["27", "28", "29", "30", "31", "32"],
    primaryAction: "Enter Bureau",
    statusLine: "Assessment active - trust verified",
    routeState: routeStates.COMING_SOON,
    appHref: "",
    focus: "50% 50%",
    tone: "Bilateral balance, evidence paths, and stable assessment axis.",
    lockCamera: { x: -20, y: -12, scale: 1.16, rotation: 0.12 },
    approachCamera: { x: -8, y: -3, scale: 1.42, rotation: 0.08 },
    gatewayCamera: { x: 0, y: 0, scale: 1.62, rotation: 0 },
    revealCamera: { x: 0, y: 0, scale: 1.16, rotation: 0 },
  }),
];

export function getUniverseWorlds() {
  return UNIVERSE_DESTINATIONS;
}

export function getUniverseDestination(slug) {
  return UNIVERSE_DESTINATIONS.find((destination) => destination.slug === slug) || null;
}

export function getDestinationScenes(destination) {
  if (!destination) return [];
  return destination.sequence.map(getUniverseScene).filter(Boolean);
}

export function getDestinationSceneIdsForState(destination, state) {
  if (!destination) return [];
  if (state === UNIVERSE_STATES.DESTINATION_APPROACH) return destination.journey.approach;
  if (state === UNIVERSE_STATES.DESTINATION_GATEWAY) return destination.journey.gateway;
  if (state === UNIVERSE_STATES.DESTINATION_ARRIVAL) return destination.journey.arrival;
  if (state === UNIVERSE_STATES.DESTINATION_INTERFACE) return destination.journey.interface;
  if (state === UNIVERSE_STATES.RETURNING_TO_UNIVERSE) return destination.journey.return;
  return [];
}

export function validateUniverseWorldCatalog(worlds = UNIVERSE_DESTINATIONS, scenes = UNIVERSE_ASSET_LEDGER) {
  const errors = [];
  const slugs = new Set();
  const sceneIds = new Set(scenes.map((scene) => scene.id));

  if (scenes.length !== 32) errors.push(`Expected 32 approved scenes, found ${scenes.length}.`);
  for (const scene of scenes) {
    if (!scene.filename?.startsWith(`shu-s${scene.id}-`)) errors.push(`Scene ${scene.id} filename is not canonical.`);
    if (!/^[a-f0-9]{64}$/.test(scene.sha256 || "")) errors.push(`Scene ${scene.id} has invalid SHA-256.`);
  }

  for (const world of worlds) {
    if (!world.slug) errors.push("Destination slug is required.");
    if (slugs.has(world.slug)) errors.push(`Duplicate destination slug: ${world.slug}`);
    slugs.add(world.slug);
    if (!world.name || !world.fullName || !world.role || !world.independence) errors.push(`${world.slug} is missing identity copy.`);
    if (!Array.isArray(world.sequence) || world.sequence.length !== 6) errors.push(`${world.slug} must define six approved scenes.`);
    for (const sceneId of world.sequence || []) {
      if (!sceneIds.has(sceneId)) errors.push(`${world.slug} references missing scene ${sceneId}.`);
    }
    for (const breakpoint of ["desktop", "tablet", "portrait", "landscape"]) {
      const point = world.hitRegions?.[breakpoint];
      if (!point) {
        errors.push(`${world.slug} missing ${breakpoint} hit region.`);
      } else if (![point.x, point.y, point.r].every((value) => typeof value === "number" && Number.isFinite(value))) {
        errors.push(`${world.slug} has invalid ${breakpoint} hit region.`);
      }
    }
    if (world.routeState === routeStates.AVAILABLE && !world.appHref) errors.push(`${world.slug} is available but missing appHref.`);
  }

  return { valid: errors.length === 0, errors };
}
