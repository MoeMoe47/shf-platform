import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./iep-dashboard.css";

import AccessibilityToolbar from "@/components/iep/AccessibilityToolbar";
import StudentPanel from "@/components/iep/StudentPanel";
import TeacherPanel from "@/components/iep/TeacherPanel";
import AdminPanel from "@/components/iep/AdminPanel";
import { mapIEPAlertToRisk } from "@/apps/iep/iepRiskAdapter";
import { calculateIEPFunding } from "@/apps/iep/iepFundingAdapter";

const initialStudents = [
  {
    id: "stu_001",
    name: "Emily S.",
    readingProgress: 80,
    mathProgress: 74,
    risk: "On Track",
    engagement: "Strong",
    alert: "",
    nextStep: "Complete Reading Module 5",
    goals: [
      {
        id: "goal_reading",
        title: "Reading Fluency",
        current: 65,
        target: 90,
        unit: "WPM",
        status: "Needs Attention",
        explanation: "You are improving, but not fast enough yet.",
        nextStep: "Complete Reading Module 4",
      },
      {
        id: "goal_math",
        title: "Math Skills",
        current: 58,
        target: 80,
        unit: "%",
        status: "On Track",
        explanation: "You are making steady progress in math.",
        nextStep: "Practice multiplication set B",
      },
    ],
  },
  {
    id: "stu_002",
    name: "Jason T.",
    readingProgress: 44,
    mathProgress: 39,
    risk: "High Risk",
    engagement: "Low",
    alert: "Low engagement detected",
    nextStep: "Assign reading intervention + check-in",
    goals: [
      {
        id: "goal_reading",
        title: "Reading Fluency",
        current: 44,
        target: 90,
        unit: "%",
        status: "High Risk",
        explanation: "The student is falling behind because engagement is low.",
        nextStep: "Assign reading intervention and schedule a check-in",
      },
      {
        id: "goal_behavior",
        title: "Behavior Improvement",
        current: 2,
        target: 5,
        unit: "positive weeks",
        status: "Needs Attention",
        explanation: "Progress is happening, but consistency is still low.",
        nextStep: "Review behavior support plan",
      },
    ],
  },
  {
    id: "stu_003",
    name: "Sophia M.",
    readingProgress: 67,
    mathProgress: 61,
    risk: "Needs Attention",
    engagement: "Moderate",
    alert: "Missed 2 sessions",
    nextStep: "Schedule make-up session",
    goals: [
      {
        id: "goal_reading",
        title: "Reading Comprehension",
        current: 67,
        target: 85,
        unit: "%",
        status: "Needs Attention",
        explanation: "Reading progress is moving, but the student needs more support.",
        nextStep: "Schedule make-up reading session",
      },
    ],
  },
  {
    id: "stu_004",
    name: "Aiden D.",
    readingProgress: 56,
    mathProgress: 52,
    risk: "On Track",
    engagement: "Stable",
    alert: "",
    nextStep: "Continue weekly support plan",
    goals: [
      {
        id: "goal_reading",
        title: "Reading Support",
        current: 56,
        target: 75,
        unit: "%",
        status: "On Track",
        explanation: "The student is progressing at an acceptable pace.",
        nextStep: "Continue weekly support plan",
      },
    ],
  },
];

export default function IEPDashboardPage() {
  const navigate = useNavigate();
  const [students] = useState(initialStudents);
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudents[0].id);

  const [highContrast, setHighContrast] = useState(false);
  const [simpleMode, setSimpleMode] = useState(false);
  const [sensoryMode, setSensoryMode] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [textScale, setTextScale] = useState(100);

// 🔥 Auto sync on load + update
React.useEffect(() => {
  syncIEPToSystem(students);
}, [students]);

  // 🔥 SYNC IEP → SHS
const syncIEPToSystem = (students) => {
  const riskEvents = students
    .map(mapIEPAlertToRisk)
    .filter(Boolean);

  const funding = calculateIEPFunding(students);

  window.__SHS_EDU__ = {
    summary: {
      totalStudents: students.length,
      highRiskCount: students.filter(s => s.risk === "High Risk").length,
      needsAttentionCount: students.filter(s => s.risk === "Needs Attention").length,
      onTrackCount: students.filter(s => s.risk === "On Track").length,
      verifiedImprovementCount: funding.eligibleStudents,
      projectedFunding: funding.projectedIDEAFunding
    },
    riskEvents,
    fundingSnapshot: funding
  };
};

const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || students[0],
    [students, selectedStudentId]
  );

  const atRiskCount = students.filter((s) => s.risk === "High Risk").length;
  const verifiedImprovementCount = students.filter(
    (s) => s.readingProgress >= 60 || s.mathProgress >= 60
  ).length;

  const rootClassName = [
    "iep-dashboard",
    highContrast ? "is-high-contrast" : "",
    simpleMode ? "is-simple-mode" : "",
    sensoryMode ? "is-sensory-mode" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClassName}
      style={{ fontSize: `${textScale}%` }}
      aria-label="SHS IEP Integration Dashboard"
    >
      <header className="iep-header">
        <div>
          <div className="iep-brand">SHS IEP Integration Layer</div>
          <h1 className="iep-title">Accessible IEP Dashboard</h1>
          <p className="iep-subtitle">
            Track. Verify. Fund. Accessible by default.
          </p>
        </div>

        <button
          style={{
            marginRight: 12,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "#111",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer"
          }}
          onClick={() => navigate("/exchange/command")}
        >
          Open Command Center
        </button>

        <AccessibilityToolbar
          highContrast={highContrast}
          setHighContrast={setHighContrast}
          simpleMode={simpleMode}
          setSimpleMode={setSimpleMode}
          sensoryMode={sensoryMode}
          setSensoryMode={setSensoryMode}
          voiceMode={voiceMode}
          setVoiceMode={setVoiceMode}
          textScale={textScale}
          setTextScale={setTextScale}
        />
      </header>

      <main className="iep-grid">
        <StudentPanel
          student={selectedStudent}
          simpleMode={simpleMode}
          voiceMode={voiceMode}
        />

        <TeacherPanel
          students={students}
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}
          simpleMode={simpleMode}
          voiceMode={voiceMode}
        />

        <AdminPanel
          students={students}
          atRiskCount={atRiskCount}
          verifiedImprovementCount={verifiedImprovementCount}
          simpleMode={simpleMode}
        />
      </main>
    </div>
  );
}
