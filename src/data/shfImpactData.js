// SHF Impact Data Spine adapter for the public Foundation command map.
// This mirrors the V1 data contract in /Users/mikeslate/shf-next/src/data/shfImpactData.ts
// without importing across repo boundaries.
//
// SHS OS is the infrastructure and operations system. SHF OS is the
// foundation/community impact reporting system. SHS OS may power data
// collection, operations, verification, and reporting tools, but SHF OS only
// receives data that is SHF-labeled, SHF-sponsored, SHF-funded, SHF-partnered,
// or SHF-approved mission/program data.
//
// Private SHS client data must never appear in SHF public map/report outputs.
// Public-facing SHF outputs must filter for publicApproved === true, data must
// not be described as verified unless dataStatus === "Verified", and sample data
// must remain labeled Sample/Draft until replaced by approved records.

export const SHF_DATA_FLOW_RULE =
  "SHS OS may power the infrastructure behind data collection and reporting, but only SHF-approved mission/program data can flow into SHF public maps, reports, donor updates, grant reports, and board-facing impact summaries.";

export function isPublicApprovedImpactRecord(record) {
  return record?.publicApproved === true;
}

export const shfProgramLanes = [
  { id: "education", title: "Education", publicApproved: true, dataStatus: "Sample" },
  { id: "workforce-development", title: "Workforce Development", publicApproved: true, dataStatus: "Sample" },
  { id: "digital-access", title: "Digital Access", publicApproved: true, dataStatus: "Sample" },
  { id: "community-partnerships", title: "Community Partnerships", publicApproved: true, dataStatus: "Sample" },
];

export const shfCountiesServed = [
  { id: "coshocton", county: "Coshocton", countyName: "Coshocton", state: "Ohio", region: "Ohio Silicon Heartland", communitiesReached: 18, studentsServed: 1240, adultsAndFamiliesReached: 540, workforceParticipants: 260, partners: 16, partnerCount: 16, primaryProgramLaneIds: ["education", "digital-access"], mapIntensity: 0.62, publicApproved: true, dataStatus: "Sample", lastVerified: "Not Verified", trustLevel: "Draft" },
  { id: "holmes", county: "Holmes", countyName: "Holmes", state: "Ohio", region: "Ohio Silicon Heartland", communitiesReached: 15, studentsServed: 980, adultsAndFamiliesReached: 430, workforceParticipants: 210, partners: 12, partnerCount: 12, primaryProgramLaneIds: ["education", "community-partnerships"], mapIntensity: 0.54, publicApproved: true, dataStatus: "Sample", lastVerified: "Not Verified", trustLevel: "Draft" },
  { id: "knox", county: "Knox", countyName: "Knox", state: "Ohio", region: "Ohio Silicon Heartland", communitiesReached: 22, studentsServed: 1640, adultsAndFamiliesReached: 710, workforceParticipants: 390, partners: 22, partnerCount: 22, primaryProgramLaneIds: ["workforce-development", "digital-access"], mapIntensity: 0.72, publicApproved: true, dataStatus: "Sample", lastVerified: "Not Verified", trustLevel: "Draft" },
  { id: "licking", county: "Licking", countyName: "Licking", state: "Ohio", region: "Ohio Silicon Heartland", communitiesReached: 31, studentsServed: 2810, adultsAndFamiliesReached: 1180, workforceParticipants: 620, partners: 34, partnerCount: 34, primaryProgramLaneIds: ["education", "workforce-development"], mapIntensity: 0.94, publicApproved: true, dataStatus: "Sample", lastVerified: "Not Verified", trustLevel: "Draft" },
  { id: "muskingum", county: "Muskingum", countyName: "Muskingum", state: "Ohio", region: "Ohio Silicon Heartland", communitiesReached: 26, studentsServed: 2225, adultsAndFamiliesReached: 960, workforceParticipants: 510, partners: 27, partnerCount: 27, primaryProgramLaneIds: ["community-partnerships", "digital-access"], mapIntensity: 0.84, publicApproved: true, dataStatus: "Sample", lastVerified: "Not Verified", trustLevel: "Draft" },
  { id: "perry", county: "Perry", countyName: "Perry", state: "Ohio", region: "Ohio Silicon Heartland", communitiesReached: 13, studentsServed: 760, adultsAndFamiliesReached: 390, workforceParticipants: 180, partners: 10, partnerCount: 10, primaryProgramLaneIds: ["digital-access", "community-partnerships"], mapIntensity: 0.48, publicApproved: true, dataStatus: "Sample", lastVerified: "Not Verified", trustLevel: "Draft" },
  { id: "tuscarawas", county: "Tuscarawas", countyName: "Tuscarawas", state: "Ohio", region: "Ohio Silicon Heartland", communitiesReached: 24, studentsServed: 1950, adultsAndFamiliesReached: 820, workforceParticipants: 440, partners: 25, partnerCount: 25, primaryProgramLaneIds: ["education", "workforce-development"], mapIntensity: 0.78, publicApproved: true, dataStatus: "Sample", lastVerified: "Not Verified", trustLevel: "Draft" },
  { id: "wayne", county: "Wayne", countyName: "Wayne", state: "Ohio", region: "Ohio Silicon Heartland", communitiesReached: 20, studentsServed: 1510, adultsAndFamiliesReached: 640, workforceParticipants: 360, partners: 18, partnerCount: 18, primaryProgramLaneIds: ["workforce-development", "community-partnerships"], mapIntensity: 0.68, publicApproved: true, dataStatus: "Sample", lastVerified: "Not Verified", trustLevel: "Draft" },
];

