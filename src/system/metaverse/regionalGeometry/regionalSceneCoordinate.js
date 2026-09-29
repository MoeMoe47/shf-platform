export const REGIONAL_SCENE_COORDINATE_FAMILY = "METAVERSE";
export const REGIONAL_SCENE_COORDINATE_SPACE = "metaverse.regional-scene";
export const REGIONAL_SCENE_COORDINATE_MIN = 0;
export const REGIONAL_SCENE_COORDINATE_MAX = 100;

export function isRegionalSceneCoordinate(value) {
  return typeof value === "number"
    && Number.isFinite(value)
    && value >= REGIONAL_SCENE_COORDINATE_MIN
    && value <= REGIONAL_SCENE_COORDINATE_MAX;
}

export function normalizeRegionalScenePoint(point) {
  if (!Array.isArray(point) || point.length !== 2) return null;
  const [x, y] = point;
  return isRegionalSceneCoordinate(x) && isRegionalSceneCoordinate(y) ? [x, y] : null;
}

export function imageLocalToRegionalScene([x, y], { width, height } = {}) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return [100 * x / width, 100 * y / height];
}

export function regionalSceneToImageLocal([x, y], { width, height } = {}) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  if (!isRegionalSceneCoordinate(x) || !isRegionalSceneCoordinate(y)) return null;
  return [width * x / 100, height * y / 100];
}

export function pointerToRegionalScene(event, element) {
  const rect = element?.getBoundingClientRect?.();
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;
  return imageLocalToRegionalScene(
    [event.clientX - rect.left, event.clientY - rect.top],
    { width: rect.width, height: rect.height },
  );
}
