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
import VocabularyReview from "@/components/lessons/VocabularyReview.jsx";
import { useUser } from "@/context/UserContext.jsx";
import { useRewards } from "@/hooks/useRewards.js";
import { buildGuidedStages, splitAssessment, firstAvailableStage, STAGE_LABELS } from "@/utils/lessonGuidedStages.js";

import LessonHeader from "./LessonHeader.jsx";
import LessonStageRail from "./LessonStageRail.jsx";
import ArcadeMissionCard from "./ArcadeMissionCard.jsx";
import CompletionCheckPanel from "./CompletionCheckPanel.jsx";
import { AssessmentActivity, PracticeActivity, ReflectionActivity } from "./CanonicalActivityPanel.jsx";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleIcon,
  ClockIcon,
  SparkleIcon,
  ClipboardIcon,
  BookIcon,
  TagIcon,
  TargetIcon,
  PlayIcon,
  LayersIcon,
  ChatBubbleIcon,
  CheckCircleIcon,
  HeadsetIcon,
  VideoIcon,
} from "@/components/curriculum/icons.jsx";

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

function buildContentNavItems(lesson, availableStages) {
  const items = [];
  const done = "done";
  const current = "current";
  const upcoming = "upcoming";
  const add = (id, label, meta, status = upcoming, icon = BookIcon, children = []) => {
    items.push({ id, label, meta, status, icon, children });
  };

  if (availableStages.some((s) => s.key === "orient")) {
    add("orient", "Lesson orientation", "Objectives and overview", done, SparkleIcon);
  }
  if (Array.isArray(lesson.sections) && lesson.sections.length > 0) {
    add(
      "learn",
      "Instructional content",
      `${lesson.sections.length} section${lesson.sections.length === 1 ? "" : "s"}`,
      current,
      BookIcon,
      lesson.sections.map((section, index) => ({
        id: `section-${index}`,
        label: section.heading || `Section ${index + 1}`,
        meta: section.media ? "Media included" : section.microCheck ? "Quick check" : "Reading",
        status: index === 0 ? current : upcoming,
        icon: section.media ? VideoIcon : BookIcon,
      })),
    );
  }
  if (Array.isArray(lesson.vocab) && lesson.vocab.length > 0) {
    add("vocabulary", "Vocabulary", `${lesson.vocab.length} terms`, upcoming, TagIcon);
  }
  if (availableStages.some((s) => s.key === "check")) {
    add("check", "Check Understanding", "Knowledge check", upcoming, ClipboardIcon);
  }
  if (Array.isArray(lesson.practice) && lesson.practice.length > 0) {
    add("practice", "Practice", `${lesson.practice.length} activity`, upcoming, TargetIcon);
  }
  if ((lesson.games || []).length || (lesson?.arcade?.suggestedGames || []).length) {
    add("arcade", "Arcade", "Linked mission", upcoming, PlayIcon);
  }
  if (lesson.portfolioFlag || lesson.portfolioArtifact || lesson.project || lesson.proofActivity) {
    add("apply", "Apply", "Portfolio activity", upcoming, LayersIcon);
  }
  if (availableStages.some((s) => s.key === "reflect")) {
    add("reflect", "Reflect", "Private reflection", upcoming, ChatBubbleIcon);
  }
  add("complete", "Completion Check", "Backend confirmation", upcoming, CheckCircleIcon);
  return items;
}