export function getPublicApprovedMapCounties() {
  return shfCountiesServed
    .filter(isPublicApprovedImpactRecord)
    .map((county) => ({
      ...county,
      programs: county.primaryProgramLaneIds
        .map((id) => getProgramLaneById(id)?.title)
        .filter(Boolean),
    }));
}

export function getPublicApprovedCounties() {
  return getPublicApprovedMapCounties();
}

export function getPublicApprovedCountyCount() {
  return getPublicApprovedMapCounties().length;
}

export function getPendingCountyCount() {
  return shfCountiesServed.filter((county) => county.dataStatus === "Pending Verification" || !isPublicApprovedImpactRecord(county)).length;
}

export function getVerifiedCountyCount() {
  return shfCountiesServed.filter((county) => isPublicApprovedImpactRecord(county) && county.dataStatus === "Verified").length;
}

export function getMapDataStatusSummary() {
  const publicCounties = getPublicApprovedMapCounties();
  const statusSet = new Set(publicCounties.map((county) => county.dataStatus));
  const trustSet = new Set(publicCounties.map((county) => county.trustLevel));
  const latestUpdated = publicCounties
    .map((county) => county.lastVerified)
    .find((value) => value && value !== "Not Verified");

  return {
    dataSource: "SHF Impact Data Spine",
    publicApprovedRecords: getPublicApprovedCountyCount(),
    pendingCounties: getPendingCountyCount(),
    verifiedCounties: getVerifiedCountyCount(),
    dataStatus: statusSet.has("Verified") && statusSet.size === 1 ? "Verified" : statusSet.has("Pending Verification") ? "Pending" : "Sample",
    trustLevel: trustSet.has("Verified") && trustSet.size === 1 ? "Verified" : trustSet.has("Public Approved") ? "Public Approved" : trustSet.has("Internal") ? "Internal" : "Draft",
    lastUpdated: latestUpdated || "Not Verified",
    visibilityRule: "Public-approved data only",
  };
}

export function getProgramLaneById(id) {
  return shfProgramLanes.find((lane) => lane.id === id && isPublicApprovedImpactRecord(lane)) || null;
}

export function getPublicApprovedCountyByName(countyName) {
  const normalized = String(countyName || "").replace(/\s+County$/i, "").trim().toLowerCase();
  if (!normalized) return null;
  return getPublicApprovedMapCounties().find((county) => county.countyName.toLowerCase() === normalized) || null;
}

export function getImpactTotals() {
  const counties = getPublicApprovedMapCounties();
  return {
    countiesServed: counties.length,
    communitiesReached: counties.reduce((total, county) => total + county.communitiesReached, 0),
    studentsServed: counties.reduce((total, county) => total + county.studentsServed, 0),
    adultsAndFamiliesReached: counties.reduce((total, county) => total + county.adultsAndFamiliesReached, 0),
    workforceParticipants: counties.reduce((total, county) => total + county.workforceParticipants, 0),
    partners: counties.reduce((total, county) => total + county.partners, 0),
    partnerCount: counties.reduce((total, county) => total + county.partnerCount, 0),
    dataStatus: "Sample",
    reportTrustLevel: "Draft",
    trustLevel: "Draft",
  };
}
