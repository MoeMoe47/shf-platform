import React from "react";
import { calculateShsOrchestratorMetrics } from "@/data/orchestrator/shsOrchestratorMetrics";
import {
  analyzeShsOrchestratorRequest,
  applyShsOrchestratorRequestAction,
  createShsOrchestratorRequestFromTemplate,
  getShsOrchestratorPlans,
  getShsOrchestratorRequests,
  getShsOrchestratorTemplates,
  resetShsOrchestratorState,
} from "@/data/orchestrator/shsOrchestratorStorage";
import OrchestratorTemplatePanel from "./components/OrchestratorTemplatePanel";
import OrchestratorRequestList from "./components/OrchestratorRequestList";
import OrchestratorPlanDetail from "./components/OrchestratorPlanDetail";
import OrchestratorReadinessPanel from "./components/OrchestratorReadinessPanel";
import OrchestratorSafetyPanel from "./components/OrchestratorSafetyPanel";
import OrchestratorLayerMap from "./components/OrchestratorLayerMap";
import OrchestratorNextActions from "./components/OrchestratorNextActions";
import "./shsSystemOrchestrator.css";

export default function ShsSystemOrchestratorPage() {
  const templates = React.useMemo(() => getShsOrchestratorTemplates(), []);
  const [requests, setRequests] = React.useState(() => getShsOrchestratorRequests());
  const [plans, setPlans] = React.useState(() => getShsOrchestratorPlans());
  const [selectedTemplateId, setSelectedTemplateId] = React.useState(templates[0]?.orchestration_template_id || "");
  const [selectedRequestId, setSelectedRequestId] = React.useState(() => getShsOrchestratorRequests()[0]?.orchestration_request_id || "");
  const [note, setNote] = React.useState("");

  const selectedRequest = requests.find((request) => request.orchestration_request_id === selectedRequestId) || requests[0] || null;
  const selectedPlan = plans.find((plan) => plan.orchestration_request_id === selectedRequest?.orchestration_request_id) || plans[0] || null;
  const metrics = React.useMemo(() => calculateShsOrchestratorMetrics(requests, plans, templates), [requests, plans, templates]);

  function refresh(next = {}) {
    const nextRequests = next.requests || getShsOrchestratorRequests();
    const nextPlans = next.plans || getShsOrchestratorPlans();
    setRequests(nextRequests);
    setPlans(nextPlans);
    if (next.createdRequest) setSelectedRequestId(next.createdRequest.orchestration_request_id);
    if (!nextRequests.find((request) => request.orchestration_request_id === selectedRequestId)) {
      setSelectedRequestId(nextRequests[0]?.orchestration_request_id || "");
    }
  }

  function handleCreateRequest(templateId) {
    refresh(createShsOrchestratorRequestFromTemplate(templateId));
  }

  function handleAnalyze(requestId) {
    if (!requestId) return;
    refresh(analyzeShsOrchestratorRequest(requestId));
  }

  function handleAction(action) {
    if (!selectedRequest) return;
    refresh(applyShsOrchestratorRequestAction(selectedRequest.orchestration_request_id, action, note));
    if (action === "note") setNote("");
  }

  function handleReset() {
    refresh(resetShsOrchestratorState());
  }

  return (
    <main className="shs-orchestrator-page">
      <section className="orch-hero">
        <div>
          <p>SHS System Orchestrator V1</p>
          <h1>Unified SHS Control Plane</h1>
          <span>Coordinates V1 systems, agents, proofs, reports, workflows, and governance gates without executing dangerous actions.</span>
        </div>
        <button type="button" onClick={handleReset}>Load Sample Orchestrations</button>
      </section>

      <section className="orch-metrics" aria-label="Orchestrator metrics">
        <article><span>Templates</span><strong>{metrics.template_count}</strong></article>
        <article><span>Requests</span><strong>{metrics.request_count}</strong></article>
        <article><span>Plans</span><strong>{metrics.plan_count}</strong></article>
        <article><span>Avg Readiness</span><strong>{metrics.average_readiness_score}%</strong></article>
      </section>

      <section className="orch-layout">
        <div className="orch-main">
          <OrchestratorTemplatePanel
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={setSelectedTemplateId}
            onCreateRequest={handleCreateRequest}
          />
          <OrchestratorRequestList
            requests={requests}
            selectedRequestId={selectedRequest?.orchestration_request_id}
            onSelectRequest={setSelectedRequestId}
            onAnalyze={handleAnalyze}
            onAction={handleAction}
          />
          <OrchestratorPlanDetail plan={selectedPlan} />
          <OrchestratorLayerMap plan={selectedPlan} />
        </div>
        <aside className="orch-side">
          <OrchestratorReadinessPanel plan={selectedPlan} />
          <OrchestratorSafetyPanel plan={selectedPlan} />
          <OrchestratorNextActions
            plan={selectedPlan}
            note={note}
            onNoteChange={setNote}
            onAddNote={() => handleAction("note")}
          />
        </aside>
      </section>
    </main>
  );
}
