export interface ReportingTraceQueryInput {
  sourceObjectId?: string;
  bridgeTraceId?: string;
  canonicalEntityId?: string;
  verificationRecordId?: string;
  reportArtifactId?: string;
  lineageId?: string;
  oracleTraceId?: string;
  trustEnvelopeTraceId?: string;
}

export interface ReportingTraceQueryMap {
  sourceQuery: string;
  bridgeQuery: string;
  verificationQuery: string;
  reportQuery: string;
  oracleQuery: string;
  trustEnvelopeQuery: string;
}

function encodeQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });

  const text = search.toString();
  return text ? `?${text}` : "";
}

export function buildReportingTraceQueryMap(
  input: ReportingTraceQueryInput
): ReportingTraceQueryMap {
  return {
    sourceQuery: encodeQuery({ source: input.sourceObjectId }),
    bridgeQuery: encodeQuery({ bridge: input.bridgeTraceId }),
    verificationQuery: encodeQuery({ verification: input.verificationRecordId }),
    reportQuery: encodeQuery({ artifact: input.reportArtifactId }),
    oracleQuery: encodeQuery({
      entity: input.canonicalEntityId,
      oracleTrace: input.oracleTraceId,
    }),
    trustEnvelopeQuery: encodeQuery({
      entity: input.canonicalEntityId,
      trustEnvelope: input.trustEnvelopeTraceId,
    }),
  };
}
