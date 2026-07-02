import { createPersistenceRepository } from "../repositoryFactory";

export const orchestratorRepository = createPersistenceRepository({
  repository: "orchestrator",
  entityType: "orchestration_record",
  idField: "orchestration_request_id",
});

export default orchestratorRepository;

