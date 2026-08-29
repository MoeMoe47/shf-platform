const STAGES = new Set(["DISCOVER", "EXPLORE", "PREPARE_PROVE"]);
const GRADE_STAGE = new Map([
  [6, "DISCOVER"], [7, "DISCOVER"], [8, "DISCOVER"],
  [9, "EXPLORE"], [10, "EXPLORE"],
  [11, "PREPARE_PROVE"], [12, "PREPARE_PROVE"],
]);

function requireString(value, label, errors) {
  if (typeof value !== "string" || !value.trim()) errors.push(`${label} must be a non-empty string`);
}

export function validateDataCenterCurriculumMap(map) {
  const errors = [];
  if (!map || typeof map !== "object") return ["map must be an object"];
  requireString(map.programId, "programId", errors);
  if (!Array.isArray(map.courses) || map.courses.length !== 13) errors.push("courses must contain exactly thirteen grade records");

  const ids = new Set();
  const lessons = new Set();
  const courseById = new Map();
  for (const course of map.courses || []) {
    requireString(course.courseId, "courseId", errors);
    if (ids.has(course.courseId)) errors.push(`duplicate courseId: ${course.courseId}`);
    ids.add(course.courseId);
    courseById.set(course.courseId, course);
    if (!Number.isInteger(course.grade) || !GRADE_STAGE.has(course.grade)) errors.push(`invalid grade: ${course.courseId}`);
    if (GRADE_STAGE.get(course.grade) !== course.stage || !STAGES.has(course.stage)) errors.push(`grade/stage mismatch: ${course.courseId}`);
    if (!Array.isArray(course.units) || course.units.length === 0) errors.push(`units required: ${course.courseId}`);
    if (!Array.isArray(course.learningOutcomes) || course.learningOutcomes.length === 0) errors.push(`learningOutcomes required: ${course.courseId}`);
    for (const prerequisite of course.prerequisites || []) {
      if (!ids.has(prerequisite) && !courseById.has(prerequisite)) errors.push(`missing prerequisite: ${course.courseId} -> ${prerequisite}`);
    }
    for (const lessonId of course.lessonIds || []) {
      if (lessons.has(lessonId)) errors.push(`duplicate lesson identity: ${lessonId}`);
      lessons.add(lessonId);
    }
  }

  for (const course of map.courses || []) {
    for (const prerequisite of course.prerequisites || []) {
      const prior = courseById.get(prerequisite);
      if (prior && prior.grade >= course.grade) errors.push(`prerequisite is not earlier: ${prerequisite} -> ${course.courseId}`);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) { errors.push(`prerequisite cycle: ${id}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const prerequisite of courseById.get(id)?.prerequisites || []) if (courseById.has(prerequisite)) visit(prerequisite);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of courseById.keys()) visit(id);

  const architecture = map.prepareProveArchitecture;
  if (!architecture || architecture.stage !== "PREPARE_PROVE") {
    errors.push("prepareProveArchitecture must use PREPARE_PROVE");
  } else {
    const sharedIds = new Set();
    for (const core of architecture.sharedGrade11Core || []) {
      requireString(core.id, "shared core id", errors);
      if (sharedIds.has(core.id)) errors.push(`duplicate shared core id: ${core.id}`);
      sharedIds.add(core.id);
      for (const prerequisite of core.prerequisiteCourseIds || []) {
        if (!courseById.has(prerequisite)) errors.push(`missing shared core prerequisite: ${core.id} -> ${prerequisite}`);
      }
    }
    const specializationIds = new Set();
    for (const specialization of architecture.specializations || []) {
      requireString(specialization.specializationId, "specializationId", errors);
      if (specializationIds.has(specialization.specializationId)) errors.push(`duplicate specializationId: ${specialization.specializationId}`);
      specializationIds.add(specialization.specializationId);
      if (!specialization.grades || specialization.grades["11"] !== "APPLIED" || specialization.grades["12"] !== "ADVANCED_INTEGRATED") {
        errors.push(`invalid specialization depth: ${specialization.specializationId}`);
      }
      for (const prerequisite of specialization.requiredPriorCourseIds || []) {
        const prior = courseById.get(prerequisite);
        if (!prior) errors.push(`missing specialization prerequisite: ${specialization.specializationId} -> ${prerequisite}`);
        else if (prior.grade >= 11) errors.push(`specialization prerequisite is not prior: ${prerequisite} -> ${specialization.specializationId}`);
      }
      for (const courseId of specialization.plannedCourseIds || []) {
        const planned = courseById.get(courseId);
        if (!planned) errors.push(`missing specialization course: ${specialization.specializationId} -> ${courseId}`);
        else if ((architecture.executableSharedCoreCourseIds || []).includes(courseId)) {
          if (!["SHARED_CORE_PROOF", "SHARED_CORE_AND_TECHNICAL_OPERATIONS", "SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER", "SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL", "SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL_AND_MECHANICAL_HVAC", "SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL_AND_MECHANICAL_HVAC_AND_SECURITY", "SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL_AND_MECHANICAL_HVAC_AND_SECURITY_AND_AI_CLOUD"].includes(planned.activationScope) || planned.contentStatus !== "active" || planned.lessonIds.length === 0) errors.push(`shared core course is not active: ${courseId}`);
        } else if (courseId === "data-center-capstone-12") {
          if (planned.contentStatus !== "planned" || planned.lessonIds.length !== 0) errors.push(`specialization course must remain planned: ${courseId}`);
        } else if (planned.contentStatus !== "planned" || planned.lessonIds.length !== 0) errors.push(`specialization course must remain planned: ${courseId}`);
      }
      if (specialization.activationStatus === "active" && !["technical-operations", "networking-fiber", "electrical-infrastructure", "mechanical-hvac", "cybersecurity-security", "ai-cloud-infrastructure"].includes(specialization.specializationId)) errors.push(`unsupported active specialization: ${specialization.specializationId}`);
      if (specialization.activationStatus === "active" && (!Array.isArray(specialization.executableLessonIds) || specialization.executableLessonIds.length === 0)) errors.push(`active specialization needs executable lessons: ${specialization.specializationId}`);
      for (const lessonId of specialization.executableLessonIds || []) {
        if (!lessons.has(lessonId)) errors.push(`missing executable specialization lesson: ${specialization.specializationId} -> ${lessonId}`);
      }
      for (const candidate of specialization.futureEvidenceCandidates || []) {
        if (candidate.status !== "PLANNED ONLY") errors.push(`future evidence candidate must be planned only: ${specialization.specializationId}`);
      }
      for (const credential of specialization.credentialAlignments || []) {
        if (credential.status !== "NOT ISSUED / PLANNED") errors.push(`credential alignment must remain planned: ${specialization.specializationId}`);
      }
      for (const career of specialization.careerRelationships || []) {
        if (career.status === "EXISTING CANONICAL" && (!career.careerId || career.careerId !== "data-center-technician")) {
          errors.push(`unknown canonical career relationship: ${specialization.specializationId}`);
        }
        if (career.status !== "EXISTING CANONICAL" && career.status !== "NEEDS SEPARATE CAREER PHASE") {
          errors.push(`invalid career relationship status: ${specialization.specializationId}`);
        }
      }
    }
    if (specializationIds.size < 4) errors.push("at least four coherent specializations required");
    for (const courseId of architecture.executableSharedCoreCourseIds || []) {
      const course = courseById.get(courseId);
      if (!course || course.grade !== 11 || !["SHARED_CORE_PROOF", "SHARED_CORE_AND_TECHNICAL_OPERATIONS", "SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER", "SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL", "SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL_AND_MECHANICAL_HVAC", "SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL_AND_MECHANICAL_HVAC_AND_SECURITY", "SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL_AND_MECHANICAL_HVAC_AND_SECURITY_AND_AI_CLOUD"].includes(course.activationScope)) errors.push(`invalid executable shared core course: ${courseId}`);
    }
    if (!Array.isArray(architecture.activeSpecializationIds) || architecture.activeSpecializationIds.join(",") !== "technical-operations,networking-fiber,electrical-infrastructure,mechanical-hvac,cybersecurity-security,ai-cloud-infrastructure") errors.push("technical-operations, networking-fiber, electrical-infrastructure, mechanical-hvac, cybersecurity-security, and ai-cloud-infrastructure must be active");
    if (architecture.constructionDecision?.classification !== "ELECTIVE_AND_CAREER_EXPOSURE_TRACK") errors.push("construction classification must remain elective/career exposure");
    if (!String(architecture.boundaries?.competencyStatus || "").startsWith("IMPLEMENTED: generic evidence and competency review foundation")) errors.push("competency ownership must remain canonical and scoped");
    if (architecture.boundaries?.credentialStatus !== "DEFERRED: planning and potential alignment only; nothing is issued") errors.push("credential issuance must remain deferred");
    if (architecture.boundaries?.employerStatus !== "DEFERRED: partner categories are planning references, not commitments") errors.push("employer commitments must remain deferred");

    const grade12 = architecture.grade12Architecture;
    const canonicalBranches = ["technical-operations", "networking-fiber", "electrical-infrastructure", "mechanical-hvac", "cybersecurity-security", "ai-cloud-infrastructure"];
    const canonicalCapstoneRoles = { "technical-operations": "Operations", "networking-fiber": "Networking", "electrical-infrastructure": "Power", "mechanical-hvac": "Cooling/Mechanical", "cybersecurity-security": "Security", "ai-cloud-infrastructure": "Compute/AI Infrastructure" };
    if (!grade12 || !["ARCHITECTURE_DEFINED_NON_EXECUTABLE", "ARCHITECTURE_DEFINED_WITH_EXECUTABLE_REFERENCE_SLICE"].includes(grade12.status)) errors.push("Grade 12 architecture must be defined with a bounded execution status");
    if (grade12?.policyVersion !== "grade12-entry-v1") errors.push("Grade 12 architecture must use grade12-entry-v1");
    if (grade12?.specializationContinuity !== "ACTIVE_CANONICAL_PRIMARY_ASSIGNMENT") errors.push("Grade 12 branch continuity must use the active canonical primary assignment");
    if (grade12?.sharedCore?.decision !== "MODEL_B_SMALL_COMMON_CORE" || !["PLANNED_ARCHITECTURE_ONLY", "EXECUTABLE_REFERENCE_SLICE"].includes(grade12?.sharedCore?.status) || !Array.isArray(grade12?.sharedCore?.lessonIds)) errors.push("Grade 12 shared core must be a bounded common-core contract");
    if (grade12?.status === "ARCHITECTURE_DEFINED_WITH_EXECUTABLE_REFERENCE_SLICE" && (!Array.isArray(grade12.executableCourseIds) || grade12.executableCourseIds.join(",") !== "data-center-technical-operations-12,data-center-networking-fiber-12,data-center-electrical-infrastructure-12,data-center-mechanical-hvac-12,data-center-cybersecurity-security-12,data-center-ai-cloud-infrastructure-12" || grade12.executableSpecializationIds?.join(",") !== "technical-operations,networking-fiber,electrical-infrastructure,mechanical-hvac,cybersecurity-security,ai-cloud-infrastructure")) errors.push("Grade 12 executable reference slice must include all six advanced branches");
    if (grade12?.status === "ARCHITECTURE_DEFINED_WITH_EXECUTABLE_REFERENCE_SLICE" && !grade12.sharedCore.lessonIds.every((id) => courseById.get("data-center-technical-operations-12")?.lessonIds.includes(id))) errors.push("Grade 12 shared core lesson references must resolve to the active reference course");
    if (grade12?.status === "ARCHITECTURE_DEFINED_WITH_EXECUTABLE_REFERENCE_SLICE") {
      const reference = courseById.get("data-center-technical-operations-12");
      const networking = courseById.get("data-center-networking-fiber-12");
      const electrical = courseById.get("data-center-electrical-infrastructure-12");
      const mechanical = courseById.get("data-center-mechanical-hvac-12");
      const security = courseById.get("data-center-cybersecurity-security-12");
      const aiCloud = courseById.get("data-center-ai-cloud-infrastructure-12");
      if (!reference || reference.contentStatus !== "active" || reference.activationScope !== "GRADE12_SHARED_CORE_AND_TECHNICAL_OPERATIONS" || reference.grade !== 12 || reference.lessonIds.length === 0) errors.push("Grade 12 Technical Operations reference course must be active and bounded");
      if (!networking || networking.contentStatus !== "active" || networking.activationScope !== "GRADE12_SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER" || networking.grade !== 12 || networking.lessonIds.length === 0) errors.push("Grade 12 Networking/Fiber course must be active and bounded");
      if (!electrical || electrical.contentStatus !== "active" || electrical.activationScope !== "GRADE12_SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL" || electrical.grade !== 12 || electrical.lessonIds.length === 0) errors.push("Grade 12 Electrical course must be active and bounded");
      if (!mechanical || mechanical.contentStatus !== "active" || mechanical.activationScope !== "GRADE12_SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL_AND_MECHANICAL_HVAC" || mechanical.grade !== 12 || mechanical.lessonIds.length === 0) errors.push("Grade 12 Mechanical/HVAC course must be active and bounded");
      if (!security || security.contentStatus !== "active" || security.activationScope !== "GRADE12_SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL_AND_MECHANICAL_HVAC_AND_SECURITY" || security.grade !== 12 || security.lessonIds.length === 0) errors.push("Grade 12 Security course must be active and bounded");
      if (!aiCloud || aiCloud.contentStatus !== "active" || aiCloud.activationScope !== "GRADE12_SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL_AND_MECHANICAL_HVAC_AND_SECURITY_AND_AI_CLOUD" || aiCloud.grade !== 12 || aiCloud.lessonIds.length === 0) errors.push("Grade 12 AI/Cloud course must be active and bounded");
      for (const course of [reference, networking, electrical, mechanical, security, aiCloud]) if (course && course.lessonIds.some((id) => !lessons.has(id))) errors.push(`Grade 12 reference course contains an unknown lesson: ${course.courseId}`);
    }
    const advancedBranches = grade12?.advancedBranches || [];
    if (advancedBranches.length !== canonicalBranches.length || new Set(advancedBranches.map((branch) => branch.specializationId)).size !== canonicalBranches.length || canonicalBranches.some((id) => !advancedBranches.some((branch) => branch.specializationId === id))) errors.push("Grade 12 architecture must define all six canonical advanced branches");
    for (const branch of advancedBranches) {
      requireString(branch.purpose, `Grade 12 branch purpose: ${branch.specializationId}`, errors);
      requireString(branch.complexity, `Grade 12 branch complexity: ${branch.specializationId}`, errors);
      if (!Array.isArray(branch.advancedDomains) || branch.advancedDomains.length === 0) errors.push(`Grade 12 advanced domains required: ${branch.specializationId}`);
      requireString(branch.safetyBoundary, `Grade 12 safety boundary: ${branch.specializationId}`, errors);
      if (!Array.isArray(branch.candidateEvidence) || branch.candidateEvidence.length === 0) errors.push(`Grade 12 candidate evidence required: ${branch.specializationId}`);
    }
    const capstone = grade12?.capstone;
    if (!capstone || capstone.id !== "build-ohios-next-ai-data-center" || capstone.title !== "Build Ohio's Next AI Data Center" || capstone.status !== "ARCHITECTURE_DEFINED_NON_EXECUTABLE") errors.push("Grade 12 capstone must remain architecture-defined and non-executable");
    const capstoneEntryPolicy = grade12?.capstoneEntryPolicy;
    if (!capstoneEntryPolicy || capstoneEntryPolicy.policyVersion !== "grade12-capstone-entry-v1" || capstoneEntryPolicy.decision !== "DERIVED_FROM_CANONICAL_FACTS" || capstoneEntryPolicy.status !== "GATE_ONLY_CAPSTONE_NON_EXECUTABLE" || !Array.isArray(capstoneEntryPolicy.requirements) || capstoneEntryPolicy.requirements.length !== 5) errors.push("Grade 12 capstone entry must remain a five-part derived gate without activation");
    if (capstone?.mode !== "MODEL_C_HYBRID") errors.push("Grade 12 capstone must use the hybrid ownership model");
    if (capstone?.roleSource !== "ACTIVE_CANONICAL_PRIMARY_ASSIGNMENT") errors.push("capstone roles must derive from active canonical primary assignment");
    if (!capstone?.roleMap || canonicalBranches.some((id) => capstone.roleMap[id] !== canonicalCapstoneRoles[id])) errors.push("capstone role map must cover all six canonical branches");
    if (!Array.isArray(capstone?.teamModes) || !capstone.teamModes.includes("COLLABORATIVE_MODE") || !capstone.teamModes.includes("INDIVIDUAL_INTEGRATED_MODE")) errors.push("capstone must support collaborative and individual integrated modes");
    if (capstone?.safety !== "SIMULATION_OR_SAFE_SANDBOX_ONLY") errors.push("capstone must remain simulation or safe sandbox only");
    if (!grade12?.ownership || grade12.ownership.decision !== "MODEL_C_HYBRID_PROJECT_TEAM_SUBMISSION_PREPARE_PROVE_INDIVIDUAL_PROOF" || grade12.ownership.teamSubmissionOwner !== "FUTURE_GENERIC_PROJECT_DOMAIN" || grade12.ownership.individualProofOwner !== "GENERIC_PREPARE_PROVE_RESULT_EVIDENCE_REVIEW" || grade12.ownership.noDuplicateStore !== true) errors.push("Grade 12 capstone ownership must remain generic hybrid ownership");
    if (grade12?.competencies?.strategy !== "BOTH_NARROW" || grade12?.competencies?.status !== "PLANNED_ONLY") errors.push("Grade 12 competency strategy must remain narrow and planned");
    if (grade12?.completionContract?.credentialRelation !== "No credential, license, apprenticeship hour, or certificate is issued by curriculum completion.") errors.push("Grade 12 completion must not issue credentials or apprenticeship facts");
    if (grade12?.completionContract?.readinessRelation !== "No career or employment readiness score is created.") errors.push("Grade 12 completion must not create readiness");
    if (grade12?.accessibility?.individualEquivalentRequired !== true || !Array.isArray(grade12?.accessibility?.requirements) || grade12.accessibility.requirements.length === 0) errors.push("Grade 12 capstone must require accessible individual equivalents");
    if (!["NON_EXECUTABLE", "REFERENCE_SLICE_ONLY_OTHER_CONTENT_NON_EXECUTABLE"].includes(grade12?.boundaries?.grade12Content) || grade12?.boundaries?.capstone !== "NON_EXECUTABLE" || grade12?.boundaries?.credentials !== "DEFERRED" || grade12?.boundaries?.readiness !== "DEFERRED" || grade12?.boundaries?.employerAccess !== "DENIED_BY_DEFAULT" || grade12?.boundaries?.portfolio !== "PROJECTION_ONLY") errors.push("Grade 12 boundaries must preserve bounded execution, privacy, credential, readiness, and portfolio limits");
  }
  return errors;
}

export function assertValidDataCenterCurriculumMap(map) {
  const errors = validateDataCenterCurriculumMap(map);
  if (errors.length) throw new Error(`invalid_data_center_curriculum_map: ${errors.join("; ")}`);
  return map;
}
