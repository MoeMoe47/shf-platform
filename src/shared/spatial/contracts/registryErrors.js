// Registry operation codes (GEO1-WAVE3B-DEC-010). These are not validation issue codes.
export const REGISTRY_ERROR_CODES = Object.freeze({
  DEFINITION_INVALID: "DEFINITION_INVALID",
  DUPLICATE_ID: "DUPLICATE_ID",
});

export function registryError(message, code, issues) {
  const error = new Error(message);
  error.code = code;
  if (issues) error.issues = issues;
  return error;
}

// Registry lookup failures keep their legacy enumerable shape `{ ok, error }`; `code` is attached
// non-enumerably so exact-shape consumers are unaffected (GEO1-WAVE3B-DEC-017).
export function registryFailure(error, code) {
  const failure = { ok: false, error };
  Object.defineProperty(failure, "code", { value: code, enumerable: false });
  return Object.freeze(failure);
}
