// src/components/curriculum/lesson/GuidedLessonExperience.jsx
//
// SHF Student Lesson Guided Experience — Phase 1 (desktop). Orchestrates
// the approved-mock guided flow (Orient -> Check-In -> Learn ->
// Vocabulary -> Check -> Practice -> Arcade -> Apply -> Assess -> Reflect
// -> Evidence -> Career -> Complete) for the canonical, real student
// lesson content loaded by src/content/lessons/studentLoader.js and
// mounted at /curriculum/lessons/:slug (src/pages/StudentUnit.jsx).
//
// This intentionally does NOT reuse <LessonBody/> as a wrapper: LessonBody
// (and its exact "Pending sync"/"Synchronized"/"Preview only..." strings)
// is pinned by tests/curriculumLessonCompletionSurface.test.mjs to the
// separate, legacy /curriculum/lesson/:id localStorage-backed preview
// route (src/pages/curriculum/Lesson.jsx) and is left completely
// untouched. What IS reused here, unmodified, are the real interactive
// primitives LessonBody itself used: <AssessmentRenderer/>,
// <VocabularyReview/>, <MediaRow/>, and progressClient's
// markLessonComplete (via CompletionCheckPanel) — so grading, persistence,
// and progress-event wiring are byte-identical to before, just presented
// through the new guided shell.
//
// Stage availability and content are derived from the real lesson object
// only (src/utils/lessonGuidedStages.js) — no fabricated activity,
// instructor, due date, or completion percentage.
import React from "react";
import { Link } from "react-router-dom";
import MediaRow from "@/components/ui/MediaRow.jsx";
import normalizeLessonMedia from "@/utils/normalizeLessonMedia.js";
import validateLessonAccessibility from "@/utils/validateLessonAccessibility.js";
import AssessmentRenderer from "@/components/lessons/AssessmentRenderer.jsx";
import VocabularyReview from "@/components/lessons/VocabularyReview.jsx";
import { useUser } from "@/context/UserContext.jsx";
import { useRewards } from "@/hooks/useRewards.js";
import { buildGuidedStages, splitAssessment, firstAvailableStage, STAGE_LABELS } from "@/utils/lessonGuidedStages.js";

import LessonHeader from "./LessonHeader.jsx";
import LessonStageRail from "./LessonStageRail.jsx";
import RequirementsPanel from "./RequirementsPanel.jsx";
import EvidencePanel from "./EvidencePanel.jsx";
import CareerConnectionPanel from "./CareerConnectionPanel.jsx";
import ArcadeMissionCard from "./ArcadeMissionCard.jsx";
import CompletionCheckPanel from "./CompletionCheckPanel.jsx";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SparkleIcon,
  ClipboardIcon,
  BookIcon,
  TagIcon,
  TargetIcon,
  PlayIcon,
  LayersIcon,
  ChatBubbleIcon,
  BriefcaseIcon,
  CheckCircleIcon,
} from "@/components/curriculum/icons.jsx";

const STAGE_DESCRIPTIONS = {
  orient: "Get oriented before you start.",
  checkin: "A quick check-in before this lesson.",
  learn: "Read through the instructional content.",
  vocabulary: "Review this lesson's key terms.",
  check: "Answer a short knowledge check.",
  practice: "Apply what you're learning.",
  arcade: "Apply what you learned in a game.",
  apply: "Connect this lesson to your Portfolio.",
  assess: "Review the assessment rubric.",
  reflect: "Reflect on what you practiced.",
  evidence: "See your progress for this lesson.",
  career: "See how this connects to careers.",
  complete: "Wrap up and continue.",
};

// Fidelity-correction pass (2026-08-27): "Coming up next" previously
// repeated the same orange clipboard icon for every card regardless of
// stage — this gives each stage its own real, stage-appropriate icon.
const STAGE_ICONS = {
  orient: SparkleIcon,
  checkin: ChatBubbleIcon,
  learn: BookIcon,
  vocabulary: TagIcon,
  check: ClipboardIcon,
  practice: TargetIcon,
  arcade: PlayIcon,
  apply: LayersIcon,
  assess: ClipboardIcon,
  reflect: ChatBubbleIcon,
  evidence: ClipboardIcon,
  career: BriefcaseIcon,
  complete: CheckCircleIcon,
};

