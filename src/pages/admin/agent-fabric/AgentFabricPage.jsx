import React from "react";
import "./agent-fabric.css";
import { Button, StatusBadge } from "@/components/shared/DesignSystemPrimitives.jsx";

const API_ROOT = "/api";

const GOVERNANCE_BOUNDARIES = [
  "Agents can propose, analyze, execute assigned tasks, and report.",
  "Agents cannot verify claims.",
  "Agents cannot public-approve data.",
  "Agents cannot override Oracle rulings.",
  "Agents cannot bypass AI Guardrails.",
  "Agents cannot bypass permissions.",
  "Agents cannot create new architecture layers without Master Layer Registry / proposal governance.",
];

const REQUIRED_LAYERS = [
  "Truth Spine",
  "Oracle",
  "AI Guardrails",
  "Game Theory",
  "Watchtower",
  "Reports",
  "LOO",
];

function readStorage(...keys) {
  try {
    for (const key of keys) {
      const value = globalThis?.localStorage?.getItem(key);
      if (value) return value;
    }
  } catch {}
  return "";
}

function adminHeaders() {
  const headers = { "Content-Type": "application/json" };
  const adminKey = readStorage("ADMIN_API_KEY", "shf_admin_key");
  const adminRole = readStorage("ADMIN_ROLE", "X-Admin-Role", "shf_admin_role");
  const orgId = readStorage("ORG_ID", "X-Org-Id", "shf_org_id");
  if (adminKey) headers["X-Admin-Key"] = adminKey;
  if (adminRole) headers["X-Admin-Role"] = adminRole;
  if (orgId) headers["X-Org-Id"] = orgId;
  return headers;
}

