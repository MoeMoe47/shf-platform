export interface ReportingTraceQueryInput {
  sourceObjectId?: string;
  bridgeTraceId?: string;
  verificationRecordId?: string;
  reportArtifactId?: string;
}

export interface ReportingTraceQueryMap {
  sourceQuery: string;
  bridgeQuery: string;
  verificationQuery: string;
  reportQuery: string;
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
  };
}
