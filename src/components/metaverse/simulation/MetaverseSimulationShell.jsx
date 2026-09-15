import React from "react";
import {
  completeSimulationSession,
  getSimulation,
  recordSimulationStep,
  retrySimulationSession,
  startSimulationSession,
  submitSimulationArtifact,
} from "@/system/metaverse/metaverseSimulationClient.js";
import SimulationObjective from "./SimulationObjective.jsx";
import SimulationStepProgress from "./SimulationStepProgress.jsx";
import SimulationTaskPanel from "./SimulationTaskPanel.jsx";
import SimulationEvidencePanel from "./SimulationEvidencePanel.jsx";
import SimulationRetryState from "./SimulationRetryState.jsx";
import SimulationTeamPanel from "./SimulationTeamPanel.jsx";
import SimulationAccessibleAlternative from "./SimulationAccessibleAlternative.jsx";

// MET-13 §35/§36 — one reusable simulation experience shell, driven
// entirely by the server's own simulation definition + session state.
// No simulation gets a bespoke page; the district-specific content is
// all server data (task steps, objective, evidence boundary), not
// per-simulation React code.
export default function MetaverseSimulationShell({ activity, facility, district, decision, onExit }) {
  const simulationId = activity?.id;
  const [state, setState] = React.useState({ loading: true, error: null, simulation: null, canEnter: false, evidenceBoundary: null });
  const [session, setSession] = React.useState(null);
  const [response, setResponse] = React.useState("");
  const [teamIdInput, setTeamIdInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [stepError, setStepError] = React.useState(null);
  const [teamError, setTeamError] = React.useState(null);
  const [retryError, setRetryError] = React.useState(null);
  const [artifacts, setArtifacts] = React.useState([]);
  const [completed, setCompleted] = React.useState(null);

  React.useEffect(() => {
    if (!simulationId) return;
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    getSimulation(simulationId)
      .then((result) => {
        if (cancelled) return;
        setState({ loading: false, error: null, simulation: result.simulation, canEnter: result.can_enter, evidenceBoundary: result.evidence_boundary });
        if (result.session) setSession(result.session);
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ loading: false, error: error.message || "Could not load this simulation.", simulation: null, canEnter: false, evidenceBoundary: null });
      });
    return () => { cancelled = true; };
  }, [simulationId]);

  const handleStart = React.useCallback(async () => {
    setBusy(true);
    setTeamError(null);
    try {
      const result = await startSimulationSession(simulationId, teamIdInput ? { team_session_ref: teamIdInput } : {});
      setSession(result.session);
    } catch (error) {
      if (error.code === "TEAM_MEMBERSHIP_REQUIRED") setTeamError(error.message);
      else setState((prev) => ({ ...prev, error: error.message }));
    } finally {
      setBusy(false);
    }
  }, [simulationId, teamIdInput]);

  const currentStep = React.useMemo(() => {
    if (!state.simulation || !session) return null;
    return (state.simulation.taskSteps || [])[session.currentStepIndex] || null;
  }, [state.simulation, session]);

  const handleSubmitStep = React.useCallback(async () => {
    if (!currentStep) return;
    setBusy(true);
    setStepError(null);
    try {
      const result = await recordSimulationStep(simulationId, session.sessionId, { step_id: currentStep.stepId, response });
      setSession(result.session);
      setResponse("");
    } catch (error) {
      setStepError(error.message || "Could not record this step.");
    } finally {
      setBusy(false);
    }
  }, [currentStep, response, session, simulationId]);

  const handleRetry = React.useCallback(async () => {
    setBusy(true);
    setRetryError(null);
    try {
      const result = await retrySimulationSession(simulationId, session.sessionId);
      setSession(result.session);
      setArtifacts([]);
    } catch (error) {
      setRetryError(error.message || "Could not restart this attempt.");
    } finally {
      setBusy(false);
    }
  }, [session, simulationId]);

  const handleSubmitArtifact = React.useCallback(async () => {
    setBusy(true);
    try {
      const result = await submitSimulationArtifact(simulationId, session.sessionId, { artifact_type: "TEXT_REFLECTION", content: { text: response || "Submitted from the metaverse simulation shell." } });
      setArtifacts((prev) => [...prev, result.artifact]);
    } catch (error) {
      setStepError(error.message || "Could not submit the artifact.");
    } finally {
      setBusy(false);
    }
  }, [response, session, simulationId]);

  const handleComplete = React.useCallback(async () => {
    setBusy(true);
    setStepError(null);
    try {
      const result = await completeSimulationSession(simulationId, session.sessionId);
      setSession(result.session);
      setCompleted(result);
    } catch (error) {
      setStepError(error.message || "Not every requirement for completion has been met yet.");
    } finally {
      setBusy(false);
    }
  }, [session, simulationId]);

  if (state.loading) {
    return (
      <section className="met-activity met-simulation" aria-label="Loading simulation" aria-busy="true">
        <p>Loading simulation…</p>
      </section>
    );
  }

  if (state.error || !state.simulation) {
    return (
      <section className="met-activity met-simulation" aria-label="Simulation unavailable">
        <p className="met-kicker">Protected simulation</p>
        <h2>{activity?.label || "Simulation unavailable"}</h2>
        <p role="alert">{state.error || "This simulation could not be loaded."}</p>
        <button type="button" onClick={onExit}>Exit</button>
      </section>
    );
  }

  const simulation = state.simulation;
  const requiresArtifact = Boolean(simulation.completionRules?.requiresArtifactSubmission);
  const allRequiredStepsDone = session
    ? (simulation.taskSteps || []).filter((step) => !step.isOptional).every((step) => (session.completedStepIds || []).includes(step.stepId))
    : false;

  return (
    <section className="met-activity met-simulation" aria-label={`Protected simulation: ${simulation.title}`}>
      <div className="met-activity__head">
        <div>
          <SimulationObjective simulation={simulation} />
          <p>{facility?.label} · {district?.label}</p>
        </div>
        <button type="button" onClick={onExit}>Exit simulation</button>
      </div>

      {!state.canEnter ? (
        <p role="alert">{decision?.reason_text || "This simulation is not available yet."}</p>
      ) : !session ? (
        <div className="met-simulation__start">
          <SimulationTeamPanel teamMode={simulation.teamMode} teamSessionRef={null} teamIdInput={teamIdInput} onTeamIdChange={setTeamIdInput} error={teamError} />
          <button type="button" onClick={handleStart} disabled={busy}>{busy ? "Starting…" : "Start simulation"}</button>
        </div>
      ) : session.status === "COMPLETED" ? (
        <div className="met-simulation__complete">
          <p><strong>This attempt is complete.</strong> {completed ? "No verified skill, credential, course completion, career eligibility, or civic authority was created by this completion." : ""}</p>
          <SimulationEvidencePanel evidenceBoundary={state.evidenceBoundary} artifacts={artifacts} artifactRequired={false} />
          <SimulationRetryState retryPolicy={simulation.retryPolicy} retryCount={session.retryCount} onRetry={handleRetry} retrying={busy} retryError={retryError} />
        </div>
      ) : (
        <div className="met-simulation__active">
          <SimulationTeamPanel teamMode={simulation.teamMode} teamSessionRef={session.teamSessionRef} teamIdInput={teamIdInput} onTeamIdChange={setTeamIdInput} error={teamError} />
          <SimulationStepProgress taskSteps={simulation.taskSteps} completedStepIds={session.completedStepIds} />
          <SimulationTaskPanel currentStep={currentStep} response={response} onResponseChange={setResponse} onSubmitStep={handleSubmitStep} submitting={busy} error={stepError} />
          <SimulationEvidencePanel evidenceBoundary={state.evidenceBoundary} artifacts={artifacts} onSubmitArtifact={handleSubmitArtifact} artifactRequired={requiresArtifact} />
          {allRequiredStepsDone ? (
            <button type="button" onClick={handleComplete} disabled={busy || (requiresArtifact && !artifacts.length)}>
              {busy ? "Completing…" : "Complete simulation"}
            </button>
          ) : null}
          <SimulationRetryState retryPolicy={simulation.retryPolicy} retryCount={session.retryCount} onRetry={handleRetry} retrying={busy} retryError={retryError} />
        </div>
      )}

      <SimulationAccessibleAlternative accessibleAlternative={simulation.accessibleAlternative} />
      <p className="met-activity__decision">{decision?.reason_text}</p>
    </section>
  );
}