async function agentRequest(path) {
  const response = await fetch(`${API_ROOT}${path}`, { headers: adminHeaders() });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = response.status === 401
      ? "Admin API access required."
      : data?.detail || data?.error || `Agent Fabric request failed: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

function label(value) {
  return String(value || "unknown").replace(/_/g, " ");
}

function normalizeAgent(agent) {
  const policy = agent?.policy && typeof agent.policy === "object" ? agent.policy : {};
  return {
    ...agent,
    agent_id: agent?.agent_id || agent?.agentId || agent?.id || "unknown_agent",
    name: agent?.name || agent?.label || agent?.agent_id || agent?.agentId || "Unknown agent",
    policy,
    capabilities: Array.isArray(agent?.capabilities) ? agent.capabilities : [],
    allowedTools: Array.isArray(agent?.allowedTools)
      ? agent.allowedTools
      : Array.isArray(agent?.allowed_tools)
      ? agent.allowed_tools
      : [],
    inputs: Array.isArray(agent?.inputs) ? agent.inputs : [],
    outputs: Array.isArray(agent?.outputs) ? agent.outputs : [],
  };
}

function statusForAgent(agent, healthRows) {
  const row = healthRows.find((item) => item.agent_id === agent.agent_id || item.agentId === agent.agent_id);
  return row?.status || agent.lifecycle || "registered";
}

export default function AgentFabricPage() {
  const [agents, setAgents] = React.useState([]);
  const [health, setHealth] = React.useState(null);
  const [verify, setVerify] = React.useState(null);
  const [gate, setGate] = React.useState(null);
  const [selectedId, setSelectedId] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const loadAgentFabric = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [agentsPayload, verifyPayload, healthPayload, gatePayload] = await Promise.all([
        agentRequest("/admin/agents"),
        agentRequest("/admin/agents/verify"),
        agentRequest("/admin/agents/summary/health"),
        agentRequest("/admin/layers/gate/status"),
      ]);
      const nextAgents = Array.isArray(agentsPayload.agents)
        ? agentsPayload.agents.map(normalizeAgent)
        : [];
      setAgents(nextAgents);
      setVerify(verifyPayload || null);
      setHealth(healthPayload || null);
      setGate(gatePayload || null);
      setSelectedId((current) => current || nextAgents[0]?.agent_id || "");
    } catch (nextError) {
      setError(nextError.message || "Agent Fabric is unavailable.");
      setAgents([]);
      setVerify(null);
      setHealth(null);
      setGate(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAgentFabric();
  }, [loadAgentFabric]);

  const healthRows = Array.isArray(health?.agents) ? health.agents : [];
  const selectedAgent = agents.find((agent) => agent.agent_id === selectedId) || agents[0] || null;
  const selectedHealth = selectedAgent
    ? healthRows.find((item) => item.agent_id === selectedAgent.agent_id || item.agentId === selectedAgent.agent_id)
    : null;
  const gateBlockers = Array.isArray(gate?.gate_blockers) ? gate.gate_blockers : [];
  const ready = Number(health?.summary?.ready || 0);
  const warning = Number(health?.summary?.warning || 0);
  const blocked = Math.max(0, Number(health?.summary?.total || agents.length || 0) - ready - warning);

  return (
    <main className="agent-fabric-page">
      <section className="agent-fabric-hero">
        <div>
          <p className="agent-fabric-kicker">SHS Agent Governance</p>
          <h1>Agent Fabric</h1>
          <p>Admin-only governance surface for registered SHS agents.</p>
        </div>
        <div className="agent-fabric-badges" aria-label="Agent Fabric status badges">
          {["Admin Only", "Truth Spine Bound", "Oracle Bound", "AI Guardrails Bound", "Game Theory Aware", "Watchtower Visible"].map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
      </section>

      {error ? (
        <div className="agent-fabric-alert">
          <strong>{error}</strong>
          <span>Set local storage `ADMIN_API_KEY` for protected local API smoke. V1 does not hardcode secrets.</span>
        </div>
      ) : null}

      <section className="agent-fabric-metrics" aria-label="Agent Fabric summary">
        <article><span>Total Agents</span><strong>{Number(health?.summary?.total || agents.length || 0)}</strong></article>
        <article><span>Ready</span><strong>{ready}</strong></article>
        <article><span>Warnings</span><strong>{warning}</strong></article>
        <article><span>Blocked</span><strong>{blocked}</strong></article>
        <article><span>Verify</span><strong>{verify?.ok ? "Pass" : loading ? "Load" : "Check"}</strong></article>
        <article><span>Ledger</span><strong>{verify?.ledger?.pass ? "Pass" : loading ? "Load" : "Check"}</strong></article>
      </section>

      <section className="agent-fabric-grid agent-fabric-grid--main">
        <div className="agent-fabric-panel">
          <div className="agent-fabric-panel-head">
            <div>
              <span>Canonical Agents</span>
              <strong>{agents.length ? `${agents.length} registered` : loading ? "Loading" : "Unavailable"}</strong>
            </div>
            <Button type="button" variant="subtle" onClick={loadAgentFabric}>Refresh</Button>
          </div>
          <div className="agent-fabric-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Agent</th>
                  <th scope="col">ID</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                  <th scope="col">Boundary</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr
                    key={agent.agent_id}
                    className={selectedAgent?.agent_id === agent.agent_id ? "is-selected" : ""}
                    tabIndex="0"
                    role="button"
                    aria-label={`Select ${agent.name}`}
                    aria-pressed={selectedAgent?.agent_id === agent.agent_id}
                    onClick={() => setSelectedId(agent.agent_id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(agent.agent_id);
                      }
                    }}
                  >
                    <td><strong>{agent.name}</strong><small>{label(agent.layer)}</small></td>
                    <td><code>{agent.agent_id}</code></td>
                    <td>{agent.role || "Registered SHS agent"}</td>
                    <td><StatusBadge status={statusForAgent(agent, healthRows)}>{label(statusForAgent(agent, healthRows))}</StatusBadge></td>
                    <td>{agent.allowedTools.slice(0, 3).join(", ") || "No tools"}</td>
                    <td>{agent.policy?.notes || "Governed by Agent Fabric policy."}</td>
                  </tr>
                ))}
                {!agents.length ? (
                  <tr>
                    <td colSpan="6">{error || "No agents returned by /admin/agents."}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="agent-fabric-panel">
          <div className="agent-fabric-panel-head">
            <div>
              <span>Agent Detail</span>
              <strong>{selectedAgent?.name || "No agent selected"}</strong>
            </div>
          </div>
          <div className="agent-fabric-detail">
            <p>{selectedAgent?.role || "Select an agent to inspect governance boundaries and audit metadata."}</p>
            <div className="agent-fabric-kv"><span>Lifecycle</span><b>{label(selectedAgent?.lifecycle)}</b></div>
            <div className="agent-fabric-kv"><span>Visibility</span><b>{label(selectedAgent?.visibility)}</b></div>
            <div className="agent-fabric-kv"><span>Human Approval</span><b>{selectedAgent?.policy?.humanApproval ? "Required" : "Not required"}</b></div>
            <div className="agent-fabric-kv"><span>Max Steps</span><b>{selectedAgent?.policy?.maxSteps ?? "n/a"}</b></div>
            <div className="agent-fabric-chip-list">
              {(selectedAgent?.capabilities || []).map((item) => <span key={item}>{label(item)}</span>)}
              {!selectedAgent?.capabilities?.length ? <span>No capabilities listed</span> : null}
            </div>
            <div className="agent-fabric-split">
              <div>
                <h2>Allowed Tasks</h2>
                <ul>
                  {(selectedAgent?.outputs || []).map((item) => <li key={item}>{label(item)}</li>)}
                  {!selectedAgent?.outputs?.length ? <li>Draft, summarize, inspect, or recommend only when policy allows.</li> : null}
                </ul>
              </div>
              <div>
                <h2>Disallowed Tasks</h2>
                <ul>
                  <li>Verify claims</li>
                  <li>Public-approve data</li>
                  <li>Override Oracle rulings</li>
                  <li>Bypass AI Guardrails or permissions</li>
                </ul>
              </div>
            </div>
            <div className="agent-fabric-required">
              {REQUIRED_LAYERS.map((layer) => <span key={layer}>{layer}</span>)}
            </div>
            <p className="agent-fabric-muted">
              Audit status: {selectedHealth?.status || verify?.ledger?.reason || "Audit metadata unavailable."}
            </p>
          </div>
        </aside>
      </section>

      <section className="agent-fabric-grid">
        <div className="agent-fabric-panel">
          <div className="agent-fabric-panel-head">
            <div>
              <span>Governance Boundary</span>
              <strong>Non-bypass rules</strong>
            </div>
          </div>
          <ul className="agent-fabric-boundaries">
            {GOVERNANCE_BOUNDARIES.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <div className="agent-fabric-panel">
          <div className="agent-fabric-panel-head">
            <div>
              <span>Layer Gate</span>
              <strong>{gate ? `gate_pass=${Boolean(gate.gate_pass)}` : "Unavailable"}</strong>
            </div>
          </div>
          <div className="agent-fabric-gate">
            <p>{gate?.auditor_one_liner || "Layer gate status unavailable."}</p>
            <small>gate_pass=false may be expected until later readiness blockers are resolved.</small>
            <div className="agent-fabric-chip-list">
              {gateBlockers.map((blocker) => (
                <span key={`${blocker.layer}-${blocker.reason}`}>{blocker.layer}: {label(blocker.reason)}</span>
              ))}
              {!gateBlockers.length ? <span>No blockers reported</span> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="agent-fabric-grid">
        <div className="agent-fabric-panel">
          <div className="agent-fabric-panel-head">
            <div>
              <span>Audit Trace</span>
              <strong>{verify?.ledger?.pass ? "Ledger verified" : "V1 trace note"}</strong>
            </div>
          </div>
          <div className="agent-fabric-copy">
            <p>Audit trace stored at <code>db/agent_events.jsonl</code>; V1 does not expose full log stream.</p>
            <p>{verify?.ledger?.reason || "Use /admin/agents/verify for registry and ledger verification."}</p>
          </div>
        </div>

        <div className="agent-fabric-panel">
          <div className="agent-fabric-panel-head">
            <div>
              <span>Registry Linkage</span>
              <strong>Canonical sources</strong>
            </div>
          </div>
          <div className="agent-fabric-copy">
            <p><b>Canonical source:</b> <code>contracts/agents/agents.json</code></p>
            <p><b>Admin API:</b> <code>/admin/agents</code></p>
            <p><b>Layer control:</b> <code>/admin/layers</code></p>
            <p><b>Secondary visibility:</b> Registry Agents tab</p>
            <p><b>Master Layer Registry:</b> Agent Fabric is bounded inside AI/Swarm, Governance, and Layer Control.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
