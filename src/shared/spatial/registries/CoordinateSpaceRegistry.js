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
      throw new Error(`Invalid coordinate space ${space?.id ?? "(unknown)"}: ${validation.errors.join("; ")}`);
    }
    if (this.#spaces.has(space.id)) {
      throw new Error(`Duplicate coordinate space id: ${space.id}`);
    }
    this.#spaces.set(space.id, Object.freeze({ ...space }));
    return this;
  }

  has(coordinateSpaceId) {
    return this.#spaces.has(coordinateSpaceId);
  }

  get(coordinateSpaceId, { expectedFamily } = {}) {
    const space = this.#spaces.get(coordinateSpaceId);
    if (!space) return Object.freeze({ ok: false, error: `unknown coordinate space: ${coordinateSpaceId}` });
    if (expectedFamily && space.family !== expectedFamily) {
      return Object.freeze({
        ok: false,
        error: `coordinate family mismatch for ${coordinateSpaceId}: expected ${expectedFamily}, got ${space.family}`,
      });
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
    return Object.freeze({
      ok: false,
      error: `no registered transform from ${fromCoordinateSpaceId} to ${toCoordinateSpaceId}`,
    });
  }
}
