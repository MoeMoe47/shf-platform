import React, { useEffect, useMemo, useState } from "react";
import "@/styles/admin.appRegistry.css";
import ControlPlaneStrip from "@/components/admin/ControlPlaneStrip.jsx";

function safeJson(v) {
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

function getAdminKey() {
  try {
    return (
      globalThis?.localStorage?.getItem("ADMIN_API_KEY") ||
      globalThis?.localStorage?.getItem("shf_admin_key") ||
      ""
    );
  } catch {
    return "";
  }
}

async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const k = getAdminKey();
  if (k) headers["X-Admin-Key"] = k;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { detail: text }; }
  return { ok: res.ok, status: res.status, json };
}

function nowIso() {
  try { return new Date().toISOString(); } catch { return ""; }
}

function kindLabel(k) {
  const kk = String(k || "").toLowerCase();
  if (kk === "app") return "Apps";
  if (kk === "agent") return "Agents";
  if (kk === "business") return "Businesses";
  return "All";
}

function computeReadiness(entity) {
  const e = entity || {};
  const lifecycle = e.lifecycle || {};
  const legal = e.legal || {};
  const policy = e.policy || {};
  const attest = Array.isArray(legal.attestations) ? legal.attestations : [];

  const checks = [
    !!e.kind,
    !!e.id,
    !!(e.name || e.title),
    !!e.layer,
    !!lifecycle.status,
    !!legal.classification,
    !!legal.jurisdiction,
    !!(legal.termsRef && legal.disclaimerRef),
    typeof policy.humanApproval === "boolean",
  ];

  const base = checks.filter(Boolean).length / checks.length;
  const att = Math.min(1, attest.length / 2);
  const lifeBoost =
    String(lifecycle.status || "").toLowerCase() === "active" ? 1 : 0.7;

  const score = Math.round((0.65 * base + 0.25 * att + 0.10 * lifeBoost) * 100);
  let label = "Needs Work";
  if (score >= 85) label = "Partner Ready";
  else if (score >= 70) label = "Operational";
  else if (score >= 55) label = "Pilot Ready";
  return { score, label };
}

function summarizeEntity(e) {
  const id = String(e?.id || "—");
  const kind = String(e?.kind || "—");
  const title = String(e?.title || e?.name || "—");
  const layer = String(e?.layer || "—");
  const status = String(e?.lifecycle?.status || e?.status || "—");
  const cls = String(e?.legal?.classification || "—");
  const jur = String(e?.legal?.jurisdiction || "—");
  const risk = String(e?.legal?.riskTier || e?.riskTier || "—");
  const att = Array.isArray(e?.legal?.attestations) ? e.legal.attestations.length : 0;

  const r = computeReadiness(e);

  return {
    id, kind, title, layer, status,
    classification: cls,
    jurisdiction: jur,
    riskTier: risk,
    attestations: att,
    readiness: `${r.score}/100 · ${r.label}`,
  };
}

function validateEntity(e) {
  const errs = [];
  const kind = String(e?.kind || "").trim();
  const id = String(e?.id || "").trim();
  const title = String(e?.title || e?.name || "").trim();
  const layer = String(e?.layer || "").trim();
  const status = String(e?.lifecycle?.status || "").trim();
  const classification = String(e?.legal?.classification || "").trim();
  const jurisdiction = String(e?.legal?.jurisdiction || "").trim();
  const termsRef = String(e?.legal?.termsRef || "").trim();
  const disclaimerRef = String(e?.legal?.disclaimerRef || "").trim();

  if (!kind) errs.push("kind is required");
  if (!id) errs.push("id is required");
  if (!title) errs.push("title (or name) is required");
  if (!layer) errs.push("layer is required");
  if (!status) errs.push("lifecycle.status is required");
  if (!classification) errs.push("legal.classification is required");
  if (!jurisdiction) errs.push("legal.jurisdiction is required");
  if (!termsRef) errs.push("legal.termsRef is required");
  if (!disclaimerRef) errs.push("legal.disclaimerRef is required");

  const hp = e?.policy?.humanApproval;
  if (!(hp === true || hp === false)) errs.push("policy.humanApproval must be true/false");

  return errs;
}

function deepClone(v) {
  try { return JSON.parse(JSON.stringify(v)); } catch { return v; }
}

