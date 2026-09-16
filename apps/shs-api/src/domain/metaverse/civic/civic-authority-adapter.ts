import {
  CIVIC_AUTHORITY_REUSE,
  CIVIC_NEUTRALITY_RULES,
  SHF_CIVIC_AUTHORITY,
} from "../../shf-civic/model/civic-contract.js";
import { SHF_CIVIC_INTEGRATION_POLICY, SHF_CIVIC_PERSISTENCE_POLICY } from "../../shf-civic/service/shf-civic-service.js";
import { durableShfCivicService } from "../../shf-civic/service/durable-shf-civic-service.js";

export const METAVERSE_CIVIC_AUTHORITY_ADAPTER = {
  sourceAuthority: "SHF_CIVIC",
  civicSureAuthority: false,
  metaverseOwnsElectionTruth: false,
  cityLevelEducationalOnly: true,
  neutralProcedureOnly: true,
} as const;

export async function buildMetaverseCivicProjection(actor: any, civicService = durableShfCivicService) {
  const hall = await civicService.hall(actor);
  const publicProjection = await civicService.publicProjection(actor);
  const eligibility = hall.myCivicStatus.eligibility;
  return {
    projectionVersion: "MET-14",
    authority: SHF_CIVIC_AUTHORITY,
    adapter: METAVERSE_CIVIC_AUTHORITY_ADAPTER,
    authorityReuse: CIVIC_AUTHORITY_REUSE,
    neutralityRules: CIVIC_NEUTRALITY_RULES,
    persistencePolicy: SHF_CIVIC_PERSISTENCE_POLICY,
    integrationPolicy: SHF_CIVIC_INTEGRATION_POLICY,
    civicHall: hall,
    myCivicStatus: {
      coursePrerequisite: hall.myCivicStatus.course,
      representation: hall.myCivicStatus.representation,
      eligibility,
    },
    offices: publicProjection.offices,
    elections: publicProjection.elections,
    approvedCandidateProfiles: publicProjection.candidacies.filter((candidate) => candidate.status === "APPROVED"),
    council: publicProjection.council,
    proposals: publicProjection.proposals,
    publicComments: publicProjection.publicComments,
    cityProjects: publicProjection.cityProjects,
    cityOperations: publicProjection.cityOperations,
    civicMissions: [
      { actionType: "COMPLETE_CIVIC_COURSE", source: "SHF_CIVIC_COURSE_POLICY", route: "/civic.html#/lessons" },
      { actionType: "FILE_CANDIDACY", source: "SHF_CIVIC_CANDIDACY", route: "/metaverse?panel=civic" },
      { actionType: "CAST_STUDENT_BALLOT", source: "SHF_CIVIC_ELECTION", route: "/metaverse?panel=civic" },
      { actionType: "ATTEND_COUNCIL_SESSION", source: "SHF_CIVIC_COUNCIL", route: "/metaverse?panel=civic" },
      { actionType: "SUBMIT_CITY_PROPOSAL", source: "SHF_CIVIC_PROPOSAL", route: "/metaverse?panel=civic" },
      { actionType: "COMPLETE_CIVIC_MISSION", source: "MET-7_CIVIC_MISSION", route: "/metaverse?panel=missions" },
    ],
    publicSafeView: {
      exposesIndividualVoteChoice: false,
      exposesPrivateContactInfo: false,
      exposesPrivateEligibilityReasons: false,
      resultsAreAggregateOnly: true,
    },
    dataCenterConnection: {
      simulationId: "civic-budget-tradeoff-simulation",
      topics: ["sustainability tradeoffs", "energy use", "cooling infrastructure", "workforce programming", "community impact"],
      civicVoteOverridesTechnicalAuthority: false,
    },
    learningArcadeBoundary: SHF_CIVIC_INTEGRATION_POLICY.arcadeBoundary,
    workPassportBoundary: SHF_CIVIC_INTEGRATION_POLICY.workPassportBoundary,
    communicationBoundary: SHF_CIVIC_INTEGRATION_POLICY.communicationBoundary,
  };
}
