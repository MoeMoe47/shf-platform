// SHF Ecosystem Phase 12.2 — ExternalCalendarAvailabilityService.
//
// NON-NEGOTIABLE (phase brief §27): this service normalizes external
// busy/free intervals only — it never becomes a second Calendar
// Projection, never persists full external event details, and never
// exposes a title/description/location. One provider's outage never
// blocks another's data or SHF's own canonical Calendar (§33).
import { listConnectionsForActor, getValidAccessTokenForActor } from "./external-account-connection-service.js";
import { getExternalCalendarProvider } from "../providers/provider-registry.js";
import type { ExternalCalendarProvider, FreeBusyInterval } from "../providers/external-calendar-provider.js";
import type { ExternalAccountConnectionActor, ExternalAccountProvider } from "../model/external-account-connection.js";

export interface ExternalBusyInterval extends FreeBusyInterval {
  provider: ExternalAccountProvider;
}

export interface ExternalAvailabilityResult {
  intervals: ExternalBusyInterval[];
  // false whenever at least one ACTIVE connection could not be reached —
  // callers must never treat an incomplete result as "confirmed free"
  // (phase brief §30/§34).
  complete: boolean;
  unavailableProviders: ExternalAccountProvider[];
}

// `providerLookup` exists solely so tests can inject a MockExternalCalendarProvider
// per provider name, mirroring calendar-projection-service.ts's own
// `adaptersOverride` testability pattern — production code never passes it.
export async function getExternalAvailabilityForActor(
  actor: ExternalAccountConnectionActor,
  range: { from: string; to: string },
  providerLookup: (provider: ExternalAccountProvider) => ExternalCalendarProvider = getExternalCalendarProvider,
): Promise<ExternalAvailabilityResult> {
  const connections = await listConnectionsForActor(actor);
  const activeConnections = connections.filter((c) => c.status === "ACTIVE");
  if (activeConnections.length === 0) {
    return { intervals: [], complete: true, unavailableProviders: [] };
  }

  const settled = await Promise.allSettled(
    activeConnections.map(async (connection) => {
      const tokenResult = await getValidAccessTokenForActor(actor, connection.provider, providerLookup(connection.provider));
      if (!tokenResult) throw new Error(`no_valid_token:${connection.provider}`);
      const adapter = providerLookup(connection.provider);
      const busy = await adapter.getFreeBusy(tokenResult.accessToken, range);
      return busy.map((interval): ExternalBusyInterval => ({ ...interval, provider: connection.provider }));
    }),
  );

  const intervals: ExternalBusyInterval[] = [];
  const unavailableProviders: ExternalAccountProvider[] = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      intervals.push(...result.value);
    } else {
      unavailableProviders.push(activeConnections[index].provider);
    }
  });

  return { intervals, complete: unavailableProviders.length === 0, unavailableProviders };
}