function defaultEntity(kind) {
  const k = String(kind || "app").toLowerCase();
  const base = {
    kind: k,
    id: `${k.toUpperCase()}_${Date.now()}`,
    name: k === "business" ? "DemoBusiness" : k === "agent" ? "DemoAgent" : "DemoApp",
    title: k === "business" ? "Demo Business" : k === "agent" ? "Demo Agent" : "Demo App",
    layer: "L00",
    updatedAt: nowIso(),
    lifecycle: { status: "active" },
    policy: { humanApproval: false, maxSteps: 6, notes: "created from UI" },
    legal: {
      classification: "internal",
      dataCategory: ["none"],
      authority: { approvedBy: "shf-admin", basis: "ui_upsert" },
      jurisdiction: "US-OH",
      termsRef: "legal/terms/shf-registry-terms@1.0.0",
      disclaimerRef: "legal/disclaimers/default@1.0.0",
      retention: { artifactsDays: 365, auditLogsDays: 365, deletionPolicy: "retire_only" },
      attestations: [],
    },
  };

  if (k === "business") {
    base.business = {
      type: "partner",
      complianceFlags: [],
      servicesTags: [],
      riskTier: "low",
    };
  }
  return base;
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={active ? "ar-pill ar-pillOn" : "ar-pill"}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Drawer({ open, onClose, entity, onEdit, onLifecycle, onAttest, onEvents }) {
  if (!open) return null;
  const s = summarizeEntity(entity);

  return (
    <>
      <div className="rg-scrim" onClick={onClose} aria-hidden="true" />
      <aside className="rg-drawer" role="dialog" aria-modal="true" aria-label="Registry Details">
        <div className="rg-drawerTop">
          <div>
            <div className="ar-kicker">Entity</div>
            <div className="rg-drawerTitle">{s.title}</div>
            <div className="rg-drawerSub">
              <span className="ar-mono">{s.kind}</span>
              <span className="ar-dot">•</span>
              <span className="ar-mono">{s.id}</span>
            </div>
          </div>
          <button className="ar-btn ar-btnGhost" onClick={onClose} type="button">✕</button>
        </div>

        <div className="rg-summary">
          <div className="rg-kv"><span>Layer</span><b>{s.layer}</b></div>
          <div className="rg-kv"><span>Status</span><b>{s.status}</b></div>
          <div className="rg-kv"><span>Class</span><b>{s.classification}</b></div>
          <div className="rg-kv"><span>Jurisdiction</span><b>{s.jurisdiction}</b></div>
          <div className="rg-kv"><span>Risk</span><b>{s.riskTier}</b></div>
          <div className="rg-kv"><span>Attest</span><b>{s.attestations}</b></div>
          <div className="rg-kv"><span>Readiness</span><b>{s.readiness}</b></div>
        </div>

        <div className="rg-drawerActions">
          <button className="ar-btn" type="button" onClick={onEdit}>Edit</button>
          <button className="ar-btn ar-btnGhost" type="button" onClick={onLifecycle}>Lifecycle</button>
          <button className="ar-btn ar-btnGhost" type="button" onClick={onAttest}>Attest</button>
          <button className="ar-btn ar-btnGhost" type="button" onClick={onEvents}>View Events</button>
        </div>

        <details style={{ marginTop: 12 }}>
          <summary className="ar-muted" style={{ cursor: "pointer" }}>Raw JSON</summary>
          <pre className="ar-code" style={{ marginTop: 10 }}>{safeJson(entity)}</pre>
        </details>
      </aside>
    </>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="rg-scrim" onClick={onClose} aria-hidden="true" />
      <div className="rg-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="rg-modalTop">
          <div className="rg-modalTitle">{title}</div>
          <button className="ar-btn ar-btnGhost" onClick={onClose} type="button">✕</button>
        </div>
        {children}
      </div>
    </>
  );
}

export default function Registry() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [lastStatus, setLastStatus] = useState(null);
  const [items, setItems] = useState([]);
  const [raw, setRaw] = useState(null);

  const [tab, setTab] = useState("app"); // app | agent | business
  const [query, setQuery] = useState("");
  const [filterLayer, setFilterLayer] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [sortBy, setSortBy] = useState("updatedAt"); // updatedAt | layer | id
  const [sortDir, setSortDir] = useState("desc");

  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState("");
  const [editReason, setEditReason] = useState("");

  const [lifecycleOpen, setLifecycleOpen] = useState(false);
  const [nextLifecycle, setNextLifecycle] = useState("active");
  const [lifecycleReason, setLifecycleReason] = useState("");

  const [attestOpen, setAttestOpen] = useState(false);
  const [attestWho, setAttestWho] = useState("");
  const [attestWhat, setAttestWhat] = useState("");
  const [attestWhy, setAttestWhy] = useState("");

  const [eventsOpen, setEventsOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsErr, setEventsErr] = useState("");

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  async function refresh() {
    setLoading(true);
    setErr("");
    const r = await api("/admin/registry");
    setLastStatus(r.status);
    setRaw(r.json);

    if (!r.ok) {
      setItems([]);
      setErr(`HTTP ${r.status}: ${r.json?.detail || safeJson(r.json)}`);
      setLoading(false);
      return;
    }

    const list = r.json?.items || r.json?.data?.items || r.json?.rows || [];
    setItems(Array.isArray(list) ? list : []);
    setLoading(false);
  }

  async function upsertEntity(entity, reason) {
    const payload = { entity, reason: String(reason || "").trim() || "ui_change" };
    return api("/admin/registry/upsert", { method: "POST", body: payload });
  }

  async function seed(kind) {
    setErr("");
    const entity = defaultEntity(kind);
    const r = await upsertEntity(entity, `seed_${kind}`);
    if (!r.ok) {
      setErr(`Seed failed HTTP ${r.status}: ${r.json?.detail || safeJson(r.json)}`);
      return;
    }
    await refresh();
  }

  useEffect(() => {
    refresh();
  }, []);

  const rows = useMemo(() => {
    const all = Array.isArray(items) ? items.slice() : [];
    const activeTab = String(tab || "app").toLowerCase();
    const q = query.trim().toLowerCase();

    const layers = new Set();
    const statuses = new Set();
    const classes = new Set();

    all.forEach((x) => {
      if (x?.layer) layers.add(String(x.layer));
      const st = x?.lifecycle?.status || x?.status;
      if (st) statuses.add(String(st));
      const cl = x?.legal?.classification;
      if (cl) classes.add(String(cl));
    });

    function match(x) {
      if (String(x?.kind || "").toLowerCase() !== activeTab) return false;

      const id = String(x?.id || "").toLowerCase();
      const name = String(x?.name || "").toLowerCase();
      const title = String(x?.title || "").toLowerCase();
      const hit = !q || id.includes(q) || name.includes(q) || title.includes(q);
      if (!hit) return false;

      if (filterLayer !== "ALL" && String(x?.layer || "") !== filterLayer) return false;

      const st = String(x?.lifecycle?.status || x?.status || "");
      if (filterStatus !== "ALL" && st !== filterStatus) return false;

      const cl = String(x?.legal?.classification || "");
      if (filterClass !== "ALL" && cl !== filterClass) return false;

      return true;
    }

    const filtered = all.filter(match);

    function getSortVal(x) {
      if (sortBy === "layer") return String(x?.layer || "");
      if (sortBy === "id") return String(x?.id || "");
      return String(x?.updatedAt || x?.meta?.updatedAt || "");
    }

    filtered.sort((a, b) => {
      const av = getSortVal(a);
      const bv = getSortVal(b);
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return {
      filtered,
      layerOptions: ["ALL", ...Array.from(layers).sort()],
      statusOptions: ["ALL", ...Array.from(statuses).sort()],
      classOptions: ["ALL", ...Array.from(classes).sort()],
    };
  }, [items, tab, query, filterLayer, filterStatus, filterClass, sortBy, sortDir]);

  function openDrawer(x) {
    setSelected(x);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function beginEdit() {
    if (!selected) return;
    setEditReason("");
    setEditText(safeJson(selected));
    setEditOpen(true);
  }

  async function commitEdit() {
    setErr("");
    const reason = String(editReason || "").trim();
    if (!reason) {
      setErr("Edit blocked: reason is required.");
      return;
    }

    let entity = null;
    try { entity = JSON.parse(editText || "{}"); } catch {
      setErr("Edit blocked: invalid JSON.");
      return;
    }

    const errs = validateEntity(entity);
    if (errs.length) {
      setErr(`Edit blocked:\n- ${errs.join("\n- ")}`);
      return;
    }

    const r = await upsertEntity(entity, reason);
    if (!r.ok) {
      setErr(`Upsert failed HTTP ${r.status}: ${r.json?.detail || safeJson(r.json)}`);
      return;
    }

    setEditOpen(false);
    await refresh();
    setSelected(entity);
  }

  function beginLifecycle() {
    if (!selected) return;
    setLifecycleReason("");
    const cur = String(selected?.lifecycle?.status || selected?.status || "active").toLowerCase();
    setNextLifecycle(cur || "active");
    setLifecycleOpen(true);
  }

  async function commitLifecycle() {
    setErr("");
    const reason = String(lifecycleReason || "").trim();
    if (!reason) {
      setErr("Lifecycle blocked: reason is required.");
      return;
    }
    if (!selected) return;

    const entity = deepClone(selected);
    entity.lifecycle = entity.lifecycle || {};
    entity.lifecycle.status = String(nextLifecycle || "active").toLowerCase();
    entity.updatedAt = nowIso();

    const r = await upsertEntity(entity, reason);
    if (!r.ok) {
      setErr(`Lifecycle update failed HTTP ${r.status}: ${r.json?.detail || safeJson(r.json)}`);
      return;
    }

    setLifecycleOpen(false);
    await refresh();
    setSelected(entity);
  }

  function beginAttest() {
    if (!selected) return;
    setAttestWho("");
    setAttestWhat("");
    setAttestWhy("");
    setAttestOpen(true);
  }

  async function commitAttest() {
    setErr("");
    const who = String(attestWho || "").trim();
    const what = String(attestWhat || "").trim();
    const why = String(attestWhy || "").trim();
    if (!who || !what || !why) {
      setErr("Attestation blocked: who/what/why are required.");
      return;
    }
    if (!selected) return;

    const entity = deepClone(selected);
    entity.legal = entity.legal || {};
    entity.legal.attestations = Array.isArray(entity.legal.attestations) ? entity.legal.attestations : [];
    entity.legal.attestations.push({
      ts: nowIso(),
      who,
      what,
      why,
    });
    entity.updatedAt = nowIso();

    const r = await upsertEntity(entity, `attest:${who}`);
    if (!r.ok) {
      setErr(`Attest failed HTTP ${r.status}: ${r.json?.detail || safeJson(r.json)}`);
      return;
    }

    setAttestOpen(false);
    await refresh();
    setSelected(entity);
  }

  async function beginEvents() {
    setEventsErr("");
    setEvents([]);
    setEventsOpen(true);

    const id = String(selected?.id || "").trim();
    if (!id) return;

    // We try a few likely endpoints; whichever exists in your backend wins.
    const tries = [
      `/admin/registry/events?entityId=${encodeURIComponent(id)}`,
      `/admin/registry/audit?entityId=${encodeURIComponent(id)}`,
      `/admin/registry/log?entityId=${encodeURIComponent(id)}`,
    ];

    for (const p of tries) {
      const r = await api(p);
      if (r.ok) {
        const list = r.json?.items || r.json?.events || r.json?.rows || [];
        setEvents(Array.isArray(list) ? list : []);
        return;
      }
    }

    setEventsErr("No events endpoint found yet. Add /admin/registry/events (recommended).");
  }

  function exportFiltered() {
    const out = rows.filtered || [];
    const blob = new Blob([safeJson(out)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shf_registry_export_${tab}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openImport() {
    setImportText("");
    setImportOpen(true);
  }

  async function commitImport() {
    setErr("");
    let list = null;
    try { list = JSON.parse(importText || "[]"); } catch {
      setErr("Import blocked: invalid JSON.");
      return;
    }
    if (!Array.isArray(list)) {
      setErr("Import blocked: JSON must be an array of entities.");
      return;
    }

    // Validate first (preview gate)
    const problems = [];
    list.forEach((e, i) => {
      const errs = validateEntity(e);
      if (errs.length) problems.push(`Row ${i + 1}: ${errs.join("; ")}`);
    });
    if (problems.length) {
      setErr(`Import blocked:\n- ${problems.slice(0, 15).join("\n- ")}${problems.length > 15 ? "\n- (more...)" : ""}`);
      return;
    }

    // Apply
    for (const e of list) {
      const r = await upsertEntity(e, "import_apply");
      if (!r.ok) {
        setErr(`Import failed on ${e?.id || "?"}: HTTP ${r.status}: ${r.json?.detail || safeJson(r.json)}`);
        return;
      }
    }

    setImportOpen(false);
    await refresh();
  }

  const activeCount = rows.filtered.length;

  return (
    <div className="ar-wrap rg-wrap">
      <header className="ar-head">
        <div>
          <div className="ar-kicker">System</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            <h1 className="ar-title" style={{ margin:0 }}>Registry</h1>
            <div className="rg-tabs">
              <TabButton active={tab === "app"} onClick={() => setTab("app")}>Apps</TabButton>
              <TabButton active={tab === "agent"} onClick={() => setTab("agent")}>Agents</TabButton>
              <TabButton active={tab === "business"} onClick={() => setTab("business")}>Businesses</TabButton>
            </div>
          </div>
          <div className="ar-sub">
            Unified registry inventory ({kindLabel(tab)}) with governance-grade controls.
          </div>
        </div>

        <div className="ar-actions">
          <div className="ar-search">
            <span className="ar-searchIco">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search id, name, title…"
              aria-label="Search registry"
            />
          </div>

          <div className="rg-selectRow">
            <select className="rg-select" value={filterLayer} onChange={(e) => setFilterLayer(e.target.value)} aria-label="Filter layer">
              {rows.layerOptions.map((x) => <option key={x} value={x}>{x === "ALL" ? "All Layers" : x}</option>)}
            </select>
            <select className="rg-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter status">
              {rows.statusOptions.map((x) => <option key={x} value={x}>{x === "ALL" ? "All Status" : x}</option>)}
            </select>
            <select className="rg-select" value={filterClass} onChange={(e) => setFilterClass(e.target.value)} aria-label="Filter classification">
              {rows.classOptions.map((x) => <option key={x} value={x}>{x === "ALL" ? "All Classes" : x}</option>)}
            </select>
          </div>

          <div className="rg-selectRow">
            <select className="rg-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by">
              <option value="updatedAt">Sort: updatedAt</option>
              <option value="layer">Sort: layer</option>
              <option value="id">Sort: id</option>
            </select>
            <select className="rg-select" value={sortDir} onChange={(e) => setSortDir(e.target.value)} aria-label="Sort direction">
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </div>

          <div className="rg-topBtns">
            <button className="ar-btn" onClick={refresh} type="button">Refresh</button>
            <button className="ar-btn ar-btnGhost" onClick={() => seed(tab)} type="button">Seed {kindLabel(tab).slice(0, -1)}</button>
            <button className="ar-btn ar-btnGhost" onClick={exportFiltered} type="button">Export</button>
            <button className="ar-btn ar-btnGhost" onClick={openImport} type="button">Import</button>
          </div>
        </div>
      </header>

      <ControlPlaneStrip />

      <div className="rg-metaBar">
        <div className="ar-muted">
          {loading ? "Loading..." : `Showing ${activeCount} ${kindLabel(tab).toLowerCase()} • HTTP ${lastStatus ?? "?"}`}
        </div>
        <div className="ar-muted">
          Admin key present: {getAdminKey() ? "✅ yes" : "❌ no (set localStorage.ADMIN_API_KEY)"}
        </div>
      </div>

      {err ? (
        <div className="rg-error">
          <div style={{ fontWeight: 750, marginBottom: 6 }}>Error</div>
          <div className="ar-code" style={{ whiteSpace: "pre-wrap" }}>{String(err)}</div>
        </div>
      ) : null}

      <div className="rg-tableWrap">
        <table className="rg-table">
          <thead>
            <tr>
              <th>kind</th>
              <th>id</th>
              <th>layer</th>
              <th>status</th>
              <th>title</th>
              <th>readiness</th>
              <th>updatedAt</th>
            </tr>
          </thead>
          <tbody>
            {rows.filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="ar-muted">No entities match filters.</td>
              </tr>
            ) : (
              rows.filtered.map((x) => {
                const r = computeReadiness(x);
                return (
                  <tr
                    key={`${x.kind}:${x.id}`}
                    className="rg-row"
                    onClick={() => openDrawer(x)}
                    role="button"
                    tabIndex={0}
                  >
                    <td>{x.kind}</td>
                    <td className="rg-mono">{x.id}</td>
                    <td>{x.layer || ""}</td>
                    <td>{x.lifecycle?.status || x.status || ""}</td>
                    <td>{x.title || x.name || ""}</td>
                    <td>
                      <span className={r.score >= 85 ? "rg-pill rg-pillGood" : r.score >= 70 ? "rg-pill rg-pillOk" : "rg-pill"}>
                        {r.score}/100
                      </span>
                      <span className="ar-muted" style={{ marginLeft: 8 }}>{r.label}</span>
                    </td>
                    <td className="rg-mono">{String(x.updatedAt || x.meta?.updatedAt || "").replace("T"," ").replace("Z","")}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <details style={{ marginTop: 12 }}>
          <summary className="ar-muted" style={{ cursor: "pointer" }}>Raw JSON (server response)</summary>
          <pre className="ar-code" style={{ marginTop: 10 }}>{safeJson(raw)}</pre>
        </details>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        entity={selected}
        onEdit={beginEdit}
        onLifecycle={beginLifecycle}
        onAttest={beginAttest}
        onEvents={beginEvents}
      />

      <Modal open={editOpen} title="Edit Entity (validated) — reason required" onClose={() => setEditOpen(false)}>
        <div className="rg-modalBody">
          <div className="rg-formRow">
            <label className="rg-label">Reason</label>
            <input className="rg-input" value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="why are you changing this?" />
          </div>
          <div className="rg-formRow">
            <label className="rg-label">Entity JSON</label>
            <textarea className="rg-textarea" value={editText} onChange={(e) => setEditText(e.target.value)} />
          </div>
          <div className="rg-modalActions">
            <button className="ar-btn" onClick={commitEdit} type="button">Preview+Submit</button>
            <button className="ar-btn ar-btnGhost" onClick={() => setEditOpen(false)} type="button">Cancel</button>
          </div>
        </div>
      </Modal>

      <Modal open={lifecycleOpen} title="Lifecycle Control — retire-only philosophy" onClose={() => setLifecycleOpen(false)}>
        <div className="rg-modalBody">
          <div className="rg-formRow">
            <label className="rg-label">Next Status</label>
            <select className="rg-select" value={nextLifecycle} onChange={(e) => setNextLifecycle(e.target.value)}>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="retired">retired</option>
            </select>
          </div>
          <div className="rg-formRow">
            <label className="rg-label">Reason</label>
            <input className="rg-input" value={lifecycleReason} onChange={(e) => setLifecycleReason(e.target.value)} placeholder="why change lifecycle?" />
          </div>
          <div className="rg-modalActions">
            <button className="ar-btn" onClick={commitLifecycle} type="button">Apply</button>
            <button className="ar-btn ar-btnGhost" onClick={() => setLifecycleOpen(false)} type="button">Cancel</button>
          </div>
        </div>
      </Modal>

      <Modal open={attestOpen} title="Add Attestation (trust-grade)" onClose={() => setAttestOpen(false)}>
        <div className="rg-modalBody">
          <div className="rg-formRow">
            <label className="rg-label">Who</label>
            <input className="rg-input" value={attestWho} onChange={(e) => setAttestWho(e.target.value)} placeholder="name / role / org" />
          </div>
          <div className="rg-formRow">
            <label className="rg-label">What</label>
            <input className="rg-input" value={attestWhat} onChange={(e) => setAttestWhat(e.target.value)} placeholder="what is being attested?" />
          </div>
          <div className="rg-formRow">
            <label className="rg-label">Why</label>
            <input className="rg-input" value={attestWhy} onChange={(e) => setAttestWhy(e.target.value)} placeholder="why does this matter?" />
          </div>
          <div className="rg-modalActions">
            <button className="ar-btn" onClick={commitAttest} type="button">Add Attestation</button>
            <button className="ar-btn ar-btnGhost" onClick={() => setAttestOpen(false)} type="button">Cancel</button>
          </div>
        </div>
      </Modal>

      <Modal open={eventsOpen} title="Events / Audit Trail (proof log)" onClose={() => setEventsOpen(false)}>
        <div className="rg-modalBody">
          {eventsErr ? (
            <div className="rg-note rg-noteWarn">{eventsErr}</div>
          ) : null}

          {events.length ? (
            <table className="rg-table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>ts</th>
                  <th>action</th>
                  <th>who</th>
                  <th>reason</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, i) => (
                  <tr key={i}>
                    <td className="rg-mono">{String(ev?.ts || ev?.time || "")}</td>
                    <td>{String(ev?.action || ev?.type || "")}</td>
                    <td>{String(ev?.who || ev?.actor || "")}</td>
                    <td>{String(ev?.reason || "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="ar-muted" style={{ marginTop: 10 }}>No events loaded.</div>
          )}

          <div className="rg-modalActions">
            <button className="ar-btn ar-btnGhost" onClick={() => setEventsOpen(false)} type="button">Close</button>
          </div>
        </div>
      </Modal>

      <Modal open={importOpen} title="Import JSON (validate → preview → apply)" onClose={() => setImportOpen(false)}>
        <div className="rg-modalBody">
          <div className="rg-formRow">
            <label className="rg-label">Paste JSON Array</label>
            <textarea className="rg-textarea" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='[{"kind":"app","id":"..."}]' />
          </div>
          <div className="rg-modalActions">
            <button className="ar-btn" onClick={commitImport} type="button">Validate+Apply</button>
            <button className="ar-btn ar-btnGhost" onClick={() => setImportOpen(false)} type="button">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
