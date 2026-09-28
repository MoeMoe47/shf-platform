import { VALIDATION_ISSUE_CODES } from "../contracts/constants.js";
import { REGISTRY_ERROR_CODES, registryError, registryFailure } from "../contracts/registryErrors.js";
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
      throw registryError(
        `Invalid spatial layer ${layer?.layerId ?? "(unknown)"}: ${validation.errors.join("; ")}`,
        REGISTRY_ERROR_CODES.DEFINITION_INVALID,
        validation.issues,
      );
    }
    if (this.#layers.has(layer.layerId)) {
      throw registryError(`Duplicate spatial layer id: ${layer.layerId}`, REGISTRY_ERROR_CODES.DUPLICATE_ID);
    }
    this.#layers.set(layer.layerId, Object.freeze({ ...layer, supportedCoordinateSpaces: Object.freeze([...layer.supportedCoordinateSpaces]) }));
    return this;
  }

  has(layerId) {
    return this.#layers.has(layerId);
  }

  get(layerId) {
    const layer = this.#layers.get(layerId);
    if (!layer) return registryFailure(`unknown spatial layer: ${layerId}`, VALIDATION_ISSUE_CODES.UNKNOWN_LAYER);
    return Object.freeze({ ok: true, layer });
  }

  list() {
    return Object.freeze([...this.#layers.values()]);
  }
}
