export { CANON_LAYERS } from "./layers/index.js";
export { CANON_DOCTRINES } from "./doctrines/index.js";

export const getLayer = (n) => CANON_LAYERS.find((x) => x.number === n);
export const listLayers = () => [...CANON_LAYERS].sort((a, b) => a.number - b.number);