function SectionBlock({ section }) {
  const [showMicroCheck, setShowMicroCheck] = React.useState(false);
  const media = section.media ? normalizeLessonMedia(section.media) : null;

  return (
    <div className="ld-sectionBlock">
      <h3 className="ld-sectionHeading">{section.heading || "Section"}</h3>
      {media && <MediaRow media={media} ratio="16:9" />}
      {typeof section.body === "string" && (
        <p className="ld-sectionBody">{section.body.replace(/\*\*/g, "")}</p>
      )}
      {section.microCheck?.question && (
        <div className="ld-microCheck">
          <p className="ld-microCheckQ">Quick check: {section.microCheck.question}</p>
          {!showMicroCheck ? (
            <button type="button" className="ld-btnGhost ld-btnSm" onClick={() => setShowMicroCheck(true)}>
              Show answer
            </button>
          ) : (
            <p className="ld-microCheckAnswer">{section.microCheck.answer}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function GuidedLessonExperience({ lesson, curriculum, nextHref }) {
  const { email } = useUser();
  const { addPoints } = useRewards();
  const actorId = email || "local-student";

  const stages = React.useMemo(() => buildGuidedStages(lesson), [lesson]);
  const availableStages = React.useMemo(() => stages.filter((s) => s.available), [stages]);
  const { check: checkAssessment, reflect: reflectAssessment } = React.useMemo(() => splitAssessment(lesson), [lesson]);

  const initialStage = React.useMemo(() => firstAvailableStage(availableStages), [availableStages]);
  const [activeKey, setActiveKey] = React.useState(initialStage);
  const [maxIndexReached, setMaxIndexReached] = React.useState(0);

  React.useEffect(() => {
    if (!lesson || !import.meta.env?.DEV) return;
    const warnings = validateLessonAccessibility(lesson);
    if (warnings.length) {
      console.warn(`[GuidedLessonExperience] accessibility check found ${warnings.length} issue(s) in "${lesson.title || lesson.slug}":`, warnings);
    }
  }, [lesson]);

  const activeIndex = Math.max(0, availableStages.findIndex((s) => s.key === activeKey));
  const isFirst = activeIndex <= 0;
  const isLast = activeIndex >= availableStages.length - 1;

  function goToStage(key) {
    const idx = availableStages.findIndex((s) => s.key === key);
    if (idx < 0) return;
    setActiveKey(key);
    setMaxIndexReached((m) => Math.max(m, idx));
  }

  function handlePrevious() {
    if (isFirst) return;
    goToStage(availableStages[activeIndex - 1].key);
  }

  function handleContinue() {
    if (isLast) return;
    goToStage(availableStages[activeIndex + 1].key);
  }

  const completedKeys = new Set(availableStages.filter((_, i) => i < maxIndexReached).map((s) => s.key));

  const upNext = availableStages.slice(activeIndex + 1, activeIndex + 5);

  // Real, derived "what's ahead" counts for the Orient stage — never a
  // fabricated estimate, just how many real items each later stage has.
  const vocabCount = (lesson?.vocab || []).length;
  const arcadeCount = (lesson?.games || []).length || (lesson?.arcade?.suggestedGames || []).length;
  const checkCount = checkAssessment?.items?.length || 0;
  const hasReflect = !!reflectAssessment;

  if (!lesson) return null;

  return (
    <div className="ld-lessonPage">
      <LessonHeader
        lesson={lesson}
        curriculum={curriculum}
        completedCount={completedKeys.size}
        availableCount={availableStages.length}
      />

      <div className="ld-card ld-stageRailCard">
        <LessonStageRail
          stages={availableStages}
          activeKey={activeKey}
          completedKeys={completedKeys}
          onSelect={goToStage}
          panelId="lesson-stage-panel"
        />
      </div>

      <div className="ld-lessonGrid">
        <section id="lesson-stage-panel" role="tabpanel" aria-labelledby={`lesson-stage-tab-${activeKey}`} className="ld-card ld-workspace">
          <h2 className="ld-workspaceTitle">{STAGE_LABELS[activeKey]}</h2>

          {activeKey === "orient" && (
            <>
              {lesson.summary && (
                <div className="ld-workspaceSection">
                  <div className="ld-workspaceSectionHead">
                    <SparkleIcon size={14} /> Why this matters
                  </div>
                  <div className="ld-whyMattersCard">{lesson.summary}</div>
                </div>
              )}

              <div className="ld-workspaceSection">
                <div className="ld-workspaceSectionHead">
                  <BookIcon size={14} /> Key ideas you'll learn
                </div>
                {Array.isArray(lesson.objectives) && lesson.objectives.length > 0 ? (
                  <ul className="ld-objectiveList">
                    {lesson.objectives.map((o, i) => (
                      <li key={i}>
                        <SparkleIcon size={15} /> {o}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="ld-workspaceEmpty">No objectives listed for this lesson.</p>
                )}
              </div>

              {(vocabCount > 0 || checkCount > 0 || arcadeCount > 0 || hasReflect) && (
                <div className="ld-workspaceSection">
                  <div className="ld-workspaceSectionHead">What's ahead in this lesson</div>
                  <div className="ld-statRow">
                    {vocabCount > 0 && (
                      <div className="ld-stat">
                        <TagIcon size={18} className="ld-statIcon" />
                        <span className="ld-statValue">{vocabCount}</span>
                        <span className="ld-statLabel">Vocabulary terms</span>
                      </div>
                    )}
                    {checkCount > 0 && (
                      <div className="ld-stat">
                        <ClipboardIcon size={18} className="ld-statIcon" />
                        <span className="ld-statValue">{checkCount}</span>
                        <span className="ld-statLabel">Check questions</span>
                      </div>
                    )}
                    {arcadeCount > 0 && (
                      <div className="ld-stat">
                        <PlayIcon size={18} className="ld-statIcon" />
                        <span className="ld-statValue">{arcadeCount}</span>
                        <span className="ld-statLabel">Arcade missions</span>
                      </div>
                    )}
                    {hasReflect && (
                      <div className="ld-stat">
                        <ChatBubbleIcon size={18} className="ld-statIcon" />
                        <span className="ld-statValue">✓</span>
                        <span className="ld-statLabel">Reflection</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeKey === "learn" && (
            <div>
              {(lesson.sections || []).map((s, i) => (
                <SectionBlock key={i} section={s} />
              ))}
            </div>
          )}

          {activeKey === "vocabulary" && (
            <VocabularyStage lesson={lesson} curriculum={curriculum} actorId={actorId} />
          )}

          {activeKey === "check" && checkAssessment && (
            <AssessmentRenderer
              assessment={checkAssessment}
              curriculum={curriculum}
              slug={lesson.slug || lesson.id}
              actorId={actorId}
            />
          )}

          {activeKey === "practice" && (
            <p className="ld-workspaceEmpty">Practice activities for this lesson will appear here once available.</p>
          )}

          {activeKey === "arcade" && (
            <ArcadeMissionCard games={lesson.games} suggestedGames={lesson?.arcade?.suggestedGames} />
          )}

          {activeKey === "apply" && (
            <div className="ld-applyCard">
              {lesson.proofActivity ? (
                <ProofActivity activity={lesson.proofActivity} />
              ) : (
                <>
              {lesson.project?.title && <h3>{lesson.project.title}</h3>}
              {Array.isArray(lesson.project?.submissionOptions) && lesson.project.submissionOptions.length > 0 && (
                <>
                  <p>Choose an accessible way to show your work:</p>
                  <ul>
                    {lesson.project.submissionOptions.map((option) => <li key={option}>{option}</li>)}
                  </ul>
                </>
              )}
              <p>
                {lesson.portfolioArtifact
                  ? lesson.portfolioArtifact
                  : "This lesson counts toward your Portfolio."}
              </p>
              <Link className="ld-btnGhost" style={{ marginTop: 12 }} to="/curriculum/asl/portfolio">
                Go to Portfolio
              </Link>
                </>
              )}
            </div>
          )}

          {activeKey === "assess" && Array.isArray(lesson?.rubric?.criteria) && (
            <div className="ld-rubricGrid">
              {lesson.rubric.criteria.map((c, i) => (
                <div className="ld-rubricRow" key={i}>
                  <p className="ld-rubricSkill">{c.skill}</p>
                  <ul className="ld-rubricLevels">
                    {(c.levels || []).map((lvl, j) => <li key={j}>{lvl}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeKey === "reflect" && reflectAssessment && (
            <AssessmentRenderer
              assessment={reflectAssessment}
              curriculum={curriculum}
              slug={lesson.slug || lesson.id}
              actorId={actorId}
            />
          )}

          {activeKey === "evidence" && (
            <EvidencePanel
              lesson={lesson}
              curriculum={curriculum}
              slug={lesson.slug || lesson.id}
              actorId={actorId}
              checkItemCount={checkAssessment?.items?.length || 0}
              reflectItems={reflectAssessment?.items || []}
              vocabCount={(lesson.vocab || []).length}
            />
          )}

          {activeKey === "career" && <CareerConnectionPanel />}

          {activeKey === "complete" && (
            <div>
              <p className="ld-workspaceLede">
                You've reached the end of the guided stages for this lesson. Use Completion Check below when
                you're ready to mark it complete.
              </p>
              {nextHref && (
                <Link className="ld-btn ld-btnPrimary" to={nextHref}>
                  Go to next lesson <ChevronRightIcon size={16} />
                </Link>
              )}
            </div>
          )}

          {activeKey === "checkin" && (
            <p className="ld-workspaceEmpty">No check-in activity is available for this lesson yet.</p>
          )}

          <div className="ld-navRow">
            <button type="button" className="ld-btnGhost" onClick={handlePrevious} disabled={isFirst}>
              <ChevronLeftIcon size={16} /> Previous
            </button>
            {!isLast && (
              <button type="button" className="ld-btn ld-btnPrimary" onClick={handleContinue}>
                Continue <ChevronRightIcon size={16} />
              </button>
            )}
          </div>
        </section>

        <div className="ld-lessonSide">
          <RequirementsPanel />
          <EvidencePanel
            lesson={lesson}
            curriculum={curriculum}
            slug={lesson.slug || lesson.id}
            actorId={actorId}
            checkItemCount={checkAssessment?.items?.length || 0}
            reflectItems={reflectAssessment?.items || []}
            vocabCount={(lesson.vocab || []).length}
          />
          <CareerConnectionPanel />
        </div>
      </div>

      {upNext.length > 0 && (
        <div className="ld-upNextGrid">
          {upNext.map((s) => {
            const StageIcon = STAGE_ICONS[s.key] || ClipboardIcon;
            return (
              <button type="button" className="ld-card ld-upNextCard" key={s.key} onClick={() => goToStage(s.key)}>
                <div className="ld-upNextTop">
                  <span className="ld-upNextIcon" aria-hidden="true">
                    <StageIcon size={16} />
                  </span>
                  <div>
                    <p className="ld-upNextEyebrow">Coming up next</p>
                    <p className="ld-upNextLabel">{s.label}</p>
                  </div>
                </div>
                <p className="ld-upNextDesc">{STAGE_DESCRIPTIONS[s.key]}</p>
              </button>
            );
          })}
        </div>
      )}

      <CompletionCheckPanel lesson={lesson} curriculum={curriculum} actorId={actorId} addPoints={addPoints} />
    </div>
  );
}

function VocabularyStage({ lesson, curriculum, actorId }) {
  const [showReview, setShowReview] = React.useState(false);
  const vocab = lesson.vocab || [];

  return (
    <div>
      <div className="ld-vocabPillRow">
        {vocab.map((v, i) => (
          <span className="ld-lessonPill" key={i}>{v.term}</span>
        ))}
      </div>
      <ul className="ld-vocabList">
        {vocab.map((v, i) => (
          <li key={i}><span className="ld-vocabTerm">{v.term}</span> — {v.def}</li>
        ))}
      </ul>
      <button type="button" className="ld-btnGhost" style={{ marginTop: 14 }} onClick={() => setShowReview((v) => !v)}>
        {showReview ? "Hide vocabulary review" : "Review vocabulary one at a time"}
      </button>
      {showReview && (
        <div style={{ marginTop: 14 }}>
          <VocabularyReview
            vocab={vocab}
            curriculum={curriculum}
            slug={lesson.slug || lesson.id}
            actorId={actorId}
            onClose={() => setShowReview(false)}
          />
        </div>
      )}
    </div>
  );
}

function ProofActivity({ activity }) {
  const monitoringData = Array.isArray(activity?.monitoringData) && activity.monitoringData.length > 0
    ? activity.monitoringData
    : [
      { signal: "Service state", value: "degraded", status: "review", detail: "Synthetic signal for evidence-based analysis." },
      { signal: "Storage pressure", value: "elevated", status: "review", detail: "Synthetic signal; root cause remains uncertain." },
    ];
  const [form, setForm] = React.useState({ observations: "", affectedSystem: "", uncertainty: "", safeNextStep: "" });
  const [status, setStatus] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const loadStatus = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/prepare-prove/proof-status?activity_id=${encodeURIComponent(activity.activityId)}`, { credentials: "include", cache: "no-store" });
      if (!response.ok) return;
      const body = await response.json();
      if (body?.ok) setStatus(body.data);
    } catch { /* The submit path reports a concrete error. */ }
  }, []);
  React.useEffect(() => { loadStatus(); }, [loadStatus]);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const headers = { "Content-Type": "application/json" };
      const resultResponse = await fetch("/api/prepare-prove/activity-results", {
        method: "POST", credentials: "include", headers,
        body: JSON.stringify({ result: {
          observations: form.observations.split("\n").map((value) => value.trim()).filter(Boolean),
          activity_id: activity.activityId,
          affected_system: form.affectedSystem,
          uncertainty: form.uncertainty,
          safe_next_step: form.safeNextStep,
        } }),
      });
      if (!resultResponse.ok) throw new Error("The proof result could not be recorded.");
      const resultBody = await resultResponse.json();
      const evidenceResponse = await fetch("/api/prepare-prove/evidence", {
        method: "POST", credentials: "include", headers,
        body: JSON.stringify({ source_result_id: resultBody.data.result_id, criterion: activity.criterion || "safe-finding" }),
      });
      if (!evidenceResponse.ok) throw new Error("The evidence record could not be created.");
      await loadStatus();
    } catch (submitError) {
      setError(submitError?.message || "The proof could not be submitted.");
    } finally { setBusy(false); }
  }
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const decision = status?.decision;
  return (
    <div data-testid="prepare-prove-proof-activity">
      <h3>Prove: document a safe finding</h3>
      <p>Use the synthetic monitoring snapshot to record facts, uncertainty, and a safe next step. This activity is simulation only.</p>
      <div className="ld-proofTableWrap">
        <table className="ld-proofTable">
          <caption className="sr-only">Synthetic monitoring data</caption>
          <thead><tr><th scope="col">Signal</th><th scope="col">Value</th><th scope="col">Status</th><th scope="col">Detail</th></tr></thead>
          <tbody>{monitoringData.map((row) => <tr key={row.signal}><th scope="row">{row.signal}</th><td>{row.value}</td><td>{row.status}</td><td>{row.detail}</td></tr>)}</tbody>
        </table>
      </div>
      <form onSubmit={submit} className="ld-proofForm">
        <label>Observations (one fact per line)<textarea required value={form.observations} onChange={update("observations")} /></label>
        <label>Affected system hypothesis<input required value={form.affectedSystem} onChange={update("affectedSystem")} /></label>
        <label>What remains uncertain?<textarea required value={form.uncertainty} onChange={update("uncertainty")} /></label>
        <label>Safe next step or escalation<textarea required value={form.safeNextStep} onChange={update("safeNextStep")} /></label>
        <button type="submit" className="ld-btn ld-btnPrimary" disabled={busy}>{busy ? "Submitting…" : "Submit evidence for review"}</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <div role="status" aria-live="polite" data-testid="prepare-prove-proof-status">
        {!status?.evidence && <p>Evidence status: Not submitted</p>}
        {status?.evidence && !decision && <p>Evidence status: Evidence submitted, pending review.</p>}
        {decision && <p>Review status: {decision.decision === "DEMONSTRATED" ? "Criteria demonstrated" : decision.decision === "EVIDENCE_INSUFFICIENT" ? "Evidence insufficient" : "Review needs follow-up"}. Criteria version {decision.criteria_version}.</p>}
      </div>
    </div>
  );
}
