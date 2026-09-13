import fs from "node:fs";
import {
  ACCESSIBILITY_CAPABILITIES,
  ACCESSIBILITY_RUNTIME_OWNER,
} from "../src/system/accessibility/accessibilityConstitution.js";

const read = (file) => fs.readFileSync(file, "utf8");
const provider = read("src/context/AccessibilityProfileContext.jsx");
const root = read("src/entries/RootProviders.jsx");
const api = read("src/lib/accessibilityProfile/api.js");
const routes = read("apps/shs-api/src/domain/accessibility-profile/api/routes.ts");
const schema = read("apps/shs-api/migrations/056_accessibility_profiles.sql");
const errors = [];

if (!root.includes("<AccessibilityProfileProvider>") || !root.includes("<EffectiveAccessibilityContextProvider>")) errors.push("canonical providers are not mounted together");
if (ACCESSIBILITY_RUNTIME_OWNER.mount !== "src/entries/RootProviders.jsx") errors.push("profile runtime mount diverged from AX-1");
if (!api.includes("/accessibility/profile/me") || !routes.includes("/accessibility/profile/me")) errors.push("profile API boundary missing");
if (!schema.includes("user_accessibility_profiles") || !schema.includes("user_id")) errors.push("canonical user profile store missing");
if (routes.includes("req.body.userId") || routes.includes("req.query.userId")) errors.push("profile route accepts caller-selected user identity");
if (!provider.includes("ANONYMOUS_SESSION_KEY") || !provider.includes("!isAuthenticated")) errors.push("anonymous fallback is missing");
if (!provider.includes("identityKey") || !provider.includes("DEFAULT_PREFERENCES")) errors.push("identity reset/default boundary is missing");
if (ACCESSIBILITY_CAPABILITIES.some((item) => item.status === "SUPPORTED" && ["lineHeight", "letterSpacing", "readingWidth", "audioDescription"].includes(item.key))) errors.push("unsupported adaptive capability is overstated");
if (provider.includes("accommodation") && !provider.includes("session")) errors.push("provider appears to own accommodation state");
if (errors.length) {
  console.error("Accessibility profile validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log("Accessibility profile validation: PASS");
console.log(`- canonical store: user_accessibility_profiles`);
console.log(`- canonical runtime mount: ${ACCESSIBILITY_RUNTIME_OWNER.mount}`);
console.log("- anonymous fallback: session-only plus system/product defaults");
console.log("- user identity: server-authenticated /me route");
