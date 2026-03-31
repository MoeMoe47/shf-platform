export const COUNTY_PROFILES = {
  __default: {
    label: "COUNTY",
    title: "County Detail",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Monitor",
    statusTone: "neutral",
    interventions: "Active",
    funding: "Tracked",
    priority: "High",
    confidence: "84%",
    analystSummary:
      "County requires targeted intervention review, verification follow-up, and funding-safe documentation.",
    recommendedAction: "Assign intervention",
    recommendedReason: "Low engagement + stalled progress",
    alerts: ["Low engagement detected", "Missed 2 sessions", "Progress stalled"],
    priorityCases: [
      { name: "Jason T.", status: "High Risk" },
      { name: "Sophia M.", status: "Attention" },
      { name: "Emily S.", status: "Verified" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "12 HIGH RISK",
      verification: "VERIFICATION PARTIAL"
    },
    mapMetrics: {
      status: "MONITORED"
    },
    systemView: {
      students: "328",
      highRisk: "12",
      verified: "142",
      funding: "$1.2M",
      readiness: "84",
      p1: "Incoming Students",
      p2: "Active Interventions",
      p3: "Verified Outcomes",
      p4: "Funding Readiness"
    },
    compliance: {
      verification: "Partial",
      audit: "Pending",
      docs: "1 Missing Report"
    }
  },

  FRANKLIN: {
    label: "FRANKLIN",
    title: "FRANKLIN County",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Monitored",
    statusTone: "warn",
    interventions: "Active",
    funding: "Tracked",
    priority: "High",
    confidence: "84%",
    analystSummary:
      "FRANKLIN County is the current operating focus. Jason T. requires targeted intervention within 24 hours due to low engagement and stalled reading progress. Recommended path: immediate assignment, verification follow-up, then funding-safe documentation.",
    recommendedAction: "Assign intervention",
    recommendedReason: "Low engagement + stalled reading progress",
    alerts: ["Low engagement detected", "Missed 2 sessions", "Progress stalled"],
    priorityCases: [
      { name: "Jason T.", status: "High Risk" },
      { name: "Sophia M.", status: "Attention" },
      { name: "Emily S.", status: "Verified" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "12 HIGH RISK",
      verification: "VERIFICATION PARTIAL"
    },
    mapMetrics: {
      status: "MONITORED"
    },
    systemView: {
      students: "328",
      highRisk: "12",
      verified: "142",
      funding: "$1.2M",
      readiness: "84",
      p1: "Incoming Students",
      p2: "Active Interventions",
      p3: "Verified Outcomes",
      p4: "Funding Readiness"
    },
    compliance: {
      verification: "Partial",
      audit: "Pending",
      docs: "1 Missing Report"
    }
  },

  FAIRFIELD: {
    label: "FAIRFIELD",
    title: "FAIRFIELD County",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Escalating",
    statusTone: "danger",
    interventions: "Queued",
    funding: "Pending",
    priority: "High",
    confidence: "79%",
    analystSummary:
      "FAIRFIELD County shows rising case pressure. Immediate attention is recommended for attendance disruption and delayed intervention completion.",
    recommendedAction: "Escalate review",
    recommendedReason: "Attendance disruption + delayed intervention completion",
    alerts: ["Attendance risk rising", "Intervention backlog", "Verification incomplete"],
    priorityCases: [
      { name: "Maya R.", status: "High Risk" },
      { name: "Chris D.", status: "Attention" },
      { name: "Elena V.", status: "Review" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "9 HIGH RISK",
      verification: "VERIFICATION LIMITED"
    },
    mapMetrics: {
      status: "ESCALATING"
    },
    systemView: {
      students: "214",
      highRisk: "9",
      verified: "88",
      funding: "$860K",
      readiness: "76",
      p1: "Incoming Students",
      p2: "Escalated Reviews",
      p3: "Intervention Queue",
      p4: "Funding Hold Points"
    },
    compliance: {
      verification: "Limited",
      audit: "Review Needed",
      docs: "2 Missing Reports"
    }
  },

  LICKING: {
    label: "LICKING",
    title: "LICKING County",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Active",
    statusTone: "warn",
    interventions: "In Progress",
    funding: "Ready",
    priority: "High",
    confidence: "87%",
    analystSummary:
      "LICKING County is showing elevated intervention demand with multiple active cases and improving funding readiness conditions.",
    recommendedAction: "Deploy support team",
    recommendedReason: "Elevated intervention demand + favorable funding readiness",
    alerts: ["Case load elevated", "Intervention pressure", "Funding window open"],
    priorityCases: [
      { name: "Noah P.", status: "High Risk" },
      { name: "Ava L.", status: "Attention" },
      { name: "Marcus J.", status: "Verified" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "7 HIGH RISK",
      verification: "VERIFICATION STRONG"
    },
    mapMetrics: {
      status: "ACTIVE"
    },
    systemView: {
      students: "241",
      highRisk: "7",
      verified: "111",
      funding: "$940K",
      readiness: "89",
      p1: "Incoming Students",
      p2: "Deployment Queue",
      p3: "Verified Outcomes",
      p4: "Funding Ready"
    },
    compliance: {
      verification: "Strong",
      audit: "On Track",
      docs: "0 Missing Reports"
    }
  },

  DELAWARE: {
    label: "DELAWARE",
    title: "DELAWARE County",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Monitor",
    statusTone: "neutral",
    interventions: "Active",
    funding: "Tracked",
    priority: "Medium",
    confidence: "71%",
    analystSummary:
      "DELAWARE County remains inside the active operating region and should stay under watch for spillover risk.",
    recommendedAction: "Monitor conditions",
    recommendedReason: "Regional spillover watch",
    alerts: ["Regional spillover watch", "Monitor attendance drift"],
    priorityCases: [
      { name: "Ethan C.", status: "Attention" },
      { name: "Riley S.", status: "Monitor" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "4 ATTENTION",
      verification: "VERIFICATION PARTIAL"
    },
    mapMetrics: {
      status: "MONITOR"
    },
    systemView: {
      students: "178",
      highRisk: "4",
      verified: "92",
      funding: "$620K",
      readiness: "74",
      p1: "Incoming Students",
      p2: "Regional Watch",
      p3: "Verified Outcomes",
      p4: "Funding Tracked"
    },
    compliance: {
      verification: "Partial",
      audit: "Pending",
      docs: "1 Missing Report"
    }
  },

  MADISON: {
    label: "MADISON",
    title: "MADISON County",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Monitor",
    statusTone: "neutral",
    interventions: "Standby",
    funding: "Tracked",
    priority: "Medium",
    confidence: "68%",
    analystSummary:
      "MADISON County is within the active response perimeter and should remain on standby for overflow support.",
    recommendedAction: "Hold in standby",
    recommendedReason: "Regional support readiness",
    alerts: ["Support standby", "Regional watch"],
    priorityCases: [
      { name: "Olivia K.", status: "Monitor" },
      { name: "Tyler N.", status: "Attention" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "3 ATTENTION",
      verification: "VERIFICATION PARTIAL"
    },
    mapMetrics: {
      status: "MONITOR"
    },
    systemView: {
      students: "149",
      highRisk: "3",
      verified: "76",
      funding: "$540K",
      readiness: "69",
      p1: "Incoming Students",
      p2: "Support Standby",
      p3: "Verified Outcomes",
      p4: "Funding Tracked"
    },
    compliance: {
      verification: "Partial",
      audit: "Pending",
      docs: "1 Missing Report"
    }
  },

  UNION: {
    label: "UNION",
    title: "UNION County",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Monitor",
    statusTone: "neutral",
    interventions: "Standby",
    funding: "Tracked",
    priority: "Medium",
    confidence: "66%",
    analystSummary:
      "UNION County is stable but remains inside the active response ring and should stay visible on the board.",
    recommendedAction: "Maintain visibility",
    recommendedReason: "Stable but inside response ring",
    alerts: ["Regional monitoring active"],
    priorityCases: [
      { name: "Liam F.", status: "Monitor" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "2 ATTENTION",
      verification: "VERIFICATION PARTIAL"
    },
    mapMetrics: {
      status: "MONITOR"
    },
    systemView: {
      students: "131",
      highRisk: "2",
      verified: "72",
      funding: "$510K",
      readiness: "67",
      p1: "Incoming Students",
      p2: "Regional Watch",
      p3: "Verified Outcomes",
      p4: "Funding Tracked"
    },
    compliance: {
      verification: "Partial",
      audit: "Pending",
      docs: "1 Missing Report"
    }
  },

  PICKAWAY: {
    label: "PICKAWAY",
    title: "PICKAWAY County",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Monitor",
    statusTone: "neutral",
    interventions: "Active",
    funding: "Tracked",
    priority: "Medium",
    confidence: "70%",
    analystSummary:
      "PICKAWAY County should remain under moderate watch as intervention demand may spread southward.",
    recommendedAction: "Maintain watch",
    recommendedReason: "Southward spillover risk",
    alerts: ["Spillover risk watch"],
    priorityCases: [
      { name: "Jaden W.", status: "Attention" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "3 ATTENTION",
      verification: "VERIFICATION PARTIAL"
    },
    mapMetrics: {
      status: "MONITOR"
    },
    systemView: {
      students: "162",
      highRisk: "3",
      verified: "81",
      funding: "$570K",
      readiness: "71",
      p1: "Incoming Students",
      p2: "Spillover Watch",
      p3: "Verified Outcomes",
      p4: "Funding Tracked"
    },
    compliance: {
      verification: "Partial",
      audit: "Pending",
      docs: "1 Missing Report"
    }
  },

  KNOX: {
    label: "KNOX",
    title: "KNOX County",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Monitor",
    statusTone: "neutral",
    interventions: "Active",
    funding: "Tracked",
    priority: "High",
    confidence: "72%",
    analystSummary:
      "KNOX County is outside the primary ignition zone but remains inside the active regional perimeter. Continued monitoring is recommended to catch spillover risk early.",
    recommendedAction: "Maintain watch",
    recommendedReason: "Regional spillover risk + early intervention watch",
    alerts: ["Low engagement detected", "Regional spillover watch", "Progress monitoring active"],
    priorityCases: [
      { name: "Aaron P.", status: "Attention" },
      { name: "Leah T.", status: "Monitor" },
      { name: "Brian H.", status: "Verified" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "3 ATTENTION",
      verification: "VERIFICATION PARTIAL"
    },
    mapMetrics: {
      status: "MONITORED"
    },
    systemView: {
      students: "156",
      highRisk: "3",
      verified: "73",
      funding: "$560K",
      readiness: "71",
      p1: "Incoming Students",
      p2: "Regional Monitoring",
      p3: "Verified Outcomes",
      p4: "Funding Tracked"
    },
    compliance: {
      verification: "Partial",
      audit: "Pending",
      docs: "1 Missing Report"
    }
  },

  MARION: {
    label: "MARION",
    title: "MARION County",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Monitor",
    statusTone: "neutral",
    interventions: "Standby",
    funding: "Tracked",
    priority: "Medium",
    confidence: "67%",
    analystSummary:
      "MARION County remains in the secondary response band. Current posture is standby with light monitoring for upward case movement.",
    recommendedAction: "Hold in standby",
    recommendedReason: "Secondary band oversight",
    alerts: ["Secondary band watch", "Standby support posture"],
    priorityCases: [
      { name: "Nina C.", status: "Monitor" },
      { name: "Jordan W.", status: "Attention" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "2 ATTENTION",
      verification: "VERIFICATION PARTIAL"
    },
    mapMetrics: {
      status: "MONITOR"
    },
    systemView: {
      students: "138",
      highRisk: "2",
      verified: "69",
      funding: "$500K",
      readiness: "66",
      p1: "Incoming Students",
      p2: "Standby Monitoring",
      p3: "Verified Outcomes",
      p4: "Funding Tracked"
    },
    compliance: {
      verification: "Partial",
      audit: "Pending",
      docs: "1 Missing Report"
    }
  },

  MORROW: {
    label: "MORROW",
    title: "MORROW County",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Monitor",
    statusTone: "neutral",
    interventions: "Standby",
    funding: "Tracked",
    priority: "Medium",
    confidence: "65%",
    analystSummary:
      "MORROW County is stable but visible on the board due to proximity to the active region and possible demand spread.",
    recommendedAction: "Maintain visibility",
    recommendedReason: "Proximity to active region",
    alerts: ["Regional proximity watch"],
    priorityCases: [
      { name: "Caleb S.", status: "Monitor" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "2 ATTENTION",
      verification: "VERIFICATION PARTIAL"
    },
    mapMetrics: {
      status: "MONITOR"
    },
    systemView: {
      students: "121",
      highRisk: "2",
      verified: "61",
      funding: "$470K",
      readiness: "64",
      p1: "Incoming Students",
      p2: "Regional Watch",
      p3: "Verified Outcomes",
      p4: "Funding Tracked"
    },
    compliance: {
      verification: "Partial",
      audit: "Pending",
      docs: "1 Missing Report"
    }
  },

  PERRY: {
    label: "PERRY",
    title: "PERRY County",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Monitor",
    statusTone: "neutral",
    interventions: "Active",
    funding: "Tracked",
    priority: "Medium",
    confidence: "69%",
    analystSummary:
      "PERRY County should remain under moderate watch as regional case load may begin to influence intervention demand.",
    recommendedAction: "Maintain watch",
    recommendedReason: "Regional case spread watch",
    alerts: ["Regional case spread watch", "Intervention demand watch"],
    priorityCases: [
      { name: "Alyssa D.", status: "Attention" },
      { name: "Mason K.", status: "Monitor" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "3 ATTENTION",
      verification: "VERIFICATION PARTIAL"
    },
    mapMetrics: {
      status: "MONITOR"
    },
    systemView: {
      students: "147",
      highRisk: "3",
      verified: "68",
      funding: "$520K",
      readiness: "68",
      p1: "Incoming Students",
      p2: "Active Monitoring",
      p3: "Verified Outcomes",
      p4: "Funding Tracked"
    },
    compliance: {
      verification: "Partial",
      audit: "Pending",
      docs: "1 Missing Report"
    }
  },

  HOCKING: {
    label: "HOCKING",
    title: "HOCKING County",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Monitor",
    statusTone: "neutral",
    interventions: "Standby",
    funding: "Tracked",
    priority: "Medium",
    confidence: "63%",
    analystSummary:
      "HOCKING County remains below the current center of activity, but should stay on the board as a low-volume watch zone.",
    recommendedAction: "Hold in standby",
    recommendedReason: "Low-volume watch zone",
    alerts: ["Low-volume watch", "Standby support posture"],
    priorityCases: [
      { name: "Emma B.", status: "Monitor" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "1 ATTENTION",
      verification: "VERIFICATION PARTIAL"
    },
    mapMetrics: {
      status: "MONITOR"
    },
    systemView: {
      students: "102",
      highRisk: "1",
      verified: "54",
      funding: "$410K",
      readiness: "61",
      p1: "Incoming Students",
      p2: "Standby Monitoring",
      p3: "Verified Outcomes",
      p4: "Funding Tracked"
    },
    compliance: {
      verification: "Partial",
      audit: "Pending",
      docs: "1 Missing Report"
    }
  },

  ROSS: {
    label: "ROSS",
    title: "ROSS County",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Monitor",
    statusTone: "neutral",
    interventions: "Active",
    funding: "Tracked",
    priority: "Medium",
    confidence: "70%",
    analystSummary:
      "ROSS County remains in the southern outer band and should be monitored for downstream intervention pressure.",
    recommendedAction: "Maintain watch",
    recommendedReason: "Downstream intervention pressure watch",
    alerts: ["Southern band watch", "Intervention pressure monitoring"],
    priorityCases: [
      { name: "Isaiah F.", status: "Attention" },
      { name: "Lily M.", status: "Monitor" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "3 ATTENTION",
      verification: "VERIFICATION PARTIAL"
    },
    mapMetrics: {
      status: "MONITOR"
    },
    systemView: {
      students: "166",
      highRisk: "3",
      verified: "74",
      funding: "$590K",
      readiness: "70",
      p1: "Incoming Students",
      p2: "Regional Watch",
      p3: "Verified Outcomes",
      p4: "Funding Tracked"
    },
    compliance: {
      verification: "Partial",
      audit: "Pending",
      docs: "1 Missing Report"
    }
  },

  CLARK: {
    label: "CLARK",
    title: "CLARK County",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Monitor",
    statusTone: "neutral",
    interventions: "Standby",
    funding: "Tracked",
    priority: "Medium",
    confidence: "66%",
    analystSummary:
      "CLARK County is in the western perimeter and remains visible as a standby support zone.",
    recommendedAction: "Maintain visibility",
    recommendedReason: "Western perimeter support zone",
    alerts: ["Western perimeter watch", "Standby support posture"],
    priorityCases: [
      { name: "Nathan R.", status: "Monitor" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "2 ATTENTION",
      verification: "VERIFICATION PARTIAL"
    },
    mapMetrics: {
      status: "MONITOR"
    },
    systemView: {
      students: "133",
      highRisk: "2",
      verified: "63",
      funding: "$495K",
      readiness: "65",
      p1: "Incoming Students",
      p2: "Standby Monitoring",
      p3: "Verified Outcomes",
      p4: "Funding Tracked"
    },
    compliance: {
      verification: "Partial",
      audit: "Pending",
      docs: "1 Missing Report"
    }
  },

  CHAMPAIGN: {
    label: "CHAMPAIGN",
    title: "CHAMPAIGN County",
    subtitle: "Ohio Tactical County View",
    riskStatus: "Monitor",
    statusTone: "neutral",
    interventions: "Standby",
    funding: "Tracked",
    priority: "Medium",
    confidence: "64%",
    analystSummary:
      "CHAMPAIGN County remains in the northwestern outer band and should stay visible for low-volume monitoring.",
    recommendedAction: "Hold in standby",
    recommendedReason: "Northwestern outer band watch",
    alerts: ["Outer band monitoring"],
    priorityCases: [
      { name: "Grace L.", status: "Monitor" }
    ],
    statusStrip: {
      system: "SYSTEM ACTIVE",
      risk: "1 ATTENTION",
      verification: "VERIFICATION PARTIAL"
    },
    mapMetrics: {
      status: "MONITOR"
    },
    systemView: {
      students: "108",
      highRisk: "1",
      verified: "52",
      funding: "$420K",
      readiness: "62",
      p1: "Incoming Students",
      p2: "Outer Band Monitoring",
      p3: "Verified Outcomes",
      p4: "Funding Tracked"
    },
    compliance: {
      verification: "Partial",
      audit: "Pending",
      docs: "1 Missing Report"
    }
  }
};

export function getCountyProfile(countyName) {
  const key = String(countyName || "").trim().toUpperCase();
  return COUNTY_PROFILES[key] || {
    ...COUNTY_PROFILES.__default,
    label: key || COUNTY_PROFILES.__default.label,
    title: key ? `${key} County` : COUNTY_PROFILES.__default.title
  };
}
