// src/pages/career/settings/ExternalCalendarConnections.jsx
//
// SHF Ecosystem Phase 12.2 — Settings UI for connecting Google Calendar /
// Microsoft Outlook, per phase brief §48-49. Uses the existing sh-btn /
// card visual language already shared across Calendar surfaces — no new
// component system introduced. Apple/iCal is presented via the existing
// Phase 12 private ICS subscription feed, not an invented "Connect Apple"
// OAuth control (phase brief §50).
import React from "react";
import { useUser } from "@/context/UserContext.jsx";
import {
  listExternalAccountConnections,
  disconnectExternalAccount,
  externalCalendarConnectUrl,
} from "@/lib/externalAccounts/api.js";

const PROVIDERS = [
  { id: "google", label: "Google Calendar" },
  { id: "microsoft", label: "Microsoft Outlook" },
];

const RETURN_PATH = "/career/settings";

export default function ExternalCalendarConnections() {
  const { role } = useUser();
  const [state, setState] = React.useState({ loading: true, connections: [], error: null });
  const [pendingProvider, setPendingProvider] = React.useState(null);

  const load = React.useCallback(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    listExternalAccountConnections(role)
      .then((data) => {
        if (!active) return;
        setState({ loading: false, connections: data?.connections || [], error: null });
      })
      .catch((error) => {
        if (!active) return;
        setState({ loading: false, connections: [], error });
      });
    return () => { active = false; };
  }, [role]);

  React.useEffect(() => load(), [load]);

  async function handleDisconnect(provider) {
    setPendingProvider(provider);
    try {
      await disconnectExternalAccount(role, provider);
    } catch {
      // Surfaced honestly via the next load() below rather than a
      // separate error banner — if disconnect actually failed, the
      // connection's real status (still shown) tells the story.
    } finally {
      setPendingProvider(null);
      load();
    }
  }

  return (
    <section className="card card--pad" aria-labelledby="ext-cal-settings-h">
      <h2 id="ext-cal-settings-h" style={{ marginTop: 0 }}>Connected Calendars</h2>
      <p className="sh-muted" style={{ marginBottom: "1rem" }}>
        SHF can add your SHF schedule to a calendar you already use, and use its busy times to improve
        planning suggestions. SHF never uses changes on a connected calendar to mark an assignment or
        class complete.
      </p>

      {state.loading ? (
        <p className="sh-muted">Loading…</p>
      ) : state.error ? (
        <p className="sh-muted" role="alert">Your connections couldn&rsquo;t be loaded right now.</p>
      ) : (
        <ul className="ext-cal-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {PROVIDERS.map((provider) => {
            const connection = state.connections.find((c) => c.provider === provider.id);
            const status = !connection
              ? "Not connected"
              : connection.reauthRequired
                ? "Reauthentication required"
                : "Connected";
            return (
              <li
                key={provider.id}
                className="ext-cal-row"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.75rem 0", borderTop: "1px solid var(--cal-border, #e5e7eb)" }}
              >
                <div>
                  <div>{provider.label}</div>
                  <div className="sh-muted" style={{ fontSize: "0.85em" }}>{status}</div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {connection ? (
                    <>
                      {connection.reauthRequired && (
                        <a className="sh-btn sh-btn--soft" href={externalCalendarConnectUrl(provider.id, RETURN_PATH)}>
                          Reconnect
                        </a>
                      )}
                      <button
                        type="button"
                        className="sh-btn sh-btn--soft"
                        disabled={pendingProvider === provider.id}
                        onClick={() => handleDisconnect(provider.id)}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <a className="sh-btn sh-btn--primary" href={externalCalendarConnectUrl(provider.id, RETURN_PATH)}>
                      Connect
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
