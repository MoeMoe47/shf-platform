// SHF Ecosystem Phase 12.2 — provider registry/factory. Mirrors
// live-learning's provider-registry.ts exactly: the only place that
// turns a `provider` column value into a concrete adapter. Adding a third
// real provider later means one new class implementing
// ExternalCalendarProvider and one line here.
import type { ExternalCalendarProvider } from "./external-calendar-provider.js";
import type { ExternalAccountProvider } from "../model/external-account-connection.js";
import { GoogleCalendarProvider } from "./google-calendar-provider.js";
import { MicrosoftCalendarProvider } from "./microsoft-calendar-provider.js";

const google = new GoogleCalendarProvider();
const microsoft = new MicrosoftCalendarProvider();

export function getExternalCalendarProvider(name: ExternalAccountProvider): ExternalCalendarProvider {
  switch (name) {
    case "google":
      return google;
    case "microsoft":
      return microsoft;
    default:
      throw new Error(`Unknown external calendar provider: ${name}`);
  }
}

export function listExternalCalendarProviders(): ExternalCalendarProvider[] {
  return [google, microsoft];
}
