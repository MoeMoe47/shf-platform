// src/router/CurriculumRoutes.jsx
// Routes-only module: no Router here (entry provides <HashRouter>)
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CurriculumLayout from "@/layouts/CurriculumLayout.jsx";
import GedWritingChapterStudent from "@/pages/ged/GedWritingChapterStudent.jsx";

/** Universal Dev Index (no layout chrome) */
const DevDocsViewer = lazy(() => import("@/pages/dev/Docs.jsx"));

/** Curriculum + shared pages */
const CurriculumDashboard = lazy(() => import("@/pages/curriculum/CurriculumDashboard.jsx"));
const Lessons = lazy(() => import("@/pages/Lessons.jsx"));
const LessonView = lazy(() => import("@/pages/LessonView.jsx"));
const LessonPage = lazy(() => import("@/pages/LessonPage.jsx"));
const Help = lazy(() => import("@/pages/Help.jsx"));
const Settings = lazy(() => import("@/pages/Settings.jsx"));

/** Curriculum-specific lesson screens */
const MyLessons = lazy(() => import("@/pages/curriculum/MyLessons.jsx"));
const CurriculumLesson = lazy(() => import("@/pages/curriculum/Lesson.jsx"));

export default function CurriculumRoutes() {
  return (
    <Suspense fallback={<div className="skeleton pad">Loading…</div>}>
      <Routes>
        {/* Dev index without layout chrome */}
        <Route path="/__docs" element={<DevDocsViewer />} />

        {/* ✅ Base route for Curriculum app */}
        <Route path="/curriculum" element={<CurriculumLayout />}>
          {/* Default inside curriculum */}
          <Route index element={<Navigate to="asl/dashboard" replace />} />

          {/* Keep your “asl/dashboard” path */}
          <Route path="asl/dashboard" element={<CurriculumDashboard />} />

          {/* GED Writing Student Chapter Route */}
          <Route path="ged-writing/ch/:number" element={<GedWritingChapterStudent />} />

          {/* Curriculum lesson routes */}
          <Route path="lessons" element={<MyLessons />} />
          <Route path="lesson/:id" element={<CurriculumLesson />} />

          {/* Library routes */}
          <Route path="library/lessons" element={<Lessons />} />
          <Route path="library/lesson/:id" element={<LessonView />} />
          <Route path="library/lesson" element={<LessonPage />} />

          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />

          {/* Fallback inside curriculum */}
          <Route path="*" element={<Navigate to="asl/dashboard" replace />} />
        </Route>

        {/* ✅ If someone hits just "#/" in this app, send them to curriculum */}
        <Route path="/" element={<Navigate to="/curriculum" replace />} />
        <Route path="*" element={<Navigate to="/curriculum" replace />} />
      </Routes>
    </Suspense>
  );
}
