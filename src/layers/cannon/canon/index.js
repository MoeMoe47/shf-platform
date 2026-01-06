import { CANON_LAYERS } from "./layers/index.js";
import { CANON_DOCTRINES } from "./doctrines/index.js";

export { CANON_LAYERS, CANON_DOCTRINES };

export const getLayer = (n) => CANON_LAYERS.find((x) => x.number === n);
export const listLayers = () => [...CANON_LAYERS].sort((a, b) => a.number - b.number);