function ContentNavigator({ items, onSelectStage }) {
  const [openGroups, setOpenGroups] = React.useState(() => new Set(["learn"]));

  function toggle(id) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <aside className="ld-card ld-contentNav" aria-label="Lesson content">
      <div className="ld-contentNavHead">
        <h2>Lesson Content</h2>
        <span>{items.length} groups</span>
      </div>
      <div className="ld-contentNavList">
        {items.map((item, index) => {
          const Icon = item.icon || BookIcon;
          const isOpen = openGroups.has(item.id);
          const hasChildren = item.children?.length > 0;
          return (
            <div className={`ld-contentNavGroup is-${item.status}`} key={item.id}>
              <button
                type="button"
                className="ld-contentNavButton"
                aria-expanded={hasChildren ? isOpen : undefined}
                onClick={() => {
                  if (hasChildren) toggle(item.id);
                  if (onSelectStage && item.id !== "learn") onSelectStage(item.id);
                }}
              >
                <span className="ld-contentNavState" aria-hidden="true">
                  {item.status === "done" ? <CheckCircleIcon size={15} /> : item.status === "current" ? <CircleIcon size={15} /> : <CircleIcon size={15} />}
                </span>
                <span className="ld-contentNavText">
                  <strong>{index + 1}. {item.label}</strong>
                  <small>{item.meta}</small>
                </span>
                <Icon size={15} className="ld-contentNavIcon" />
              </button>
              {hasChildren && isOpen && (
                <div className="ld-contentNavChildren">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon || BookIcon;
                    return (
                      <button type="button" className={`ld-contentNavChild is-${child.status}`} key={child.id} onClick={() => onSelectStage?.("learn")}>
                        <ChildIcon size={13} />
                        <span>{child.label}</span>
                        <small>{child.meta}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="ld-contentHelp">
        <HeadsetIcon size={22} />
        <div>
          <p>Need Help?</p>
          <span>Join a live session or get help from your instructor.</span>
          <Link className="ld-btnGhost ld-btnSm" to="/curriculum/live-sessions">View Live Sessions</Link>
        </div>
      </div>
    </aside>
  );
}

function ContextRail({ lesson, curriculum, completedCount, availableCount, nextHref, resources }) {
  const pct = availableCount > 0 ? Math.round((completedCount / availableCount) * 100) : 0;
  const curriculumName = String(curriculum || lesson.curriculum || "Curriculum").replace(/-/g, " ");
  return (
    <aside className="ld-contextRail" aria-label="Lesson context">
      <section className="ld-card ld-panelCard ld-progressPanel">
        <div className="ld-panelTitleRow">
          <h2 className="ld-panelTitle">Lesson Progress</h2>
        </div>
        <div className="ld-progressPanelBody">
          <div className="ld-progressRing" style={{ "--progress": `${pct}%` }} aria-label={`Lesson progress ${pct}%`}>
            <span>{pct}%</span>
          </div>
          <div>
            <p className="ld-progressPanelLabel">Overall Progress</p>
            <p className="ld-progressPanelValue">{completedCount} of {availableCount} steps completed</p>
            <div className="ld-progressBar" role="progressbar" aria-valuemin="0" aria-valuemax={availableCount} aria-valuenow={completedCount}>
              <span style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="ld-card ld-panelCard">
        <div className="ld-panelTitleRow">
          <h2 className="ld-panelTitle">Current Context</h2>
        </div>
        <dl className="ld-contextList">
          <div><dt><BookIcon size={15} /> Course</dt><dd>{curriculumName}</dd></div>
          <div><dt><LayersIcon size={15} /> Unit</dt><dd>{lesson.gradeBand?.stage || "Current unit"}</dd></div>
          <div><dt><TargetIcon size={15} /> Lesson</dt><dd>{lesson.slug || lesson.id}</dd></div>
          {lesson.estMinutes ? <div><dt><ClockIcon size={15} /> Estimated Time</dt><dd>{lesson.estMinutes} minutes</dd></div> : null}
          <div><dt><CalendarIcon size={15} /> Due Date</dt><dd>Assigned due date unavailable</dd></div>
        </dl>
      </section>

      <section className="ld-card ld-panelCard">
        <div className="ld-panelTitleRow">
          <h2 className="ld-panelTitle">My Notes</h2>
        </div>
        <p className="ld-panelNote">Notes are read-only here until a canonical notes service is available.</p>
      </section>

      <section className="ld-card ld-panelCard">
        <div className="ld-panelTitleRow">
          <h2 className="ld-panelTitle">Resources</h2>
        </div>
        {resources.length ? (
          <ul className="ld-resourceList">
            {resources.map((resource) => (
              <li key={`${resource.href}-${resource.label}`}>
                <a href={resource.href}>
                  {React.createElement(resource.icon || BookIcon, { size: 14 })}
                  <span>{resource.label}</span>
                  <ChevronRightIcon size={13} />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ld-panelNote">No additional lesson resources are available.</p>
        )}
      </section>

      <section className="ld-card ld-panelCard ld-helpPanel">
        <HeadsetIcon size={34} />
        <h2 className="ld-panelTitle">Need Help?</h2>
        <p className="ld-panelNote">Get help from your instructor or join a live support session.</p>
        <Link className="ld-btnGhost ld-btnSm" to="/curriculum/live-sessions">View Live Sessions</Link>
      </section>
    </aside>
  );
}

function lessonResources(lesson, nextHref) {
  const resources = [];
  for (const [index, section] of (lesson.sections || []).entries()) {
    const raw = section.media || null;
    const href = raw?.url || raw?.src;
    if (href) {
      resources.push({
        href,
        label: raw.caption || raw.alt || section.heading || `Lesson media ${index + 1}`,
        icon: raw.type === "video" || String(href).match(/\.(mp4|mov|webm)$/i) ? VideoIcon : BookIcon,
      });
    }
  }
  for (const game of lesson.games || []) {
    if (game.route) resources.push({ href: game.route, label: game.title || "Arcade activity", icon: PlayIcon });
  }
  if (nextHref) {
    resources.push({ href: nextHref, label: "Next lesson", icon: ChevronRightIcon });
  }
  return resources;
}

export default function GuidedLessonExperience({ lesson, curriculum, nextHref, role, assignmentId, unitStableKey, activityState }) {
  const { email } = useUser();
  const { addPoints } = useRewards();
  const actorId = email || "local-student";

  const canonicalLesson = React.useMemo(() => {
    if (!activityState) return lesson;
    return {
      ...lesson,
      ...(activityState.lesson || {}),
      practice: activityState.practice?.items?.length ? activityState.practice.items : lesson.practice,
      quiz: activityState.assessment?.items?.length ? { title: activityState.assessment.title, items: activityState.assessment.items } : lesson.quiz,
    };
  }, [activityState, lesson]);
  const stages = React.useMemo(() => buildGuidedStages(canonicalLesson), [canonicalLesson]);
  const availableStages = React.useMemo(() => stages.filter((s) => s.available), [stages]);
  const { check: checkAssessment, reflect: reflectAssessment } = React.useMemo(() => splitAssessment(canonicalLesson), [canonicalLesson]);

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

  const contentNavItems = React.useMemo(() => buildContentNavItems(canonicalLesson, availableStages), [canonicalLesson, availableStages]);
  const resources = React.useMemo(() => lessonResources(canonicalLesson, nextHref), [canonicalLesson, nextHref]);

  // Real, derived "what's ahead" counts for the Orient stage — never a
  // fabricated estimate, just how many real items each later stage has.
  const vocabCount = (canonicalLesson?.vocab || []).length;
  const arcadeCount = (canonicalLesson?.games || []).length || (canonicalLesson?.arcade?.suggestedGames || []).length;
  const checkCount = checkAssessment?.items?.length || 0;
  const hasReflect = !!reflectAssessment;
  const activityContext = { assignmentId, unitStableKey, lessonStableKey: canonicalLesson.stableKey || lesson.slug || lesson.id, role };

  if (!canonicalLesson) return null;

  return (
    <div className="ld-lessonPage">
      <LessonHeader
        lesson={canonicalLesson}
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
        <ContentNavigator items={contentNavItems} onSelectStage={goToStage} />

        <section id="lesson-stage-panel" role="tabpanel" aria-labelledby={`lesson-stage-tab-${activeKey}`} className="ld-card ld-workspace">
          <div className="ld-studySurfaceHead">
            <div>
              <p className="ld-studyEyebrow">{activeKey === "learn" ? "Lesson Content" : "Lesson Stage"}</p>
              <h2 className="ld-workspaceTitle">{STAGE_LABELS[activeKey]}</h2>
            </div>
            <span className="ld-lessonPill">{activeIndex + 1} of {availableStages.length}</span>
          </div>

          {activeKey === "orient" && (
            <>
              {canonicalLesson.summary && (
                <div className="ld-workspaceSection">
                  <div className="ld-workspaceSectionHead">
                    <SparkleIcon size={14} /> Why this matters
                  </div>
                  <div className="ld-whyMattersCard">{canonicalLesson.summary}</div>
                </div>
              )}

              <div className="ld-workspaceSection">
                <div className="ld-workspaceSectionHead">
                  <BookIcon size={14} /> Key ideas you'll learn
                </div>
                {Array.isArray(canonicalLesson.objectives) && canonicalLesson.objectives.length > 0 ? (
                  <ul className="ld-objectiveList">
                    {canonicalLesson.objectives.map((o, i) => (
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
              {(canonicalLesson.sections || []).map((s, i) => (
                <SectionBlock key={i} section={s} />
              ))}
            </div>
          )}

          {activeKey === "vocabulary" && (
            <VocabularyStage lesson={canonicalLesson} curriculum={curriculum} actorId={actorId} />
          )}

          {activeKey === "check" && checkAssessment && (
            activityState?.assessment ? <AssessmentActivity definition={activityState.assessment} context={activityContext} /> : <p className="ld-workspaceEmpty">No canonical assessment is available for this assignment.</p>
          )}

          {activeKey === "practice" && (
            activityState?.practice ? <PracticeActivity definition={activityState.practice} context={activityContext} /> : <p className="ld-workspaceEmpty">No canonical practice activity is available for this assignment.</p>
          )}

          {activeKey === "arcade" && (
            <ArcadeMissionCard games={canonicalLesson.games} suggestedGames={canonicalLesson?.arcade?.suggestedGames} />
          )}

          {activeKey === "apply" && (
            <div className="ld-applyCard">
              {canonicalLesson.proofActivity ? (
                <ProofActivity activity={canonicalLesson.proofActivity} />
              ) : (
                <>
              {canonicalLesson.project?.title && <h3>{canonicalLesson.project.title}</h3>}
              {Array.isArray(canonicalLesson.project?.submissionOptions) && canonicalLesson.project.submissionOptions.length > 0 && (
                <>
                  <p>Choose an accessible way to show your work:</p>
                  <ul>
                {canonicalLesson.project.submissionOptions.map((option) => <li key={option}>{option}</li>)}
                  </ul>
                </>
              )}
              <p>
                {canonicalLesson.portfolioArtifact
                  ? canonicalLesson.portfolioArtifact
                  : "This lesson counts toward your Portfolio."}
              </p>
              <Link className="ld-btnGhost" style={{ marginTop: 12 }} to="/curriculum/asl/portfolio">
                Go to Portfolio
              </Link>
                </>
              )}
            </div>
          )}

          {activeKey === "assess" && Array.isArray(canonicalLesson?.rubric?.criteria) && (
            <div className="ld-rubricGrid">
              {canonicalLesson.rubric.criteria.map((c, i) => (
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
            activityState?.reflection ? <ReflectionActivity definition={activityState.reflection} context={activityContext} /> : <p className="ld-workspaceEmpty">No canonical reflection is available for this assignment.</p>
          )}

          {activeKey === "evidence" && (
            <EvidencePanel
              lesson={canonicalLesson}
              curriculum={curriculum}
              slug={canonicalLesson.slug || canonicalLesson.id}
              actorId={actorId}
              checkItemCount={checkAssessment?.items?.length || 0}
              reflectItems={reflectAssessment?.items || []}
              vocabCount={(canonicalLesson.vocab || []).length}
            />
          )}

          {activeKey === "career" && <CareerConnectionPanel />}

          {activeKey === "complete" && (
            <CompletionCheckPanel lesson={lesson} curriculum={curriculum} actorId={actorId} addPoints={addPoints} nextHref={nextHref} assignmentId={assignmentId} unitStableKey={unitStableKey} role={role} />
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
            {isLast && activeKey !== "complete" && (
              <button type="button" className="ld-btn ld-btnPrimary" onClick={() => goToStage("complete")}>
                Check Completion <ChevronRightIcon size={16} />
              </button>
            )}
          </div>
        </section>

        <ContextRail
              lesson={canonicalLesson}
          curriculum={curriculum}
          completedCount={completedKeys.size}
          availableCount={availableStages.length}
          nextHref={nextHref}
          resources={resources}
        />
      </div>
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
