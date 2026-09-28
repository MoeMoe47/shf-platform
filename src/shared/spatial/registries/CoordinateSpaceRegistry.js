import { VALIDATION_ISSUE_CODES } from "../contracts/constants.js";
import { REGISTRY_ERROR_CODES, registryError, registryFailure } from "../contracts/registryErrors.js";
import { validateCoordinateSpace } from "../contracts/validation.js";

export class CoordinateSpaceRegistry {
  #spaces;

  constructor(spaces = []) {
    this.#spaces = new Map();
    for (const space of spaces) this.register(space);
  }

  register(space) {
    const validation = validateCoordinateSpace(space);
    if (!validation.valid) {
      throw registryError(
        `Invalid coordinate space ${space?.id ?? "(unknown)"}: ${validation.errors.join("; ")}`,
        REGISTRY_ERROR_CODES.DEFINITION_INVALID,
        validation.issues,
      );
    }
    if (this.#spaces.has(space.id)) {
      throw registryError(`Duplicate coordinate space id: ${space.id}`, REGISTRY_ERROR_CODES.DUPLICATE_ID);
    }
    this.#spaces.set(space.id, Object.freeze({ ...space }));
    return this;
  }

  has(coordinateSpaceId) {
    return this.#spaces.has(coordinateSpaceId);
  }

  get(coordinateSpaceId, { expectedFamily } = {}) {
    const space = this.#spaces.get(coordinateSpaceId);
    if (!space) return registryFailure(`unknown coordinate space: ${coordinateSpaceId}`, VALIDATION_ISSUE_CODES.UNKNOWN_COORDINATE_SPACE);
    if (expectedFamily && space.family !== expectedFamily) {
      return registryFailure(
        `coordinate family mismatch for ${coordinateSpaceId}: expected ${expectedFamily}, got ${space.family}`,
        VALIDATION_ISSUE_CODES.COORDINATE_FAMILY_MISMATCH,
      );
    }
    return Object.freeze({ ok: true, space });
  }

  list() {
    return Object.freeze([...this.#spaces.values()]);
  }

  assertNoImplicitTransform(fromCoordinateSpaceId, toCoordinateSpaceId) {
    if (fromCoordinateSpaceId === toCoordinateSpaceId) {
      return Object.freeze({ ok: true, transform: "IDENTITY" });
    }
    const from = this.get(fromCoordinateSpaceId);
    const to = this.get(toCoordinateSpaceId);
    if (!from.ok) return from;
    if (!to.ok) return to;
    return registryFailure(
      `no registered transform from ${fromCoordinateSpaceId} to ${toCoordinateSpaceId}`,
      VALIDATION_ISSUE_CODES.NO_REGISTERED_TRANSFORM,
    );
  }
}
