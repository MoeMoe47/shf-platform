import civic from "./catalog.civic.js";
import career from "./catalog.career.js";
import arcade from "./catalog.arcade.js";

export const CATALOG = { civic, career, arcade };
export function loadCatalog(app) {
  return CATALOG[app] ?? { badges: [] };
}
