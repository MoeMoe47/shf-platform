// SHF Ecosystem Phase 12.2 — MockExternalCalendarProvider.
//
// Simulates the full ExternalCalendarProvider contract end-to-end with
// zero external network calls — mirrors MockLiveLearningProvider's own
// header comment and role exactly. Used only by tests (passed as an
// explicit override parameter, mirroring calendar-projection-service.ts's
// `adaptersOverride` testability pattern) — never selectable as a real
// `provider` column value (external_account_connections' CHECK constraint
// only allows 'google'/'microsoft'; a connection created with this mock's
// synthetic tokens is stored under whichever real provider name the test
// is exercising, since encryption/storage code does not care which
// adapter produced a token).
import type {
  ExternalCalendarProvider,
  ExternalCalendarProviderHealth,
  AuthorizationUrlInput,
  ExchangeCodeInput,
  ProviderTokenResult,
  ProviderAccountIdentity,
  FreeBusyInterval,
  MirroredEventInput,
  MirroredEventResult,
} from "./external-calendar-provider.js";

let counter = 0;
function nextId(prefix: string) {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

const mirroredEvents = new Map<string, MirroredEventInput>();

// Test-only inspection helper — lets a test assert exactly what a mirror
// sync sent to "the provider" without needing a second, parallel fake
// HTTP layer.
export function getMockMirroredEvent(providerEventId: string): MirroredEventInput | undefined {
  return mirroredEvents.get(providerEventId);
}

export class MockExternalCalendarProvider implements ExternalCalendarProvider {
  readonly name: "google" | "microsoft";
  private busyIntervals: FreeBusyInterval[] = [];
  private failFreeBusy = false;

  constructor(name: "google" | "microsoft" = "google") {
    this.name = name;
  }

  // Test-only configuration hooks — never used by real request handling.
  setBusyIntervals(intervals: FreeBusyInterval[]) {
    this.busyIntervals = intervals;
  }
  setFreeBusyShouldFail(shouldFail: boolean) {
    this.failFreeBusy = shouldFail;
  }

  getAuthorizationUrl(input: AuthorizationUrlInput): string {
    return `https://mock.invalid/${this.name}/authorize?state=${encodeURIComponent(input.state)}&challenge=${encodeURIComponent(input.codeChallenge)}`;
  }

  async exchangeAuthorizationCode(input: ExchangeCodeInput): Promise<ProviderTokenResult & ProviderAccountIdentity> {
    return {
      accessToken: `mock_access_${nextId("tok")}`,
      accessTokenExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
      refreshToken: `mock_refresh_${nextId("tok")}`,
      scope: ["mock.calendar"],
      providerAccountId: `mock_account_${input.code}`,
      email: `mock-${input.code}@example.invalid`,
    };
  }

  async refreshAccessToken(_refreshToken: string): Promise<ProviderTokenResult> {
    return {
      accessToken: `mock_access_${nextId("tok")}`,
      accessTokenExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
      refreshToken: null, // exercises the "provider did not re-issue" path by default
      scope: ["mock.calendar"],
    };
  }

  async getFreeBusy(_accessToken: string, _range: { from: string; to: string }): Promise<FreeBusyInterval[]> {
    if (this.failFreeBusy) throw new Error("mock_provider_freebusy_failure");
    return this.busyIntervals;
  }

  async upsertMirroredEvent(_accessToken: string, event: MirroredEventInput): Promise<MirroredEventResult> {
    const providerEventId = event.providerEventId || nextId("mockevt");
    mirroredEvents.set(providerEventId, event);
    return { providerEventId };
  }

  async deleteMirroredEvent(_accessToken: string, providerEventId: string): Promise<void> {
    mirroredEvents.delete(providerEventId);
  }

  async revokeConnection(_refreshToken: string): Promise<void> {
    return;
  }

  async healthCheck(): Promise<ExternalCalendarProviderHealth> {
    return "available";
  }
}
