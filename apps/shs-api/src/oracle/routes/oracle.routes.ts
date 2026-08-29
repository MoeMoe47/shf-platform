import { requirePermission } from "../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../auth/security-permissions.js";
import {
  getOracleTruth,
  compareOracleEntities,
  getOraclePriorityQueue,
  postOracleAction,
  getOracleActions,
} from "../controllers/oracle.controller.js";

export function registerOracleRoutes(app: any) {
  app.get(
    "/oracle/truth/:entityId",
    requirePermission(SHS_SECURITY_PERMISSIONS.ORACLE_VIEW),
    getOracleTruth
  );

  app.get(
    "/oracle/compare",
    requirePermission(SHS_SECURITY_PERMISSIONS.ORACLE_COMPARE),
    compareOracleEntities
  );

  app.get(
    "/oracle/priority",
    requirePermission(SHS_SECURITY_PERMISSIONS.ORACLE_PRIORITY),
    getOraclePriorityQueue
  );

  app.post(
    "/oracle/action",
    requirePermission(SHS_SECURITY_PERMISSIONS.ORACLE_ACTION),
    postOracleAction
  );

  app.get(
    "/oracle/actions",
    requirePermission(SHS_SECURITY_PERMISSIONS.ORACLE_VIEW),
    getOracleActions
  );
}
