/**
 * SHF Layer Contract (simple + stable)
 * Every layer exports:
 *  - LAYER (metadata)
 *  - init(ctx)
 *  - status()
 *  - guard(action, ctx)  // optional enforcement hook
 *  - recommend(ctx)      // optional suggestions hook
 */

export function makeLayer(meta, impl = {}) {
  const LAYER = Object.freeze({
    id: meta.id,
    name: meta.name,
    short: meta.short || meta.name,
    purpose: meta.purpose || "",
    fundableAngle: meta.fundableAngle || "",
    version: meta.version || "v1",
  });

  let _inited = false;
  let _last = null;

  function init(ctx = {}) {
    _inited = true;
    _last = { at: new Date().toISOString(), ctx: safeCtx(ctx) };
    if (typeof impl.init === "function") impl.init(ctx);
    return LAYER;
  }

  function status() {
    return {
      layer: LAYER,
      inited: _inited,
      lastInit: _last,
      ok: true,
    };
  }

  // guard() is for rule enforcement (security/ethics/policy)
  function guard(action, ctx = {}) {
    if (typeof impl.guard === "function") return impl.guard(action, ctx);
    return { allow: true };
  }

  // recommend() is for predictive suggestions / next best actions
  function recommend(ctx = {}) {
    if (typeof impl.recommend === "function") return impl.recommend(ctx);
    return [];
  }

  return { LAYER, init, status, guard, recommend, default: { LAYER, init, status, guard, recommend } };
}

function safeCtx(ctx) {
  try {
    // avoid circular refs
    return JSON.parse(JSON.stringify(ctx));
  } catch {
    return {};
  }
}
