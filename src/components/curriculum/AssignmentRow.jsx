// src/components/curriculum/AssignmentRow.jsx
//
// SHF Curriculum Phase 5.5 — one shared row renderer for an assignment
// work item (the shape /assignments already returns — assignmentType,
// accessState, progress, curriculumRelease, assignedContent, nextLesson),
// reused by both the global Assignments page and each Course Workspace's
// Assignments tab so the status/breadcrumb/progress presentation exists
// exactly once.
import React from "react";
import { Link } from "react-router-dom";
import { ClipboardIcon, ChevronRightIcon } from "@/components/curriculum/icons.jsx";

export const ACCESS_STATE_LABEL = { LOCKED: "Not yet available", AVAILABLE: "To Do", IN_PROGRESS: "In Progress", OVERDUE: "Overdue", COMPLETED: "Completed" };
const TYPE_LABEL = { assignment: "Assignment", quiz: "Quiz", reflection: "Reflection", artifact: "Artifact" };

export function breadcrumbFor(a) {
  const parts = [];
  if (a.curriculumRelease?.courseTitle) parts.push(a.curriculumRelease.courseTitle);
  if (a.assignedContent?.title) parts.push(a.assignedContent.title);
  if (a.nextLesson?.title && !parts.includes(a.nextLesson.title)) parts.push(a.nextLesson.title);
  return parts;
}

export function nextLessonHref(a) {
  if (!a.nextLesson) return null;
  return `/curriculum/lessons/${a.nextLesson.lessonStableKey}`;
}

export default function AssignmentRow({ assignment: a }) {
  const crumb = breadcrumbFor(a);
  const href = nextLessonHref(a);
  return (
    <li className="ld-workRow">
      <span className={`ld-workThumb is-${a.assignmentType}`} aria-hidden="true"><ClipboardIcon size={20} /></span>
      <div className="ld-workMain">
        <div className="ld-workTitle">{a.title}</div>
        {crumb.length > 0 && <div className="ld-workBreadcrumb">{crumb.join(" › ")}</div>}
      </div>
      <span className="ld-workCell">
        <span className={`ld-typePill is-${a.assignmentType}`}>{TYPE_LABEL[a.assignmentType] || a.assignmentType}</span>
      </span>
      <span className="ld-workCell">{a.dueAt ? new Date(a.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}</span>
      <span className={`ld-statusPill ${a.accessState === "OVERDUE" ? "is-soon" : "is-later"}`}>{ACCESS_STATE_LABEL[a.accessState] || a.accessState}</span>
      <span className="ld-workCell">{a.progress?.total > 0 ? `${a.progress.completed}/${a.progress.total}` : "—"}</span>
      {href ? (
        <Link className="ld-iconAction" to={href} aria-label={`Open ${a.title}`}><ChevronRightIcon size={16} /></Link>
      ) : (
        <span className="ld-workCell">—</span>
      )}
    </li>
  );
}
