export const deepStarMap2020Config = {
  route: '/universe/environment-lab',
  sourceSelection: 'nasa-deep-star-maps-2020-milky-way-celestial-no-bright-star-layer',
  orientation: {
    horizontalDegrees: -90,
    verticalDegrees: 0,
    yawRangeDegrees: 72,
    pitchRangeDegrees: 18,
  },
  appearance: {
    brightness: 0.92,
    contrast: 1.14,
    saturation: 0.12,
    monochromeMix: 0.94,
  },
  quality: {
    highMinTextureSize: 8192,
    standardMinTextureSize: 4096,
    desktopMinWidth: 1280,
    highDeviceMemoryGb: 8,
    standardDeviceMemoryGb: 4,
  },
  derivatives: {
    high: {
      label: 'desktop-high',
      src: '/assets/environment/deep-star-map-2020/milkyway_2020_16k_desktop-high_8192.webp',
      width: 8192,
      height: 4096,
      sha256: '11248b683135e2c785146f8e16772bcd35731944298859318a7645585454e7ad',
    },
    standard: {
      label: 'desktop-standard',
      src: '/assets/environment/deep-star-map-2020/milkyway_2020_16k_desktop-standard_4096.webp',
      width: 4096,
      height: 2048,
      sha256: '5c2d87d76ae580126471760a7a5f166efd9c87d11df906637a262dd8ad5a674e',
    },
    mobile: {
      label: 'mobile',
      src: '/assets/environment/deep-star-map-2020/milkyway_2020_16k_mobile_2048.webp',
      width: 2048,
      height: 1024,
      sha256: 'f0ecb426b2d8fe7de49cce71a730266203b74eceee903010ee8e3aa9bafca8c2',
    },
    preview: {
      label: 'preview',
      src: '/assets/environment/deep-star-map-2020/milkyway_2020_16k_preview_1024.webp',
      width: 1024,
      height: 512,
      sha256: 'f5017802e32e76edc5a574d9c9dbf58baa5b9c3f0273383f32d57a965a928e0d',
    },
  },
};

export function getMaxTextureSize() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) return 0;
  return gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;
}

export function selectDeepStarMapDerivative() {
  const { quality, derivatives } = deepStarMap2020Config;
  const maxTextureSize = getMaxTextureSize();
  const memory = navigator.deviceMemory || 4;
  const connection = navigator.connection || {};
  const constrained =
    connection.saveData ||
    /2g/.test(connection.effectiveType || '') ||
    window.matchMedia('(max-width: 760px)').matches;

  if (constrained || maxTextureSize < quality.standardMinTextureSize) {
    return { ...derivatives.mobile, maxTextureSize, deviceMemory: memory };
  }

  if (
    window.innerWidth >= quality.desktopMinWidth &&
    maxTextureSize >= quality.highMinTextureSize &&
    memory >= quality.highDeviceMemoryGb
  ) {
    return { ...derivatives.high, maxTextureSize, deviceMemory: memory };
  }

  if (maxTextureSize >= quality.standardMinTextureSize && memory >= quality.standardDeviceMemoryGb) {
    return { ...derivatives.standard, maxTextureSize, deviceMemory: memory };
  }

  return { ...derivatives.mobile, maxTextureSize, deviceMemory: memory };
}
