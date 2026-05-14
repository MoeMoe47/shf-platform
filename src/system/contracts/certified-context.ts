import type {
  CertifiedContext,
  GeographySignalEntity,
  OutcomeEntity,
  OrganizationEntity,
  PartnerEntity,
  ReferralEntity,
  ReportArtifactEntity,
  TrustEnvelope,
  UnmetNeedEntity,
  VerificationRecordEntity,
} from "./canonical-model";

export interface CertifiedContextSelection {
  county?: string;
  region?: string;
  organizationId?: string;
  partnerId?: string;
  referralId?: string;
  unmetNeedId?: string;
  outcomeId?: string;
  reportId?: string;
  programId?: string;
}

export interface CertifiedContextState extends CertifiedContext {
  selection: CertifiedContextSelection;
  activeEntityType?:
    | "organization"
    | "partner"
    | "referral"
    | "unmet_need"
    | "outcome"
    | "report"
    | "county"
    | "region"
    | "program";
  activeEntityId?: string;
  changeSummary?: string;
  lastAction?: string;
  lastActionAt?: string;
  isLoading?: boolean;
  isStale?: boolean;
}

export interface CertifiedContextPayload {
  state: CertifiedContextState;
  organizations?: OrganizationEntity[];
  partners?: PartnerEntity[];
  referrals?: ReferralEntity[];
  unmetNeeds?: UnmetNeedEntity[];
  outcomes?: OutcomeEntity[];
  verificationRecords?: VerificationRecordEntity[];
  geographySignals?: GeographySignalEntity[];
  reports?: ReportArtifactEntity[];
  trust?: TrustEnvelope;
}

export const DEFAULT_CERTIFIED_CONTEXT_STATE: CertifiedContextState = {
  activeSurface: "exchange",
  publicationMode: "operator",
  selection: {},
  analystAudience: "operator",
  simulationMode: "off",
  activeEntityType: undefined,
  activeEntityId: undefined,
  changeSummary: "",
  lastAction: "",
  lastActionAt: "",
  isLoading: false,
  isStale: false,
  trust: {
    verificationState: "pending",
    confidenceLevel: "medium",
    confidenceScore: 50,
    freshnessLabel: "unknown",
    sourceCount: 0,
    sourceIds: [],
    publicationMode: "operator",
  },
};

export function createCertifiedContextPayload(
  partial: Partial<CertifiedContextPayload> = {}
): CertifiedContextPayload {
  return {
    state: {
      ...DEFAULT_CERTIFIED_CONTEXT_STATE,
      ...(partial.state || {}),
      selection: {
        ...DEFAULT_CERTIFIED_CONTEXT_STATE.selection,
        ...(partial.state?.selection || {}),
      },
      trust: {
        ...DEFAULT_CERTIFIED_CONTEXT_STATE.trust!,
        ...(partial.state?.trust || {}),
      },
    },
    organizations: partial.organizations || [],
    partners: partial.partners || [],
    referrals: partial.referrals || [],
    unmetNeeds: partial.unmetNeeds || [],
    outcomes: partial.outcomes || [],
    verificationRecords: partial.verificationRecords || [],
    geographySignals: partial.geographySignals || [],
    reports: partial.reports || [],
    trust: partial.trust || partial.state?.trust || DEFAULT_CERTIFIED_CONTEXT_STATE.trust,
  };
}
