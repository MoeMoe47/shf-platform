import { createCriticalStateRepository } from "./criticalStateRepositoryFactory";

export const orchestratorRepository = createCriticalStateRepository({
  repository: "orchestrator",
  entityType: "orchestration_record",
  idField: "orchestration_request_id",
});

export default orchestratorRepository;
