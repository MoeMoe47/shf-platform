// src/system/env/publicEnv.js
// Allowlist of PUBLIC build-time configuration for browser code (AFCC-2A.1).
//
// Vite inlines `import.meta.env.KEY` member reads individually, but any other use
// of `import.meta.env` — optional chaining (`import.meta.env?.X`), truthiness
// checks (`import.meta.env && …`), computed keys (`import.meta.env[name]`) —
// makes Vite inline the WHOLE env object, i.e. every VITE_* value on the build
// machine, into the bundle. That is how a privileged key reached browser chunks.
//
// Modules that need an optional or dynamic read go through this allowlist
// instead. Every entry is public by definition; never add a key, secret, token or
// password here. Outside Vite (node tests) import.meta.env is undefined and the
// allowlist is empty, matching the previous optional-chaining behavior.
function readPublicEnv() {
  try {
    return Object.freeze({
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
      MODE: import.meta.env.MODE,
      BASE_URL: import.meta.env.BASE_URL,
      VITE_SHS_API_BASE: import.meta.env.VITE_SHS_API_BASE,
      VITE_SHF_NEXT_ORIGIN: import.meta.env.VITE_SHF_NEXT_ORIGIN,
      VITE_SHF_NEXT_BASE_URL: import.meta.env.VITE_SHF_NEXT_BASE_URL,
      VITE_SHRV1_BASE_URL: import.meta.env.VITE_SHRV1_BASE_URL,
      VITE_DEV_USER_ID: import.meta.env.VITE_DEV_USER_ID,
      VITE_METAVERSE_ENABLE_DEV_UNLOCK_FIXTURE: import.meta.env.VITE_METAVERSE_ENABLE_DEV_UNLOCK_FIXTURE,
      VITE_AUTONOMOUS_REGISTRY_ORIGIN: import.meta.env.VITE_AUTONOMOUS_REGISTRY_ORIGIN,
    });
  } catch {
    return Object.freeze({});
  }
}

export const PUBLIC_ENV = readPublicEnv();
