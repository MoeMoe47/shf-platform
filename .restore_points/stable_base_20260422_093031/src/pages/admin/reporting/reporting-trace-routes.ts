import { buildReportingTraceQueryMap } from "./reporting-trace-query";

export type ReportingTraceRouteKind =
  | "source_object"
  | "bridge_trace"
  | "verification_record"
  | "report_artifact";

export interface ReportingTraceRouteInput {
  routeKind: ReportingTraceRouteKind;
  targetId: string;
  query?: string;
}

export interface ReportingTraceRouteResult {
  routeKind: ReportingTraceRouteKind;
  targetId: string;
  href: string;
  label: string;
}

export function resolveReportingTraceRoute(
  input: ReportingTraceRouteInput
): ReportingTraceRouteResult {
  const suffix = input.query || "";

  switch (input.routeKind) {
    case "source_object":
      return {
        routeKind: "source_object",
        targetId: input.targetId,
        href: `/admin.html#/hub${suffix}`,
        label: `Open source object ${input.targetId}`,
      };

    case "bridge_trace":
      return {
        routeKind: "bridge_trace",
        targetId: input.targetId,
        href: `/admin.html#/aggregation${suffix}`,
        label: `Open bridge trace ${input.targetId}`,
      };

    case "verification_record":
      return {
        routeKind: "verification_record",
        targetId: input.targetId,
        href: `/admin.html#/verification-audit${suffix}`,
        label: `Open verification record ${input.targetId}`,
      };

    case "report_artifact":
      return {
        routeKind: "report_artifact",
        targetId: input.targetId,
        href: `/admin.html#/reporting${suffix}`,
        label: `Open report artifact ${input.targetId}`,
      };

    default:
      return {
        routeKind: input.routeKind,
        targetId: input.targetId,
        href: `/admin.html#/reporting${suffix}`,
        label: `Open ${input.targetId}`,
      };
  }
}

export function buildReportingTraceRouteMap(traceTargets: {
  sourceObjectId: string;
  bridgeTraceId: string;
  verificationRecordId: string;
  reportArtifactId: string;
}) {
  const queries = buildReportingTraceQueryMap({
    sourceObjectId: traceTargets.sourceObjectId,
    bridgeTraceId: traceTargets.bridgeTraceId,
    verificationRecordId: traceTargets.verificationRecordId,
    reportArtifactId: traceTargets.reportArtifactId,
  });

  return {
    sourceObject: resolveReportingTraceRoute({
      routeKind: "source_object",
      targetId: traceTargets.sourceObjectId,
      query: queries.sourceQuery,
    }),
    bridgeTrace: resolveReportingTraceRoute({
      routeKind: "bridge_trace",
      targetId: traceTargets.bridgeTraceId,
      query: queries.bridgeQuery,
    }),
    verificationRecord: resolveReportingTraceRoute({
      routeKind: "verification_record",
      targetId: traceTargets.verificationRecordId,
      query: queries.verificationQuery,
    }),
    reportArtifact: resolveReportingTraceRoute({
      routeKind: "report_artifact",
      targetId: traceTargets.reportArtifactId,
      query: queries.reportQuery,
    }),
  };
}
