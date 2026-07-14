import React, { useMemo, useState } from "react";
import { useAuthContext } from "@/auth/auth-context";
import { isDemoIdentityAllowed } from "@/system/identity/authConfig";
import { SHS_DEMO_USERS, getDemoUserByEmail, getLandingRouteForUser, goToAdminHash } from "@/system/identity/identityRouting";
import "./shs-login-page.css";

const LOGO_SRC = "/assets/branding/shs-hub-logo.png";

export default function SHSLoginPage() {
  const auth = useAuthContext();
  const [email, setEmail] = useState("client@demo.shs");
  const [password, setPassword] = useState("demo-password");
  const [selectedUserId, setSelectedUserId] = useState("demo_client");
  const [error, setError] = useState("");
  const demoAllowed = isDemoIdentityAllowed();

  const selectedUser = useMemo(
    () => SHS_DEMO_USERS.find((user) => user.id === selectedUserId) || SHS_DEMO_USERS[0],
    [selectedUserId]
  );

  function chooseUser(user) {
    setSelectedUserId(user.id);
    setEmail(user.email);
    setPassword("demo-password");
    setError("");
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    try {
      const identity = await auth.login({ email, password });
      const user = getDemoUserByEmail(identity.user?.email || email) || selectedUser;
      goToAdminHash(getLandingRouteForUser(user));
    } catch (err) {
      setError(err?.message || "Unable to sign in.");
    }
  }

  return (
    <main className="shsLogin-shell">
      <section className="shsLogin-card">
        <div className="shsLogin-brand">
          <div className="shsLogin-logo">
            <img src={LOGO_SRC} alt="Silicon Heartland Solutions" />
          </div>
          <span>Silicon Heartland Solutions</span>
          <h1>Sign in to SHS Hub</h1>
          <p>
            Identity is resolved by the backend session service before protected SHS BOS surfaces render.
          </p>
        </div>

        <form className="shsLogin-form" onSubmit={handleLogin}>
          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="client@demo.shs"
              type="email"
              autoComplete="username"
            />
          </label>

          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
            />
            <small>Local fixtures authenticate through /auth/login and receive an HttpOnly session cookie.</small>
          </label>

          {demoAllowed ? (
            <div className="shsLogin-warning">
              Non-production demo fixture mode is enabled for local browser smoke only.
            </div>
          ) : null}

          {error ? <div className="shsLogin-error">{error}</div> : null}

          <button className="shsLogin-primary" type="submit" disabled={auth.loading}>
            {auth.loading ? "Checking session..." : "Continue to Hub"}
          </button>
        </form>

        <section className="shsLogin-demoUsers">
          <div>
            <h2>Fixture identity paths</h2>
            <p>Choose a fixture, then authenticate through the backend session boundary.</p>
          </div>

          <div className="shsLogin-userGrid">
            {SHS_DEMO_USERS.map((user) => (
              <button
                key={user.id}
                type="button"
                className={selectedUserId === user.id ? "is-selected" : ""}
                onClick={() => chooseUser(user)}
              >
                <span>{user.roleLabel}</span>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
                <em>{user.organization}</em>
              </button>
            ))}
          </div>
        </section>
      </section>

      <aside className="shsLogin-path">
        <span>Login Flow</span>
        <h2>Session Cookie → Backend Policy → Authorized UI</h2>

        <div className="shsLogin-flow">
          <div>
            <b>1</b>
            <strong>Authenticate</strong>
            <p>Credentials are posted to the backend auth route.</p>
          </div>
          <div>
            <b>2</b>
            <strong>Resolve Session</strong>
            <p>/auth/me returns a sanitized identity summary.</p>
          </div>
          <div>
            <b>3</b>
            <strong>Authorize</strong>
            <p>Role and permission checks gate route visibility.</p>
          </div>
          <div>
            <b>4</b>
            <strong>Audit</strong>
            <p>Security events are recorded without raw credentials or tokens.</p>
          </div>
        </div>
      </aside>
    </main>
  );
}
