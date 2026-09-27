import { validateSpatialLayer } from "../contracts/validation.js";

export class SpatialLayerRegistry {
  #layers;

  constructor(layers = [], { coordinateRegistry } = {}) {
    this.#layers = new Map();
    this.coordinateRegistry = coordinateRegistry;
    for (const layer of layers) this.register(layer);
  }

  register(layer) {
    const validation = validateSpatialLayer(layer, this.coordinateRegistry);
    if (!validation.valid) {
      throw new Error(`Invalid spatial layer ${layer?.layerId ?? "(unknown)"}: ${validation.errors.join("; ")}`);
    }
    if (this.#layers.has(layer.layerId)) {
      throw new Error(`Duplicate spatial layer id: ${layer.layerId}`);
    }
    this.#layers.set(layer.layerId, Object.freeze({ ...layer, supportedCoordinateSpaces: Object.freeze([...layer.supportedCoordinateSpaces]) }));
    return this;
  }

  has(layerId) {
    return this.#layers.has(layerId);
  }

  get(layerId) {
    const layer = this.#layers.get(layerId);
    if (!layer) return Object.freeze({ ok: false, error: `unknown spatial layer: ${layerId}` });
    return Object.freeze({ ok: true, layer });
  }

  list() {
    return Object.freeze([...this.#layers.values()]);
  }
}
