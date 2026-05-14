import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import schema from "../../contracts/registry_entity.schema.json";

export type RegistryPayload = {
  entity: Record<string, any>;
  reason: string;
};

export type RegistryViolation = { path: string; message: string };

export class RegistryValidationError extends Error {
  violations: RegistryViolation[];
  constructor(violations: RegistryViolation[]) {
    super("Invalid registry payload");
    this.name = "RegistryValidationError";
    this.violations = violations;
  }
}

const ajv = new Ajv2020({
  allErrors: true,
  strict: true
});

addFormats(ajv);

const validate = ajv.compile(schema as any);

function toPath(instancePath: string) {
  // AJV uses JSON Pointer like "/entity/legal"
  if (!instancePath) return "";
  return instancePath.replace(/^\//, "").replaceAll("/", ".");
}

export function validateRegistryPayload(payload: RegistryPayload) {
  const ok = validate(payload as any);
  if (ok) return;

  const violations: RegistryViolation[] = (validate.errors || []).map((e) => ({
    path: e.instancePath ? toPath(e.instancePath) : (e.params as any)?.missingProperty ? toPath(e.instancePath || "") + "." + (e.params as any).missingProperty : "",
    message: e.message || "invalid"
  }));

  throw new RegistryValidationError(violations);
}
