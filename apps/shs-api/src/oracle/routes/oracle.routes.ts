import {
  getOracleTruth,
  compareOracleEntities,
  getOraclePriorityQueue,
  postOracleAction,
  getOracleActions,
} from "../controllers/oracle.controller";

export function registerOracleRoutes(app: any) {
  app.get("/oracle/truth/:entityId", getOracleTruth);
  app.get("/oracle/compare", compareOracleEntities);
  app.get("/oracle/priority", getOraclePriorityQueue);
  app.post("/oracle/action", postOracleAction);
  app.get("/oracle/actions", getOracleActions);
}
