import React, { useMemo, useState } from "react";
import {
  SHS_DEMO_USERS,
  clearIdentitySession,
  getDemoUserByEmail,
  getLandingRouteForUser,
  goToAdminHash,
  saveIdentitySession,
} from "@/system/identity/identityRouting";
import "./shs-login-page.css";

const LOGO_SRC = "/assets/branding/shs-hub-logo.png";

export default function SHSLoginPage() {
  const [email, setEmail] = useState("client@demo.shs");
  const [selectedUserId, setSelectedUserId] = useState("demo_client");
  const [error, setError] = useState("");

  const selectedUser = useMemo(
    () => SHS_DEMO_USERS.find((user) => user.id === selectedUserId) || SHS_DEMO_USERS[0],
    [selectedUserId]
  );

  function chooseUser(user) {
    setSelectedUserId(user.id);
    setEmail(user.email);
    setError("");
  }

  function handleLogin(event) {
    event.preventDefault();

    const user = getDemoUserByEmail(email) || selectedUser;

    if (!user) {
      setError("No demo user found for that email.");
      return;
    }

    clearIdentitySession();
    saveIdentitySession(user);

    console.log("[identity-login] saved session", {
      email: user.email,
      role: user.role,
      savedRole: localStorage.getItem("shsUserRole"),
      demoRole: localStorage.getItem("shsHubDemoRole"),
    });

    const landingRoute = getLandingRouteForUser(user);
    goToAdminHash(landingRoute);
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
            Identity determines the user’s role, workspace, allowed pages, and guided workflow path.
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
            />
          </label>

          <label>
            Password
            <input value="demo-password" readOnly type="password" />
            <small>Demo mode uses preset identities. Real auth can replace this later.</small>
          </label>

          {error ? <div className="shsLogin-error">{error}</div> : null}

          <button className="shsLogin-primary" type="submit">
            Continue to Hub →
          </button>
        </form>

        <section className="shsLogin-demoUsers">
          <div>
            <h2>Demo identity paths</h2>
            <p>Choose a role to test the Identity Access Layer.</p>
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
        <h2>Identity → Guided Path → Page Tour</h2>

        <div className="shsLogin-flow">
          <div>
            <b>1</b>
            <strong>Authenticate</strong>
            <p>User signs in and gets a role.</p>
          </div>
          <div>
            <b>2</b>
            <strong>Identity Layer</strong>
            <p>Role controls page visibility and permissions.</p>
          </div>
          <div>
            <b>3</b>
            <strong>Hub Dashboard</strong>
            <p>Guided launcher shows the correct next steps.</p>
          </div>
          <div>
            <b>4</b>
            <strong>Workflow Tours</strong>
            <p>Each page teaches how to use it and where to go next.</p>
          </div>
        </div>
      </aside>
    </main>
  );
}
